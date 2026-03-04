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
 * Cross-platform note: All templates use Node.js instead of jq for JSON
 * parsing, since jq is not available by default on Windows.
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
  /** JS property path to extract from stdin JSON (e.g. '.tool_input.content') */
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

/**
 * Build a Node.js one-liner that reads JSON from stdin and extracts a nested property.
 * Replaces jq for cross-platform compatibility (jq is unavailable on Windows by default).
 *
 * @param jqPath - jq-style dot path (e.g. '.tool_input.file_path')
 * @returns Node.js inline script string for use inside double-quoted bash $()
 */
export function nodeJsonExtract(jqPath: string): string {
  // Convert jq path like '.tool_input.file_path' to JS property chain
  const keys = jqPath.replace(/^\./, '').split('.');
  const chain = keys.map((k) => `[${JSON.stringify(k)}]`).join('');
  return `let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=j${chain};console.log(v||'')}catch{console.log('')}})`;
}

/**
 * Build a Node.js one-liner that outputs JSON to stdout (replaces jq -n).
 * Used for PreToolUse blocker scripts to emit hookSpecificOutput.
 *
 * @param reason - The denial reason (will be JSON-escaped)
 * @returns Node.js inline script string
 */
function nodeJsonDeny(reason: string): string {
  const escaped = JSON.stringify(reason);
  return `console.log(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:${escaped}}}))`;
}

/** Generate a PostToolUse script that checks file content with grep.
 *  Reads tool_input.file_path from stdin JSON.
 *  Uses Node.js instead of jq for cross-platform compatibility. */
export function makeFilePatternCheckScript(opts: FilePatternCheckOpts): string {
  const exitCode = opts.exitCode ?? 2;
  const extCheck = opts.fileExtensions
    ? `\necho "$FILE_PATH" | grep -qE '\\.(${opts.fileExtensions.map((e) => escapeRegex(e.replace(/^\./, ''))).join('|')})$' || exit 0`
    : '';
  return `#!/bin/bash
# ${opts.message}
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "${nodeJsonExtract('.tool_input.file_path')}")
if [ -z "$FILE_PATH" ]; then exit 0; fi${extCheck}
if grep -qEn ${escapeShellArg(opts.pattern)} "$FILE_PATH" 2>/dev/null; then
  echo "${escapeEchoStr(opts.message)}" >&2
  exit ${exitCode}
fi
exit 0
`;
}

/** Generate a PreToolUse script that blocks tool invocations via hookSpecificOutput JSON.
 *  Reads the specified inputField from stdin JSON.
 *  Uses Node.js instead of jq for cross-platform compatibility. */
export function makePreToolUseBlockerScript(opts: PreToolUseBlockerOpts): string {
  return `#!/bin/bash
# PreToolUse blocker: ${opts.reason}
INPUT=$(cat)
CHECK_VALUE=$(echo "$INPUT" | node -e "${nodeJsonExtract(opts.inputField)}")
PATTERN=${escapeShellArg(opts.pattern)}
if echo "$CHECK_VALUE" | grep -qE "$PATTERN"; then
  node -e '${nodeJsonDeny(opts.reason)}'
  exit 0
fi
exit 0
`;
}

/** Generate a PostToolUse script that runs a Node.js check.
 *  Reads tool_input.file_path from stdin JSON.
 *  Uses Node.js instead of jq for cross-platform compatibility. */
export function makeNodeCheckScript(opts: NodeCheckOpts): string {
  const exitCode = opts.exitCode ?? 2;
  const extCheck = opts.fileExtensions
    ? `\necho "$FILE_PATH" | grep -qE '\\.(${opts.fileExtensions.map((e) => escapeRegex(e.replace(/^\./, ''))).join('|')})$' || exit 0`
    : '';
  return `#!/bin/bash
# ${opts.message}
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "${nodeJsonExtract('.tool_input.file_path')}")
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
