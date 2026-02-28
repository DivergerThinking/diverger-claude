import type { ComposedConfig, DetectionResult, DiffEntry, GeneratedFile, GenerationResult } from '../core/types.js';
import { generateClaudeMd } from './generators/claude-md.js';
import { generateSettings } from './generators/settings.js';
import { generateRules } from './generators/rules.js';
import { generateAgents } from './generators/agents.js';
import { generateSkills } from './generators/skills.js';
import { generateMcp } from './generators/mcp.js';
import { generateSecurityConfig } from './generators/security.js';
import { generateExternalTools } from './generators/external-tools.js';
import { FileWriter } from './file-writer.js';
import { DiffEngine } from './diff-engine.js';

/**
 * Generation engine facade.
 * Takes a composed config and generates all output files.
 */
export class GenerationEngine {
  private fileWriter: FileWriter;
  private diffEngine: DiffEngine;

  constructor() {
    this.fileWriter = new FileWriter();
    this.diffEngine = new DiffEngine();
  }

  /** Generate all files from a composed config */
  async generate(config: ComposedConfig, projectRoot: string, detection: DetectionResult): Promise<GenerationResult> {
    const files = await this.generateFiles(config, projectRoot);

    return {
      files,
      detection,
      config,
    };
  }

  /** Generate all file definitions without writing to disk */
  async generateFiles(config: ComposedConfig, projectRoot: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Clone settings to avoid mutating the caller's config object
    const settings = { ...config.settings, permissions: { ...config.settings.permissions } };

    // 1. Security (generate first so its overlay can be merged into settings)
    const security = generateSecurityConfig(config, projectRoot);
    files.push(...security.rules);

    // Merge security settings overlay into the cloned settings
    if (security.settingsOverlay.permissions?.deny) {
      const existing = settings.permissions?.deny ?? [];
      settings.permissions = {
        ...settings.permissions,
        deny: [...new Set([...existing, ...security.settingsOverlay.permissions.deny])],
      };
    }
    if (security.settingsOverlay.sandbox) {
      settings.sandbox = {
        ...settings.sandbox,
        filesystem: {
          ...settings.sandbox?.filesystem,
          ...security.settingsOverlay.sandbox.filesystem,
          denyRead: [
            ...new Set([
              ...(settings.sandbox?.filesystem?.denyRead ?? []),
              ...(security.settingsOverlay.sandbox.filesystem?.denyRead ?? []),
            ]),
          ],
        },
      };
    }

    // Use a config copy with the merged settings for downstream generators
    const mergedConfig = { ...config, settings };

    // 2. CLAUDE.md
    files.push(generateClaudeMd(mergedConfig, projectRoot));

    // 3. settings.json (now includes hooks and security overlay)
    files.push(generateSettings(mergedConfig, projectRoot));

    // 4. Rules
    files.push(...generateRules(mergedConfig, projectRoot));

    // 5. Agents
    files.push(...generateAgents(mergedConfig, projectRoot));

    // 6. Skills
    files.push(...generateSkills(mergedConfig, projectRoot));

    // 7. MCP
    const mcpFile = generateMcp(mergedConfig, projectRoot);
    if (mcpFile) files.push(mcpFile);

    // 8. External tools
    const externalToolFiles = await generateExternalTools(mergedConfig, projectRoot);
    files.push(...externalToolFiles);

    return files;
  }

  /** Write files to disk */
  async writeFiles(
    files: GeneratedFile[],
    projectRoot: string,
    options: { force?: boolean; dryRun?: boolean } = {},
  ) {
    return this.fileWriter.writeAll(files, projectRoot, options);
  }

  /** Compute diffs for dry-run */
  async computeDiff(result: GenerationResult, _projectRoot: string): Promise<DiffEntry[]> {
    return this.diffEngine.computeDiffs(result.files);
  }
}
