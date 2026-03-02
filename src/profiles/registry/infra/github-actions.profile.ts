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
        order: 4010,
        content: `## GitHub Actions Conventions

### Workflow Structure & Organization
- Place all workflows in \`.github/workflows/\` with descriptive kebab-case file names: \`ci.yml\`, \`deploy-production.yml\`, \`release.yml\`
- Separate CI (lint, test, build) from CD (deploy) workflows — each workflow has a single responsibility
- Keep individual jobs focused on one concern: one job for linting, one for testing, one for building
- Use \`name:\` at workflow, job, and step levels for clear visibility in the GitHub Actions UI
- Use \`workflow_dispatch\` with \`inputs\` for manual triggers that need parameters (environment, version, dry-run flag)

### Triggers & Filtering
- Use path filters to run workflows only when relevant files change: \`paths: ['src/**', 'package.json']\`
- Use \`paths-ignore\` to skip runs for documentation-only changes: \`paths-ignore: ['docs/**', '*.md']\`
- Prefer \`pull_request\` over \`pull_request_target\` — the latter runs in the base branch context with write tokens and is a security risk
- Use \`push\` trigger for main/release branches, \`pull_request\` for feature branches
- Use \`on.schedule\` with cron syntax for periodic jobs (dependency audits, nightly builds)

### Caching & Performance
- Cache package manager dependencies with \`actions/cache\` or built-in caching in \`actions/setup-node\`, \`actions/setup-python\`, etc.
- Use lock file hashes in cache keys: \`hashFiles('**/package-lock.json')\` to invalidate on dependency changes
- Use \`restore-keys\` for partial cache fallback when exact match misses
- Cache build artifacts between jobs with \`actions/upload-artifact\` and \`actions/download-artifact\`
- Use \`concurrency\` groups to cancel redundant workflow runs on the same branch: \`concurrency: { group: \${{ github.workflow }}-\${{ github.ref }}, cancel-in-progress: true }\`
- Leverage BuildKit cache mounts for Docker builds in CI

### Matrix Builds
- Use \`strategy.matrix\` to test across multiple versions (Node 18/20/22, Python 3.10/3.11/3.12) and operating systems
- Use \`include\`/\`exclude\` to customize specific matrix combinations
- Set \`fail-fast: false\` to see all matrix failures, not just the first one
- Use matrix values in step conditions and configurations for environment-specific behavior

### Reusable Workflows & Composite Actions
- Define reusable workflows with \`workflow_call\` trigger for shared CI/CD logic across repositories
- Use \`inputs\` and \`secrets\` parameters for flexibility in reusable workflows
- Use composite actions for reusable step sequences — place in \`.github/actions/<name>/action.yml\`
- Version reusable workflows and actions with tags for stability across consuming repositories
- Place organization-wide workflows in a \`.github\` repository for automatic inheritance

### Artifacts & Outputs
- Use \`actions/upload-artifact\` to share build outputs, test results, and coverage reports between jobs
- Set appropriate artifact retention with \`retention-days\` — default 90 days may be excessive for CI artifacts
- Use job outputs (\`outputs:\`) for passing small data (version strings, flags) between jobs in the same workflow
- Use \`$GITHUB_OUTPUT\` (not deprecated \`set-output\`) for setting step outputs: \`echo "key=value" >> $GITHUB_OUTPUT\`
- Use \`$GITHUB_ENV\` for setting environment variables for subsequent steps: \`echo "VAR=value" >> $GITHUB_ENV\`

### Secrets & Environment Variables
- Store all sensitive values (tokens, keys, passwords) in GitHub Secrets — never hardcode in workflow files
- Use environment-level secrets for deployment credentials scoped to specific environments (staging, production)
- Use \`vars\` context (\`\${{ vars.MY_VAR }}\`) for non-sensitive configuration that varies between environments
- Use \`GITHUB_TOKEN\` (automatically provided) for GitHub API operations — avoid creating Personal Access Tokens when possible
- Mask sensitive runtime values with \`::add-mask::VALUE\` to prevent accidental exposure in logs`,
      },
      {
        heading: 'GitHub Actions Security',
        order: 4011,
        content: `## GitHub Actions Security

### Supply Chain Hardening
- Pin ALL third-party actions to full commit SHA — never use mutable tags (\`@v4\`, \`@main\`, \`@latest\`)
  - Correct: \`uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11\`
  - Wrong: \`uses: actions/checkout@v4\`
- Review action source code before adding to workflows — even popular actions have been compromised (tj-actions/changed-files, March 2025)
- Prefer official GitHub actions (\`actions/*\`) and verified creators from the Marketplace
- Use Dependabot or Renovate to keep action SHAs up to date with security patches
- Consider using \`actions/dependency-review-action\` on pull requests to catch vulnerable dependencies

### Permissions (Least Privilege)
- Set \`permissions: {}\` at workflow level as default (deny all), then grant specific permissions per job
- Use \`permissions: read-all\` only when you explicitly need read access to everything — prefer granular grants
- Never use \`permissions: write-all\` — grant only the specific write permissions each job requires
- Common minimal permission sets:
  - CI (test/lint): \`contents: read\`
  - PR comments/checks: \`contents: read, pull-requests: write, checks: write\`
  - Package publish: \`contents: read, packages: write\`
  - GitHub Pages deploy: \`contents: read, pages: write, id-token: write\`
  - Release creation: \`contents: write\`
- Use \`id-token: write\` only for OIDC-based cloud authentication (AWS, Azure, GCP)

### Script Injection Prevention
- NEVER interpolate untrusted input directly in \`run:\` blocks with \`\${{ }}\` — this is the most common vulnerability
  - Vulnerable: \`run: echo "\${{ github.event.issue.title }}"\` — attacker can inject shell commands via issue title
  - Safe: set an environment variable first, then reference it:
    \`\`\`yaml
    env:
      TITLE: \${{ github.event.issue.title }}
    run: echo "$TITLE"
    \`\`\`
- Untrusted contexts include: \`github.event.issue.title\`, \`github.event.issue.body\`, \`github.event.pull_request.title\`, \`github.event.pull_request.body\`, \`github.event.comment.body\`, \`github.event.review.body\`, \`github.event.discussion.title\`, \`github.event.discussion.body\`, \`github.head_ref\`, \`github.event.pages.*.page_name\`
- For JavaScript actions, pass untrusted data as \`with:\` inputs (arguments), not as interpolated strings

### Environment Protection
- Use environment protection rules for production deployments — require manual approval from designated reviewers
- Restrict deployment branches to \`main\`, \`release/*\` — prevent arbitrary branches from deploying to production
- Use environment-specific secrets so staging credentials are separate from production
- Set deployment concurrency to prevent parallel deployments to the same environment
- Use wait timers on environments to allow for rollback decisions after deployment

### OIDC & Cloud Authentication
- Use OpenID Connect (OIDC) instead of long-lived cloud credentials (AWS access keys, GCP service account keys)
- Configure trust policies in cloud providers to accept tokens only from specific repositories and branches
- OIDC provides short-lived, automatically rotated tokens — eliminates the risk of stolen static credentials
- Use official OIDC actions: \`aws-actions/configure-aws-credentials\`, \`azure/login\`, \`google-github-actions/auth\`

### Self-Hosted Runner Security
- Never use self-hosted runners for public repositories — any pull request can execute arbitrary code on the runner
- Harden self-hosted runners: run as non-root, use ephemeral runners, isolate with containers or VMs
- Restrict self-hosted runner access to specific repositories or organizations
- Audit runner labels and ensure workflows cannot target unintended runners`,
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
        description: 'GitHub Actions workflow structure, triggers, caching, matrix, reusable workflows, and artifacts — mandatory conventions',
        content: `# GitHub Actions Conventions

## Workflow Structure
- Name workflows descriptively: \`ci.yml\`, \`deploy-production.yml\`, \`release.yml\`
- Separate CI (lint/test/build) from CD (deploy) workflows — single responsibility per workflow
- Keep individual jobs focused on one concern — do not combine linting, testing, and building in one job
- Use \`name:\` at workflow, job, and step levels for clear GitHub Actions UI visibility
- Use \`workflow_dispatch\` with typed \`inputs\` for manual triggers requiring parameters

## Triggers
- Use path filters to run workflows only when relevant files change
- Prefer \`pull_request\` over \`pull_request_target\` — the latter runs with base branch write permissions and is a critical security risk when checking out PR code
- Use \`push\` for main/release branches, \`pull_request\` for all PRs
- Use \`on.schedule\` (cron) for periodic maintenance (dependency audits, nightly builds)
- Use \`workflow_run\` for chaining workflows that depend on other workflow completions

## Caching
- Cache package manager dependencies using lock file hashes: \`hashFiles('**/package-lock.json')\`
- Use \`restore-keys\` for partial cache hits as fallback
- Leverage built-in caching in setup actions (\`actions/setup-node\`, \`actions/setup-python\`) with \`cache:\` input
- Cache build outputs with \`actions/upload-artifact\` / \`actions/download-artifact\` for cross-job sharing
- Set appropriate \`retention-days\` on artifacts — do not keep CI artifacts for 90 days by default

## Concurrency
- Use \`concurrency\` groups to cancel redundant runs on the same branch:
  \`\`\`yaml
  concurrency:
    group: \${{ github.workflow }}-\${{ github.ref }}
    cancel-in-progress: true
  \`\`\`
- Disable \`cancel-in-progress\` for deployment workflows to prevent partial deployments

## Matrix Builds
- Use \`strategy.matrix\` for testing across versions (Node 18/20/22) and platforms (ubuntu, macos, windows)
- Use \`include\`/\`exclude\` for specific matrix combinations
- Set \`fail-fast: false\` in test matrices to see all failures, not just the first
- Use matrix values in step conditions: \`if: matrix.os == 'ubuntu-latest'\`

## Reusable Workflows
- Define reusable workflows with \`workflow_call\` trigger
- Parameterize with \`inputs\` (typed) and \`secrets\` (inherit or explicit)
- Version reusable workflows with tags for stability
- Use composite actions for reusable step sequences: \`.github/actions/<name>/action.yml\`

## Job Outputs & Environment
- Use \`$GITHUB_OUTPUT\` to set step outputs: \`echo "key=value" >> $GITHUB_OUTPUT\`
- Use \`$GITHUB_ENV\` to set environment variables for subsequent steps
- Use \`$GITHUB_STEP_SUMMARY\` to add markdown summaries to the workflow run UI
- Use job-level \`outputs:\` to pass data between jobs via \`needs.<job>.outputs.<key>\`
- Never use deprecated \`set-output\` or \`set-env\` workflow commands

## Secrets
- Store sensitive values in GitHub Secrets — never hardcode in workflow files
- Use environment-level secrets for deployment credentials
- Prefer \`GITHUB_TOKEN\` (automatic) over Personal Access Tokens for GitHub API operations
- Mask runtime-sensitive values with \`::add-mask::VALUE\`
- Never echo or log secret values — audit steps that use secrets
`,
      },
      {
        path: 'infra/github-actions-security.md',
        governance: 'mandatory',
        description: 'GitHub Actions security hardening — supply chain, permissions, script injection, environment protection, OIDC',
        content: `# GitHub Actions Security Hardening

## Supply Chain Security
- Pin ALL third-party actions to full 40-character commit SHA — never use mutable tags
- Review action source code before using — compromised actions can exfiltrate secrets
- Use Dependabot or Renovate to keep pinned SHAs updated with security patches
- Prefer official GitHub actions (\`actions/*\`) and Marketplace-verified creators
- Use \`actions/dependency-review-action\` on pull requests to catch vulnerable dependencies
- Audit your workflow files periodically for newly added or modified action references

### Correct
\`\`\`yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
\`\`\`

### Anti-Pattern
\`\`\`yaml
# Mutable tag — attacker can rewrite to serve malicious code
- uses: actions/checkout@v4
# Branch reference — completely untrusted
- uses: some-org/some-action@main
\`\`\`

## Permissions (Least Privilege)
- Set \`permissions: {}\` at workflow level (deny all) — grant specific permissions per job
- Common permission sets:
  | Workflow Type | Permissions |
  |---|---|
  | CI (lint/test) | \`contents: read\` |
  | PR automation | \`contents: read, pull-requests: write\` |
  | Package publish | \`contents: read, packages: write\` |
  | Release | \`contents: write\` |
  | OIDC deploy | \`contents: read, id-token: write\` |
- Never use \`permissions: write-all\` — always scope to minimum required

## Script Injection Prevention
- NEVER use \`\${{ }}\` interpolation of untrusted input in \`run:\` blocks
- Untrusted contexts: \`github.event.issue.title\`, \`github.event.issue.body\`, \`github.event.pull_request.title\`, \`github.event.pull_request.body\`, \`github.event.comment.body\`, \`github.head_ref\`
- Always route untrusted input through environment variables:

### Correct
\`\`\`yaml
- name: Process PR title
  env:
    PR_TITLE: \${{ github.event.pull_request.title }}
  run: echo "$PR_TITLE"
\`\`\`

### Anti-Pattern
\`\`\`yaml
# Shell injection — attacker controls the title string
- run: echo "\${{ github.event.pull_request.title }}"
\`\`\`

## Environment Protection
- Require manual approval for production deployment environments
- Restrict deployment branches to \`main\` and \`release/*\`
- Use environment-specific secrets (staging vs production credentials)
- Set deployment concurrency to prevent parallel deploys to the same environment
- Use wait timers on production environments for rollback decisions

## OIDC Authentication
- Use OpenID Connect instead of static cloud credentials (AWS keys, GCP service account JSON)
- Configure trust policies to accept tokens only from specific repos and branches
- Use official OIDC actions: \`aws-actions/configure-aws-credentials\`, \`azure/login\`, \`google-github-actions/auth\`
- Rotate fallback credentials if OIDC is not available for all providers

## Self-Hosted Runners
- Never use self-hosted runners for public repositories
- Run as non-root, use ephemeral runners, isolate with containers or VMs
- Restrict runner access to specific repositories via runner groups
- Monitor runner activity and audit unexpected workflow executions
`,
      },
      {
        path: 'infra/github-actions-workflow-patterns.md',
        governance: 'recommended',
        description: 'GitHub Actions recommended workflow patterns and templates for common CI/CD scenarios',
        content: `# GitHub Actions Workflow Patterns

## CI Workflow Pattern
\`\`\`yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions: {}

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<full-sha>
      - uses: actions/setup-node@<full-sha>
        with:
          node-version-file: '.node-version'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@<full-sha>
      - uses: actions/setup-node@<full-sha>
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
\`\`\`

## Release Workflow Pattern
\`\`\`yaml
name: Release
on:
  push:
    tags: ['v*']

permissions: {}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<full-sha>
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@<full-sha>
        with:
          name: dist
          path: dist/
          retention-days: 7

  publish:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    environment: production
    steps:
      - uses: actions/download-artifact@<full-sha>
        with:
          name: dist
      - run: npm publish
\`\`\`

## Reusable Workflow Pattern
\`\`\`yaml
# .github/workflows/reusable-test.yml
name: Reusable Test
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<full-sha>
      - uses: actions/setup-node@<full-sha>
        with:
          node-version: \${{ inputs.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
\`\`\`

## Deployment with OIDC Pattern
\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main]

permissions: {}

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    environment: production
    steps:
      - uses: actions/checkout@<full-sha>
      - uses: aws-actions/configure-aws-credentials@<full-sha>
        with:
          role-to-assume: arn:aws:iam::123456789012:role/deploy-role
          aws-region: us-east-1
      - run: ./deploy.sh
\`\`\`

## Conditional Job Execution
- Use \`if:\` conditions to skip jobs based on context:
  - \`if: github.event_name == 'push'\` — only on push, not PRs
  - \`if: contains(github.event.pull_request.labels.*.name, 'deploy')\` — label-based triggers
  - \`if: github.ref == 'refs/heads/main'\` — only on main branch
- Use \`needs:\` for job dependencies — downstream jobs run only after upstream succeeds
- Use \`if: always()\` on cleanup jobs to ensure they run regardless of prior failures
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## GitHub Actions Workflow Review Checklist
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.github/workflows/.*\\.ya?ml$" && grep -nE "\\$\\{\\{\\s*github\\.event\\.(issue|pull_request|comment|review|discussion)\\.(title|body)\\s*\\}\\}" "$CLAUDE_FILE_PATH" | head -5 | while read line; do echo "HOOK_EXIT:1:Potential script injection — untrusted input interpolated directly in workflow file ($(echo "$line" | cut -d: -f1)) — use env variable instead"; done || true',
            timeout: 10,
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.github/workflows/.*\\.ya?ml$" && grep -nE "uses:\\s+[^@]+@v[0-9]" "$CLAUDE_FILE_PATH" | head -5 | while read line; do echo "HOOK_EXIT:0:Warning: action pinned to mutable tag ($(echo "$line" | cut -d: -f1)) — pin to full commit SHA for supply chain security"; done || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
