import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { checkPluginHealth } from '../../../src/plugin-health/monitor.js';

describe('Plugin Health Monitor', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-plugin-health-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should report unhealthy when plugin dir is empty', async () => {
    const report = await checkPluginHealth(tempDir, '1.6.0');
    expect(report.status).toBe('unhealthy');
    expect(report.checks.length).toBeGreaterThan(0);
    expect(report.autoFixableCount).toBeGreaterThan(0);
  });

  it('should report healthy for a valid plugin structure', async () => {
    // Create minimal valid plugin structure
    await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.claude-plugin', 'plugin.json'),
      JSON.stringify({ name: 'diverger-claude', version: '1.6.0' }),
    );

    await fs.mkdir(path.join(tempDir, 'hooks', 'scripts'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'hooks', 'hooks.json'),
      JSON.stringify({
        PreToolUse: {
          Write: [{ type: 'command', command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/test.sh' }],
        },
      }),
    );
    await fs.writeFile(path.join(tempDir, 'hooks', 'scripts', 'test.sh'), '#!/bin/bash\n');

    await fs.mkdir(path.join(tempDir, 'mcp'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'mcp', 'server.js'), 'console.log("ok")');
    await fs.writeFile(
      path.join(tempDir, '.mcp.json'),
      JSON.stringify({ mcpServers: { 'diverger-claude': { command: 'node', args: ['mcp/server.js'] } } }),
    );

    await fs.mkdir(path.join(tempDir, 'agents'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'agents', 'test-agent.md'), '---\nname: test\n---\n');

    await fs.mkdir(path.join(tempDir, 'skills', 'test-skill'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'skills', 'test-skill', 'SKILL.md'), '---\nname: test\n---\n');

    const report = await checkPluginHealth(tempDir, '1.6.0');
    expect(report.status).toBe('healthy');
    expect(report.checks.every((c) => c.status === 'healthy')).toBe(true);
  });

  it('should detect version mismatch as degraded', async () => {
    await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.claude-plugin', 'plugin.json'),
      JSON.stringify({ name: 'diverger-claude', version: '1.5.0' }),
    );

    // Create minimal valid rest
    await fs.mkdir(path.join(tempDir, 'hooks', 'scripts'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'hooks', 'hooks.json'), '{}');
    await fs.mkdir(path.join(tempDir, 'mcp'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'mcp', 'server.js'), '');
    await fs.writeFile(path.join(tempDir, '.mcp.json'), JSON.stringify({ mcpServers: { 'diverger-claude': { command: 'node' } } }));
    await fs.mkdir(path.join(tempDir, 'agents'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'agents', 'a.md'), '---\n---\n');
    await fs.mkdir(path.join(tempDir, 'skills', 's'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'skills', 's', 'SKILL.md'), '');

    const report = await checkPluginHealth(tempDir, '1.6.0');
    expect(report.status).toBe('degraded');
    const versionCheck = report.checks.find((c) => c.check === 'version-consistency');
    expect(versionCheck?.status).toBe('degraded');
  });

  it('should detect missing hook scripts', async () => {
    await fs.mkdir(path.join(tempDir, 'hooks', 'scripts'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'hooks', 'hooks.json'),
      JSON.stringify({
        PreToolUse: {
          Write: [{ type: 'command', command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/missing.sh' }],
        },
      }),
    );

    const report = await checkPluginHealth(tempDir, '1.0.0');
    const hookScriptsCheck = report.checks.find((c) => c.check === 'hook-scripts');
    expect(hookScriptsCheck?.status).toBe('unhealthy');
    expect(hookScriptsCheck?.message).toContain('missing.sh');
  });

  it('should detect missing MCP server', async () => {
    await fs.mkdir(path.join(tempDir, 'mcp'), { recursive: true });
    // No server.js

    const report = await checkPluginHealth(tempDir, '1.0.0');
    const mcpCheck = report.checks.find((c) => c.check === 'mcp-server');
    expect(mcpCheck?.status).toBe('unhealthy');
  });

  it('should detect invalid .mcp.json', async () => {
    await fs.writeFile(path.join(tempDir, '.mcp.json'), 'not json');

    const report = await checkPluginHealth(tempDir, '1.0.0');
    const mcpConfigCheck = report.checks.find((c) => c.check === 'mcp-config');
    expect(mcpConfigCheck?.status).toBe('unhealthy');
  });

  it('should detect missing SKILL.md in skill directories', async () => {
    await fs.mkdir(path.join(tempDir, 'skills', 'my-skill'), { recursive: true });
    // No SKILL.md inside

    const report = await checkPluginHealth(tempDir, '1.0.0');
    const skillsCheck = report.checks.find((c) => c.check === 'skills-integrity');
    expect(skillsCheck?.status).toBe('unhealthy');
    expect(skillsCheck?.message).toContain('my-skill');
  });
});
