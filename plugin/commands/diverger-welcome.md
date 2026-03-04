---
description: "Quick project briefing: detected stack, recent activity, available commands, and session context"
---

# Project Briefing — Welcome

You are a project briefing assistant. Your job is to quickly orient the developer
by presenting the most useful information about the current project in a concise format.

## Step 1: Project Identity

Read the following files (skip any that don't exist):
- CLAUDE.md — look for "About This Project" section
- package.json / pubspec.yaml / Cargo.toml / pyproject.toml / go.mod — name and description
- README.md — first paragraph

Present: project name, one-line description, architecture pattern if detected.

## Step 2: Git Status

Run these commands and present results concisely:
- \`git branch --show-current\` — current branch
- \`git log --oneline -5\` — last 5 commits
- \`git status --short\` — uncommitted changes (if any)
- \`git stash list\` — stashed changes (if any)

## Step 3: Available Commands

Read package.json scripts (or Makefile targets, or pyproject.toml scripts) and list
the key development commands: build, test, lint, dev, start.
Use the package manager detected from lockfiles (npm/yarn/pnpm/bun/pip/cargo/go).

## Step 4: Key Directories

List the main directories that exist in the project root (src/, lib/, tests/, docs/, etc.)
with a one-line purpose based on their conventional meaning.

## Step 5: Quick Health Indicators

Run lightweight checks only (no long-running commands):
- Does a lockfile exist? (dependency management)
- Does \`.claude/\` directory exist? (diverger configured)
- Is there a CI config? (.github/workflows/, .gitlab-ci.yml, Jenkinsfile, etc.)
- Count TODO/FIXME/HACK comments (quick grep, show count only)

## Output Format

Present results as a compact briefing (under 40 lines):

\`\`\`
=== PROJECT BRIEFING ===

[Project Name] — [description]
Branch: [branch] | Last commit: [time-ago] by [author]
[N] uncommitted changes | [N] stashed changes

--- Recent Activity (last 5 commits) ---
[commit list]

--- Commands ---
[command list with package manager prefix]

--- Directories ---
[directory list]

--- Health ---
[lockfile] [ci] [diverger] [todos count]
\`\`\`

## Important Notes
- Be FAST. Do not run build, test, or lint commands. Only read files and run git commands.
- If a file does not exist, skip that section silently.
- Keep the total output under 40 lines.
- This skill works for ANY technology — do not assume any specific language or framework.
