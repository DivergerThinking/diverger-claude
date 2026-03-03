import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const circleciProfile: Profile = {
  id: 'infra/circleci',
  name: 'CircleCI',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['circleci'],
  contributions: {
    claudeMd: [
      {
        heading: 'CircleCI Conventions',
        order: 40,
        content: `## CircleCI Conventions

Pipeline automation. Workflow orchestration, orb reuse, executor-based isolation, and context-driven secrets.

**Detailed rules:** see \`.claude/rules/circleci/\` directory.

**Key rules:**
- Use orbs for reusable CI logic — prefer certified orbs from the CircleCI registry
- Store secrets in contexts, not as project-level environment variables when sharing across projects
- Use workspaces to persist data between jobs and caching for dependencies
- Define resource classes appropriate to workload — avoid over-provisioning`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(circleci:*)',
          'Bash(circleci config:*)',
          'Bash(circleci orb:*)',
          'Bash(circleci workflow:*)',
          'Bash(circleci local:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/circleci-conventions.md',
        governance: 'mandatory',
        paths: ['.circleci/config.yml', '.circleci/**/*'],
        description: 'CircleCI config structure, executors, workflows, orbs, caching, workspaces, and resource classes — mandatory conventions',
        content: `# CircleCI Conventions

## Config Structure
- All configuration lives in \`.circleci/config.yml\` — this is the single source of truth for pipeline behavior
- Use config version 2.1 for access to orbs, executors, commands, and parameterized jobs
- Keep the config file well-organized: define reusable components (executors, commands, orbs) at the top, jobs in the middle, workflows at the bottom
- Use YAML anchors (\`&anchor\` and \`*anchor\`) sparingly — prefer CircleCI's native \`commands:\` for reuse

## Executors
- Define named executors for each environment type: \`docker\`, \`machine\`, \`macos\`, \`windows\`
- Pin Docker image versions — use \`cimg/node:20.11\` not \`cimg/node:latest\`; use CircleCI convenience images (\`cimg/*\`) for faster startup
- Use \`resource_class:\` to right-size executor resources: \`small\` for lint, \`medium\` for tests, \`large\` for builds
- Define executors at the top level and reference them in jobs via \`executor:\` — keeps executor changes centralized

## Workflows
- Define workflows explicitly — do not rely on implicit single-job pipelines
- Use \`requires:\` to express job dependencies and control execution order
- Use \`filters:\` on branches and tags to control when jobs run within a workflow
- Name workflows descriptively: \`build-test-deploy\`, \`nightly-security-scan\`, \`release\`
- Use \`when\`/\`unless\` pipeline parameters for conditional workflow execution

## Orbs
- Use certified orbs from the CircleCI registry for common tasks (AWS, Docker, Node, Slack)
- Pin orb versions to minor version: \`circleci/node@5.2\` — patch versions are safe to auto-update
- Review orb source code before using third-party (non-certified) orbs — they can execute arbitrary code
- Create private orbs for organization-specific reusable logic; publish to your org namespace
- Use \`orb:\` inline definitions only for quick prototyping — move to published orbs for production

## Caching
- Cache dependencies using lock file checksums: \`key: deps-{{ checksum "package-lock.json" }}\`
- Use a cache key prefix for easy invalidation: \`v2-deps-{{ checksum "..." }}\` — bump prefix to clear cache
- Define \`restore_cache:\` with fallback keys: exact match first, then prefix match
- Cache only dependency directories (\`node_modules/\`, \`.pip/\`) — not build outputs (use workspaces)

## Workspaces
- Use \`persist_to_workspace:\` to share build artifacts between jobs within the same workflow
- Attach workspaces with \`attach_workspace:\` at the beginning of downstream jobs
- Workspaces are for intra-workflow data; caches are for inter-workflow dependency reuse
- Keep workspace payloads small — persist only what downstream jobs need

## Commands
- Define reusable \`commands:\` for multi-step sequences used across multiple jobs
- Parameterize commands with \`parameters:\` for flexible reuse
- Use commands instead of duplicating step sequences — DRY principle applies to CI configs too

## Resource Classes
- Use \`small\` (1 vCPU, 2GB) for linting, formatting, and simple script tasks
- Use \`medium\` (2 vCPU, 4GB) for standard test and build jobs
- Use \`large\` (4 vCPU, 8GB) for memory-intensive builds, Docker builds, and parallel test suites
- Monitor actual resource usage in CircleCI Insights and adjust resource classes accordingly
`,
      },
      {
        path: 'infra/circleci-security.md',
        governance: 'mandatory',
        paths: ['.circleci/config.yml', '.circleci/**/*'],
        description: 'CircleCI security hardening — contexts, secrets management, OIDC, and access control',
        content: `# CircleCI Security Hardening

## Contexts for Secrets
- Store all secrets in CircleCI contexts — contexts provide scoped, auditable secret management
- Create separate contexts for different environments: \`staging-secrets\`, \`production-secrets\`
- Restrict context access to specific security groups — only team members who need production secrets should have access
- Never define secrets as project-level environment variables when they need to be shared across multiple projects — use contexts
- Rotate context secrets regularly — CircleCI provides an API for programmatic secret rotation

## Environment Variable Security
- Never hardcode secrets in \`.circleci/config.yml\` — all sensitive values must come from contexts or project settings
- Do not echo, print, or log environment variables that might contain secrets — even in debug mode
- Use \`environment:\` in jobs for non-sensitive configuration only (NODE_ENV, CI flags)
- When passing secrets between steps, use files or CircleCI's built-in environment variable mechanism — not shell variable export

## OIDC Authentication
- Use CircleCI's OIDC token (\`$CIRCLE_OIDC_TOKEN\`) for passwordless cloud authentication
- Configure OIDC trust policies in AWS IAM, GCP Workload Identity, or Azure AD to accept CircleCI tokens
- Restrict OIDC trust to specific CircleCI organization, project, and branch — not just organization
- OIDC eliminates the need for storing long-lived cloud credentials as secrets — prefer it over static keys

## Access Control
- Restrict who can trigger pipelines on protected branches — use VCS branch protection rules in conjunction with CircleCI
- Use CircleCI's "Restrict managing contexts" setting to limit who can create and modify contexts
- Audit pipeline runs and context usage through CircleCI's Audit Logs
- Enable mandatory 2FA for all CircleCI organization members

## Orb Security
- Only use certified orbs from the CircleCI registry for sensitive operations (deployments, secrets access)
- Review the source of any third-party orb before adding it — compromised orbs can exfiltrate secrets
- Pin orb versions — do not use \`volatile\` tag which always resolves to the latest version
- For sensitive pipelines, inline the orb logic directly rather than depending on external orbs

## Pipeline Security Patterns
- Use \`filters:\` on workflows to ensure deployment jobs only run on protected branches
- Require approval jobs (\`type: approval\`) before production deployments
- Use IP ranges for restricted contexts — limit secret access to pipelines running on trusted infrastructure
- Never use \`setup: true\` workflows with untrusted dynamic config generation — this can execute arbitrary YAML
- Enable CircleCI's "Only build pull requests" setting to prevent resource abuse from arbitrary branch pushes
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## CircleCI Config Review Checklist

**Available skill:** \`circleci-config-creator\` — use when creating new pipeline configurations.

- Verify config version is 2.1 — older versions lack orbs, executors, commands, and parameterized jobs
- Check that all Docker images are pinned to specific versions — flag \`:latest\` tags as unstable
- Verify orbs are pinned to at least minor version — flag unpinned or \`volatile\` orb references
- Check that caching uses lock file checksums with a version prefix for easy invalidation
- Verify workspaces are used for intra-workflow artifact passing (not cache)
- Check that workflows define explicit job dependencies with \`requires:\` — flag jobs without clear dependency chains
- Verify resource classes are appropriate for each job — flag \`large\` resource class on lint/format jobs
- Check that \`commands:\` are defined for step sequences repeated across multiple jobs
- Verify branch/tag filters are set on deployment workflows to restrict when they execute
- Check for approval jobs before production deployments in workflow definitions
- Verify executors are defined at the top level and referenced by name — flag inline executor definitions
- Check that no environment variables contain hardcoded secrets — all secrets should be in contexts`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## CircleCI Security Audit

**Available skill:** \`circleci-config-creator\` — use when creating secure pipeline configurations from scratch.

- Check for plaintext secrets in \`.circleci/config.yml\` — flag any hardcoded tokens, passwords, API keys, or credentials as CRITICAL
- Verify contexts are used for secret management — flag project-level env vars for shared secrets
- Check that deployment workflows have \`filters:\` restricting to protected branches only
- Verify approval jobs (\`type: approval\`) exist before production deployment jobs
- Check that third-party (non-certified) orbs are not used for sensitive operations — flag as supply chain risk
- Verify Docker images use CircleCI convenience images (\`cimg/*\`) or are pinned to digests for untrusted registries
- Check for \`setup: true\` workflows with dynamic config generation — flag if config source is untrusted (CRITICAL)
- Verify no \`run:\` step echoes or logs environment variables that could contain secrets
- Check that OIDC is used for cloud authentication where available — flag long-lived static cloud credentials
- Verify restricted context access is configured — contexts accessible to "All members" for production secrets is CRITICAL
- Check for SSH key additions in config — flag raw private keys as CRITICAL (use fingerprints)
- Audit for data exfiltration: \`run:\` steps sending environment variables to external URLs via curl or wget`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## CircleCI Documentation Guidelines

**Available skill:** \`circleci-config-creator\` — use when scaffolding documented pipeline configurations.

- Document pipeline architecture with a comment block at the top of \`.circleci/config.yml\` explaining workflows, executors, and prerequisites
- Include inline comments for complex workflow filters, conditional parameters, and non-obvious job dependencies
- Document all required contexts: context name, what secrets it contains, who has access, and rotation schedule
- Document orb dependencies: orb name, version, what commands/jobs it provides, and link to registry page
- Include a pipeline diagram (Mermaid) showing workflow structure, job dependencies, and approval gates
- Document resource class choices: why each job uses its assigned resource class and expected resource consumption
- Document caching strategy: cache key construction, version prefix convention, and when to manually invalidate
- Maintain a changelog for \`.circleci/config.yml\` changes that affect pipeline behavior or execution time`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## CircleCI Migration Guidance

**Available skill:** \`circleci-config-creator\` — use when creating replacement pipeline configurations during migration.

- When migrating from GitHub Actions: map workflows to CircleCI workflows, jobs to jobs, actions to orbs or custom commands, secrets to contexts
- When migrating from Jenkins: map Jenkinsfile stages to CircleCI jobs, shared libraries to orbs, credentials to contexts, agents to executors
- When migrating from config v2.0 to v2.1: add \`version: 2.1\`, extract inline executors to named executors, convert repeated steps to commands, adopt orbs for common tasks
- When migrating to dynamic config: use \`setup: true\` workflow with \`continuation/continue\` orb to generate config based on changed files — enables monorepo support
- When migrating to OIDC authentication: configure trust policies in AWS/GCP/Azure, replace static credential contexts with OIDC token-based auth, remove long-lived access keys
- When migrating from Docker executor to machine executor: update image references, adjust filesystem paths, configure Docker service separately (not available by default)
- When consolidating orbs: extract repeated inline command sequences into a private orb published to your organization namespace, version it with semver
- When migrating from CircleCI Server to Cloud: verify orb availability (Server may have restricted orb access), update IP allowlists, migrate contexts and project settings via API`,
      },
    ],
    skills: [
      {
        name: 'circleci-config-creator',
        description: 'Create well-structured, secure CircleCI configurations following best practices',
        content: `# CircleCI Config Creator

---
context: fork
allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
---

## Purpose
Create production-ready CircleCI configuration files following security best practices, proper workflow design, caching, and CI/CD patterns.

## Process

### 1. Determine Pipeline Type
Identify the pipeline purpose:
- **CI**: lint, test, build on push/PR
- **CD**: deploy to staging/production on merge or tag
- **Release**: build, package, publish on tag push
- **Scheduled**: nightly security scans, dependency audits
- **Dynamic**: monorepo-aware config generation with setup workflow

### 2. Define Executors
\`\`\`yaml
executors:
  node:
    docker:
      - image: cimg/node:20.11
    resource_class: medium
  node-browsers:
    docker:
      - image: cimg/node:20.11-browsers
    resource_class: large
\`\`\`

### 3. Define Reusable Commands
\`\`\`yaml
commands:
  install-deps:
    steps:
      - restore_cache:
          keys:
            - v2-deps-{{ checksum "package-lock.json" }}
            - v2-deps-
      - run: npm ci
      - save_cache:
          key: v2-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
\`\`\`

### 4. Define Jobs
\`\`\`yaml
jobs:
  build:
    executor: node
    steps:
      - checkout
      - install-deps
      - run: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist/
  test:
    executor: node
    steps:
      - checkout
      - install-deps
      - run: npm test
      - store_test_results:
          path: reports/junit
\`\`\`

### 5. Define Workflows
\`\`\`yaml
workflows:
  build-test-deploy:
    jobs:
      - build
      - test:
          requires:
            - build
      - hold-production:
          type: approval
          requires:
            - test
          filters:
            branches:
              only: main
      - deploy:
          context: production-secrets
          requires:
            - hold-production
          filters:
            branches:
              only: main
\`\`\`

### 6. Use Orbs
\`\`\`yaml
orbs:
  node: circleci/node@5.2
  aws-cli: circleci/aws-cli@4.1
  slack: circleci/slack@4.13
\`\`\`

### 7. Configure OIDC
\`\`\`yaml
deploy:
  executor: node
  steps:
    - checkout
    - run:
        name: Authenticate with AWS via OIDC
        command: |
          aws sts assume-role-with-web-identity \\
            --role-arn $AWS_ROLE_ARN \\
            --role-session-name circleci-deploy \\
            --web-identity-token $CIRCLE_OIDC_TOKEN
\`\`\`

## Security Checklist
- [ ] No secrets hardcoded in \`.circleci/config.yml\`
- [ ] All sensitive values stored in contexts with restricted access
- [ ] Deployment workflows filtered to protected branches only
- [ ] Approval jobs before production deployments
- [ ] Docker images pinned to specific versions (no \`:latest\`)
- [ ] Only certified orbs used for sensitive operations
- [ ] Orbs pinned to at least minor version
- [ ] OIDC used for cloud authentication where available
- [ ] No \`run:\` steps that echo or log secrets
- [ ] Restricted context access configured

## Quality Checklist
- [ ] Config version 2.1
- [ ] Named executors defined and referenced
- [ ] Resource classes appropriate per job
- [ ] Caching with lock file checksum and version prefix
- [ ] Workspaces for intra-workflow artifact sharing
- [ ] Commands defined for reusable step sequences
- [ ] Workflows with explicit job dependencies
- [ ] Test results stored with \`store_test_results\`
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "(\\.circleci/config\\.yml|\\.circleci/.*\\.yml)$" && grep -nEi "(password|token|secret|api_key|private_key|access_key)\\s*[:=]\\s*[\"].+" "$FILE_PATH" | head -1 | grep -q "." && { echo "Unprotected secret detected in CircleCI config — use contexts for secret management instead of plaintext values" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for unprotected secrets in CircleCI configuration',
          },
        ],
      },
    ],
  },
};
