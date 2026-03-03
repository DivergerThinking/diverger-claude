import { describe, it, expect } from 'vitest';
import {
  parseGitHubActionsLog,
  parseGitLabCILog,
  ciErrorsToSessionErrors,
} from '../../../src/learning/ci-error-parser.js';

describe('parseGitHubActionsLog', () => {
  it('should extract errors from tab-separated log format', () => {
    const log = [
      'test\tRun npm test\t##[error]Error: Tests failed',
      'test\tRun npm test\tFAIL tests/unit/foo.test.ts',
      'build\tRun npm build\tCompilation successful',
    ].join('\n');

    const result = parseGitHubActionsLog(log);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]!.jobName).toBe('test');
    expect(result.errors[0]!.step).toBe('Run npm test');
    expect(result.errors[0]!.message).toContain('Tests failed');
    expect(result.errors[0]!.source).toBe('github-actions');
    expect(result.errors[1]!.message).toContain('FAIL');
  });

  it('should handle two-part lines', () => {
    const log = 'build\tError: build failed';
    const result = parseGitHubActionsLog(log);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.jobName).toBe('build');
  });

  it('should detect TypeScript errors', () => {
    const log = 'typecheck\tRun tsc\terror TS2322: Type string is not assignable to number';
    const result = parseGitHubActionsLog(log);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toContain('TS2322');
  });

  it('should return empty array for clean logs', () => {
    const log = [
      'test\tRun npm test\tAll tests passed',
      'build\tRun npm build\tBuild complete',
    ].join('\n');

    const result = parseGitHubActionsLog(log);
    expect(result.errors).toHaveLength(0);
    expect(result.conclusion).toBe('success');
  });

  it('should handle empty log', () => {
    const result = parseGitHubActionsLog('');
    expect(result.errors).toHaveLength(0);
  });

  it('should detect npm errors', () => {
    const log = 'install\tRun npm install\tnpm ERR! 404 Not Found';
    const result = parseGitHubActionsLog(log);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toContain('npm ERR!');
  });

  it('should clean ANSI escape codes', () => {
    const log = 'test\tRun test\t\u001b[31m##[error]Something failed\u001b[0m';
    const result = parseGitHubActionsLog(log);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).not.toContain('\u001b');
  });

  it('should extract errors from multiple jobs', () => {
    const log = [
      'lint\tRun eslint\tError: Linting failed',
      'test\tRun vitest\tFAIL tests/unit/foo.test.ts',
      'build\tRun tsc\terror TS2345: Argument of type',
    ].join('\n');

    const result = parseGitHubActionsLog(log);
    expect(result.errors).toHaveLength(3);
    const jobs = result.errors.map((e) => e.jobName);
    expect(jobs).toContain('lint');
    expect(jobs).toContain('test');
    expect(jobs).toContain('build');
  });
});

describe('parseGitLabCILog', () => {
  it('should extract errors from GitLab log format', () => {
    const log = [
      'section_start:1234:test_job',
      '$ npm test',
      'Error: Tests failed with 3 failures',
      'section_end:1234:test_job',
    ].join('\n');

    const result = parseGitLabCILog(log);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.source).toBe('gitlab-ci');
    expect(result.errors[0]!.jobName).toBe('test_job');
    expect(result.errors[0]!.message).toContain('Tests failed');
  });

  it('should detect exit codes', () => {
    const log = 'Process exited with code 1';
    const result = parseGitLabCILog(log);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.exitCode).toBe(1);
  });

  it('should return empty for clean logs', () => {
    const log = [
      '$ npm test',
      'All tests passed',
      '$ npm build',
      'Build complete',
    ].join('\n');

    const result = parseGitLabCILog(log);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle empty log', () => {
    const result = parseGitLabCILog('');
    expect(result.errors).toHaveLength(0);
  });
});

describe('ciErrorsToSessionErrors', () => {
  it('should convert CI errors to SessionError format', () => {
    const result = ciErrorsToSessionErrors([
      {
        source: 'github-actions',
        jobName: 'test',
        step: 'Run npm test',
        message: 'Tests failed',
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]!.message).toContain('[CI:github-actions/test]');
    expect(result[0]!.message).toContain('Tests failed');
    expect(result[0]!.tool).toBe('ci-pipeline');
    expect(result[0]!.timestamp).toBeDefined();
  });

  it('should handle empty array', () => {
    const result = ciErrorsToSessionErrors([]);
    expect(result).toHaveLength(0);
  });

  it('should preserve timestamps when available', () => {
    const ts = '2026-03-01T10:00:00Z';
    const result = ciErrorsToSessionErrors([
      {
        source: 'gitlab-ci',
        jobName: 'build',
        message: 'Build failed',
        timestamp: ts,
      },
    ]);

    expect(result[0]!.timestamp).toBe(ts);
  });
});
