import chalk from 'chalk';
import os from 'node:os';
import { getOutputMode, blank } from './logger.js';

/** Diverger brand color — mint green matching the mesh-sphere logo */
const mint = chalk.hex('#3dffa2');

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;

function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, '');
}

function vLen(s: string): number {
  return stripAnsi(s).length;
}

function padR(s: string, w: number): string {
  const d = w - vLen(s);
  return d > 0 ? s + ' '.repeat(d) : s;
}

function centerIn(s: string, w: number): string {
  const d = w - vLen(s);
  if (d <= 0) return s;
  const left = Math.floor(d / 2);
  return ' '.repeat(left) + s + ' '.repeat(d - left);
}

function truncPath(p: string, max: number): string {
  if (p.length <= max) return p;
  return '...' + p.slice(p.length - max + 3);
}

/**
 * Diverger mesh-sphere logo — ASCII dot art.
 * Evokes the 3D wireframe/particle sphere from the brand logo.
 */
const LOGO = [
  '· · · · · · · · · · ·',
  '· · · ·         · · · ·',
  '· · ·   · · · · ·   · · ·',
  '· · · · · · · · · · · · · · ·',
  '· · ·   · · · · ·   · · ·',
  '· · · ·         · · · ·',
  '· · · · · · · · · · ·',
];

/**
 * Show the branded Diverger welcome banner.
 * Renders a two-column box with the mesh-sphere logo, commands, and tips.
 * Only visible in rich TTY mode.
 */
export function showBanner(): void {
  if (getOutputMode() !== 'rich') return;
  if (!process.stdout.isTTY) return;

  const version = process.env.DIVERGER_VERSION ?? '0.1.0';
  let username: string;
  try {
    username = os.userInfo().username || 'usuario';
  } catch {
    username = 'usuario';
  }
  const cwd = process.cwd();

  const LW = 48;
  const RW = 40;
  const TOTAL = LW + RW + 7; // │ + space + LW + space + │ + space + RW + space + │
  const SEP_POS = LW + 3;    // position of column separator in the border

  // ── Left column ──
  const left: string[] = [
    '',
    centerIn(
      `${chalk.bold('¡Bienvenido,')} ${chalk.bold(mint(username))}${chalk.bold('!')}`,
      LW,
    ),
    '',
    ...LOGO.map(l => centerIn(mint(l), LW)),
    '',
    centerIn(`${chalk.dim('Powered by')} ${chalk.cyan('Claude Code')}`, LW),
    `  ${chalk.dim(truncPath(cwd, LW - 4))}`,
  ];

  // ── Right column ──
  const right: string[] = [
    chalk.bold('Comandos disponibles'),
    chalk.dim('─'.repeat(22)),
    `${mint('init')}    ${chalk.dim('Configurar Claude Code')}`,
    `${mint('sync')}    ${chalk.dim('Sincronizar configuración')}`,
    `${mint('status')}  ${chalk.dim('Ver estado del proyecto')}`,
    `${mint('check')}   ${chalk.dim('Validar configuración')}`,
    `${mint('diff')}    ${chalk.dim('Ver cambios pendientes')}`,
    `${mint('eject')}   ${chalk.dim('Desconectar diverger')}`,
    chalk.dim('─'.repeat(22)),
    chalk.bold('Consejo'),
    `Ejecuta ${mint('diverger init')} para`,
    'configurar tu proyecto',
  ];

  // Equalize row count
  const rows = Math.max(left.length, right.length);
  while (left.length < rows) left.push('');
  while (right.length < rows) right.push('');

  // ── Top border: ╭─── Title ─────┬──────╮ ──
  const titlePlain = `Diverger v${version}`;
  const dashBefore = SEP_POS - titlePlain.length - 6;
  const dashAfter = TOTAL - SEP_POS - 2;
  const topLine =
    chalk.cyan('╭─── ') +
    chalk.bold.cyan(titlePlain) +
    ' ' +
    chalk.cyan('─'.repeat(dashBefore)) +
    chalk.cyan('┬') +
    chalk.cyan('─'.repeat(dashAfter)) +
    chalk.cyan('╮');

  // ── Content rows: │ left │ right │ ──
  const bv = chalk.cyan('│');
  const sep = chalk.dim('│');
  const contentLines = left.map((l, i) => {
    const r = right[i] ?? '';
    return `${bv} ${padR(l, LW)} ${sep} ${padR(r, RW)} ${bv}`;
  });

  // ── Bottom border: ╰──────┴──────╯ ──
  const botLine =
    chalk.cyan('╰') +
    chalk.cyan('─'.repeat(SEP_POS - 1)) +
    chalk.cyan('┴') +
    chalk.cyan('─'.repeat(TOTAL - SEP_POS - 2)) +
    chalk.cyan('╯');

  blank();
  console.log([topLine, ...contentLines, botLine].join('\n'));
  blank();
}
