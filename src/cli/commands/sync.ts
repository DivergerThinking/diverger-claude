import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions } from '../../core/types.js';
import { writeFileAtomic } from '../../utils/fs.js';
import { saveMeta, finalizeMetaAfterWrite } from '../../governance/history.js';
import { withSpinner } from '../ui/spinner.js';
import { resolveConflict } from '../ui/prompts.js';
import * as log from '../ui/logger.js';

export function registerSyncCommand(program: Command): void {
  program
    .command('sync')
    .description('Re-analizar proyecto y actualizar configuración con three-way merge')
    .option('-f, --force', 'Aplicar todos los cambios sin preguntar', false)
    .option('--dir <path>', 'Directorio objetivo')
    .action(async (opts) => {
      const options: CliOptions = {
        output: log.getOutputMode(),
        force: opts.force ?? false,
        dryRun: false,
        targetDir: opts.dir ?? process.cwd(),
      };

      const engine = new DivergerEngine();

      try {
        log.header('diverger-claude sync');

        // C3: sync now returns { results, pendingMeta, oldMeta }
        const { results: mergeResults, pendingMeta, oldMeta } = await withSpinner(
          'Analizando cambios y preparando merge...',
          () => engine.sync({ projectRoot: options.targetDir, options }),
        );

        log.blank();
        log.header('Resultados del merge');

        let hasConflicts = false;
        for (const result of mergeResults) {
          switch (result.outcome) {
            case 'skip':
              log.dim(`  ⏭  ${result.path} (sin cambios)`);
              break;
            case 'auto-apply':
              log.success(`${result.path} (actualizado automáticamente)`);
              break;
            case 'keep':
              log.info(`${result.path} (mantenido - cambios del equipo)`);
              break;
            case 'merged':
              log.success(`${result.path} (merge exitoso)`);
              break;
            case 'conflict':
              hasConflicts = true;
              log.warn(`${result.path} (CONFLICTO)`);
              if (result.conflictDetails) {
                log.dim(`    ${result.conflictDetails}`);
              }
              break;
            case 'error':
              // C2: log errors from merge process
              log.error(`${result.path} (ERROR)`);
              if (result.conflictDetails) {
                log.dim(`    ${result.conflictDetails}`);
              }
              break;
          }
        }

        // A1: Write auto-apply and merged files to disk using atomic writes
        // C3: Track written files so we can finalize meta afterwards
        const writtenFiles: Array<{ path: string; content: string }> = [];
        for (const result of mergeResults) {
          if ((result.outcome === 'auto-apply' || result.outcome === 'merged') && result.content) {
            await writeFileAtomic(result.path, result.content);
            writtenFiles.push({ path: result.path, content: result.content });
          }
        }

        // Handle conflicts
        if (hasConflicts && options.force) {
          // Force mode: auto-resolve all conflicts using library version (ours)
          const conflicts = mergeResults.filter((r) => r.outcome === 'conflict');
          for (const conflict of conflicts) {
            if (conflict.content) {
              await writeFileAtomic(conflict.path, conflict.content);
              writtenFiles.push({ path: conflict.path, content: conflict.content });
              log.info(`  → ${conflict.path}: forzado (ours)`);
            }
          }
        } else if (hasConflicts && !options.force) {
          log.blank();
          log.warn('Se encontraron conflictos que requieren resolución manual.');

          const conflicts = mergeResults.filter((r) => r.outcome === 'conflict');

          if (options.output === 'rich') {
            // Interactive mode: prompt for each conflict
            for (const conflict of conflicts) {
              const resolution = await resolveConflict(conflict.path);
              log.info(`  → ${conflict.path}: ${resolution}`);
              // Apply the resolution
              if (resolution === 'ours' && conflict.content) {
                await writeFileAtomic(conflict.path, conflict.content);
                writtenFiles.push({ path: conflict.path, content: conflict.content });
              } else if (resolution === 'theirs') {
                // Keep current file as-is (no action needed)
              }
              // 'manual' — leave for user to handle
            }
          } else {
            // Non-interactive mode: report conflicts without prompting
            for (const conflict of conflicts) {
              log.warn(`  ⚠ ${conflict.path}: conflicto sin resolver (modo no interactivo)`);
            }
          }
        }

        // C3: Finalize meta with actual written files, then save.
        // Pass oldMeta so non-written files preserve their correct base hash/content.
        const finalMeta = finalizeMetaAfterWrite(pendingMeta, writtenFiles, oldMeta);
        await saveMeta(options.targetDir, finalMeta);

        // Summary
        const summary = {
          skip: mergeResults.filter((r) => r.outcome === 'skip').length,
          autoApply: mergeResults.filter((r) => r.outcome === 'auto-apply').length,
          keep: mergeResults.filter((r) => r.outcome === 'keep').length,
          merged: mergeResults.filter((r) => r.outcome === 'merged').length,
          conflict: mergeResults.filter((r) => r.outcome === 'conflict').length,
          error: mergeResults.filter((r) => r.outcome === 'error').length,
        };

        log.blank();
        log.header('Resumen');
        if (summary.autoApply > 0) log.listItem(`${summary.autoApply} actualizados automáticamente`);
        if (summary.keep > 0) log.listItem(`${summary.keep} mantenidos (cambios del equipo)`);
        if (summary.merged > 0) log.listItem(`${summary.merged} mergeados`);
        if (summary.conflict > 0) log.listItem(`${summary.conflict} conflictos`);
        if (summary.error > 0) log.listItem(`${summary.error} errores`);
        if (summary.skip > 0) log.dim(`  ${summary.skip} sin cambios`);

        if (options.output === 'json') {
          log.jsonOutput({ mergeResults, summary });
        }
      } catch (err) {
        log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
