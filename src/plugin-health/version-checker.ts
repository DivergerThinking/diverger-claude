import path from 'path';
import { readJsonOrNull } from '../utils/fs.js';

export interface VersionCheckResult {
  check: 'version-consistency' | 'update-available';
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  autoFixable: boolean;
  data?: { pluginVersion?: string; cliVersion?: string; latestVersion?: string };
}

interface PluginJson {
  version?: string;
}

/**
 * Check that the plugin version matches the CLI version.
 */
export async function checkVersionConsistency(
  pluginDir: string,
  cliVersion: string,
): Promise<VersionCheckResult> {
  const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  const pluginJson = await readJsonOrNull<PluginJson>(pluginJsonPath);

  if (!pluginJson?.version) {
    return {
      check: 'version-consistency',
      status: 'degraded',
      message: 'No se pudo leer la versión del plugin',
      autoFixable: false,
      data: { cliVersion },
    };
  }

  if (pluginJson.version !== cliVersion) {
    return {
      check: 'version-consistency',
      status: 'degraded',
      message: `Versión del plugin (${pluginJson.version}) difiere del CLI (${cliVersion})`,
      autoFixable: false,
      data: { pluginVersion: pluginJson.version, cliVersion },
    };
  }

  return {
    check: 'version-consistency',
    status: 'healthy',
    message: `Versión consistente: ${cliVersion}`,
    autoFixable: false,
    data: { pluginVersion: pluginJson.version, cliVersion },
  };
}
