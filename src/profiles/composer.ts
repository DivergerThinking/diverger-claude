import type {
  AgentDefinition,
  ClaudeSettings,
  ComposedConfig,
  DetectedTechnology,
  DetectionResult,
  ExternalToolConfig,
  Profile,
  VersionConstraint,
} from '../core/types.js';
import { CompositionError } from '../core/errors.js';
import { deepmerge } from 'deepmerge-ts';
import { buildTemplateContext } from './template-context.js';
import { interpolateTemplate } from './template-interpolation.js';

/**
 * Composes multiple profiles into a single unified configuration.
 * Profiles are processed in layer order (0 → 10 → 20 → 30 → 40).
 */
export class ProfileComposer {
  /** Compose profiles matching the detection result */
  compose(profiles: Profile[], detection: DetectionResult): ComposedConfig {
    // Resolve which profiles apply based on detected technologies
    const applicable = this.resolveApplicable(profiles, detection);

    // Sort by layer priority
    applicable.sort((a, b) => a.layer - b.layer);

    // Build the composed config
    const config: ComposedConfig = {
      claudeMdSections: [],
      settings: { permissions: {} },
      rules: [],
      agents: [],
      skills: [],
      hooks: [],
      hookScripts: [],
      mcp: [],
      externalTools: [],
      appliedProfiles: [],
    };

    for (const profile of applicable) {
      this.applyProfile(config, profile);
      config.appliedProfiles.push(profile.id);
    }

    // Compose agents from contributions
    config.agents = this.composeAgents(applicable);

    // Merge external tool configs (e.g. multiple ESLint configs → single file)
    config.externalTools = this.mergeExternalToolConfigs(config.externalTools);

    // Interpolate technology-adaptive template tokens
    this.interpolateConfig(config, detection);

    // Validate no conflicts
    this.validate(config);

    return config;
  }

  /** Resolve which profiles should be applied */
  private resolveApplicable(
    profiles: Profile[],
    detection: DetectionResult,
  ): Profile[] {
    const detectedProfileIds = new Set(
      detection.technologies.flatMap((t) => t.profileIds),
    );
    const detectedTechIds = new Set(
      detection.technologies.map((t) => t.id),
    );

    const applicable = profiles.filter((p) => {
      // Base profiles always apply
      if (p.layer === 0) return true;
      // Match by profile ID being referenced by a detected technology
      if (detectedProfileIds.has(p.id)) return true;
      // Match by profile's technology IDs matching detected technology IDs
      if (p.technologyIds.some((tid) => detectedTechIds.has(tid))) return true;
      return false;
    });

    // Check dependencies
    const applicableIds = new Set(applicable.map((p) => p.id));
    const withDeps = applicable.filter((p) => {
      if (!p.dependsOn || p.dependsOn.length === 0) return true;
      return p.dependsOn.every((dep) => applicableIds.has(dep));
    });

    // Check version constraints
    return withDeps.filter((p) => {
      if (!p.versionConstraints) return true;
      const tech = detection.technologies.find((t) =>
        p.technologyIds.includes(t.id),
      );
      if (!tech) return true; // No matching tech, no constraint to check
      return this.satisfiesVersionConstraint(tech, p.versionConstraints);
    });
  }

  /** Check if a technology satisfies a profile's version constraints */
  private satisfiesVersionConstraint(
    tech: DetectedTechnology,
    constraint: VersionConstraint,
  ): boolean {
    // Version string exists but major version couldn't be parsed (e.g. "workspace:*", "latest")
    // → exclude, since the constraint cannot be verified
    if (tech.version && !tech.majorVersion) return false;
    // No version detected at all → include (no constraint to check against)
    if (!tech.majorVersion) return true;
    // Standard range check
    const { min, max } = constraint;
    if (min !== undefined && tech.majorVersion < min) return false;
    if (max !== undefined && tech.majorVersion > max) return false;
    return true;
  }

  /** Apply a single profile's contributions to the composed config */
  private applyProfile(config: ComposedConfig, profile: Profile): void {
    const c = profile.contributions;

    if (c.claudeMd) {
      config.claudeMdSections.push(...c.claudeMd);
    }

    if (c.settings) {
      config.settings = this.mergeSettings(config.settings, c.settings);
    }

    if (c.rules) {
      config.rules.push(...c.rules);
    }

    if (c.skills) {
      config.skills.push(...c.skills);
    }

    if (c.hooks) {
      config.hooks.push(...c.hooks);
    }

    if (c.hookScripts) {
      config.hookScripts.push(...c.hookScripts);
    }

    if (c.mcp) {
      config.mcp.push(...c.mcp);
    }

    if (c.externalTools) {
      config.externalTools.push(...c.externalTools);
    }
  }

  /** Deep merge settings, concatenating permission arrays */
  private mergeSettings(
    base: ClaudeSettings,
    overlay: Partial<ClaudeSettings>,
  ): ClaudeSettings {
    const merged = deepmerge(base, overlay) as ClaudeSettings;

    // Ensure arrays are concatenated, not replaced
    if (base.permissions?.allow && overlay.permissions?.allow) {
      merged.permissions.allow = [
        ...new Set([...base.permissions.allow, ...overlay.permissions.allow]),
      ];
    }
    if (base.permissions?.deny && overlay.permissions?.deny) {
      merged.permissions.deny = [
        ...new Set([...base.permissions.deny, ...overlay.permissions.deny]),
      ];
    }

    return merged;
  }

