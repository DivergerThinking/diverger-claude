import chalk from 'chalk';
import type { DiffEntry } from '../../core/types.js';
import { actionColor, getOutputMode } from './logger.js';
import * as log from './logger.js';

/** Display a list of diff entries in the terminal */
export function displayDiffs(diffs: DiffEntry[]): void {
  const mode = getOutputMode();
  if (mode === 'quiet' || mode === 'json') return;

  if (diffs.length === 0) {
    log.dim('  No hay cambios pendientes.');
    return;
  }

  for (const diff of diffs) {
    log.blank();
    log.info(`  ${actionColor(diff.type)} ${chalk.bold(diff.path)}`);
    log.dim('  ' + '─'.repeat(50));

    // Colorize diff output
    const lines = diff.diff.split('\n');
    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---')) {
        log.dim(`  ${line}`);
      } else if (line.startsWith('+')) {
        log.info(chalk.green(`  ${line}`));
      } else if (line.startsWith('-')) {
        log.info(chalk.red(`  ${line}`));
      } else if (line.startsWith('@@')) {
        log.info(chalk.cyan(`  ${line}`));
      } else {
        log.dim(`  ${line}`);
      }
    }
  }
}

/** Display a summary of diff entries */
export function displayDiffSummary(diffs: DiffEntry[]): void {
  const mode = getOutputMode();
  if (mode === 'quiet' || mode === 'json') return;

  const created = diffs.filter((d) => d.type === 'create').length;
  const modified = diffs.filter((d) => d.type === 'modify').length;
  const deleted = diffs.filter((d) => d.type === 'delete').length;

  const parts: string[] = [];
  if (created > 0) parts.push(chalk.green(`${created} nuevos`));
  if (modified > 0) parts.push(chalk.yellow(`${modified} modificados`));
  if (deleted > 0) parts.push(chalk.red(`${deleted} eliminados`));

  log.info(`  Resumen: ${parts.join(', ') || chalk.dim('sin cambios')}`);
}
