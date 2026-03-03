import type { MemoryStore, AntiPattern, BestPractice } from '../core/types.js';
import { loadGlobalMemory, saveGlobalMemory } from './store.js';
import { addAntiPattern, addBestPractice } from './project-memory.js';

/**
 * Promote a project-level anti-pattern to global memory.
 * Only promotes if confidence >= 70 to avoid noise.
 */
export async function promoteAntiPatternToGlobal(antiPattern: AntiPattern): Promise<void> {
  if (antiPattern.confidence < 70) return;

  const global = await loadGlobalMemory();
  addAntiPattern(global, {
    pattern: antiPattern.pattern,
    reason: antiPattern.reason,
    alternative: antiPattern.alternative,
    source: antiPattern.source,
    confidence: antiPattern.confidence,
  });
  await saveGlobalMemory(global);
}

/**
 * Promote a project-level best practice to global memory.
 * Only promotes if confidence >= 70.
 */
export async function promoteBestPracticeToGlobal(practice: BestPractice): Promise<void> {
  if (practice.confidence < 70) return;

  const global = await loadGlobalMemory();
  addBestPractice(global, {
    practice: practice.practice,
    reason: practice.reason,
    source: practice.source,
    confidence: practice.confidence,
  });
  await saveGlobalMemory(global);
}

/**
 * Import global learnings into a project memory store.
 * Merges anti-patterns and best practices from global → project.
 */
export async function importGlobalLearnings(store: MemoryStore): Promise<number> {
  const global = await loadGlobalMemory();
  let imported = 0;

  for (const ap of global.antiPatterns) {
    const existing = store.antiPatterns.find((a) => a.id === ap.id);
    if (!existing) {
      addAntiPattern(store, {
        pattern: ap.pattern,
        reason: ap.reason,
        alternative: ap.alternative,
        source: ap.source,
        confidence: ap.confidence,
      });
      imported++;
    }
  }

  for (const bp of global.bestPractices) {
    const existing = store.bestPractices.find((b) => b.id === bp.id);
    if (!existing) {
      addBestPractice(store, {
        practice: bp.practice,
        reason: bp.reason,
        source: bp.source,
        confidence: bp.confidence,
      });
      imported++;
    }
  }

  return imported;
}
