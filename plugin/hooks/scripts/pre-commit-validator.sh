#!/bin/bash
# PreToolUse blocker: Validate commit prerequisites before allowing git commit
# Blocks commits when plugin build is stale or TypeScript has errors
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=j[\"tool_input\"][\"command\"];console.log(v||'')}catch{console.log('')}})")

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit'; then
  exit 0
fi

ERRORS=""

# Check 1: Plugin version consistency (package.json must match plugin.json)
if [ -f "package.json" ] && [ -f "plugin/.claude-plugin/plugin.json" ]; then
  PKG_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version||'')}catch{console.log('')}")
  PLUGIN_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('plugin/.claude-plugin/plugin.json','utf8')).version||'')}catch{console.log('')}")
  if [ -n "$PKG_VERSION" ] && [ -n "$PLUGIN_VERSION" ] && [ "$PKG_VERSION" != "$PLUGIN_VERSION" ]; then
    ERRORS="${ERRORS}Plugin build stale: package.json=${PKG_VERSION} but plugin.json=${PLUGIN_VERSION}. Run npm run build:plugin first. "
  fi
fi

# Check 2: TypeScript compilation (only if tsconfig.json exists)
if [ -f "tsconfig.json" ] && command -v npx >/dev/null 2>&1; then
  TSC_OUTPUT=$(npx tsc --noEmit --pretty false 2>&1 || true)
  TSC_EXIT=$?
  if echo "$TSC_OUTPUT" | grep -qE 'error TS[0-9]+'; then
    TSC_COUNT=$(echo "$TSC_OUTPUT" | grep -cE 'error TS[0-9]+' || echo "0")
    ERRORS="${ERRORS}TypeScript compilation: ${TSC_COUNT} error(s) detected. Fix type errors before committing. "
  fi
fi

# If errors found, deny the commit
if [ -n "$ERRORS" ]; then
  node -e "console.log(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:'Pre-commit validation failed: '+process.argv[1]}}))" -- "$ERRORS"
  exit 0
fi

# All checks passed
exit 0
