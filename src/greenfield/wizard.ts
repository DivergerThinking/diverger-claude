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

function inferCategory(name: string): 'language' | 'framework' | 'testing' | 'infra' {
  const languages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php'];
  const testing = ['jest', 'vitest', 'pytest', 'junit', 'cypress', 'playwright', 'mocha'];
  const infra = ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'vercel', 'netlify'];
  const lowerName = name.toLowerCase();
  if (languages.some(l => lowerName.includes(l))) return 'language';
  if (testing.some(t => lowerName.includes(t))) return 'testing';
  if (infra.some(i => lowerName.includes(i))) return 'infra';
  return 'framework';
}

function inferFromArchitecture(
  archDoc: Awaited<ReturnType<typeof parseArchitectureDoc>> & object,
  projectRoot: string,
): DetectionResult {
  const technologies = archDoc.technologies.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    category: inferCategory(name),
    confidence: 70,
    evidence: [{
      source: 'ARCHITECTURE.md',
      type: 'content' as const,
      description: `Mencionado en documento de arquitectura`,
      weight: 70,
    }],
    profileIds: [] as string[],
  }));

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
    category: 'framework' as const,
    confidence: 100,
    evidence: [{
      source: 'greenfield-wizard',
      type: 'content' as const,
      description: `Seleccionado desde template "${template.name}"`,
      weight: 100,
    }],
    profileIds: template.profiles.filter((p) => p.includes(id)),
  }));

  return {
    technologies,
    rootDir: projectRoot,
    detectedAt: new Date().toISOString(),
  };
}
