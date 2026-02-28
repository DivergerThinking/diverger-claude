import type { MonorepoInfo, WorkspacePackage } from '../core/types.js';
import { DetectionEngine } from '../detection/index.js';
import path from 'path';

/** Resolve and analyze each workspace package */
export async function resolveWorkspaces(
  monorepo: MonorepoInfo,
): Promise<WorkspacePackage[]> {
  const engine = new DetectionEngine();
  const resolvedPackages: WorkspacePackage[] = [];

  for (const pkg of monorepo.packages) {
    const pkgRoot = path.join(monorepo.rootDir, pkg.path);
    const detection = await engine.detect(pkgRoot);

    resolvedPackages.push({
      ...pkg,
      technologies: detection.technologies,
    });
  }

  return resolvedPackages;
}
