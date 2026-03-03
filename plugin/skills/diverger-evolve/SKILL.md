---
name: diverger-evolve
description: Review project evolution and get proactive configuration recommendations
user-invocable: true
---

# diverger-evolve

Use the MCP tools provided by the diverger-claude server to analyze project evolution.

## Steps

1. Call the `detect_stack` MCP tool with the current project root directory.
2. Call the `get_memory` MCP tool with `section: "all"` to review evolution history.
3. Compare detected stack against the memory's evolution log.
4. Present findings:
   - New technologies or frameworks detected since last sync
   - Removed dependencies that may have stale profiles
   - Architecture changes (Docker, CI/CD, monorepo additions)
   - Memory health: consolidation status, pattern counts
5. For each finding, explain:
   - What changed and when
   - Which profile(s) would be affected
   - Recommended action (sync, update, review)
6. If the project is up to date, confirm everything is aligned.
