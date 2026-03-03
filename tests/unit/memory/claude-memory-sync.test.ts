import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildDivergerSection,
  replaceDivergerSection,
} from '../../../src/memory/claude-memory-sync.js';
import { createDefaultMemoryStore } from '../../../src/memory/store.js';
import { addAntiPattern, addErrorPattern } from '../../../src/memory/project-memory.js';
import type { MemoryStore } from '../../../src/core/types.js';

describe('Claude Memory Sync', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = createDefaultMemoryStore();
  });

  describe('buildDivergerSection', () => {
    it('should produce minimal section for empty store', () => {
      const section = buildDivergerSection(store);
      expect(section).toContain('<!-- diverger:start -->');
      expect(section).toContain('<!-- diverger:end -->');
      expect(section).toContain('## Diverger Learnings (auto-generated)');
    });

    it('should include anti-patterns', () => {
      addAntiPattern(store, {
        pattern: 'Using any type',
        reason: 'Loses type safety',
        alternative: 'Use unknown',
        source: 'manual',
        confidence: 85,
      });

      const section = buildDivergerSection(store);
      expect(section).toContain('### Anti-patterns aprendidos');
      expect(section).toContain('Using any type');
      expect(section).toContain('Use unknown');
      expect(section).toContain('confianza: 85');
    });

    it('should include error patterns', () => {
      addErrorPattern(store, {
        category: 'tool-error',
        matchPattern: 'EACCES',
        description: 'Permission denied in /dist/',
        resolution: 'Add dist/ to sandbox.allow',
      });
      // Increment so it's the top pattern
      addErrorPattern(store, {
        category: 'tool-error',
        matchPattern: 'EACCES',
        description: 'Permission denied in /dist/',
      });

      const section = buildDivergerSection(store);
      expect(section).toContain('### Errores recurrentes');
      expect(section).toContain('Permission denied in /dist/');
      expect(section).toContain('Add dist/ to sandbox.allow');
      expect(section).toContain('2 ocurrencias');
    });

    it('should include health stats when repairs exist', () => {
      store.stats.totalSessions = 10;
      store.stats.totalRepairs = 5;
      store.stats.successfulRepairs = 4;

      const section = buildDivergerSection(store);
      expect(section).toContain('### Estado del plugin');
      expect(section).toContain('Sesiones: 10');
      expect(section).toContain('4/5 (80%)');
    });

    it('should limit to top 5 anti-patterns', () => {
      for (let i = 0; i < 10; i++) {
        addAntiPattern(store, {
          pattern: `pattern-${i}`,
          reason: 'r',
          alternative: 'a',
          source: 'manual',
          confidence: i * 10,
        });
      }

      const section = buildDivergerSection(store);
      // Should only have the top 5 (confidence 90, 80, 70, 60, 50)
      expect(section).toContain('pattern-9');
      expect(section).toContain('pattern-5');
      expect(section).not.toContain('pattern-4');
    });
  });

  describe('replaceDivergerSection', () => {
    it('should append section to empty content', () => {
      const result = replaceDivergerSection('', '<!-- diverger:start -->\ntest\n<!-- diverger:end -->');
      expect(result).toContain('<!-- diverger:start -->');
      expect(result).toContain('test');
    });

    it('should append section to existing content', () => {
      const existing = '# My Memory\nSome notes here\n';
      const section = '<!-- diverger:start -->\nlearnings\n<!-- diverger:end -->';
      const result = replaceDivergerSection(existing, section);
      expect(result).toContain('# My Memory');
      expect(result).toContain('Some notes here');
      expect(result).toContain('<!-- diverger:start -->');
    });

    it('should replace existing diverger section', () => {
      const existing = `# My Memory
Some notes here

<!-- diverger:start -->
old content
<!-- diverger:end -->

More notes`;
      const section = '<!-- diverger:start -->\nnew content\n<!-- diverger:end -->';
      const result = replaceDivergerSection(existing, section);
      expect(result).toContain('# My Memory');
      expect(result).toContain('new content');
      expect(result).not.toContain('old content');
      expect(result).toContain('More notes');
    });

    it('should preserve content before and after diverger section', () => {
      const existing = `before
<!-- diverger:start -->
middle
<!-- diverger:end -->
after`;
      const section = '<!-- diverger:start -->\nreplaced\n<!-- diverger:end -->';
      const result = replaceDivergerSection(existing, section);
      expect(result).toMatch(/^before\n/);
      expect(result).toContain('replaced');
      expect(result).toMatch(/after$/);
    });
  });
});
