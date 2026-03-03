import { Command } from 'commander';
import { setOutputMode } from './ui/logger.js';
import { registerInitCommand } from './commands/init.js';
import { registerDiffCommand } from './commands/diff.js';
import { registerStatusCommand } from './commands/status.js';
import { registerSyncCommand } from './commands/sync.js';
import { registerCheckCommand } from './commands/check.js';
import { registerEjectCommand } from './commands/eject.js';
import { registerWelcomeCommand } from './commands/welcome.js';
import { registerUpdateCommand } from './commands/update.js';
import { registerCleanupCommand } from './commands/cleanup.js';
import { getVersion } from './version.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('diverger')
    .description('Herramienta de configuración automática de Claude Code para proyectos')
    .version(getVersion())
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
  registerWelcomeCommand(program);
  registerUpdateCommand(program);
  registerCleanupCommand(program);

  return program;
}
