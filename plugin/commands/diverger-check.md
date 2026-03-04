---
description: "Validate .claude/ configuration governance and detect issues"
---

# diverger-check

Use the MCP tools provided by the diverger-claude server to validate configuration.

## Steps

1. Call the `check_config` MCP tool with the current project root directory.
2. Present the validation result:
   - Overall validity (valid/invalid)
   - Issues found: severity (error/warning), file path, message
   - Governance violations (mandatory rules that are missing or modified)
3. If issues are found:
   - For missing files: suggest running `/diverger-sync` to regenerate.
   - For governance violations: explain what the rule enforces.
   - For warnings: note they are non-blocking but recommended to fix.
4. If no issues: confirm the configuration is healthy.
