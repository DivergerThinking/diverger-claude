import { describe, it, expect } from 'vitest';
import { createMeta, finalizeMetaAfterWrite } from '../../../src/governance/history.js';
import type { DivergentMeta, GeneratedFile } from '../../../src/core/types.js';

describe('createMeta', () => {
  const files: GeneratedFile[] = [
    { path: 'CLAUDE.md', content: '# Config\nTest content' },
    { path: '.claude/settings.json', content: '{"permissions":{}}' },
  ];

  it('should create meta with file hashes', () => {
    const meta = createMeta(files, ['nodejs'], ['languages/typescript'], {});
    expect(meta.fileHashes).toBeDefined();
    expect(meta.fileHashes['CLAUDE.md']).toBeDefined();
    expect(meta.fileHashes['.claude/settings.json']).toBeDefined();
  });

  it('should store file contents for three-way merge', () => {
    const meta = createMeta(files, ['nodejs'], ['languages/typescript'], {});
    expect(meta.fileContents).toBeDefined();
    expect(meta.fileContents!['CLAUDE.md']).toBe('# Config\nTest content');
    expect(meta.fileContents!['.claude/settings.json']).toBe('{"permissions":{}}');
  });

  it('should store detectedStack and appliedProfiles', () => {
    const meta = createMeta(files, ['nodejs', 'react'], ['languages/typescript', 'frameworks/react'], {});
    expect(meta.detectedStack).toEqual(['nodejs', 'react']);
    expect(meta.appliedProfiles).toEqual(['languages/typescript', 'frameworks/react']);
  });

  it('should store ruleGovernance', () => {
    const governance = { '.claude/rules/test.md': 'mandatory' as const };
    const meta = createMeta(files, [], [], governance);
    expect(meta.ruleGovernance).toEqual(governance);
  });

  it('should store trackedDependencies when provided', () => {
    const meta = createMeta(files, [], [], {}, ['react', 'typescript']);
    expect(meta.trackedDependencies).toEqual(['react', 'typescript']);
  });

  it('should include version and generatedAt', () => {
    const meta = createMeta(files, [], [], {});
    expect(meta.version).toBeDefined();
    expect(meta.generatedAt).toBeDefined();
    expect(new Date(meta.generatedAt).getTime()).not.toBeNaN();
  });
});

describe('finalizeMetaAfterWrite', () => {
  function makeMeta(overrides: Partial<DivergentMeta> = {}): DivergentMeta {
    return {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: {},
      ruleGovernance: {},
      ...overrides,
    };
  }

  it('should update hashes for written files', () => {
    const pendingMeta = makeMeta({
      fileHashes: { 'a.md': 'old-hash', 'b.md': 'old-hash' },
      fileContents: { 'a.md': 'old-a', 'b.md': 'old-b' },
    });
    const writtenFiles = [{ path: 'a.md', content: 'new-a' }];

    const result = finalizeMetaAfterWrite(pendingMeta, writtenFiles);

    // a.md should have new hash
    expect(result.fileHashes['a.md']).not.toBe('old-hash');
    // b.md should keep old hash (not written)
    expect(result.fileContents!['b.md']).toBe('old-b');
  });

  it('should preserve old meta hashes for unwritten files', () => {
    const oldMeta = makeMeta({
      fileHashes: { 'existing.md': 'old-existing-hash' },
      fileContents: { 'existing.md': 'old content' },
    });
    const pendingMeta = makeMeta({
      fileHashes: { 'existing.md': 'new-hash', 'new.md': 'new-file-hash' },
      fileContents: { 'existing.md': 'new content', 'new.md': 'new content' },
    });
    const writtenFiles = [{ path: 'new.md', content: 'new content' }];

    const result = finalizeMetaAfterWrite(pendingMeta, writtenFiles, oldMeta);

    // existing.md was NOT written, so should keep old meta's hash
    expect(result.fileHashes['existing.md']).toBe('old-existing-hash');
    expect(result.fileContents!['existing.md']).toBe('old content');
  });

  it('should include new files from pending meta not in old meta', () => {
    const oldMeta = makeMeta({ fileHashes: {} });
    const pendingMeta = makeMeta({
      fileHashes: { 'brand-new.md': 'pending-hash' },
      fileContents: { 'brand-new.md': 'pending content' },
    });

    const result = finalizeMetaAfterWrite(pendingMeta, [], oldMeta);

    expect(result.fileHashes['brand-new.md']).toBe('pending-hash');
    expect(result.fileContents!['brand-new.md']).toBe('pending content');
  });

  it('should handle null oldMeta', () => {
    const pendingMeta = makeMeta({
      fileHashes: { 'file.md': 'hash' },
      fileContents: { 'file.md': 'content' },
    });
    const writtenFiles = [{ path: 'file.md', content: 'content' }];

    const result = finalizeMetaAfterWrite(pendingMeta, writtenFiles, null);

    expect(result.fileHashes['file.md']).toBeDefined();
    expect(result.fileContents!['file.md']).toBe('content');
  });
});
