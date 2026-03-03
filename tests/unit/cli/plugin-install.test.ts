import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {
  getLatestReleaseTag,
  buildTarballUrl,
  extractPlugin,
  readPluginVersion,
} from '../../../src/cli/commands/plugin.js';

const CLI_PATH = path.resolve(import.meta.dirname, '../../../dist/index.js');

describe('plugin command helpers', () => {
  describe('buildTarballUrl', () => {
    it('builds correct URL for a given tag', () => {
      const url = buildTarballUrl('v1.0.0');
      expect(url).toBe(
        'https://github.com/DivergerThinking/diverger-claude/releases/download/v1.0.0/diverger-claude-plugin-v1.0.0.tar.gz',
      );
    });

    it('handles tags without v prefix', () => {
      const url = buildTarballUrl('2.0.0');
      expect(url).toContain('/2.0.0/');
      expect(url).toContain('diverger-claude-plugin-2.0.0.tar.gz');
    });
  });

  describe('readPluginVersion', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(path.join(os.tmpdir(), 'diverger-plugin-version-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('reads version from plugin.json', () => {
      const manifestDir = path.join(tempDir, '.claude-plugin');
      mkdirSync(manifestDir, { recursive: true });
      writeFileSync(
        path.join(manifestDir, 'plugin.json'),
        JSON.stringify({ name: 'diverger-claude', version: '1.0.0' }),
      );

      expect(readPluginVersion(tempDir)).toBe('1.0.0');
    });

    it('returns null when plugin.json does not exist', () => {
      expect(readPluginVersion(tempDir)).toBeNull();
    });

    it('returns null when plugin.json is invalid JSON', () => {
      const manifestDir = path.join(tempDir, '.claude-plugin');
      mkdirSync(manifestDir, { recursive: true });
      writeFileSync(path.join(manifestDir, 'plugin.json'), 'not json');

      expect(readPluginVersion(tempDir)).toBeNull();
    });

    it('returns null when version field is missing', () => {
      const manifestDir = path.join(tempDir, '.claude-plugin');
      mkdirSync(manifestDir, { recursive: true });
      writeFileSync(path.join(manifestDir, 'plugin.json'), JSON.stringify({ name: 'test' }));

      expect(readPluginVersion(tempDir)).toBeNull();
    });
  });

  describe('extractPlugin', () => {
    let tempDir: string;
    let tarball: string;
    let targetDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(path.join(os.tmpdir(), 'diverger-extract-'));
      targetDir = path.join(tempDir, 'target');

      // Create a mock plugin directory and tarball
      const pluginDir = path.join(tempDir, 'plugin');
      const manifestDir = path.join(pluginDir, '.claude-plugin');
      mkdirSync(manifestDir, { recursive: true });
      writeFileSync(
        path.join(manifestDir, 'plugin.json'),
        JSON.stringify({ name: 'diverger-claude', version: '1.0.0' }),
      );
      mkdirSync(path.join(pluginDir, 'agents'), { recursive: true });
      writeFileSync(path.join(pluginDir, 'agents', 'test.md'), '# Test agent');

      // Create tarball using cwd to avoid absolute path issues on Windows
      tarball = path.join(tempDir, 'test-plugin.tar.gz');
      execSync(`tar -czf test-plugin.tar.gz plugin/`, {
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('extracts tarball with strip-components=1', async () => {
      await extractPlugin(tarball, targetDir);

      expect(existsSync(path.join(targetDir, '.claude-plugin', 'plugin.json'))).toBe(true);
      expect(existsSync(path.join(targetDir, 'agents', 'test.md'))).toBe(true);
    });

    it('creates target directory if it does not exist', async () => {
      const nested = path.join(tempDir, 'deep', 'nested', 'target');
      await extractPlugin(tarball, nested);

      expect(existsSync(path.join(nested, '.claude-plugin', 'plugin.json'))).toBe(true);
    });
  });

  describe('getLatestReleaseTag', () => {
    it('returns a tag string or a meaningful error', async () => {
      // This test makes a real network call — it should work in CI with internet
      // but we accept either success or a network error
      const result = await getLatestReleaseTag();
      if (result.tag) {
        expect(result.tag).toMatch(/^v\d+\.\d+\.\d+/);
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });
});

describe('diverger plugin status (CLI)', () => {
  it('shows install suggestion when plugin is not installed', () => {
    // This test runs against the built CLI — plugin unlikely to be installed in CI
    try {
      // Use temp HOME so plugin detection always fails
      const output = execSync(`node "${CLI_PATH}" plugin status`, {
        encoding: 'utf-8',
        timeout: 10000,
        env: { ...process.env, FORCE_COLOR: '0', HOME: os.tmpdir(), USERPROFILE: os.tmpdir() },
      });
      // The info line "Instala con: diverger plugin install" goes to stdout
      expect(output).toContain('diverger plugin install');
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string };
      // warn goes to stderr, info goes to stdout — check both
      const combined = (execErr.stdout ?? '') + (execErr.stderr ?? '');
      expect(combined).toContain('no instalado');
    }
  });
});
