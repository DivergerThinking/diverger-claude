import type {
  CliOptions,
  ComposedConfig,
  DetectedTechnology,
  DetectionResult,
  DiffEntry,
  GenerationResult,
  KnowledgeResult,
  MergeAllResult,
} from './types.js';
import { DetectionEngine } from '../detection/index.js';
import { ProfileEngine } from '../profiles/index.js';
import { GenerationEngine } from '../generation/index.js';
import { GovernanceEngine } from '../governance/index.js';
import { KnowledgeEngine } from '../knowledge/index.js';
import { CONFIDENCE_THRESHOLD } from './constants.js';
import { ApiKeyError, BillingError, extractErrorMessage } from './errors.js';
import { loadMeta } from '../governance/history.js';

export interface EngineContext {
  projectRoot: string;
  options: CliOptions;
  /** Callback when user confirmation is needed */
  onConfirm?: (message: string, technologies: string[]) => Promise<boolean>;
  /** Callback for knowledge search permission */
  onKnowledgePermission?: (technology: string) => Promise<boolean>;
  /** Callback for non-fatal warnings (e.g. knowledge fetch failures) */
  onWarning?: (message: string) => void;
  /** Callback for progress updates during generation */
  onProgress?: (message: string) => void;
  /** Pre-resolved knowledge permissions (tech name → allowed) */
  knowledgePermissions?: Map<string, boolean>;
  /** Tech IDs to preserve from filtering (e.g. from previous init's meta) */
  _preservedTechIds?: string[];
}

/**
 * Main orchestrator: detection → composition → generation
 */
export class DivergerEngine {
  private detection: DetectionEngine;
  private profiles: ProfileEngine;
  private generation: GenerationEngine;
  private governance: GovernanceEngine;
  private knowledge: KnowledgeEngine;

  constructor() {
    this.detection = new DetectionEngine();
    this.profiles = new ProfileEngine();
    this.generation = new GenerationEngine();
    this.governance = new GovernanceEngine();
    this.knowledge = new KnowledgeEngine();
  }

  /** Full pipeline: detect → compose → generate */
  async init(ctx: EngineContext): Promise<GenerationResult> {
    // Step 1: Detect technologies
    const detection = await this.detect(ctx);

    // Step 2: Filter by confidence (ask user for low-confidence)
    const confirmed = await this.confirmDetection(detection, ctx);

    // Step 3: Run pipeline with confirmed detection
    return this.initWithDetection(confirmed, ctx);
  }

  /** Run pipeline with pre-confirmed detection (skips re-detection) */
  async initWithDetection(detection: DetectionResult, ctx: EngineContext): Promise<GenerationResult> {
    // C4: fetchKnowledge now returns results to inject into composed config
    const knowledgeResults = await this.fetchKnowledge(detection, ctx);

    const profileNames = detection.technologies.map((t) => t.name).join(', ');
    ctx.onProgress?.(`Componiendo profiles (${profileNames})...`);
    const composed = this.compose(detection);
    if (knowledgeResults.length > 0) {
      composed.knowledge = knowledgeResults;
      // Inject knowledge as CLAUDE.md sections
      for (const kr of knowledgeResults) {
        const heading = `Best Practices: ${kr.technology}`;
        composed.claudeMdSections.push({
          heading,
          content: `## ${heading}\n\n${kr.content}`,
          order: 50, // after all profile layers
        });
      }
    }

    ctx.onProgress?.('Generando archivos de configuración...');
    const result = await this.generation.generate(composed, ctx.projectRoot, detection, ctx.onProgress);
    return result;
  }

  /** Detect technologies in the project */
  async detect(ctx: EngineContext): Promise<DetectionResult> {
    return this.detection.detect(ctx.projectRoot, { onWarning: ctx.onWarning });
  }

  /** Compute diff without writing (dry-run) */
  async diff(ctx: EngineContext): Promise<DiffEntry[]> {
    const result = await this.init({ ...ctx, options: { ...ctx.options, dryRun: true } });
    return this.generation.computeDiff(result, ctx.projectRoot);
  }

  /** Compute diff from pre-generated result */
  async computeDiff(result: GenerationResult, projectRoot: string): Promise<DiffEntry[]> {
    return this.generation.computeDiff(result, projectRoot);
  }

