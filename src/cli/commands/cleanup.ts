import type { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { confirmAction } from '../ui/prompts.js';
import { DivergerError, extractErrorMessage } from '../../core/errors.js';
import {
  UNIVERSAL_AGENT_NAMES,
  UNIVERSAL_SKILL_NAMES,
  UNIVERSAL_HOOK_SCRIPT_FILENAMES,
  CLAUDE_DIR,
  SETTINGS_FILE,
  agentsDir,
  skillsDir,
  hooksDir,
} from '../../core/constants.js';
import { isUniversalHookCommand } from '../../generation/plugin-filter.js';
import { detectPluginInstalled } from '../plugin-detect.js';
import { fileExists, readFileOrNull } from '../../utils/fs.js';
import * as log from '../ui/logger.js';

export interface CleanupResult {
  cleaned: boolean;
  removed: string[];
  skipped: string[];
  settingsClean: boolean;
}

interface CleanupTarget {
  path: string;
  relativePath: string;
  type: 'agent' | 'skill' | 'hook-script';
  isDirectory: boolean;
  modified: boolean;
}

/** Scan .claude/ for universal component files that the plugin now provides. */
async function findUniversalFiles(targetDir: string, pluginPath: string | null): Promise<CleanupTarget[]> {
  const targets: CleanupTarget[] = [];

  // Universal agents (.claude/agents/{name}.md)
  const agentsPath = agentsDir(targetDir);
  for (const name of UNIVERSAL_AGENT_NAMES) {
    const filePath = path.join(agentsPath, `${name}.md`);
    if (await fileExists(filePath)) {
      const modified = pluginPath
        ? await isModifiedFromPlugin(filePath, path.join(pluginPath, 'agents', `${name}.md`))
        : false;
      targets.push({
        path: filePath,
        relativePath: path.relative(targetDir, filePath),
        type: 'agent',
        isDirectory: false,
        modified,
      });
    }
  }

  // Universal skills (.claude/skills/{name}/ directories)
  const skillsPath = skillsDir(targetDir);
  for (const name of UNIVERSAL_SKILL_NAMES) {
    const dirPath = path.join(skillsPath, name);
    if (await fileExists(dirPath)) {
      const skillFile = path.join(dirPath, 'SKILL.md');
      const modified = pluginPath
        ? await isModifiedFromPlugin(skillFile, path.join(pluginPath, 'skills', name, 'SKILL.md'))
        : false;
      targets.push({
        path: dirPath,
        relativePath: path.relative(targetDir, dirPath) + '/',
        type: 'skill',
        isDirectory: true,
        modified,
      });
    }
  }

  // Universal hook scripts (.claude/hooks/{filename})
  const hooksPath = hooksDir(targetDir);
  for (const filename of UNIVERSAL_HOOK_SCRIPT_FILENAMES) {
    const filePath = path.join(hooksPath, filename);
    if (await fileExists(filePath)) {
      const modified = pluginPath
        ? await isModifiedFromPlugin(filePath, path.join(pluginPath, 'hooks', 'scripts', filename))
        : false;
      targets.push({
        path: filePath,
        relativePath: path.relative(targetDir, filePath),
        type: 'hook-script',
        isDirectory: false,
        modified,
      });
    }
  }

  return targets;
}

/** Compare a project file with the plugin reference. Returns true if modified. */
async function isModifiedFromPlugin(projectFile: string, pluginFile: string): Promise<boolean> {
  const projectContent = await readFileOrNull(projectFile);
  const pluginContent = await readFileOrNull(pluginFile);
  if (!projectContent || !pluginContent) return false;
  // Normalize line endings for comparison
  return projectContent.replace(/\r\n/g, '\n').trim() !== pluginContent.replace(/\r\n/g, '\n').trim();
}

/**
 * Remove universal hook commands from settings.json.
 * Returns true if settings.json was modified.
 */
async function cleanSettingsHooks(targetDir: string, dryRun: boolean): Promise<boolean> {
  const settingsPath = path.join(targetDir, CLAUDE_DIR, SETTINGS_FILE);
  const content = await readFileOrNull(settingsPath);
  if (!content) return false;

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(content);
  } catch {
    return false;
  }

  const hooks = settings.hooks as Record<string, unknown[] | undefined> | undefined;
  if (!hooks || typeof hooks !== 'object') return false;

  let modified = false;

  for (const [event, entries] of Object.entries(hooks)) {
    if (!Array.isArray(entries)) continue;

    const filtered = entries.filter((entry) => {
      if (typeof entry !== 'object' || entry === null) return true;
      const e = entry as Record<string, unknown>;

      // Entry with matcher (e.g. { matcher: "Write", hooks: [...] })
      if ('hooks' in e && Array.isArray(e.hooks)) {
        const filteredHooks = (e.hooks as Array<Record<string, unknown>>).filter(
          (h) => typeof h.command !== 'string' || !isUniversalHookCommand(h.command),
        );
        if (filteredHooks.length === 0) return false; // Remove entire entry
        if (filteredHooks.length < (e.hooks as unknown[]).length) {
          e.hooks = filteredHooks;
          modified = true;
        }
        return true;
      }

      // Direct hook entry (e.g. { type: "command", command: "..." })
      if ('command' in e && typeof e.command === 'string') {
        if (isUniversalHookCommand(e.command)) return false;
      }

      return true;
    });

    if (filtered.length !== entries.length) {
      modified = true;
      if (filtered.length === 0) {
        delete hooks[event];
      } else {
        hooks[event] = filtered;
      }
    }
  }

  // Remove hooks key entirely if empty
  if (Object.keys(hooks).length === 0) {
    delete settings.hooks;
    modified = true;
  }

  if (modified && !dryRun) {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }

  return modified;
}

