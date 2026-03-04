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

Declarative infrastructure as code. Modules, state management, plan-before-apply.

**Detailed rules:** see \`.claude/rules/terraform/\` directory.

**Key rules:**
- Always \`terraform plan\` before \`apply\` — review changes before infrastructure mutations
- Use modules for reusable components, remote state with locking (S3 + DynamoDB)
- Variables with types and descriptions, outputs for cross-module references
- Naming: \`snake_case\` for resources, descriptive names that include environment`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(terraform:*)',
          'Bash(terraform init:*)',
          'Bash(terraform plan:*)',
          'Bash(terraform validate:*)',
          'Bash(terraform fmt:*)',
          'Bash(terraform state list:*)',
          'Bash(terraform state show:*)',
          'Bash(terraform output:*)',
          'Bash(terraform providers:*)',
          'Bash(terraform graph:*)',
          'Bash(terraform console:*)',
          'Bash(terraform workspace:*)',
          'Bash(tofu:*)',
          'Bash(terragrunt:*)',
          'Bash(tflint:*)',
          'Bash(tfsec:*)',
          'Bash(checkov:*)',
          'Bash(infracost:*)',
          'Bash(terraform-docs:*)',
        ],
        deny: [
          'Read(**/*.tfstate)',
          'Read(**/*.tfstate.backup)',
          'Read(**/.terraform/**)',
          'Bash(terraform apply:*)',
          'Bash(terraform destroy:*)',
          'Bash(terraform state rm:*)',
          'Bash(terraform force-unlock:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/terraform-conventions.md',
        governance: 'mandatory',
        paths: ['**/*.tf', '**/*.tfvars', 'modules/**/*'],
        description: 'Terraform HCL conventions, module design, state management, and resource lifecycle',
        content: `# Terraform Conventions

## File Structure
- Organize per environment: \`environments/{dev,staging,production}/\` each with \`main.tf\`, \`variables.tf\`, \`outputs.tf\`, \`backend.tf\`, \`terraform.tfvars\`
- Reusable modules in \`modules/{name}/\` with \`main.tf\`, \`variables.tf\`, \`outputs.tf\`, \`README.md\`

## Variable Definitions
- Every variable MUST have \`type\` and \`description\` attributes
- Use \`validation\` blocks for variables with constrained values
- Mark sensitive variables with \`sensitive = true\`
- Never use \`type = any\` — provide explicit types
- Never set default values containing secrets or credentials

## Resource Naming
- Use descriptive \`snake_case\` names that reveal purpose (e.g., \`private_application\`, not \`subnet1\`)
- Apply tags via \`local.common_tags\` — never leave resources untagged
- Avoid hardcoded CIDRs, AMIs, or regions — use variables

## Module Design
- Each module focuses on a single concern (networking, compute, database)
- Standard layout: \`main.tf\`, \`variables.tf\`, \`outputs.tf\`
- Expose useful outputs: \`id\`, \`arn\`, \`endpoint\`, \`name\`
- Do not hardcode provider configurations inside modules
- Pin module versions (Git ref or registry version constraint)

## Iteration Patterns
- Use \`for_each\` with stable map keys — never \`count\` for collections that may change order
- \`count\` is acceptable only for conditional resource creation (0 or 1)

## State Management
- ALWAYS use remote state backend with locking enabled (e.g., S3 + DynamoDB)
- NEVER commit .tfstate files to version control
- Use separate state per environment
- Enable encryption at rest on the state backend

## Resource Lifecycle
- Use \`prevent_destroy = true\` on critical resources (databases, S3 buckets)
- Use \`create_before_destroy = true\` for zero-downtime replacements
- Use \`moved\` blocks (Terraform 1.1+) for refactoring without destroy/recreate
`,
      },
      {
        path: 'infra/terraform-security.md',
        governance: 'mandatory',
        paths: ['**/*.tf', '**/*.tfvars', 'modules/**/*'],
        description: 'Terraform security hardening, secret management, and infrastructure safety patterns',
        content: `# Terraform Security

## Secret Management (MANDATORY)
- NEVER hardcode secrets, passwords, API keys, or tokens in .tf files
- Use variables marked with \`sensitive = true\` for credentials
- Reference secrets from vault or secret manager data sources
- Never set default values containing credentials

## State File Security
- State files contain ALL resource attributes including passwords and keys
- ALWAYS enable encryption at rest on the state backend
- ALWAYS restrict access with IAM policies or RBAC
- NEVER store state locally in production — use remote backends
- NEVER commit \`.tfstate\` or \`.tfstate.backup\` to version control
- Add both to \`.gitignore\`

## IAM and Access Control
- Apply principle of least privilege — specific actions on specific resources
- Never use wildcard \`*\` on Action or Resource in IAM policies
- Restrict AssumeRole trust policies to specific principals
- Use IAM roles over long-lived access keys

## Network Security
- Scope security groups to specific ports and source security groups or CIDRs
- Never expose database ports (3306, 5432, 27017, 6379) to \`0.0.0.0/0\`
- Add descriptions on all ingress/egress rules
- Use \`create_before_destroy\` on security groups

## Encryption
- Enable encryption for all storage: S3, EBS, RDS, DynamoDB
- Enable encryption in transit: TLS for load balancers, SSL for databases
- Use KMS customer-managed keys for sensitive workloads
- Enforce S3 bucket policies that deny unencrypted uploads
- Block public access on all S3 buckets by default

## Static Analysis
- Run \`tfsec\` or \`checkov\` in CI before apply
- Run \`tflint\` for provider-specific errors
- Use Sentinel or OPA for policy-as-code enforcement
- Run \`infracost\` for cost impact estimation
`,
      },
      {
        path: 'infra/terraform-tagging-strategy.md',
        governance: 'recommended',
        paths: ['**/*.tf', '**/*.tfvars', 'modules/**/*'],
        description: 'Resource tagging strategy for cost allocation, ownership tracking, and operational management',
        content: `# Terraform Tagging Strategy

## Required Tags
Every Terraform-managed resource MUST include these tags (via \`default_tags\` or module-level):
- **Project**: Cost allocation and ownership (e.g., \`myapp\`, \`data-pipeline\`)
- **Environment**: Environment identification (\`dev\`, \`staging\`, \`production\`)
- **ManagedBy**: Management method (\`terraform\`)
- **Owner**: Team or individual responsible (\`platform-team\`, \`backend-team\`)

## Implementation
- Use provider-level \`default_tags\` block to apply tags to all resources automatically
- Define \`local.common_tags\` for resources that need explicit tag assignment
- Keep tag keys consistent (PascalCase) across all resources
- Never leave resources untagged — orphaned costs are unattributable

## Optional Tags
- **CostCenter**: Financial attribution (\`CC-1234\`, \`engineering\`)
- **DataClassification**: Security and compliance (\`public\`, \`internal\`, \`confidential\`)
- **BackupPolicy**: Automated backup schedules (\`daily\`, \`weekly\`, \`none\`)
- **ExpirationDate**: Temporary resource cleanup (\`2024-12-31\`)

## Enforcement
- Use AWS Organizations Tag Policies or Azure Policy to enforce required tags
- Use \`tflint\` rules or custom Sentinel policies to verify tagging in CI
- Run tag compliance reports regularly to identify untagged resources
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Terraform-Specific Review

**Available skill:** \`terraform-scaffold\` — use when generating new Terraform project structures.

### HCL Code Quality
- Verify all resources use descriptive snake_case names that reveal purpose
- Check that \`terraform fmt\` formatting is applied consistently
- Verify no unnecessary string interpolation: use \`var.name\` not \`"\${var.name}"\` for sole references
- Check for hardcoded values that should be variables (CIDRs, instance types, AMI IDs, region names)
- Verify \`for_each\` is used instead of \`count\` when creating multiple resources with stable keys
- Check for proper use of \`locals\` for derived values and name construction
- Verify \`depends_on\` is not overused — prefer implicit dependencies via references
- Check that \`dynamic\` blocks are not overused where static blocks are clearer

### Variable and Output Quality
- Verify every variable has \`type\` and \`description\` attributes — no untyped variables
- Check for \`validation\` blocks on variables with constrained valid values
- Verify sensitive variables are marked \`sensitive = true\`
- Check that all module outputs include \`description\` attributes
- Verify outputs expose useful values: \`id\`, \`arn\`, \`endpoint\`, \`name\`
- Check that no variable has a default value that contains secrets or credentials

### Module Structure
- Verify modules follow standard layout: main.tf, variables.tf, outputs.tf
- Check that modules are focused on a single concern (networking, compute, database)
- Verify modules do not contain hardcoded provider configurations
- Check that module versions are pinned (Git ref or registry version constraint)

### State and Provider Configuration
- Verify state backend is configured for remote storage with locking
- Check that provider versions are pinned in \`required_providers\`
- Verify \`.terraform.lock.hcl\` is committed to version control
- Check that \`terraform.tfvars\` with secrets is not committed`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Terraform Security Review

**Available skill:** \`terraform-scaffold\` — use when generating secure Terraform configurations from scratch.

### Secret Exposure
- CRITICAL: Check for hardcoded secrets, passwords, API keys, or tokens in any .tf or .tfvars file
- Verify all sensitive variables are marked \`sensitive = true\`
- Check that no variable has a \`default\` value containing credentials
- Verify secrets are retrieved from vault or secret manager data sources, not passed as plain text
- Check that state files (.tfstate, .tfstate.backup) are in .gitignore
- Verify state backend has encryption enabled (\`encrypt = true\` for S3)

### IAM and Access Control
- Check for overly permissive IAM policies: wildcard \`*\` on Action or Resource
- Verify IAM roles follow the principle of least privilege
- Check for IAM policies that grant \`iam:*\`, \`s3:*\`, or \`ec2:*\` — these are almost always too broad
- Verify assume role policies restrict the trusted principals

### Network Security
- Check for security groups with \`0.0.0.0/0\` on database ports (3306, 5432, 27017, 6379)
- Verify security groups have descriptions on all ingress/egress rules
- Check for resources with \`publicly_accessible = true\` on databases or caches
- Verify S3 buckets have public access blocked (\`block_public_acls\`, \`block_public_policy\`)
- Check for unencrypted storage: S3 without SSE, EBS without encryption, RDS without \`storage_encrypted\`

### Infrastructure Safety
- Verify critical resources have \`lifecycle { prevent_destroy = true }\`
- Check that deletion protection is enabled on databases (\`deletion_protection = true\`)
- Verify S3 bucket versioning is enabled for data protection
- Check that CloudTrail or equivalent audit logging is enabled
- Verify no resources are provisioned with default VPC — use purpose-built VPCs

### Static Analysis Integration
- Verify \`tfsec\` or \`checkov\` is configured in the CI pipeline
- Check that \`tflint\` rules are enabled for provider-specific validations
- Verify \`terraform plan\` output is reviewed before apply on production`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Terraform Documentation Standards

**Available skill:** \`terraform-scaffold\` — use when scaffolding documented Terraform modules.

### Module Documentation
- Every module MUST have a README.md with: purpose, usage example, input variables table, outputs table
- Document prerequisites: required providers, minimum Terraform version, required IAM permissions
- Include a complete usage example that can be copy-pasted and works with minimal modification
- Document any assumptions or constraints (required VPC, specific region, naming conventions)

### Variable Documentation
- Every variable must have a \`description\` attribute that explains purpose, valid values, and any constraints
- Document the expected format for complex types (CIDR notation, ARN format, date strings)
- Group related variables with comments in \`variables.tf\`

### Architecture Documentation
- Document the infrastructure topology: what resources are created, how they connect
- Include a diagram or ASCII art showing network topology and resource relationships
- Document state backend setup: bucket name, DynamoDB table, region, access requirements
- Document environment promotion workflow: how changes flow from dev to staging to production

### Operational Documentation
- Document how to run \`terraform plan\` and \`terraform apply\` for each environment
- Document the disaster recovery procedure: state recovery, resource import
- Document on-call procedures for Terraform-managed infrastructure
- Document cost estimation process using \`infracost\` or Terraform Cloud cost estimation`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Terraform Migration Assistance

**Available skill:** \`terraform-scaffold\` — use when generating new project structures during migration.

### Version Upgrades
- Read the official Terraform upgrade guide for the target version
- Check for deprecated syntax: \`count\` on modules (pre-0.13), \`interpolation-only\` expressions
- Use \`terraform 0.13upgrade\` or equivalent upgrade tools when available
- Test upgrades in a non-production environment with a full plan/apply cycle
- Update provider version constraints to compatible ranges after verifying compatibility

### Resource Refactoring
- Use \`moved\` blocks (Terraform 1.1+) to rename resources without destroy/recreate
- Use \`terraform state mv\` for moving resources between state files or modules
- ALWAYS backup state before any state manipulation: \`terraform state pull > backup.tfstate\`
- Use \`terraform import\` to bring existing unmanaged resources under Terraform control
- Verify the plan shows no unexpected destroys after refactoring

### Provider Migration
- When migrating between cloud providers, map resources to equivalents in the target provider
- Use multi-provider configurations during transition periods
- Migrate state files carefully — never mix resources from different providers in the same state

### Module Extraction
- Extract inline resources into reusable modules incrementally
- Use \`moved\` blocks to update resource addresses as they move into modules
- Update all callers to use the new module interface
- Version the extracted module and pin callers to a stable version`,
      },
    ],
    skills: [
      {
        name: 'terraform-scaffold',
        description: 'Generate a production-ready Terraform project structure with modules, backends, and variable definitions',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Terraform Scaffold

Generate a complete, production-ready Terraform project structure including remote state,
module organization, and multi-environment support.

## 1. Project Structure

Create the following directory layout:
\`\`\`
infrastructure/
  environments/
    dev/
      main.tf          # Module calls and resource instantiation
      variables.tf     # Environment-specific variable declarations
      outputs.tf       # Environment outputs
      backend.tf       # Remote state backend config
      terraform.tfvars # Variable values (NOT committed if contains secrets)
    staging/
      main.tf
      variables.tf
      outputs.tf
      backend.tf
      terraform.tfvars
    production/
      main.tf
      variables.tf
      outputs.tf
      backend.tf
      terraform.tfvars
  modules/
    networking/
      main.tf          # VPC, subnets, route tables, NAT gateways
      variables.tf     # Module input variables
      outputs.tf       # Module outputs (vpc_id, subnet_ids, etc.)
      README.md        # Module documentation
    compute/
      main.tf
      variables.tf
      outputs.tf
      README.md
    database/
      main.tf
      variables.tf
      outputs.tf
      README.md
  .gitignore           # Exclude .tfstate, .terraform/, *.tfvars with secrets
  .terraform.lock.hcl  # Committed — locks provider versions
\`\`\`

## 2. Backend Configuration

Generate a backend.tf for each environment:
\`\`\`hcl
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "<company>-terraform-state"
    key            = "environments/<env>/terraform.tfstate"
    region         = "<region>"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
\`\`\`

## 3. Provider Configuration

Generate a providers.tf with pinned versions and default tags:
\`\`\`hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = var.team_name
    }
  }
}
\`\`\`

## 4. Common Variables

Generate a variables.tf template with standard variables:
- \`project_name\` (string, required)
- \`environment\` (string, validated enum)
- \`region\` (string, with default)
- \`team_name\` (string, required)
- \`common_tags\` (map(string), optional)

## 5. .gitignore

Generate a Terraform-specific .gitignore:
\`\`\`
# Terraform state (contains secrets)
*.tfstate
*.tfstate.backup
*.tfstate.*.backup

# Terraform working directory
.terraform/

# Variable files with secrets
*.tfvars
!*.tfvars.example

# Crash log files
crash.log
crash.*.log

# Override files (local overrides)
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# Plan files
*.tfplan
\`\`\`

## 6. Module README Template

Generate a README.md for each module with:
- Module name and description
- Usage example (copy-pasteable)
- Requirements (Terraform version, providers)
- Input variables table (name, type, description, default, required)
- Output values table (name, description)
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.tf$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];const lines=c.split(\'\\n\');for(const l of lines){if(/^\\s*(password|secret|api_key|token|private_key)\\s*=\\s*\"[^\"]+\"/.test(l)&&!/var\\./.test(l)&&!/data\\./.test(l)&&!/local\\./.test(l))issues.push(\'CRITICAL: Possible hardcoded secret: \'+l.trim());if(/^\\s*default\\s*=\\s*\"(sk-|AKIA|ghp_|password|secret)/.test(l))issues.push(\'CRITICAL: Secret in variable default: \'+l.trim())}if(/cidr_blocks\\s*=\\s*\\[\\s*\"0\\.0\\.0\\.0\\/0\"\\s*\\]/.test(c)){const m=c.match(/from_port\\s*=\\s*(\\d+)/g);if(m)for(const p of m){const port=p.match(/\\d+/)[0];if([\'3306\',\'5432\',\'27017\',\'6379\',\'6380\',\'9200\',\'11211\'].includes(port))issues.push(\'CRITICAL: Database/cache port \'+port+\' open to 0.0.0.0/0\')}}if(/Action\\s*=\\s*\"\\*\"/.test(c)&&/Resource\\s*=\\s*\"\\*\"/.test(c))issues.push(\'WARNING: IAM policy with Action=* Resource=* — overly permissive\');if(/variable\\s+\"[^\"]+\"\\s*\\{/.test(c)){const vars=c.match(/variable\\s+\"[^\"]+\"\\s*\\{[^}]*\\}/gs)||[];for(const v of vars){if(!/type\\s*=/.test(v))issues.push(\'INFO: Variable without type constraint: \'+v.match(/variable\\s+\"([^\"]+)\"/)[1]);if(!/description\\s*=/.test(v))issues.push(\'INFO: Variable without description: \'+v.match(/variable\\s+\"([^\"]+)\"/)[1])}}issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.tf$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/(publicly_accessible|public_access)\\s*=\\s*true/.test(c))console.log(\'WARNING: Resource has public access enabled — verify this is intentional\');if(/storage_encrypted\\s*=\\s*false/.test(c))console.log(\'WARNING: Storage encryption explicitly disabled\');if(/deletion_protection\\s*=\\s*false/.test(c)&&/production|prod/.test(f))console.log(\'WARNING: Deletion protection disabled on a production resource\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
