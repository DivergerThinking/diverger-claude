import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThreeWayMerge } from '../../../src/governance/merge.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import type { DivergentMeta, GeneratedFile } from '../../../src/core/types.js';

// Mock the fs utility to control what "exists on disk"
vi.mock('../../../src/utils/fs.js', () => ({
  readFileOrNull: vi.fn(),
}));

import { readFileOrNull } from '../../../src/utils/fs.js';
const mockReadFileOrNull = vi.mocked(readFileOrNull);

function makeFile(filePath: string, content: string): GeneratedFile {
  return { path: filePath, content };
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

describe('Three-way Merge E2E', () => {
  const merger = new ThreeWayMerge();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Markdown: user modifies CLAUDE.md, re-sync preserves their changes and adds new sections', () => {
    it('should preserve user edits and add library new sections', async () => {
      const base = [
        '# Project',
        '',
        '## Conventions',
        'Use TypeScript strict mode.',
        '',
        '## Testing',
        'Use vitest for all tests.',
      ].join('\n');

      // Team changed the Conventions section
      const theirs = [
        '# Project',
        '',
        '## Conventions',
        'Use TypeScript strict mode.',
        'Always use ESM imports.',
        '',
        '## Testing',
        'Use vitest for all tests.',
      ].join('\n');

      // Library added a new Security section
      const ours = [
        '# Project',
        '',
        '## Conventions',
        'Use TypeScript strict mode.',
        '',
        '## Testing',
        'Use vitest for all tests.',
        '',
        '## Security',
        'Never commit .env files.',
      ].join('\n');

      const filePath = '/project/.claude/CLAUDE.md';
      const hash = hashForMeta(base);
      const meta = makeMeta(
        { [filePath]: hash },
        { [filePath]: base },
      );

      mockReadFileOrNull.mockResolvedValue(theirs);

      const result = await merger.mergeFile(
        makeFile(filePath, ours),
        meta,
        base,
      );

      expect(result.outcome).toBe('merged');
      // User's edit to Conventions should be preserved
      expect(result.content).toContain('Always use ESM imports.');
      // Library's new Security section should be added
      expect(result.content).toContain('## Security');
      expect(result.content).toContain('Never commit .env files.');
      // Original sections should still be there
      expect(result.content).toContain('## Conventions');
      expect(result.content).toContain('## Testing');
    });

    it('should keep team-added sections that library does not have', async () => {
      const base = '## Section A\nOriginal content.';
      // Team added a new section but didn't change Section A
      const theirs = '## Section A\nOriginal content.\n\n## Custom Team Section\nTeam rules here.';
      // Library updated Section A content
      const ours = '## Section A\nUpdated content.';

      const filePath = '/project/.claude/CLAUDE.md';
      const hash = hashForMeta(base);
      const meta = makeMeta(
        { [filePath]: hash },
        { [filePath]: base },
      );

      mockReadFileOrNull.mockResolvedValue(theirs);

      const result = await merger.mergeFile(makeFile(filePath, ours), meta, base);

      expect(result.outcome).toBe('merged');
      // Team's custom section should be preserved (team added, not in base)
      expect(result.content).toContain('## Custom Team Section');
      expect(result.content).toContain('Team rules here.');
      // Section A: team didn't change, library changed → library's version applied
      expect(result.content).toContain('## Section A');
    });

    it('should respect library removal when team changed a different section', async () => {
      const base = '## Keep\nKeep this.\n\n## Deprecated\nOld content.';
      // Team edited the Keep section (forces both-changed path)
      const theirs = '## Keep\nKeep this with team edits.\n\n## Deprecated\nOld content.';
      // Library removed Deprecated section
      const ours = '## Keep\nKeep this.';

      const filePath = '/project/.claude/CLAUDE.md';
      const hash = hashForMeta(base);
      const meta = makeMeta(
        { [filePath]: hash },
        { [filePath]: base },
      );

      mockReadFileOrNull.mockResolvedValue(theirs);

      const result = await merger.mergeFile(makeFile(filePath, ours), meta, base);

      expect(result.outcome).toBe('merged');
      expect(result.content).toContain('## Keep');
      // Team's edit to Keep should be preserved
      expect(result.content).toContain('team edits');
      // Deprecated section: was in base, library removed it, team didn't change it → removed
      expect(result.content).not.toContain('## Deprecated');
    });
  });

  describe('JSON: settings merge with deep merge', () => {
    it('should merge nested settings correctly with three-way', async () => {
      const base = JSON.stringify({
        permissions: { allow: ['Read', 'Write'] },
        model: 'sonnet',
      }, null, 2) + '\n';

      // Team added Bash to allow
      const theirs = JSON.stringify({
        permissions: { allow: ['Read', 'Write', 'Bash'] },
        model: 'sonnet',
      }, null, 2) + '\n';

      // Library changed model
      const ours = JSON.stringify({
        permissions: { allow: ['Read', 'Write'] },
        model: 'opus',
      }, null, 2) + '\n';

      const filePath = '/project/.claude/settings.json';
      const hash = hashForMeta(base);
      const meta = makeMeta(
        { [filePath]: hash },
        { [filePath]: base },
      );

      mockReadFileOrNull.mockResolvedValue(theirs);

      const result = await merger.mergeFile(makeFile(filePath, ours), meta, base);

      expect(result.outcome).toBe('merged');
      const merged = JSON.parse(result.content!);
      // Team's addition: Bash in allow
      expect(merged.permissions.allow).toContain('Bash');
      // Library's change: model = opus
      expect(merged.model).toBe('opus');
      // Original values preserved
      expect(merged.permissions.allow).toContain('Read');
      expect(merged.permissions.allow).toContain('Write');
    });

    it('should handle scalar conflict with team winning', async () => {
      const base = JSON.stringify({ version: '1.0', name: 'test' }, null, 2) + '\n';
      // Both changed version
      const theirs = JSON.stringify({ version: '1.1-team', name: 'test' }, null, 2) + '\n';
      const ours = JSON.stringify({ version: '1.1-lib', name: 'test' }, null, 2) + '\n';

      const filePath = '/project/.claude/settings.json';
      const hash = hashForMeta(base);
      const meta = makeMeta(
        { [filePath]: hash },
        { [filePath]: base },
      );

      mockReadFileOrNull.mockResolvedValue(theirs);

      const result = await merger.mergeFile(makeFile(filePath, ours), meta, base);

      expect(result.outcome).toBe('merged');
      const merged = JSON.parse(result.content!);
      // Team wins in scalar conflicts
      expect(merged.version).toBe('1.1-team');
    });
  });

  describe('Governance enforcement', () => {
    it('should force library version for mandatory rules even if team changed it', async () => {
      const base = 'Original mandatory content';
      const theirs = 'Team modified mandatory content';
      const ours = 'Updated mandatory content from library';

      const filePath = '/project/.claude/rules/security.md';
      const hash = hashForMeta(base);
      const meta = makeMeta({ [filePath]: hash });

      mockReadFileOrNull.mockResolvedValue(theirs);

      const result = await merger.mergeFile(
        makeFile(filePath, ours),
        meta,
        base,
        'mandatory',
      );

      expect(result.outcome).toBe('auto-apply');
      expect(result.content).toBe('Updated mandatory content from library');
      expect(result.conflictDetails).toContain('mandatory');
    });

    it('should keep team version for recommended rules when only team changed', async () => {
      const base = 'Original recommended content';
      const theirs = 'Team customized this rule';

      const filePath = '/project/.claude/rules/style.md';
      const hash = hashForMeta(base);
      const meta = makeMeta({ [filePath]: hash });

      mockReadFileOrNull.mockResolvedValue(theirs);

      // Library did NOT change (ours === base)
      const result = await merger.mergeFile(
        makeFile(filePath, base),
        meta,
        base,
        'recommended',
      );

      expect(result.outcome).toBe('keep');
    });
  });

  describe('mergeAll — multiple files in batch', () => {
    it('should handle mixed outcomes across files', async () => {
      const baseContent = 'Base content';
      const hash = hashForMeta(baseContent);

      const meta = makeMeta({
        '/project/a.md': hash,
        '/project/b.json': hash,
      });

      // File a.md: only library changed → auto-apply
      // File b.json: doesn't exist on disk → auto-apply
      mockReadFileOrNull
        .mockResolvedValueOnce(baseContent) // a.md exists unchanged
        .mockResolvedValueOnce(null); // b.json doesn't exist

      const results = await merger.mergeAll(
        [
          makeFile('/project/a.md', 'New content for a'),
          makeFile('/project/b.json', '{"key": "value"}'),
        ],
        meta,
      );

      expect(results).toHaveLength(2);
      expect(results[0]!.outcome).toBe('auto-apply'); // a.md: library changed, team didn't
      expect(results[1]!.outcome).toBe('auto-apply'); // b.json: new file
    });
  });
});
