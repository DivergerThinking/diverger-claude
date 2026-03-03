import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { checkHooksJson, checkHookScripts } from '../../../src/plugin-health/hook-checker.js';
import { checkMcpServer, checkMcpConfig } from '../../../src/plugin-health/mcp-checker.js';
import { checkVersionConsistency } from '../../../src/plugin-health/version-checker.js';

describe('Plugin Health Checkers', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-health-checkers-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('checkHooksJson', () => {
    it('should return unhealthy when file missing', async () => {
      const result = await checkHooksJson(tempDir);
      expect(result.status).toBe('unhealthy');
      expect(result.autoFixable).toBe(true);
    });

    it('should return unhealthy for invalid JSON', async () => {
      await fs.mkdir(path.join(tempDir, 'hooks'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'hooks', 'hooks.json'), 'invalid{{{');
      const result = await checkHooksJson(tempDir);
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('JSON inválido');
    });

    it('should return healthy for valid JSON', async () => {
      await fs.mkdir(path.join(tempDir, 'hooks'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'hooks', 'hooks.json'), '{}');
      const result = await checkHooksJson(tempDir);
      expect(result.status).toBe('healthy');
    });
  });

  describe('checkHookScripts', () => {
    it('should return unhealthy when hooks.json unavailable', async () => {
      const result = await checkHookScripts(tempDir);
      expect(result.status).toBe('unhealthy');
    });

    it('should return healthy when all scripts exist', async () => {
      await fs.mkdir(path.join(tempDir, 'hooks', 'scripts'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'hooks', 'hooks.json'),
        JSON.stringify({
          PreToolUse: {
            Write: [{ type: 'command', command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/test.sh' }],
          },
        }),
      );
      await fs.writeFile(path.join(tempDir, 'hooks', 'scripts', 'test.sh'), '#!/bin/bash');

      const result = await checkHookScripts(tempDir);
      expect(result.status).toBe('healthy');
    });

    it('should report missing scripts', async () => {
      await fs.mkdir(path.join(tempDir, 'hooks', 'scripts'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'hooks', 'hooks.json'),
        JSON.stringify({
          PostToolUse: {
            Write: [{ type: 'command', command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/absent.sh' }],
          },
        }),
      );

      const result = await checkHookScripts(tempDir);
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('absent.sh');
    });
  });

  describe('checkMcpServer', () => {
    it('should return unhealthy when server.js missing', async () => {
      const result = await checkMcpServer(tempDir);
      expect(result.status).toBe('unhealthy');
    });

    it('should return healthy when server.js exists', async () => {
      await fs.mkdir(path.join(tempDir, 'mcp'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'mcp', 'server.js'), 'ok');
      const result = await checkMcpServer(tempDir);
      expect(result.status).toBe('healthy');
    });
  });

  describe('checkMcpConfig', () => {
    it('should return unhealthy when .mcp.json missing', async () => {
      const result = await checkMcpConfig(tempDir);
      expect(result.status).toBe('unhealthy');
    });

    it('should return unhealthy when diverger-claude entry missing', async () => {
      await fs.writeFile(path.join(tempDir, '.mcp.json'), JSON.stringify({ mcpServers: {} }));
      const result = await checkMcpConfig(tempDir);
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('diverger-claude');
    });

    it('should return healthy when properly configured', async () => {
      await fs.writeFile(
        path.join(tempDir, '.mcp.json'),
        JSON.stringify({ mcpServers: { 'diverger-claude': { command: 'node' } } }),
      );
      const result = await checkMcpConfig(tempDir);
      expect(result.status).toBe('healthy');
    });
  });

  describe('checkVersionConsistency', () => {
    it('should return degraded when plugin.json unreadable', async () => {
      const result = await checkVersionConsistency(tempDir, '1.6.0');
      expect(result.status).toBe('degraded');
    });

    it('should return degraded on version mismatch', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ version: '1.5.0' }),
      );
      const result = await checkVersionConsistency(tempDir, '1.6.0');
      expect(result.status).toBe('degraded');
      expect(result.data?.pluginVersion).toBe('1.5.0');
      expect(result.data?.cliVersion).toBe('1.6.0');
    });

    it('should return healthy on version match', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ version: '1.6.0' }),
      );
      const result = await checkVersionConsistency(tempDir, '1.6.0');
      expect(result.status).toBe('healthy');
    });
  });
});
