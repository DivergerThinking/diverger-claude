import type { Command } from 'commander';
import { confirmAction } from '../ui/prompts.js';
import * as log from '../ui/logger.js';
import { META_FILE, BACKUP_DIR, KNOWLEDGE_CACHE_DIR } from '../../core/constants.js';
import fs from 'fs/promises';
import path from 'path';
import { fileExists } from '../../utils/fs.js';

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

        // Remove diverger-specific files
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
            const rel = path.relative(targetDir, file);
            log.success(`Eliminado: ${rel}`);
            removed.push(rel);
          }
        }

        for (const dir of dirsToRemove) {
          if (await fileExists(dir)) {
            await fs.rm(dir, { recursive: true });
            const rel = path.relative(targetDir, dir) + '/';
            log.success(`Eliminado: ${rel}`);
            removed.push(rel);
          }
        }

        log.blank();
        log.success('Eject completado. La configuración .claude/ se mantiene intacta.');
        log.dim('Puedes seguir usando Claude Code con la configuración existente.');
        log.dim('Para reconectar, ejecuta `diverger init --force`.');

        if (outputMode === 'json') {
          log.jsonOutput({ ejected: true, removed });
        }
      } catch (err) {
        log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
