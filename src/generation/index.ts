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
  async generate(config: ComposedConfig, projectRoot: string, detection?: DetectionResult): Promise<GenerationResult> {
    const files = await this.generateFiles(config, projectRoot);

    return {
      files,
      detection: detection ?? (undefined as never),
      config,
    };
  }

  /** Generate all file definitions without writing to disk */
  async generateFiles(config: ComposedConfig, projectRoot: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // 1. Security (generate first so its overlay can be merged into settings)
    const security = generateSecurityConfig(config, projectRoot);
    files.push(...security.rules);

    // Merge security settings overlay into config.settings
    if (security.settingsOverlay.permissions?.deny) {
      const existing = config.settings.permissions?.deny ?? [];
      config.settings.permissions = {
        ...config.settings.permissions,
        deny: [...new Set([...existing, ...security.settingsOverlay.permissions.deny])],
      };
    }
    if (security.settingsOverlay.sandbox) {
      config.settings.sandbox = {
        ...config.settings.sandbox,
        filesystem: {
          ...config.settings.sandbox?.filesystem,
          ...security.settingsOverlay.sandbox.filesystem,
          denyRead: [
            ...new Set([
              ...(config.settings.sandbox?.filesystem?.denyRead ?? []),
              ...(security.settingsOverlay.sandbox.filesystem?.denyRead ?? []),
            ]),
          ],
        },
      };
    }

    // 2. CLAUDE.md
    files.push(generateClaudeMd(config, projectRoot));

    // 3. settings.json (now includes hooks and security overlay)
    files.push(generateSettings(config, projectRoot));

    // 4. Rules
    files.push(...generateRules(config, projectRoot));

    // 5. Agents
    files.push(...generateAgents(config, projectRoot));

    // 6. Skills
    files.push(...generateSkills(config, projectRoot));

    // 7. MCP
    const mcpFile = generateMcp(config, projectRoot);
    if (mcpFile) files.push(mcpFile);

    // 8. External tools
    const externalToolFiles = await generateExternalTools(config, projectRoot);
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
