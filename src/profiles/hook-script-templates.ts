/**
 * Reusable script templates for external hook scripts (.claude/hooks/*.sh).
 *
 * All hooks receive JSON input via stdin from Claude Code.
 *
 * PreToolUse scripts output hookSpecificOutput JSON to stdout:
 *   { "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "deny", ... } }
 *   To allow: just exit 0 with no output.
 *
 * PostToolUse scripts use exit codes:
 *   0 = pass, 2 = blocking error (stderr shown to Claude), other = non-blocking
 *
 * See: https://code.claude.com/docs/en/hooks
 */

export interface FilePatternCheckOpts {
  /** Script filename (e.g. 'check-long-lines.sh') */
  filename: string;
  /** Extended regex pattern for grep -E */
  pattern: string;
  /** Human-readable message when pattern matches */
  message: string;
  /** Exit code on match (default: 2 = blocking, shown to Claude) */
  exitCode?: number;
  /** Optional file extension filter — skip if file doesn't match (e.g. ['.ts', '.tsx']) */
  fileExtensions?: string[];
}

export interface PreToolUseBlockerOpts {
  /** Script filename (e.g. 'secret-scanner.sh') */
  filename: string;
  /** Extended regex pattern for grep -E to detect in tool input */
  pattern: string;
  /** Human-readable reason for blocking (shown to Claude) */
  reason: string;
  /** jq expression to extract the field to check from stdin JSON (e.g. '.tool_input.content') */
  inputField: string;
}

export interface NodeCheckOpts {
  /** Script filename */
  filename: string;
  /** Inline Node.js script (receives file path as first arg) */
  nodeScript: string;
  /** Human-readable message when check fails */
  message: string;
  /** Exit code on failure (default: 2 = blocking, shown to Claude) */
  exitCode?: number;
  /** Optional file extension filter — skip if file doesn't match */
  fileExtensions?: string[];
}

/** Generate a PostToolUse script that checks file content with grep.
 *  Reads tool_input.file_path from stdin JSON. */
export function makeFilePatternCheckScript(opts: FilePatternCheckOpts): string {
  const exitCode = opts.exitCode ?? 2;
  const extCheck = opts.fileExtensions
    ? `\necho "$FILE_PATH" | grep -qE '\\.(${opts.fileExtensions.map((e) => escapeRegex(e.replace(/^\./, ''))).join('|')})$' || exit 0`
    : '';
  return `#!/bin/bash
# ${opts.message}
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then exit 0; fi${extCheck}
if grep -qEn ${escapeShellArg(opts.pattern)} "$FILE_PATH" 2>/dev/null; then
  echo "${escapeEchoStr(opts.message)}" >&2
  exit ${exitCode}
fi
exit 0
`;
}

/** Generate a PreToolUse script that blocks tool invocations via hookSpecificOutput JSON.
 *  Reads the specified inputField from stdin JSON. */
export function makePreToolUseBlockerScript(opts: PreToolUseBlockerOpts): string {
  return `#!/bin/bash
# PreToolUse blocker: ${opts.reason}
INPUT=$(cat)
CHECK_VALUE=$(echo "$INPUT" | jq -r '${opts.inputField} // empty')
PATTERN=${escapeShellArg(opts.pattern)}
if echo "$CHECK_VALUE" | grep -qE "$PATTERN"; then
  jq -n --arg reason ${escapeShellArg(opts.reason)} '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
fi
exit 0
`;
}

/** Generate a PostToolUse script that runs a Node.js check.
 *  Reads tool_input.file_path from stdin JSON. */
export function makeNodeCheckScript(opts: NodeCheckOpts): string {
  const exitCode = opts.exitCode ?? 2;
  const extCheck = opts.fileExtensions
    ? `\necho "$FILE_PATH" | grep -qE '\\.(${opts.fileExtensions.map((e) => escapeRegex(e.replace(/^\./, ''))).join('|')})$' || exit 0`
    : '';
  return `#!/bin/bash
# ${opts.message}
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then exit 0; fi${extCheck}
node -e ${escapeShellArg(opts.nodeScript)} -- "$FILE_PATH" 2>/dev/null
RESULT=$?
if [ $RESULT -ne 0 ]; then
  echo "${escapeEchoStr(opts.message)}" >&2
  exit ${exitCode}
fi
exit 0
`;
}

/** Escape a string for use as a single-quoted shell argument */
function escapeShellArg(s: string): string {
  // Replace single quotes with '\'' (end quote, escaped quote, start quote)
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/** Escape a string for use inside double-quoted echo */
function escapeEchoStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Escape special regex characters for use in grep -E patterns */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
