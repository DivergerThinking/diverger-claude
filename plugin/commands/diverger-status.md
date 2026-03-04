---
description: "Check project stack and validate .claude/ configuration"
---

# diverger-status

Use the MCP tools provided by the diverger-claude server to show project status.

## Prerequisites

- The project must have been initialized with `/diverger-init` (a `.claude/` directory must exist).
- If no `.claude/` directory exists, suggest running `/diverger-init` first.

## Steps

1. Call the `detect_stack` MCP tool with the current project root directory.
2. Call the `check_config` MCP tool with the same directory.
3. Present a combined status report:
   - **Detected technologies**: name, version, confidence, category
   - **Configuration health**: valid/invalid, number of files, last modified
   - **Issues found**: severity (error/warning), file path, message
   - **Stack drift**: technologies detected now vs. what was configured

## Stack drift detection

Compare the currently detected technologies with what the configuration was generated for:
- **New technologies**: Detected now but not in config → suggest `/diverger-sync`
- **Removed technologies**: In config but no longer detected → may need cleanup
- **Version changes**: Major version changes that may require config update

## Context-sensitive suggestions

Based on the status report, provide targeted suggestions:
- If issues are found → suggest `/diverger-sync` to fix configuration drift
- If stack has changed → suggest `/diverger-sync` to update profiles
- If config is healthy → confirm everything is up to date
- If health is degraded → suggest `/diverger-doctor` for a detailed health analysis
