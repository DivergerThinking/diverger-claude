import { describe, it, expect, vi } from 'vitest';
import { ThreeWayMerge } from '../../../src/governance/merge.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import type { DivergentMeta, GeneratedFile } from '../../../src/core/types.js';

// Mock the fs utility to control what "exists on disk"
vi.mock('../../../src/utils/fs.js', () => ({
  readFileOrNull: vi.fn(),
}));

import { readFileOrNull } from '../../../src/utils/fs.js';
const mockReadFileOrNull = vi.mocked(readFileOrNull);

function makeFile(path: string, content: string): GeneratedFile {
  return { path, content };
}

function makeMeta(
  fileHashes: Record<string, string> = {},
  fileContents: Record<string, string> = {},
): DivergentMeta {
  return {
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    detectedStack: [],
    appliedProfiles: [],
    fileHashes,
    ruleGovernance: {},
    fileContents,
    trackedDependencies: [],
  };
}

describe('ThreeWayMerge', () => {
  const merger = new ThreeWayMerge();

  // ── Case 1: File does not exist on disk → auto-apply (new file) ───────

  describe('Case 1: new file (does not exist on disk)', () => {
    it('should auto-apply when file does not exist on disk', async () => {
      mockReadFileOrNull.mockResolvedValue(null);

      const file = makeFile('/project/.claude/CLAUDE.md', '# New content');
      const result = await merger.mergeFile(file, null);

      expect(result.outcome).toBe('auto-apply');
      expect(result.content).toBe('# New content');
      expect(result.path).toBe('/project/.claude/CLAUDE.md');
    });

    it('should auto-apply new file even with meta present', async () => {
      mockReadFileOrNull.mockResolvedValue(null);

      const file = makeFile('/project/.claude/rules/new.md', 'New rule');
      const meta = makeMeta({});
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('auto-apply');
      expect(result.content).toBe('New rule');
    });
  });

  // ── Case 2: No stored hash (first run / meta lost) ───────────────────

  describe('Case 2: no stored hash', () => {
    it('should skip when file exists with identical content and no hash', async () => {
      const content = '# Same content';
      mockReadFileOrNull.mockResolvedValue(content);

      const file = makeFile('/project/.claude/CLAUDE.md', content);
      const result = await merger.mergeFile(file, null);

      expect(result.outcome).toBe('skip');
    });

    it('should conflict when file exists with different content and no meta', async () => {
      mockReadFileOrNull.mockResolvedValue('# Existing different content');

      const file = makeFile('/project/.claude/CLAUDE.md', '# New content');
      const result = await merger.mergeFile(file, null);

      expect(result.outcome).toBe('conflict');
      expect(result.content).toBe('# New content');
      expect(result.conflictDetails).toBeDefined();
    });

    it('should conflict when meta exists but file hash is missing', async () => {
      mockReadFileOrNull.mockResolvedValue('# Existing content');

      const file = makeFile('/project/.claude/CLAUDE.md', '# New content');
      const meta = makeMeta({}); // no hash for this file
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('conflict');
    });
  });

  // ── Case 3: Nobody changed anything → skip ───────────────────────────

  describe('Case 3: no changes from either side', () => {
    it('should skip when base, current, and new are all identical', async () => {
      const content = '# Unchanged content';
      const hash = hashForMeta(content);
      mockReadFileOrNull.mockResolvedValue(content);

      const file = makeFile('/project/.claude/CLAUDE.md', content);
      const meta = makeMeta({ '/project/.claude/CLAUDE.md': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('skip');
    });
  });

  // ── Case 4: Only library changed → auto-apply ────────────────────────

  describe('Case 4: only library changed (team did not touch)', () => {
    it('should auto-apply when only the new generated content differs', async () => {
      const originalContent = '# Original';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue(originalContent); // disk matches base

      const file = makeFile('/project/.claude/CLAUDE.md', '# Updated by library');
      const meta = makeMeta({ '/project/.claude/CLAUDE.md': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('auto-apply');
      expect(result.content).toBe('# Updated by library');
    });
  });

  // ── Case 5: Only team changed → keep ─────────────────────────────────

  describe('Case 5: only team changed (library did not change)', () => {
    it('should keep when only the team modified the file', async () => {
      const originalContent = '# Original';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('# Modified by team'); // disk differs from base

      const file = makeFile('/project/.claude/CLAUDE.md', originalContent); // new == base
      const meta = makeMeta({ '/project/.claude/CLAUDE.md': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('keep');
      expect(result.content).toBeUndefined();
    });
  });

  // ── Case 6: Both changed → smart merge or conflict ────────────────────

  describe('Case 6: both changed', () => {
    it('should merge markdown files by sections (team sections preserved)', async () => {
      const originalContent = '## Section A\nOriginal A\n\n## Section B\nOriginal B';
      const hash = hashForMeta(originalContent);

      // Team changed section A and kept section B
      const teamContent = '## Section A\nTeam modified A\n\n## Section B\nOriginal B';
      mockReadFileOrNull.mockResolvedValue(teamContent);

      // Library changed section B and added section C
      const libraryContent = '## Section A\nOriginal A\n\n## Section B\nLibrary updated B\n\n## Section C\nNew section C';
      const file = makeFile('/project/.claude/CLAUDE.md', libraryContent);
      const meta = makeMeta({ '/project/.claude/CLAUDE.md': hash });
      // Pass originalContent as base for true three-way merge
      const result = await merger.mergeFile(file, meta, originalContent);

      expect(result.outcome).toBe('merged');
      // Team changed section A, library didn't → keep team's
      expect(result.content).toContain('Team modified A');
      // Library changed section B, team didn't → use library's
      expect(result.content).toContain('Library updated B');
      // Library added section C (not in base) → include it
      expect(result.content).toContain('New section C');
    });

    it('should merge JSON files by top-level keys (team wins for shared keys)', async () => {
      const originalContent = JSON.stringify({ a: 1, b: 2 }, null, 2);
      const hash = hashForMeta(originalContent);

      // Team changed key "b"
      const teamContent = JSON.stringify({ a: 1, b: 99 }, null, 2);
      mockReadFileOrNull.mockResolvedValue(teamContent);

      // Library added key "c" and changed key "b"
      const libraryContent = JSON.stringify({ a: 1, b: 3, c: 'new' }, null, 2);
      const file = makeFile('/project/.claude/settings.json', libraryContent);
      const meta = makeMeta({ '/project/.claude/settings.json': hash });
      // Pass originalContent as base for true three-way merge
      const result = await merger.mergeFile(file, meta, originalContent);

      expect(result.outcome).toBe('merged');
      const parsed = JSON.parse(result.content!);
      // Team wins for shared keys
      expect(parsed.b).toBe(99);
      // Library's new key is included (via { ...ours, ...theirs })
      expect(parsed.a).toBe(1);
      // Library-only key is preserved
      expect(parsed.c).toBe('new');
    });

    it('should conflict for non-md/non-json files when both changed', async () => {
      const originalContent = 'original yaml content';
      const hash = hashForMeta(originalContent);

      mockReadFileOrNull.mockResolvedValue('team changed yaml');

      const file = makeFile('/project/.claude/config.yaml', 'library changed yaml');
      const meta = makeMeta({ '/project/.claude/config.yaml': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('conflict');
      expect(result.conflictDetails).toBeDefined();
    });

    it('should conflict for invalid JSON when both changed', async () => {
      const originalContent = '{"valid": true}';
      const hash = hashForMeta(originalContent);

      mockReadFileOrNull.mockResolvedValue('not valid json {{{');

      const file = makeFile('/project/.claude/settings.json', '{"new": true}');
      const meta = makeMeta({ '/project/.claude/settings.json': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('conflict');
      expect(result.conflictDetails).toContain('JSON');
    });
  });

  // ── Case 6b: Mandatory governance when both changed (A4) ─────────────

  describe('Case 6b: mandatory governance when both sides changed', () => {
    it('should force library version when governance is mandatory and both changed', async () => {
      const originalContent = '# Original mandatory rule';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('# Team AND library both changed');

      const file = makeFile('/project/.claude/rules/security.md', '# Library updated mandatory rule');
      const meta = makeMeta({ '/project/.claude/rules/security.md': hash });
      const result = await merger.mergeFile(file, meta, originalContent, 'mandatory');

      expect(result.outcome).toBe('auto-apply');
      expect(result.content).toBe('# Library updated mandatory rule');
      expect(result.conflictDetails).toContain('mandatory');
    });

    it('should attempt smart merge when governance is recommended and both changed', async () => {
      const originalContent = '## Section A\nOriginal A';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('## Section A\nTeam modified A');

      const file = makeFile('/project/.claude/rules/style.md', '## Section A\nLibrary modified A');
      const meta = makeMeta({ '/project/.claude/rules/style.md': hash });
      const result = await merger.mergeFile(file, meta, originalContent, 'recommended');

      // Should attempt merge, not force auto-apply
      expect(result.outcome).toBe('merged');
      // Team's modifications should be preserved in the merged content
      expect(result.content).toContain('Team modified A');
    });
  });

  // ── Case 5b: Mandatory governance overrides team changes ─────────────

  describe('Case 5b: mandatory governance enforcement', () => {
    it('should force library version when governance is mandatory and only team changed', async () => {
      const originalContent = '# Original mandatory rule';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('# Team modified mandatory rule');

      const file = makeFile('/project/.claude/rules/security.md', originalContent);
      const meta = makeMeta({ '/project/.claude/rules/security.md': hash });
      const result = await merger.mergeFile(file, meta, null, 'mandatory');

      expect(result.outcome).toBe('auto-apply');
      expect(result.content).toBe(originalContent);
      expect(result.conflictDetails).toContain('mandatory');
    });

    it('should keep team changes when governance is recommended', async () => {
      const originalContent = '# Original recommended rule';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('# Team modified recommended rule');

      const file = makeFile('/project/.claude/rules/style.md', originalContent);
      const meta = makeMeta({ '/project/.claude/rules/style.md': hash });
      const result = await merger.mergeFile(file, meta, null, 'recommended');

      expect(result.outcome).toBe('keep');
    });
  });

  // ── Edge cases: empty content ────────────────────────────────────────

  describe('Edge case: empty file content', () => {
    it('should auto-apply when generated content is empty and file does not exist', async () => {
      mockReadFileOrNull.mockResolvedValue(null);

      const file = makeFile('/project/.claude/empty.md', '');
      const result = await merger.mergeFile(file, null);

      expect(result.outcome).toBe('auto-apply');
      expect(result.content).toBe('');
    });

    it('should skip when both existing and generated content are empty', async () => {
      mockReadFileOrNull.mockResolvedValue('');

      const file = makeFile('/project/.claude/empty.md', '');
      const result = await merger.mergeFile(file, null);

      expect(result.outcome).toBe('skip');
    });

    it('should handle empty base content in three-way merge', async () => {
      const originalContent = '';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('# Team added content');

      const file = makeFile('/project/.claude/CLAUDE.md', '# Library added content');
      const meta = makeMeta({ '/project/.claude/CLAUDE.md': hash });
      const result = await merger.mergeFile(file, meta);

      // Both sides changed from empty base → conflict or merged
      expect(['conflict', 'merged']).toContain(result.outcome);
    });
  });

  // ── Case 6c: Markdown merge produces empty content → conflict ────────

  describe('Case 6c: markdown merge results in empty content', () => {
    it('should conflict when markdown merge eliminates all sections', async () => {
      // Base has sections that both sides reference
      const originalContent = '## Section A\nOriginal A\n\n## Section B\nOriginal B';
      const hash = hashForMeta(originalContent);

      // Team removed section B (was in base)
      const teamContent = '## Section A\nTeam A';
      mockReadFileOrNull.mockResolvedValue(teamContent);

      // Library removed section A (was in base), kept only preamble-like content
      // Both sides removed what the other kept → all sections eliminated
      const libraryContent = '## Section B\nLibrary B';
      const file = makeFile('/project/.claude/CLAUDE.md', libraryContent);
      const meta = makeMeta(
        { '/project/.claude/CLAUDE.md': hash },
        { '/project/.claude/CLAUDE.md': originalContent },
      );
      const result = await merger.mergeFile(file, meta, originalContent);

      // Both removed the other's sections → merged is empty → should conflict
      // (Library removed A which team kept, team removed B which library kept)
      // The 3-way logic: A in base+theirs but removed by ours → skip; B in base+ours but removed by theirs → skip
      expect(result.outcome).toBe('conflict');
      expect(result.conflictDetails).toContain('vacío');
    });
  });

  // ── BUG-11: Duplicate headings preserved ──────────────────────────────

  describe('Duplicate headings in markdown', () => {
    it('should preserve both sections with duplicate ## headings', async () => {
      const content = '## Notes\nFirst notes\n\n## Notes\nSecond notes';
      const hash = hashForMeta(content);
      mockReadFileOrNull.mockResolvedValue(content); // disk matches base

      // Library updates content identically (no changes)
      const file = makeFile('/project/.claude/doc.md', content);
      const meta = makeMeta({ '/project/.claude/doc.md': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('skip');
    });

    it('should merge markdown with duplicate headings without losing sections', async () => {
      const originalContent = '## Notes\nFirst notes\n\n## Notes\nSecond notes';
      const hash = hashForMeta(originalContent);

      // Team kept content as-is
      mockReadFileOrNull.mockResolvedValue(originalContent);

      // Library added new section
      const libraryContent = '## Notes\nFirst notes\n\n## Notes\nSecond notes\n\n## New\nNew section';
      const file = makeFile('/project/.claude/doc.md', libraryContent);
      const meta = makeMeta({ '/project/.claude/doc.md': hash });
      const result = await merger.mergeFile(file, meta);

      // Library changed, team didn't → auto-apply
      expect(result.outcome).toBe('auto-apply');
    });
  });

  // ── BUG-15: JSON array deduplication for objects ──────────────────────

  describe('JSON merge array deduplication', () => {
    it('should deduplicate arrays of objects in two-way merge', async () => {
      const originalContent = JSON.stringify({ items: [{ name: 'a' }] }, null, 2);
      const hash = hashForMeta(originalContent);

      // Team added duplicate item
      const teamContent = JSON.stringify({ items: [{ name: 'a' }, { name: 'b' }] }, null, 2);
      mockReadFileOrNull.mockResolvedValue(teamContent);

      // Library also added the same item
      const libraryContent = JSON.stringify({ items: [{ name: 'a' }, { name: 'b' }] }, null, 2);
      const file = makeFile('/project/.claude/config.json', libraryContent);
      const meta = makeMeta({ '/project/.claude/config.json': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('merged');
      const parsed = JSON.parse(result.content!);
      // Should not have duplicate objects
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0]).toEqual({ name: 'a' });
      expect(parsed.items[1]).toEqual({ name: 'b' });
    });
  });

  // ── BUG-38: deduplicateArrays with different key order ──────────────

  describe('deduplicateArrays with different key order', () => {
    it('should deduplicate objects with same keys in different order', async () => {
      const originalContent = JSON.stringify({ items: [] }, null, 2);
      const hash = hashForMeta(originalContent);

      // Team added {a:1, b:2}
      const teamContent = JSON.stringify({ items: [{ a: 1, b: 2 }] }, null, 2);
      mockReadFileOrNull.mockResolvedValue(teamContent);

      // Library added {b:2, a:1} (same data, different key order)
      const libraryContent = JSON.stringify({ items: [{ b: 2, a: 1 }] }, null, 2);
      const file = makeFile('/project/.claude/config.json', libraryContent);
      const meta = makeMeta({ '/project/.claude/config.json': hash });
      const result = await merger.mergeFile(file, meta);

      expect(result.outcome).toBe('merged');
      const parsed = JSON.parse(result.content!);
      // Should have only 1 item since {a:1,b:2} and {b:2,a:1} are the same
      expect(parsed.items).toHaveLength(1);
    });
  });

  // ── mergeAll ──────────────────────────────────────────────────────────

  describe('mergeAll', () => {
    it('should process multiple files and return results for each', async () => {
      // File 1: does not exist → auto-apply
      mockReadFileOrNull
        .mockResolvedValueOnce(null)
        // File 2: identical → skip
        .mockResolvedValueOnce('# Same');

      const files: GeneratedFile[] = [
        makeFile('/project/.claude/CLAUDE.md', '# New file'),
        makeFile('/project/.claude/rules/rule.md', '# Same'),
      ];

      const results = await merger.mergeAll(files, null);

      expect(results).toHaveLength(2);
      expect(results[0]!.outcome).toBe('auto-apply');
      expect(results[1]!.outcome).toBe('skip');
    });

    it('should handle empty files array', async () => {
      const results = await merger.mergeAll([], null);
      expect(results).toHaveLength(0);
    });

    it('should handle errors in individual files without stopping others', async () => {
      // First file: readFileOrNull throws
      mockReadFileOrNull
        .mockRejectedValueOnce(new Error('Permission denied'))
        // Second file: does not exist → auto-apply
        .mockResolvedValueOnce(null);

      const files: GeneratedFile[] = [
        makeFile('/project/broken.md', '# Content'),
        makeFile('/project/good.md', '# Good content'),
      ];

      const results = await merger.mergeAll(files, null);

      expect(results).toHaveLength(2);
      expect(results[0]!.outcome).toBe('error');
      expect(results[0]!.conflictDetails).toContain('Permission denied');
      expect(results[1]!.outcome).toBe('auto-apply');
    });

    it('should pass governance from governanceMap to mergeFile', async () => {
      const originalContent = '# Original';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('# Team changed');

      const file = makeFile('/project/mandatory.md', originalContent);
      file.governance = undefined; // No governance on file itself

      const meta = makeMeta({ '/project/mandatory.md': hash });
      const governanceMap = { '/project/mandatory.md': 'mandatory' as const };
      const results = await merger.mergeAll([file], meta, governanceMap);

      expect(results[0]!.outcome).toBe('auto-apply');
      expect(results[0]!.conflictDetails).toContain('mandatory');
    });

    it('should resolve governance from relative key when file.path is absolute', async () => {
      const originalContent = '# Original';
      const hash = hashForMeta(originalContent);
      mockReadFileOrNull.mockResolvedValue('# Team changed');

      const file = makeFile('/project/.claude/rules/sec.md', originalContent);
      file.governance = undefined;

      const meta = makeMeta({ '.claude/rules/sec.md': hash });
      // Governance map uses relative key
      const governanceMap = { '.claude/rules/sec.md': 'mandatory' as const };
      const results = await merger.mergeAll([file], meta, governanceMap, '/project');

      expect(results[0]!.outcome).toBe('auto-apply');
      expect(results[0]!.conflictDetails).toContain('mandatory');
    });

    it('should return mixed outcomes for different file states', async () => {
      const originalA = '# Original A';
      const hashA = hashForMeta(originalA);
      const originalB = '# Original B';
      const hashB = hashForMeta(originalB);

      mockReadFileOrNull
        // File A: team changed, library same → keep
        .mockResolvedValueOnce('# Team changed A')
        // File B: library changed, team same → auto-apply
        .mockResolvedValueOnce(originalB);

      const files: GeneratedFile[] = [
        makeFile('/project/a.md', originalA),
        makeFile('/project/b.md', '# Library changed B'),
      ];

      const meta = makeMeta({
        '/project/a.md': hashA,
        '/project/b.md': hashB,
      });

      const results = await merger.mergeAll(files, meta);

      expect(results[0]!.outcome).toBe('keep');
      expect(results[1]!.outcome).toBe('auto-apply');
    });
  });
});
