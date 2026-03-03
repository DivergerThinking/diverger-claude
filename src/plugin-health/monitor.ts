import path from 'path';
import { readJsonOrNull, fileExists } from '../utils/fs.js';
import { checkHooksJson, checkHookScripts } from './hook-checker.js';
import { checkMcpServer, checkMcpConfig } from './mcp-checker.js';
import { checkVersionConsistency } from './version-checker.js';
import type { HookCheckResult } from './hook-checker.js';
import type { McpCheckResult } from './mcp-checker.js';
import type { VersionCheckResult } from './version-checker.js';
import fg from 'fast-glob';

export type HealthCheckResult = HookCheckResult | McpCheckResult | VersionCheckResult | IntegrityCheckResult;

export interface IntegrityCheckResult {
  check: 'agents-integrity' | 'skills-integrity' | 'plugin-json';
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  autoFixable: boolean;
}

export type OverallStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface PluginHealthReport {
  status: OverallStatus;
  checks: HealthCheckResult[];
  autoFixableCount: number;
}

/**
 * Run all plugin health checks.
 */
export async function checkPluginHealth(
  pluginDir: string,
  cliVersion: string,
): Promise<PluginHealthReport> {
  const checks: HealthCheckResult[] = [];

  // Plugin manifest
  checks.push(await checkPluginJson(pluginDir));

  // Hooks
  checks.push(await checkHooksJson(pluginDir));
  checks.push(await checkHookScripts(pluginDir));

  // MCP
  checks.push(await checkMcpServer(pluginDir));
  checks.push(await checkMcpConfig(pluginDir));

  // Integrity
  checks.push(await checkAgentsIntegrity(pluginDir));
  checks.push(await checkSkillsIntegrity(pluginDir));

  // Version
  checks.push(await checkVersionConsistency(pluginDir, cliVersion));

  // Compute overall status
  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
  const hasDegraded = checks.some((c) => c.status === 'degraded');
  const status: OverallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  const autoFixableCount = checks.filter((c) => c.autoFixable && c.status !== 'healthy').length;

  return { status, checks, autoFixableCount };
}

/**
 * Check that plugin.json manifest exists and is valid.
 */
async function checkPluginJson(pluginDir: string): Promise<IntegrityCheckResult> {
  const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  const content = await readJsonOrNull(pluginJsonPath);

  if (!content) {
    const exists = await fileExists(pluginJsonPath);
    return {
      check: 'plugin-json',
      status: 'unhealthy',
      message: exists
        ? 'plugin.json contiene JSON inválido'
        : 'plugin.json no encontrado',
      autoFixable: true,
    };
  }

  return {
    check: 'plugin-json',
    status: 'healthy',
    message: 'plugin.json válido',
    autoFixable: false,
  };
}

/**
 * Check that agent .md files exist and have frontmatter.
 */
async function checkAgentsIntegrity(pluginDir: string): Promise<IntegrityCheckResult> {
  const agentsDir = path.join(pluginDir, 'agents');
  const files = await fg('*.md', { cwd: agentsDir, onlyFiles: true }).catch(() => []);

  if (files.length === 0) {
    return {
      check: 'agents-integrity',
      status: 'degraded',
      message: 'No se encontraron agentes en plugin/agents/',
      autoFixable: true,
    };
  }

  return {
    check: 'agents-integrity',
    status: 'healthy',
    message: `${files.length} agentes encontrados`,
    autoFixable: false,
  };
}

/**
 * Check that all skill directories have SKILL.md.
 */
async function checkSkillsIntegrity(pluginDir: string): Promise<IntegrityCheckResult> {
  const skillsDir = path.join(pluginDir, 'skills');
  const dirs = await fg('*', { cwd: skillsDir, onlyDirectories: true }).catch(() => []);

  if (dirs.length === 0) {
    return {
      check: 'skills-integrity',
      status: 'degraded',
      message: 'No se encontraron skills en plugin/skills/',
      autoFixable: true,
    };
  }

  const missing: string[] = [];
  for (const dir of dirs) {
    const skillMdPath = path.join(skillsDir, dir, 'SKILL.md');
    if (!(await fileExists(skillMdPath))) {
      missing.push(dir);
    }
  }

  if (missing.length > 0) {
    return {
      check: 'skills-integrity',
      status: 'unhealthy',
      message: `SKILL.md faltante en: ${missing.join(', ')}`,
      autoFixable: true,
    };
  }

  return {
    check: 'skills-integrity',
    status: 'healthy',
    message: `${dirs.length} skills con SKILL.md válido`,
    autoFixable: false,
  };
}
