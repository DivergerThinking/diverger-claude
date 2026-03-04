import type { Command } from 'commander';
import chalk from 'chalk';
import {
  enableTelemetry,
  disableTelemetry,
  getTelemetryStore,
  clearTelemetry,
} from '../../telemetry/index.js';
import * as log from '../ui/logger.js';

/** Max events displayed in table mode */
const TABLE_DISPLAY_LIMIT = 20;

export function registerTelemetryCommand(program: Command): void {
  const cmd = program
    .command('telemetry')
    .description('Gestionar telemetría local de uso');

  cmd
    .command('enable')
    .description('Activar telemetría local')
    .action(async () => {
      try {
        await enableTelemetry();
        log.success('Telemetría activada. Los eventos se guardan localmente en ~/.diverger/telemetry.json');
      } catch (err) {
        log.error(`No se pudo activar la telemetría: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });

  cmd
    .command('disable')
    .description('Desactivar telemetría local')
    .action(async () => {
      try {
        await disableTelemetry();
        log.success('Telemetría desactivada.');
      } catch (err) {
        log.error(`No se pudo desactivar la telemetría: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });

  cmd
    .command('show')
    .description('Mostrar eventos de telemetría registrados')
    .option('--json', 'Salida en formato JSON')
    .action(async (opts) => {
      try {
        const store = await getTelemetryStore();

        if (opts.json || log.getOutputMode() === 'json') {
          log.jsonOutput(store);
          // If global mode is not json but --json flag was passed, output directly
          if (opts.json && log.getOutputMode() !== 'json') {
            console.log(JSON.stringify(store, null, 2));  
          }
          return;
        }

        log.header('Telemetría diverger-claude');
        log.keyValue('Estado', store.enabled ? chalk.green('activada') : chalk.dim('desactivada'));
        log.keyValue('Eventos totales', String(store.events.length));
        log.blank();

        if (store.events.length === 0) {
          log.dim('No hay eventos registrados.');
          return;
        }

        // Show events in reverse chronological order (newest first)
        const displayed = store.events.slice().reverse().slice(0, TABLE_DISPLAY_LIMIT);

         
        // Table header
        console.log(
          chalk.bold(
            padRight('Fecha', 22) +
            padRight('Comando', 10) +
            padRight('Plugin', 8) +
            padRight('Stack', 30) +
            padRight('Profiles', 10) +
            padRight('ms', 8) +
            'Error',
          ),
        );
        console.log(chalk.dim('-'.repeat(96)));

        for (const ev of displayed) {
          const date = formatTimestamp(ev.ts);
          const plugin = ev.pluginMode ? chalk.green('si') : chalk.dim('no');
          const stack = ev.detectedStack.join(', ') || chalk.dim('-');
          const errorCol = ev.errorCode ? chalk.red(ev.errorCode) : chalk.dim('-');

          console.log(
            padRight(date, 22) +
            padRight(ev.command, 10) +
            padRight(plugin, 8 + (ev.pluginMode ? 10 : 5)) + // account for chalk codes
            padRight(truncate(stack, 28), 30 + (ev.detectedStack.length === 0 ? 5 : 0)) +
            padRight(String(ev.profileCount), 10) +
            padRight(String(ev.durationMs), 8) +
            errorCol,
          );
        }

         

        if (store.events.length > TABLE_DISPLAY_LIMIT) {
          log.blank();
          log.dim(`Mostrando ${TABLE_DISPLAY_LIMIT} de ${store.events.length} eventos. Usa --json para ver todos.`);
        }
      } catch (err) {
        log.error(`No se pudo leer la telemetría: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });

  cmd
    .command('clear')
    .description('Borrar todos los eventos de telemetría')
    .option('--force', 'No pedir confirmación')
    .action(async (opts) => {
      try {
        const store = await getTelemetryStore();

        if (store.events.length === 0) {
          log.info('No hay eventos que borrar.');
          return;
        }

        if (!opts.force && log.getOutputMode() === 'rich') {
          // Dynamic import to avoid loading inquirer when not needed
          const { confirm } = await import('@inquirer/prompts');
          const confirmed = await confirm({
            message: `Se borrarán ${store.events.length} eventos de telemetría. ¿Continuar?`,
            default: false,
          });
          if (!confirmed) {
            log.info('Operación cancelada.');
            return;
          }
        }

        await clearTelemetry();
        log.success(`${store.events.length} eventos borrados.`);
      } catch (err) {
        log.error(`No se pudieron borrar los eventos: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}

/** Pad a string to the right to fill a given width (visible chars only) */
function padRight(str: string, width: number): string {
  // Strip ANSI codes for length calculation
  const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, width - visible.length);
  return str + ' '.repeat(padding);
}

/** Truncate a string (visible chars) to a max length */
function truncate(str: string, maxLen: number): string {
  // Strip ANSI for length check
  const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
  if (visible.length <= maxLen) return str;
  return visible.slice(0, maxLen - 1) + '\u2026';
}

/** Format an ISO timestamp to a shorter display format */
function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 19);
  }
}
