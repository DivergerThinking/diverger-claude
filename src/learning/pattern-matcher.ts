import type { MemoryStore, ErrorPattern } from '../core/types.js';
import { addErrorPattern } from '../memory/project-memory.js';
import type { ErrorClassification } from './error-analyzer.js';

/**
 * Match classified errors against existing patterns in the memory store.
 * Updates existing patterns or creates new ones.
 * Returns the list of updated/created patterns.
 */
export function matchAndUpdatePatterns(
  store: MemoryStore,
  classifications: ErrorClassification[],
): ErrorPattern[] {
  const updated: ErrorPattern[] = [];

  for (const classification of classifications) {
    const pattern = addErrorPattern(store, {
      category: classification.category,
      tool: classification.tool,
      matchPattern: classification.matchPattern,
      description: classification.description,
    });
    updated.push(pattern);
  }

  return updated;
}

/**
 * Find patterns that have reached the threshold for rule generation.
 */
export function findPatternsForRuleGeneration(
  store: MemoryStore,
  threshold: number,
): ErrorPattern[] {
  return store.errorPatterns.filter(
    (p) => p.occurrences >= threshold && !p.ruleGenerated,
  );
}
