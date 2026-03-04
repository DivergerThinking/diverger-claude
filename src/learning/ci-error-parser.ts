import type { SessionError } from './session-extractor.js';

export interface CIErrorEntry {
  /** CI provider source */
  source: 'github-actions' | 'gitlab-ci';
  /** Name of the job that failed */
  jobName: string;
  /** Step within the job (if available) */
  step?: string;
  /** Error message content */
  message: string;
  /** Process exit code (if available) */
  exitCode?: number;
  /** ISO timestamp (if available) */
  timestamp?: string;
}

export interface CILogParseResult {
  /** Extracted error entries */
  errors: CIErrorEntry[];
  /** Run/pipeline ID */
  runId?: string;
  /** Final conclusion */
  conclusion?: string;
}

/**
 * Parse GitHub Actions failed log output.
 * Expected input: output from `gh run view <id> --log-failed`
 *
 * Format is tab-separated: `{job}\t{step}\t{log_line}`
 * Error lines typically start with "Error" or "##[error]" or contain error indicators.
 */
export function parseGitHubActionsLog(logOutput: string): CILogParseResult {
  const errors: CIErrorEntry[] = [];
  const lines = logOutput.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    // GitHub Actions log format: job_name\tstep_name\tlog_line
    const parts = line.split('\t');
    let jobName = 'unknown';
    let step: string | undefined;
    let message = line;

    if (parts.length >= 3) {
      jobName = parts[0]!.trim();
      step = parts[1]!.trim();
      message = parts.slice(2).join('\t').trim();
    } else if (parts.length === 2) {
      jobName = parts[0]!.trim();
      message = parts[1]!.trim();
    }

    // Strip ANSI codes first, then check for errors, then clean for storage
    const stripped = stripAnsi(message);
    if (isErrorLine(stripped)) {
      errors.push({
        source: 'github-actions',
        jobName,
        step: step ?? undefined,
        message: cleanErrorMessage(stripped),
      });
    }
  }

  return { errors, conclusion: errors.length > 0 ? 'failure' : 'success' };
}

/**
 * Parse GitLab CI job log output.
 * Expected input: raw job log from GitLab CI.
 *
 * Error patterns: lines starting with "ERROR", "error:", exit code messages,
 * or common CI failure patterns.
 */
export function parseGitLabCILog(logOutput: string): CILogParseResult {
  const errors: CIErrorEntry[] = [];
  const lines = logOutput.split('\n');
  let currentJob = 'unknown';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect job name from section markers
    const jobMatch = trimmed.match(/section_start:\d+:(\S+)/);
    if (jobMatch) {
      currentJob = jobMatch[1]!;
      continue;
    }

    // Also detect from "Running with gitlab-runner" or job headers
    const jobHeaderMatch = trimmed.match(/^Running on (.+) via/);
    if (jobHeaderMatch) continue;

    const strippedLine = stripAnsi(trimmed);
    if (isErrorLine(strippedLine)) {
      errors.push({
        source: 'gitlab-ci',
        jobName: currentJob,
        message: cleanErrorMessage(strippedLine),
      });
    }

    // Detect exit code
    const exitMatch = trimmed.match(/exit(?:ed)?\s+(?:with\s+)?(?:code\s+)?(\d+)/i);
    if (exitMatch && exitMatch[1] !== '0') {
      errors.push({
        source: 'gitlab-ci',
        jobName: currentJob,
        message: `Process exited with code ${exitMatch[1]}`,
        exitCode: parseInt(exitMatch[1]!, 10),
      });
    }
  }

  return { errors, conclusion: errors.length > 0 ? 'failure' : 'success' };
}

/**
 * Convert CI error entries to SessionError format for processing by LearningEngine.
 */
export function ciErrorsToSessionErrors(entries: CIErrorEntry[]): SessionError[] {
  return entries.map((entry) => ({
    message: `[CI:${entry.source}/${entry.jobName}] ${entry.message}`,
    tool: 'ci-pipeline',
    timestamp: entry.timestamp ?? new Date().toISOString(),
  }));
}

/** Check if a line looks like an error */
function isErrorLine(line: string): boolean {
  const errorPatterns = [
    /^##\[error\]/,
    /^Error:/i,
    /^error\s/i,
    /^FAIL\b/i,
    /error TS\d+/,
    /ENOENT|EACCES|EPERM/,
    /npm ERR!/,
    /ERR_/,
    /AssertionError|AssertionFailedError/i,
    /SyntaxError/,
    /TypeError:/,
    /ReferenceError:/,
    /Cannot find module/,
    /command not found/,
    /Permission denied/,
    /version.*mismatch/i,
    /build:plugin/i,
  ];
  return errorPatterns.some((p) => p.test(line));
}

/** Remove ANSI escape codes only */
function stripAnsi(message: string): string {
  return message.replace(/\u001b\[[0-9;]*m/g, '');
}

/** Clean up error message (remove timestamps, prefixes) — call after stripAnsi */
function cleanErrorMessage(message: string): string {
  return message
    .replace(/^##\[error\]\s*/i, '')   // GitHub Actions error prefix
    .replace(/^\d{4}-\d{2}-\d{2}T[\d:.Z]+\s*/, '') // ISO timestamps
    .trim();
}
