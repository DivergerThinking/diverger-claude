import path from 'path';
import fg from 'fast-glob';
import {
  UNIVERSAL_AGENT_NAMES,
  UNIVERSAL_HOOK_SCRIPT_FILENAMES,
} from '../core/constants.js';

export interface ConstantsCheckResult {
  check: 'constants-consistency';
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  autoFixable: boolean;
  data?: {
    missingInConstants?: string[];
    extraInConstants?: string[];
  };
}

/**
 * Verify UNIVERSAL_* constants match actual plugin contents.
 * Checks agents and hook scripts for consistency.
 */
export async function checkConstantsConsistency(
  pluginDir: string,
): Promise<ConstantsCheckResult> {
  const issues: string[] = [];
  const missingInConstants: string[] = [];
  const extraInConstants: string[] = [];

  // Check agents: plugin/agents/*.md vs UNIVERSAL_AGENT_NAMES
  const agentsDir = path.join(pluginDir, 'agents');
  const agentFiles = await fg('*.md', { cwd: agentsDir, onlyFiles: true }).catch(() => []);
  const actualAgentNames = new Set(agentFiles.map((f) => f.replace(/\.md$/, '')));

  for (const name of UNIVERSAL_AGENT_NAMES) {
    if (!actualAgentNames.has(name)) {
      extraInConstants.push(`agent:${name}`);
    }
  }
  for (const name of actualAgentNames) {
    if (!UNIVERSAL_AGENT_NAMES.has(name)) {
      missingInConstants.push(`agent:${name}`);
    }
  }

  // Check hook scripts: plugin/hooks/scripts/*.sh vs UNIVERSAL_HOOK_SCRIPT_FILENAMES
  const scriptsDir = path.join(pluginDir, 'hooks', 'scripts');
  const scriptFiles = await fg('*.sh', { cwd: scriptsDir, onlyFiles: true }).catch(() => []);
  const actualScriptNames = new Set(scriptFiles);

  for (const name of UNIVERSAL_HOOK_SCRIPT_FILENAMES) {
    if (!actualScriptNames.has(name)) {
      extraInConstants.push(`hook:${name}`);
    }
  }
  // Note: plugin may have additional hook scripts (like error-tracker.sh, session-learner.sh)
  // that are intelligence hooks — these don't need to be in UNIVERSAL_* constants.
  // Only flag if a hook script from UNIVERSAL_* is missing from the plugin.

  if (extraInConstants.length > 0) {
    issues.push(`Constantes declaran componentes no encontrados en plugin: ${extraInConstants.join(', ')}`);
  }
  if (missingInConstants.length > 0) {
    issues.push(`Plugin tiene componentes no declarados en constantes: ${missingInConstants.join(', ')}`);
  }

  if (issues.length > 0) {
    const hasExtra = extraInConstants.length > 0;
    return {
      check: 'constants-consistency',
      status: hasExtra ? 'unhealthy' : 'degraded',
      message: issues.join('; '),
      autoFixable: false,
      data: {
        ...(missingInConstants.length > 0 ? { missingInConstants } : {}),
        ...(extraInConstants.length > 0 ? { extraInConstants } : {}),
      },
    };
  }

  return {
    check: 'constants-consistency',
    status: 'healthy',
    message: 'Constantes UNIVERSAL_* consistentes con el plugin',
    autoFixable: false,
  };
}
