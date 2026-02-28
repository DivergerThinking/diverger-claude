import type { DivergentMeta } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { hashMatches } from '../utils/hash.js';
import path from 'path';

export interface ChangeDetectionResult {
  /** Whether any changes were detected */
  hasChanges: boolean;
  /** Files that changed */
  changedFiles: string[];
  /** New dependencies added */
  newDependencies: string[];
  /** Dependencies removed */
  removedDependencies: string[];
}

/** Normalize a file path to forward slashes for cross-platform consistency */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/** Detects changes in project dependencies and configuration since last generation */
export async function detectChanges(
  projectRoot: string,
  meta: DivergentMeta,
): Promise<ChangeDetectionResult> {
  const changedFiles: string[] = [];
  const newDependencies: string[] = [];
  const removedDependencies: string[] = [];

  // Check if GENERATED files (tracked in meta.fileHashes) changed on disk
  // meta.fileHashes contains generated files like .claude/CLAUDE.md, settings.json, etc.
  for (const [storedPath, storedHash] of Object.entries(meta.fileHashes)) {
    // Normalize the stored path to forward slashes for comparison
    const normalizedStoredPath = normalizePath(storedPath);

    // Resolve the absolute file path; if stored path is relative, resolve from projectRoot
    const absolutePath = path.isAbsolute(storedPath)
      ? storedPath
      : path.join(projectRoot, storedPath);

    const content = await readFileOrNull(absolutePath);
    if (content === null) {
      // File was deleted from disk
      changedFiles.push(normalizedStoredPath);
      continue;
    }

    if (!hashMatches(content, storedHash)) {
      changedFiles.push(normalizedStoredPath);
    }
  }

  // Compare current dependencies against meta.detectedStack
  const pkgContent = await readFileOrNull(path.join(projectRoot, 'package.json'));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
      const stackLower = meta.detectedStack.map((s) => s.toLowerCase());

      // Find new dependencies not in the detected stack
      for (const dep of allDeps) {
        if (!stackLower.some((s) => s.includes(dep.toLowerCase()))) {
          newDependencies.push(dep);
        }
      }

      // Find removed dependencies: items in detectedStack that are no longer in package.json deps
      const allDepsLower = allDeps.map((d) => d.toLowerCase());
      for (const stackItem of meta.detectedStack) {
        if (!allDepsLower.some((d) => stackItem.toLowerCase().includes(d))) {
          removedDependencies.push(stackItem);
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return {
    hasChanges: changedFiles.length > 0 || newDependencies.length > 0 || removedDependencies.length > 0,
    changedFiles,
    newDependencies,
    removedDependencies,
  };
}
