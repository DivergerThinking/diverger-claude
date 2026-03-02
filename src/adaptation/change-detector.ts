import type { DivergentMeta } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { hashMatches } from '../utils/hash.js';
import { resolveMetaKey } from '../utils/paths.js';
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

/** Extract dependency names from package.json content */
function extractNodeDeps(content: string): string[] {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  } catch {
    return [];
  }
}

/** Extract dependency module paths from go.mod content */
function extractGoDeps(content: string): string[] {
  const deps: string[] = [];
  // Match "require" block entries: single-line and block form
  const requireBlockRegex = /require\s*\(([\s\S]*?)\)/g;
  let match;
  while ((match = requireBlockRegex.exec(content)) !== null) {
    const block = match[1]!;
    for (const line of block.split('\n')) {
      const depMatch = line.trim().match(/^(\S+)\s/);
      if (depMatch && !depMatch[1]!.startsWith('//')) {
        deps.push(depMatch[1]!);
      }
    }
  }
  // Single-line require: require github.com/foo/bar v1.2.3
  // Negative lookahead to avoid matching "require (" which starts a block
  const singleRequireRegex = /^require\s+(?!\()(\S+)\s/gm;
  while ((match = singleRequireRegex.exec(content)) !== null) {
    deps.push(match[1]!);
  }
  return deps;
}

/** Extract dependency names from Cargo.toml content (simplified) */
function extractRustDeps(content: string): string[] {
  const deps: string[] = [];
  // Match [dependencies] and [dev-dependencies] sections
  const sectionRegex = /^\[(dev-)?dependencies\]\s*$/gm;
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(content)) !== null) {
    const startIdx = sectionMatch.index + sectionMatch[0].length;
    const remaining = content.slice(startIdx);
    // Read until next section header
    const nextSection = remaining.search(/^\[/m);
    const sectionContent = nextSection >= 0 ? remaining.slice(0, nextSection) : remaining;
    for (const line of sectionContent.split('\n')) {
      const depMatch = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
      if (depMatch) {
        deps.push(depMatch[1]!);
      }
    }
  }
  return deps;
}

/** Extract dependency names from Python requirements.txt or pyproject.toml */
function extractPythonDeps(reqContent: string | null, pyprojectContent: string | null): string[] {
  const deps: string[] = [];
  if (reqContent) {
    for (const line of reqContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
        const nameMatch = trimmed.match(/^([a-zA-Z0-9_-]+)/);
        if (nameMatch) deps.push(nameMatch[1]!.toLowerCase());
      }
    }
  }
  if (pyprojectContent) {
    // Simple extraction of dependency names from pyproject.toml (not full TOML parsing
    // to avoid importing heavy parsers; this runs in the session hook path)
    const depLineRegex = /["']([a-zA-Z0-9_-]+)(?:\[.*?\])?(?:[><=!~].*)?["']/g;
    let match;
    while ((match = depLineRegex.exec(pyprojectContent)) !== null) {
      deps.push(match[1]!.toLowerCase());
    }
  }
  return deps;
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

    // Resolve the meta key (relative or absolute) to an absolute path
    const absolutePath = resolveMetaKey(storedPath, projectRoot);

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

  // Compare current dependencies against meta.trackedDependencies
  // Fallback: if trackedDependencies is missing (old meta), use empty array
  const tracked = meta.trackedDependencies ?? [];
  if (tracked.length > 0) {
    // Collect current deps from all supported manifest files
    const allCurrentDeps: string[] = [];

    // Node.js: package.json
    const pkgContent = await readFileOrNull(path.join(projectRoot, 'package.json'));
    if (pkgContent) {
      allCurrentDeps.push(...extractNodeDeps(pkgContent));
    }

    // Go: go.mod
    const goModContent = await readFileOrNull(path.join(projectRoot, 'go.mod'));
    if (goModContent) {
      allCurrentDeps.push(...extractGoDeps(goModContent));
    }

    // Rust: Cargo.toml
    const cargoContent = await readFileOrNull(path.join(projectRoot, 'Cargo.toml'));
    if (cargoContent) {
      allCurrentDeps.push(...extractRustDeps(cargoContent));
    }

    // Python: requirements.txt and pyproject.toml
    const reqContent = await readFileOrNull(path.join(projectRoot, 'requirements.txt'));
    const pyprojectContent = await readFileOrNull(path.join(projectRoot, 'pyproject.toml'));
    if (reqContent || pyprojectContent) {
      allCurrentDeps.push(...extractPythonDeps(reqContent, pyprojectContent));
    }

    if (allCurrentDeps.length > 0) {
      const trackedLower = tracked.map((s) => s.toLowerCase());

      // Find new dependencies not in the tracked list
      const trackedSet = new Set(trackedLower);
      for (const dep of allCurrentDeps) {
        if (!trackedSet.has(dep.toLowerCase())) {
          newDependencies.push(dep);
        }
      }
    }

    // Find removed dependencies: tracked deps no longer in any manifest
    // This runs even when allCurrentDeps is empty (all manifests removed)
    {
      const allDepsLowerSet = new Set(allCurrentDeps.map((d) => d.toLowerCase()));
      for (const trackedItem of tracked) {
        if (!allDepsLowerSet.has(trackedItem.toLowerCase())) {
          removedDependencies.push(trackedItem);
        }
      }
    }
  }

  return {
    hasChanges: changedFiles.length > 0 || newDependencies.length > 0 || removedDependencies.length > 0,
    changedFiles,
    newDependencies,
    removedDependencies,
  };
}
