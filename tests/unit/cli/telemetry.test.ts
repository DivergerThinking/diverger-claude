import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const CLI_PATH = path.resolve(import.meta.dirname, '../../../dist/index.js');

describe('diverger telemetry CLI', () => {
  let tempHome: string;
  const originalHome = process.env.HOME ?? process.env.USERPROFILE ?? os.homedir();

  beforeEach(() => {
    tempHome = mkdtempSync(path.join(os.tmpdir(), 'diverger-telemetry-cli-'));
  });

  afterEach(() => {
    rmSync(tempHome, { recursive: true, force: true });
  });

  /** Run a CLI command with HOME overridden to tempHome */
  function run(args: string): string {
    try {
      return execSync(`node "${CLI_PATH}" ${args}`, {
        encoding: 'utf-8',
        timeout: 15000,
        env: {
          ...process.env,
          HOME: tempHome,
          USERPROFILE: tempHome,
          FORCE_COLOR: '0',
          DIVERGER_TELEMETRY: undefined,
        },
      });
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string };
      return (execErr.stdout ?? '') + (execErr.stderr ?? '');
    }
  }

  it('enable sets telemetry to active', () => {
    const output = run('telemetry enable');
    expect(output).toContain('Telemetría activada');
  });

  it('disable sets telemetry to inactive', () => {
    run('telemetry enable');
    const output = run('telemetry disable');
    expect(output).toContain('Telemetría desactivada');
  });

  it('show displays empty state', () => {
    const output = run('telemetry show');
    expect(output).toContain('desactivada');
    expect(output).toContain('0');
  });

  it('show --json outputs JSON format', () => {
    run('telemetry enable');
    const output = run('telemetry show --json');
    const parsed = JSON.parse(output.trim());
    expect(parsed.enabled).toBe(true);
    expect(Array.isArray(parsed.events)).toBe(true);
  });

  it('clear with --force empties events', () => {
    // Enable and create a telemetry store with an event
    run('telemetry enable');
    const storePath = path.join(tempHome, '.diverger', 'telemetry.json');
    const store = {
      enabled: true,
      events: [
        {
          ts: new Date().toISOString(),
          command: 'init',
          pluginMode: false,
          detectedStack: ['typescript'],
          profileCount: 3,
          durationMs: 500,
        },
      ],
    };
    writeFileSync(storePath, JSON.stringify(store));

    const output = run('telemetry clear --force');
    expect(output).toContain('borrados');
  });

  it('clear reports nothing when no events', () => {
    const output = run('telemetry clear --force');
    expect(output).toContain('No hay eventos');
  });
});
