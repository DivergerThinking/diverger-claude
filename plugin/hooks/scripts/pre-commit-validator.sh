#!/bin/bash
# PreToolUse blocker: Validate commit prerequisites before allowing git commit
# Blocks commits when plugin build is stale or TypeScript has errors

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit'; then
  exit 0
fi

ERRORS=""

# Check 1: Plugin version consistency (package.json must match plugin.json)
if [ -f "package.json" ] && [ -f "plugin/.claude-plugin/plugin.json" ]; then
  PKG_VERSION=$(jq -r '.version' package.json 2>/dev/null || echo "")
  PLUGIN_VERSION=$(jq -r '.version' plugin/.claude-plugin/plugin.json 2>/dev/null || echo "")
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
  jq -n --arg reason "Pre-commit validation failed: ${ERRORS}" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
fi

# All checks passed
exit 0
