import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { diagnose } from '../../../src/repair/diagnostics.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import type { DivergentMeta } from '../../../src/core/types.js';

describe('Repair Diagnostics', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-repair-diag-'));
    // Create minimal .claude/ structure
    await fs.mkdir(path.join(tempDir, '.claude', 'rules'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function baseMeta(): DivergentMeta {
    return {
      version: '1.6.0',
      generatedAt: new Date().toISOString(),
      detectedStack: ['typescript'],
      appliedProfiles: ['base/universal'],
      fileHashes: {},
      ruleGovernance: {},
      fileContents: {},
      trackedDependencies: [],
    };
  }

  it('should detect D1: missing CLAUDE.md', async () => {
    const diags = await diagnose(tempDir, baseMeta());
    const d1 = diags.find((d) => d.id === 'D1');
    expect(d1).toBeDefined();
    expect(d1!.confidence).toBe(95);
    expect(d1!.severity).toBe('critical');
  });

  it('should not report D1 when CLAUDE.md exists', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    const diags = await diagnose(tempDir, baseMeta());
    expect(diags.find((d) => d.id === 'D1')).toBeUndefined();
  });

  it('should detect D2: invalid settings.json', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    await fs.writeFile(path.join(tempDir, '.claude', 'settings.json'), 'not json {{{');
    const diags = await diagnose(tempDir, baseMeta());
    const d2 = diags.find((d) => d.id === 'D2');
    expect(d2).toBeDefined();
    expect(d2!.confidence).toBe(90);
  });

  it('should detect D3: deleted mandatory rule', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    const rulePath = '.claude/rules/security/no-secrets.md';
    const ruleContent = '# No secrets rule';
    const meta = baseMeta();
    meta.ruleGovernance[rulePath] = 'mandatory';
    meta.fileHashes[rulePath] = hashForMeta(ruleContent);
    meta.fileContents[rulePath] = ruleContent;

    const diags = await diagnose(tempDir, meta);
    const d3 = diags.find((d) => d.id === 'D3');
    expect(d3).toBeDefined();
    expect(d3!.file).toBe(rulePath);
  });

  it('should detect D4: modified mandatory rule', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    const rulePath = path.join('.claude', 'rules', 'security.md');
    const originalContent = '# Original';
    const meta = baseMeta();
    meta.ruleGovernance[rulePath] = 'mandatory';
    meta.fileHashes[rulePath] = hashForMeta(originalContent);

    // Write modified content
    const absPath = path.join(tempDir, rulePath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, '# Modified by user');

    const diags = await diagnose(tempDir, meta);
    const d4 = diags.find((d) => d.id === 'D4');
    expect(d4).toBeDefined();
    expect(d4!.confidence).toBe(80);
  });

  it('should detect D5: old configuration', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    const meta = baseMeta();
    const old = new Date();
    old.setDate(old.getDate() - 60);
    meta.generatedAt = old.toISOString();

    const diags = await diagnose(tempDir, meta);
    const d5 = diags.find((d) => d.id === 'D5');
    expect(d5).toBeDefined();
    expect(d5!.severity).toBe('info');
    expect(d5!.autoRepairable).toBe(false);
  });

  it('should detect D8: obsolete settings keys', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    await fs.writeFile(
      path.join(tempDir, '.claude', 'settings.json'),
      JSON.stringify({ permissions: {}, model: 'gpt-4', env: { FOO: 'bar' } }),
    );

    const diags = await diagnose(tempDir, baseMeta());
    const d8 = diags.find((d) => d.id === 'D8');
    expect(d8).toBeDefined();
    expect(d8!.description).toContain('model');
    expect(d8!.description).toContain('env');
  });

  it('should return diagnoses sorted by confidence descending', async () => {
    // Create a scenario with multiple diagnoses
    const meta = baseMeta();
    const old = new Date();
    old.setDate(old.getDate() - 60);
    meta.generatedAt = old.toISOString();

    const diags = await diagnose(tempDir, meta);
    for (let i = 1; i < diags.length; i++) {
      expect(diags[i - 1].confidence).toBeGreaterThanOrEqual(diags[i].confidence);
    }
  });

  it('should return empty array when everything is healthy', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    await fs.writeFile(
      path.join(tempDir, '.claude', 'settings.json'),
      JSON.stringify({ permissions: {} }),
    );
    await fs.writeFile(
      path.join(tempDir, '.claude', 'rules', 'test.md'),
      '# Test rule',
    );

    const diags = await diagnose(tempDir, baseMeta());
    expect(diags).toHaveLength(0);
  });
});
