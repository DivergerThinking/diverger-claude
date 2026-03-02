import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/vendor/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/target/**',
  '**/out/**',
  '**/.turbo/**',
];

/** File scanner that finds manifest and config files in a project */
export class FileScanner {
  /** Scan a directory for relevant project files */
  async scan(projectRoot: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    const patterns = [
      'package.json',
      'tsconfig.json',
      'tsconfig.*.json',
      'pyproject.toml',
      'requirements.txt',
      'setup.py',
      'setup.cfg',
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'settings.gradle',
      'settings.gradle.kts',
      'go.mod',
      'go.sum',
      'Cargo.toml',
      '*.csproj',
      '*.sln',
      'Dockerfile',
      'Dockerfile.*',
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml',
      '.github/workflows/*.yml',
      '.github/workflows/*.yaml',
      '.gitlab-ci.yml',
      'nx.json',
      'turbo.json',
      'lerna.json',
      'pnpm-workspace.yaml',
      '.npmrc',
      '.nvmrc',
      '.python-version',
      'next.config.js',
      'next.config.mjs',
      'next.config.ts',
      'nuxt.config.ts',
      'nuxt.config.js',
      'angular.json',
      'vue.config.js',
      'vite.config.ts',
      'vite.config.js',
      'vitest.config.ts',
      'vitest.config.js',
      'jest.config.ts',
      'jest.config.js',
      'jest.config.cjs',
      'playwright.config.ts',
      'cypress.config.ts',
      'cypress.config.js',
      '.eslintrc*',
      'eslint.config.*',
      '.prettierrc*',
      'prettier.config.*',
      'terraform/**/*.tf',
      'serverless.yml',
      'serverless.yaml',
      'vercel.json',
      'netlify.toml',
    ];

    const found = await fg(patterns, {
      cwd: projectRoot,
      absolute: false,
      dot: true,
      followSymbolicLinks: false,
      ignore: IGNORE_PATTERNS,
      onlyFiles: true,
    });

    for (const relativePath of found) {
      const absolutePath = path.join(projectRoot, relativePath);
      try {
        const content = await fs.readFile(absolutePath, 'utf-8');
        files.set(relativePath, content);
      } catch {
        // Skip unreadable files
      }
    }

    return files;
  }

  /** Scan for files matching specific patterns (used by individual analyzers) */
  async scanPatterns(
    projectRoot: string,
    patterns: string[],
    rootOnly?: Set<string>,
  ): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    const expandedPatterns = this.expandPatterns(patterns, rootOnly);

    const found = await fg(expandedPatterns, {
      cwd: projectRoot,
      absolute: false,
      dot: true,
      followSymbolicLinks: false,
      ignore: IGNORE_PATTERNS,
      onlyFiles: true,
      deep: 4,
    });

    for (const relativePath of found) {
      const absolutePath = path.join(projectRoot, relativePath);
      try {
        const content = await fs.readFile(absolutePath, 'utf-8');
        files.set(relativePath, content);
      } catch {
        // Skip unreadable files
      }
    }

    return files;
  }

  /**
   * Expand patterns to also search in subdirectories.
   * Patterns that are just a filename (no `/`) get a `**\/` prefixed variant added.
   * Patterns that already contain a path separator are left as-is.
   * Patterns in the rootOnly set are never expanded.
   */
  private expandPatterns(patterns: string[], rootOnly?: Set<string>): string[] {
    const expanded: string[] = [];

    for (const pattern of patterns) {
      expanded.push(pattern);

      // Skip if explicitly root-only
      if (rootOnly?.has(pattern)) continue;

      // Only expand patterns without path separators (pure filenames or simple globs)
      if (!pattern.includes('/')) {
        expanded.push(`**/${pattern}`);
      }
    }

    return expanded;
  }
}
