#!/bin/bash
# PostToolUse hook: Capture tool errors to session error log
# Reads from stdin (Claude Code hook protocol) and appends failures to .claude/session-errors.local.json

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Check if the tool execution failed
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)
ERROR=$(echo "$INPUT" | jq -r '.error // empty' 2>/dev/null || true)

if [ -z "$ERROR" ]; then
  exit 0
fi

# Append error to session log
SESSION_LOG=".claude/session-errors.local.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create file if it doesn't exist
if [ ! -f "$SESSION_LOG" ]; then
  echo "[]" > "$SESSION_LOG"
fi

# Append the error entry
ENTRY=$(jq -n --arg msg "$ERROR" --arg tool "$TOOL_NAME" --arg ts "$TIMESTAMP" \
  '{message: $msg, tool: $tool, timestamp: $ts}')

UPDATED=$(jq --argjson entry "$ENTRY" '. + [$entry]' "$SESSION_LOG" 2>/dev/null || echo "[$ENTRY]")
echo "$UPDATED" > "$SESSION_LOG"
