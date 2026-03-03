export type DiagnosisId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9';

export type DiagnosisSeverity = 'critical' | 'warning' | 'info';

export interface Diagnosis {
  /** Unique diagnosis ID */
  id: DiagnosisId;
  /** Human-readable description */
  description: string;
  /** Affected file path */
  file: string;
  /** Confidence 0-100 that this diagnosis is correct */
  confidence: number;
  /** Severity level */
  severity: DiagnosisSeverity;
  /** Whether this can be auto-repaired */
  autoRepairable: boolean;
}

export interface RepairAction {
  /** Diagnosis that triggered this */
  diagnosisId: DiagnosisId;
  /** What will be done */
  description: string;
  /** Function to execute the repair */
  execute: () => Promise<boolean>;
}

export interface RepairResult {
  diagnosisId: DiagnosisId;
  description: string;
  success: boolean;
  confidence: number;
}

export type RepairMode = 'auto' | 'interactive' | 'report-only';

export interface RepairReport {
  diagnoses: Diagnosis[];
  repairs: RepairResult[];
  mode: RepairMode;
}
