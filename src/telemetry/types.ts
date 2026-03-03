/** A single telemetry event recorded after a CLI command completes */
export interface TelemetryEvent {
  /** ISO timestamp */
  ts: string;
  /** CLI command name: 'init', 'sync', 'check', 'status', etc. */
  command: string;
  /** Whether plugin mode was active */
  pluginMode: boolean;
  /** Detected technology IDs (e.g. ['typescript', 'nextjs', 'vitest']) — no paths, no versions */
  detectedStack: string[];
  /** Number of profiles applied */
  profileCount: number;
  /** Error code if command failed (e.g. 'DETECTION_ERROR') — no message, no stack trace */
  errorCode?: string;
  /** Duration in milliseconds */
  durationMs: number;
}

/** Persistent telemetry store */
export interface TelemetryStore {
  enabled: boolean;
  events: TelemetryEvent[];
}
