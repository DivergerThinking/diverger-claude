import type { DetectionResult, ProjectMetadata } from '../core/types.js';
import path from 'path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

/** Useful npm script keys to include in metadata (others are noise) */
const USEFUL_SCRIPT_KEYS = [
  'build', 'test', 'lint', 'dev', 'start', 'typecheck', 'check', 'format',
  'build:plugin', 'test:unit', 'test:integration', 'test:e2e',
];

/**
 * Extract project metadata from manifests, README, and directory structure.
 * Called once and shared with all generators.
 */
export function extractProjectMetadata(
  projectRoot: string,
  detection?: DetectionResult,
): ProjectMetadata {
  const metadata: ProjectMetadata = {
    keyDirectories: [],
  };

  // 1. package.json
  extractFromPackageJson(projectRoot, metadata);

  // 2. pubspec.yaml (Flutter/Dart projects)
  extractFromPubspec(projectRoot, metadata);

  // 3. pyproject.toml (fallback for name/description, plus scripts)
  extractFromPyproject(projectRoot, metadata);

  // 4. Cargo.toml (fallback for name/description)
  extractFromCargo(projectRoot, metadata);

  // 4b. go.mod (fallback for name)
  extractFromGoMod(projectRoot, metadata);

  // 5. Subdirectory fallback: if no name/description found, scan one level deep
  if (!metadata.name && !metadata.description) {
    const subdirRoot = findSubdirectoryWithManifest(projectRoot, detection);
    if (subdirRoot) {
      extractFromPackageJson(subdirRoot, metadata);
      extractFromPubspec(subdirRoot, metadata);
      extractFromPyproject(subdirRoot, metadata);
      extractFromCargo(subdirRoot, metadata);
      extractFromGoMod(subdirRoot, metadata);
    }
  }

  // 6. README summary
  metadata.readmeSummary = extractReadmeSummary(projectRoot);

  // 7. Key directories
  metadata.keyDirectories = detectKeyDirectories(projectRoot);

  // 8. Architecture from detection
  if (detection?.architecture) {
    metadata.architecture = detection.architecture;
  }

  // 9. Package manager detection
  if (!metadata.packageManager) {
    metadata.packageManager = detectPackageManager(projectRoot);
  }

  // 10. Makefile targets
  extractMakeTargets(projectRoot, metadata);

  return metadata;
}

function extractFromPackageJson(projectRoot: string, metadata: ProjectMetadata): void {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) return;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    if (typeof pkg.name === 'string') metadata.name = pkg.name;
    if (typeof pkg.description === 'string') metadata.description = pkg.description;

    // Scripts (filter to useful ones)
    if (pkg.scripts && typeof pkg.scripts === 'object') {
      const scripts = pkg.scripts as Record<string, string>;
      const filtered: Record<string, string> = {};
      for (const key of Object.keys(scripts)) {
        const value = scripts[key];
        if (USEFUL_SCRIPT_KEYS.includes(key) && value !== undefined) {
          filtered[key] = value;
        }
      }
      if (Object.keys(filtered).length > 0) {
        metadata.scripts = filtered;
      }
    }

    // Entry points
    const entryPoints: Record<string, string> = {};
    if (typeof pkg.main === 'string') entryPoints.main = pkg.main;
    if (typeof pkg.bin === 'string') {
      entryPoints[metadata.name ?? 'bin'] = pkg.bin;
    } else if (pkg.bin && typeof pkg.bin === 'object') {
      Object.assign(entryPoints, pkg.bin);
    }
    if (Object.keys(entryPoints).length > 0) {
      metadata.entryPoints = entryPoints;
    }

    // Package manager from packageManager field
    if (typeof pkg.packageManager === 'string') {
      const pm = pkg.packageManager as string;
      if (pm.startsWith('yarn')) metadata.packageManager = 'yarn';
      else if (pm.startsWith('pnpm')) metadata.packageManager = 'pnpm';
      else if (pm.startsWith('bun')) metadata.packageManager = 'bun';
      else if (pm.startsWith('npm')) metadata.packageManager = 'npm';
    }
  } catch {
    // ignore malformed package.json
  }
}

