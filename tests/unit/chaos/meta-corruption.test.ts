import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadMeta, saveMeta, createMeta } from '../../../src/governance/history.js';
import { META_FILE } from '../../../src/core/constants.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Chaos: meta.json corruption and edge cases', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-chaos-meta-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should throw helpful error for truncated JSON', async () => {
    await fs.writeFile(
      path.join(tempDir, META_FILE),
      '{"version":"0.1.0","gen',
      'utf-8',
    );

    await expect(loadMeta(tempDir)).rejects.toThrow('corrupto');
  });

  it('should throw for empty file (empty string is not valid JSON)', async () => {
    await fs.writeFile(path.join(tempDir, META_FILE), '', 'utf-8');

    await expect(loadMeta(tempDir)).rejects.toThrow('corrupto');
  });

  it('should return null for non-existent meta file', async () => {
    const result = await loadMeta(tempDir);
    expect(result).toBeNull();
  });

  it('should backfill missing fileContents field', async () => {
    const metaWithoutFileContents = {
      version: '0.1.0',
      generatedAt: '2024-01-01T00:00:00.000Z',
      detectedStack: ['nodejs'],
      appliedProfiles: ['languages/typescript'],
      fileHashes: {},
      ruleGovernance: {},
      // fileContents intentionally missing
      trackedDependencies: [],
    };

    await fs.writeFile(
      path.join(tempDir, META_FILE),
      JSON.stringify(metaWithoutFileContents),
      'utf-8',
    );

    const result = await loadMeta(tempDir);
    expect(result).not.toBeNull();
    expect(result!.fileContents).toEqual({});
  });

  it('should backfill missing trackedDependencies field', async () => {
    const metaWithoutTracked = {
      version: '0.1.0',
      generatedAt: '2024-01-01T00:00:00.000Z',
      detectedStack: ['nodejs'],
      appliedProfiles: [],
      fileHashes: {},
      ruleGovernance: {},
      fileContents: {},
      // trackedDependencies intentionally missing
    };

    await fs.writeFile(
      path.join(tempDir, META_FILE),
      JSON.stringify(metaWithoutTracked),
      'utf-8',
    );

    const result = await loadMeta(tempDir);
    expect(result).not.toBeNull();
    expect(result!.trackedDependencies).toEqual([]);
  });

  it('should handle valid JSON with wrong shape (no runtime type check)', async () => {
    // Valid JSON but completely wrong shape
    await fs.writeFile(
      path.join(tempDir, META_FILE),
      JSON.stringify({ something: 'else', unrelated: true }),
      'utf-8',
    );

    // Should not crash — loadMeta does no runtime validation beyond JSON.parse
    const result = await loadMeta(tempDir);
    expect(result).not.toBeNull();
    // Backfill should set defaults
    expect(result!.fileContents).toEqual({});
    expect(result!.trackedDependencies).toEqual([]);
  });

  it('should handle BOM-prefixed meta.json', async () => {
    const meta = createMeta([], ['nodejs'], ['languages/typescript'], {});
    const jsonStr = JSON.stringify(meta, null, 2);
    // Write with BOM prefix
    await fs.writeFile(path.join(tempDir, META_FILE), '\uFEFF' + jsonStr, 'utf-8');

    const result = await loadMeta(tempDir);
    expect(result).not.toBeNull();
    expect(result!.detectedStack).toEqual(['nodejs']);
  });

  it('should round-trip save and load', async () => {
    const meta = createMeta(
      [{ path: '/project/.claude/CLAUDE.md', content: '# Test' }],
      ['nodejs', 'typescript'],
      ['base/universal', 'languages/typescript'],
      { '.claude/rules/ts.md': 'recommended' },
    );

    await saveMeta(tempDir, meta);
    const loaded = await loadMeta(tempDir);

    expect(loaded).not.toBeNull();
    expect(loaded!.detectedStack).toEqual(meta.detectedStack);
    expect(loaded!.appliedProfiles).toEqual(meta.appliedProfiles);
    expect(loaded!.version).toBe(meta.version);
  });
});
