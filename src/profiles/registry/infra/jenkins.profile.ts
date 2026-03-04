import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const jenkinsProfile: Profile = {
  id: 'infra/jenkins',
  name: 'Jenkins',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['jenkins'],
  contributions: {
    claudeMd: [
      {
        heading: 'Jenkins Conventions',
        order: 40,
        content: `## Jenkins Conventions

Declarative pipeline automation. Stage-based execution, shared libraries, credentials binding, and post-action handling.

**Detailed rules:** see \`.claude/rules/jenkins/\` directory.

**Key rules:**
- Use declarative pipeline syntax over scripted — cleaner, more maintainable, built-in validation
- Bind credentials via \`credentials()\` helper — never expose secrets in plaintext
- Define shared libraries for reusable pipeline logic across repositories
- Use \`post\` blocks for cleanup, notifications, and artifact archiving`,
      },
    ],
    settings: {
      permissions: {
        allow: [],
      },
    },
    rules: [
      {
        path: 'infra/jenkins-conventions.md',
        governance: 'mandatory',
        paths: ['Jenkinsfile', 'Jenkinsfile.*', 'jenkins/**/*'],
        description: 'Jenkins declarative pipeline structure, stages, agents, shared libraries, credentials, and post actions — mandatory conventions',
        content: `# Jenkins Pipeline Conventions

## Declarative vs Scripted
- Use declarative pipeline syntax (\`pipeline { ... }\`) as the default — it provides structure, validation, and better error messages
- Reserve scripted pipelines (\`node { ... }\`) only for complex logic that declarative cannot express
- When mixing, use \`script { ... }\` blocks inside declarative stages sparingly and document why

## Pipeline Structure
- Start with \`pipeline { }\` block containing \`agent\`, \`stages\`, and \`post\` sections
- Define \`agent\` at pipeline level for the default execution environment; override per stage only when needed
- Use descriptive stage names: \`stage('Build')\`, \`stage('Unit Tests')\`, \`stage('Deploy to Staging')\`
- Keep Jenkinsfile under 200 lines — extract complex logic into shared library steps

## Agent Configuration
- Use \`agent { docker { image '{{docker.buildImage}}' } }\` for reproducible, isolated builds
- Use \`agent { kubernetes { ... } }\` for Kubernetes-based dynamic agents
- Use \`agent { label 'linux' }\` for node-based execution with specific labels
- Set \`agent none\` at pipeline level and specify per stage when stages need different environments

## Stages and Steps
- Order stages logically: Checkout → Build → Test → Static Analysis → Deploy
- Use \`parallel { }\` inside a stage to run sub-stages concurrently (e.g., unit tests and integration tests)
- Keep each stage focused — one responsibility per stage
- Use \`timeout(time: 30, unit: 'MINUTES')\` to prevent hung builds from blocking executors

## Shared Libraries
- Define shared libraries in a separate repository with \`vars/\`, \`src/\`, and \`resources/\` directories
- Configure libraries in Jenkins global settings or in Jenkinsfile with \`@Library('my-lib@v2.0') _\`
- Pin library versions to tags, not branches — \`@Library('my-lib@v2.0')\` not \`@Library('my-lib@main')\`
- Define custom steps in \`vars/myStep.groovy\` with a \`call()\` method for clean invocation syntax

## Credentials Binding
- Use \`withCredentials()\` step to bind secrets to environment variables within a limited scope
- Use \`credentials()\` helper in \`environment { }\` block for declarative-style binding
- Supported types: \`usernamePassword\`, \`string\`, \`file\`, \`sshUserPrivateKey\`, \`certificate\`
- Never reference credentials outside of \`withCredentials\` or \`environment\` blocks

## Post Actions
- Always define \`post { always { ... } }\` for cleanup: archive artifacts, publish test reports, send notifications
- Use \`post { success { ... } }\` for deployment triggers or release tagging
- Use \`post { failure { ... } }\` for alert notifications (Slack, email, PagerDuty)
- Use \`post { cleanup { ... } }\` for workspace cleanup (\`cleanWs()\`) after all other post conditions

## Parameters and Input
- Use \`parameters { }\` block for build parameters: \`string\`, \`choice\`, \`booleanParam\`, \`password\`
- Use \`input { }\` for manual approval gates before deployment stages
- Set default parameter values that make sense for automated triggers
`,
      },
      {
        path: 'infra/jenkins-security.md',
        governance: 'mandatory',
        paths: ['Jenkinsfile', 'Jenkinsfile.*', 'jenkins/**/*'],
        description: 'Jenkins pipeline security — credentials management, script approval, sandbox, access control',
        content: `# Jenkins Pipeline Security

## Credentials Management
- Store ALL secrets in Jenkins Credentials Store — never hardcode tokens, passwords, or API keys in Jenkinsfile
- Use the most restrictive credential scope: prefer folder-level credentials over global credentials
- Bind credentials with \`withCredentials()\` — the binding automatically masks values in console output
- Use \`usernamePassword\` credential type for registry logins; \`string\` for API tokens; \`file\` for certificates and key files
- Rotate credentials on a regular schedule — set calendar reminders for quarterly rotation
- Audit credential usage with Jenkins Audit Trail plugin — track which jobs access which credentials

## Script Security and Sandbox
- Jenkins Groovy Sandbox restricts what pipeline code can execute — do not disable it
- When a script requires approval, review it carefully before approving in "In-process Script Approval"
- Avoid approving broad method signatures like \`method groovy.lang.GString\` — approve only specific methods
- Use declarative pipeline syntax to minimize the need for script approvals
- Shared library code marked with \`@NonCPS\` runs outside the sandbox — audit these methods rigorously

## Access Control
- Use Role-Based Access Control (RBAC) plugin to restrict who can configure and run pipelines
- Restrict "Administer" permission to infrastructure team — never give it to regular developers
- Use folder-level permissions to isolate team pipelines — teams should only access their own folders
- Require authentication for all Jenkins access — disable anonymous read access
- Use project-based matrix authorization for granular per-job permissions

## Pipeline Security Patterns
- Use \`agent { docker { image '...' } }\` to isolate builds — prevent one job from affecting another
- Set \`timeout()\` on all stages to prevent resource exhaustion from hung builds
- Use \`disableConcurrentBuilds()\` on deployment pipelines to prevent race conditions
- Validate all parameters with \`parameters { choice(...) }\` instead of \`string\` when possible — prevent injection
- Never use \`sh "echo $SECRET"\` — the shell expansion can leak values; use \`sh(script: '...', returnStdout: true)\`

## Jenkinsfile Review
- Treat Jenkinsfile as security-critical code — require code review for all changes
- Restrict who can push changes to Jenkinsfile via branch protection rules in your SCM
- Use multibranch pipelines with organization folder scanning to control which repos can run pipelines
- Avoid using the \`load\` step to execute Groovy files from the workspace — they bypass sandbox restrictions
- Pin shared library versions to tags — a compromised library branch can inject malicious code into all pipelines

## Plugin Security
- Keep all Jenkins plugins updated — vulnerabilities in plugins are the most common attack vector
- Remove unused plugins — each plugin expands the attack surface
- Monitor Jenkins Security Advisories (https://www.jenkins.io/security/) for critical updates
- Use the Plugin Manager to check for plugins with known vulnerabilities
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Jenkins Pipeline Review Checklist

**Available skill:** \`jenkins-pipeline-creator\` — use when creating new pipelines.

- Verify declarative pipeline syntax is used — flag scripted pipelines unless complexity justifies them
- Check that credentials are bound via \`withCredentials()\` or \`environment { credentials() }\` — flag any hardcoded secrets as CRITICAL
- Verify all stages have descriptive names and follow a logical order (Build → Test → Deploy)
- Check that shared libraries are pinned to specific tags/versions — flag branch references as unstable
- Verify \`post { always { ... } }\` block exists for cleanup and artifact archiving
- Check for \`timeout()\` on all stages — flag stages without timeout as they can block executors indefinitely
- Verify \`parallel { }\` is used for independent test stages to reduce build time
- Check that \`agent\` is configured appropriately — Docker agents preferred for isolation
- Verify \`input { }\` gates exist before production deployment stages with appropriate approver groups
- Check for \`cleanWs()\` in \`post { cleanup { ... } }\` to prevent workspace disk exhaustion
- Verify parameters use \`choice\` over \`string\` where possible to prevent injection
- Check that Jenkinsfile is under 200 lines — recommend shared library extraction for longer files`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Jenkins Pipeline Security Audit

**Available skill:** \`jenkins-pipeline-creator\` — use when creating secure pipelines from scratch.

- Check for hardcoded credentials in Jenkinsfile — flag any plaintext passwords, tokens, API keys, or connection strings as CRITICAL
- Verify all credentials use \`withCredentials()\` binding with appropriate credential type (\`usernamePassword\`, \`string\`, \`file\`)
- Check for \`sh "echo \${SECRET}"\` patterns — shell expansion can leak masked values to console output
- Verify shared libraries are pinned to tags — flag branch references as supply chain risk
- Check for \`@NonCPS\` annotated methods — these run outside sandbox and must be audited
- Verify \`disableConcurrentBuilds()\` is set on deployment pipelines — concurrent deploys cause race conditions
- Check for \`load\` steps that execute workspace Groovy files — these bypass sandbox restrictions (CRITICAL)
- Verify Docker images used in agents are pinned to specific versions or digests — flag \`:latest\` tags
- Check that \`input\` steps for production deployments restrict submitter via \`submitter:\` parameter
- Verify no stage writes credentials to files without cleaning up in \`post { cleanup }\`
- Check for overly broad script approvals in In-process Script Approval
- Audit for data exfiltration: \`sh\` steps sending variable values to external URLs via curl or wget`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Jenkins Pipeline Documentation Guidelines

**Available skill:** \`jenkins-pipeline-creator\` — use when scaffolding documented pipelines.

- Document pipeline architecture with a comment block at the top of Jenkinsfile explaining purpose, triggers, and prerequisites
- Include inline comments for complex Groovy logic, conditional stages, and non-obvious \`when\` clauses
- Document all required credentials: credential ID, type, scope, and where to configure them in Jenkins
- Document shared library dependencies: library name, version, repository URL, and what steps they provide
- Include a pipeline diagram (Mermaid) showing stage progression, parallel branches, and approval gates
- Document agent requirements: labels, Docker images, resource needs, and any special node configurations
- Document parameter definitions: what each parameter controls, valid values, and default behavior
- Maintain a changelog for Jenkinsfile changes that affect build behavior or deployment procedures`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Jenkins Pipeline Migration Guidance

**Available skill:** \`jenkins-pipeline-creator\` — use when creating replacement pipelines during migration.

- When migrating from freestyle jobs to declarative pipeline: convert build steps to \`stage\`/\`steps\` blocks, post-build actions to \`post { }\`, and build triggers to pipeline triggers
- When migrating from scripted to declarative: wrap logic in \`pipeline { stages { ... } }\`, use \`when { }\` instead of \`if/else\`, move error handling to \`post { failure }\`
- When migrating from GitHub Actions: map jobs to stages, actions to shared library steps or shell commands, secrets to Jenkins credentials, matrix to parallel stages
- When migrating from GitLab CI: map stages directly to Jenkins stages, \`include:\` to shared libraries, CI/CD variables to Jenkins credentials, \`rules:\` to \`when { }\`
- When upgrading shared libraries: bump the \`@Library\` version tag, check for breaking API changes in the library changelog, test in a feature branch first
- When migrating to Blue Ocean UI: ensure pipelines are in multibranch format, use declarative syntax for visual editor compatibility
- When migrating to Kubernetes agents: replace \`agent { label }\` with \`agent { kubernetes { ... } }\`, define pod templates with container blocks, configure resource limits
- When consolidating Jenkinsfiles: extract common patterns into shared library \`vars/*.groovy\` steps, use \`extends\` or \`template\` calls for DRY configuration`,
      },
    ],
    skills: [
      {
        name: 'jenkins-pipeline-creator',
        description: 'Create well-structured, secure Jenkins declarative pipelines following best practices',
        content: `# Jenkins Pipeline Creator

---
context: fork
allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
---

## Purpose
Create production-ready Jenkins declarative pipeline files following security best practices, proper stage design, credentials handling, and CI/CD patterns.

## Process

### 1. Determine Pipeline Type
Identify the pipeline purpose:
- **CI**: lint, test, build on push/PR
- **CD**: deploy to staging/production on merge or tag
- **Release**: build, package, publish on tag push
- **Multibranch**: different behavior per branch pattern
- **Shared Library Step**: reusable pipeline logic

### 2. Configure Agent
\`\`\`groovy
pipeline {
    agent {
        docker {
            image '{{docker.buildImage}}'
            args '-v /tmp:/tmp'
        }
    }
}
\`\`\`

### 3. Define Stages
\`\`\`groovy
stages {
    stage('Build') {
        steps {
            sh '{{lang.installCmd}}'
            sh '{{lang.buildCmd}}'
        }
    }
    stage('Test') {
        parallel {
            stage('Unit Tests') {
                steps { sh 'npm run test:unit' }
            }
            stage('Integration Tests') {
                steps { sh 'npm run test:integration' }
            }
        }
    }
}
\`\`\`

### 4. Bind Credentials Securely
\`\`\`groovy
environment {
    NPM_TOKEN = credentials('npm-publish-token')
    DOCKER_CREDS = credentials('docker-registry')
}
// or
stage('Deploy') {
    steps {
        withCredentials([string(credentialsId: 'api-token', variable: 'TOKEN')]) {
            sh 'deploy --token $TOKEN'
        }
    }
}
\`\`\`

### 5. Configure Post Actions
\`\`\`groovy
post {
    always {
        junit 'reports/**/*.xml'
        archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
    }
    failure {
        slackSend channel: '#ci-alerts', message: "Build failed: \${env.BUILD_URL}"
    }
    cleanup {
        cleanWs()
    }
}
\`\`\`

### 6. Add Manual Approval Gate
\`\`\`groovy
stage('Deploy to Production') {
    when {
        branch 'main'
    }
    input {
        message 'Deploy to production?'
        submitter 'admin,release-team'
    }
    steps {
        sh './deploy.sh production'
    }
}
\`\`\`

### 7. Use Shared Libraries
\`\`\`groovy
@Library('my-shared-lib@v2.0') _

pipeline {
    stages {
        stage('Build') {
            steps {
                myCustomBuildStep(language: 'node', version: '20')
            }
        }
    }
}
\`\`\`

## Security Checklist
- [ ] No hardcoded credentials in Jenkinsfile
- [ ] All secrets bound via \`withCredentials()\` or \`credentials()\`
- [ ] Shared libraries pinned to specific version tags
- [ ] Docker images pinned to specific versions (no \`:latest\`)
- [ ] \`timeout()\` set on all stages
- [ ] \`disableConcurrentBuilds()\` on deployment pipelines
- [ ] \`input\` gates with \`submitter\` restriction on production deploys
- [ ] No \`load\` steps for workspace Groovy files
- [ ] \`cleanWs()\` in \`post { cleanup }\`

## Quality Checklist
- [ ] Declarative syntax used (not scripted)
- [ ] Stages are descriptive and logically ordered
- [ ] Parallel stages for independent test suites
- [ ] Post actions handle success, failure, and cleanup
- [ ] Parameters defined for configurable builds
- [ ] Jenkinsfile under 200 lines (extract to shared library if longer)
- [ ] Inline comments for complex logic
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "(Jenkinsfile|Jenkinsfile\\..+|jenkins/.+)$" && grep -nEi "(password|token|secret|api_key|private_key|access_key)\\s*[=:]\\s*[\"].+" "$FILE_PATH" | head -1 | grep -q "." && { echo "Hardcoded credential detected in Jenkinsfile — use withCredentials() or credentials() binding instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for hardcoded credentials in Jenkins pipeline files',
          },
        ],
      },
    ],
  },
};
