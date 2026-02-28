import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectChanges } from '../../../src/adaptation/change-detector.js';
import type { DivergentMeta } from '../../../src/core/types.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('detectChanges', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-change-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

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

  it('should detect no changes when files match hashes', async () => {
    const content = '# Test\nContent here';
    const filePath = 'CLAUDE.md';
    const absolutePath = path.join(tempDir, filePath);
    await fs.writeFile(absolutePath, content, 'utf-8');

    const meta = makeMeta({
      fileHashes: { [filePath]: hashForMeta(content) },
    });

    const result = await detectChanges(tempDir, meta);
    expect(result.hasChanges).toBe(false);
    expect(result.changedFiles).toHaveLength(0);
  });

  it('should detect changed files', async () => {
    const filePath = 'CLAUDE.md';
    const absolutePath = path.join(tempDir, filePath);
    await fs.writeFile(absolutePath, 'modified content', 'utf-8');

    const meta = makeMeta({
      fileHashes: { [filePath]: hashForMeta('original content') },
    });

    const result = await detectChanges(tempDir, meta);
    expect(result.hasChanges).toBe(true);
    expect(result.changedFiles).toContain(filePath);
  });

  it('should detect deleted files', async () => {
    const meta = makeMeta({
      fileHashes: { 'nonexistent.md': 'some-hash' },
    });

    const result = await detectChanges(tempDir, meta);
    expect(result.hasChanges).toBe(true);
    expect(result.changedFiles).toContain('nonexistent.md');
  });

  it('should detect new dependencies', async () => {
    const pkgPath = path.join(tempDir, 'package.json');
    await fs.writeFile(pkgPath, JSON.stringify({
      dependencies: { react: '^18.0.0', 'new-package': '^1.0.0' },
    }), 'utf-8');

    const meta = makeMeta({
      trackedDependencies: ['react'],
    });

    const result = await detectChanges(tempDir, meta);
    expect(result.hasChanges).toBe(true);
    expect(result.newDependencies).toContain('new-package');
  });

  it('should detect removed dependencies', async () => {
    const pkgPath = path.join(tempDir, 'package.json');
    await fs.writeFile(pkgPath, JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }), 'utf-8');

    const meta = makeMeta({
      trackedDependencies: ['react', 'removed-pkg'],
    });

    const result = await detectChanges(tempDir, meta);
    expect(result.hasChanges).toBe(true);
    expect(result.removedDependencies).toContain('removed-pkg');
  });

  it('should handle missing package.json gracefully', async () => {
    const meta = makeMeta({
      trackedDependencies: ['some-dep'],
    });

    const result = await detectChanges(tempDir, meta);
    // No crash, just no dependency changes detected
    expect(result.newDependencies).toHaveLength(0);
    expect(result.removedDependencies).toHaveLength(0);
  });

  it('should skip dependency comparison when trackedDependencies is empty', async () => {
    const pkgPath = path.join(tempDir, 'package.json');
    await fs.writeFile(pkgPath, JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }), 'utf-8');

    const meta = makeMeta({
      trackedDependencies: [],
    });

    const result = await detectChanges(tempDir, meta);
    expect(result.newDependencies).toHaveLength(0);
  });
});
