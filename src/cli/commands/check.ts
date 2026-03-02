import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions } from '../../core/types.js';
import { withSpinner } from '../ui/spinner.js';
import { DivergerError } from '../../core/errors.js';
import * as log from '../ui/logger.js';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description('Validar la configuración .claude/ existente')
    .option('--dir <path>', 'Directorio objetivo')
    .action(async (opts) => {
      const targetDir = opts.dir ?? process.cwd();
      const options: CliOptions = {
        output: log.getOutputMode(),
        force: false,
        dryRun: false,
        targetDir,
      };

      const engine = new DivergerEngine();

      try {
        log.header('diverger-claude check');

        const result = await withSpinner(
          'Validando configuración...',
          () => engine.check({ projectRoot: targetDir, options }),
        );

        log.blank();

        if (result.valid) {
          log.success('La configuración es válida.');
        } else {
          log.warn('Se encontraron problemas:');
        }

        for (const issue of result.issues) {
          if (issue.severity === 'error') {
            log.error(`[${issue.file}] ${issue.message}`);
          } else {
            log.warn(`[${issue.file}] ${issue.message}`);
          }
        }

        if (options.output === 'json') {
          log.jsonOutput(result);
        }

        if (!result.valid) {
          process.exit(1);
        }
      } catch (err) {
        if (err instanceof DivergerError) {
          log.error(`[${err.code}] ${err.message}`);
        } else {
          log.error(err instanceof Error ? err.message : String(err));
        }
        process.exit(1);
      }
    });
}
