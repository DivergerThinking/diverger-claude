import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions } from '../../core/types.js';
import { withSpinner } from '../ui/spinner.js';
import { DivergerError, extractErrorMessage } from '../../core/errors.js';
import * as log from '../ui/logger.js';
import { recordEvent } from '../../telemetry/index.js';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description('Validar la configuración .claude/ existente')
    .option('--dir <path>', 'Directorio objetivo')
    .action(async (opts) => {
      const startTime = Date.now();
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

        recordEvent({
          command: 'check',
          pluginMode: false,
          detectedStack: [],
          profileCount: 0,
          errorCode: result.valid ? undefined : 'VALIDATION_ISSUES',
          durationMs: Date.now() - startTime,
        }).catch(() => {}); // fire-and-forget, never block CLI

        if (!result.valid) {
          process.exit(1);
        }
      } catch (err) {
        if (err instanceof DivergerError) {
          log.error(`[${err.code}] ${err.message}`);
        } else {
          log.error(extractErrorMessage(err));
        }
        process.exit(1);
      }
    });
}
