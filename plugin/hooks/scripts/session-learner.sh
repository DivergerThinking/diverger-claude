#!/bin/bash
# SessionEnd hook: Signal pending errors for next session processing
# Errors will be processed by onSessionStart() in the next session
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

set -euo pipefail

SESSION_LOG=".claude/session-errors.local.json"

# Skip if no session errors logged
if [ ! -f "$SESSION_LOG" ]; then
  exit 0
fi

# Clean up empty logs using Node.js
ERROR_COUNT=$(node -e "try{const d=JSON.parse(require('fs').readFileSync('$SESSION_LOG','utf8'));console.log(d.length)}catch{console.log('0')}")
if [ "$ERROR_COUNT" = "0" ]; then
  rm -f "$SESSION_LOG"
fi

# Errors will be processed by onSessionStart() in next session
