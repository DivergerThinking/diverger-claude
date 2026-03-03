import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Tests for the pre-commit-validator.sh PreToolUse hook.
 * Validates that git commit commands are blocked when:
 * 1. Plugin version doesn't match package.json
 * 2. TypeScript has compilation errors
 */
describe('pre-commit-validator.sh', () => {
  const scriptPath = path.resolve('plugin/hooks/scripts/pre-commit-validator.sh');
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `pre-commit-test-${Date.now()}`);
    mkdirSync(path.join(tmpDir, 'plugin', '.claude-plugin'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function runHook(command: string, cwd: string): { stdout: string; exitCode: number } {
    const input = JSON.stringify({ tool_input: { command } });
    // Write input to a temp file to avoid shell escaping issues
    const inputFile = path.join(tmpDir, '.hook-input.json');
    writeFileSync(inputFile, input);
    try {
      const stdout = execSync(`bash "${scriptPath}" < "${inputFile}"`, {
        cwd,
        encoding: 'utf-8',
        timeout: 10000,
        env: { ...process.env, PATH: process.env.PATH },
      });
      return { stdout: stdout.trim(), exitCode: 0 };
    } catch (err) {
      const e = err as { stdout?: string; status?: number };
      return { stdout: (e.stdout ?? '').trim(), exitCode: e.status ?? 1 };
    }
  }

  it('should allow non-commit commands without output', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ version: '1.0.0' }));
    const result = runHook('git push origin main', tmpDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('should allow npm test commands without output', () => {
    const result = runHook('npm test', tmpDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('should deny commit when plugin version is stale', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ version: '2.4.0' }));
    writeFileSync(
      path.join(tmpDir, 'plugin', '.claude-plugin', 'plugin.json'),
      JSON.stringify({ version: '2.3.0' }),
    );

    const result = runHook('git commit -m "test"', tmpDir);
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(output.hookSpecificOutput.permissionDecisionReason).toContain('Plugin build stale');
    expect(output.hookSpecificOutput.permissionDecisionReason).toContain('2.4.0');
    expect(output.hookSpecificOutput.permissionDecisionReason).toContain('2.3.0');
  });

  it('should allow commit when versions match', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ version: '2.4.0' }));
    writeFileSync(
      path.join(tmpDir, 'plugin', '.claude-plugin', 'plugin.json'),
      JSON.stringify({ version: '2.4.0' }),
    );

    const result = runHook('git commit -m "test"', tmpDir);
    // Should either have no output (allow) or not deny
    if (result.stdout) {
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput?.permissionDecision).not.toBe('deny');
    }
    expect(result.exitCode).toBe(0);
  });

  it('should handle missing package.json gracefully (allow)', () => {
    const result = runHook('git commit -m "test"', tmpDir);
    expect(result.exitCode).toBe(0);
    // No output = allow
    if (result.stdout) {
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput?.permissionDecision).not.toBe('deny');
    }
  });

  it('should handle missing plugin.json gracefully (allow)', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ version: '2.4.0' }));
    rmSync(path.join(tmpDir, 'plugin'), { recursive: true, force: true });

    const result = runHook('git commit -m "test"', tmpDir);
    expect(result.exitCode).toBe(0);
  });

  it('should intercept git commit with various formats', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ version: '2.4.0' }));
    writeFileSync(
      path.join(tmpDir, 'plugin', '.claude-plugin', 'plugin.json'),
      JSON.stringify({ version: '1.0.0' }),
    );

    // Standard commit
    const r1 = runHook('git commit -m "test"', tmpDir);
    expect(r1.stdout).toContain('deny');

    // Commit with --amend
    const r2 = runHook('git commit --amend', tmpDir);
    expect(r2.stdout).toContain('deny');

    // Commit with -a flag
    const r3 = runHook('git commit -am "test"', tmpDir);
    expect(r3.stdout).toContain('deny');
  });
});
