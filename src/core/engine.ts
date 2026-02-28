import type {
  CliOptions,
  ComposedConfig,
  DetectionResult,
  DiffEntry,
  GenerationResult,
  MergeResult,
} from './types.js';
import { DetectionEngine } from '../detection/index.js';
import { ProfileEngine } from '../profiles/index.js';
import { GenerationEngine } from '../generation/index.js';
import { GovernanceEngine } from '../governance/index.js';
import { KnowledgeEngine } from '../knowledge/index.js';
import { CONFIDENCE_THRESHOLD } from './constants.js';

export interface EngineContext {
  projectRoot: string;
  options: CliOptions;
  /** Callback when user confirmation is needed */
  onConfirm?: (message: string, technologies: string[]) => Promise<boolean>;
  /** Callback for knowledge search permission */
  onKnowledgePermission?: (technology: string) => Promise<boolean>;
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

    // Step 3: Optionally fetch knowledge
    await this.fetchKnowledge(confirmed, ctx);

    // Step 4: Compose profiles
    const composed = this.compose(confirmed);

    // Step 5: Generate files
    return this.generation.generate(composed, ctx.projectRoot);
  }

  /** Detect technologies in the project */
  async detect(ctx: EngineContext): Promise<DetectionResult> {
    return this.detection.detect(ctx.projectRoot);
  }

  /** Compute diff without writing (dry-run) */
  async diff(ctx: EngineContext): Promise<DiffEntry[]> {
    const result = await this.init({ ...ctx, options: { ...ctx.options, dryRun: true } });
    return this.generation.computeDiff(result, ctx.projectRoot);
  }

  /** Sync: detect changes and apply updates with three-way merge */
  async sync(ctx: EngineContext): Promise<MergeResult[]> {
    const result = await this.init(ctx);
    return this.governance.mergeAll(result, ctx.projectRoot);
  }

  /** Check: validate existing config */
  async check(_ctx: EngineContext): Promise<{ valid: boolean; issues: Array<{ severity: string; file: string; message: string }> }> {
    return this.governance.validate(_ctx.projectRoot) as Promise<{ valid: boolean; issues: Array<{ severity: string; file: string; message: string }> }>;
  }

  private async confirmDetection(
    detection: DetectionResult,
    ctx: EngineContext,
  ): Promise<DetectionResult> {
    if (ctx.options.force) return detection;

    const lowConfidence = detection.technologies.filter(
      (t) => t.confidence < CONFIDENCE_THRESHOLD,
    );

    if (lowConfidence.length > 0 && ctx.onConfirm) {
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
    }

    return detection;
  }

  private async fetchKnowledge(
    detection: DetectionResult,
    ctx: EngineContext,
  ): Promise<void> {
    if (!ctx.onKnowledgePermission) return;

    for (const tech of detection.technologies) {
      if (tech.category === 'framework' || tech.category === 'language') {
        const allowed = await ctx.onKnowledgePermission(tech.name);
        if (allowed) {
          await this.knowledge.fetchBestPractices(tech);
        }
      }
    }
  }

  private compose(detection: DetectionResult): ComposedConfig {
    return this.profiles.compose(detection);
  }
}
