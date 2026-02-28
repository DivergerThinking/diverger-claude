import type { ComposedConfig } from '../../core/types.js';

interface HookEntry {
  matcher?: string;
  hooks: Array<{ type: 'command'; command: string; timeout?: number }>;
}

/** Generate hooks data structure to be merged into settings.json */
export function generateHooks(
  config: ComposedConfig,
): Record<string, HookEntry[]> | null {
  if (config.hooks.length === 0) return null;

  const hooksMap: Record<string, HookEntry[]> = {};

  for (const hook of config.hooks) {
    const event = hook.event;
    if (!hooksMap[event]) {
      hooksMap[event] = [];
    }

    const entry: HookEntry = {
      hooks: hook.hooks.map((h) => ({
        type: 'command' as const,
        command: h.command,
        ...(h.timeout ? { timeout: h.timeout } : {}),
      })),
    };

    if (hook.matcher) {
      entry.matcher = hook.matcher;
    }

    hooksMap[event]!.push(entry);
  }

  return hooksMap;
}
