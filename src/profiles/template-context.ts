// ============================================================================
// Template Context — Builds interpolation context from DetectionResult
// ============================================================================

import type { DetectionResult } from '../core/types.js';
import {
  LANGUAGE_MAPPINGS,
  DEFAULT_LANGUAGE_ID,
  type LanguageMapping,
  type LanguageContext,
  type CIContext,
  type DockerContext,
} from './language-mappings.js';

export type { LanguageContext, CIContext, DockerContext };

/** Full template context for profile interpolation */
export interface TemplateContext {
  lang: LanguageContext;
  ci: CIContext;
  docker: DockerContext;
}

/**
 * Build a TemplateContext from a DetectionResult.
 * Uses the highest-confidence language-category technology.
 * Falls back to TypeScript/Node.js defaults when no language is detected.
 */
export function buildTemplateContext(detection: DetectionResult): TemplateContext {
  // Find primary language (highest confidence language-category tech)
  const primaryLang = detection.technologies
    .filter((t) => t.category === 'language')
    .sort((a, b) => b.confidence - a.confidence)[0];

  const langId = primaryLang?.id ?? DEFAULT_LANGUAGE_ID;
  const baseMapping = LANGUAGE_MAPPINGS[langId] ?? LANGUAGE_MAPPINGS[DEFAULT_LANGUAGE_ID]!;

  // Apply package manager overrides for JS/TS ecosystems
  return applyPackageManagerOverrides(baseMapping, detection);
}

/**
 * Override package manager commands when a specific JS runtime/manager is detected.
 */
function applyPackageManagerOverrides(
  base: LanguageMapping,
  detection: DetectionResult,
): TemplateContext {
  // Only apply overrides for JS/TS languages
  if (base.lang.id !== 'typescript' && base.lang.id !== 'javascript') {
    return { ...base };
  }

  // Check for alternative runtimes/package managers
  const hasBun = detection.technologies.some((t) => t.id === 'bun');
  const hasDeno = detection.technologies.some((t) => t.id === 'deno');
  const hasPnpm = detection.technologies.some((t) =>
    t.evidence?.some((e) => e.source.includes('pnpm-lock.yaml')),
  );
  const hasYarn = detection.technologies.some((t) =>
    t.evidence?.some((e) => e.source.includes('yarn.lock')),
  );

  if (hasBun) {
    return {
      lang: {
        ...base.lang,
        installCmd: 'bun install --frozen-lockfile',
        testCmd: 'bun test',
        buildCmd: 'bun run build',
        lintCmd: 'bun run lint',
        packageManager: 'bun',
        lockFile: 'bun.lockb',
      },
      ci: {
        ...base.ci,
        setupAction: 'oven-sh/setup-bun',
        versionInput: 'bun-version',
        cacheInput: '',
      },
      docker: {
        ...base.docker,
        buildImage: 'oven/bun:1-alpine',
        runtimeImage: 'oven/bun:1-alpine',
        installDeps: 'RUN bun install --frozen-lockfile',
        buildStep: 'RUN bun run build',
      },
    };
  }

  if (hasDeno) {
    return {
      lang: {
        ...base.lang,
        installCmd: 'deno install',
        testCmd: 'deno test',
        buildCmd: 'deno task build',
        lintCmd: 'deno lint',
        packageManager: 'deno',
        lockFile: 'deno.lock',
        depsDir: '',
      },
      ci: {
        ...base.ci,
        setupAction: 'denoland/setup-deno',
        versionInput: 'deno-version',
        cacheInput: '',
      },
      docker: {
        ...base.docker,
        buildImage: 'denoland/deno:latest',
        runtimeImage: 'denoland/deno:latest',
        installDeps: 'RUN deno install',
        buildStep: 'RUN deno task build',
      },
    };
  }

  if (hasPnpm) {
    return {
      lang: {
        ...base.lang,
        installCmd: 'pnpm install --frozen-lockfile',
        packageManager: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
      },
      ci: { ...base.ci, cacheInput: 'pnpm' },
      docker: {
        ...base.docker,
        copyManifest: 'COPY package.json pnpm-lock.yaml ./',
        installDeps: 'RUN corepack enable && pnpm install --frozen-lockfile',
        cacheMountTarget: '/root/.local/share/pnpm/store',
      },
    };
  }

  if (hasYarn) {
    return {
      lang: {
        ...base.lang,
        installCmd: 'yarn install --frozen-lockfile',
        packageManager: 'yarn',
        lockFile: 'yarn.lock',
      },
      ci: { ...base.ci, cacheInput: 'yarn' },
      docker: {
        ...base.docker,
        copyManifest: 'COPY package.json yarn.lock ./',
        installDeps: 'RUN yarn install --frozen-lockfile',
        cacheMountTarget: '/usr/local/share/.cache/yarn',
      },
    };
  }

  return { ...base };
}
