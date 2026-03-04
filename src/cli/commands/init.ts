import type { Command } from 'commander';
import { DivergerEngine } from '../../core/engine.js';
import type { CliOptions, ComposedConfig, DetectionResult, GovernanceLevel, KnowledgeResult } from '../../core/types.js';
import type { WriteResult } from '../../generation/file-writer.js';
import { CONFIDENCE_THRESHOLD } from '../../core/constants.js';
import { createMeta, saveMeta } from '../../governance/history.js';
import { extractTrackedDeps } from '../../governance/index.js';
import { toRelativeMetaKey } from '../../utils/paths.js';
import { runGreenfieldWizard } from '../../greenfield/wizard.js';
import { withSpinner, createSpinner } from '../ui/spinner.js';
import { confirmTechnologies, askKnowledgePermission } from '../ui/prompts.js';
import { DivergerError, extractErrorMessage } from '../../core/errors.js';
import * as log from '../ui/logger.js';
import { displayDiffs, displayDiffSummary } from '../ui/diff-display.js';
import { buildSummary } from '../ui/summary.js';
import { detectPluginInstalled, shouldSuppressDeprecation } from '../plugin-detect.js';
import { recordEvent } from '../../telemetry/index.js';

interface InitResult {
  writeResults: WriteResult[];
  composed: ComposedConfig;
  knowledgeResults?: KnowledgeResult[];
}

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
      // Exit with error code so CI pipelines catch empty projects
      process.exit(1);
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
    const message = extractErrorMessage(err);
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

  // C1: Skip knowledge prompts when API key is not available — profiles already include embedded best practices
  if (!process.env.ANTHROPIC_API_KEY) return permissions;

  const eligibleTechs = engine.getKnowledgeTechs(confirmed);
  if (eligibleTechs.length === 0) return permissions;

  log.blank();
  for (const tech of eligibleTechs) {
    const allowed = await askKnowledgePermission(tech.name);
    permissions.set(tech.name, allowed);
  }

  return permissions;
}

/** Generate config, write files, and save meta. Returns write results + composed config. */
async function generateAndWrite(
  engine: DivergerEngine,
  confirmed: DetectionResult,
  options: CliOptions,
): Promise<InitResult> {
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
    const message = extractErrorMessage(err);
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

  return {
    writeResults,
    composed: result.config,
    knowledgeResults: result.config.knowledge,
  };
}

/** Display init summary with written files and detailed box. */
function showInitSummary(
  initResult: InitResult,
  confirmed: DetectionResult,
  options: CliOptions,
): void {
  const { writeResults, composed, knowledgeResults } = initResult;

  log.blank();
  log.header('Resultado');
  for (const wr of writeResults) {
    log.listItem(`${log.actionColor(wr.action)} ${wr.path}`);
  }
  log.blank();

  // Show detailed summary box (rich mode only)
  if (options.output === 'rich') {
    const summary = buildSummary(confirmed, composed, writeResults, knowledgeResults);
    console.log(summary);  
    log.blank();
  }

  if (options.output === 'json') {
    log.jsonOutput({
      detection: confirmed,
      files: writeResults,
      profiles: composed.appliedProfiles,
      ruleCount: composed.rules.length,
      agentCount: composed.agents.length,
    });
  }
}

/**
 * Programmatic init -- no interactive prompts, no banners, just engine calls.
 * Used for post-install auto-init in `diverger plugin install`.
 */
export async function performInit(opts: {
  targetDir: string;
  force?: boolean;
  pluginMode?: boolean;
  outputMode?: 'rich' | 'quiet' | 'json';
}): Promise<{ success: boolean; profileCount?: number }> {
  const options: CliOptions = {
    output: opts.outputMode ?? 'quiet',
    force: opts.force ?? false,
    dryRun: false,
    targetDir: opts.targetDir,
    pluginMode: opts.pluginMode ?? false,
  };

  const engine = new DivergerEngine();

  try {
    const detection = await engine.detect({
      projectRoot: opts.targetDir,
      options,
    });

    // Apply confidence threshold (non-interactive)
    const confirmed: DetectionResult = {
      ...detection,
      technologies: detection.technologies.filter(
        (t) => t.confidence >= CONFIDENCE_THRESHOLD,
      ),
    };

    if (confirmed.technologies.length === 0) {
      return { success: false };
    }

    const ctx = {
      projectRoot: opts.targetDir,
      options,
    };

    const result = await engine.initWithDetection(confirmed, ctx);
    await engine.writeFiles(result.files, opts.targetDir, { force: options.force });

    // Save meta
    const ruleGovernance: Record<string, GovernanceLevel> = {};
    for (const file of result.files) {
      if (file.governance) {
        ruleGovernance[toRelativeMetaKey(file.path, opts.targetDir)] = file.governance;
      }
    }
    const trackedDeps = extractTrackedDeps(confirmed.technologies);
    const initialMeta = createMeta(
      result.files,
      confirmed.technologies.map((t) => t.id),
      result.config.appliedProfiles,
      ruleGovernance,
      trackedDeps,
      opts.targetDir,
    );
    await saveMeta(opts.targetDir, initialMeta);

    return {
      success: true,
      profileCount: result.config.appliedProfiles.length,
    };
  } catch {
    return { success: false };
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Detectar stack y generar configuración .claude/')
    .option('-f, --force', 'Sobrescribir archivos existentes sin preguntar', false)
    .option('-d, --dry-run', 'Mostrar qué se generaría sin escribir', false)
    .option('--plugin-mode', 'Excluir componentes universales (proporcionados por plugin)', false)
    .option('--no-plugin', 'Forzar modo completo (ignorar plugin instalado)', false)
    .option('--dir <path>', 'Directorio objetivo (por defecto: directorio actual)')
    .action(async (opts) => {
      const startTime = Date.now();
      const targetDir = opts.dir ?? process.cwd();
      const outputMode = log.getOutputMode();

      // Phase 4A: Auto-detect plugin — activate pluginMode automatically
      let pluginMode = opts.pluginMode ?? false;
      if (!pluginMode && opts.plugin !== false) {
        const pluginPath = detectPluginInstalled(targetDir);
        if (pluginPath) {
          pluginMode = true;
          if (!shouldSuppressDeprecation(outputMode)) {
            log.info('Plugin diverger-claude detectado. Generando solo configuración tech-specific.');
          }
        }
      }

      // Phase 4B: Deprecation notice when CLI is used without plugin
      if (!pluginMode && !shouldSuppressDeprecation(outputMode)) {
        log.dim('diverger-claude ahora está disponible como plugin de Claude Code.');
        log.dim('Instala con: diverger plugin install');
        log.dim('El CLI seguirá funcionando pero el plugin es la vía recomendada.');
        log.blank();
      }

      const options: CliOptions = {
        output: outputMode,
        force: opts.force ?? false,
        dryRun: opts.dryRun ?? false,
        targetDir,
        pluginMode,
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

        const initResult = await generateAndWrite(engine, confirmed, options);
        showInitSummary(initResult, confirmed, options);

        recordEvent({
          command: 'init',
          pluginMode: options.pluginMode ?? false,
          detectedStack: confirmed.technologies.map((t) => t.id),
          profileCount: initResult.composed.appliedProfiles?.length ?? 0,
          durationMs: Date.now() - startTime,
        }).catch(() => {}); // fire-and-forget, never block CLI
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
