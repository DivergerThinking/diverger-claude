---
name: diverger-sync
description: Sync .claude/ configuration with latest detected stack
user-invocable: true
---

# diverger-sync

Use the MCP tools provided by the diverger-claude server to sync configuration.

## Steps

1. Call the `sync_config` MCP tool with the current project root directory.
2. Report the results:
   - Files updated automatically
   - Conflicts that were auto-resolved
   - Files skipped (no changes)
3. Optionally call `check_config` to verify the configuration is healthy after sync.
4. Show summary counts (updated, conflicts, skipped).
