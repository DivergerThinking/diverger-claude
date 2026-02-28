import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR } from '../../core/constants.js';
import path from 'path';

interface HooksJson {
  hooks: Record<string, HookEntry[]>;
}

interface HookEntry {
  matcher?: string;
  commands: Array<{ command: string; timeout?: number }>;
}

/** Generate .claude/settings.json hooks section from composed config */
export function generateHooks(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile | null {
  if (config.hooks.length === 0) return null;

  const hooksJson: HooksJson = { hooks: {} };

  for (const hook of config.hooks) {
    const event = hook.event;
    if (!hooksJson.hooks[event]) {
      hooksJson.hooks[event] = [];
    }

    const entry: HookEntry = {
      commands: hook.commands.map((c) => ({
        command: c.command,
        ...(c.timeout ? { timeout: c.timeout } : {}),
      })),
    };

    if (hook.matcher) {
      entry.matcher = hook.matcher;
    }

    hooksJson.hooks[event]!.push(entry);
  }

  return {
    path: path.join(projectRoot, CLAUDE_DIR, 'hooks.json'),
    content: JSON.stringify(hooksJson, null, 2) + '\n',
  };
}
