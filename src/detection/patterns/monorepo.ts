import type { MonorepoInfo } from '../../core/types.js';
import { parseJson } from '../../utils/parsers.js';
import { parseYaml } from '../../utils/parsers.js';
import fg from 'fast-glob';
import path from 'path';
import fs from 'fs/promises';

interface PackageJson {
  name?: string;
  workspaces?: string[] | { packages: string[] };
}

interface LernaJson {
  packages?: string[];
}

/** Detect monorepo structure in a project */
export async function detectMonorepo(
  files: Map<string, string>,
  projectRoot: string,
): Promise<MonorepoInfo | undefined> {
  // Check npm/yarn workspaces
  const pkgContent = files.get('package.json');
  if (pkgContent) {
    const pkg = parseJson<PackageJson>(pkgContent, 'package.json');
    const workspaces = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : pkg.workspaces?.packages;

    if (workspaces && workspaces.length > 0) {
      const packages = await resolveWorkspacePackages(projectRoot, workspaces);

      // Determine specific type
      if (files.has('turbo.json')) {
        return { type: 'turborepo', rootDir: projectRoot, packages };
      }
      if (files.has('lerna.json')) {
        return { type: 'lerna', rootDir: projectRoot, packages };
      }
      // Check for pnpm workspaces (only pnpm-workspace.yaml, not just any .npmrc)
      if (files.has('pnpm-workspace.yaml')) {
        return { type: 'pnpm-workspaces', rootDir: projectRoot, packages };
      }
      return { type: 'npm-workspaces', rootDir: projectRoot, packages };
    }
  }

  // Check pnpm workspaces
  const pnpmWs = files.get('pnpm-workspace.yaml');
  if (pnpmWs) {
    try {
      const parsed = parseYaml<{ packages?: string[] }>(pnpmWs);
      if (parsed.packages) {
        const packages = await resolveWorkspacePackages(projectRoot, parsed.packages);
        return { type: 'pnpm-workspaces', rootDir: projectRoot, packages };
      }
    } catch {
      // Malformed yaml
    }
  }

  // Check nx (only report monorepo if actual workspace packages are found)
  if (files.has('nx.json')) {
    const packages = await resolveWorkspacePackages(projectRoot, ['packages/*', 'apps/*', 'libs/*']);
    if (packages.length > 0) {
      return { type: 'nx', rootDir: projectRoot, packages };
    }
  }

  // Check Lerna
  const lernaContent = files.get('lerna.json');
  if (lernaContent) {
    try {
      const lerna = parseJson<LernaJson>(lernaContent, 'lerna.json');
      const patterns = lerna.packages ?? ['packages/*'];
      const packages = await resolveWorkspacePackages(projectRoot, patterns);
      return { type: 'lerna', rootDir: projectRoot, packages };
    } catch {
      // Malformed json
    }
  }

  return undefined;
}

async function resolveWorkspacePackages(
  rootDir: string,
  patterns: string[],
): Promise<MonorepoInfo['packages']> {
  const dirs = await fg(patterns, {
    cwd: rootDir,
    onlyDirectories: true,
    absolute: false,
    ignore: ['**/node_modules/**'],
  });

  const packages: MonorepoInfo['packages'] = [];

  for (const dir of dirs) {
    const pkgPath = path.join(rootDir, dir, 'package.json');
    try {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = parseJson<PackageJson>(content);
      packages.push({
        name: pkg.name ?? dir,
        path: dir,
        technologies: [], // Filled later by per-package detection
      });
    } catch {
      // Directory doesn't have package.json, skip
    }
  }

  return packages;
}
