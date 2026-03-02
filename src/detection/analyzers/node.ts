import type { AnalyzerResult, DetectedTechnology, DetectionEvidence } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseJson } from '../../utils/parsers.js';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

/** Dependency detection patterns */
interface DepPattern {
  packages: string[];
  techId: string;
  techName: string;
  category: 'language' | 'framework' | 'testing' | 'tooling';
  weight: number;
  profileIds: string[];
  parentId?: string;
}

const DEP_PATTERNS: DepPattern[] = [
  // Languages
  {
    packages: ['typescript'],
    techId: 'typescript',
    techName: 'TypeScript',
    category: 'language',
    weight: 85,
    profileIds: ['languages/typescript'],
  },
  // Frameworks
  {
    packages: ['react', 'react-dom'],
    techId: 'react',
    techName: 'React',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/react'],
  },
  {
    packages: ['next'],
    techId: 'nextjs',
    techName: 'Next.js',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/nextjs'],
    parentId: 'react',
  },
  {
    packages: ['express'],
    techId: 'express',
    techName: 'Express',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/express'],
  },
  {
    packages: ['@nestjs/core'],
    techId: 'nestjs',
    techName: 'NestJS',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/nestjs'],
  },
  {
    packages: ['@angular/core'],
    techId: 'angular',
    techName: 'Angular',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/angular'],
  },
  {
    packages: ['vue'],
    techId: 'vue',
    techName: 'Vue.js',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/vue'],
  },
  {
    packages: ['nuxt', 'nuxt3'],
    techId: 'nuxt',
    techName: 'Nuxt',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/nuxt'],
    parentId: 'vue',
  },
  {
    packages: ['svelte'],
    techId: 'svelte',
    techName: 'Svelte',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/svelte'],
  },
  // Testing
  {
    packages: ['jest', '@jest/core'],
    techId: 'jest',
    techName: 'Jest',
    category: 'testing',
    weight: 90,
    profileIds: ['testing/jest'],
  },
  {
    packages: ['vitest'],
    techId: 'vitest',
    techName: 'Vitest',
    category: 'testing',
    weight: 90,
    profileIds: ['testing/vitest'],
  },
  {
    packages: ['cypress'],
    techId: 'cypress',
    techName: 'Cypress',
    category: 'testing',
    weight: 90,
    profileIds: ['testing/cypress'],
  },
  {
    packages: ['@playwright/test', 'playwright'],
    techId: 'playwright',
    techName: 'Playwright',
    category: 'testing',
    weight: 90,
    profileIds: ['testing/playwright'],
  },
  {
    packages: ['@testing-library/react'],
    techId: 'react-testing-library',
    techName: 'React Testing Library',
    category: 'testing',
    weight: 85,
    profileIds: ['testing/jest'],
    parentId: 'jest',
  },
  // Tooling
  {
    packages: ['vite'],
    techId: 'vite',
    techName: 'Vite',
    category: 'tooling',
    weight: 80,
    profileIds: [],
  },
  {
    packages: ['webpack'],
    techId: 'webpack',
    techName: 'Webpack',
    category: 'tooling',
    weight: 80,
    profileIds: [],
  },
];

