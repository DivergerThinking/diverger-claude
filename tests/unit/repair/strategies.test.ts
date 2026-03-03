import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createRepairAction } from '../../../src/repair/strategies.js';
import type { Diagnosis } from '../../../src/repair/types.js';
import type { DivergentMeta } from '../../../src/core/types.js';

describe('Repair Strategies', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-repair-strat-'));
    await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function baseMeta(): DivergentMeta {
    return {
      version: '1.6.0',
      generatedAt: new Date().toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: {},
      ruleGovernance: {},
      fileContents: {},
      trackedDependencies: [],
    };
  }

  it('should create action for D1 with meta content', () => {
    const diag: Diagnosis = { id: 'D1', description: 'CLAUDE.md missing', file: 'CLAUDE.md', confidence: 95, severity: 'critical', autoRepairable: true };
    const meta = baseMeta();
    meta.fileContents['CLAUDE.md'] = '# Content';

    const action = createRepairAction(diag, tempDir, meta);
    expect(action).not.toBeNull();
    expect(action!.diagnosisId).toBe('D1');
  });

  it('should return null for D1 without meta content', () => {
    const diag: Diagnosis = { id: 'D1', description: 'CLAUDE.md missing', file: 'CLAUDE.md', confidence: 95, severity: 'critical', autoRepairable: true };
    const action = createRepairAction(diag, tempDir, baseMeta());
    expect(action).toBeNull();
  });

  it('should execute D8 repair (remove obsolete keys)', async () => {
    await fs.writeFile(
      path.join(tempDir, '.claude', 'settings.json'),
      JSON.stringify({ permissions: { allow: [] }, model: 'gpt-4', env: { FOO: 'bar' } }),
    );

    const diag: Diagnosis = {
      id: 'D8',
      description: 'obsolete keys',
      file: '.claude/settings.json',
      confidence: 75,
      severity: 'warning',
      autoRepairable: true,
    };

    const action = createRepairAction(diag, tempDir, null);
    expect(action).not.toBeNull();

    const success = await action!.execute();
    expect(success).toBe(true);

    const content = JSON.parse(await fs.readFile(path.join(tempDir, '.claude', 'settings.json'), 'utf-8'));
    expect(content.permissions).toEqual({ allow: [] });
    expect(content.model).toBeUndefined();
    expect(content.env).toBeUndefined();
  });

  it('should return null for D5 (not auto-repairable)', () => {
    const diag: Diagnosis = { id: 'D5', description: 'Stack outdated', file: '.diverger-meta.json', confidence: 60, severity: 'info', autoRepairable: false };
    const action = createRepairAction(diag, tempDir, baseMeta());
    expect(action).toBeNull();
  });
});
