---
name: diverger-status
description: Check project stack and validate .claude/ configuration
user-invocable: true
---

# diverger-status

Use the MCP tools provided by the diverger-claude server to show project status.

## Steps

1. Call the `detect_stack` MCP tool with the current project root directory.
2. Call the `check_config` MCP tool with the same directory.
3. Present a combined status report:
   - Detected technologies (name, version, confidence)
   - Configuration validation result (valid/invalid)
   - Any issues found (severity, file, message)
4. If issues are found, suggest running `/diverger-sync` to fix them.
