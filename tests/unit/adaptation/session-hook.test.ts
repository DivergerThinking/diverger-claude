import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { onSessionStart } from '../../../src/adaptation/session-hook.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('onSessionStart', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-session-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return null when no meta file exists (not a diverger project)', async () => {
    const result = await onSessionStart(tempDir);
    expect(result).toBeNull();
  });

  it('should return null when no changes detected', async () => {
    const content = '# Test content';
    const filePath = 'CLAUDE.md';
    await fs.writeFile(path.join(tempDir, filePath), content, 'utf-8');

    const meta = {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: { [filePath]: hashForMeta(content) },
      ruleGovernance: {},
    };
    await fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      JSON.stringify(meta),
      'utf-8',
    );

    const result = await onSessionStart(tempDir);
    expect(result).toBeNull();
  });

  it('should return message when changes detected', async () => {
    // Write a file that differs from the hash in meta
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'modified', 'utf-8');

    const meta = {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: { 'CLAUDE.md': hashForMeta('original') },
      ruleGovernance: {},
    };
    await fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      JSON.stringify(meta),
      'utf-8',
    );

    const result = await onSessionStart(tempDir);
    expect(result).not.toBeNull();
    expect(result).toContain('diverger-claude');
  });

  it('should not crash on corrupt meta file (A5 fix)', async () => {
    await fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      'not valid json {{{',
      'utf-8',
    );

    // Should NOT throw - returns null gracefully
    const result = await onSessionStart(tempDir);
    expect(result).toBeNull();
  });

  it('should not crash on missing files referenced in meta', async () => {
    const meta = {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: { 'nonexistent.md': 'some-hash' },
      ruleGovernance: {},
    };
    await fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      JSON.stringify(meta),
      'utf-8',
    );

    const result = await onSessionStart(tempDir);
    // Should detect the missing file as a change
    expect(result).not.toBeNull();
    expect(result).toContain('diverger-claude');
  });
});
