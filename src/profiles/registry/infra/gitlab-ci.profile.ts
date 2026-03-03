import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const gitlabCIProfile: Profile = {
  id: 'infra/gitlab-ci',
  name: 'GitLab CI',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['gitlab-ci'],
  contributions: {
    claudeMd: [
      {
        heading: 'GitLab CI Conventions',
        order: 40,
        content: `## GitLab CI Conventions

Pipeline automation. Stage-based execution, include/extends composition, secure variable handling, and artifact management.

**Detailed rules:** see \`.claude/rules/gitlab-ci/\` directory.

**Key rules:**
- Use \`include:\` and \`extends:\` to DRY up pipeline configuration
- Mask all sensitive variables and restrict them to protected branches
- Define explicit \`stages:\` ordering — jobs without a stage default to \`test\`
- Use \`rules:\` instead of deprecated \`only/except\` syntax`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(glab:*)',
          'Bash(glab ci:*)',
          'Bash(glab mr:*)',
          'Bash(glab pipeline:*)',
          'Bash(glab release:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/gitlab-ci-conventions.md',
        governance: 'mandatory',
        paths: ['.gitlab-ci.yml', 'ci/**/*.yml'],
        description: 'GitLab CI pipeline structure, stages, jobs, includes, caching, artifacts, and variables — mandatory conventions',
        content: `# GitLab CI Conventions

## Pipeline Structure
- Name your pipeline file \`.gitlab-ci.yml\` at repository root; split large configs using \`include:\` with local, remote, or template references
- Define all stages explicitly in the \`stages:\` block — the execution order is determined by the order they appear
- Use descriptive job names that reflect their purpose: \`lint:eslint\`, \`test:unit\`, \`deploy:staging\`
- Group related jobs under the same stage for parallel execution within that stage

## Stages Best Practices
- Use a logical stage progression: \`.pre\` → \`build\` → \`test\` → \`deploy\` → \`.post\`
- Limit stages to 5-7 maximum; too many stages reduce parallelism and increase wall-clock time
- Use \`.pre\` and \`.post\` stages for setup/teardown that must always run first or last

## Include and Extends
- Use \`include:local\` for same-repo templates, \`include:project\` for cross-repo templates, \`include:remote\` for external URLs
- Use \`include:template\` to leverage GitLab's built-in CI templates (e.g., SAST, Dependency Scanning)
- Compose jobs with \`extends:\` to inherit from hidden jobs (prefixed with \`.\`) — keeps configs DRY
- Override specific keys in extending jobs; arrays are replaced, not merged — be explicit about overrides

## Rules (Not Only/Except)
- Always use \`rules:\` instead of deprecated \`only:\`/\`except:\` — \`rules:\` provides more control and is the modern syntax
- Use \`rules:\` with \`if:\`, \`changes:\`, \`exists:\`, and \`when:\` for precise job triggering
- Order rules carefully — first matching rule wins; add a fallback \`when: never\` at the end to prevent accidental runs
- Use \`$CI_PIPELINE_SOURCE\` to distinguish merge request pipelines from push pipelines

## Caching
- Cache dependencies using a key that includes the lock file hash: \`key: { files: [package-lock.json] }\`
- Set \`policy: pull\` on jobs that only read the cache; \`policy: push\` on jobs that update it
- Use \`cache:paths\` to specify exactly which directories to cache (e.g., \`node_modules/\`, \`.pip/\`)
- Define fallback keys with \`key:prefix\` and \`fallback_keys\` for partial cache hits

## Artifacts
- Set \`expire_in:\` on all artifacts — unbounded artifacts consume storage indefinitely
- Use \`artifacts:reports\` for JUnit test results, code coverage, SAST, and dependency scanning
- Separate build artifacts (\`artifacts:paths\`) from test reports (\`artifacts:reports\`) for clean UI visibility
- Use \`dependencies:\` or \`needs:\` to control which jobs receive which artifacts

## Variables
- Define project-level variables for values shared across all pipelines
- Use \`variables:\` at job level for job-specific overrides
- Use CI/CD variable file type for multi-line or binary secrets
- Reference variables with \`$VARIABLE\` in scripts and \`$CI_*\` for predefined variables

## Services
- Use \`services:\` for Docker-in-Docker, databases, and other sidecar containers
- Pin service image versions — never use \`latest\` tags in CI
- Use \`alias:\` to define stable hostnames for service containers
`,
      },
      {
        path: 'infra/gitlab-ci-security.md',
        governance: 'mandatory',
        paths: ['.gitlab-ci.yml', 'ci/**/*.yml'],
        description: 'GitLab CI security hardening — variable masking, protected branches, secrets management, runner security',
        content: `# GitLab CI Security Hardening

## Variable Masking and Protection
- Mark all sensitive variables as "Masked" in GitLab CI/CD settings — masked variables are hidden in job logs
- Mark deployment credentials as "Protected" — protected variables are only available on protected branches and tags
- Never define secrets directly in \`.gitlab-ci.yml\` — use project or group-level CI/CD variables instead
- Use \`!reference\` tags or \`include:\` to compose secrets rather than duplicating them across jobs

## Secrets Management
- Never echo, print, or log variable values that might contain secrets — even indirectly through debug mode
- Use \`GIT_CLEAN_FLAGS: -ffdx -e .cache/\` to prevent accidental secret exposure through cached files
- Rotate CI/CD variables regularly — set a calendar reminder for quarterly rotation of tokens and keys
- Prefer short-lived tokens (e.g., OIDC tokens, temporary credentials) over long-lived static secrets
- Use external secrets managers (HashiCorp Vault, AWS Secrets Manager) via GitLab's native integration when available

## Protected Branches and Tags
- Restrict pipeline execution on protected branches to specific roles — prevent unauthorized deployments
- Use protected tags for release pipelines — only maintainers should be able to trigger release jobs
- Configure merge request approvals for changes to \`.gitlab-ci.yml\` — CI config changes are security-sensitive
- Use \`rules:\` to ensure deployment jobs only run on protected branches: \`if: $CI_COMMIT_REF_PROTECTED == "true"\`

## Runner Security
- Use shared GitLab.com runners for public projects — they provide ephemeral, isolated environments
- For private runners: run in Docker or Kubernetes executor mode, never shell executor for untrusted code
- Tag runners by security level: \`runner:trusted\` for deployment jobs, \`runner:general\` for CI
- Never run CI jobs as root — configure runners with non-root users and minimal filesystem permissions
- Use ephemeral runners that are destroyed after each job — prevents data leakage between jobs

## Pipeline Security
- Enable GitLab's built-in SAST, DAST, Dependency Scanning, and Secret Detection templates via \`include:\`
- Set \`allow_failure: false\` on security scanning jobs — do not merge if scans detect critical vulnerabilities
- Use merge request pipelines (\`$CI_PIPELINE_SOURCE == "merge_request_event"\`) to validate code before merge
- Restrict who can run manual jobs (\`when: manual\`) by using protected environments with required approvals
- Audit pipeline configurations regularly for overly permissive \`rules:\` that could allow untrusted code to execute

## Container Image Security
- Pin all Docker image tags to specific digests or versions — never use \`:latest\` in CI
- Use GitLab Container Registry for internal images — scan them with GitLab's Container Scanning
- Minimize base image size — use \`-slim\` or \`-alpine\` variants to reduce attack surface
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## GitLab CI Pipeline Review Checklist

**Available skill:** \`gitlab-ci-pipeline-creator\` — use when creating new pipelines.

- Verify all stages are explicitly defined in the \`stages:\` block — jobs with undefined stages cause pipeline errors
- Check that \`rules:\` syntax is used instead of deprecated \`only:\`/\`except:\` — flag any legacy syntax
- Verify caching is configured with lock file-based keys and appropriate \`policy:\` settings (pull vs push)
- Check that \`include:\` references use pinned versions or specific refs — not default branch references that can change
- Verify artifacts have \`expire_in:\` set — flag artifacts without expiration as they consume unbounded storage
- Check for proper use of \`needs:\` for DAG (Directed Acyclic Graph) pipelines to enable cross-stage parallelism
- Verify \`extends:\` is used to DRY up repeated job configurations — flag copy-pasted job blocks
- Check that deployment jobs use \`environment:\` with proper name and URL for deploy tracking
- Verify \`when: manual\` jobs are on protected environments with approval rules
- Check that service images are pinned to specific versions — flag \`:latest\` tags
- Verify \`retry:\` is configured for flaky network operations (package installs, deployments)
- Check that variables do not contain hardcoded secrets — all secrets should be in CI/CD settings`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## GitLab CI Security Audit

**Available skill:** \`gitlab-ci-pipeline-creator\` — use when creating secure pipelines from scratch.

- Check for plaintext secrets in \`.gitlab-ci.yml\` — flag any hardcoded tokens, passwords, API keys, or connection strings as CRITICAL
- Verify deployment jobs use \`rules:\` with \`$CI_COMMIT_REF_PROTECTED == "true"\` — unprotected deployment is a CRITICAL risk
- Check that Docker images are pinned to specific versions or digests — flag \`:latest\` tags as supply chain risk
- Verify GitLab SAST/DAST/Secret Detection templates are included via \`include:template\`
- Check that \`allow_failure:\` is not set to \`true\` on security scanning jobs
- Verify private runners use Docker or Kubernetes executors — flag shell executor usage as CRITICAL
- Check for \`GIT_STRATEGY: clone\` on sensitive jobs to prevent cache poisoning from previous job runs
- Verify that \`artifacts:public: false\` is set for artifacts containing sensitive build output
- Check that manual deployment jobs require protected environment approvals
- Verify no job uses \`script:\` blocks that interpolate unvalidated CI variables into shell commands
- Check for \`FF_SCRIPT_SECTIONS\` and job log redaction of sensitive patterns
- Audit for data exfiltration: scripts sending variable values to external URLs via curl or wget`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## GitLab CI Documentation Guidelines

**Available skill:** \`gitlab-ci-pipeline-creator\` — use when scaffolding documented pipelines.

- Document pipeline architecture with a top-level comment block in \`.gitlab-ci.yml\` explaining stages, triggers, and dependencies
- Include inline comments for complex \`rules:\` conditions explaining when and why each rule triggers
- Document all required CI/CD variables (masked/protected settings) in the project README or a dedicated CI.md file
- Document environment configuration: which environments exist, approval requirements, and deployment branch restrictions
- Include a pipeline diagram (Mermaid) showing stage progression and job dependencies
- Document \`include:\` sources: what each included template provides and where to find its source
- Document caching strategy: which caches are shared across jobs, how keys are constructed, and when to clear them
- Maintain a changelog for \`.gitlab-ci.yml\` changes that affect other teams or shared templates`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## GitLab CI Migration Guidance

**Available skill:** \`gitlab-ci-pipeline-creator\` — use when creating replacement pipelines during migration.

- When migrating from GitHub Actions: map workflows to stages, reusable workflows to \`include:\` templates, actions to scripts or CI templates
- When migrating from Jenkins: map Jenkinsfile stages to GitLab stages, shared libraries to \`include:project\`, credentials to CI/CD variables
- When migrating from \`only/except\` to \`rules:\`: replace \`only: branches\` with \`rules: - if: $CI_COMMIT_BRANCH\`, preserve the same triggering logic
- When migrating to DAG pipelines: replace sequential stage dependencies with \`needs:\` for parallel execution across stages
- When migrating to parent-child pipelines: use \`trigger:include\` to break monolithic pipelines into smaller, focused child pipelines
- When migrating to compliance pipelines: use \`include:\` with project-level templates that enforce security scanning and approval gates
- When upgrading runner versions: check for breaking changes in executor behavior, Docker-in-Docker setup, and cache format compatibility
- When migrating to GitLab Premium/Ultimate features: enable SAST, DAST, and Dependency Scanning templates; configure Security Dashboard`,
      },
    ],
    skills: [
      {
        name: 'gitlab-ci-pipeline-creator',
        description: 'Create well-structured, secure GitLab CI pipelines following best practices',
        content: `# GitLab CI Pipeline Creator

---
context: fork
allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
---

## Purpose
Create production-ready GitLab CI pipeline configurations following security best practices, proper stage design, caching, and CI/CD patterns.

## Process

### 1. Determine Pipeline Type
Identify the pipeline purpose:
- **CI**: lint, test, build on push/merge request
- **CD**: deploy to staging/production on merge or tag
- **Release**: build, package, publish on tag push
- **Maintenance**: dependency audits, scheduled security scans, cleanup tasks
- **Child pipeline**: triggered from parent for modular execution

### 2. Configure Stages
\`\`\`yaml
stages:
  - .pre
  - build
  - test
  - deploy
  - .post
\`\`\`

### 3. Define Rules (Not Only/Except)
\`\`\`yaml
.merge_request_rules:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

lint:
  extends: .merge_request_rules
  stage: test
  script:
    - npm run lint
\`\`\`

### 4. Configure Caching
\`\`\`yaml
.node_cache:
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
    policy: pull

build:
  extends: .node_cache
  cache:
    policy: pull-push
  script:
    - npm ci
    - npm run build
\`\`\`

### 5. Configure Artifacts
\`\`\`yaml
build:
  artifacts:
    paths:
      - dist/
    expire_in: 1 day
    reports:
      junit: coverage/junit.xml
\`\`\`

### 6. Use Include for Composition
\`\`\`yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - local: ci/deploy.yml
  - project: 'team/shared-ci'
    ref: v2.1.0
    file: '/templates/node.yml'
\`\`\`

### 7. Configure Deployment
\`\`\`yaml
deploy:production:
  stage: deploy
  environment:
    name: production
    url: https://app.example.com
  rules:
    - if: $CI_COMMIT_REF_PROTECTED == "true"
      when: manual
  needs:
    - build
    - test:unit
\`\`\`

## Security Checklist
- [ ] No secrets hardcoded in \`.gitlab-ci.yml\`
- [ ] All sensitive variables marked as Masked and Protected in CI/CD settings
- [ ] Deployment jobs restricted to protected branches
- [ ] Docker images pinned to specific versions (no \`:latest\`)
- [ ] SAST/Secret Detection templates included
- [ ] Manual deployment jobs require protected environment approval
- [ ] \`rules:\` used instead of \`only/except\`
- [ ] Artifacts have \`expire_in:\` set
- [ ] Cache keys based on lock file hashes
- [ ] No shell executor for untrusted code

## Quality Checklist
- [ ] All stages explicitly defined in \`stages:\` block
- [ ] Job names are descriptive and follow naming convention
- [ ] \`extends:\` used to DRY up repeated config
- [ ] \`needs:\` used for DAG parallelism where beneficial
- [ ] \`retry:\` configured for flaky network operations
- [ ] Environments configured with names and URLs
- [ ] Pipeline is modular via \`include:\`
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "(\\.gitlab-ci\\.yml|ci/.*\\.yml)$" && grep -nEi "(password|token|secret|api_key|private_key|access_key)\\s*[:=]\\s*[\"].+" "$FILE_PATH" | head -1 | grep -q "." && { echo "Unprotected secret detected in GitLab CI config — use masked/protected CI/CD variables instead of plaintext values" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for unprotected secrets in GitLab CI configuration',
          },
        ],
      },
    ],
  },
};
