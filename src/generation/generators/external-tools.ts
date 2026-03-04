import type { ComposedConfig, ExternalToolConfig, GeneratedFile } from '../../core/types.js';
import path from 'path';
import { readFileOrNull, assertPathWithin } from '../../utils/fs.js';
import { deepmerge } from 'deepmerge-ts';

/** Simple YAML serializer for shallow config objects (e.g., SwiftLint, flat YAML configs) */
function configToYaml(config: Record<string, unknown>, indent = 0): string {
  const prefix = '  '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      lines.push(`${prefix}${key}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${prefix}  - ${configToYaml(item as Record<string, unknown>, indent + 2).trimStart()}`);
        } else {
          lines.push(`${prefix}  - ${String(item)}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${prefix}${key}:`);
      lines.push(configToYaml(value as Record<string, unknown>, indent + 1));
    } else if (typeof value === 'string') {
      // Quote strings that need it (contain special YAML chars)
      const needsQuote = /[:#{}[\],&*?|>!%@`]/.test(value) || value === '' || value === 'true' || value === 'false';
      lines.push(`${prefix}${key}: ${needsQuote ? `"${value}"` : value}`);
    } else {
      lines.push(`${prefix}${key}: ${String(value)}`);
    }
  }

  return lines.join('\n');
}

/** Check if a file path is a YAML file */
function isYamlFile(filePath: string): boolean {
  return filePath.endsWith('.yml') || filePath.endsWith('.yaml');
}

/** Generate ESLint flat config (eslint.config.js) from rules data */
function serializeEslintFlatConfig(config: Record<string, unknown>): string {
  const rules = config['rules'] as Record<string, unknown> | undefined;
  const rulesStr = rules
    ? JSON.stringify(rules, null, 2).replace(/\n/g, '\n      ').replace(/^/, '      ').trimStart()
    : '{}';

  return `import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: ${rulesStr},
  },
  {
    ignores: ['dist/', 'plugin/', 'node_modules/', '*.config.*'],
  },
);
`;
}

/** Serialize config to the appropriate format based on file extension */
function serializeConfig(config: Record<string, unknown>, filePath: string, toolType?: string): string {
  if (toolType === 'eslint' && filePath.endsWith('.js')) {
    return serializeEslintFlatConfig(config);
  }
  if (isYamlFile(filePath)) {
    return configToYaml(config) + '\n';
  }
  return JSON.stringify(config, null, 2) + '\n';
}

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
  assertPathWithin(filePath, projectRoot);

  switch (tool.mergeStrategy) {
    case 'create-only': {
      // Only generate if file doesn't exist (check raw existence, not JSON validity)
      const existingRaw = await readFileOrNull(filePath);
      if (existingRaw !== null) return null;
      return {
        path: filePath,
        content: serializeConfig(tool.config, filePath, tool.type),
      };
    }

    case 'align': {
      // Merge with existing config (existing values take precedence for user customizations)
      const existingRaw = await readFileOrNull(filePath);
      if (existingRaw === null) {
        return {
          path: filePath,
          content: serializeConfig(tool.config, filePath, tool.type),
        };
      }
      // Only merge if existing file is valid JSON; skip non-JSON files (e.g. YAML configs)
      let existing: Record<string, unknown>;
      try {
        existing = JSON.parse(existingRaw) as Record<string, unknown>;
      } catch {
        return null;
      }
      // Deep merge: tool defaults as base, existing user config on top
      const merged = deepmerge(tool.config, existing);
      return {
        path: filePath,
        content: serializeConfig(merged as Record<string, unknown>, filePath, tool.type),
      };
    }

    case 'overwrite': {
      return {
        path: filePath,
        content: serializeConfig(tool.config, filePath, tool.type),
      };
    }
  }
}
