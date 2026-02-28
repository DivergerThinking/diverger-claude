import type { DivergentMeta } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { sha256 } from '../utils/hash.js';
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

/** Detects changes in project dependencies and configuration since last generation */
export async function detectChanges(
  projectRoot: string,
  meta: DivergentMeta,
): Promise<ChangeDetectionResult> {
  const changedFiles: string[] = [];
  const newDependencies: string[] = [];
  const removedDependencies: string[] = [];

  // Check if key files changed since last generation
  const filesToCheck = [
    'package.json',
    'pyproject.toml',
    'requirements.txt',
    'pom.xml',
    'build.gradle',
    'go.mod',
    'Cargo.toml',
  ];

  for (const file of filesToCheck) {
    const filePath = path.join(projectRoot, file);
    const content = await readFileOrNull(filePath);
    if (content === null) continue;

    // Check against stored hash (if we have one)
    const storedHash = meta.fileHashes[filePath];
    if (storedHash) {
      const currentHash = `sha256:${sha256(content)}`;
      if (currentHash !== storedHash) {
        changedFiles.push(file);
      }
    }
  }

  // Compare detected stack with stored stack
  // (simple comparison - full re-detection happens in sync)
  const pkgContent = await readFileOrNull(path.join(projectRoot, 'package.json'));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const allDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

      for (const dep of allDeps) {
        if (!meta.detectedStack.some((s) => s.toLowerCase().includes(dep.toLowerCase()))) {
          newDependencies.push(dep);
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return {
    hasChanges: changedFiles.length > 0 || newDependencies.length > 0,
    changedFiles,
    newDependencies,
    removedDependencies,
  };
}
