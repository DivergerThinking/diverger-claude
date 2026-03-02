import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions } from '../../core/types.js';
import { withSpinner } from '../ui/spinner.js';
import { DivergerError } from '../../core/errors.js';
import * as log from '../ui/logger.js';
import { loadMeta } from '../../governance/history.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Mostrar stack tecnológico detectado y estado de la configuración')
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
        log.header('diverger-claude status');

        // Load existing meta
        const meta = await loadMeta(targetDir);

        if (meta) {
          log.info(`Versión diverger-claude: ${meta.version}`);
          log.info(`Generado: ${meta.generatedAt}`);
          log.info(`Profiles aplicados: ${meta.appliedProfiles.join(', ')}`);
          log.blank();
        } else {
          log.warn('No se encontró .diverger-meta.json. Ejecuta `diverger init` primero.');
        }

        // Current detection
        const detection = await withSpinner(
          'Detectando stack actual...',
          () => engine.detect({ projectRoot: targetDir, options }),
          'Detección completada',
        );

        log.blank();
        log.header('Stack detectado');
        for (const tech of detection.technologies) {
          const version = tech.version ? ` v${tech.version}` : '';
          log.listItem(
            `${tech.name}${version} ${log.confidenceColor(tech.confidence)} [${tech.category}]`,
          );
          for (const ev of tech.evidence) {
            log.dim(`    ${ev.description}`);
          }
        }

        if (detection.monorepo) {
          log.blank();
          log.header('Monorepo');
          log.keyValue('Tipo', detection.monorepo.type);
          log.keyValue('Paquetes', String(detection.monorepo.packages.length));
          for (const pkg of detection.monorepo.packages) {
            log.listItem(`${pkg.name} (${pkg.path})`, 2);
          }
        }

        if (detection.architecture) {
          log.blank();
          log.keyValue('Arquitectura', detection.architecture);
        }

        if (options.output === 'json') {
          log.jsonOutput({ meta, detection });
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
