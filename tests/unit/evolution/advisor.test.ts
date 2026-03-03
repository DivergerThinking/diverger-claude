import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { analyzeEvolution } from '../../../src/evolution/advisor.js';
import type { DivergentMeta } from '../../../src/core/types.js';

describe('Evolution Advisor', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-evolution-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function baseMeta(): DivergentMeta {
    return {
      version: '1.6.0',
      generatedAt: new Date().toISOString(),
      detectedStack: ['typescript', 'node'],
      appliedProfiles: ['base/universal', 'languages/typescript'],
      fileHashes: {},
      ruleGovernance: {},
      fileContents: {},
      trackedDependencies: ['typescript'],
    };
  }

  it('should suggest profiles for new known dependencies', async () => {
    const advice = await analyzeEvolution(tempDir, baseMeta(), ['vitest', 'next'], []);
    const newProfiles = advice.filter((a) => a.type === 'new-profile');
    expect(newProfiles.length).toBe(2);
    expect(newProfiles.some((a) => a.description.includes('vitest'))).toBe(true);
    expect(newProfiles.some((a) => a.description.includes('next'))).toBe(true);
  });

  it('should not suggest already-tracked technologies', async () => {
    const meta = baseMeta();
    meta.detectedStack.push('vitest');
    const advice = await analyzeEvolution(tempDir, meta, ['vitest'], []);
    expect(advice.filter((a) => a.type === 'new-profile')).toHaveLength(0);
  });

  it('should flag removed known dependencies', async () => {
    const meta = baseMeta();
    meta.detectedStack.push('vitest');
    const advice = await analyzeEvolution(tempDir, meta, [], ['vitest']);
    const updates = advice.filter((a) => a.type === 'dependency-update');
    expect(updates.length).toBe(1);
    expect(updates[0].description).toContain('vitest');
  });

  it('should ignore unknown dependencies', async () => {
    const advice = await analyzeEvolution(tempDir, baseMeta(), ['lodash', 'chalk'], []);
    expect(advice).toHaveLength(0);
  });

  it('should detect Docker architecture change', async () => {
    await fs.writeFile(path.join(tempDir, 'Dockerfile'), 'FROM node:20');
    const advice = await analyzeEvolution(tempDir, baseMeta(), [], []);
    const archChanges = advice.filter((a) => a.type === 'architecture-change');
    expect(archChanges.length).toBe(1);
    expect(archChanges[0].description).toContain('Docker');
  });

  it('should detect CI pipeline addition', async () => {
    await fs.mkdir(path.join(tempDir, '.github', 'workflows'), { recursive: true });
    const advice = await analyzeEvolution(tempDir, baseMeta(), [], []);
    const archChanges = advice.filter((a) => a.type === 'architecture-change');
    expect(archChanges.some((a) => a.description.includes('CI'))).toBe(true);
  });

  it('should sort advice by priority (high first)', async () => {
    await fs.writeFile(path.join(tempDir, 'Dockerfile'), 'FROM node:20');
    const meta = baseMeta();
    meta.detectedStack.push('vitest');
    const advice = await analyzeEvolution(tempDir, meta, ['next'], ['vitest']);
    expect(advice.length).toBeGreaterThan(0);

    // High priority should come first
    const priorities = advice.map((a) => a.priority);
    const firstMedium = priorities.indexOf('medium');
    const lastHigh = priorities.lastIndexOf('high');
    if (firstMedium !== -1 && lastHigh !== -1) {
      expect(lastHigh).toBeLessThan(firstMedium);
    }
  });
});
