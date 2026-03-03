import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const githubActionsProfile: Profile = {
  id: 'infra/github-actions',
  name: 'GitHub Actions',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['github-actions'],
  contributions: {
    claudeMd: [
      {
        heading: 'GitHub Actions Conventions',
        order: 40,
        content: `## GitHub Actions Conventions

Workflow automation. Least-privilege permissions, pinned action versions, matrix builds.

**Detailed rules:** see \`.claude/rules/github-actions/\` directory.

**Key rules:**
- Pin actions to full SHA, not tags — prevent supply chain attacks
- Set \`permissions:\` at workflow level with minimum required scopes
- Use matrix strategy for multi-version/multi-OS testing
- Cache dependencies (\`actions/cache\`) to speed up builds`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(gh:*)',
          'Bash(gh run:*)',
          'Bash(gh workflow:*)',
          'Bash(gh pr:*)',
          'Bash(gh release:*)',
          'Bash(act:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/github-actions-conventions.md',
        governance: 'mandatory',
        paths: ['.github/workflows/**/*.yml', '.github/workflows/**/*.yaml', '.github/actions/**/*'],
        description: 'GitHub Actions workflow structure, triggers, caching, matrix, reusable workflows, and artifacts — mandatory conventions',
        content: `# GitHub Actions Conventions

## Workflow Structure
- Name workflows descriptively: \`ci.yml\`, \`deploy-production.yml\`, \`release.yml\`
- Separate CI (lint/test/build) from CD (deploy) — single responsibility per workflow
- Use \`name:\` at workflow, job, and step levels for clear UI visibility
- Use \`workflow_dispatch\` with typed \`inputs\` for manual triggers

## Triggers
- Use path filters to run only when relevant files change
- Prefer \`pull_request\` over \`pull_request_target\` (security risk with base branch write permissions)
- Use \`push\` for main/release branches, \`pull_request\` for PRs
- Use \`on.schedule\` for periodic maintenance; \`workflow_run\` for chaining

## Caching
- Cache dependencies using lock file hashes: \`hashFiles('**/package-lock.json')\`
- Leverage built-in caching in setup actions with \`cache:\` input
- Set appropriate \`retention-days\` on artifacts (default 90 is excessive for CI)

## Concurrency
- Use \`concurrency\` groups with \`cancel-in-progress: true\` for CI workflows
- Disable \`cancel-in-progress\` for deployment workflows

## Matrix Builds
- Use \`strategy.matrix\` for multi-version/multi-OS testing
- Set \`fail-fast: false\` in test matrices to see all failures

## Reusable Workflows
- Define with \`workflow_call\` trigger; parameterize with \`inputs\` and \`secrets\`
- Use composite actions for reusable step sequences

## Job Outputs
- Use \`$GITHUB_OUTPUT\`, \`$GITHUB_ENV\`, \`$GITHUB_STEP_SUMMARY\` (not deprecated commands)
- Use job-level \`outputs:\` to pass data between jobs via \`needs.<job>.outputs.<key>\`

## Secrets
- Store in GitHub Secrets — never hardcode in workflow files
- Prefer \`GITHUB_TOKEN\` over Personal Access Tokens
- Never echo or log secret values
`,
      },
      {
        path: 'infra/github-actions-security.md',
        governance: 'mandatory',
        paths: ['.github/workflows/**/*.yml', '.github/workflows/**/*.yaml', '.github/actions/**/*'],
        description: 'GitHub Actions security hardening — supply chain, permissions, script injection, environment protection, OIDC',
        content: `# GitHub Actions Security Hardening

## Supply Chain Security
- Pin ALL third-party actions to full 40-character commit SHA — never use mutable tags (\`@v4\`, \`@main\`)
- Review action source code before using — compromised actions can exfiltrate secrets
- Use Dependabot or Renovate to keep pinned SHAs updated
- Prefer official GitHub actions (\`actions/*\`) and Marketplace-verified creators
- Audit workflow files periodically for modified action references

## Permissions (Least Privilege)
- Set \`permissions: {}\` at workflow level (deny all) — grant per job
- CI (lint/test): \`contents: read\`
- PR automation: \`contents: read, pull-requests: write\`
- Package publish: \`contents: read, packages: write\`
- Release: \`contents: write\`
- OIDC deploy: \`contents: read, id-token: write\`
- Never use \`permissions: write-all\`

## Script Injection Prevention
- NEVER use \`\${{ }}\` interpolation of untrusted input directly in \`run:\` blocks
- Untrusted contexts: \`github.event.issue.title\`, \`.body\`, \`pull_request.title\`, \`.body\`, \`comment.body\`, \`github.head_ref\`
- Always route untrusted input through environment variables first

## Environment Protection
- Require manual approval for production deployments
- Restrict deployment branches to \`main\` and \`release/*\`
- Use environment-specific secrets (staging vs production)
- Set deployment concurrency to prevent parallel deploys

## OIDC Authentication
- Use OpenID Connect instead of static cloud credentials
- Configure trust policies for specific repos and branches
- Use official OIDC actions: \`aws-actions/configure-aws-credentials\`, \`azure/login\`, \`google-github-actions/auth\`

## Self-Hosted Runners
- Never use self-hosted runners for public repositories
- Run as non-root, use ephemeral runners, isolate with containers or VMs
- Restrict access to specific repositories via runner groups
`,
      },
      {
        path: 'infra/github-actions-workflow-patterns.md',
        governance: 'recommended',
        paths: ['.github/workflows/**/*.yml', '.github/workflows/**/*.yaml', '.github/actions/**/*'],
        description: 'GitHub Actions recommended workflow patterns and templates for common CI/CD scenarios',
        content: `# GitHub Actions Workflow Patterns

## CI Workflow
- Trigger on \`push\` to main and \`pull_request\` to main, with path filters
- Set \`permissions: {}\` at workflow level, \`contents: read\` per job
- Add \`concurrency\` group with \`cancel-in-progress: true\`
- Separate lint and test into distinct jobs
- Use matrix strategy with \`fail-fast: false\` for multi-version testing
- Pin all actions to full commit SHA

## Release Workflow
- Trigger on tag push (\`tags: ['v*']\`)
- Build job: checkout, build, upload artifact with \`retention-days\`
- Publish job: \`needs: build\`, download artifact, publish
- Use \`environment: production\` with protection rules
- Grant \`contents: write, packages: write\` only on publish job

## Reusable Workflow
- Define with \`workflow_call\` trigger
- Declare typed \`inputs\` with defaults and \`secrets\` (required or optional)
- Keep permissions minimal (\`contents: read\`)
- Call from other workflows: \`uses: ./.github/workflows/reusable-test.yml\`

## Deployment with OIDC
- Grant \`id-token: write\` permission for OIDC
- Use \`aws-actions/configure-aws-credentials\` (or equivalent) with \`role-to-assume\`
- Use \`environment: production\` with required reviewers
- No static cloud credentials stored as secrets

## Conditional Job Execution
- \`if: github.event_name == 'push'\` — only on push, not PRs
- \`if: contains(github.event.pull_request.labels.*.name, 'deploy')\` — label-based
- \`if: github.ref == 'refs/heads/main'\` — main branch only
- Use \`needs:\` for job dependencies
- Use \`if: always()\` on cleanup jobs to ensure they run regardless of failures
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## GitHub Actions Workflow Review Checklist

**Available skill:** \`github-actions-workflow-creator\` — use when creating new workflows.

- Verify ALL third-party actions are pinned to full 40-character commit SHA — flag any using mutable tags (@v4, @main, @latest)
- Check that \`permissions\` are set at workflow level (preferably \`permissions: {}\`) and scoped per job to minimum required
- Verify \`concurrency\` groups are configured to cancel redundant runs on the same branch
- Check for script injection: flag any \`\${{ github.event.* }}\` interpolation directly in \`run:\` blocks — must use env variables instead
- Verify caching is configured for package manager dependencies with lock file hash keys
- Check that path filters are used on triggers to avoid unnecessary workflow runs
- Verify artifacts have appropriate \`retention-days\` set — default 90 days is excessive for CI
- Check for deprecated workflow commands: \`set-output\`, \`set-env\`, \`add-path\` — must use \`$GITHUB_OUTPUT\`, \`$GITHUB_ENV\`, \`$GITHUB_PATH\`
- Verify secrets are not logged or exposed in step outputs — check for \`echo \${{ secrets.* }}\` patterns
- Check that deployment workflows use environment protection rules with required reviewers
- Verify \`fail-fast: false\` is set on test matrix strategies to see all failures
- Check for proper job dependency chains using \`needs:\` — ensure deploy jobs depend on test/build jobs`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## GitHub Actions Security Audit

**Available skill:** \`github-actions-workflow-creator\` — use when creating secure workflows from scratch.

- Verify ALL third-party actions are pinned to full commit SHA — flag tags and branch references as CRITICAL
- Check for script injection vulnerabilities: \`\${{ github.event.issue.title }}\`, \`\${{ github.event.pull_request.body }}\`, \`\${{ github.event.comment.body }}\`, \`\${{ github.head_ref }}\` in \`run:\` blocks
- Verify workflow-level \`permissions\` is set to \`{}\` or minimal read — flag \`permissions: write-all\` as CRITICAL
- Check for \`pull_request_target\` trigger combined with \`actions/checkout\` of PR code — this is a privilege escalation vector
- Verify secrets are not exposed: no \`echo\` of secrets, no secrets passed to untrusted actions, no secrets in artifact uploads
- Check for OIDC usage instead of static cloud credentials — flag long-lived access keys stored as secrets
- Verify environment protection rules on deployment workflows — production must require manual approval
- Check self-hosted runner usage — flag on public repositories as CRITICAL
- Verify no workflow uses \`actions/github-script\` with untrusted input interpolated into the script body
- Check that \`GITHUB_TOKEN\` permissions are not elevated beyond what the job needs
- Verify Dependabot or Renovate is configured to update pinned action SHAs
- Audit for exfiltration patterns: secrets sent to external URLs via curl/wget in workflow steps`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## GitHub Actions Documentation Guidelines

**Available skill:** \`github-actions-workflow-creator\` — use when scaffolding documented workflows.

- Document every workflow file with a top-level comment block explaining purpose, triggers, and prerequisites
- Include inline comments for non-obvious steps: complex expressions, conditional logic, environment-specific behavior
- Document required secrets and environment variables in the repository README or a dedicated WORKFLOWS.md
- Document environment protection rules and required reviewers for deployment workflows
- Include architecture diagrams (Mermaid) showing workflow dependencies and deployment pipelines
- Document reusable workflow interfaces: required inputs, optional inputs with defaults, required secrets
- Document matrix strategy rationale: why specific versions/platforms are included
- Maintain a changelog or migration guide when updating workflow files that affect other teams`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## GitHub Actions Migration Guidance

**Available skill:** \`github-actions-workflow-creator\` — use when creating replacement workflows during migration.

- When migrating from Jenkins/CircleCI/Travis CI: map pipeline stages to GitHub Actions jobs, use official setup actions instead of custom Docker images
- When upgrading action versions: always pin to the new full commit SHA, not just the new tag — check the action's changelog for breaking changes
- When migrating from \`set-output\` (deprecated): replace \`echo "::set-output name=key::value"\` with \`echo "key=value" >> $GITHUB_OUTPUT\`
- When migrating from \`set-env\` (deprecated): replace \`echo "::set-env name=VAR::value"\` with \`echo "VAR=value" >> $GITHUB_ENV\`
- When migrating to reusable workflows: identify shared CI/CD logic across repos, extract into \`workflow_call\` workflows, parameterize with inputs and secrets
- When migrating to OIDC authentication: configure identity provider trust in cloud (AWS IAM, Azure AD, GCP Workload Identity), replace static credentials with \`id-token: write\` permission and official auth actions
- When migrating from Docker-based actions to JavaScript/composite actions: review performance implications — JavaScript actions start faster
- When upgrading runner images (e.g., ubuntu-20.04 to ubuntu-24.04): check for removed pre-installed tools, updated default versions (Node, Python), and filesystem path changes`,
      },
    ],
    skills: [
      {
        name: 'github-actions-workflow-creator',
        description: 'Create well-structured, secure GitHub Actions workflows following best practices',
        content: `# GitHub Actions Workflow Creator

## Purpose
Create production-ready GitHub Actions workflow files following security hardening best practices, proper permissions, caching, and CI/CD patterns.

## Process

### 1. Determine Workflow Type
Identify the workflow purpose:
- **CI**: lint, test, build on push/PR
- **CD**: deploy to staging/production on merge or tag
- **Release**: build, package, publish on tag push
- **Maintenance**: dependency audits, stale issue cleanup, scheduled tasks
- **Reusable**: shared logic consumed by other workflows via \`workflow_call\`

### 2. Configure Triggers
\`\`\`yaml
# CI workflow
on:
  push:
    branches: [main]
    paths: ['src/**', 'package.json', 'package-lock.json']
  pull_request:
    branches: [main]
    paths: ['src/**', 'package.json', 'package-lock.json']
\`\`\`

### 3. Set Permissions (Deny by Default)
\`\`\`yaml
permissions: {}

jobs:
  test:
    permissions:
      contents: read
\`\`\`

### 4. Configure Concurrency
\`\`\`yaml
concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true
\`\`\`

### 5. Pin Actions to Full SHA
\`\`\`yaml
steps:
  - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
  - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v4.0.2
\`\`\`

### 6. Configure Caching
\`\`\`yaml
- uses: actions/setup-node@<sha>
  with:
    node-version-file: '.node-version'
    cache: 'npm'
- run: npm ci
\`\`\`

### 7. Add Matrix Strategy (if needed)
\`\`\`yaml
strategy:
  fail-fast: false
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, macos-latest]
\`\`\`

### 8. Handle Secrets Safely
\`\`\`yaml
# Route untrusted input through env vars
- name: Process input
  env:
    USER_INPUT: \${{ github.event.issue.title }}
  run: echo "$USER_INPUT"
\`\`\`

## Security Checklist
- [ ] All third-party actions pinned to full commit SHA
- [ ] Workflow-level \`permissions: {}\` with per-job grants
- [ ] Concurrency groups configured
- [ ] No \`\${{ }}\` interpolation of untrusted input in \`run:\` blocks
- [ ] Secrets never echoed or logged
- [ ] Environment protection rules on deployment jobs
- [ ] Path filters on triggers to avoid unnecessary runs
- [ ] Artifacts have \`retention-days\` set
- [ ] No deprecated workflow commands (\`set-output\`, \`set-env\`)
- [ ] OIDC used for cloud authentication where possible

## Quality Checklist
- [ ] Workflow, job, and step names are descriptive
- [ ] Caching configured for dependencies
- [ ] Matrix strategy for multi-version testing (if applicable)
- [ ] Job dependencies (\`needs:\`) correctly ordered
- [ ] \`fail-fast: false\` on test matrices
- [ ] Deployment workflows use environments with protection rules
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.github/workflows/.*\\.ya?ml$" && grep -nE "\\$\\{\\{\\s*github\\.event\\.(issue|pull_request|comment|review|discussion)\\.(title|body)\\s*\\}\\}" "$FILE_PATH" | head -1 | grep -q "." && { echo "Potential script injection — untrusted input interpolated directly in workflow file — use env variable instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for script injection in GitHub Actions workflows',
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.github/workflows/.*\\.ya?ml$" && grep -nE "uses:\\s+[^@]+@v[0-9]" "$FILE_PATH" | head -1 | grep -q "." && { echo "Warning: action pinned to mutable tag — pin to full commit SHA for supply chain security" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for mutable action tags in GitHub Actions workflows',
          },
        ],
      },
    ],
  },
};
