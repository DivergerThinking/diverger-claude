import path from 'path';
import type { ComposedConfig, DetectionResult, WorkspacePackage } from '../core/types.js';
import { ProfileEngine } from '../profiles/index.js';

export interface MonorepoConfigPlan {
  /** Root-level config (shared across all packages) */
  root: ComposedConfig;
  /** Per-package configs */
  packages: Array<{
    package: WorkspacePackage;
    config: ComposedConfig;
  }>;
}

/** Generate configuration plan for a monorepo */
export function planMonorepoConfig(
  rootDetection: DetectionResult,
  packages: WorkspacePackage[],
): MonorepoConfigPlan {
  const engine = new ProfileEngine();

  // Root config: based on root-level detection
  const root = engine.compose(rootDetection);

  // Per-package configs
  const packageConfigs = packages.map((pkg) => {
    const pkgDetection: DetectionResult = {
      technologies: pkg.technologies,
      rootDir: path.join(rootDetection.rootDir, pkg.path),
      detectedAt: new Date().toISOString(),
    };

    return {
      package: pkg,
      config: engine.compose(pkgDetection),
    };
  });

  return { root, packages: packageConfigs };
}
