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
        name: 'github-actions-guide',
        description: 'Detailed reference for GitHub Actions workflow patterns: syntax, security, caching, reusable workflows, matrix strategies, and common CI/CD patterns',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# GitHub Actions — Detailed Reference Guide

## Workflow Syntax Best Practices

### Naming & Organization
- Name workflows, jobs, and steps descriptively for clear GitHub UI visibility.
- Use separate workflow files for separate concerns: \`ci.yml\`, \`deploy.yml\`, \`release.yml\`.
- Prefix reusable workflows: \`_reusable-build.yml\` to distinguish them in the file list.

### Triggers
- Use path filters to avoid unnecessary runs:

\\\`\\\`\\\`yaml
# Correct — only triggers when source or deps change
on:
  push:
    branches: [main]
    paths: ['src/**', 'package.json', 'package-lock.json']
  pull_request:
    branches: [main]
    paths: ['src/**', 'package.json', 'package-lock.json']
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — triggers on every push regardless of changed files
on:
  push:
    branches: [main]
\\\`\\\`\\\`

### Expressions & Defaults
- Use \`\${{ }}\` expressions for dynamic values; reference contexts like \`github\`, \`env\`, \`secrets\`, \`needs\`, \`matrix\`.
- Set \`defaults.run.shell\` and \`defaults.run.working-directory\` at workflow or job level to reduce repetition.
- Use \`env:\` at workflow level for values shared across all jobs; job-level \`env:\` for job-specific values.

## Job Dependencies

- Use \`needs:\` to declare explicit dependency chains between jobs.
- A job only runs when all jobs listed in \`needs:\` succeed (unless \`if: always()\` is used).

\\\`\\\`\\\`yaml
# Correct — deploy only after both lint and test pass
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  test:
    runs-on: ubuntu-latest
    steps: [...]
  deploy:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps: [...]
\\\`\\\`\\\`

- Pass data between jobs via outputs:

\\\`\\\`\\\`yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: \${{ steps.ver.outputs.version }}
    steps:
      - id: ver
        run: echo "version=1.2.3" >> "$GITHUB_OUTPUT"
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying version \${{ needs.build.outputs.version }}"
\\\`\\\`\\\`

## Matrix Strategies

- Use \`strategy.matrix\` for multi-version and multi-OS testing.
- Set \`fail-fast: false\` so all combinations run even if one fails.
- Use \`include\` to add specific combinations or override values; \`exclude\` to skip combinations.

\\\`\\\`\\\`yaml
# Correct — thorough matrix with fail-fast disabled
strategy:
  fail-fast: false
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, macos-latest, windows-latest]
    include:
      - node-version: 22
        os: ubuntu-latest
        coverage: true
    exclude:
      - node-version: 18
        os: windows-latest
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — fail-fast true hides failures in other matrix entries
strategy:
  fail-fast: true
  matrix:
    node-version: [18, 20, 22]
\\\`\\\`\\\`

## Caching

### Setup Action Built-In Caching
Most \`actions/setup-*\` actions have a \`cache\` input that handles caching automatically:

\\\`\\\`\\\`yaml
# Correct — setup-node built-in caching
- uses: actions/setup-node@<full-sha> # v4
  with:
    node-version-file: '.node-version'
    cache: 'npm'
- run: npm ci
\\\`\\\`\\\`

### Manual Caching with actions/cache
For custom cache scenarios:

\\\`\\\`\\\`yaml
# Correct — manual cache with precise key
- uses: actions/cache@<full-sha> # v4
  with:
    path: |
      ~/.cache/pip
      .venv
    key: \${{ runner.os }}-pip-\${{ hashFiles('**/requirements*.txt') }}
    restore-keys: |
      \${{ runner.os }}-pip-
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — no cache, every run re-downloads all dependencies
- run: npm ci
\\\`\\\`\\\`

## Secrets Management

### Environment Protection & Secrets Scoping
- Store secrets in GitHub Secrets — never hardcode in workflow files.
- Use environment-specific secrets to isolate staging from production credentials.
- Require manual approval for production environment deployments.

\\\`\\\`\\\`yaml
# Correct — environment protection with scoped secrets
jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.com
    steps:
      - run: deploy --token "\$DEPLOY_TOKEN"
        env:
          DEPLOY_TOKEN: \${{ secrets.PROD_DEPLOY_TOKEN }}
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — no environment, production secret accessible to all jobs
jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    steps:
      - run: deploy --token "\${{ secrets.PROD_DEPLOY_TOKEN }}"
\\\`\\\`\\\`

### OIDC (OpenID Connect)
- Use OIDC tokens instead of static cloud credentials for AWS, Azure, and GCP.
- Grant \`id-token: write\` permission and configure trust policies in the cloud provider.

\\\`\\\`\\\`yaml
# Correct — OIDC authentication for AWS (no static credentials)
jobs:
  deploy:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@<full-sha>
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubDeploy
          aws-region: us-east-1
\\\`\\\`\\\`

## Reusable Workflows (workflow_call)

- Define shared CI/CD logic as reusable workflows with the \`workflow_call\` trigger.
- Declare typed \`inputs\` (with defaults) and \`secrets\` (required or optional).

\\\`\\\`\\\`yaml
# Reusable workflow definition — _reusable-test.yml
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
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Caller workflow
jobs:
  test:
    uses: ./.github/workflows/_reusable-test.yml
    with:
      node-version: '22'
    secrets: inherit
\\\`\\\`\\\`

## Composite Actions

- Use composite actions for reusable step sequences that don't need a full workflow.
- Define in \`action.yml\` with \`runs.using: composite\`.

\\\`\\\`\\\`yaml
# .github/actions/setup-project/action.yml
name: 'Setup Project'
description: 'Install Node.js and project dependencies'
inputs:
  node-version:
    description: 'Node.js version'
    default: '20'
runs:
  using: composite
  steps:
    - uses: actions/setup-node@<full-sha>
      with:
        node-version: \${{ inputs.node-version }}
        cache: 'npm'
    - run: npm ci
      shell: bash
\\\`\\\`\\\`

## Concurrency Control

- Use \`concurrency\` groups to cancel redundant workflow runs on the same branch.
- Disable \`cancel-in-progress\` for deployment workflows to avoid partial deploys.

\\\`\\\`\\\`yaml
# Correct — cancel redundant CI runs
concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Correct — do NOT cancel in-progress deployments
concurrency:
  group: deploy-production
  cancel-in-progress: false
\\\`\\\`\\\`

## Artifact Management

- Use \`actions/upload-artifact\` and \`actions/download-artifact\` to pass build outputs between jobs.
- Always set \`retention-days\` — the default of 90 days is excessive for CI artifacts.

\\\`\\\`\\\`yaml
# Correct — upload with retention
- uses: actions/upload-artifact@<full-sha>
  with:
    name: build-output
    path: dist/
    retention-days: 7

# In a downstream job
- uses: actions/download-artifact@<full-sha>
  with:
    name: build-output
    path: dist/
\\\`\\\`\\\`

## Common Workflow Patterns

### CI (Lint + Test + Build)
\\\`\\\`\\\`yaml
name: CI
on:
  push:
    branches: [main]
    paths: ['src/**', 'tests/**', 'package*.json']
  pull_request:
    branches: [main]

permissions: {}

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<full-sha>
      - uses: actions/setup-node@<full-sha>
        with: { node-version-file: '.node-version', cache: 'npm' }
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
        with: { node-version: \${{ matrix.node-version }}, cache: 'npm' }
      - run: npm ci
      - run: npm test
\\\`\\\`\\\`

### Release (Tag-Based)
\\\`\\\`\\\`yaml
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
      - uses: actions/setup-node@<full-sha>
        with: { node-version-file: '.node-version', cache: 'npm' }
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@<full-sha>
        with: { name: dist, path: dist/, retention-days: 5 }

  publish:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    environment: production
    steps:
      - uses: actions/download-artifact@<full-sha>
        with: { name: dist, path: dist/ }
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
\\\`\\\`\\\`

### PR Checks
\\\`\\\`\\\`yaml
name: PR Checks
on:
  pull_request:
    branches: [main]

permissions: {}

jobs:
  check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@<full-sha>
      - uses: actions/setup-node@<full-sha>
        with: { node-version-file: '.node-version', cache: 'npm' }
      - run: npm ci
      - run: npm run lint && npm test && npm run build
\\\`\\\`\\\`

## Security Best Practices Summary

### Pin Actions by SHA
\\\`\\\`\\\`yaml
# Correct — pinned to full SHA with version comment
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — mutable tag, vulnerable to supply chain attacks
- uses: actions/checkout@v4
\\\`\\\`\\\`

### Minimal Permissions
\\\`\\\`\\\`yaml
# Correct — deny all at workflow, grant per job
permissions: {}

jobs:
  test:
    permissions:
      contents: read
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — overly permissive
permissions: write-all
\\\`\\\`\\\`

### No Script Injection from Untrusted Input
\\\`\\\`\\\`yaml
# Correct — route untrusted input through env variable
- name: Process PR title
  env:
    PR_TITLE: \${{ github.event.pull_request.title }}
  run: echo "$PR_TITLE"
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — direct interpolation enables code injection
- run: echo "\${{ github.event.pull_request.title }}"
\\\`\\\`\\\`

### No Secrets in Logs
\\\`\\\`\\\`yaml
# Correct — use env var, never echo the secret
- run: deploy-cli --token "$TOKEN"
  env:
    TOKEN: \${{ secrets.DEPLOY_TOKEN }}
\\\`\\\`\\\`

\\\`\\\`\\\`yaml
# Anti-pattern — secret value may appear in logs
- run: echo "Token is \${{ secrets.DEPLOY_TOKEN }}"
\\\`\\\`\\\`
`,
      },
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.github/workflows/.*\\.ya?ml$" && grep -nE "\\$\\{\\{\\s*github\\.event\\.(issue|pull_request|comment|review|discussion)\\.(title|body)\\s*\\}\\}" "$FILE_PATH" | head -1 | grep -q "." && { echo "Potential script injection — untrusted input interpolated directly in workflow file — use env variable instead" >&2; exit 2; } || exit 0',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.github/workflows/.*\\.ya?ml$" && grep -nE "uses:\\s+[^@]+@v[0-9]" "$FILE_PATH" | head -1 | grep -q "." && { echo "Warning: action pinned to mutable tag — pin to full commit SHA for supply chain security" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for mutable action tags in GitHub Actions workflows',
          },
        ],
      },
    ],
  },
};