function extractFromPubspec(projectRoot: string, metadata: ProjectMetadata): void {
  const pubspecPath = path.join(projectRoot, 'pubspec.yaml');
  if (!existsSync(pubspecPath)) return;

  try {
    const content = readFileSync(pubspecPath, 'utf-8');

    // Parse top-level flat keys with simple regex (pubspec.yaml is flat enough)
    if (!metadata.name) {
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      if (nameMatch?.[1]) metadata.name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }
    if (!metadata.description) {
      const descMatch = content.match(/^description:\s*(.+)$/m);
      if (descMatch?.[1]) metadata.description = descMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // ignore
  }
}

function extractFromPyproject(projectRoot: string, metadata: ProjectMetadata): void {
  const pyprojectPath = path.join(projectRoot, 'pyproject.toml');
  if (!existsSync(pyprojectPath)) return;

  try {
    const content = readFileSync(pyprojectPath, 'utf-8');

    if (!metadata.description) {
      const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
      if (descMatch?.[1]) metadata.description = descMatch[1];
    }
    if (!metadata.name) {
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch?.[1]) metadata.name = nameMatch[1];
    }

    // Python scripts from [project.scripts]
    const scriptsSection = content.match(/\[project\.scripts\]\s*\n([\s\S]*?)(?:\n\[|$)/);
    if (scriptsSection?.[1]) {
      const scripts: Record<string, string> = {};
      const lines = scriptsSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w[\w-]*)\s*=\s*"([^"]+)"/);
        if (match?.[1] && match[2]) scripts[match[1]] = match[2];
      }
      if (Object.keys(scripts).length > 0) {
        metadata.pythonScripts = scripts;
      }
    }
  } catch {
    // ignore
  }
}

function extractFromCargo(projectRoot: string, metadata: ProjectMetadata): void {
  const cargoPath = path.join(projectRoot, 'Cargo.toml');
  if (!existsSync(cargoPath)) return;

  try {
    const content = readFileSync(cargoPath, 'utf-8');
    if (!metadata.description) {
      const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
      if (descMatch?.[1]) metadata.description = descMatch[1];
    }
    if (!metadata.name) {
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch?.[1]) metadata.name = nameMatch[1];
    }
  } catch {
    // ignore
  }
}

/** Extract the first meaningful paragraph from a README file */
function extractReadmeSummary(projectRoot: string): string | undefined {
  const readmeNames = ['README.md', 'readme.md', 'Readme.md', 'README.rst', 'README.txt', 'README'];
  for (const name of readmeNames) {
    const readmePath = path.join(projectRoot, name);
    if (existsSync(readmePath)) {
      try {
        const content = readFileSync(readmePath, 'utf-8');
        return parseReadmeSummary(content);
      } catch {
        // ignore
      }
      break;
    }
  }
  return undefined;
}

/** Parse first paragraph from README content */
export function parseReadmeSummary(content: string): string | undefined {
  const lines = content.split('\n');
  let foundHeading = false;
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip badges, images, and empty lines at the start
    if (!foundHeading && (trimmed === '' || /^[!\[<]/.test(trimmed))) continue;

    // Skip headings but note we've passed one
    if (/^#{1,3}\s/.test(trimmed)) {
      if (foundHeading && paragraphLines.length > 0) break;
      foundHeading = true;
      continue;
    }

    // Collect paragraph text after first heading
    if (foundHeading) {
      if (trimmed === '') {
        if (paragraphLines.length > 0) break;
        continue;
      }
      paragraphLines.push(trimmed);
    }
  }

  if (paragraphLines.length === 0) return undefined;

  const summary = paragraphLines.join(' ');
  if (summary.length > 300) {
    return summary.slice(0, 297) + '...';
  }
  return summary;
}

/** Detect common project directories that exist */
export function detectKeyDirectories(projectRoot: string): string[] {
  const candidates = [
    'src', 'lib', 'app', 'apps', 'packages',
    'components', 'pages', 'routes', 'api',
    'server', 'client', 'shared', 'common', 'core',
    'tests', 'test', '__tests__', 'spec',
    'scripts', 'tools', 'config',
    'docs', 'public', 'static', 'assets',
    'migrations', 'prisma', 'db',
    'cmd', 'pkg', 'internal',
  ];

  return candidates.filter((dir) => {
    const fullPath = path.join(projectRoot, dir);
    return existsSync(fullPath);
  });
}

