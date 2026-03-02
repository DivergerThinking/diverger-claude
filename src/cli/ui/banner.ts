import chalk from 'chalk';
import os from 'node:os';
import { getOutputMode, blank } from './logger.js';
import { loadMeta } from '../../governance/history.js';

/** Turquoise brand palette — 3 intensities for 3D depth */
const tBright = chalk.hex('#5eebd8'); // front surface
const tMedium = chalk.hex('#2dd4bf'); // lateral surfaces
const tDim    = chalk.hex('#167a6e'); // back (visible through mesh)
/** Shorthand for accent color in UI elements */
const teal = tMedium;

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

/** Time-aware greeting in Spanish */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

const P = '\u25CF'; // ● filled circle

/**
 * Wireframe Globe logo — particles with 3D depth via color.
 * 'b' = bright (front), 'm' = medium (sides), 'd' = dim (back through mesh)
 */
const LOGO_MAP = [
  '            d d d',
  '        m  d d d d  m',
  '      m  m    d    m  m',
  '    m  b  m  d d  m  b  m',
  '   b  b  b  b b b  b  b  b',
  '    m  b  m  d d  m  b  m',
  '      m  m    d    m  m',
  '        m  d d d d  m',
  '            d d d',
];

/** Render logo map to colored strings */
function renderLogo(): string[] {
  return LOGO_MAP.map(line => {
    let result = '';
    for (const ch of line) {
      if (ch === 'b') result += tBright(P);
      else if (ch === 'm') result += tMedium(P);
      else if (ch === 'd') result += tDim(P);
      else result += ch;
    }
    return result;
  });
}

/** Project state summary line */
async function getProjectState(cwd: string): Promise<string | null> {
  try {
    const meta = await loadMeta(cwd);
    if (!meta) return null;
    const profiles = meta.appliedProfiles.length;
    const stack = meta.detectedStack.join(', ');
    return `${profiles} perfiles | ${stack}`;
  } catch {
    return null;
  }
}

/**
 * Show the branded Diverger welcome banner.
 * Renders a two-column box: wireframe globe logo + commands/tips.
 * Only visible in rich TTY mode.
 */
export async function showBanner(): Promise<void> {
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
  const greeting = getGreeting();
  const projectState = await getProjectState(cwd);

  const logo = renderLogo();

  const LW = 48;
  const RW = 40;
  const TOTAL = LW + RW + 7; // │ + space + LW + space + │ + space + RW + space + │
  const SEP_POS = LW + 3;    // position of column separator in the border

  // ── Left column ──
  const left: string[] = [
    '',
    centerIn(
      `${chalk.bold(greeting + ',')} ${chalk.bold(teal(username))}${chalk.bold('!')}`,
      LW,
    ),
    '',
    ...logo.map(l => centerIn(l, LW)),
    '',
    centerIn(`${chalk.dim('Powered by')} ${chalk.cyan('Claude Code')}`, LW),
    `  ${chalk.dim(truncPath(cwd, LW - 4))}`,
  ];

  // ── Right column ──
  const right: string[] = [
    chalk.bold('Comandos disponibles'),
    chalk.dim('\u2500'.repeat(22)),
    `${teal('init')}    ${chalk.dim('Configurar Claude Code')}`,
    `${teal('sync')}    ${chalk.dim('Sincronizar configuración')}`,
    `${teal('status')}  ${chalk.dim('Ver estado del proyecto')}`,
    `${teal('check')}   ${chalk.dim('Validar configuración')}`,
    `${teal('diff')}    ${chalk.dim('Ver cambios pendientes')}`,
    `${teal('eject')}   ${chalk.dim('Desconectar diverger')}`,
    chalk.dim('\u2500'.repeat(22)),
  ];

  // Project state or tip
  if (projectState) {
    right.push(chalk.bold('Proyecto configurado'));
    right.push(teal(projectState));
  } else {
    right.push(chalk.bold('Consejo'));
    right.push(`Ejecuta ${teal('diverger init')} para`);
    right.push('configurar tu proyecto');
  }

  // Equalize row count
  const rows = Math.max(left.length, right.length);
  while (left.length < rows) left.push('');
  while (right.length < rows) right.push('');

  // ── Top border: ╭─── Title ─────┬──────╮ ──
  const titlePlain = `Diverger v${version}`;
  const dashBefore = SEP_POS - titlePlain.length - 6;
  const dashAfter = TOTAL - SEP_POS - 2;
  const topLine =
    teal('\u256D\u2500\u2500\u2500 ') +
    chalk.bold.hex('#5eebd8')(titlePlain) +
    ' ' +
    teal('\u2500'.repeat(dashBefore)) +
    teal('\u252C') +
    teal('\u2500'.repeat(dashAfter)) +
    teal('\u256E');

  // ── Content rows: │ left │ right │ ──
  const bv = teal('\u2502');
  const sep = chalk.dim('\u2502');
  const contentLines = left.map((l, i) => {
    const r = right[i] ?? '';
    return `${bv} ${padR(l, LW)} ${sep} ${padR(r, RW)} ${bv}`;
  });

  // ── Bottom border: ╰──────┴──────╯ ──
  const botLine =
    teal('\u2570') +
    teal('\u2500'.repeat(SEP_POS - 1)) +
    teal('\u2534') +
    teal('\u2500'.repeat(TOTAL - SEP_POS - 2)) +
    teal('\u256F');

  blank();
  console.log([topLine, ...contentLines, botLine].join('\n'));
  blank();
}
