import type { GenerationResult, GovernanceLevel, MergeAllResult } from '../core/types.js';
import { ThreeWayMerge } from './merge.js';
import { loadMeta, createMeta } from './history.js';
import { validateConfig, type ValidationResult } from './validator.js';
import { toRelativeMetaKey } from '../utils/paths.js';

/** Extract real package names from detection evidence (C5).
 *  Prefers the explicit trackedPackage field; falls back to regex on description for backward-compat.
 *  Exported so init.ts can reuse the same logic instead of duplicating the regex. */
export function extractTrackedDeps(technologies: Array<{ evidence: Array<{ description: string; trackedPackage?: string }> }>): string[] {
  const deps = new Set<string>();
  for (const tech of technologies) {
    for (const ev of tech.evidence) {
      if (ev.trackedPackage) {
        deps.add(ev.trackedPackage);
      } else {
        const match = ev.description.match(/Found "(.+?)" in dependencies/);
        if (match) deps.add(match[1]!);
      }
    }
  }
  return [...deps];
}

/**
 * Governance engine facade.
 * Handles three-way merges, validation, and rule governance.
 */
export class GovernanceEngine {
  private merger: ThreeWayMerge;

  constructor() {
    this.merger = new ThreeWayMerge();
  }

  /**
   * Perform three-way merge for all generated files.
   * C3: Returns MergeAllResult with pendingMeta. The caller must write files
   * to disk FIRST, then call finalizeMetaAfterWrite + saveMeta.
   */
  async mergeAll(result: GenerationResult, projectRoot: string): Promise<MergeAllResult> {
    const meta = await loadMeta(projectRoot);

    // Build rule governance map from generated files with relative keys
    const ruleGovernance: Record<string, GovernanceLevel> = {};
    for (const file of result.files) {
      if (file.governance) {
        ruleGovernance[toRelativeMetaKey(file.path, projectRoot)] = file.governance;
      }
    }

    // Pass governance map to the merger so it can enforce mandatory rules
    const mergeResults = await this.merger.mergeAll(result.files, meta, ruleGovernance, projectRoot);

    // C5: extract real npm dependency names from detection evidence
    const trackedDependencies = extractTrackedDeps(result.detection?.technologies ?? []);

    // C3: Build pending meta but do NOT save it yet — caller saves after writing files
    const pendingMeta = createMeta(
      result.files,
      result.detection?.technologies?.map((t) => t.id) ?? [],
      result.config.appliedProfiles,
      ruleGovernance,
      trackedDependencies,
      projectRoot,
    );

    return { results: mergeResults, pendingMeta, oldMeta: meta };
  }

  /** Validate existing configuration */
  async validate(projectRoot: string): Promise<ValidationResult> {
    const meta = await loadMeta(projectRoot);
    return validateConfig(projectRoot, meta);
  }
}
