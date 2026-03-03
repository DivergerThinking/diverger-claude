import { describe, it, expect, beforeEach } from 'vitest';
import {
  addErrorPattern,
  queryErrorPatterns,
  getTopErrorPatterns,
  addRepairLog,
  addEvolutionEntry,
  addAntiPattern,
  getTopAntiPatterns,
  addBestPractice,
  incrementSessions,
} from '../../../src/memory/project-memory.js';
import { createDefaultMemoryStore } from '../../../src/memory/store.js';
import type { MemoryStore } from '../../../src/core/types.js';

describe('Project Memory Operations', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = createDefaultMemoryStore();
  });

  describe('addErrorPattern', () => {
    it('should add a new error pattern', () => {
      const result = addErrorPattern(store, {
        category: 'tool-error',
        tool: 'Bash',
        matchPattern: 'permission denied',
        description: 'Permission denied error',
      });

      expect(result.id).toBeTruthy();
      expect(result.occurrences).toBe(1);
      expect(result.category).toBe('tool-error');
      expect(store.errorPatterns).toHaveLength(1);
      expect(store.stats.totalErrorPatterns).toBe(1);
    });

    it('should deduplicate by incrementing occurrences', () => {
      addErrorPattern(store, {
        category: 'tool-error',
        matchPattern: 'permission denied',
        description: 'Permission denied error',
      });

      const result = addErrorPattern(store, {
        category: 'tool-error',
        matchPattern: 'permission denied',
        description: 'Permission denied error again',
      });

      expect(result.occurrences).toBe(2);
      expect(store.errorPatterns).toHaveLength(1);
    });

    it('should update resolution on duplicate', () => {
      addErrorPattern(store, {
        category: 'tool-error',
        matchPattern: 'permission denied',
        description: 'Permission denied',
      });

      const result = addErrorPattern(store, {
        category: 'tool-error',
        matchPattern: 'permission denied',
        description: 'Permission denied',
        resolution: 'chmod +x the file',
      });

      expect(result.resolution).toBe('chmod +x the file');
    });

    it('should keep separate patterns for different matchPatterns', () => {
      addErrorPattern(store, {
        category: 'tool-error',
        matchPattern: 'permission denied',
        description: 'Permission denied',
      });

      addErrorPattern(store, {
        category: 'code-pattern',
        matchPattern: 'TS2345',
        description: 'Type mismatch',
      });

      expect(store.errorPatterns).toHaveLength(2);
    });
  });

  describe('queryErrorPatterns', () => {
    it('should return all patterns when no category filter', () => {
      addErrorPattern(store, { category: 'tool-error', matchPattern: 'err1', description: 'err1' });
      addErrorPattern(store, { category: 'code-pattern', matchPattern: 'err2', description: 'err2' });

      const all = queryErrorPatterns(store);
      expect(all).toHaveLength(2);
    });

    it('should filter by category', () => {
      addErrorPattern(store, { category: 'tool-error', matchPattern: 'err1', description: 'err1' });
      addErrorPattern(store, { category: 'code-pattern', matchPattern: 'err2', description: 'err2' });

      const toolErrors = queryErrorPatterns(store, 'tool-error');
      expect(toolErrors).toHaveLength(1);
      expect(toolErrors[0].category).toBe('tool-error');
    });
  });

  describe('getTopErrorPatterns', () => {
    it('should return patterns sorted by occurrences desc', () => {
      addErrorPattern(store, { category: 'tool-error', matchPattern: 'err1', description: 'low' });
      const p2 = addErrorPattern(store, { category: 'tool-error', matchPattern: 'err2', description: 'high' });
      // Increment p2 twice more
      addErrorPattern(store, { category: 'tool-error', matchPattern: 'err2', description: 'high' });
      addErrorPattern(store, { category: 'tool-error', matchPattern: 'err2', description: 'high' });

      const top = getTopErrorPatterns(store, 1);
      expect(top).toHaveLength(1);
      expect(top[0].id).toBe(p2.id);
      expect(top[0].occurrences).toBe(3);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 5; i++) {
        addErrorPattern(store, { category: 'tool-error', matchPattern: `err${i}`, description: `err${i}` });
      }

      const top = getTopErrorPatterns(store, 3);
      expect(top).toHaveLength(3);
    });
  });

  describe('addRepairLog', () => {
    it('should add a repair entry with timestamp', () => {
      const entry = addRepairLog(store, {
        diagnosisId: 'D1',
        description: 'Regenerated CLAUDE.md',
        success: true,
        confidence: 95,
      });

      expect(entry.timestamp).toBeTruthy();
      expect(store.repairLog).toHaveLength(1);
      expect(store.stats.totalRepairs).toBe(1);
      expect(store.stats.successfulRepairs).toBe(1);
    });

    it('should not increment successfulRepairs on failure', () => {
      addRepairLog(store, {
        diagnosisId: 'D2',
        description: 'Failed to restore settings',
        success: false,
        confidence: 80,
      });

      expect(store.stats.totalRepairs).toBe(1);
      expect(store.stats.successfulRepairs).toBe(0);
    });
  });

  describe('addEvolutionEntry', () => {
    it('should add an evolution entry with timestamp', () => {
      const entry = addEvolutionEntry(store, {
        type: 'dependency-added',
        description: 'Added vitest',
        data: { package: 'vitest' },
      });

      expect(entry.timestamp).toBeTruthy();
      expect(store.evolutionLog).toHaveLength(1);
    });
  });

  describe('addAntiPattern', () => {
    it('should add a new anti-pattern', () => {
      const result = addAntiPattern(store, {
        pattern: 'Using any type',
        reason: 'Loses type safety',
        alternative: 'Use unknown and narrow',
        source: 'manual',
        confidence: 80,
      });

      expect(result.id).toBeTruthy();
      expect(store.antiPatterns).toHaveLength(1);
    });

    it('should deduplicate and update confidence if higher', () => {
      addAntiPattern(store, {
        pattern: 'Using any type',
        reason: 'Loses type safety',
        alternative: 'Use unknown',
        source: 'manual',
        confidence: 60,
      });

      const result = addAntiPattern(store, {
        pattern: 'Using any type',
        reason: 'Loses all type safety',
        alternative: 'Use unknown and narrow with type guards',
        source: 'error-analysis',
        confidence: 85,
      });

      expect(store.antiPatterns).toHaveLength(1);
      expect(result.confidence).toBe(85);
      expect(result.reason).toBe('Loses all type safety');
    });

    it('should NOT update if new confidence is lower', () => {
      addAntiPattern(store, {
        pattern: 'Using any type',
        reason: 'High confidence reason',
        alternative: 'Use unknown',
        source: 'manual',
        confidence: 90,
      });

      const result = addAntiPattern(store, {
        pattern: 'Using any type',
        reason: 'Lower confidence reason',
        alternative: 'Use unknown',
        source: 'manual',
        confidence: 50,
      });

      expect(result.confidence).toBe(90);
      expect(result.reason).toBe('High confidence reason');
    });
  });

  describe('getTopAntiPatterns', () => {
    it('should return patterns sorted by confidence desc', () => {
      addAntiPattern(store, { pattern: 'low', reason: 'r', alternative: 'a', source: 'manual', confidence: 30 });
      addAntiPattern(store, { pattern: 'high', reason: 'r', alternative: 'a', source: 'manual', confidence: 90 });
      addAntiPattern(store, { pattern: 'mid', reason: 'r', alternative: 'a', source: 'manual', confidence: 60 });

      const top = getTopAntiPatterns(store, 2);
      expect(top).toHaveLength(2);
      expect(top[0].pattern).toBe('high');
      expect(top[1].pattern).toBe('mid');
    });
  });

  describe('addBestPractice', () => {
    it('should add a new best practice', () => {
      const result = addBestPractice(store, {
        practice: 'Always validate inputs',
        reason: 'Prevents runtime errors',
        source: 'manual',
        confidence: 85,
      });

      expect(result.id).toBeTruthy();
      expect(store.bestPractices).toHaveLength(1);
    });

    it('should deduplicate by practice text', () => {
      addBestPractice(store, {
        practice: 'Always validate inputs',
        reason: 'v1',
        source: 'manual',
        confidence: 60,
      });
      addBestPractice(store, {
        practice: 'Always validate inputs',
        reason: 'v2',
        source: 'manual',
        confidence: 80,
      });

      expect(store.bestPractices).toHaveLength(1);
      expect(store.bestPractices[0].confidence).toBe(80);
    });
  });

  describe('incrementSessions', () => {
    it('should increment counter and set timestamps', () => {
      incrementSessions(store);
      expect(store.stats.totalSessions).toBe(1);
      expect(store.stats.firstSession).toBeTruthy();
      expect(store.stats.lastSession).toBeTruthy();
    });

    it('should not overwrite firstSession on subsequent calls', () => {
      incrementSessions(store);
      const first = store.stats.firstSession;
      incrementSessions(store);
      expect(store.stats.firstSession).toBe(first);
      expect(store.stats.totalSessions).toBe(2);
    });
  });
});
