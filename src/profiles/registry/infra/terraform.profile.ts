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
        order: 4010,
        content: `## Terraform Conventions

### HCL Configuration Language
- Use HashiCorp Configuration Language (HCL) — declarative syntax with blocks, arguments, and expressions
- Blocks define configuration objects: \`resource\`, \`variable\`, \`output\`, \`data\`, \`locals\`, \`module\`, \`provider\`, \`terraform\`
- Use \`terraform fmt\` to enforce canonical formatting on all \`.tf\` files — run before every commit
- Use \`terraform validate\` to check syntax and internal consistency without accessing remote state or providers
- Strings use double quotes only — HCL does not support single quotes
- Use heredoc syntax (\`<<-EOT ... EOT\`) for multi-line strings, indented with \`<<-\` to strip leading whitespace
- Template interpolation uses \`\${expression}\` inside strings — do not interpolate when the entire value is a single reference (\`var.name\` not \`"\${var.name}"\`)
- Use comments: \`#\` for single-line (preferred), \`//\` for single-line (alternative), \`/* */\` for multi-line blocks
- Terraform is whitespace-insensitive between blocks but \`terraform fmt\` enforces 2-space indentation

### File Structure and Organization
- \`main.tf\`: Primary resource definitions — the core infrastructure declarations
- \`variables.tf\`: All input variable declarations with \`type\`, \`description\`, \`default\`, and \`validation\` blocks
- \`outputs.tf\`: All output value definitions with \`description\` and \`sensitive\` attributes
- \`providers.tf\`: Provider configuration blocks with version constraints
- \`versions.tf\`: \`terraform { required_version }\` and \`required_providers\` block (alternative to providers.tf)
- \`locals.tf\`: Local value computations for derived values and name construction
- \`data.tf\`: Data source definitions for referencing existing infrastructure
- \`backend.tf\`: Backend configuration for remote state storage
- Split large \`main.tf\` files by resource domain: \`networking.tf\`, \`compute.tf\`, \`database.tf\`, \`iam.tf\`
- Keep \`terraform.tfvars\` and \`*.auto.tfvars\` out of version control when they contain secrets
- Commit \`.terraform.lock.hcl\` — it pins provider versions for reproducible builds

### Naming Conventions (HashiCorp Style Guide)
- Use \`snake_case\` for all Terraform identifiers: resources, variables, outputs, locals, modules, data sources
- Resource names should describe purpose, not type: \`aws_instance.web_server\` not \`aws_instance.instance1\`
- Use descriptive prefixes when multiple resources of the same type exist: \`primary\`, \`secondary\`, \`internal\`, \`external\`
- Variable names should be noun-based: \`instance_type\`, \`vpc_cidr\`, \`environment\`, \`project_name\`
- Boolean variables should use \`enable_\` or \`is_\` prefix: \`enable_monitoring\`, \`is_production\`
- Output names should describe the exported value: \`vpc_id\`, \`database_endpoint\`, \`load_balancer_dns_name\`
- Module source paths use relative paths for local modules: \`source = "./modules/networking"\`
- Tag keys use consistent casing across the project (prefer PascalCase for AWS tags: \`Environment\`, \`Project\`, \`ManagedBy\`)

### Variables and Type System
- Always declare \`type\` for every variable — never rely on implicit \`any\` typing
- Always provide \`description\` for every variable — it serves as documentation in \`terraform plan\` and module registry
- Use specific types: \`string\`, \`number\`, \`bool\`, \`list(string)\`, \`map(string)\`, \`set(string)\`
- Use \`object({})\` for structured complex inputs with named attributes
- Use \`optional()\` modifier for object attributes that have sensible defaults (Terraform 1.3+)
- Add \`validation\` blocks to catch invalid inputs early — before plan or apply
- Mark sensitive variables with \`sensitive = true\` to prevent values from appearing in plan output or logs
- Use \`default = null\` for truly optional variables instead of empty strings or magic values
- Group related variables using object types rather than many individual flat variables

### Modules
- Create modules for reusable infrastructure patterns — keep modules focused on a single concern
- Follow the standard module structure: \`main.tf\`, \`variables.tf\`, \`outputs.tf\`, \`README.md\`
- Define clear input variables with \`type\`, \`description\`, and \`validation\` blocks
- Output all useful values for composition with other modules (\`id\`, \`arn\`, \`endpoint\`, \`name\`)
- Version modules using Git tags: \`source = "git::https://...?ref=v1.2.0"\`
- Use published Terraform Registry modules for standard patterns; custom modules for organization-specific logic
- Never hardcode provider configurations inside modules — let the caller configure providers
- Use \`terraform-<PROVIDER>-<NAME>\` naming convention for published modules
- Pin module source versions: \`version = "~> 3.0"\` for registry modules, Git ref tags for private modules
- Keep module nesting to 2 levels maximum — deeply nested modules are hard to debug

### State Management
- Store state remotely with locking — S3 + DynamoDB, GCS, Azure Blob, or Terraform Cloud
- Never commit \`.tfstate\` or \`.tfstate.backup\` files to version control — they may contain secrets
- Use separate state files per environment (dev, staging, production) — never share state across environments
- Enable state encryption at rest via the backend configuration
- Use \`terraform state\` commands carefully — always create a backup before state manipulation
- Use \`terraform import\` to bring existing infrastructure under management instead of recreating it
- Use \`terraform state mv\` for refactoring resource addresses without destroying/recreating
- Enable state locking to prevent concurrent modifications (DynamoDB for S3, native for Terraform Cloud)
- Configure \`backend\` block in a dedicated \`backend.tf\` file for clarity

### Providers
- Pin provider versions using \`required_providers\` with version constraints: \`version = "~> 5.0"\`
- Use \`>=\` constraints only for the Terraform core version, \`~>\` for providers (allows patch updates)
- Configure provider aliases for multi-region or multi-account deployments
- Never hardcode credentials in provider blocks — use environment variables, IAM roles, or credential files
- Commit \`.terraform.lock.hcl\` to lock the exact provider versions across team members

### Expressions and Functions
- Use \`for_each\` over \`count\` for creating multiple resources — it produces stable resource addresses
- Use \`for\` expressions for transforming collections: \`[for item in var.list : item.name]\`
- Use \`try()\` for safely accessing nested attributes that may not exist
- Use \`coalesce()\` and \`coalescelist()\` for fallback values instead of conditional expressions
- Use \`lookup()\` with a default value for optional map keys
- Use \`templatefile()\` for complex string templates instead of inline interpolation
- Use \`dynamic\` blocks sparingly — they reduce readability when overused
- Prefer \`one()\` function for data sources that return exactly one result

### Resource Lifecycle
- Use \`lifecycle { prevent_destroy = true }\` for critical resources (databases, encryption keys)
- Use \`lifecycle { create_before_destroy = true }\` for zero-downtime replacements
- Use \`lifecycle { ignore_changes = [tags] }\` only when external systems manage specific attributes
- Use \`moved\` blocks (Terraform 1.1+) for refactoring resource addresses without destroying resources
- Use \`depends_on\` only when Terraform cannot infer the dependency — prefer implicit dependencies via references

### CI/CD Integration
- Run \`terraform fmt -check\` in CI to enforce formatting
- Run \`terraform validate\` in CI to catch configuration errors
- Run \`terraform plan\` and post the output as a PR comment for review
- Require human approval before \`terraform apply\` on production environments
- Use \`-out=plan.tfplan\` to save plans and apply the exact reviewed plan
- Integrate \`tflint\`, \`tfsec\`, or \`checkov\` for static analysis in the CI pipeline
- Use Terraform Cloud or Atlantis for collaborative plan/apply workflows`,
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
        description: 'Terraform HCL conventions, module design, state management, and resource lifecycle',
        content: `# Terraform Conventions

## Why This Matters
Terraform manages critical infrastructure — a misconfigured resource can expose data, incur
costs, or cause outages. These rules follow the HashiCorp Terraform Style Guide
(developer.hashicorp.com/terraform/language/style) and community best practices to ensure
configurations are readable, maintainable, and safe.

---

## File Structure

Every Terraform configuration MUST follow this file organization:

\`\`\`
infrastructure/
  environments/
    dev/
      main.tf
      variables.tf
      outputs.tf
      backend.tf
      terraform.tfvars
    staging/
      main.tf
      ...
    production/
      main.tf
      ...
  modules/
    networking/
      main.tf
      variables.tf
      outputs.tf
      README.md
    compute/
      main.tf
      variables.tf
      outputs.tf
      README.md
\`\`\`

---

## Variable Definitions

### Correct — fully typed variable with validation
\`\`\`hcl
variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, production)"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "instance_config" {
  type = object({
    instance_type = string
    ami_id        = string
    volume_size   = optional(number, 20)
    enable_monitoring = optional(bool, true)
  })
  description = "EC2 instance configuration parameters"
}

variable "database_password" {
  type        = string
  description = "Master password for the RDS instance"
  sensitive   = true

  validation {
    condition     = length(var.database_password) >= 16
    error_message = "Database password must be at least 16 characters."
  }
}
\`\`\`

### Anti-Pattern — untyped, undescribed variables
\`\`\`hcl
# BAD: no type, no description, no validation
variable "env" {}

variable "db_pass" {
  default = "changeme"
  # Problem: default password in source code, no type safety, no validation
}

variable "config" {
  type = any
  # Problem: 'any' type provides no validation or documentation
}
\`\`\`

---

## Resource Naming

### Correct — descriptive snake_case names
\`\`\`hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
}

resource "aws_subnet" "private_application" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "\${var.project_name}-private-app-\${var.availability_zones[count.index]}"
    Tier = "Private"
  })
}
\`\`\`

### Anti-Pattern — numeric or meaningless names
\`\`\`hcl
# BAD: names reveal nothing about purpose
resource "aws_vpc" "vpc1" {
  cidr_block = "10.0.0.0/16"
  # Problem: "vpc1" is meaningless — what is this VPC for?
}

resource "aws_subnet" "subnet" {
  vpc_id     = aws_vpc.vpc1.id
  cidr_block = "10.0.1.0/24"
  # Problem: hardcoded CIDR, no tags, generic name
}
\`\`\`

---

## Module Design

### Correct — well-structured reusable module
\`\`\`hcl
# modules/rds/variables.tf
variable "identifier" {
  type        = string
  description = "Unique identifier for the RDS instance"
}

variable "engine_version" {
  type        = string
  description = "PostgreSQL engine version"
  default     = "16.1"
}

variable "instance_class" {
  type        = string
  description = "RDS instance class"
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  type        = number
  description = "Allocated storage in GiB"
  default     = 20

  validation {
    condition     = var.allocated_storage >= 20 && var.allocated_storage <= 65536
    error_message = "Allocated storage must be between 20 and 65536 GiB."
  }
}

# modules/rds/outputs.tf
output "endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "Connection endpoint for the RDS instance"
}

output "arn" {
  value       = aws_db_instance.main.arn
  description = "ARN of the RDS instance"
}

output "id" {
  value       = aws_db_instance.main.id
  description = "Identifier of the RDS instance"
}
\`\`\`

### Anti-Pattern — monolithic module
\`\`\`hcl
# BAD: module defines VPC, subnets, EC2, RDS, S3, IAM all together
# Problem: violates single responsibility, impossible to reuse networking separately
module "everything" {
  source = "./modules/infrastructure"
  # 30+ variables for unrelated resources
}
\`\`\`

---

## Iteration Patterns

### Correct — for_each with stable keys
\`\`\`hcl
variable "subnets" {
  type = map(object({
    cidr_block        = string
    availability_zone = string
    public            = optional(bool, false)
  }))
}

resource "aws_subnet" "this" {
  for_each = var.subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr_block
  availability_zone       = each.value.availability_zone
  map_public_ip_on_launch = each.value.public

  tags = merge(local.common_tags, {
    Name = "\${var.project_name}-\${each.key}"
  })
}
\`\`\`

### Anti-Pattern — count with index-based addressing
\`\`\`hcl
# BAD: count-based — removing an item shifts all indices, causing destroy/recreate
resource "aws_subnet" "this" {
  count = length(var.subnet_cidrs)

  vpc_id     = aws_vpc.main.id
  cidr_block = var.subnet_cidrs[count.index]
  # Problem: removing subnet_cidrs[0] forces recreation of all subsequent subnets
}
\`\`\`

---

## State Management

- ALWAYS use remote state backend with locking enabled
- NEVER commit .tfstate files to version control
- Use separate state per environment (dev, staging, production)
- Enable encryption at rest on the state backend

### Correct — S3 backend with DynamoDB locking
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "environments/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
\`\`\`

---

## Resource Lifecycle

### Correct — protecting critical resources
\`\`\`hcl
resource "aws_db_instance" "production" {
  # ... configuration ...

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_launch_template" "web" {
  # ... configuration ...

  lifecycle {
    create_before_destroy = true
  }
}

# Terraform 1.1+ — refactoring without destroy
moved {
  from = aws_instance.web_server
  to   = aws_instance.application_server
}
\`\`\`
`,
      },
      {
        path: 'infra/terraform-security.md',
        governance: 'mandatory',
        description: 'Terraform security hardening, secret management, and infrastructure safety patterns',
        content: `# Terraform Security

## Why This Matters
Terraform configurations define the security posture of your entire infrastructure. A single
misconfigured resource can expose databases to the internet, grant excessive IAM permissions,
or leak secrets in state files. These rules align with HashiCorp security guidance, CIS
benchmarks, and infrastructure security best practices.

---

## Secret Management (MANDATORY)

### Never Hardcode Secrets in Terraform Files
\`\`\`hcl
# CORRECT: use variables marked as sensitive
variable "database_password" {
  type        = string
  description = "RDS master password"
  sensitive   = true
}

resource "aws_db_instance" "main" {
  password = var.database_password
  # Value injected via environment variable, tfvars file, or secret manager
}

# CORRECT: reference secrets from a vault
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "production/database/master-password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}
\`\`\`

### Anti-Pattern — secrets in source code
\`\`\`hcl
# BAD: password hardcoded — visible in source control, plan output, and state file
resource "aws_db_instance" "main" {
  password = "SuperSecret123!"
  # Problem: secret in source, in state, in CI logs
}

# BAD: default value for sensitive variable
variable "api_key" {
  default = "sk-abc123def456"
  # Problem: default persisted in version control
}
\`\`\`

---

## State File Security

- State files contain ALL resource attributes including passwords, keys, and certificates
- ALWAYS enable encryption at rest on the state backend
- ALWAYS restrict access to the state backend with IAM policies or RBAC
- NEVER store state locally in production — use remote backends
- NEVER commit \`.tfstate\` or \`.tfstate.backup\` to version control
- Add \`.tfstate\` and \`.tfstate.backup\` to \`.gitignore\`

### Correct — secure state backend
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true                          # SSE-S3 encryption at rest
    dynamodb_table = "terraform-state-lock"        # Prevent concurrent modifications
    # Access restricted via S3 bucket policy and IAM
  }
}
\`\`\`

---

## IAM and Access Control

### Principle of Least Privilege
\`\`\`hcl
# CORRECT: specific actions on specific resources
resource "aws_iam_policy" "app_s3_access" {
  name = "app-s3-read-only"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.app_data.arn,
          "\${aws_s3_bucket.app_data.arn}/*"
        ]
      }
    ]
  })
}
\`\`\`

### Anti-Pattern — overly permissive IAM
\`\`\`hcl
# BAD: wildcard actions and resources
resource "aws_iam_policy" "admin" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "*"
        Resource = "*"
        # Problem: grants full admin access — violates least privilege
      }
    ]
  })
}
\`\`\`

---

## Network Security

### Correct — restrictive security groups
\`\`\`hcl
resource "aws_security_group" "web" {
  name_prefix = "\${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "\${var.project_name}-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from application tier only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    # Only the web tier can access the database
  }

  tags = local.common_tags
}
\`\`\`

### Anti-Pattern — open security groups
\`\`\`hcl
# BAD: database open to the entire internet
resource "aws_security_group" "database" {
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    # Problem: database accessible from any IP address
  }
}
\`\`\`

---

## Encryption

- Enable encryption for all storage resources: S3 buckets, EBS volumes, RDS instances, DynamoDB tables
- Enable encryption in transit: TLS for load balancers, SSL for databases
- Use KMS customer-managed keys for sensitive workloads
- Enforce S3 bucket policies that deny unencrypted uploads

### Correct — encryption at rest and in transit
\`\`\`hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data_encryption.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
\`\`\`

---

## Static Analysis Tools

- Run \`tfsec\` or \`checkov\` in CI to catch security misconfigurations before apply
- Run \`tflint\` to detect provider-specific errors and deprecated syntax
- Use Sentinel or OPA (Open Policy Agent) for policy-as-code enforcement
- Run \`infracost\` to estimate cost impact of infrastructure changes before apply

---

## Security Checklist

- [ ] No hardcoded secrets in any .tf file
- [ ] All sensitive variables marked with \`sensitive = true\`
- [ ] State backend encrypted and access-controlled
- [ ] .tfstate and .tfstate.backup in .gitignore
- [ ] IAM policies follow least privilege — no wildcard \`*\` on Action or Resource
- [ ] Security groups restrict access to required ports and sources only
- [ ] All storage resources have encryption enabled (S3, EBS, RDS, DynamoDB)
- [ ] S3 buckets block public access by default
- [ ] Static analysis (tfsec/checkov) integrated in CI pipeline
- [ ] Terraform plan output reviewed before apply on production
- [ ] Critical resources have \`prevent_destroy = true\` lifecycle
`,
      },
      {
        path: 'infra/terraform-tagging-strategy.md',
        governance: 'recommended',
        description: 'Resource tagging strategy for cost allocation, ownership tracking, and operational management',
        content: `# Terraform Tagging Strategy

## Why This Matters
Consistent resource tagging enables cost allocation, ownership tracking, environment
identification, compliance auditing, and automated operations. Untagged resources become
orphaned, unattributable costs that are difficult to manage or clean up.

---

## Required Tags

Every Terraform-managed resource MUST include these tags (via \`default_tags\` or module-level):

| Tag Key | Purpose | Example Values |
|---------|---------|----------------|
| \`Project\` | Cost allocation and ownership | \`myapp\`, \`data-pipeline\` |
| \`Environment\` | Environment identification | \`dev\`, \`staging\`, \`production\` |
| \`ManagedBy\` | Identify management method | \`terraform\` |
| \`Owner\` | Team or individual responsible | \`platform-team\`, \`backend-team\` |

## Implementation

### Correct — default_tags on provider + local common tags
\`\`\`hcl
# providers.tf
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

# locals.tf
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.team_name
  }
}
\`\`\`

### Anti-Pattern — inconsistent or missing tags
\`\`\`hcl
# BAD: some resources tagged, some not, inconsistent keys
resource "aws_instance" "web" {
  tags = {
    Name = "web"
    env  = "prod"  # lowercase, inconsistent with other resources
  }
}

resource "aws_s3_bucket" "data" {
  # No tags at all — orphaned cost, unknown ownership
}
\`\`\`

---

## Optional Tags

| Tag Key | Purpose | Example Values |
|---------|---------|----------------|
| \`CostCenter\` | Financial attribution | \`CC-1234\`, \`engineering\` |
| \`DataClassification\` | Security and compliance | \`public\`, \`internal\`, \`confidential\` |
| \`BackupPolicy\` | Automated backup schedules | \`daily\`, \`weekly\`, \`none\` |
| \`ExpirationDate\` | Temporary resource cleanup | \`2024-12-31\` |

---

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
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.tf$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];const lines=c.split(\'\\n\');for(const l of lines){if(/^\\s*(password|secret|api_key|token|private_key)\\s*=\\s*\"[^\"]+\"/.test(l)&&!/var\\./.test(l)&&!/data\\./.test(l)&&!/local\\./.test(l))issues.push(\'CRITICAL: Possible hardcoded secret: \'+l.trim());if(/^\\s*default\\s*=\\s*\"(sk-|AKIA|ghp_|password|secret)/.test(l))issues.push(\'CRITICAL: Secret in variable default: \'+l.trim())}if(/cidr_blocks\\s*=\\s*\\[\\s*\"0\\.0\\.0\\.0\\/0\"\\s*\\]/.test(c)){const m=c.match(/from_port\\s*=\\s*(\\d+)/g);if(m)for(const p of m){const port=p.match(/\\d+/)[0];if([\'3306\',\'5432\',\'27017\',\'6379\',\'6380\',\'9200\',\'11211\'].includes(port))issues.push(\'CRITICAL: Database/cache port \'+port+\' open to 0.0.0.0/0\')}}if(/Action\\s*=\\s*\"\\*\"/.test(c)&&/Resource\\s*=\\s*\"\\*\"/.test(c))issues.push(\'WARNING: IAM policy with Action=* Resource=* — overly permissive\');if(/variable\\s+\"[^\"]+\"\\s*\\{/.test(c)){const vars=c.match(/variable\\s+\"[^\"]+\"\\s*\\{[^}]*\\}/gs)||[];for(const v of vars){if(!/type\\s*=/.test(v))issues.push(\'INFO: Variable without type constraint: \'+v.match(/variable\\s+\"([^\"]+)\"/)[1]);if(!/description\\s*=/.test(v))issues.push(\'INFO: Variable without description: \'+v.match(/variable\\s+\"([^\"]+)\"/)[1])}}issues.forEach(i=>console.log(i))" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.tf$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/(publicly_accessible|public_access)\\s*=\\s*true/.test(c))console.log(\'WARNING: Resource has public access enabled — verify this is intentional\');if(/storage_encrypted\\s*=\\s*false/.test(c))console.log(\'WARNING: Storage encryption explicitly disabled\');if(/deletion_protection\\s*=\\s*false/.test(c)&&/production|prod/.test(f))console.log(\'WARNING: Deletion protection disabled on a production resource\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
