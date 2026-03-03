import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, SETTINGS_FILE } from '../../core/constants.js';
import { generateHooks } from './hooks.js';
import path from 'path';

/** Generate the .claude/settings.json file from composed config */
export function generateSettings(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile {
  const settings: Record<string, unknown> = {
    $schema: 'https://json.schemastore.org/claude-code-settings.json',
    permissions: {
      allow: [...new Set(config.settings.permissions?.allow ?? [])].sort(),
      deny: [...new Set(config.settings.permissions?.deny ?? [])].sort(),
    },
  };

  if (config.settings.sandbox) {
    settings.sandbox = config.settings.sandbox;
  }

  if (config.settings.env) {
    settings.env = config.settings.env;
  }

  // Integrate hooks into settings.json
  const hooksData = generateHooks(config);
  if (hooksData) {
    settings.hooks = hooksData;
  }

  return {
    path: path.join(projectRoot, CLAUDE_DIR, SETTINGS_FILE),
    content: JSON.stringify(settings, null, 2) + '\n',
  };
}
