import type { ComposedConfig, DetectionResult, DiffEntry, GeneratedFile, GenerationResult } from '../core/types.js';
import { generateClaudeMd } from './generators/claude-md.js';
import { generateSettings } from './generators/settings.js';
import { generateRules } from './generators/rules.js';
import { generateAgents } from './generators/agents.js';
import { generateSkills } from './generators/skills.js';
import { generateMcp } from './generators/mcp.js';
import { generateSecurityConfig } from './generators/security.js';
import { generateExternalTools } from './generators/external-tools.js';
import { generateHookScripts } from './generators/hook-scripts.js';
import { validateHookConsistency } from './generators/hooks.js';
import { generateReactNativeTemplate } from './templates/react-native-template.js';
import { generateExpoTemplate } from './templates/expo-template.js';
import { generateFlutterTemplate } from './templates/flutter-template.js';
import { generateSwiftUITemplate } from './templates/swiftui-template.js';
import { filterUniversalComponents } from './plugin-filter.js';
import { extractProjectMetadata } from './project-metadata.js';
import { FileWriter } from './file-writer.js';
import { DiffEngine } from './diff-engine.js';
import { existsSync } from 'node:fs';

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
  async generate(
    config: ComposedConfig,
    projectRoot: string,
    detection: DetectionResult,
    onProgress?: (message: string) => void,
    pluginMode?: boolean,
  ): Promise<GenerationResult> {
    const files = await this.generateFiles(config, projectRoot, detection, onProgress, pluginMode);

    return {
      files,
      detection,
      config, // UNFILTERED config for metadata
    };
  }

  /** Generate all file definitions without writing to disk */
  async generateFiles(
    config: ComposedConfig,
    projectRoot: string,
    detection?: DetectionResult,
    onProgress?: (message: string) => void,
    pluginMode?: boolean,
  ): Promise<GeneratedFile[]> {
    const effectiveConfig = pluginMode ? filterUniversalComponents(config) : config;
    const files: GeneratedFile[] = [];

    // 0. Extract project metadata once, share with all generators
    const metadata = extractProjectMetadata(projectRoot, detection);

    // 1. Security (generate first, merge overlay into settings for downstream generators)
    onProgress?.('Generando reglas de seguridad...');
    const { mergedConfig, securityFiles } = this.mergeSecurityOverlay(effectiveConfig, projectRoot);
    files.push(...securityFiles);

    // 2. CLAUDE.md (with project metadata)
    onProgress?.('Generando CLAUDE.md...');
    files.push(generateClaudeMd(mergedConfig, projectRoot, detection, metadata));

    // 3. settings.json (now includes hooks and security overlay)
    onProgress?.('Generando settings.json...');
    files.push(generateSettings(mergedConfig, projectRoot));

    // 4. Rules (with project metadata for dynamic interpolation)
    onProgress?.('Generando reglas del stack...');
    files.push(...generateRules(mergedConfig, projectRoot, metadata));

    // 5. Agents (with project metadata for context injection)
    onProgress?.('Generando agentes...');
    files.push(...generateAgents(mergedConfig, projectRoot, metadata));

    // 6. Skills
    onProgress?.('Generando skills...');
    files.push(...generateSkills(mergedConfig, projectRoot));

    // 6b. Hook scripts (.claude/hooks/*.sh)
    onProgress?.('Generando hook scripts...');
    files.push(...generateHookScripts(mergedConfig, projectRoot));

    // 6c. Validate hook consistency
    const hookIssues = validateHookConsistency(mergedConfig);
    if (hookIssues.orphanScripts.length > 0) {
      onProgress?.(`⚠ Hook scripts sin entrada en settings: ${hookIssues.orphanScripts.join(', ')}`);
    }
    if (hookIssues.missingScripts.length > 0) {
      onProgress?.(`⚠ Settings referencian scripts inexistentes: ${hookIssues.missingScripts.join(', ')}`);
    }

    // 7. MCP
    onProgress?.('Generando configuración MCP...');
    const mcpFile = generateMcp(mergedConfig, projectRoot);
    if (mcpFile) files.push(mcpFile);

    // 8. External tools
    onProgress?.('Generando configs externas (ESLint, Prettier, tsconfig)...');
    const externalToolFiles = await generateExternalTools(mergedConfig, projectRoot);
    files.push(...externalToolFiles);

    // 9. Mobile configs (only when detection includes mobile technologies)
    if (detection) {
      const mobileFiles = this.generateMobileConfigs(detection, projectRoot, onProgress);
      files.push(...mobileFiles);
    }

    return files;
  }

  /** Generate security rules and merge their settings overlay into a config copy */
  private mergeSecurityOverlay(
    config: ComposedConfig,
    projectRoot: string,
  ): { mergedConfig: ComposedConfig; securityFiles: GeneratedFile[] } {
    const security = generateSecurityConfig(config, projectRoot);

    // Clone settings to avoid mutating the caller's config object
    const settings = { ...config.settings, permissions: { ...config.settings.permissions } };

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

    return {
      mergedConfig: { ...config, settings },
      securityFiles: security.rules,
    };
  }

  /** Generate mobile-specific config files based on detected technologies */
  private generateMobileConfigs(
    detection: DetectionResult,
    projectRoot: string,
    onProgress?: (msg: string) => void,
  ): GeneratedFile[] {
    const mobileIds = new Set(
      detection.technologies.filter((t) => t.category === 'mobile').map((t) => t.id),
    );

    if (mobileIds.size === 0) return [];

    const files: GeneratedFile[] = [];

    if (mobileIds.has('react-native') && !mobileIds.has('expo')) {
      onProgress?.('Generando configuracion React Native...');
      files.push(...generateReactNativeTemplate(projectRoot));
    }
    if (mobileIds.has('expo')) {
      onProgress?.('Generando configuracion Expo...');
      files.push(...generateExpoTemplate(projectRoot));
    }
    if (mobileIds.has('flutter')) {
      onProgress?.('Generando configuracion Flutter...');
      files.push(...generateFlutterTemplate(projectRoot));
    }
    if (mobileIds.has('swiftui')) {
      onProgress?.('Generando configuracion SwiftUI...');
      files.push(...generateSwiftUITemplate(projectRoot));
    }

    // Only include files that don't already exist on disk
    return files.filter((f) => !existsSync(f.path));
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
