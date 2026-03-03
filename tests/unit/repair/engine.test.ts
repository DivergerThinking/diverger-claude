import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { RepairEngine } from '../../../src/repair/engine.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import type { DivergentMeta } from '../../../src/core/types.js';

describe('RepairEngine', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-repair-engine-'));
    await fs.mkdir(path.join(tempDir, '.claude', 'rules'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  function writeMeta(meta: DivergentMeta): Promise<void> {
    return fs.writeFile(
      path.join(tempDir, '.diverger-meta.json'),
      JSON.stringify(meta),
      'utf-8',
    );
  }

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

  it('should return empty report when everything is healthy', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    await fs.writeFile(
      path.join(tempDir, '.claude', 'settings.json'),
      JSON.stringify({ permissions: {} }),
    );
    await fs.writeFile(path.join(tempDir, '.claude', 'rules', 'test.md'), '# Rule');
    await writeMeta(baseMeta());

    const engine = new RepairEngine(tempDir);
    const report = await engine.run('auto');
    expect(report.diagnoses).toHaveLength(0);
    expect(report.repairs).toHaveLength(0);
  });

  it('should auto-repair missing CLAUDE.md (D1) from meta', async () => {
    const claudeContent = '# Generated CLAUDE.md';
    const meta = baseMeta();
    meta.fileContents['CLAUDE.md'] = claudeContent;
    meta.fileHashes['CLAUDE.md'] = hashForMeta(claudeContent);
    await writeMeta(meta);

    // No CLAUDE.md on disk
    await fs.writeFile(path.join(tempDir, '.claude', 'rules', 'test.md'), '# Rule');

    const engine = new RepairEngine(tempDir);
    const report = await engine.run('auto');

    expect(report.repairs.length).toBeGreaterThan(0);
    const d1Repair = report.repairs.find((r) => r.diagnosisId === 'D1');
    expect(d1Repair?.success).toBe(true);

    // Verify file was restored
    const restored = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(restored).toBe(claudeContent);
  });

  it('should auto-repair deleted mandatory rule (D3)', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    const ruleContent = '# Mandatory security rule';
    const rulePath = path.join('.claude', 'rules', 'security.md');
    const meta = baseMeta();
    meta.ruleGovernance[rulePath] = 'mandatory';
    meta.fileHashes[rulePath] = hashForMeta(ruleContent);
    meta.fileContents[rulePath] = ruleContent;
    await writeMeta(meta);

    const engine = new RepairEngine(tempDir);
    const report = await engine.run('auto');

    const d3Repair = report.repairs.find((r) => r.diagnosisId === 'D3');
    expect(d3Repair?.success).toBe(true);

    // Verify rule was restored
    const restored = await fs.readFile(path.join(tempDir, rulePath), 'utf-8');
    expect(restored).toBe(ruleContent);
  });

  it('should only report in report-only mode', async () => {
    const meta = baseMeta();
    meta.fileContents['CLAUDE.md'] = '# Content';
    await writeMeta(meta);
    // No CLAUDE.md

    const engine = new RepairEngine(tempDir);
    const report = await engine.run('report-only');

    expect(report.diagnoses.length).toBeGreaterThan(0);
    expect(report.repairs).toHaveLength(0);
    expect(report.mode).toBe('report-only');
  });

  it('should only report in dryRun mode', async () => {
    const meta = baseMeta();
    meta.fileContents['CLAUDE.md'] = '# Content';
    await writeMeta(meta);

    const engine = new RepairEngine(tempDir);
    const report = await engine.run('auto', true);

    expect(report.diagnoses.length).toBeGreaterThan(0);
    expect(report.repairs).toHaveLength(0);
  });

  it('should not repair low-confidence diagnoses in auto mode', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Config');
    await fs.writeFile(path.join(tempDir, '.claude', 'rules', 'test.md'), '# Rule');

    const meta = baseMeta();
    const old = new Date();
    old.setDate(old.getDate() - 60);
    meta.generatedAt = old.toISOString();
    await writeMeta(meta);

    const engine = new RepairEngine(tempDir);
    const report = await engine.run('auto');

    // D5 (confidence 60) should be diagnosed but not repaired
    const d5 = report.diagnoses.find((d) => d.id === 'D5');
    expect(d5).toBeDefined();
    const d5Repair = report.repairs.find((r) => r.diagnosisId === 'D5');
    expect(d5Repair).toBeUndefined();
  });
});
