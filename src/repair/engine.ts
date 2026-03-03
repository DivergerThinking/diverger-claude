import { loadMeta } from '../governance/history.js';
import { MemoryEngine } from '../memory/index.js';
import { diagnose } from './diagnostics.js';
import { createRepairAction } from './strategies.js';
import type { RepairMode, RepairResult, RepairReport, Diagnosis } from './types.js';

/**
 * Self-Repair Engine.
 *
 * Confidence-based action model:
 * - 90-100: Auto-fix silently
 * - 70-89:  Auto-fix with notification
 * - 50-69:  Suggest fix (interactive mode only)
 * - 0-49:   Report only
 */
export class RepairEngine {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run diagnostics and apply repairs based on mode.
   */
  async run(mode: RepairMode = 'auto', dryRun = false): Promise<RepairReport> {
    const meta = await loadMeta(this.projectRoot);
    const diagnoses = await diagnose(this.projectRoot, meta);
    const repairs: RepairResult[] = [];

    if (mode === 'report-only' || dryRun) {
      return { diagnoses, repairs, mode };
    }

    for (const diag of diagnoses) {
      if (!diag.autoRepairable) continue;

      const shouldRepair = this.shouldAutoRepair(diag, mode);
      if (!shouldRepair) continue;

      const action = createRepairAction(diag, this.projectRoot, meta);
      if (!action) continue;

      let success = false;
      try {
        success = await action.execute();
      } catch {
        success = false;
      }

      repairs.push({
        diagnosisId: diag.id,
        description: action.description,
        success,
        confidence: diag.confidence,
      });
    }

    // Log repairs to memory (fire-and-forget)
    this.logRepairsToMemory(repairs).catch(() => {});

    return { diagnoses, repairs, mode };
  }

  private shouldAutoRepair(diag: Diagnosis, mode: RepairMode): boolean {
    if (mode === 'auto') {
      // Auto-repair if confidence >= 70
      return diag.confidence >= 70;
    }
    if (mode === 'interactive') {
      // In interactive mode, auto-repair >= 70, suggest 50-69
      // (suggestion handled externally — here we only auto-repair high confidence)
      return diag.confidence >= 70;
    }
    return false;
  }

  private async logRepairsToMemory(repairs: RepairResult[]): Promise<void> {
    if (repairs.length === 0) return;
    const memory = new MemoryEngine(this.projectRoot);
    for (const repair of repairs) {
      await memory.recordRepair({
        diagnosisId: repair.diagnosisId,
        description: repair.description,
        success: repair.success,
        confidence: repair.confidence,
      });
    }
  }
}
