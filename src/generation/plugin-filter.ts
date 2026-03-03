import type { ComposedConfig, HookDefinition } from '../core/types.js';
import {
  UNIVERSAL_AGENT_NAMES,
  UNIVERSAL_SKILL_NAMES,
  UNIVERSAL_HOOK_SCRIPT_FILENAMES,
} from '../core/constants.js';

/**
 * Check if a hook command string references any universal hook script filename.
 */
export function isUniversalHookCommand(command: string): boolean {
  for (const filename of UNIVERSAL_HOOK_SCRIPT_FILENAMES) {
    if (command.includes(filename)) return true;
  }
  return false;
}

/**
 * Filter a hook definition's commands, removing those that reference universal scripts.
 * Returns null if all commands were removed.
 */
function filterHookDefinition(hook: HookDefinition): HookDefinition | null {
  const filteredCommands = hook.hooks.filter(
    (entry) => !isUniversalHookCommand(entry.command),
  );
  if (filteredCommands.length === 0) return null;
  return { ...hook, hooks: filteredCommands };
}

/**
 * Remove universal components from a composed config.
 *
 * Filters out agents, skills, hookScripts, and hooks that are provided
 * by the plugin (universal profile). Preserves rules, settings,
 * claudeMdSections, mcp, and externalTools untouched.
 *
 * Returns a new object — does not mutate the input.
 */
export function filterUniversalComponents(config: ComposedConfig): ComposedConfig {
  const agents = config.agents.filter(
    (a) => !UNIVERSAL_AGENT_NAMES.has(a.name),
  );

  const skills = config.skills.filter(
    (s) => !UNIVERSAL_SKILL_NAMES.has(s.name),
  );

  const hookScripts = config.hookScripts.filter(
    (hs) => !UNIVERSAL_HOOK_SCRIPT_FILENAMES.has(hs.filename),
  );

  const hooks: HookDefinition[] = [];
  for (const hook of config.hooks) {
    const filtered = filterHookDefinition(hook);
    if (filtered) hooks.push(filtered);
  }

  return {
    ...config,
    agents,
    skills,
    hookScripts,
    hooks,
  };
}