export class NodeAnalyzer extends BaseAnalyzer {
  readonly id = 'node';
  readonly name = 'Node.js / npm';
  readonly filePatterns = ['package.json', 'tsconfig.json', 'tsconfig.*.json'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    const pkgContent = files.get('package.json');
    if (!pkgContent) {
      return { technologies, analyzedFiles };
    }

    analyzedFiles.push('package.json');

    let pkg: PackageJson;
    try {
      pkg = parseJson<PackageJson>(pkgContent, 'package.json');
    } catch {
      // Malformed package.json: return empty result instead of crashing the pipeline
      return { technologies, analyzedFiles };
    }

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    // Detect Node.js itself
    technologies.push({
      id: 'nodejs',
      name: 'Node.js',
      category: 'language',
      confidence: 95,
      evidence: [{
        source: 'package.json',
        type: 'manifest',
        description: 'package.json found',
        weight: 95,
      }],
      profileIds: [],
    });

    // Check each dependency pattern
    for (const pattern of DEP_PATTERNS) {
      const found = pattern.packages.find((pkg) => pkg in allDeps);
      if (found) {
        const rawVersion = allDeps[found];
        // Git URLs and other non-semver specifiers should not be stored as version
        const isGitUrl = rawVersion && /^(git[+:]|github:|https?:\/\/|file:)/.test(rawVersion);
        const version = isGitUrl ? undefined : rawVersion;
        const majorVersion = isGitUrl ? undefined : this.extractMajorVersion(rawVersion);
        const evidence: DetectionEvidence[] = [{
          source: 'package.json',
          type: 'manifest',
          description: `Found "${found}" in dependencies${version ? ` (${version})` : ''}`,
          weight: pattern.weight,
          trackedPackage: found,
        }];

        technologies.push({
          id: pattern.techId,
          name: pattern.techName,
          category: pattern.category,
          version: version?.replace(/^[\^~>=<]*/g, ''),
          majorVersion,
          confidence: pattern.weight,
          evidence,
          parentId: pattern.parentId,
          profileIds: pattern.profileIds,
        });
      }
    }

    // Check for TypeScript config files (boosts confidence)
    for (const [filePath] of files) {
      if (filePath === 'tsconfig.json' || filePath.match(/^tsconfig\..+\.json$/)) {
        analyzedFiles.push(filePath);
        const tsTech = technologies.find((t) => t.id === 'typescript');
        if (tsTech) {
          tsTech.evidence.push({
            source: filePath,
            type: 'config-file',
            description: `TypeScript config file found: ${filePath}`,
            weight: 10,
          });
          tsTech.confidence = Math.min(100, tsTech.confidence + 10);
        } else {
          // TypeScript config exists but not in deps (might be peer dep)
          technologies.push({
            id: 'typescript',
            name: 'TypeScript',
            category: 'language',
            confidence: 80,
            evidence: [{
              source: filePath,
              type: 'config-file',
              description: `TypeScript config found without direct dependency`,
              weight: 80,
            }],
            profileIds: ['languages/typescript'],
          });
        }
      }
    }

    // Detect config files that boost framework confidence
    this.boostFromConfigFiles(technologies, files, analyzedFiles);

    return { technologies, analyzedFiles };
  }

  private boostFromConfigFiles(
    technologies: DetectedTechnology[],
    files: Map<string, string>,
    analyzedFiles: string[],
  ): void {
    const configBoosts: Record<string, { techId: string; weight: number }> = {
      'next.config.js': { techId: 'nextjs', weight: 9 },
      'next.config.mjs': { techId: 'nextjs', weight: 9 },
      'next.config.ts': { techId: 'nextjs', weight: 9 },
      'angular.json': { techId: 'angular', weight: 9 },
      'vue.config.js': { techId: 'vue', weight: 5 },
      'nuxt.config.ts': { techId: 'nuxt', weight: 9 },
      'nuxt.config.js': { techId: 'nuxt', weight: 9 },
      'vite.config.ts': { techId: 'vite', weight: 5 },
      'vite.config.js': { techId: 'vite', weight: 5 },
      'vitest.config.ts': { techId: 'vitest', weight: 5 },
      'vitest.config.js': { techId: 'vitest', weight: 5 },
      'jest.config.ts': { techId: 'jest', weight: 5 },
      'jest.config.js': { techId: 'jest', weight: 5 },
      'jest.config.cjs': { techId: 'jest', weight: 5 },
      'jest.config.mjs': { techId: 'jest', weight: 5 },
      'cypress.config.ts': { techId: 'cypress', weight: 5 },
      'playwright.config.ts': { techId: 'playwright', weight: 5 },
    };

    for (const [filePath, boost] of Object.entries(configBoosts)) {
      if (files.has(filePath)) {
        analyzedFiles.push(filePath);
        const tech = technologies.find((t) => t.id === boost.techId);
        if (tech) {
          tech.evidence.push({
            source: filePath,
            type: 'config-file',
            description: `Config file found: ${filePath}`,
            weight: boost.weight,
          });
          tech.confidence = Math.min(100, tech.confidence + boost.weight);
        }
      }
    }
  }

  private extractMajorVersion(versionStr?: string): number | undefined {
    if (!versionStr) return undefined;
    const match = versionStr.replace(/^[\^~>=<]*/g, '').match(/^(\d+)/);
    return match ? parseInt(match[1]!, 10) : undefined;
  }
}
