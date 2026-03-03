import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import path from 'path';
import os from 'os';
import { checkConstantsConsistency } from '../../../src/plugin-health/constants-checker.js';
import { UNIVERSAL_AGENT_NAMES, UNIVERSAL_HOOK_SCRIPT_FILENAMES } from '../../../src/core/constants.js';

describe('checkConstantsConsistency', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `constants-check-${Date.now()}`);
    mkdirSync(path.join(tmpDir, 'agents'), { recursive: true });
    mkdirSync(path.join(tmpDir, 'hooks', 'scripts'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeAgents(names: string[]): void {
    for (const name of names) {
      writeFileSync(path.join(tmpDir, 'agents', `${name}.md`), `# ${name}\n`);
    }
  }

  function writeHookScripts(names: string[]): void {
    for (const name of names) {
      writeFileSync(path.join(tmpDir, 'hooks', 'scripts', name), '#!/bin/bash\nexit 0\n');
    }
  }

  it('should report healthy when all constants match plugin contents', async () => {
    writeAgents([...UNIVERSAL_AGENT_NAMES]);
    writeHookScripts([...UNIVERSAL_HOOK_SCRIPT_FILENAMES]);

    const result = await checkConstantsConsistency(tmpDir);
    expect(result.check).toBe('constants-consistency');
    expect(result.status).toBe('healthy');
  });

  it('should report unhealthy when agent in constants is missing from plugin', async () => {
    // Write all agents except one
    const agents = [...UNIVERSAL_AGENT_NAMES];
    writeAgents(agents.slice(1));
    writeHookScripts([...UNIVERSAL_HOOK_SCRIPT_FILENAMES]);

    const result = await checkConstantsConsistency(tmpDir);
    expect(result.status).toBe('unhealthy');
    expect(result.data?.extraInConstants).toContain(`agent:${agents[0]}`);
  });

  it('should report degraded when plugin has agent not in constants', async () => {
    writeAgents([...UNIVERSAL_AGENT_NAMES, 'extra-agent']);
    writeHookScripts([...UNIVERSAL_HOOK_SCRIPT_FILENAMES]);

    const result = await checkConstantsConsistency(tmpDir);
    expect(result.status).toBe('degraded');
    expect(result.data?.missingInConstants).toContain('agent:extra-agent');
  });

  it('should report unhealthy when hook script in constants is missing', async () => {
    writeAgents([...UNIVERSAL_AGENT_NAMES]);
    // Write all hooks except one
    const hooks = [...UNIVERSAL_HOOK_SCRIPT_FILENAMES];
    writeHookScripts(hooks.slice(1));

    const result = await checkConstantsConsistency(tmpDir);
    expect(result.status).toBe('unhealthy');
    expect(result.data?.extraInConstants).toContain(`hook:${hooks[0]}`);
  });

  it('should handle empty plugin directory gracefully', async () => {
    // No agents or hooks written
    const result = await checkConstantsConsistency(tmpDir);
    // Constants declare agents/hooks that don't exist → unhealthy
    expect(result.status).toBe('unhealthy');
    expect(result.data?.extraInConstants).toBeDefined();
    expect(result.data!.extraInConstants!.length).toBeGreaterThan(0);
  });

  it('should not flag additional hook scripts as missing from constants', async () => {
    // Intelligence hooks (error-tracker.sh, session-learner.sh) are added by
    // build-plugin.ts, not in UNIVERSAL_* constants. They should not be flagged.
    writeAgents([...UNIVERSAL_AGENT_NAMES]);
    writeHookScripts([
      ...UNIVERSAL_HOOK_SCRIPT_FILENAMES,
      'error-tracker.sh',
      'session-learner.sh',
    ]);

    const result = await checkConstantsConsistency(tmpDir);
    expect(result.status).toBe('healthy');
  });
});
