import type { ComposedConfig, DiffEntry, GeneratedFile, GenerationResult } from '../core/types.js';
import { generateClaudeMd } from './generators/claude-md.js';
import { generateSettings } from './generators/settings.js';
import { generateRules } from './generators/rules.js';
import { generateAgents } from './generators/agents.js';
import { generateSkills } from './generators/skills.js';
import { generateHooks } from './generators/hooks.js';
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
  async generate(config: ComposedConfig, projectRoot: string): Promise<GenerationResult> {
    const files = await this.generateFiles(config, projectRoot);

    return {
      files,
      detection: undefined as never, // Set by caller
      config,
    };
  }

  /** Generate all file definitions without writing to disk */
  async generateFiles(config: ComposedConfig, projectRoot: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // 1. CLAUDE.md
    files.push(generateClaudeMd(config, projectRoot));

    // 2. settings.json
    files.push(generateSettings(config, projectRoot));

    // 3. Rules
    files.push(...generateRules(config, projectRoot));

    // 4. Agents
    files.push(...generateAgents(config, projectRoot));

    // 5. Skills
    files.push(...generateSkills(config, projectRoot));

    // 6. Hooks
    const hooksFile = generateHooks(config, projectRoot);
    if (hooksFile) files.push(hooksFile);

    // 7. MCP
    const mcpFile = generateMcp(config, projectRoot);
    if (mcpFile) files.push(mcpFile);

    // 8. Security
    const security = generateSecurityConfig(config, projectRoot);
    files.push(...security.rules);

    // 9. External tools
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
