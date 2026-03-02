import type { Command } from 'commander';
import { showBanner } from '../ui/banner.js';

export function registerWelcomeCommand(program: Command): void {
  program
    .command('welcome')
    .description('Mostrar el banner de bienvenida')
    .action(async () => {
      await showBanner();
    });
}
