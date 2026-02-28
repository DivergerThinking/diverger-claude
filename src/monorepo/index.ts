import type { DetectionResult } from '../core/types.js';
import { resolveWorkspaces } from './workspace-resolver.js';
import { planMonorepoConfig, type MonorepoConfigPlan } from './config-distributor.js';

/**
 * Monorepo engine facade.
 * Handles workspace resolution and per-package config distribution.
 */
export class MonorepoEngine {
  /** Analyze and plan configuration for a monorepo */
  async plan(detection: DetectionResult): Promise<MonorepoConfigPlan | null> {
    if (!detection.monorepo) return null;

    // Resolve workspace packages with their technologies
    const resolvedPackages = await resolveWorkspaces(detection.monorepo);

    // Plan config distribution
    return planMonorepoConfig(detection, resolvedPackages);
  }
}
