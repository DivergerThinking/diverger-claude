#!/bin/bash
# UserPromptSubmit hook: Check for untriaged GitHub issues (once per session)
#
# WORKAROUND: SessionStart hooks are broken on Windows (multiple known bugs):
#   - https://github.com/anthropics/claude-code/issues/9542  (infinite hang)
#   - https://github.com/anthropics/claude-code/issues/10373 (output not injected)
#   - https://github.com/anthropics/claude-code/issues/23038 (hang in trusted dirs)
#
# This hook runs on UserPromptSubmit instead, using a session-based lock file
# to ensure it only executes once per session. When SessionStart is fixed on
# Windows, migrate this back to SessionStart and delete the lock file logic.
#
# Uses Node.js instead of jq for cross-platform compatibility (Windows).

# Extract session_id from stdin JSON to create a per-session lock
INPUT=$(cat)
SESSION_ID=$(node -e "try{console.log(JSON.parse(process.argv[1]).session_id||'')}catch{console.log('')}" -- "$INPUT")

if [ -z "$SESSION_ID" ]; then
  exit 0
fi

# One-shot lock: skip if already ran for this session
LOCK_DIR="/tmp/claude-triage-locks"
mkdir -p "$LOCK_DIR" 2>/dev/null
LOCK_FILE="$LOCK_DIR/$SESSION_ID.lock"

if [ -f "$LOCK_FILE" ]; then
  exit 0
fi
touch "$LOCK_FILE"

# Clean up stale lock files older than 24h
find "$LOCK_DIR" -name "*.lock" -mmin +1440 -delete 2>/dev/null

# Check if gh CLI is available and authenticated
if ! command -v gh &>/dev/null; then
  exit 0
fi

if ! gh auth status &>/dev/null 2>&1; then
  exit 0
fi

# Check if we're in a git repo with a GitHub remote
if ! gh repo view --json name &>/dev/null 2>&1; then
  exit 0
fi

# Get open issues without 'planned' or 'already-implemented' labels
ISSUES=$(gh issue list --state open --json number,title,labels --limit 20 2>/dev/null || echo "[]")

# Filter untriaged issues using Node.js
UNTRIAGED=$(node -e "
const issues = JSON.parse(process.argv[1] || '[]');
const triaged = new Set(['planned', 'already-implemented']);
const pending = issues.filter(i => {
  const labels = (i.labels || []).map(l => l.name);
  return !labels.some(l => triaged.has(l));
});
if (pending.length === 0) process.exit(0);
const lines = pending.map(i => '  #' + i.number + ': ' + i.title);
console.log('[diverger-triage] ' + pending.length + ' issue(s) pending triage:');
lines.forEach(l => console.log(l));
console.log('Run /diverger-triage to analyze and respond intelligently.');
" -- "$ISSUES")

if [ -n "$UNTRIAGED" ]; then
  echo "$UNTRIAGED"
fi
