import type { DetectedTechnology, DetectionResult } from '../core/types.js';
import { extractErrorMessage } from '../core/errors.js';
import { FileScanner } from './scanner.js';
import { getAllAnalyzers } from './analyzers/index.js';
import { ConfidenceScorer } from './scoring.js';
import { detectMonorepo } from './patterns/monorepo.js';
import { detectArchitecture } from './patterns/architecture.js';

/**
 * Main detection engine facade.
 * Orchestrates scanning → analysis → scoring → pattern detection.
 */
export class DetectionEngine {
  private scanner: FileScanner;
  private scorer: ConfidenceScorer;

  constructor() {
    this.scanner = new FileScanner();
    this.scorer = new ConfidenceScorer();
  }

  /** Run full detection on a project directory */
  async detect(projectRoot: string, options?: { onWarning?: (msg: string) => void }): Promise<DetectionResult> {
    // Step 1: Run all analyzers
    const analyzers = getAllAnalyzers();
    const allTechnologies: DetectedTechnology[] = [];

    // Collect all file patterns from all analyzers plus patterns needed by
    // monorepo/architecture pattern detectors, and scan once
    const extraPatterns = [
      'turbo.json', 'lerna.json', 'nx.json', 'pnpm-workspace.yaml', '.npmrc',
      'vercel.json', 'netlify.toml',
      'serverless.yml', 'serverless.yaml', 'serverless.ts',
      'template.yaml', 'template.yml', 'cdk.json', 'sam.json',
    ];
    const allPatterns = [...new Set([...analyzers.flatMap((a) => a.filePatterns), ...extraPatterns])];

    // Collect root-only patterns: extra patterns (monorepo/architecture configs) are always root-only,
    // plus any patterns explicitly marked by individual analyzers
    const rootOnly = new Set<string>([
      ...extraPatterns,
      ...analyzers.flatMap((a) => a.rootOnlyPatterns ?? []),
    ]);

    const files = await this.scanner.scanPatterns(projectRoot, allPatterns, rootOnly);

    // Step 2: Pass the combined scan result to each analyzer (isolated: one failure doesn't stop others)
    for (const analyzer of analyzers) {
      try {
        if (analyzer.hasRelevantFiles(files)) {
          const result = await analyzer.analyze(files, projectRoot);
          allTechnologies.push(...result.technologies);
        }
      } catch (err: unknown) {
        options?.onWarning?.(`[diverger] Warning: ${analyzer.name} analyzer failed: ${extractErrorMessage(err)}`);
      }
    }

    // Step 3: Deduplicate (same tech from multiple analyzers)
    const deduped = this.deduplicateTechnologies(allTechnologies);

    // Step 4: Apply cross-technology boosting
    const boosted = this.scorer.applyBoosting(deduped);

    // Step 5: Sort by confidence (descending)
    boosted.sort((a, b) => b.confidence - a.confidence);

    // Step 6: Detect monorepo structure
    const monorepo = await detectMonorepo(files, projectRoot);

    // Step 7: Detect architecture pattern
    const architecture = detectArchitecture(boosted, monorepo, files);

    return {
      technologies: boosted,
      monorepo,
      architecture,
      rootDir: projectRoot,
      detectedAt: new Date().toISOString(),
    };
  }

  /** Merge duplicate technology detections, keeping highest confidence + all evidence */
  private deduplicateTechnologies(technologies: DetectedTechnology[]): DetectedTechnology[] {
    const map = new Map<string, DetectedTechnology>();

    for (const tech of technologies) {
      const existing = map.get(tech.id);
      if (existing) {
        // Merge evidence
        existing.evidence.push(...tech.evidence);
        // Recalculate confidence
        existing.confidence = this.scorer.calculateConfidence(existing.evidence);
        // Keep version if we didn't have one
        if (!existing.version && tech.version) {
          existing.version = tech.version;
          existing.majorVersion = tech.majorVersion;
        }
        // Merge profile IDs
        const profileSet = new Set([...existing.profileIds, ...tech.profileIds]);
        existing.profileIds = [...profileSet];
      } else {
        map.set(tech.id, { ...tech });
      }
    }

    return [...map.values()];
  }
}
