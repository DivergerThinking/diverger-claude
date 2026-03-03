---
name: diverger-health
description: Run a full health check on the diverger-claude plugin
user-invocable: true
---

# diverger-health

Use the MCP tools provided by the diverger-claude server to diagnose the plugin's health.

## Steps

1. Call the `check_plugin_health` MCP tool with the plugin directory and current CLI version.
2. Present the health report in a clear table format:
   - Overall status (healthy/degraded/unhealthy)
   - Individual check results with status indicators
   - Auto-fixable issues highlighted
3. If there are auto-fixable issues:
   - Suggest running `diverger plugin install` to reinstall the plugin.
4. If version inconsistency is detected:
   - Suggest running `diverger update` to update to the latest version.
5. If everything is healthy:
   - Confirm the plugin is fully operational.
