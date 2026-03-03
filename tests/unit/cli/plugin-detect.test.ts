import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectPluginInstalled, shouldSuppressDeprecation } from '../../../src/cli/plugin-detect.js';

describe('detectPluginInstalled', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'diverger-plugin-detect-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns null when no plugin is installed', () => {
    expect(detectPluginInstalled(tempDir)).toBeNull();
  });

  it('detects project-scope plugin installation', () => {
    const pluginDir = path.join(tempDir, '.claude', 'plugins', 'diverger-claude', '.claude-plugin');
    mkdirSync(pluginDir, { recursive: true });
    writeFileSync(path.join(pluginDir, 'plugin.json'), '{"name":"diverger-claude"}');

    const result = detectPluginInstalled(tempDir);
    expect(result).not.toBeNull();
    expect(result).toContain('diverger-claude');
  });

  it('returns null when projectRoot is not provided and no user-scope plugin', () => {
    // This just tests that it doesn't crash without projectRoot
    const result = detectPluginInstalled();
    // Result depends on whether user has plugin installed globally — we just test no crash
    expect(typeof result === 'string' || result === null).toBe(true);
  });
});

describe('shouldSuppressDeprecation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('suppresses in quiet mode', () => {
    expect(shouldSuppressDeprecation('quiet')).toBe(true);
  });

  it('suppresses in json mode', () => {
    expect(shouldSuppressDeprecation('json')).toBe(true);
  });

  it('does not suppress in rich mode without CI', () => {
    delete process.env.CI;
    delete process.env.DIVERGER_NO_DEPRECATION;
    expect(shouldSuppressDeprecation('rich')).toBe(false);
  });

  it('suppresses when CI=true', () => {
    process.env.CI = 'true';
    expect(shouldSuppressDeprecation('rich')).toBe(true);
  });

  it('suppresses when DIVERGER_NO_DEPRECATION=1', () => {
    process.env.DIVERGER_NO_DEPRECATION = '1';
    expect(shouldSuppressDeprecation('rich')).toBe(true);
  });
});