/** Detect package manager from lock files */
function detectPackageManager(projectRoot: string): ProjectMetadata['packageManager'] {
  if (existsSync(path.join(projectRoot, 'bun.lockb')) || existsSync(path.join(projectRoot, 'bun.lock'))) return 'bun';
  if (existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  if (existsSync(path.join(projectRoot, 'package-lock.json'))) return 'npm';
  return undefined;
}

function extractFromGoMod(dir: string, metadata: ProjectMetadata): void {
  const goModPath = path.join(dir, 'go.mod');
  if (!existsSync(goModPath)) return;

  try {
    const content = readFileSync(goModPath, 'utf-8');
    if (!metadata.name) {
      const moduleMatch = content.match(/^module\s+(.+)$/m);
      if (moduleMatch?.[1]) {
        const modulePath = moduleMatch[1].trim();
        const segments = modulePath.split('/');
        metadata.name = segments[segments.length - 1];
      }
    }
  } catch {
    // ignore
  }
}

/** Manifest files to search for in subdirectories */
const SUBDIRECTORY_MANIFESTS = [
  'package.json', 'pubspec.yaml', 'pyproject.toml', 'Cargo.toml',
  'go.mod', 'build.gradle', 'build.gradle.kts', 'pom.xml',
] as const;

/** Directories to skip when scanning one level deep */
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', '.git', 'vendor', '.next',
  '.nuxt', 'target', 'out', '.turbo', '__pycache__', '.claude',
  '.diverger-backup', '.diverger-cache', 'coverage',
]);

/**
 * Scan one level of subdirectories for manifest files.
 * Returns the subdirectory path containing a recognized manifest,
 * prioritizing the manifest type matching the detected primary language.
 */
function findSubdirectoryWithManifest(
  projectRoot: string,
  detection?: DetectionResult,
): string | undefined {
  let entries: string[];
  try {
    entries = readdirSync(projectRoot);
  } catch {
    return undefined;
  }

  const subdirs = entries.filter((entry) => {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) return false;
    try {
      return statSync(path.join(projectRoot, entry)).isDirectory();
    } catch {
      return false;
    }
  });

  if (subdirs.length === 0) return undefined;

  // Prioritize manifest matching detected language
  const prioritized = prioritizeManifests(detection);

  for (const manifest of prioritized) {
    for (const subdir of subdirs) {
      if (existsSync(path.join(projectRoot, subdir, manifest))) {
        return path.join(projectRoot, subdir);
      }
    }
  }

  return undefined;
}

/** Order manifest files by priority based on detected primary language */
function prioritizeManifests(detection?: DetectionResult): readonly string[] {
  if (!detection?.technologies.length) return SUBDIRECTORY_MANIFESTS;

  const primaryLang = detection.technologies
    .filter((t) => t.category === 'language')
    .sort((a, b) => b.confidence - a.confidence)[0];

  const manifestMap: Record<string, string> = {
    typescript: 'package.json',
    javascript: 'package.json',
    python: 'pyproject.toml',
    dart: 'pubspec.yaml',
    rust: 'Cargo.toml',
    go: 'go.mod',
    java: 'pom.xml',
    kotlin: 'build.gradle.kts',
  };

  const primaryManifest = primaryLang ? manifestMap[primaryLang.id] : undefined;
  if (primaryManifest) {
    return [primaryManifest, ...SUBDIRECTORY_MANIFESTS.filter((m) => m !== primaryManifest)];
  }

  return SUBDIRECTORY_MANIFESTS;
}

/** Extract Makefile targets */
function extractMakeTargets(projectRoot: string, metadata: ProjectMetadata): void {
  const makefilePath = path.join(projectRoot, 'Makefile');
  if (!existsSync(makefilePath)) return;

  try {
    const content = readFileSync(makefilePath, 'utf-8');
    const targets: string[] = [];
    const targetRe = /^([a-zA-Z_][\w-]*)\s*:(?!=)/gm;
    let match: RegExpExecArray | null;
    while ((match = targetRe.exec(content)) !== null) {
      const target = match[1];
      // Skip internal targets, 'all', and ALL_CAPS variable names (e.g., PYTHONPATH, SHELL)
      if (target && !target.startsWith('_') && target !== 'all' && !/^[A-Z_]+$/.test(target)) {
        targets.push(target);
      }
    }
    if (targets.length > 0) {
      metadata.makeTargets = targets;
    }
  } catch {
    // ignore
  }
}
