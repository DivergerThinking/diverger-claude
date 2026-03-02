import { select } from '@inquirer/prompts';
import type { DetectionResult } from '../core/types.js';
import { PROJECT_TEMPLATES, type ProjectTemplate } from './templates.js';
import { parseArchitectureDoc } from './document-parser.js';

/**
 * Interactive wizard for greenfield (new) projects.
 * Guides the user through selecting a stack when detection finds nothing.
 */
export async function runGreenfieldWizard(
  projectRoot: string,
): Promise<DetectionResult> {
  // First try to parse an architecture document
  const archDoc = await parseArchitectureDoc(projectRoot);

  if (archDoc && archDoc.technologies.length > 0) {
    // Use architecture document to infer stack
    return inferFromArchitecture(archDoc, projectRoot);
  }

  // Interactive template selection
  const templateId = await select({
    message: 'No se detectó un stack tecnológico. Selecciona un template:',
    choices: PROJECT_TEMPLATES.map((t) => ({
      name: `${t.name} - ${t.description}`,
      value: t.id,
    })),
  });

  const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error('Template no encontrado');
  }

  return templateToDetection(template, projectRoot);
}

/** Normalize a technology display name to a canonical lowercase hyphenated ID.
 *  Exported for testing. */
export function normalizeTechId(name: string): string {
  return name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function inferCategory(name: string): 'language' | 'framework' | 'testing' | 'infra' {
  const languages = new Set(['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php']);
  const testing = new Set(['jest', 'vitest', 'pytest', 'junit', 'cypress', 'playwright', 'mocha']);
  const infra = new Set(['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'vercel', 'netlify']);
  const lowerName = name.toLowerCase().replace(/\s+/g, '-');
  if (languages.has(lowerName)) return 'language';
  if (testing.has(lowerName)) return 'testing';
  if (infra.has(lowerName)) return 'infra';
  return 'framework';
}

/** Map of common technology display names to canonical IDs used by analyzers/profiles */
const TECH_NAME_ALIASES: Record<string, string> = {
  'next.js': 'nextjs',
  'vue.js': 'vue',
  'node.js': 'nodejs',
  'nest.js': 'nestjs',
  'asp.net': 'aspnet',
  'asp.net core': 'aspnet',
  'spring boot': 'spring-boot',
  'react testing library': 'react-testing-library',
  'github actions': 'github-actions',
  'gitlab ci': 'gitlab-ci',
  'azure pipelines': 'azure-pipelines',
  'actix web': 'actix-web',
  'gorilla mux': 'gorilla-mux',
};

/** Map canonical tech IDs to their profile IDs */
const TECH_PROFILE_MAP: Record<string, string[]> = {
  typescript: ['languages/typescript'],
  python: ['languages/python'],
  java: ['languages/java'],
  go: ['languages/go'],
  rust: ['languages/rust'],
  csharp: ['languages/csharp'],
  react: ['frameworks/react'],
  nextjs: ['frameworks/nextjs'],
  express: ['frameworks/express'],
  nestjs: ['frameworks/nestjs'],
  angular: ['frameworks/angular'],
  vue: ['frameworks/vue'],
  nuxt: ['frameworks/nuxt'],
  svelte: ['frameworks/svelte'],
  fastapi: ['frameworks/fastapi'],
  django: ['frameworks/django'],
  flask: ['frameworks/flask'],
  'spring-boot': ['frameworks/spring-boot'],
  jest: ['testing/jest'],
  vitest: ['testing/vitest'],
  pytest: ['testing/pytest'],
  junit: ['testing/junit'],
  cypress: ['testing/cypress'],
  playwright: ['testing/playwright'],
  docker: ['infra/docker'],
  'github-actions': ['infra/github-actions'],
};

function inferFromArchitecture(
  archDoc: Awaited<ReturnType<typeof parseArchitectureDoc>> & object,
  projectRoot: string,
): DetectionResult {
  const technologies = archDoc.technologies.map((name) => {
    // Normalize: lowercase, collapse whitespace to hyphens, then check aliases
    const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
    const id = TECH_NAME_ALIASES[normalized] ?? normalizeTechId(normalized);
    const profileIds = TECH_PROFILE_MAP[id] ?? [];
    return {
      id,
      name,
      category: inferCategory(name),
      confidence: 70,
      evidence: [{
        source: 'ARCHITECTURE.md',
        type: 'content' as const,
        description: `Mencionado en documento de arquitectura`,
        weight: 70,
      }],
      profileIds,
    };
  });

  return {
    technologies,
    rootDir: projectRoot,
    detectedAt: new Date().toISOString(),
  };
}

function templateToDetection(
  template: ProjectTemplate,
  projectRoot: string,
): DetectionResult {
  const technologies = template.technologies.map((id) => ({
    id,
    name: id,
    category: inferCategory(id),
    confidence: 100,
    evidence: [{
      source: 'greenfield-wizard',
      type: 'content' as const,
      description: `Seleccionado desde template "${template.name}"`,
      weight: 100,
    }],
    profileIds: template.profiles.filter((p) => p.endsWith('/' + id)),
  }));

  return {
    technologies,
    rootDir: projectRoot,
    detectedAt: new Date().toISOString(),
  };
}
