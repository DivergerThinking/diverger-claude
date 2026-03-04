---
description: Detailed reference for Git workflow and Conventional Commits with examples
---

# Git Workflow & Conventional Commits — Full Reference

## Why This Matters
A disciplined Git workflow enables reliable releases, meaningful changelogs, and painless
collaboration. Conventional Commits provide a structured format that can be parsed by
tooling for automatic versioning and changelog generation.

---

## Conventional Commits Format (v1.0.0)

\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

### Types
| Type | Purpose | SemVer Impact |
|------|---------|---------------|
| feat | New feature | MINOR |
| fix | Bug fix | PATCH |
| docs | Documentation only | None |
| style | Formatting, whitespace | None |
| refactor | Code restructuring, no behavior change | None |
| perf | Performance improvement | None |
| test | Adding or correcting tests | None |
| chore | Maintenance, deps, config | None |
| ci | CI/CD configuration | None |
| build | Build system changes | None |
| revert | Revert a previous commit | Varies |

### Breaking Changes
Two equivalent approaches:
- Footer: \`BREAKING CHANGE: description\`
- Prefix: \`feat(api)!: remove deprecated endpoint\`

Breaking changes trigger a MAJOR version bump.

### Examples
\`\`\`
feat(auth): add OAuth2 login with Google provider

Implements the OAuth2 authorization code flow for Google.
Includes token refresh and session persistence.

Closes #142

---

fix(parser): handle empty input without crashing

Previously, passing an empty string caused an uncaught TypeError.
Now returns an empty result object.

---

refactor!: rename UserService to AuthenticationService

BREAKING CHANGE: all imports of UserService must be updated to AuthenticationService.
\`\`\`

---

## Branch Discipline
- Keep commits atomic — one logical change per commit
- Write commit subjects in imperative mood: "add feature" not "added feature"
- Subject line max 72 characters; body wraps at 80
- Squash WIP commits before merging to main
- Never commit generated files, build artifacts, or OS-specific files (.DS_Store, Thumbs.db)
- Never force-push to shared branches (main, develop, release/*)

---

## Pre-Commit Checklist
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] No secrets or credentials in the diff
- [ ] Commit message follows Conventional Commits format
- [ ] Changes are scoped to one logical change
