import type { DetectedTechnology, DetectionResult } from '../core/types.js';
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
  async detect(projectRoot: string): Promise<DetectionResult> {
    // Step 1: Scan filesystem for relevant files
    const files = await this.scanner.scan(projectRoot);

    // Step 2: Run all analyzers
    const analyzers = getAllAnalyzers();
    const allTechnologies: DetectedTechnology[] = [];

    for (const analyzer of analyzers) {
      // Filter files relevant to this analyzer
      const relevantFiles = await this.scanner.scanPatterns(
        projectRoot,
        analyzer.filePatterns,
      );

      if (analyzer.hasRelevantFiles(relevantFiles)) {
        const result = await analyzer.analyze(relevantFiles, projectRoot);
        allTechnologies.push(...result.technologies);
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