/**
 * Core cleanup logic — no UI dependencies.
 * Detects plugin, finds universal duplicates, removes identical files,
 * and cleans universal hooks from settings.json.
 */
export async function performCleanup(opts: {
  targetDir: string;
  force?: boolean;
}): Promise<CleanupResult> {
  const { targetDir, force = false } = opts;

  const pluginPath = detectPluginInstalled(targetDir);
  if (!pluginPath && !force) {
    return { cleaned: false, removed: [], skipped: [], settingsClean: false };
  }

  const targets = await findUniversalFiles(targetDir, pluginPath);
  const identical = targets.filter((t) => !t.modified);
  const modified = targets.filter((t) => t.modified);
  const toRemove = force ? targets : identical;

  const settingsClean = await cleanSettingsHooks(targetDir, true);

  if (toRemove.length === 0 && !settingsClean) {
    return {
      cleaned: false,
      removed: [],
      skipped: modified.map((t) => t.relativePath),
      settingsClean: false,
    };
  }

  // Delete files and directories
  const removed: string[] = [];
  for (const target of toRemove) {
    if (target.isDirectory) {
      await fs.rm(target.path, { recursive: true });
    } else {
      await fs.unlink(target.path);
    }
    removed.push(target.relativePath);
  }

  // Clean settings.json hooks
  if (settingsClean) {
    await cleanSettingsHooks(targetDir, false);
  }

  return {
    cleaned: removed.length > 0 || settingsClean,
    removed,
    skipped: force ? [] : modified.map((t) => t.relativePath),
    settingsClean,
  };
}

