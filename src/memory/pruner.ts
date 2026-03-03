import type { MemoryStore } from '../core/types.js';
import {
  MAX_ERROR_PATTERNS,
  MAX_REPAIR_LOG,
  MAX_ANTI_PATTERNS,
  MAX_BEST_PRACTICES,
  MAX_EVOLUTION_LOG,
  ERROR_PATTERN_TTL_DAYS,
} from '../core/constants.js';

/** Prune memory store to stay within bounds */
export function pruneMemory(store: MemoryStore): PruneResult {
  const result: PruneResult = {
    errorPatternsPruned: 0,
    repairLogPruned: 0,
    antiPatternsPruned: 0,
    bestPracticesPruned: 0,
    evolutionLogPruned: 0,
  };

  // Prune stale error patterns (old + low occurrence)
  const ttlCutoff = new Date();
  ttlCutoff.setDate(ttlCutoff.getDate() - ERROR_PATTERN_TTL_DAYS);
  const ttlCutoffStr = ttlCutoff.toISOString();

  const beforePatterns = store.errorPatterns.length;
  store.errorPatterns = store.errorPatterns.filter((p) => {
    // Keep if seen recently OR has enough occurrences
    return p.lastSeen >= ttlCutoffStr || p.occurrences >= 3;
  });
  result.errorPatternsPruned += beforePatterns - store.errorPatterns.length;

  // Cap error patterns (keep most frequent)
  if (store.errorPatterns.length > MAX_ERROR_PATTERNS) {
    store.errorPatterns.sort((a, b) => b.occurrences - a.occurrences);
    result.errorPatternsPruned += store.errorPatterns.length - MAX_ERROR_PATTERNS;
    store.errorPatterns = store.errorPatterns.slice(0, MAX_ERROR_PATTERNS);
  }

  // Cap repair log (keep most recent)
  if (store.repairLog.length > MAX_REPAIR_LOG) {
    result.repairLogPruned = store.repairLog.length - MAX_REPAIR_LOG;
    store.repairLog = store.repairLog.slice(store.repairLog.length - MAX_REPAIR_LOG);
  }

  // Cap anti-patterns (keep highest confidence)
  if (store.antiPatterns.length > MAX_ANTI_PATTERNS) {
    store.antiPatterns.sort((a, b) => b.confidence - a.confidence);
    result.antiPatternsPruned = store.antiPatterns.length - MAX_ANTI_PATTERNS;
    store.antiPatterns = store.antiPatterns.slice(0, MAX_ANTI_PATTERNS);
  }

  // Cap best practices (keep highest confidence)
  if (store.bestPractices.length > MAX_BEST_PRACTICES) {
    store.bestPractices.sort((a, b) => b.confidence - a.confidence);
    result.bestPracticesPruned = store.bestPractices.length - MAX_BEST_PRACTICES;
    store.bestPractices = store.bestPractices.slice(0, MAX_BEST_PRACTICES);
  }

  // Cap evolution log (keep most recent)
  if (store.evolutionLog.length > MAX_EVOLUTION_LOG) {
    result.evolutionLogPruned = store.evolutionLog.length - MAX_EVOLUTION_LOG;
    store.evolutionLog = store.evolutionLog.slice(store.evolutionLog.length - MAX_EVOLUTION_LOG);
  }

  // Update stats
  store.stats.totalErrorPatterns = store.errorPatterns.length;
  store.stats.lastConsolidation = new Date().toISOString();

  return result;
}

export interface PruneResult {
  errorPatternsPruned: number;
  repairLogPruned: number;
  antiPatternsPruned: number;
  bestPracticesPruned: number;
  evolutionLogPruned: number;
}

/** Check if consolidation is due (>= interval days since last) */
export function isConsolidationDue(store: MemoryStore, intervalDays: number): boolean {
  if (!store.stats.lastConsolidation) return true;
  const last = new Date(store.stats.lastConsolidation);
  const now = new Date();
  const daysDiff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff >= intervalDays;
}
