#!/bin/bash
# PostToolUse hook: Capture tool errors to session error log
# Reads from stdin (Claude Code hook protocol) and appends failures to .claude/session-errors.local.json
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Check if the tool execution failed — extract tool_name and error using Node.js
TOOL_NAME=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_name||'')}catch{console.log('')}})" || true)
ERROR=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.error||'')}catch{console.log('')}})" || true)

if [ -z "$ERROR" ]; then
  exit 0
fi

# Append error to session log using Node.js
SESSION_LOG=".claude/session-errors.local.json"
node -e "
const fs = require('fs');
const log = '$SESSION_LOG';
const entry = { message: process.argv[1], tool: process.argv[2], timestamp: new Date().toISOString() };
let entries = [];
try { entries = JSON.parse(fs.readFileSync(log, 'utf8')); } catch {}
entries.push(entry);
fs.writeFileSync(log, JSON.stringify(entries, null, 2));
" -- "$ERROR" "$TOOL_NAME"
