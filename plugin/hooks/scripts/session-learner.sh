#!/bin/bash
# SessionEnd hook: Signal pending errors for next session processing
# Errors will be processed by onSessionStart() in the next session

set -euo pipefail

SESSION_LOG=".claude/session-errors.local.json"

# Skip if no session errors logged
if [ ! -f "$SESSION_LOG" ]; then
  exit 0
fi

# Clean up empty logs
ERROR_COUNT=$(jq 'length' "$SESSION_LOG" 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" = "0" ]; then
  rm -f "$SESSION_LOG"
fi

# Errors will be processed by onSessionStart() in next session
