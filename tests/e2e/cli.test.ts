import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');

// E2E tests require a built CLI
// Run `npm run build` before running these tests
describe('CLI E2E', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-e2e-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('diverger --help', () => {
    it('should show help text', () => {
      const output = runCli('--help');
      expect(output).toContain('diverger');
      expect(output).toContain('init');
      expect(output).toContain('diff');
      expect(output).toContain('status');
      expect(output).toContain('sync');
      expect(output).toContain('check');
      expect(output).toContain('eject');
    });
  });

  describe('diverger --version', () => {
    it('should show version', () => {
      const output = runCli('--version');
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('diverger diff', () => {
    it('should show diff for a Next.js project', async () => {
      // Create a mock Next.js project
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          dependencies: {
            next: '^15.0.0',
            react: '^19.0.0',
          },
          devDependencies: {
            typescript: '^5.7.0',
          },
        }),
      );
      await fs.writeFile(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: { strict: true } }),
      );

      const output = runCli(`diff --dir "${tempDir}" --json`);
      const result = JSON.parse(output);
      expect(result.diffs).toBeDefined();
      expect(result.diffs.length).toBeGreaterThan(0);
    });
  });

  describe('diverger init', () => {
    it('should generate .claude/ for a Next.js project', { timeout: 30_000 }, async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          dependencies: { next: '^15.0.0', react: '^19.0.0' },
          devDependencies: { typescript: '^5.7.0' },
        }),
      );

      runCli(`init --dir "${tempDir}" --force`);

      // Verify files were created
      const claudeDir = path.join(tempDir, '.claude');
      // CLAUDE.md is generated at the project root, not inside .claude/
      const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
      expect(claudeMd).toContain('TypeScript');

      const settings = JSON.parse(
        await fs.readFile(path.join(claudeDir, 'settings.json'), 'utf-8'),
      );
      expect(settings.permissions).toBeDefined();
      expect(settings.permissions.deny).toBeDefined();
      expect(settings.permissions.deny.length).toBeGreaterThan(0);
    });
  });

  function runCli(args: string): string {
    try {
      return execSync(`node "${CLI_PATH}" ${args}`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: { ...process.env, FORCE_COLOR: '0' },
      });
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string };
      // Some commands exit with non-zero but still produce valid output
      if (execErr.stdout) return execErr.stdout;
      throw err;
    }
  }
});
