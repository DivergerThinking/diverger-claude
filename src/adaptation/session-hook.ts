import fs from 'fs/promises';
import path from 'path';
import { extractErrorMessage } from '../core/errors.js';
import { loadMeta } from '../governance/history.js';
import { detectChanges } from './change-detector.js';
import { applyAutoUpdates } from './auto-updater.js';
import { MemoryEngine } from '../memory/index.js';
import { LearningEngine } from '../learning/index.js';
import type { SessionError } from '../learning/index.js';
import { runHealthCheck } from '../repair/health-check.js';

/**
 * Logic for the SessionStart hook.
 * Runs when Claude Code starts a new session in a project.
 * Checks for changes, runs health check, loads memory, and notifies.
 */
export async function onSessionStart(projectRoot: string, options?: { onError?: (msg: string) => void }): Promise<string | null> {
  // A5: Wrap entire body in try/catch so hook failures never crash Claude Code session
  try {
    const meta = await loadMeta(projectRoot);
    if (!meta) return null; // Not a diverger-managed project

    const messages: string[] = [];

    // --- Memory: increment session, consolidate if due ---
    const memory = new MemoryEngine(projectRoot);
    try {
      await memory.onSessionStart();
    } catch {
      // Memory failures must never block session start
    }

    // --- Process pending session errors from previous session ---
    try {
      const sessionErrorsPath = path.join(projectRoot, '.claude', 'session-errors.local.json');
      const raw = await fs.readFile(sessionErrorsPath, 'utf-8').catch(() => null);
      if (raw) {
        const errors: SessionError[] = JSON.parse(raw);
        if (errors.length > 0) {
          const learning = new LearningEngine(projectRoot);
          const result = await learning.processSessionErrors(errors);
          if (result.rulesGenerated > 0) {
            messages.push(`${result.rulesGenerated} reglas generadas desde patrones de error`);
          }
          if (result.patternsUpdated > 0) {
            messages.push(`${result.patternsUpdated} patrones de error actualizados`);
          }
        }
        await fs.unlink(sessionErrorsPath).catch(() => {});
      }
    } catch {
      // Learning failures must never block session start
    }

    // --- Change detection ---
    const changes = await detectChanges(projectRoot, meta);
    if (changes.hasChanges) {
      const updates = await applyAutoUpdates(changes, projectRoot);
      for (const u of updates) {
        messages.push(u.description);
      }
    }

    // --- Config health check + auto-repair ---
    try {
      const healthMsg = await runHealthCheck(projectRoot);
      if (healthMsg) messages.push(healthMsg);
    } catch {
      // Health check failures must never block session start
    }

    // --- Sync learnings to Claude Code auto-memory ---
    try {
      await memory.syncToClaudeMemory();
    } catch {
      // Sync failures must never block session start
    }

    // --- Inject anti-patterns summary ---
    try {
      const antiPatterns = await memory.getAntiPatterns(3);
      if (antiPatterns.length > 0) {
        const summary = antiPatterns.map((a) => a.pattern).join('; ');
        messages.push(`Anti-patterns activos: ${summary}`);
      }
    } catch {
      // Non-critical
    }

    if (messages.length === 0) return null;

    return `[diverger-claude] ${messages.join(' | ')}`;
  } catch (err) {
    (options?.onError ?? console.error)(`[diverger-claude] SessionStart hook error: ${extractErrorMessage(err)}`);
    return null;
  }
}
