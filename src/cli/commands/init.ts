import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions, DetectionResult, GovernanceLevel } from '../../core/types.js';
import type { WriteResult } from '../../generation/file-writer.js';
import { CONFIDENCE_THRESHOLD } from '../../core/constants.js';
import { createMeta, saveMeta } from '../../governance/history.js';
import { extractTrackedDeps } from '../../governance/index.js';
import { toRelativeMetaKey } from '../../utils/paths.js';
import { runGreenfieldWizard } from '../../greenfield/wizard.js';
import { withSpinner, createSpinner } from '../ui/spinner.js';
import { confirmTechnologies, askKnowledgePermission } from '../ui/prompts.js';
import { DivergerError } from '../../core/errors.js';
import * as log from '../ui/logger.js';
import { displayDiffs, displayDiffSummary } from '../ui/diff-display.js';

/** Detect technologies and display the detected stack. */
async function detectAndShowStack(
  engine: DivergerEngine,
  options: CliOptions,
): Promise<DetectionResult> {
  const detection = await withSpinner(
    'Analizando proyecto...',
    () => engine.detect({ projectRoot: options.targetDir, options, onWarning: (msg: string) => log.warn(msg) }),
    'Análisis completado',
  );

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

  return detection;
}

/** Confirm detected stack with user or apply thresholds. Returns null to signal abort. */
async function confirmStack(
  detection: DetectionResult,
  options: CliOptions,
): Promise<DetectionResult | null> {
  if (detection.technologies.length === 0) {
    if (!options.force && options.output === 'rich') {
      // B34: invoke greenfield wizard for interactive template selection
      log.blank();
      log.warn('No se detectaron tecnologías en este directorio.');
      return runGreenfieldWizard(options.targetDir);
    } else {
      log.blank();
      log.warn('No se detectaron tecnologías en este directorio.');
      log.dim('Verifica que el directorio contenga archivos de proyecto (package.json, go.mod, etc.).');
      return null;
    }
  }

  if (!options.force && options.output === 'rich') {
    log.blank();
    const selected = await confirmTechnologies(detection.technologies);
    return { ...detection, technologies: selected };
  }

  // B37: in --force or non-interactive modes, apply confidence threshold
  return {
    ...detection,
    technologies: detection.technologies.filter(
      (t) => t.confidence >= CONFIDENCE_THRESHOLD,
    ),
  };
}

/** Handle dry-run mode: compute and display diffs, then return. */
async function handleDryRun(
  engine: DivergerEngine,
  confirmed: DetectionResult,
  options: CliOptions,
): Promise<void> {
  const spinner = createSpinner('Calculando cambios...');
  spinner.start();
  const ctx = {
    projectRoot: options.targetDir,
    options,
    onWarning: (msg: string) => log.warn(msg),
    onProgress: (msg: string) => { spinner.text = msg; },
  };
  let result;
  try {
    result = await engine.initWithDetection(confirmed, ctx);
    spinner.succeed('Cambios calculados');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(`Calculando cambios... - ${message}`);
    throw err;
  }
  const diffs = await engine.computeDiff(result, options.targetDir);
  log.blank();
  log.header('Cambios propuestos (dry-run)');
  displayDiffs(diffs);
  log.blank();
  displayDiffSummary(diffs);
  if (options.output === 'json') {
    log.jsonOutput({ diffs });
  }
}

/** Ask knowledge permissions upfront (before any spinner) */
async function askKnowledgePermissions(
  engine: DivergerEngine,
  confirmed: DetectionResult,
  options: CliOptions,
): Promise<Map<string, boolean>> {
  const permissions = new Map<string, boolean>();
  if (options.force || options.output !== 'rich') return permissions;

  const eligibleTechs = engine.getKnowledgeTechs(confirmed);
  if (eligibleTechs.length === 0) return permissions;

  log.blank();
  for (const tech of eligibleTechs) {
    const allowed = await askKnowledgePermission(tech.name);
    permissions.set(tech.name, allowed);
  }

  return permissions;
}

/** Generate config, write files, and save meta. Returns write results. */
async function generateAndWrite(
  engine: DivergerEngine,
  confirmed: DetectionResult,
  options: CliOptions,
): Promise<WriteResult[]> {
  // Ask knowledge permissions BEFORE starting the spinner
  const knowledgePermissions = await askKnowledgePermissions(engine, confirmed, options);

  const spinner = createSpinner('Generando configuración...');
  spinner.start();

  const ctx = {
    projectRoot: options.targetDir,
    options,
    onWarning: (msg: string) => {
      spinner.warn(msg);
      spinner.start('Generando configuración...');
    },
    knowledgePermissions,
    onProgress: (msg: string) => {
      spinner.text = msg;
    },
  };

  let result;
  try {
    result = await engine.initWithDetection(confirmed, ctx);
    spinner.succeed('Configuración generada');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(`Generando configuración... - ${message}`);
    throw err;
  }

  const writeResults = await withSpinner(
    'Escribiendo archivos...',
    () => engine.writeFiles(result.files, options.targetDir, { force: options.force }),
  );

  // C3: Save initial meta with fileContents and trackedDependencies
  const ruleGovernance: Record<string, GovernanceLevel> = {};
  for (const file of result.files) {
    if (file.governance) {
      ruleGovernance[toRelativeMetaKey(file.path, options.targetDir)] = file.governance;
    }
  }
  // C5: extract real dependency names from detection evidence (deduplicated)
  const trackedDeps = extractTrackedDeps(confirmed.technologies);
  const initialMeta = createMeta(
    result.files,
    confirmed.technologies.map((t) => t.id),
    result.config.appliedProfiles,
    ruleGovernance,
    trackedDeps,
    options.targetDir,
  );
  await saveMeta(options.targetDir, initialMeta);

  return writeResults;
}

/** Display init summary with written files. */
function showInitSummary(
  writeResults: WriteResult[],
  confirmed: DetectionResult,
  options: CliOptions,
): void {
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
      detection: confirmed,
      files: writeResults,
    });
  }
}

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

        const detection = await detectAndShowStack(engine, options);
        const confirmed = await confirmStack(detection, options);
        if (!confirmed) return;

        if (options.dryRun) {
          await handleDryRun(engine, confirmed, options);
          return;
        }

        const writeResults = await generateAndWrite(engine, confirmed, options);
        showInitSummary(writeResults, confirmed, options);
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
