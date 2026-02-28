import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions } from '../../core/types.js';
import { withSpinner } from '../ui/spinner.js';
import * as log from '../ui/logger.js';
import { displayDiffs, displayDiffSummary } from '../ui/diff-display.js';

export function registerDiffCommand(program: Command): void {
  program
    .command('diff')
    .description('Mostrar qué cambios se aplicarían (dry-run)')
    .option('--dir <path>', 'Directorio objetivo')
    .action(async (opts) => {
      const options: CliOptions = {
        output: log.getOutputMode(),
        force: false,
        dryRun: true,
        targetDir: opts.dir ?? process.cwd(),
      };

      const engine = new DivergerEngine();

      try {
        log.header('diverger-claude diff');

        const diffs = await withSpinner(
          'Analizando y calculando diferencias...',
          () => engine.diff({ projectRoot: options.targetDir, options }),
        );

        log.blank();
        log.header('Cambios propuestos');
        displayDiffs(diffs);
        log.blank();
        displayDiffSummary(diffs);

        if (options.output === 'json') {
          log.jsonOutput({ diffs });
        }
      } catch (err) {
        log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