export function registerCleanupCommand(program: Command): void {
  program
    .command('cleanup')
    .description('Eliminar componentes universales duplicados de .claude/ (provistos por el plugin)')
    .option('-f, --force', 'Omitir confirmación y borrar incluso archivos modificados', false)
    .option('-d, --dry-run', 'Mostrar qué se eliminaría sin borrar', false)
    .option('--dir <path>', 'Directorio objetivo')
    .action(async (opts) => {
      const targetDir = opts.dir ?? process.cwd();
      const force = opts.force ?? false;
      const dryRun = opts.dryRun ?? false;
      const outputMode = log.getOutputMode();

      try {
        log.header('diverger-claude cleanup');
        log.blank();

        // Check if plugin is installed
        const pluginPath = detectPluginInstalled(targetDir);
        if (!pluginPath && !force) {
          log.warn('Plugin diverger-claude no detectado.');
          log.dim('Solo ejecuta cleanup si el plugin está instalado y proporciona estos componentes.');
          log.dim('Usa --force para omitir esta verificación.');
          log.blank();
          return;
        }

        if (pluginPath) {
          log.info('Plugin diverger-claude detectado.');
        }

        // Find universal files to remove
        const targets = await findUniversalFiles(targetDir, pluginPath);

        // Separate modified from identical
        const identical = targets.filter((t) => !t.modified);
        const modified = targets.filter((t) => t.modified);

        // Check settings.json for universal hook commands
        const settingsHasUniversalHooks = await cleanSettingsHooks(targetDir, true); // dry check

        if (identical.length === 0 && modified.length === 0 && !settingsHasUniversalHooks) {
          log.success('No se encontraron componentes universales duplicados en .claude/');
          if (outputMode === 'json') {
            log.jsonOutput({ cleaned: false, removed: [], skipped: [] });
          }
          return;
        }

        // Show identical files (will be removed)
        if (identical.length > 0) {
          log.blank();
          log.info(`${identical.length} componente(s) idéntico(s) al plugin (se eliminarán):`);
          for (const target of identical) {
            log.listItem(`${log.actionColor('deleted')} ${target.relativePath}`);
          }
        }

        // Show modified files (will be preserved unless --force)
        if (modified.length > 0) {
          log.blank();
          if (force) {
            log.warn(`${modified.length} componente(s) modificado(s) (--force: se eliminarán):`);
          } else {
            log.warn(`${modified.length} componente(s) modificado(s) por el equipo (se preservarán):`);
          }
          for (const target of modified) {
            log.listItem(`${log.actionColor('skipped')} ${target.relativePath}`);
          }
        }

        if (settingsHasUniversalHooks) {
          log.blank();
          log.info('settings.json contiene hooks universales que serán eliminados.');
        }

        log.blank();

        // Dry-run: just show and exit
        if (dryRun) {
          log.dim('Modo dry-run: no se eliminó nada.');
          if (outputMode === 'json') {
            const toRemove = force ? targets : identical;
            log.jsonOutput({
              dryRun: true,
              wouldRemove: toRemove.map((t) => t.relativePath),
              skipped: force ? [] : modified.map((t) => t.relativePath),
              settingsHooksClean: settingsHasUniversalHooks,
            });
          }
          return;
        }

        // Determine what to actually remove
        const toRemove = force ? targets : identical;

        if (toRemove.length === 0 && !settingsHasUniversalHooks) {
          log.info('No hay archivos idénticos para eliminar. Los archivos modificados se preservan.');
          if (modified.length > 0) {
            log.dim('Usa --force para eliminar también los archivos modificados.');
          }
          return;
        }

        // Confirm unless --force or non-interactive
        if (!force && outputMode === 'rich') {
          const confirmed = await confirmAction('¿Eliminar estos archivos?');
          if (!confirmed) {
            log.dim('Operación cancelada.');
            return;
          }
        }

        // Delete files and directories
        const removed: string[] = [];
        for (const target of toRemove) {
          if (target.isDirectory) {
            await fs.rm(target.path, { recursive: true });
          } else {
            await fs.unlink(target.path);
          }
          removed.push(target.relativePath);
        }

        // Clean settings.json hooks
        if (settingsHasUniversalHooks) {
          await cleanSettingsHooks(targetDir, false);
          log.success('Hooks universales eliminados de settings.json');
        }

        // Count by type
        const agentCount = toRemove.filter((t) => t.type === 'agent').length;
        const skillCount = toRemove.filter((t) => t.type === 'skill').length;
        const hookCount = toRemove.filter((t) => t.type === 'hook-script').length;

        log.blank();
        const parts: string[] = [];
        if (agentCount > 0) parts.push(`${agentCount} agentes`);
        if (skillCount > 0) parts.push(`${skillCount} skills`);
        if (hookCount > 0) parts.push(`${hookCount} hook scripts`);
        log.success(`Cleanup completado: ${parts.join(', ')} eliminados.`);
        log.dim('Estos componentes ahora los proporciona el plugin.');

        if (modified.length > 0 && !force) {
          log.blank();
          log.dim(`${modified.length} archivo(s) modificado(s) preservado(s). Usa --force para eliminarlos.`);
        }

        if (outputMode === 'json') {
          log.jsonOutput({
            cleaned: true,
            removed,
            skipped: force ? [] : modified.map((t) => t.relativePath),
          });
        }
      } catch (err) {
        if (err instanceof DivergerError) {
          log.error(`[${err.code}] ${err.message}`);
        } else {
          log.error(extractErrorMessage(err));
        }
        process.exit(1);
      }
    });
}
