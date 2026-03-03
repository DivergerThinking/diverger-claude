import path from 'path';
import { readJsonOrNull, fileExists } from '../utils/fs.js';

export interface HookCheckResult {
  check: 'hooks-json' | 'hook-scripts';
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  autoFixable: boolean;
}

interface HooksJsonEntry {
  type: string;
  command: string;
  timeout?: number;
}

type HooksJson = Record<string, Record<string, HooksJsonEntry[]> | HooksJsonEntry[]>;

/**
 * Validate hooks.json exists and is valid JSON.
 */
export async function checkHooksJson(pluginDir: string): Promise<HookCheckResult> {
  const hooksJsonPath = path.join(pluginDir, 'hooks', 'hooks.json');
  const content = await readJsonOrNull<HooksJson>(hooksJsonPath);

  if (content === null) {
    const exists = await fileExists(hooksJsonPath);
    return {
      check: 'hooks-json',
      status: 'unhealthy',
      message: exists
        ? 'hooks.json contiene JSON inválido'
        : 'hooks.json no encontrado',
      autoFixable: true,
    };
  }

  return {
    check: 'hooks-json',
    status: 'healthy',
    message: 'hooks.json válido',
    autoFixable: false,
  };
}

/**
 * Validate that all hook scripts referenced in hooks.json exist.
 */
export async function checkHookScripts(pluginDir: string): Promise<HookCheckResult> {
  const hooksJsonPath = path.join(pluginDir, 'hooks', 'hooks.json');
  const content = await readJsonOrNull<HooksJson>(hooksJsonPath);

  if (!content) {
    return {
      check: 'hook-scripts',
      status: 'unhealthy',
      message: 'No se puede validar scripts: hooks.json no disponible',
      autoFixable: true,
    };
  }

  const missing: string[] = [];

  for (const eventValue of Object.values(content)) {
    const entries = extractEntries(eventValue);
    for (const entry of entries) {
      const scriptPath = extractScriptPath(entry.command, pluginDir);
      if (scriptPath && !(await fileExists(scriptPath))) {
        missing.push(path.basename(scriptPath));
      }
    }
  }

  if (missing.length > 0) {
    return {
      check: 'hook-scripts',
      status: 'unhealthy',
      message: `Scripts faltantes: ${missing.join(', ')}`,
      autoFixable: true,
    };
  }

  return {
    check: 'hook-scripts',
    status: 'healthy',
    message: 'Todos los hook scripts existen',
    autoFixable: false,
  };
}

function extractEntries(value: Record<string, HooksJsonEntry[]> | HooksJsonEntry[]): HooksJsonEntry[] {
  if (Array.isArray(value)) return value;
  const all: HooksJsonEntry[] = [];
  for (const arr of Object.values(value)) {
    if (Array.isArray(arr)) all.push(...arr);
  }
  return all;
}

function extractScriptPath(command: string, pluginDir: string): string | null {
  // Commands look like: bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/secret-scanner.sh
  const match = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(.+)/);
  if (match?.[1]) {
    return path.join(pluginDir, match[1].replace(/\//g, path.sep));
  }
  return null;
}
