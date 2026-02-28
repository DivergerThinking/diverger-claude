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

- Structure workflows in \`.github/workflows/\` with descriptive file names
- Use reusable workflows for shared CI/CD logic across repositories
- Cache dependencies (node_modules, pip cache, Maven/Gradle) to speed up builds
- Use matrix builds to test across multiple versions and platforms
- Store sensitive values in GitHub Secrets, never in workflow files
- Pin action versions to full SHA hashes for supply chain security
- Use \`concurrency\` groups to cancel redundant workflow runs
- Minimize \`permissions\` to only what each job needs
- Use job outputs and artifacts for cross-job data sharing
- Separate CI (test/lint) from CD (deploy) workflows`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(gh:*)',
          'Bash(act:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/github-actions-conventions.md',
        governance: 'mandatory',
        description: 'GitHub Actions workflow conventions and best practices',
        content: `# GitHub Actions Conventions

## Workflow Structure
- Name workflows descriptively: \`ci.yml\`, \`deploy-production.yml\`, \`release.yml\`
- Use \`on.push\` and \`on.pull_request\` triggers appropriately
- Use path filters to run workflows only when relevant files change
- Use \`workflow_dispatch\` for manual triggers with input parameters
- Keep individual jobs focused on a single concern (lint, test, build, deploy)

## Caching
- Cache package manager dependencies: npm, pip, Maven, Gradle
- Use \`actions/cache\` with appropriate cache keys including lock file hashes
- Use \`actions/setup-node\` / \`actions/setup-python\` built-in caching
- Cache build artifacts between jobs with \`actions/upload-artifact\` / \`actions/download-artifact\`
- Use \`restore-keys\` for partial cache hits as fallback

## Matrix Builds
- Use \`strategy.matrix\` for testing across Node versions, OS, Python versions
- Use \`include\` / \`exclude\` to customize specific matrix combinations
- Set \`fail-fast: false\` to see all matrix failures, not just the first
- Use matrix values in step conditions and configurations

## Secrets
- Store all sensitive values (tokens, keys, passwords) in GitHub Secrets
- Use environment-level secrets for deployment credentials
- Never echo or log secret values
- Use \`GITHUB_TOKEN\` for GitHub API operations within the workflow
- Rotate secrets regularly and audit secret access

## Reusable Workflows
- Define reusable workflows with \`workflow_call\` trigger
- Use \`inputs\` and \`secrets\` parameters for flexibility
- Place shared workflows in a dedicated repository or \`.github\` directory
- Use composite actions for reusable step sequences
- Version reusable workflows with tags for stability
`,
      },
      {
        path: 'infra/github-actions-security.md',
        governance: 'mandatory',
        description: 'GitHub Actions security best practices',
        content: `# GitHub Actions Security

## Supply Chain
- Pin third-party actions to full commit SHA, not tags
- Review action source code before using in workflows
- Use GitHub's dependency review for pull requests
- Prefer official actions (\`actions/*\`) when available

## Permissions
- Set \`permissions\` at workflow level to minimum required
- Use \`permissions: read-all\` as baseline, add write only where needed
- Use \`id-token: write\` only for OIDC-based deployments
- Avoid \`permissions: write-all\` unless absolutely necessary

## Environment Protection
- Use environment protection rules for production deployments
- Require manual approval for sensitive environments
- Restrict deployment branches to main/release branches
- Use environment-specific secrets and variables
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## GitHub Actions-Specific Review
- Check for pinned action versions (full SHA, not tags)
- Verify minimal permissions on workflows and jobs
- Check for proper caching of dependencies
- Verify secrets are not logged or exposed
- Check for concurrency groups to prevent redundant runs
- Verify path filters on triggers to avoid unnecessary runs
- Check for proper artifact usage between jobs`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## GitHub Actions Security Review
- Verify all third-party actions pinned to full SHA
- Check for script injection via untrusted inputs (\`github.event.*.body\`)
- Verify permissions are scoped to minimum required
- Check for secrets exposure in logs or outputs
- Verify environment protection rules on deployment workflows
- Check for \`pull_request_target\` misuse with checkout of PR code`,
      },
    ],
  },
};