  /** Compose agent definitions from all profile contributions */
  private composeAgents(profiles: Profile[]): AgentDefinition[] {
    const agentMap = new Map<string, {
      prompt: string[];
      skills: Set<string>;
      model?: string;
      description: string;
      tools?: string[];
      memory?: 'project';
    }>();

    for (const profile of profiles) {
      const agents = profile.contributions.agents ?? [];
      for (const agent of agents) {
        const existing = agentMap.get(agent.name);

        if (agent.type === 'define' && !existing) {
          agentMap.set(agent.name, {
            prompt: agent.prompt ? [agent.prompt] : [],
            skills: new Set(agent.skills ?? []),
            model: agent.model,
            description: agent.description ?? '',
            tools: agent.tools,
            memory: agent.memory,
          });
        } else if (agent.type === 'enrich' && existing) {
          if (agent.prompt) existing.prompt.push(agent.prompt);
          if (agent.skills) {
            for (const s of agent.skills) existing.skills.add(s);
          }
          if (agent.model) existing.model = agent.model; // Later layer wins
          if (agent.tools) existing.tools = agent.tools; // Later layer wins
          if (agent.memory) existing.memory = agent.memory;
        } else if (agent.type === 'define' && existing) {
          // Multiple definitions: merge them
          if (agent.prompt) existing.prompt.push(agent.prompt);
          if (agent.skills) {
            for (const s of agent.skills) existing.skills.add(s);
          }
          if (agent.model) existing.model = agent.model;
          if (agent.description) existing.description = agent.description;
          if (agent.tools) existing.tools = agent.tools;
          if (agent.memory) existing.memory = agent.memory;
        } else if (agent.type === 'enrich' && !existing) {
          // Enriching non-existent agent: create it
          agentMap.set(agent.name, {
            prompt: agent.prompt ? [agent.prompt] : [],
            skills: new Set(agent.skills ?? []),
            model: agent.model,
            description: agent.description ?? '',
            tools: agent.tools,
            memory: agent.memory,
          });
        }
      }
    }

    return [...agentMap.entries()].map(([name, data]) => ({
      name,
      prompt: data.prompt.join('\n\n'),
      skills: [...data.skills],
      model: data.model,
      description: data.description,
      tools: data.tools,
      memory: data.memory,
    }));
  }

  /** Merge external tool configs that target the same tool type (e.g. multiple ESLint configs) */
  private mergeExternalToolConfigs(tools: ExternalToolConfig[]): ExternalToolConfig[] {
    const eslintConfigs = tools.filter((t) => t.type === 'eslint');
    const nonEslint = tools.filter((t) => t.type !== 'eslint');

    if (eslintConfigs.length <= 1) return tools;

    // Deep-merge all ESLint configs into one targeting eslint.config.js (flat config)
    const merged: ExternalToolConfig = {
      type: 'eslint',
      filePath: 'eslint.config.js',
      mergeStrategy: 'create-only',
      config: {},
    };

    const allExtends: string[] = [];
    const allPlugins: string[] = [];
    let mergedRules: Record<string, unknown> = {};
    let mergedSettings: Record<string, unknown> = {};

    for (const eslint of eslintConfigs) {
      const cfg = eslint.config;
      if (Array.isArray(cfg.extends)) {
        allExtends.push(...(cfg.extends as string[]));
      }
      if (Array.isArray(cfg.plugins)) {
        allPlugins.push(...(cfg.plugins as string[]));
      }
      if (cfg.rules && typeof cfg.rules === 'object') {
        mergedRules = { ...mergedRules, ...(cfg.rules as Record<string, unknown>) };
      }
      if (cfg.settings && typeof cfg.settings === 'object') {
        mergedSettings = deepmerge(mergedSettings, cfg.settings as Record<string, unknown>) as Record<string, unknown>;
      }
      // Carry forward any other keys from each config
      for (const [key, value] of Object.entries(cfg)) {
        if (!['extends', 'plugins', 'rules', 'settings'].includes(key) && !(key in merged.config)) {
          merged.config[key] = value;
        }
      }
    }

    merged.config.extends = [...new Set(allExtends)];
    if (allPlugins.length > 0) {
      merged.config.plugins = [...new Set(allPlugins)];
    }
    if (Object.keys(mergedRules).length > 0) {
      merged.config.rules = mergedRules;
    }
    if (Object.keys(mergedSettings).length > 0) {
      merged.config.settings = mergedSettings;
    }

    return [...nonEslint, merged];
  }

  /** Apply template interpolation to all string content in the config */
  private interpolateConfig(config: ComposedConfig, detection: DetectionResult): void {
    const ctx = buildTemplateContext(detection);

    for (const section of config.claudeMdSections) {
      section.content = interpolateTemplate(section.content, ctx);
    }
    for (const rule of config.rules) {
      rule.content = interpolateTemplate(rule.content, ctx);
    }
    for (const skill of config.skills) {
      skill.content = interpolateTemplate(skill.content, ctx);
    }
    for (const agent of config.agents) {
      agent.prompt = interpolateTemplate(agent.prompt, ctx);
    }
  }

  /** Validate the composed config for conflicts */
  private validate(config: ComposedConfig): void {
    // Check for permission conflicts (same pattern in both allow and deny)
    const allow = new Set(config.settings.permissions?.allow ?? []);
    const deny = new Set(config.settings.permissions?.deny ?? []);
    for (const pattern of allow) {
      if (deny.has(pattern)) {
        throw new CompositionError(
          `Conflicto de permisos: "${pattern}" está tanto en allow como en deny`,
        );
      }
    }

    // Check for duplicate rule paths
    const rulePaths = config.rules.map((r) => r.path);
    const dups = rulePaths.filter((p, i) => rulePaths.indexOf(p) !== i);
    if (dups.length > 0) {
      throw new CompositionError(
        `Rutas de reglas duplicadas: ${dups.join(', ')}`,
      );
    }
  }
}
