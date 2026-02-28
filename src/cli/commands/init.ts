import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions, GovernanceLevel } from '../../core/types.js';
import { CONFIDENCE_THRESHOLD } from '../../core/constants.js';
import { createMeta, saveMeta } from '../../governance/history.js';
import { extractTrackedDeps } from '../../governance/index.js';
import { runGreenfieldWizard } from '../../greenfield/wizard.js';
import { withSpinner } from '../ui/spinner.js';
import { confirmTechnologies, askKnowledgePermission } from '../ui/prompts.js';
import * as log from '../ui/logger.js';
import { displayDiffs, displayDiffSummary } from '../ui/diff-display.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Detectar stack y generar configuración .claude/')
    .option('-f, --force', 'Sobrescribir archivos existentes sin preguntar', false)
    .option('-d, --dry-run', 'Mostrar qué se generaría sin escribir', false)
    .option('--dir <path>', 'Directorio objetivo (por defecto: directorio actual)')
    .action(async (opts) => {
      const options: CliOptions = {
        output: log.getOutputMode(),
        force: opts.force ?? false,
        dryRun: opts.dryRun ?? false,
        targetDir: opts.dir ?? process.cwd(),
      };

      const engine = new DivergerEngine();

      try {
        log.header('diverger-claude init');

        // Step 1: Detect
        const detection = await withSpinner(
          'Analizando proyecto...',
          () => engine.detect({ projectRoot: options.targetDir, options }),
          'Análisis completado',
        );

        // Show detected technologies
        log.blank();
        log.header('Stack detectado');
        for (const tech of detection.technologies) {
          log.listItem(
            `${tech.name} ${log.confidenceColor(tech.confidence)}${tech.version ? ` (v${tech.version})` : ''}`,
          );
        }

        if (detection.monorepo) {
          log.blank();
          log.info(`Monorepo detectado: ${detection.monorepo.type} (${detection.monorepo.packages.length} paquetes)`);
        }

        if (detection.architecture) {
          log.info(`Arquitectura: ${detection.architecture}`);
        }

        // Step 2: Confirm (unless --force)
        let confirmedDetection = detection;
        if (detection.technologies.length === 0) {
          if (!options.force && options.output === 'rich') {
            // B34: invoke greenfield wizard for interactive template selection
            log.blank();
            log.warn('No se detectaron tecnologías en este directorio.');
            confirmedDetection = await runGreenfieldWizard(options.targetDir);
          } else {
            log.blank();
            log.warn('No se detectaron tecnologías en este directorio.');
            log.dim('Verifica que el directorio contenga archivos de proyecto (package.json, go.mod, etc.).');
            return;
          }
        } else if (!options.force && options.output === 'rich') {
          log.blank();
          const selected = await confirmTechnologies(detection.technologies);
          confirmedDetection = { ...detection, technologies: selected };
        } else {
          // B37: in --force or non-interactive modes, apply confidence threshold
          confirmedDetection = {
            ...detection,
            technologies: detection.technologies.filter(
              (t) => t.confidence >= CONFIDENCE_THRESHOLD,
            ),
          };
        }

        // Step 3: Generate (dry-run first if not explicitly dry-run)
        if (options.dryRun) {
          const ctx = { projectRoot: options.targetDir, options };
          const result = await withSpinner(
            'Calculando cambios...',
            () => engine.initWithDetection(confirmedDetection, ctx),
          );
          const diffs = await engine.computeDiff(result, options.targetDir);
          log.blank();
          log.header('Cambios propuestos (dry-run)');
          displayDiffs(diffs);
          log.blank();
          displayDiffSummary(diffs);
          if (options.output === 'json') {
            log.jsonOutput({ diffs });
          }
          return;
        }

        // Generate using confirmed detection (no re-detection)
        const ctx = {
          projectRoot: options.targetDir,
          options,
          // In --force mode, skip knowledge prompts entirely; in non-interactive modes, also skip
          onKnowledgePermission: (options.force || options.output !== 'rich')
            ? undefined
            : async (tech: string) => askKnowledgePermission(tech),
        };
        const result = await withSpinner(
          'Generando configuración...',
          () => engine.initWithDetection(confirmedDetection, ctx),
        );

        // Write files
        const writeResults = await withSpinner(
          'Escribiendo archivos...',
          () => engine.writeFiles(result.files, options.targetDir, { force: options.force }),
        );

        // C3: Save initial meta with fileContents and trackedDependencies
        const ruleGovernance: Record<string, GovernanceLevel> = {};
        for (const file of result.files) {
          if (file.governance) {
            ruleGovernance[file.path] = file.governance;
          }
        }
        // C5: extract real dependency names from detection evidence (deduplicated)
        const trackedDeps = extractTrackedDeps(confirmedDetection.technologies);
        const initialMeta = createMeta(
          result.files,
          confirmedDetection.technologies.map((t) => t.id),
          result.config.appliedProfiles,
          ruleGovernance,
          trackedDeps,
        );
        await saveMeta(options.targetDir, initialMeta);

        // Summary
        log.blank();
        log.header('Resultado');
        for (const wr of writeResults) {
          log.listItem(`${log.actionColor(wr.action)} ${wr.path}`);
        }

        const created = writeResults.filter((r) => r.action === 'created').length;
        const updated = writeResults.filter((r) => r.action === 'updated').length;
        log.blank();
        log.success(`Configuración generada: ${created} archivos creados, ${updated} actualizados.`);
        log.dim('Ejecuta `diverger check` para validar la configuración.');

        if (options.output === 'json') {
          log.jsonOutput({
            detection: confirmedDetection,
            files: writeResults,
          });
        }
      } catch (err) {
        log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
