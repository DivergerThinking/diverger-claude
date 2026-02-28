import chalk from 'chalk';
import type { DiffEntry } from '../../core/types.js';
import { actionColor } from './logger.js';

/** Display a list of diff entries in the terminal */
export function displayDiffs(diffs: DiffEntry[]): void {
  if (diffs.length === 0) {
    console.log(chalk.dim('  No hay cambios pendientes.'));
    return;
  }

  for (const diff of diffs) {
    console.log('');
    console.log(
      `  ${actionColor(diff.type)} ${chalk.bold(diff.path)}`,
    );
    console.log(chalk.dim('  ' + '─'.repeat(50)));

    // Colorize diff output
    const lines = diff.diff.split('\n');
    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---')) {
        console.log(chalk.dim(`  ${line}`));
      } else if (line.startsWith('+')) {
        console.log(chalk.green(`  ${line}`));
      } else if (line.startsWith('-')) {
        console.log(chalk.red(`  ${line}`));
      } else if (line.startsWith('@@')) {
        console.log(chalk.cyan(`  ${line}`));
      } else {
        console.log(chalk.dim(`  ${line}`));
      }
    }
  }
}

/** Display a summary of diff entries */
export function displayDiffSummary(diffs: DiffEntry[]): void {
  const created = diffs.filter((d) => d.type === 'create').length;
  const modified = diffs.filter((d) => d.type === 'modify').length;
  const deleted = diffs.filter((d) => d.type === 'delete').length;

  const parts: string[] = [];
  if (created > 0) parts.push(chalk.green(`${created} nuevos`));
  if (modified > 0) parts.push(chalk.yellow(`${modified} modificados`));
  if (deleted > 0) parts.push(chalk.red(`${deleted} eliminados`));

  console.log(`  Resumen: ${parts.join(', ') || chalk.dim('sin cambios')}`);
}
