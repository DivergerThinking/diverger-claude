import { describe, it, expect } from 'vitest';
import {
  makeFilePatternCheckScript,
  makePreToolUseBlockerScript,
  makeNodeCheckScript,
} from '../../../src/profiles/hook-script-templates.js';

describe('makeFilePatternCheckScript', () => {
  it('should produce a bash script with shebang', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
    });
    expect(script).toMatch(/^#!/);
    expect(script).toContain('#!/bin/bash');
  });

  it('should read file_path from stdin JSON using node (cross-platform)', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
    });
    expect(script).toContain('INPUT=$(cat)');
    // Uses Node.js instead of jq for cross-platform compatibility
    expect(script).toContain('node -e');
    expect(script).toContain('tool_input');
    expect(script).toContain('file_path');
    expect(script).toContain('$FILE_PATH');
    // Should NOT reference non-existent env vars
    expect(script).not.toContain('$CLAUDE_FILE_PATH');
    // Should NOT use jq (not available on Windows by default)
    expect(script).not.toMatch(/\bjq\b/);
  });

  it('should include the grep pattern', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: '\\bany\\b',
      message: 'Found any',
    });
    expect(script).toContain('\\bany\\b');
  });

  it('should default exit code to 2', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
    });
    expect(script).toContain('exit 2');
  });

  it('should use custom exit code', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
      exitCode: 1,
    });
    expect(script).toContain('exit 1');
  });

  it('should write message to stderr', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
    });
    expect(script).toContain('>&2');
  });

  it('should exit 0 on success', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
    });
    expect(script).toContain('exit 0');
  });

  it('should skip if FILE_PATH is empty', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
    });
    expect(script).toContain('if [ -z "$FILE_PATH" ]; then exit 0; fi');
  });

  it('should add file extension filter when fileExtensions provided', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
      fileExtensions: ['.ts', '.tsx'],
    });
    expect(script).toContain('grep -qE');
    expect(script).toContain('(ts|tsx)$');
  });

  it('should not add extension filter when fileExtensions not provided', () => {
    const script = makeFilePatternCheckScript({
      filename: 'test.sh',
      pattern: 'TODO',
      message: 'Found TODOs',
    });
    // Only the grep for the pattern, not extension filtering
    const extFilterMatch = script.match(/grep -qE '\\\\\..*\$'/);
    expect(extFilterMatch).toBeNull();
  });
});

describe('makePreToolUseBlockerScript', () => {
  it('should produce hookSpecificOutput JSON for PreToolUse deny', () => {
    const script = makePreToolUseBlockerScript({
      filename: 'blocker.sh',
      pattern: 'secret',
      reason: 'Secret detected',
      inputField: '.tool_input.content',
    });
    expect(script).toContain('hookSpecificOutput');
    expect(script).toContain('permissionDecision');
    expect(script).toContain('"deny"');
    // Should NOT use old format
    expect(script).not.toContain('"decision":"block"');
    expect(script).not.toContain('"decision":"allow"');
  });

  it('should read from stdin using node (cross-platform)', () => {
    const script = makePreToolUseBlockerScript({
      filename: 'blocker.sh',
      pattern: 'secret',
      reason: 'Secret detected',
      inputField: '.tool_input.content',
    });
    expect(script).toContain('INPUT=$(cat)');
    // Uses Node.js instead of jq for cross-platform compatibility
    expect(script).toContain('node -e');
    expect(script).toContain('tool_input');
    expect(script).toContain('content');
    // Should NOT reference non-existent env vars
    expect(script).not.toContain('$CLAUDE_TOOL_INPUT');
    expect(script).not.toContain('$CLAUDE_FILE_PATH');
    // Should NOT use jq
    expect(script).not.toMatch(/\bjq\b/);
  });

  it('should use custom inputField for command checking', () => {
    const script = makePreToolUseBlockerScript({
      filename: 'blocker.sh',
      pattern: 'rm -rf',
      reason: 'Destructive command',
      inputField: '.tool_input.command',
    });
    // Uses Node.js instead of jq — verify the field name is present
    expect(script).toContain('node -e');
    expect(script).toContain('tool_input');
    expect(script).toContain('command');
  });

  it('should include the reason in JSON output', () => {
    const script = makePreToolUseBlockerScript({
      filename: 'blocker.sh',
      pattern: 'secret',
      reason: 'Secret detected',
      inputField: '.tool_input.content',
    });
    expect(script).toContain('Secret detected');
  });

  it('should always exit 0 (JSON protocol)', () => {
    const script = makePreToolUseBlockerScript({
      filename: 'blocker.sh',
      pattern: 'test',
      reason: 'test',
      inputField: '.tool_input.content',
    });
    // Both branches should exit 0
    const exits = script.match(/exit 0/g);
    expect(exits).not.toBeNull();
    expect(exits!.length).toBeGreaterThanOrEqual(2);
  });

  it('should use node to build JSON deny output', () => {
    const script = makePreToolUseBlockerScript({
      filename: 'blocker.sh',
      pattern: 'test',
      reason: 'Test reason',
      inputField: '.tool_input.content',
    });
    // Uses Node.js instead of jq -n
    expect(script).toContain('node -e');
    expect(script).toContain('hookEventName');
    expect(script).toContain('PreToolUse');
  });
});

describe('makeNodeCheckScript', () => {
  it('should produce a bash script that runs node', () => {
    const script = makeNodeCheckScript({
      filename: 'check.sh',
      nodeScript: 'process.exit(0)',
      message: 'Node check failed',
    });
    expect(script).toContain('node -e');
  });

  it('should read file_path from stdin JSON using node (cross-platform)', () => {
    const script = makeNodeCheckScript({
      filename: 'check.sh',
      nodeScript: 'console.log(process.argv[1])',
      message: 'Check failed',
    });
    expect(script).toContain('INPUT=$(cat)');
    // Uses Node.js instead of jq for cross-platform compatibility
    expect(script).toContain('node -e');
    expect(script).toContain('tool_input');
    expect(script).toContain('file_path');
    expect(script).toContain('$FILE_PATH');
    // Should NOT reference non-existent env vars
    expect(script).not.toContain('$CLAUDE_FILE_PATH');
    // Should NOT use jq
    expect(script).not.toMatch(/\bjq\b/);
  });

  it('should default exit code to 2', () => {
    const script = makeNodeCheckScript({
      filename: 'check.sh',
      nodeScript: 'process.exit(0)',
      message: 'Check failed',
    });
    expect(script).toContain('exit 2');
  });

  it('should use custom exit code', () => {
    const script = makeNodeCheckScript({
      filename: 'check.sh',
      nodeScript: 'process.exit(0)',
      message: 'Check failed',
      exitCode: 1,
    });
    expect(script).toContain('exit 1');
  });

  it('should write message to stderr on failure', () => {
    const script = makeNodeCheckScript({
      filename: 'check.sh',
      nodeScript: 'process.exit(0)',
      message: 'Check failed',
    });
    expect(script).toContain('>&2');
  });

  it('should add file extension filter when fileExtensions provided', () => {
    const script = makeNodeCheckScript({
      filename: 'check.sh',
      nodeScript: 'process.exit(0)',
      message: 'Check failed',
      fileExtensions: ['.tsx', '.jsx'],
    });
    expect(script).toContain('(tsx|jsx)$');
  });
});
