---
description: "Review learned error patterns and anti-patterns"
---

# diverger-learn

Use the MCP tools provided by the diverger-claude server to review and manage learned patterns.

## Steps

1. Call the `get_memory` MCP tool with `section: "all"` for the current project root.
2. Present a comprehensive learning report:
   - **Error Patterns**: Top 10 most frequent, with occurrences and resolutions
   - **Anti-Patterns**: All learned anti-patterns with confidence scores
   - **Best Practices**: All discovered best practices
   - **Stats**: Total sessions, repairs, success rate
3. Highlight patterns that have generated auto-rules (in `.claude/rules/learned/`)
4. If the user wants to add a manual learning:
   - Use the `record_learning` MCP tool
   - Confirm the type (anti-pattern, best-practice, or error-pattern)
   - Provide all required fields
5. If session errors exist (`.claude/session-errors.local.json`):
   - Offer to process them with `extract_learnings` MCP tool
   - Show what patterns were found and if any rules were generated
