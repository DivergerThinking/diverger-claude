import { RepairEngine } from './engine.js';
import type { RepairReport } from './types.js';

/**
 * Orchestrator for the SessionStart health check.
 * Runs diagnostics and auto-repairs with confidence >= 70.
 * Returns a human-readable summary or null if everything is healthy.
 */
export async function runHealthCheck(projectRoot: string): Promise<string | null> {
  const engine = new RepairEngine(projectRoot);
  const report = await engine.run('auto');

  const messages: string[] = [];

  // Report auto-repairs
  const successful = report.repairs.filter((r) => r.success);
  const failed = report.repairs.filter((r) => !r.success);

  if (successful.length > 0) {
    messages.push(
      `Auto-reparado: ${successful.map((r) => r.description).join(', ')}`,
    );
  }

  if (failed.length > 0) {
    messages.push(
      `Reparación fallida: ${failed.map((r) => r.description).join(', ')}`,
    );
  }

  // Report non-repairable issues with confidence >= 50
  const unrepairable = report.diagnoses.filter(
    (d) => !d.autoRepairable && d.confidence >= 50,
  );
  if (unrepairable.length > 0) {
    messages.push(
      `Sugerencias: ${unrepairable.map((d) => d.description).join('; ')}`,
    );
  }

  return messages.length > 0 ? messages.join(' | ') : null;
}

export type { RepairReport };
