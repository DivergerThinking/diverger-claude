import { Command } from 'commander';
import { setOutputMode } from './ui/logger.js';
import { registerInitCommand } from './commands/init.js';
import { registerDiffCommand } from './commands/diff.js';
import { registerStatusCommand } from './commands/status.js';
import { registerSyncCommand } from './commands/sync.js';
import { registerCheckCommand } from './commands/check.js';
import { registerEjectCommand } from './commands/eject.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('diverger')
    .description('Herramienta de configuración automática de Claude Code para proyectos')
    .version('0.1.0')
    .option('-q, --quiet', 'Modo silencioso (solo errores)')
    .option('--json', 'Salida en formato JSON')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.optsWithGlobals();
      if (opts.json) {
        setOutputMode('json');
      } else if (opts.quiet) {
        setOutputMode('quiet');
      }
    });

  registerInitCommand(program);
  registerDiffCommand(program);
  registerStatusCommand(program);
  registerSyncCommand(program);
  registerCheckCommand(program);
  registerEjectCommand(program);

  return program;
}
