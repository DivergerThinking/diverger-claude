import { loadMeta } from '../governance/history.js';
import { detectChanges } from './change-detector.js';
import { applyAutoUpdates } from './auto-updater.js';

/**
 * Logic for the SessionStart hook.
 * Runs when Claude Code starts a new session in a project.
 * Checks for changes and notifies if a sync is needed.
 */
export async function onSessionStart(projectRoot: string): Promise<string | null> {
  const meta = await loadMeta(projectRoot);
  if (!meta) return null; // Not a diverger-managed project

  const changes = await detectChanges(projectRoot, meta);
  if (!changes.hasChanges) return null;

  const updates = await applyAutoUpdates(changes, projectRoot);

  if (updates.length === 0) return null;

  const messages = updates.map((u) => u.description);
  return `[diverger-claude] ${messages.join(' | ')}`;
}
