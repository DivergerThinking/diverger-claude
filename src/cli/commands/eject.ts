import type { Command } from 'commander';
import { confirmAction } from '../ui/prompts.js';
import { DivergerError, extractErrorMessage } from '../../core/errors.js';
import * as log from '../ui/logger.js';
import { META_FILE, BACKUP_DIR, KNOWLEDGE_CACHE_DIR } from '../../core/constants.js';
import fs from 'fs/promises';
import path from 'path';
import { fileExists } from '../../utils/fs.js';

/**
 * Core eject logic — no UI dependencies.
 * Removes diverger-specific metadata files while preserving the .claude/ configuration.
 */
export async function performEject(opts: { targetDir: string }): Promise<{ ejected: boolean; removed: string[] }> {
  const { targetDir } = opts;

  const filesToRemove = [
    path.join(targetDir, META_FILE),
  ];

  const dirsToRemove = [
    path.join(targetDir, BACKUP_DIR),
    path.join(targetDir, KNOWLEDGE_CACHE_DIR),
  ];

  const removed: string[] = [];

  for (const file of filesToRemove) {
    if (await fileExists(file)) {
      await fs.unlink(file);
      removed.push(path.relative(targetDir, file));
    }
  }

  for (const dir of dirsToRemove) {
    if (await fileExists(dir)) {
      await fs.rm(dir, { recursive: true });
      removed.push(path.relative(targetDir, dir) + '/');
    }
  }

  return { ejected: removed.length > 0, removed };
}

export function registerEjectCommand(program: Command): void {
  program
    .command('eject')
    .description('Desconectar diverger-claude manteniendo la configuración generada')
    .option('-f, --force', 'Omitir confirmación', false)
    .option('--dir <path>', 'Directorio objetivo')
    .action(async (opts) => {
      const targetDir = opts.dir ?? process.cwd();
      const force = opts.force ?? false;
      const outputMode = log.getOutputMode();

      try {
        log.header('diverger-claude eject');
        log.blank();
        log.info('Esto desconectará diverger-claude del proyecto.');
        log.info('La configuración .claude/ se mantendrá intacta.');
        log.info('Se eliminarán:');
        log.listItem(META_FILE);
        log.listItem(BACKUP_DIR);
        log.listItem(KNOWLEDGE_CACHE_DIR);
        log.blank();

        // Skip prompt when --force or --json
        if (!force && outputMode === 'rich') {
          const confirmed = await confirmAction('¿Continuar con el eject?');
          if (!confirmed) {
            log.dim('Operación cancelada.');
            return;
          }
        }

        const { ejected, removed } = await performEject({ targetDir });

        if (ejected) {
          for (const rel of removed) {
            log.success(`Eliminado: ${rel}`);
          }
        }

        log.blank();
        log.success('Eject completado. La configuración .claude/ se mantiene intacta.');
        log.dim('Puedes seguir usando Claude Code con la configuración existente.');
        log.dim('Para reconectar, ejecuta `diverger init --force`.');

        if (outputMode === 'json') {
          log.jsonOutput({ ejected, removed });
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
