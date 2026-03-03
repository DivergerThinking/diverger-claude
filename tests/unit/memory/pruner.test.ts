import { describe, it, expect, beforeEach } from 'vitest';
import { pruneMemory, isConsolidationDue } from '../../../src/memory/pruner.js';
import { createDefaultMemoryStore } from '../../../src/memory/store.js';
import { addErrorPattern, addAntiPattern, addRepairLog } from '../../../src/memory/project-memory.js';
import type { MemoryStore } from '../../../src/core/types.js';

describe('Memory Pruner', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = createDefaultMemoryStore();
  });

  describe('pruneMemory', () => {
    it('should be a no-op on empty store', () => {
      const result = pruneMemory(store);
      expect(result.errorPatternsPruned).toBe(0);
      expect(result.repairLogPruned).toBe(0);
      expect(result.antiPatternsPruned).toBe(0);
    });

    it('should prune old error patterns with low occurrences', () => {
      // Add a pattern with old lastSeen and only 1 occurrence
      store.errorPatterns.push({
        id: 'old-pattern',
        category: 'tool-error',
        matchPattern: 'old error',
        description: 'Old error',
        occurrences: 1,
        firstSeen: '2020-01-01T00:00:00.000Z',
        lastSeen: '2020-01-01T00:00:00.000Z',
        ruleGenerated: false,
      });

      // Add a recent pattern
      addErrorPattern(store, {
        category: 'code-pattern',
        matchPattern: 'recent',
        description: 'Recent error',
      });

      const result = pruneMemory(store);
      expect(result.errorPatternsPruned).toBe(1);
      expect(store.errorPatterns).toHaveLength(1);
      expect(store.errorPatterns[0].description).toBe('Recent error');
    });

    it('should keep old patterns with >= 3 occurrences', () => {
      store.errorPatterns.push({
        id: 'frequent-old',
        category: 'tool-error',
        matchPattern: 'frequent error',
        description: 'Frequent old error',
        occurrences: 5,
        firstSeen: '2020-01-01T00:00:00.000Z',
        lastSeen: '2020-01-01T00:00:00.000Z',
        ruleGenerated: false,
      });

      const result = pruneMemory(store);
      expect(result.errorPatternsPruned).toBe(0);
      expect(store.errorPatterns).toHaveLength(1);
    });

    it('should cap error patterns to MAX_ERROR_PATTERNS', () => {
      for (let i = 0; i < 250; i++) {
        addErrorPattern(store, {
          category: 'code-pattern',
          matchPattern: `error-${i}`,
          description: `Error ${i}`,
        });
      }
      // Bump some to have higher occurrences
      for (let i = 0; i < 10; i++) {
        addErrorPattern(store, { category: 'code-pattern', matchPattern: `error-${i}`, description: `Error ${i}` });
      }

      expect(store.errorPatterns.length).toBe(250);

      const result = pruneMemory(store);
      expect(store.errorPatterns.length).toBe(200);
      expect(result.errorPatternsPruned).toBe(50);
      // The first 10 should survive (they have 2 occurrences, sorted higher)
      const ids = store.errorPatterns.map((p) => p.id);
      expect(ids.length).toBe(200);
    });

    it('should cap repair log to MAX_REPAIR_LOG', () => {
      for (let i = 0; i < 550; i++) {
        addRepairLog(store, {
          diagnosisId: `D${i}`,
          description: `Repair ${i}`,
          success: true,
          confidence: 90,
        });
      }

      const result = pruneMemory(store);
      expect(store.repairLog.length).toBe(500);
      expect(result.repairLogPruned).toBe(50);
      // Should keep the most recent (last 500)
      expect(store.repairLog[0].diagnosisId).toBe('D50');
    });

    it('should cap anti-patterns to MAX_ANTI_PATTERNS', () => {
      for (let i = 0; i < 120; i++) {
        addAntiPattern(store, {
          pattern: `anti-pattern-${i}`,
          reason: 'reason',
          alternative: 'alt',
          source: 'manual',
          confidence: i, // 0..119
        });
      }

      const result = pruneMemory(store);
      expect(store.antiPatterns.length).toBe(100);
      expect(result.antiPatternsPruned).toBe(20);
      // Should keep highest confidence (119, 118, ..., 20)
      expect(store.antiPatterns[0].confidence).toBe(119);
    });

    it('should update lastConsolidation timestamp', () => {
      expect(store.stats.lastConsolidation).toBeUndefined();
      pruneMemory(store);
      expect(store.stats.lastConsolidation).toBeTruthy();
    });
  });

  describe('isConsolidationDue', () => {
    it('should return true when no previous consolidation', () => {
      expect(isConsolidationDue(store, 7)).toBe(true);
    });

    it('should return false when consolidated recently', () => {
      store.stats.lastConsolidation = new Date().toISOString();
      expect(isConsolidationDue(store, 7)).toBe(false);
    });

    it('should return true when interval has passed', () => {
      const old = new Date();
      old.setDate(old.getDate() - 10);
      store.stats.lastConsolidation = old.toISOString();
      expect(isConsolidationDue(store, 7)).toBe(true);
    });
  });
});
