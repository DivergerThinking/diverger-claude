import { describe, it, expect, beforeEach } from 'vitest';
import { matchAndUpdatePatterns, findPatternsForRuleGeneration } from '../../../src/learning/pattern-matcher.js';
import { createDefaultMemoryStore } from '../../../src/memory/store.js';
import type { MemoryStore } from '../../../src/core/types.js';

describe('Pattern Matcher', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = createDefaultMemoryStore();
  });

  describe('matchAndUpdatePatterns', () => {
    it('should create new patterns from classifications', () => {
      const classifications = [
        { category: 'tool-error' as const, confidence: 80, matchPattern: 'EACCES', description: 'Permission denied', tool: 'Bash' },
        { category: 'code-pattern' as const, confidence: 60, matchPattern: 'TS2345', description: 'Type error' },
      ];

      const updated = matchAndUpdatePatterns(store, classifications);
      expect(updated).toHaveLength(2);
      expect(store.errorPatterns).toHaveLength(2);
    });

    it('should increment occurrences for duplicate patterns', () => {
      const classification = {
        category: 'tool-error' as const,
        confidence: 80,
        matchPattern: 'EACCES',
        description: 'Permission denied',
      };

      matchAndUpdatePatterns(store, [classification]);
      matchAndUpdatePatterns(store, [classification]);
      matchAndUpdatePatterns(store, [classification]);

      expect(store.errorPatterns).toHaveLength(1);
      expect(store.errorPatterns[0].occurrences).toBe(3);
    });
  });

  describe('findPatternsForRuleGeneration', () => {
    it('should find patterns above threshold', () => {
      store.errorPatterns.push({
        id: 'p1',
        category: 'tool-error',
        matchPattern: 'EACCES',
        description: 'Permission denied',
        occurrences: 5,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        ruleGenerated: false,
      });
      store.errorPatterns.push({
        id: 'p2',
        category: 'code-pattern',
        matchPattern: 'TS2345',
        description: 'Type error',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        ruleGenerated: false,
      });

      const result = findPatternsForRuleGeneration(store, 3);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
    });

    it('should exclude already-generated patterns', () => {
      store.errorPatterns.push({
        id: 'p1',
        category: 'tool-error',
        matchPattern: 'EACCES',
        description: 'Permission denied',
        occurrences: 5,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        ruleGenerated: true,
      });

      const result = findPatternsForRuleGeneration(store, 3);
      expect(result).toHaveLength(0);
    });
  });
});
