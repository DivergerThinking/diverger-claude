import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const terraformProfile: Profile = {
  id: 'infra/terraform',
  name: 'Terraform',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['terraform'],
  contributions: {
    claudeMd: [
      {
        heading: 'Terraform Conventions',
        order: 40,
        content: `## Terraform Conventions

- Use modules for reusable infrastructure components
- Store state remotely (S3 + DynamoDB, Terraform Cloud) - never commit state files
- Use consistent naming conventions with underscores: \`resource_type_purpose\`
- Lock provider versions in \`terraform.lock.hcl\` for reproducibility
- Use \`terraform fmt\` and \`terraform validate\` in CI pipelines
- Define variables with types, descriptions, and validations
- Use data sources to reference existing resources instead of hardcoding IDs
- Separate environments using workspaces or directory-based structure
- Use \`terraform plan\` output in pull request comments for review
- Tag all resources through default_tags or module-level tagging`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(terraform:*)',
          'Bash(tofu:*)',
          'Bash(terragrunt:*)',
          'Bash(tflint:*)',
        ],
        deny: [
          'Read(**/*.tfstate)',
          'Read(**/*.tfstate.backup)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/terraform-conventions.md',
        governance: 'mandatory',
        description: 'Terraform best practices and conventions',
        content: `# Terraform Conventions

## Modules
- Create modules for reusable infrastructure patterns
- Keep modules focused on a single concern (networking, compute, database)
- Define clear input variables with \`type\`, \`description\`, and \`validation\` blocks
- Output useful values for composition with other modules
- Version modules using Git tags for stability
- Use published registry modules for standard patterns, custom modules for organization-specific

## State Management
- Store state remotely with locking (S3 + DynamoDB, GCS, Terraform Cloud)
- Never commit \`.tfstate\` or \`.tfstate.backup\` files to version control
- Use separate state files per environment
- Enable state encryption at rest
- Use \`terraform state\` commands carefully with backup
- Import existing resources rather than recreating them

## Naming
- Use snake_case for resource names: \`aws_instance.web_server\`
- Prefix resources with purpose: \`main\`, \`primary\`, descriptive names
- Use consistent naming across resources of the same type
- Name files by purpose: \`main.tf\`, \`variables.tf\`, \`outputs.tf\`, \`providers.tf\`
- Use \`locals.tf\` for computed values and name construction

## Security
- Never hardcode secrets in Terraform files
- Use sensitive variable markers: \`sensitive = true\`
- Store secrets in a vault and reference via data sources
- Enable encryption for all supported resources
- Use \`checkov\` or \`tfsec\` for static security analysis
- Review \`terraform plan\` output for unintended permission changes

## File Structure
- \`main.tf\`: Primary resource definitions
- \`variables.tf\`: Input variable declarations
- \`outputs.tf\`: Output value definitions
- \`providers.tf\`: Provider configuration and version constraints
- \`locals.tf\`: Local value computations
- \`data.tf\`: Data source definitions
- \`versions.tf\`: Required provider versions (alternative to providers.tf)
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Terraform-Specific Review
- Check for proper module structure and variable definitions
- Verify state is configured for remote storage with locking
- Check for hardcoded values that should be variables
- Verify resource naming follows conventions
- Check for missing descriptions on variables and outputs
- Verify provider versions are pinned
- Check for proper use of data sources vs hardcoded IDs
- Verify tagging strategy is applied consistently`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Terraform Security Review
- Check for hardcoded secrets or credentials in .tf files
- Verify sensitive variables are marked as \`sensitive = true\`
- Check for overly permissive security groups or IAM policies
- Verify encryption is enabled for supported resources
- Check for public access configurations on storage and databases
- Verify state file is not committed to version control
- Check for \`tfsec\` or \`checkov\` integration in CI pipeline`,
      },
    ],
  },
};
