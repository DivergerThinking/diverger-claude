---
name: diverger-init
description: Detect technology stack and generate .claude/ configuration
user-invocable: true
---

# diverger-init

Use the MCP tools provided by the diverger-claude server to initialize the project configuration.

## Pre-flight checks

Before starting, verify these conditions:
- You are in the root directory of the target project (look for package.json, go.mod, Cargo.toml, etc.)
- If a `.claude/` directory already exists, warn the user that it will be overwritten unless they use sync instead.

## Steps

1. Call the `detect_stack` MCP tool with the current project root directory.
2. Present the detected technologies to the user in a clear table format:
   - Technology name, version, confidence score, category
   - Highlight any low-confidence detections (<90%) with a warning.
3. Ask the user to confirm proceeding with generation.
4. If confirmed, call the `generate_config` MCP tool with `pluginMode: true`.
5. Show a summary of the generated files and applied profiles.
6. If any issues arise, suggest running `/diverger-status` to validate.

## Edge cases

- **`.claude/` already exists**: Ask user if they want to overwrite or use `/diverger-sync` instead.
- **No technologies detected**: Suggest checking if manifest files exist (package.json, go.mod, etc.) or if the working directory is correct.
- **Low confidence detections**: Explain that detections below 90% confidence may be inaccurate and ask user to confirm.

## Error recovery

- If `detect_stack` fails: Check that the MCP server is running (`/diverger-health`).
- If `generate_config` fails: Show the error, suggest running detection again, and check file permissions.

## Follow-up suggestions

After successful init, suggest:
1. Run `/diverger-quickstart` for a guided tour of the generated configuration.
2. Run `/diverger-doctor` to get a health score for the project.
3. Explore `.claude/rules/` to see the generated coding rules.
4. Try `/commands` to see all available skills for the detected stack.
