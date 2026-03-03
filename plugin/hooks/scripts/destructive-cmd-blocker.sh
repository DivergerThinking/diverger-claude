#!/bin/bash
# PreToolUse blocker: Destructive or dangerous command detected — blocked for safety
INPUT=$(cat)
CHECK_VALUE=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
PATTERN='(git\s+push\s+--force|git\s+push\s+-f\b|git\s+reset\s+--hard|rm\s+-rf\s+/|git\s+clean\s+-fd|git\s+checkout\s+--\s+\.|curl\s+.*\|\s*(bash|sh|sudo)|wget\s+.*\|\s*(bash|sh|sudo))'
if echo "$CHECK_VALUE" | grep -qE "$PATTERN"; then
  jq -n --arg reason 'Destructive or dangerous command detected — blocked for safety' '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
fi
exit 0
