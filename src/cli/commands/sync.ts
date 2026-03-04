import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions, MergeResult } from '../../core/types.js';
import { writeFileAtomic, readFileOrNull } from '../../utils/fs.js';
import { saveMeta, finalizeMetaAfterWrite } from '../../governance/history.js';
import { withSpinner } from '../ui/spinner.js';
import { resolveConflict } from '../ui/prompts.js';
import { DivergerError, extractErrorMessage } from '../../core/errors.js';
import * as log from '../ui/logger.js';
import { recordEvent } from '../../telemetry/index.js';

/** Display per-file merge outcomes. Returns true if conflicts were found. */
function displayMergeOutcomes(mergeResults: MergeResult[]): boolean {
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
  return hasConflicts;
}

/** Write auto-apply and merged files to disk using atomic writes. */
async function writeAutoMergedFiles(
  mergeResults: MergeResult[],
): Promise<Array<{ path: string; content: string }>> {
  // A1: Write auto-apply and merged files to disk using atomic writes
  // C3: Track written files so we can finalize meta afterwards
  const writtenFiles: Array<{ path: string; content: string }> = [];
  for (const result of mergeResults) {
    if ((result.outcome === 'auto-apply' || result.outcome === 'merged') && result.content) {
      await writeFileAtomic(result.path, result.content);
      writtenFiles.push({ path: result.path, content: result.content });
    }
  }
  return writtenFiles;
}

/** Resolve conflicts via force, interactive prompts, or non-interactive reporting. */
async function resolveConflicts(
  mergeResults: MergeResult[],
  options: CliOptions,
  writtenFiles: Array<{ path: string; content: string }>,
): Promise<void> {
  const conflicts = mergeResults.filter((r) => r.outcome === 'conflict');

  if (options.force) {
    // Force mode: auto-resolve all conflicts using library version (ours)
    for (const conflict of conflicts) {
      if (conflict.content) {
        await writeFileAtomic(conflict.path, conflict.content);
        writtenFiles.push({ path: conflict.path, content: conflict.content });
        log.info(`  → ${conflict.path}: forzado (ours)`);
      }
    }
    return;
  }

  log.blank();
  log.warn('Se encontraron conflictos que requieren resolución manual.');

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
        // Keep current file as-is but record on-disk content for correct meta hash
        const onDisk = await readFileOrNull(conflict.path);
        if (onDisk !== null) {
          writtenFiles.push({ path: conflict.path, content: onDisk });
        }
      } else {
        // 'manual' — record on-disk content for correct meta hash
        const onDisk = await readFileOrNull(conflict.path);
        if (onDisk !== null) {
          writtenFiles.push({ path: conflict.path, content: onDisk });
        }
      }
    }
  } else {
    // Non-interactive mode: report conflicts without prompting
    for (const conflict of conflicts) {
      log.warn(`  ⚠ ${conflict.path}: conflicto sin resolver (modo no interactivo)`);
    }
  }
}

/** Display sync summary with counts per outcome. */
function showSyncSummary(mergeResults: MergeResult[], options: CliOptions): void {
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
}

export function registerSyncCommand(program: Command): void {
  program
    .command('sync')
    .description('Re-analizar proyecto y actualizar configuración con three-way merge')
    .option('-f, --force', 'Aplicar todos los cambios sin preguntar', false)
    .option('--dir <path>', 'Directorio objetivo')
    .action(async (opts) => {
      const startTime = Date.now();
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
          () => engine.sync({ projectRoot: options.targetDir, options, onWarning: (msg: string) => log.warn(msg) }),
        );

        const hasConflicts = displayMergeOutcomes(mergeResults);
        const writtenFiles = await writeAutoMergedFiles(mergeResults);

        if (hasConflicts) {
          await resolveConflicts(mergeResults, options, writtenFiles);
        }

        // C3: Finalize meta with actual written files, then save.
        // Pass oldMeta so non-written files preserve their correct base hash/content.
        const finalMeta = finalizeMetaAfterWrite(pendingMeta, writtenFiles, oldMeta, options.targetDir);
        await saveMeta(options.targetDir, finalMeta);

        showSyncSummary(mergeResults, options);

        recordEvent({
          command: 'sync',
          pluginMode: options.pluginMode ?? false,
          detectedStack: finalMeta.detectedStack ?? [],
          profileCount: finalMeta.appliedProfiles?.length ?? 0,
          durationMs: Date.now() - startTime,
        }).catch(() => {}); // fire-and-forget, never block CLI
      } catch (err: unknown) {
        if (err instanceof DivergerError) {
          log.error(`[${err.code}] ${err.message}`);
        } else {
          log.error(extractErrorMessage(err));
        }
        process.exit(1);
      }
    });
}
