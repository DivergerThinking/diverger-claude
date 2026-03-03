#!/bin/bash
# PreToolUse blocker: Potential secret or API key detected — blocked before writing
INPUT=$(cat)
CHECK_VALUE=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
PATTERN='(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[0-9a-zA-Z]{48}|ghp_[0-9a-zA-Z]{36}|-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----|password\s*[:=]\s*["'\''][^"'\'']{4,}|secret\s*[:=]\s*["'\''][^"'\'']{4,}|api[_-]?key\s*[:=]\s*["'\''][^"'\'']{4,})'
if echo "$CHECK_VALUE" | grep -qE "$PATTERN"; then
  jq -n --arg reason 'Potential secret or API key detected — blocked before writing' '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
fi
exit 0
