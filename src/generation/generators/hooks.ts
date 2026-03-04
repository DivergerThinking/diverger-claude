import type { ComposedConfig } from '../../core/types.js';

interface HookEntry {
  matcher?: string;
  hooks: Array<{
    type: 'command';
    command: string;
    timeout?: number;
    statusMessage?: string;
  }>;
}

/** Generate hooks data structure to be merged into settings.json */
export function generateHooks(
  config: ComposedConfig,
): Record<string, HookEntry[]> | null {
  if (config.hooks.length === 0) return null;

  const hooksMap: Record<string, HookEntry[]> = {};

  for (const hook of config.hooks) {
    const event = hook.event;
    hooksMap[event] ??= [];

    const entry: HookEntry = {
      hooks: hook.hooks.map((h) => ({
        type: 'command' as const,
        command: h.command,
        ...(h.timeout ? { timeout: h.timeout } : {}),
        ...(h.statusMessage ? { statusMessage: h.statusMessage } : {}),
      })),
    };

    if (hook.matcher) {
      entry.matcher = hook.matcher;
    }

    hooksMap[event]!.push(entry);
  }

  return hooksMap;
}

/**
 * Validate that hook scripts and settings hook entries are consistent.
 * Returns orphan scripts (exist but not wired) and missing scripts (wired but don't exist).
 */
export function validateHookConsistency(
  config: ComposedConfig,
): { orphanScripts: string[]; missingScripts: string[] } {
  const scriptFilenames = new Set(
    (config.hookScripts ?? []).map((s) => s.filename),
  );

  const referencedFilenames = new Set<string>();
  for (const hook of config.hooks) {
    for (const h of hook.hooks) {
      const match = h.command.match(/\.claude\/hooks\/([a-zA-Z0-9_-]+\.sh)/);
      if (match?.[1]) {
        referencedFilenames.add(match[1]);
      }
    }
  }

  const orphanScripts = [...scriptFilenames].filter((f) => !referencedFilenames.has(f));
  const missingScripts = [...referencedFilenames].filter((f) => !scriptFilenames.has(f));

  return { orphanScripts, missingScripts };
}
