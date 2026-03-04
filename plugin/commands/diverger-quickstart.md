---
description: Guided onboarding after diverger init — explore your configuration in 5 minutes
---

# Diverger Quickstart — Explore Your Configuration in 5 Minutes

You just ran \`diverger init\` (or the \`generate_config\` MCP tool). Follow these steps
to understand and get the most out of your new \`.claude/\` configuration.

---

## Step 1: Verify your configuration
Confirm that \`.claude/\` was generated with rules, agents, skills, and hooks:
\`\`\`
ls .claude/rules/ .claude/agents/ .claude/skills/ .claude/hooks/
\`\`\`
You should see files matching your detected stack (e.g., \`typescript.md\`, \`react.md\`).

## Step 2: Run /diverger-status
See your detected stack, applied profiles, and configuration summary:
\`\`\`
/diverger-status
\`\`\`

## Step 3: Run /diverger-doctor
Get your initial project health score and identify any configuration issues:
\`\`\`
/diverger-doctor
\`\`\`

## Step 4: Explore your rules
Browse \`.claude/rules/\` to see what guidelines were generated for your stack.
Each rule file covers a specific concern — architecture, security, git workflow,
plus language- and framework-specific conventions.

## Step 5: Discover available commands
List all slash commands available for your detected technologies:
\`\`\`
/commands
\`\`\`
Stack-adapted skills like style guides, testing helpers, and review tools will appear.

## Step 6: Try a code review
Use the \`code-reviewer\` agent on a recent file to see a stack-adapted review:
\`\`\`
@code-reviewer Review src/path/to/recent-file.ts
\`\`\`
The reviewer applies your detected stack's conventions automatically.

## Step 7: Next steps
- \`/diverger-audit\` — Full audit of your project configuration and code quality
- \`/diverger-test-suite\` — Identify test coverage gaps and generate missing tests
- \`/diverger-check\` — Validate configuration governance and detect drift
- Edit \`.claude/rules/\` files to customize rules for your team's preferences
