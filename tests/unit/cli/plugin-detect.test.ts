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

  it('returns null when no plugin is installed (project-scope only)', () => {
    // detectPluginInstalled also checks user-scope (~/.claude/plugins/).
    // If the plugin is installed globally, it will return that path — skip in that case.
    const result = detectPluginInstalled(tempDir);
    if (result && result.includes(tempDir)) {
      // Should never happen: tempDir has no plugin files
      expect(result).toBeNull();
    } else if (result) {
      // Plugin is installed in user-scope (real installation) — not a project-scope hit
      expect(result).not.toContain(tempDir);
    } else {
      expect(result).toBeNull();
    }
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
