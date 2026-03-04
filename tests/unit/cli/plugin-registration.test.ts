import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  registerPluginInSettings,
  unregisterPluginFromSettings,
} from '../../../src/cli/commands/plugin.js';

describe('plugin registration in settings.json', () => {
  let tempDir: string;
  let settingsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'diverger-reg-test-'));
    settingsPath = path.join(tempDir, '.claude', 'settings.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function readSettings(): Record<string, unknown> {
    return JSON.parse(readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
  }

  it('register adds enabledPlugins entry', async () => {
    await registerPluginInSettings(settingsPath);

    const settings = readSettings();
    expect(settings.enabledPlugins).toBeDefined();
    expect((settings.enabledPlugins as Record<string, boolean>)['diverger-claude']).toBe(true);
  });

  it('register creates settings.json if missing', async () => {
    expect(existsSync(settingsPath)).toBe(false);

    await registerPluginInSettings(settingsPath);

    expect(existsSync(settingsPath)).toBe(true);
    const settings = readSettings();
    expect((settings.enabledPlugins as Record<string, boolean>)['diverger-claude']).toBe(true);
  });

  it('register preserves existing plugins', async () => {
    const claudeDir = path.join(tempDir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      settingsPath,
      JSON.stringify({
        enabledPlugins: { 'other-plugin': true },
        someOtherSetting: 42,
      }, null, 2),
    );

    await registerPluginInSettings(settingsPath);

    const settings = readSettings();
    const plugins = settings.enabledPlugins as Record<string, boolean>;
    expect(plugins['diverger-claude']).toBe(true);
    expect(plugins['other-plugin']).toBe(true);
    expect(settings.someOtherSetting).toBe(42);
  });

  it('unregister removes entry', async () => {
    const claudeDir = path.join(tempDir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      settingsPath,
      JSON.stringify({
        enabledPlugins: { 'diverger-claude': true, 'other-plugin': true },
      }, null, 2),
    );

    await unregisterPluginFromSettings(settingsPath);

    const settings = readSettings();
    const plugins = settings.enabledPlugins as Record<string, boolean>;
    expect(plugins['diverger-claude']).toBeUndefined();
    expect(plugins['other-plugin']).toBe(true);
  });

  it('unregister handles missing file gracefully', async () => {
    const missingPath = path.join(tempDir, 'nonexistent', 'settings.json');
    await expect(unregisterPluginFromSettings(missingPath)).resolves.toBeUndefined();
  });

  it('idempotent registration does not corrupt settings', async () => {
    await registerPluginInSettings(settingsPath);
    await registerPluginInSettings(settingsPath);

    const settings = readSettings();
    const plugins = settings.enabledPlugins as Record<string, boolean>;
    expect(plugins['diverger-claude']).toBe(true);
    // Verify no duplicate keys — JSON.stringify produces clean output
    const raw = readFileSync(settingsPath, 'utf-8');
    const occurrences = raw.split('diverger-claude').length - 1;
    expect(occurrences).toBe(1);
  });
});
