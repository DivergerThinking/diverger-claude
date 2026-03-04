#!/bin/bash
# SessionStart hook: Check for untriaged GitHub issues
# Outputs a message that Claude sees as context at session start
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

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
