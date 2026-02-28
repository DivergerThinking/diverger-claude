import type { GenerationResult, GovernanceLevel, MergeResult } from '../core/types.js';
import { ThreeWayMerge } from './merge.js';
import { loadMeta, saveMeta, createMeta } from './history.js';
import { validateConfig, type ValidationResult } from './validator.js';

/**
 * Governance engine facade.
 * Handles three-way merges, validation, and rule governance.
 */
export class GovernanceEngine {
  private merger: ThreeWayMerge;

  constructor() {
    this.merger = new ThreeWayMerge();
  }

  /** Perform three-way merge for all generated files */
  async mergeAll(result: GenerationResult, projectRoot: string): Promise<MergeResult[]> {
    const meta = await loadMeta(projectRoot);

    // Build rule governance map from generated files
    const ruleGovernance: Record<string, GovernanceLevel> = {};
    for (const file of result.files) {
      if (file.governance) {
        ruleGovernance[file.path] = file.governance;
      }
    }

    // Pass governance map to the merger so it can enforce mandatory rules
    const mergeResults = await this.merger.mergeAll(result.files, meta, ruleGovernance);

    // Save updated metadata
    const newMeta = createMeta(
      result.files,
      result.detection?.technologies?.map((t) => t.id) ?? [],
      result.config.appliedProfiles,
      ruleGovernance,
    );
    await saveMeta(projectRoot, newMeta);

    return mergeResults;
  }

  /** Validate existing configuration */
  async validate(projectRoot: string): Promise<ValidationResult> {
    const meta = await loadMeta(projectRoot);
    return validateConfig(projectRoot, meta);
  }
}
