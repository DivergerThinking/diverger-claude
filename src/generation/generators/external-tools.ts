import type { ComposedConfig, ExternalToolConfig, GeneratedFile } from '../../core/types.js';
import path from 'path';
import { readJsonOrNull } from '../../utils/fs.js';
import { deepmerge } from 'deepmerge-ts';

/** Generate external tool configuration files (ESLint, Prettier, tsconfig) */
export async function generateExternalTools(
  config: ComposedConfig,
  projectRoot: string,
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  for (const tool of config.externalTools) {
    const file = await generateToolConfig(tool, projectRoot);
    if (file) files.push(file);
  }

  return files;
}

async function generateToolConfig(
  tool: ExternalToolConfig,
  projectRoot: string,
): Promise<GeneratedFile | null> {
  const filePath = path.join(projectRoot, tool.filePath);

  switch (tool.mergeStrategy) {
    case 'create-only': {
      // Only generate if file doesn't exist
      const existing = await readJsonOrNull(filePath);
      if (existing !== null) return null;
      return {
        path: filePath,
        content: JSON.stringify(tool.config, null, 2) + '\n',
      };
    }

    case 'align': {
      // Merge with existing config (existing values take precedence for user customizations)
      const existing = await readJsonOrNull<Record<string, unknown>>(filePath);
      if (existing === null) {
        return {
          path: filePath,
          content: JSON.stringify(tool.config, null, 2) + '\n',
        };
      }
      // Deep merge: tool defaults as base, existing user config on top
      const merged = deepmerge(tool.config, existing);
      return {
        path: filePath,
        content: JSON.stringify(merged, null, 2) + '\n',
      };
    }

    case 'overwrite': {
      return {
        path: filePath,
        content: JSON.stringify(tool.config, null, 2) + '\n',
      };
    }
  }
}
