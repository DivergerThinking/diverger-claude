import type { ErrorPatternCategory } from '../core/types.js';

export interface ErrorClassification {
  category: ErrorPatternCategory;
  confidence: number;
  matchPattern: string;
  description: string;
  tool?: string;
}

interface Classifier {
  match: RegExp;
  category: ErrorPatternCategory;
  confidence: number;
  descriptionFn: (match: RegExpMatchArray) => string;
}

const CLASSIFIERS: Classifier[] = [
  {
    match: /permission denied/i,
    category: 'tool-error',
    confidence: 80,
    descriptionFn: () => 'Permission denied — archivo o directorio no accesible',
  },
  {
    match: /EACCES/i,
    category: 'tool-error',
    confidence: 80,
    descriptionFn: () => 'EACCES — permisos insuficientes en filesystem',
  },
  {
    match: /cannot find module ['"]([^'"]+)['"]/i,
    category: 'code-pattern',
    confidence: 70,
    descriptionFn: (m) => `Módulo no encontrado: ${m[1] ?? 'unknown'}`,
  },
  {
    match: /Module not found/i,
    category: 'code-pattern',
    confidence: 70,
    descriptionFn: () => 'Módulo no encontrado',
  },
  {
    match: /(TS\d{4}):/,
    category: 'code-pattern',
    confidence: 60,
    descriptionFn: (m) => `Error TypeScript ${m[1]}`,
  },
  {
    match: /SyntaxError/i,
    category: 'code-pattern',
    confidence: 65,
    descriptionFn: () => 'Error de sintaxis',
  },
  {
    match: /hook.*fail|hook.*error/i,
    category: 'hook-failure',
    confidence: 85,
    descriptionFn: () => 'Hook script falló',
  },
  {
    match: /FAIL|AssertionError|AssertionFailedError/i,
    category: 'code-pattern',
    confidence: 50,
    descriptionFn: () => 'Test assertion fallido',
  },
  {
    match: /ENOENT/i,
    category: 'tool-error',
    confidence: 70,
    descriptionFn: () => 'Archivo o directorio no encontrado (ENOENT)',
  },
  {
    match: /timeout|ETIMEDOUT/i,
    category: 'tool-error',
    confidence: 60,
    descriptionFn: () => 'Operación timeout',
  },
  {
    match: /JSON\.parse|Unexpected token|is not valid JSON/i,
    category: 'config-issue',
    confidence: 75,
    descriptionFn: () => 'JSON inválido en archivo de configuración',
  },
  // Process-level classifiers (CI/release errors)
  {
    match: /plugin\.json.*version.*mismatch|plugin.*stale|build:plugin/i,
    category: 'config-issue',
    confidence: 80,
    descriptionFn: () => 'Plugin build stale — versiones desincronizadas',
  },
  {
    match: /UNIVERSAL_\w+_NAMES|constant.*mismatch|agent.*not.*found.*in.*set/i,
    category: 'code-pattern',
    confidence: 75,
    descriptionFn: () => 'Inconsistencia de constantes — UNIVERSAL_* desactualizado',
  },
  {
    match: /CI.*fail|workflow.*fail|GitHub.*Actions.*error|pipeline.*error/i,
    category: 'tool-error',
    confidence: 70,
    descriptionFn: () => 'Fallo de pipeline CI detectado',
  },
];

/**
 * Classify an error message into an ErrorPatternCategory.
 * Returns null if no classifier matches.
 */
export function classifyError(errorMessage: string, tool?: string): ErrorClassification | null {
  for (const classifier of CLASSIFIERS) {
    const match = errorMessage.match(classifier.match);
    if (match) {
      return {
        category: classifier.category,
        confidence: classifier.confidence,
        matchPattern: classifier.match.source,
        description: classifier.descriptionFn(match),
        tool,
      };
    }
  }
  // Fallback: unclassified errors still get tracked with low confidence
  return {
    category: 'tool-error',
    confidence: 30,
    matchPattern: 'unclassified',
    description: `Error no clasificado: ${errorMessage.slice(0, 80)}`,
    tool,
  };
}

/**
 * Classify multiple error messages and return all classifications.
 */
export function classifyErrors(errors: Array<{ message: string; tool?: string }>): ErrorClassification[] {
  const results: ErrorClassification[] = [];
  for (const error of errors) {
    const classification = classifyError(error.message, error.tool);
    if (classification) {
      results.push(classification);
    }
  }
  return results;
}
