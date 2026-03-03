---
name: diverger-repair
description: Diagnose and repair .claude/ configuration issues
user-invocable: true
---

# diverger-repair

Use the MCP tools provided by the diverger-claude server to diagnose and repair configuration issues.

## Steps

1. Call the `repair_config` MCP tool with the current project root directory and `mode: "report-only"` first.
2. Present the diagnosis report:
   - List each issue with severity, confidence, and whether it's auto-repairable
   - Group by severity (critical → warning → info)
3. If there are auto-repairable issues with confidence >= 70:
   - Ask the user if they want to auto-repair them
   - If confirmed, call `repair_config` with `mode: "auto"`
   - Report which repairs succeeded and which failed
4. For issues with confidence 50-69:
   - Explain the issue and suggest manual steps
5. For info-level issues:
   - Mention them as suggestions (e.g., "consider running `diverger sync`")
6. After repairs, optionally run `check_config` to verify the configuration is now healthy.
