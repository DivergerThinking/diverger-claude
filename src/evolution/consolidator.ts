import type { MemoryStore } from '../core/types.js';
import { pruneMemory, isConsolidationDue } from '../memory/pruner.js';
import { MEMORY_CONSOLIDATION_INTERVAL_DAYS } from '../core/constants.js';

export interface ConsolidationResult {
  performed: boolean;
  reason: string;
  pruned?: {
    errorPatterns: number;
    repairLog: number;
    antiPatterns: number;
    bestPractices: number;
    evolutionLog: number;
  };
}

/**
 * Consolidate memory if the interval has been exceeded.
 * Prunes old/low-value entries and merges similar anti-patterns.
 */
export function consolidateIfDue(store: MemoryStore): ConsolidationResult {
  if (!isConsolidationDue(store, MEMORY_CONSOLIDATION_INTERVAL_DAYS)) {
    return { performed: false, reason: 'Consolidación no necesaria aún' };
  }

  const pruneResult = pruneMemory(store);

  // Merge similar anti-patterns (same pattern text, different casing or minor differences)
  const mergedCount = mergeSimilarAntiPatterns(store);

  return {
    performed: true,
    reason: `Consolidación ejecutada. ${mergedCount} anti-patterns fusionados.`,
    pruned: {
      errorPatterns: pruneResult.errorPatternsPruned,
      repairLog: pruneResult.repairLogPruned,
      antiPatterns: pruneResult.antiPatternsPruned,
      bestPractices: pruneResult.bestPracticesPruned,
      evolutionLog: pruneResult.evolutionLogPruned,
    },
  };
}

/**
 * Merge anti-patterns with very similar pattern text.
 * Keeps the one with higher confidence.
 */
function mergeSimilarAntiPatterns(store: MemoryStore): number {
  let mergedCount = 0;
  const seen = new Map<string, number>(); // normalized pattern → index

  for (let i = store.antiPatterns.length - 1; i >= 0; i--) {
    const ap = store.antiPatterns[i];
    if (!ap) continue;
    const normalized = ap.pattern.toLowerCase().trim();
    const existingIdx = seen.get(normalized);

    if (existingIdx !== undefined) {
      const existing = store.antiPatterns[existingIdx];
      if (existing && ap.confidence > existing.confidence) {
        store.antiPatterns[existingIdx] = ap;
      }
      store.antiPatterns.splice(i, 1);
      mergedCount++;
    } else {
      seen.set(normalized, i);
    }
  }

  return mergedCount;
}
