import chalk from 'chalk';
import type { OutputMode } from '../../core/types.js';

let outputMode: OutputMode = 'rich';

export function setOutputMode(mode: OutputMode): void {
  outputMode = mode;
}

export function getOutputMode(): OutputMode {
  return outputMode;
}

function isQuiet(): boolean {
  return outputMode === 'quiet';
}

function isJson(): boolean {
  return outputMode === 'json';
}

/** Print info message (blue) */
export function info(message: string): void {
  if (isJson()) return;
  console.log(chalk.blue('ℹ'), message);
}

/** Print success message (green) */
export function success(message: string): void {
  if (isJson()) return;
  console.log(chalk.green('✔'), message);
}

/** Print warning message (yellow) */
export function warn(message: string): void {
  if (isJson()) return;
  console.log(chalk.yellow('⚠'), message);
}

/** Print error message (red) */
export function error(message: string): void {
  if (isJson()) return;
  console.error(chalk.red('✖'), message);
}

/** Print a header/title */
export function header(message: string): void {
  if (isQuiet() || isJson()) return;
  console.log('');
  console.log(chalk.bold.cyan(message));
  console.log(chalk.dim('─'.repeat(Math.min(message.length + 4, 60))));
}

/** Print a dimmed message */
export function dim(message: string): void {
  if (isQuiet() || isJson()) return;
  console.log(chalk.dim(message));
}

/** Print a table row */
export function tableRow(label: string, value: string, indent = 0): void {
  if (isJson()) return;
  const prefix = ' '.repeat(indent);
  console.log(`${prefix}${chalk.dim(label + ':')} ${value}`);
}

/** Print a key-value pair with color */
export function keyValue(key: string, value: string): void {
  if (isJson()) return;
  console.log(`  ${chalk.bold(key)}: ${value}`);
}

/** Print a list item */
export function listItem(text: string, indent = 0): void {
  if (isJson()) return;
  const prefix = ' '.repeat(indent);
  console.log(`${prefix}${chalk.dim('•')} ${text}`);
}

/** Print JSON output (only in json mode) */
export function jsonOutput(data: unknown): void {
  if (!isJson()) return;
  console.log(JSON.stringify(data, null, 2));
}

/** Print a blank line */
export function blank(): void {
  if (isQuiet() || isJson()) return;
  console.log('');
}

/** Colorize confidence score */
export function confidenceColor(confidence: number): string {
  if (confidence >= 90) return chalk.green(`${confidence}%`);
  if (confidence >= 70) return chalk.yellow(`${confidence}%`);
  return chalk.red(`${confidence}%`);
}

/** Colorize a file action */
export function actionColor(action: string): string {
  switch (action) {
    case 'created':
    case 'create':
      return chalk.green(action);
    case 'updated':
    case 'modify':
      return chalk.yellow(action);
    case 'deleted':
    case 'delete':
      return chalk.red(action);
    case 'skipped':
    case 'skip':
      return chalk.dim(action);
    default:
      return action;
  }
}
