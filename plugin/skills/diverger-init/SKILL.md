---
name: diverger-init
description: Detect technology stack and generate .claude/ configuration
user-invocable: true
---

# diverger-init

Use the MCP tools provided by the diverger-claude server to initialize the project configuration.

## Steps

1. Call the `detect_stack` MCP tool with the current project root directory.
2. Present the detected technologies to the user in a clear table format.
3. Ask the user to confirm proceeding with generation.
4. If confirmed, call the `generate_config` MCP tool with `pluginMode: true`.
5. Show a summary of the generated files and applied profiles.
6. If any issues arise, suggest running `/diverger-status` to validate.
