#!/bin/bash
# PreToolUse blocker: Destructive or dangerous command detected — blocked for safety
INPUT=$(cat)
CHECK_VALUE=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=j["tool_input"]["command"];console.log(v||'')}catch{console.log('')}})")
PATTERN='(git\s+push\s+--force|git\s+push\s+-f\b|git\s+reset\s+--hard|rm\s+-rf\s+/|git\s+clean\s+-fd|git\s+checkout\s+--\s+\.|curl\s+.*\|\s*(bash|sh|sudo)|wget\s+.*\|\s*(bash|sh|sudo))'
if echo "$CHECK_VALUE" | grep -qE "$PATTERN"; then
  node -e 'console.log(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"Destructive or dangerous command detected — blocked for safety"}}))'
  exit 0
fi
exit 0
