import { describe, it, expect, beforeEach } from 'vitest';
import { consolidateIfDue } from '../../../src/evolution/consolidator.js';
import { createDefaultMemoryStore } from '../../../src/memory/store.js';
import { addAntiPattern } from '../../../src/memory/project-memory.js';
import type { MemoryStore } from '../../../src/core/types.js';

describe('Memory Consolidator', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = createDefaultMemoryStore();
  });

  it('should perform consolidation when no previous consolidation', () => {
    const result = consolidateIfDue(store);
    expect(result.performed).toBe(true);
  });

  it('should not consolidate when recently done', () => {
    store.stats.lastConsolidation = new Date().toISOString();
    const result = consolidateIfDue(store);
    expect(result.performed).toBe(false);
  });

  it('should merge similar anti-patterns', () => {
    // Add two similar patterns (same text, different casing)
    addAntiPattern(store, {
      pattern: 'Using any type',
      reason: 'Reason 1',
      alternative: 'Use unknown',
      source: 'manual',
      confidence: 60,
    });
    addAntiPattern(store, {
      pattern: 'using any type',
      reason: 'Reason 2',
      alternative: 'Use unknown',
      source: 'manual',
      confidence: 80,
    });

    // They get different IDs since sha256 is case-sensitive
    // But consolidation should merge them
    expect(store.antiPatterns.length).toBe(2);

    const result = consolidateIfDue(store);
    expect(result.performed).toBe(true);
    expect(store.antiPatterns.length).toBe(1);
    // Should keep the higher confidence one
    expect(store.antiPatterns[0].confidence).toBe(80);
  });

  it('should prune and report counts', () => {
    // Add many patterns to force pruning
    for (let i = 0; i < 250; i++) {
      store.errorPatterns.push({
        id: `p${i}`,
        category: 'code-pattern',
        matchPattern: `pattern-${i}`,
        description: `Pattern ${i}`,
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        ruleGenerated: false,
      });
    }

    const result = consolidateIfDue(store);
    expect(result.performed).toBe(true);
    expect(result.pruned).toBeDefined();
    expect(result.pruned!.errorPatterns).toBeGreaterThan(0);
  });
});
