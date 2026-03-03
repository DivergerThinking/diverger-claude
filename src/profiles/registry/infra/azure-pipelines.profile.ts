import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const azurePipelinesProfile: Profile = {
  id: 'infra/azure-pipelines',
  name: 'Azure Pipelines',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['azure-pipelines'],
  contributions: {
    claudeMd: [
      {
        heading: 'Azure Pipelines Conventions',
        order: 40,
        content: `## Azure Pipelines Conventions

Pipeline automation. Multi-stage pipelines, template reuse, variable groups, service connections, and environment approvals.

**Detailed rules:** see \`.claude/rules/azure-pipelines/\` directory.

**Key rules:**
- Use multi-stage YAML pipelines over classic (GUI) pipelines — version-controlled, reviewable, portable
- Store secrets in variable groups linked to Azure Key Vault — never hardcode in pipeline YAML
- Use templates for reusable pipeline logic across repositories
- Configure environments with approval gates and branch policies for deployments`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(az pipelines:*)',
          'Bash(az devops:*)',
          'Bash(az repos:*)',
          'Bash(az artifacts:*)',
          'Bash(az boards:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/azure-pipelines-conventions.md',
        governance: 'mandatory',
        paths: ['azure-pipelines.yml', '.azure-pipelines/**/*'],
        description: 'Azure Pipelines structure, stages, jobs, templates, variable groups, service connections, and environments — mandatory conventions',
        content: `# Azure Pipelines Conventions

## Pipeline Structure
- Use multi-stage YAML pipelines (\`azure-pipelines.yml\`) — they are version-controlled, reviewable, and portable across projects
- Define a clear stage hierarchy: stages contain jobs, jobs contain steps — keep this structure consistent
- Name stages, jobs, and steps descriptively: \`stage: Build\`, \`job: RunUnitTests\`, \`displayName: 'Run unit tests'\`
- Use \`displayName:\` on every stage, job, and step for human-readable pipeline visualization

## Stages
- Separate CI (Build, Test) from CD (Deploy) into distinct stages with explicit dependencies
- Use \`dependsOn:\` to express stage dependencies — stages without dependencies run in parallel
- Use \`condition:\` to control stage execution: \`succeeded()\`, \`failed()\`, \`always()\`, custom expressions
- Define deployment stages with \`deployment:\` job type for built-in deployment tracking and environment integration

## Jobs
- Use \`job:\` for standard build/test work; use \`deployment:\` for deployment work with environment tracking
- Use \`strategy: parallel\` or \`matrix\` for multi-configuration testing (multiple OS, SDK versions)
- Set \`timeoutInMinutes:\` on all jobs — default 60 minutes is excessive for most CI jobs
- Use \`pool:\` to specify agent pools — \`vmImage: 'ubuntu-latest'\` for Microsoft-hosted, named pools for self-hosted

## Templates
- Extract reusable pipeline logic into templates: \`stage\`, \`job\`, \`step\`, and \`variable\` templates
- Store templates in a dedicated repository and reference via \`resources: repositories:\`
- Parameterize templates with typed \`parameters:\` — use \`type:\` for validation (\`string\`, \`boolean\`, \`number\`, \`object\`, \`stepList\`)
- Pin template repository references to specific branches or tags: \`ref: refs/tags/v2.0\`

## Variable Groups
- Define project-level variable groups for environment-specific configuration
- Link variable groups to Azure Key Vault for automatic secret synchronization
- Reference variable groups with \`group:\` in the \`variables:\` section at pipeline, stage, or job level
- Use separate variable groups per environment: \`vars-dev\`, \`vars-staging\`, \`vars-production\`

## Service Connections
- Use service connections for authentication to external services (Azure, AWS, Docker registries, Kubernetes)
- Grant service connection access to specific pipelines only — do not use "Grant access to all pipelines"
- Use workload identity federation for Azure service connections — eliminates secret-based authentication
- Document all service connections: what they connect to, which pipelines use them, and who manages them

## Conditions and Expressions
- Use \`condition:\` at stage/job level for conditional execution based on branch, variables, or previous stage results
- Use \`\${{ if }}\` compile-time expressions for template logic — evaluated before pipeline runs
- Use \`$[ ]\` runtime expressions for dynamic values evaluated during execution
- Common patterns: \`eq(variables['Build.SourceBranch'], 'refs/heads/main')\`, \`succeeded()\`, \`ne(variables['Skip.Tests'], 'true')\`

## Environments and Approvals
- Define environments in Azure DevOps for each deployment target: \`dev\`, \`staging\`, \`production\`
- Configure approval gates on production environments — require at least one reviewer
- Use exclusive locks on environments to prevent concurrent deployments
- Set deployment branch policies to restrict which branches can deploy to each environment
`,
      },
      {
        path: 'infra/azure-pipelines-security.md',
        governance: 'mandatory',
        paths: ['azure-pipelines.yml', '.azure-pipelines/**/*'],
        description: 'Azure Pipelines security hardening — variable groups, service connections, branch policies, runtime parameter validation',
        content: `# Azure Pipelines Security Hardening

## Variable Groups and Key Vault
- Store ALL secrets in variable groups linked to Azure Key Vault — never define secrets directly in YAML
- Mark sensitive variables as \`isSecret: true\` — Azure Pipelines masks them in logs automatically
- Use separate Key Vaults per environment — production secrets should not be accessible from dev/staging pipelines
- Grant variable group access to specific pipelines only — do not use "Allow access to all pipelines"
- Rotate Key Vault secrets on a regular schedule — use Key Vault's built-in rotation policies where available

## Service Connection Security
- Use workload identity federation (OIDC) for Azure service connections — no secrets to manage or rotate
- For non-Azure services, use the most restrictive credential type available (tokens over passwords, scoped keys over admin keys)
- Restrict service connection access to specific pipelines — click "Security" on each connection and remove "all pipelines" access
- Audit service connection usage regularly — check which pipelines use which connections and revoke unused access
- Document service connection owners — each connection should have a responsible team for credential management

## Branch Policies
- Require pull request reviews for changes to \`azure-pipelines.yml\` and template files — treat pipeline config as security-critical code
- Configure build validation policies: require a successful CI build before merging to protected branches
- Use branch policies to restrict which branches can trigger deployment stages — production deploys only from \`main\` or \`release/*\`
- Enable "Reset code reviewer votes when there are new changes" to prevent stale approvals

## Runtime Parameter Validation
- Use \`parameters:\` with explicit types and allowed values — prevent injection of malicious values
- Use \`values:\` constraint on string parameters: \`values: ['dev', 'staging', 'production']\` — validates before execution
- Use \`type: boolean\` for flags — avoids string parsing issues and injection vectors
- Validate parameter values in scripts before use: never interpolate raw parameters into shell commands without validation
- Use \`\${{ parameters.name }}\` (compile-time) not \`$(name)\` (runtime) for parameters — compile-time catches issues earlier

## Agent Pool Security
- Use Microsoft-hosted agents for standard CI/CD — they are ephemeral, isolated, and maintained by Microsoft
- For self-hosted agents: run in containers, use ephemeral agents, restrict to specific projects/pipelines
- Never run self-hosted agents as root or with admin privileges — use dedicated service accounts with minimal permissions
- Tag agent pools by trust level: \`pool-general\` for CI, \`pool-trusted\` for deployments, \`pool-restricted\` for production
- Enable agent pool access restrictions — do not allow all projects to use trusted deployment pools

## Pipeline Security Patterns
- Use \`checkout: none\` on deployment jobs that do not need source code — reduces attack surface
- Use \`extends:\` template with \`required\` templates for organization-wide security policies (mandatory scanning steps)
- Enable pipeline retention policies — old pipeline runs should be cleaned up to reduce data exposure
- Use audit logs to monitor pipeline modifications, service connection changes, and variable group access
- Never use \`$(Build.SourceVersion)\` or \`$(Build.RequestedFor)\` in shell commands without proper quoting — prevents injection
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Azure Pipelines Review Checklist

**Available skill:** \`azure-pipelines-creator\` — use when creating new pipeline configurations.

- Verify multi-stage YAML pipeline is used — flag classic (GUI) pipelines as non-portable and unversioned
- Check that all stages, jobs, and steps have \`displayName:\` for readable pipeline visualization
- Verify \`dependsOn:\` is configured correctly for stage/job ordering — flag missing dependencies that could cause race conditions
- Check that templates are used for repeated pipeline logic — flag copy-pasted stage/job blocks
- Verify template repository references are pinned to specific tags or commits — flag branch references as unstable
- Check that variable groups are used for environment-specific config — flag inline variable definitions for secrets as CRITICAL
- Verify service connections are referenced correctly and documented
- Check that deployment jobs use \`deployment:\` type with \`environment:\` for tracking and approval gates
- Verify \`timeoutInMinutes:\` is set on all jobs — flag jobs without timeout
- Check for proper use of conditions: \`succeeded()\` on dependent stages, branch-based conditions on deployment stages
- Verify runtime parameters use typed \`parameters:\` with \`values:\` constraints where applicable
- Check that agent pools are appropriate — Microsoft-hosted for CI, specific pools for deployment`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Azure Pipelines Security Audit

**Available skill:** \`azure-pipelines-creator\` — use when creating secure pipeline configurations from scratch.

- Check for hardcoded secrets in \`azure-pipelines.yml\` — flag any plaintext tokens, passwords, API keys, or connection strings as CRITICAL
- Verify all secrets are stored in variable groups linked to Azure Key Vault — flag project-level secret variables as insufficient
- Check that service connections use workload identity federation — flag secret-based service connections as rotation risk
- Verify deployment stages use environments with approval gates — unprotected production deployment is CRITICAL
- Check that branch policies restrict which branches can trigger deployment stages
- Verify template repositories are pinned to specific refs — flag default branch references as supply chain risk
- Check for runtime parameter injection: raw \`$(parameter)\` interpolation in \`script:\` blocks without validation is CRITICAL
- Verify self-hosted agent pools are restricted to specific projects — flag "all projects" access as overly permissive
- Check that \`checkout: self\` is not used on forked PR builds — fork builds should not have access to protected resources
- Verify audit logging is enabled for pipeline modifications and service connection changes
- Check for \`extends:\` required templates enforcing organization-wide security scanning
- Audit for data exfiltration: \`script:\` steps sending variable values to external URLs via curl, wget, or Invoke-WebRequest`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Azure Pipelines Documentation Guidelines

**Available skill:** \`azure-pipelines-creator\` — use when scaffolding documented pipeline configurations.

- Document pipeline architecture with a comment block at the top of \`azure-pipelines.yml\` explaining stages, triggers, and prerequisites
- Include inline comments for complex conditions, template parameters, and non-obvious variable references
- Document all required variable groups: group name, linked Key Vault, what secrets it contains, and access restrictions
- Document service connections: connection name, target service, authentication method, and managing team
- Include a pipeline diagram (Mermaid) showing stage progression, job dependencies, and environment approval gates
- Document environment configuration: approval rules, deployment branch policies, exclusive locks, and checks
- Document template interfaces: required parameters, optional parameters with defaults, and expected behavior
- Maintain a changelog for pipeline YAML changes that affect build/deploy behavior or other teams`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Azure Pipelines Migration Guidance

**Available skill:** \`azure-pipelines-creator\` — use when creating replacement pipeline configurations during migration.

- When migrating from classic (GUI) pipelines to YAML: export the classic definition as reference, map task groups to templates, agent phases to jobs, variable groups remain the same
- When migrating from GitHub Actions: map workflows to stages, jobs to jobs, actions to tasks or script steps, secrets to variable groups, matrix to strategy
- When migrating from Jenkins: map Jenkinsfile stages to Azure stages, shared libraries to templates, credentials to variable groups/Key Vault, agents to pools
- When migrating from GitLab CI: map stages to Azure stages, \`include:\` to template references, CI/CD variables to variable groups, \`rules:\` to conditions
- When migrating to workload identity federation: create managed identity, configure federated credential for Azure DevOps, update service connection, remove old secret-based connection
- When migrating to environments with approvals: create environments in Azure DevOps, configure approval gates, update deployment jobs to use \`deployment:\` type with \`environment:\`
- When consolidating templates: extract common pipeline patterns into a dedicated template repository, version with git tags, reference via \`resources: repositories:\`
- When migrating from self-hosted to Microsoft-hosted agents: verify required tools are pre-installed on Microsoft-hosted images, adjust paths, remove custom agent configuration steps`,
      },
    ],
    skills: [
      {
        name: 'azure-pipelines-creator',
        description: 'Create well-structured, secure Azure Pipelines configurations following best practices',
        content: `# Azure Pipelines Creator

---
context: fork
allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
---

## Purpose
Create production-ready Azure Pipelines YAML configurations following security best practices, proper multi-stage design, templates, variable groups, and CI/CD patterns.

## Process

### 1. Determine Pipeline Type
Identify the pipeline purpose:
- **CI**: lint, test, build on push/PR
- **CD**: deploy to staging/production on merge or tag
- **Release**: build, package, publish on tag push
- **Scheduled**: nightly scans, maintenance tasks
- **Template**: reusable pipeline logic consumed by other pipelines

### 2. Configure Triggers
\`\`\`yaml
trigger:
  branches:
    include:
      - main
      - release/*
  paths:
    include:
      - src/**
      - package.json

pr:
  branches:
    include:
      - main
  paths:
    include:
      - src/**
\`\`\`

### 3. Define Variables
\`\`\`yaml
variables:
  - group: vars-common
  - name: buildConfiguration
    value: 'Release'
  - \${{ if eq(variables['Build.SourceBranch'], 'refs/heads/main') }}:
    - group: vars-production
\`\`\`

### 4. Define Stages
\`\`\`yaml
stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: BuildJob
        displayName: 'Build'
        pool:
          vmImage: 'ubuntu-latest'
        timeoutInMinutes: 15
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: npm ci
            displayName: 'Install dependencies'
          - script: npm run build
            displayName: 'Build'
          - script: npm test
            displayName: 'Run tests'
          - publish: $(System.DefaultWorkingDirectory)/dist
            artifact: build-output
\`\`\`

### 5. Define Deployment Stage
\`\`\`yaml
  - stage: DeployProduction
    displayName: 'Deploy to Production'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProd
        displayName: 'Deploy to Production'
        pool:
          vmImage: 'ubuntu-latest'
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: build-output
                - script: ./deploy.sh production
                  displayName: 'Deploy'
\`\`\`

### 6. Use Templates
\`\`\`yaml
# In main pipeline
resources:
  repositories:
    - repository: templates
      type: git
      name: MyProject/pipeline-templates
      ref: refs/tags/v2.0

stages:
  - template: stages/build.yml@templates
    parameters:
      nodeVersion: '20.x'
      buildCommand: 'npm run build'
\`\`\`

### 7. Configure Matrix Strategy
\`\`\`yaml
strategy:
  matrix:
    linux-node18:
      vmImage: 'ubuntu-latest'
      nodeVersion: '18.x'
    linux-node20:
      vmImage: 'ubuntu-latest'
      nodeVersion: '20.x'
    windows-node20:
      vmImage: 'windows-latest'
      nodeVersion: '20.x'
  maxParallel: 3
\`\`\`

## Security Checklist
- [ ] No secrets hardcoded in pipeline YAML
- [ ] All secrets in variable groups linked to Azure Key Vault
- [ ] Service connections use workload identity federation where possible
- [ ] Deployment stages use environments with approval gates
- [ ] Branch policies restrict deployment triggers
- [ ] Template repos pinned to specific tags/commits
- [ ] Runtime parameters have type constraints and value validation
- [ ] Self-hosted agent pools restricted to specific projects
- [ ] \`checkout: none\` on deployment jobs that don't need source
- [ ] No raw parameter interpolation in script blocks without validation

## Quality Checklist
- [ ] Multi-stage YAML pipeline (not classic)
- [ ] \`displayName:\` on every stage, job, and step
- [ ] \`timeoutInMinutes:\` set on all jobs
- [ ] \`dependsOn:\` and \`condition:\` configured correctly
- [ ] Templates used for reusable logic
- [ ] Variable groups per environment
- [ ] Matrix strategy for multi-configuration testing
- [ ] Artifacts published and downloaded between stages
- [ ] Environments configured with deployment tracking
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "(azure-pipelines\\.yml|\\.azure-pipelines/.*\\.yml)$" && grep -nEi "(password|token|secret|api_key|private_key|access_key)\\s*[:=]\\s*[\"].+" "$FILE_PATH" | head -1 | grep -q "." && { echo "Hardcoded secret detected in Azure Pipelines config — use variable groups linked to Azure Key Vault instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for hardcoded secrets in Azure Pipelines configuration',
          },
        ],
      },
    ],
  },
};
