import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { runHealthCheck } from '../../../src/repair/health-check.js';
import { hashForMeta } from '../../../src/utils/hash.js';

describe('Health Check', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-health-check-'));
    await fs.mkdir(path.join(tempDir, '.claude', 'rules'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  it('should return null when no meta (not diverger project)', async () => {
    const result = await runHealthCheck(tempDir);
    // Without meta, diagnose returns empty and no repairs needed
    expect(result).toBeNull();
  });

  it('should return null when everything is healthy', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    await fs.writeFile(
      path.join(tempDir, '.claude', 'settings.json'),
      JSON.stringify({ permissions: {} }),
    );
    await fs.writeFile(path.join(tempDir, '.claude', 'rules', 'test.md'), '# Rule');
    await fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      JSON.stringify({
        version: '1.6.0',
        generatedAt: new Date().toISOString(),
        detectedStack: [],
        appliedProfiles: [],
        fileHashes: {},
        ruleGovernance: {},
        fileContents: {},
        trackedDependencies: [],
      }),
    );

    const result = await runHealthCheck(tempDir);
    expect(result).toBeNull();
  });

  it('should return message when auto-repair succeeds', async () => {
    const claudeContent = '# Generated';
    const meta = {
      version: '1.6.0',
      generatedAt: new Date().toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: { 'CLAUDE.md': hashForMeta(claudeContent) },
      ruleGovernance: {},
      fileContents: { 'CLAUDE.md': claudeContent },
      trackedDependencies: [],
    };
    await fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      JSON.stringify(meta),
    );
    await fs.writeFile(path.join(tempDir, '.claude', 'rules', 'test.md'), '# Rule');

    const result = await runHealthCheck(tempDir);
    expect(result).not.toBeNull();
    expect(result).toContain('Auto-reparado');
  });

  it('should report non-repairable suggestions', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    await fs.writeFile(path.join(tempDir, '.claude', 'rules', 'test.md'), '# Rule');
    const old = new Date();
    old.setDate(old.getDate() - 60);
    const meta = {
      version: '1.6.0',
      generatedAt: old.toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: {},
      ruleGovernance: {},
      fileContents: {},
      trackedDependencies: [],
    };
    await fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      JSON.stringify(meta),
    );

    const result = await runHealthCheck(tempDir);
    expect(result).not.toBeNull();
    expect(result).toContain('Sugerencias');
  });
});
