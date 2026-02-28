import type { ClaudeSettings, ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, SETTINGS_FILE } from '../../core/constants.js';
import path from 'path';

/** Generate the .claude/settings.json file from composed config */
export function generateSettings(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile {
  const settings: ClaudeSettings = {
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

  return {
    path: path.join(projectRoot, CLAUDE_DIR, SETTINGS_FILE),
    content: JSON.stringify(settings, null, 2) + '\n',
  };
}
