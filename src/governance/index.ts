import type { GenerationResult, MergeResult } from '../core/types.js';
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
    const mergeResults = await this.merger.mergeAll(result.files, meta);

    // Build rule governance map
    const ruleGovernance: Record<string, string> = {};
    for (const file of result.files) {
      if (file.governance) {
        ruleGovernance[file.path] = file.governance;
      }
    }

    // Save updated metadata
    const newMeta = createMeta(
      result.files,
      result.detection?.technologies?.map((t) => t.id) ?? [],
      result.config.appliedProfiles,
      ruleGovernance as Record<string, 'mandatory' | 'recommended'>,
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