  /** Sync: detect changes and apply updates with three-way merge (C3: returns MergeAllResult) */
  async sync(ctx: EngineContext): Promise<MergeAllResult> {
    // Preserve previously-confirmed techs so sync doesn't drop them due to low confidence
    const oldMeta = await loadMeta(ctx.projectRoot);
    const syncCtx = oldMeta ? { ...ctx, _preservedTechIds: oldMeta.detectedStack } : ctx;
    const result = await this.init(syncCtx);
    return this.governance.mergeAll(result, ctx.projectRoot);
  }

  /** Write generated files to disk */
  async writeFiles(
    files: import('./types.js').GeneratedFile[],
    projectRoot: string,
    options: { force?: boolean; dryRun?: boolean } = {},
  ) {
    return this.generation.writeFiles(files, projectRoot, options);
  }

  /** Check: validate existing config (A8: returns ValidationResult directly) */
  async check(_ctx: EngineContext): Promise<import('../governance/validator.js').ValidationResult> {
    return this.governance.validate(_ctx.projectRoot);
  }

  private async confirmDetection(
    detection: DetectionResult,
    ctx: EngineContext,
  ): Promise<DetectionResult> {
    if (ctx.options.force) return detection;

    const lowConfidence = detection.technologies.filter(
      (t) => t.confidence < CONFIDENCE_THRESHOLD,
    );

    if (lowConfidence.length > 0) {
      if (ctx.onConfirm) {
        const names = lowConfidence.map(
          (t) => `${t.name} (${t.confidence}%)`,
        );
        const confirmed = await ctx.onConfirm(
          'Se detectaron tecnologías con baja confianza. ¿Incluirlas?',
          names,
        );
        if (!confirmed) {
          return {
            ...detection,
            technologies: detection.technologies.filter(
              (t) => t.confidence >= CONFIDENCE_THRESHOLD,
            ),
          };
        }
      } else {
        // Non-interactive: filter low-confidence techs automatically (parity with init)
        // But preserve techs from previous init's meta (sync should not drop confirmed techs)
        const preserved = new Set(ctx._preservedTechIds ?? []);
        return {
          ...detection,
          technologies: detection.technologies.filter(
            (t) => t.confidence >= CONFIDENCE_THRESHOLD || preserved.has(t.id),
          ),
        };
      }
    }

    return detection;
  }

  /** Get the list of technologies eligible for knowledge fetch */
  getKnowledgeTechs(detection: DetectionResult): DetectedTechnology[] {
    return detection.technologies.filter(
      (t) => t.category === 'framework' || t.category === 'language' || t.category === 'mobile',
    );
  }

  private async fetchKnowledge(
    detection: DetectionResult,
    ctx: EngineContext,
  ): Promise<KnowledgeResult[]> {
    // A2: skip knowledge fetch entirely in dry-run mode
    if (ctx.options.dryRun) return [];

    // Use pre-resolved permissions if available, otherwise fall back to callback
    const permissions = ctx.knowledgePermissions;
    if (!permissions && !ctx.onKnowledgePermission) return [];

    // Initialize the knowledge cache for this project
    this.knowledge.initCache(ctx.projectRoot);

    const eligibleTechs = this.getKnowledgeTechs(detection);
    const results: KnowledgeResult[] = [];
    for (const tech of eligibleTechs) {
      const allowed = permissions
        ? permissions.get(tech.name) ?? false
        : await ctx.onKnowledgePermission!(tech.name);
      if (allowed) {
        ctx.onProgress?.(`Buscando best practices de ${tech.name}...`);
        // A3: wrap in try/catch so API failures don't abort the pipeline
        try {
          const result = await this.knowledge.fetchBestPractices(tech);
          if (result.fromCache) {
            ctx.onProgress?.(`Best practices de ${tech.name} (caché)`);
          }
          results.push(result);
        } catch (err) {
          ctx.onWarning?.(extractErrorMessage(err));
          // Stop trying remaining techs if the error is account-level (not transient)
          if (err instanceof ApiKeyError || err instanceof BillingError) {
            ctx.onProgress?.('Omitiendo búsqueda de best practices (continuando sin ellas)...');
            break;
          }
        }
      }
    }
    return results;
  }

  private compose(detection: DetectionResult): ComposedConfig {
    return this.profiles.compose(detection);
  }
}
