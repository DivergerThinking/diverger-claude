/**
 * Detects whether the diverger-claude plugin is installed in Claude Code.
 *
 * Checks known installation paths:
 * 1. User-scope: ~/.claude/plugins/diverger-claude/
 * 2. Project-scope: .claude/plugins/diverger-claude/ (relative to projectRoot)
 * 3. Cache: ~/.claude/plugins/cache/diverger-claude/
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PLUGIN_NAME = 'diverger-claude';

const KNOWN_PATHS = [
  // User-scope plugin installation
  path.join(os.homedir(), '.claude', 'plugins', PLUGIN_NAME),
  // Cache directory (marketplace installs)
  path.join(os.homedir(), '.claude', 'plugins', 'cache', PLUGIN_NAME),
];

/**
 * Check if the diverger-claude plugin is installed.
 * Returns the path where the plugin was found, or null if not installed.
 */
export function detectPluginInstalled(projectRoot?: string): string | null {
  // Check user-scope paths
  for (const p of KNOWN_PATHS) {
    if (existsSync(path.join(p, '.claude-plugin', 'plugin.json'))) {
      return p;
    }
  }

  // Check project-scope
  if (projectRoot) {
    const projectPlugin = path.join(projectRoot, '.claude', 'plugins', PLUGIN_NAME);
    if (existsSync(path.join(projectPlugin, '.claude-plugin', 'plugin.json'))) {
      return projectPlugin;
    }
  }

  return null;
}

/**
 * Returns true if deprecation notices should be suppressed.
 * Suppressed in: --quiet, --json, CI environments.
 */
export function shouldSuppressDeprecation(output: string): boolean {
  if (output === 'quiet' || output === 'json') return true;
  if (process.env.CI === 'true') return true;
  if (process.env.DIVERGER_NO_DEPRECATION === '1') return true;
  return false;
}
