import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const awsProfile: Profile = {
  id: 'infra/aws',
  name: 'AWS',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['aws'],
  contributions: {
    claudeMd: [
      {
        heading: 'AWS Conventions',
        order: 40,
        content: `## AWS Conventions

Cloud-native AWS patterns. IAM least-privilege, infrastructure as code, observability.

**Detailed rules:** see \`.claude/rules/aws/\` directory.

**Key rules:**
- IAM roles with least-privilege policies — never use root or \`*\` permissions
- Use IaC (CDK, SAM, CloudFormation) — no manual console changes in production
- Enable CloudTrail, CloudWatch Logs, and X-Ray for observability
- Encrypt at rest (KMS) and in transit (TLS) for all data stores`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(aws:*)',
          'Bash(aws s3:*)',
          'Bash(aws sts get-caller-identity:*)',
          'Bash(aws cloudformation:*)',
          'Bash(aws lambda:*)',
          'Bash(aws logs:*)',
          'Bash(aws ecr:*)',
          'Bash(sam:*)',
          'Bash(sam build:*)',
          'Bash(sam deploy:*)',
          'Bash(sam local:*)',
          'Bash(cdk:*)',
          'Bash(cdk synth:*)',
          'Bash(cdk deploy:*)',
          'Bash(cdk diff:*)',
          'Bash(npx cdk:*)',
          'Bash(npx aws-cdk:*)',
          'Bash(cdk-nag:*)',
          'Bash(cfn-lint:*)',
        ],
        deny: [
          'Bash(aws iam create-access-key:*)',
          'Bash(aws iam create-user:*)',
          'Bash(aws iam put-user-policy:*)',
          'Bash(aws sts get-session-token:*)',
          'Bash(aws s3 rb:*)',
          'Bash(aws rds delete-db-instance:*)',
          'Bash(aws ec2 terminate-instances:*)',
          'Bash(aws dynamodb delete-table:*)',
          'Bash(aws cloudformation delete-stack:*)',
          'Read(**/.aws/credentials)',
          'Read(**/.aws/config)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/aws-security.md',
        governance: 'mandatory',
        paths: ['**/*.ts', '**/*.py', 'cdk/**/*', 'sam/**/*', 'cloudformation/**/*', 'template.yaml'],
        description: 'AWS IAM security, encryption, network isolation, and secret management best practices',
        content: `# AWS Security Best Practices

## IAM — Identity and Access Management
- Every IAM policy MUST grant only the minimum permissions needed
- Use IAM roles for ALL service-to-service communication — NEVER create long-lived access keys
- Use IAM Identity Center (SSO) for human access — never create IAM users with passwords
- Enable MFA on all human accounts — hardware MFA for root account
- Never use the root account for daily operations
- Use IAM Access Analyzer to identify unused permissions and public access
- Use Service Control Policies (SCPs) for organization-level guardrails
- Use permission boundaries to safely delegate IAM management
- Review and audit IAM policies quarterly; remove unused users, roles, and keys
- Use policy conditions to restrict by source IP, region, organization, or TLS version

## Encryption
- **At Rest**: Enable SSE-S3 or SSE-KMS on all S3 buckets; encrypt RDS, DynamoDB, EBS, EFS, Kinesis
- Use KMS customer-managed keys for fine-grained rotation and access control
- Enable automatic key rotation on KMS keys (every 365 days)
- **In Transit**: Enforce TLS 1.2+ on all endpoints; use \`aws:SecureTransport\` condition on S3
- Use ACM for TLS certificates; enable HTTPS-only on CloudFront and API Gateway
- Use VPC endpoints to keep traffic within the AWS network

## Network Security
- Use private subnets for databases, application servers, and Lambda functions
- Use VPC endpoints (Gateway for S3/DynamoDB, Interface for other services)
- Scope security groups to specific ports and source security groups or CIDRs
- Enable VPC Flow Logs for monitoring and security investigation
- Never use \`0.0.0.0/0\` for production workloads (except ALB port 443)
- Use AWS WAF on CloudFront and ALB for web application protection

## Secret Management
- Use AWS Secrets Manager for DB credentials, API keys, and tokens
- Use SSM Parameter Store (SecureString) for config values and non-rotating secrets
- Enable automatic rotation on Secrets Manager secrets
- Never store secrets in Lambda environment variables — use Secrets Manager with caching
- Never store secrets in S3, DynamoDB, or source code
- Initialize SDK clients outside the handler for connection reuse

## Logging and Monitoring
- Enable CloudTrail in all regions — send to centralized S3 bucket
- Enable AWS Config for compliance monitoring and drift detection
- Enable GuardDuty for threat detection
- Enable Security Hub for centralized security findings
- Never log sensitive data: access keys, passwords, tokens, PII
`,
      },
      {
        path: 'infra/aws-tagging.md',
        governance: 'recommended',
        paths: ['**/*.ts', '**/*.py', 'cdk/**/*', 'sam/**/*', 'cloudformation/**/*', 'template.yaml'],
        description: 'AWS resource tagging strategy for cost allocation, ownership, and automated operations',
        content: `# AWS Resource Tagging Strategy

## Required Tags (MANDATORY on all resources)
- **Environment**: Deployment environment (\`dev\`, \`staging\`, \`production\`)
- **Project**: Application or project name (\`payment-service\`, \`user-api\`)
- **Owner**: Team or individual responsible (\`platform-team\`, \`backend\`)
- **CostCenter**: Billing allocation identifier (\`eng-100\`, \`marketing-200\`)
- **ManagedBy**: How the resource is managed (\`cdk\`, \`terraform\`, \`cloudformation\`, \`manual\`)

## Optional Tags
- **Version**: Application version deployed (\`v2.3.1\`)
- **Compliance**: Regulatory requirements (\`hipaa\`, \`soc2\`, \`pci-dss\`, \`gdpr\`)
- **DataClassification**: Sensitivity level (\`public\`, \`internal\`, \`confidential\`, \`restricted\`)
- **AutoShutdown**: Scheduled shutdown eligibility (\`true\`, \`false\`)
- **BackupSchedule**: Backup frequency (\`daily\`, \`weekly\`, \`none\`)

## Implementation
- Use CDK \`Tags.of(app).add()\` or provider-level \`default_tags\` for automatic tagging
- Use PascalCase for tag keys (AWS convention)
- Keep tag values lowercase and consistent

## Enforcement
- Use AWS Organizations tag policies to enforce required tags and allowed values
- Use AWS Config rule \`required-tags\` to detect non-compliant resources
- Use SCPs to deny \`CreateStack\` / \`RunInstances\` without required tags
- Automate tag compliance checks in CI/CD pipelines
- Use Cost Allocation Tags in AWS Billing for cost reports
- Review tag compliance monthly
`,
      },
      {
        path: 'infra/aws-cdk-conventions.md',
        governance: 'recommended',
        paths: ['**/*.ts', '**/*.py', 'cdk/**/*', 'sam/**/*', 'cloudformation/**/*', 'template.yaml'],
        description: 'AWS CDK construct design, stack organization, and deployment patterns',
        content: `# AWS CDK Conventions

## Application Structure
- Constructs compose resources, stacks deploy them
- Create reusable constructs in \`lib/constructs/\` — each focused on a single concern
- Stacks in \`lib/stacks/\` instantiate constructs with environment-specific config
- Do NOT put all resources directly in a Stack — extract to Constructs for reuse and testability

## Names and References
- Let CDK generate resource names — do NOT hardcode \`bucketName\`, \`functionName\`, etc.
- Pass references between constructs via properties, not env vars or SSM lookups during synth
- Use \`cdk.CfnOutput\` for values external systems need (API URL, queue ARN)

## Stack Organization
- Separate stateful (DynamoDB, S3, RDS) and stateless (Lambda, API Gateway) into different stacks
- Enable \`terminationProtection: true\` on stateful stacks
- Model all environments as separate stack instances with environment-specific props
- Use \`removalPolicy: RETAIN\` on stateful resources (databases, buckets)

## Security
- Use \`grant*\` methods for IAM — never write raw IAM policies in CDK
- Enable encryption on all data stores (DynamoDB, S3, RDS)
- Enable point-in-time recovery on DynamoDB tables
- Enable X-Ray tracing on Lambda and API Gateway
- Set Lambda reserved concurrency to prevent runaway costs
- Use VPC endpoints for AWS service access from private subnets

## Synthesis Hygiene
- Commit \`cdk.context.json\` to version control for deterministic builds
- Never perform side effects (API calls, file writes) during synthesis
- Use \`if\`/\`for\` in TypeScript instead of CloudFormation Conditions or Parameters

## Testing
- Write unit tests with \`Template.fromStack()\` and \`assertions\` library
- Assert encryption is enabled on all data stores
- Assert IAM policies follow least privilege
- Assert stateful resource logical IDs remain stable
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## AWS-Specific Review Checklist

**Available skill:** \`aws-cdk-scaffold\` — use when generating new AWS CDK infrastructure.

### IAM & Security
- Check IAM policies follow least privilege: no \`"Action": "*"\` or \`"Resource": "*"\` unless explicitly justified
- Verify no hardcoded AWS credentials, access keys, or secret keys in source code
- Check Lambda execution roles are scoped to specific resources and actions
- Verify S3 buckets have encryption enabled and public access blocked
- Check for \`aws:SecureTransport\` condition on S3 bucket policies to enforce HTTPS
- Verify security groups do not use \`0.0.0.0/0\` for ingress on non-public ports
- Check that secrets use AWS Secrets Manager or SSM SecureString, not environment variables

### Lambda
- Verify SDK clients and database connections are initialized OUTSIDE the handler (connection reuse)
- Check memory and timeout are configured appropriately (not default 128MB/3s for production)
- Verify handlers are idempotent — duplicate events must not cause data corruption
- Check for recursive invocation patterns — Lambda calling itself is a cost bomb
- Verify structured JSON logging is used with correlation IDs
- Check for Powertools usage for idempotency, logging, metrics, and tracing

### CDK / CloudFormation
- Verify resource names are NOT hardcoded — let CDK generate them
- Check stateful resources (DynamoDB, S3, RDS) have \`removalPolicy: RETAIN\`
- Verify \`cdk.context.json\` is committed for deterministic synthesis
- Check that \`grant*\` methods are used instead of manual IAM policy construction
- Verify stateful and stateless resources are in separate stacks
- Check CDK Aspects or cdk-nag are used for compliance validation

### DynamoDB
- Verify partition key has high cardinality to avoid hot partitions
- Check that single-table design is considered for related entities with shared access patterns
- Verify point-in-time recovery (PITR) is enabled on critical tables
- Check that GSIs are used instead of table scans for alternate query patterns

### Tagging
- Verify all resources have required tags: Environment, Project, Owner, CostCenter, ManagedBy
- Check tag values are consistent (no mixed casing, no typos in environment names)`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## AWS Security Audit Checklist

**Available skill:** \`aws-cdk-scaffold\` — use when generating secure AWS infrastructure from scratch.

### IAM Policy Analysis
- CRITICAL: Flag any IAM policy with \`"Action": "*"\` or \`"Resource": "*"\` — demand specific scoping
- CRITICAL: Flag any hardcoded AWS access keys (AKIA...) or secret keys in source code, config, or IaC
- HIGH: Flag IAM policies without conditions — recommend restricting by region, organization, or source IP
- HIGH: Flag IAM users with long-lived access keys — recommend IAM roles with temporary credentials
- HIGH: Flag any use of root account credentials
- Check for overly permissive AssumeRole trust policies — verify principal restrictions

### Encryption Audit
- CRITICAL: Flag S3 buckets without server-side encryption
- CRITICAL: Flag RDS instances without encryption at rest
- HIGH: Flag missing \`aws:SecureTransport\` condition on S3 bucket policies
- HIGH: Flag DynamoDB tables without encryption (though AWS now enables by default)
- Check that KMS keys have rotation enabled
- Verify ACM certificates are used for TLS — not self-signed certificates

### Network Security
- CRITICAL: Flag security groups with \`0.0.0.0/0\` ingress on SSH (22), RDP (3389), or database ports (3306, 5432, 27017, 6379)
- HIGH: Flag resources in public subnets that should be private (databases, application servers, Lambda)
- HIGH: Flag missing VPC endpoints for services that support them (S3, DynamoDB, Secrets Manager)
- Check for overly permissive NACLs that negate security group restrictions
- Verify VPC Flow Logs are enabled

### Secret Management
- CRITICAL: Flag secrets in Lambda environment variables, CloudFormation parameters, or source code
- HIGH: Flag missing automatic rotation on Secrets Manager secrets
- HIGH: Flag secrets stored in S3, DynamoDB, or SSM (non-SecureString)
- Verify Lambda functions use Secrets Manager caching layer, not direct API calls per invocation

### Logging & Monitoring
- HIGH: Flag missing CloudTrail configuration — must be enabled in all regions
- HIGH: Flag missing GuardDuty — must be enabled for threat detection
- Check that CloudWatch alarms exist for error rates, latency, and throttling
- Verify sensitive data is not logged: access keys, passwords, tokens, PII`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## AWS Documentation Standards

**Available skill:** \`aws-cdk-scaffold\` — use when scaffolding documented AWS projects.

### Architecture Documentation
- Document AWS architecture with diagrams showing: VPC layout, subnets, security groups, service interactions, and data flow
- Include a services inventory table: service name, purpose, region, and criticality level
- Document IAM roles and their permissions scope — which services can assume which roles
- Document encryption strategy: which KMS keys protect which resources

### Deployment Documentation
- Document CDK/CloudFormation stack hierarchy and deployment order
- Include exact deployment commands: \`cdk deploy --all\`, \`aws cloudformation deploy\`
- Document environment-specific configuration: which parameters differ between dev/staging/production
- Document rollback procedures for each deployment type (CDK, Lambda, ECS)
- Include runbook for common operational scenarios (scaling, failover, secret rotation)

### API & Integration Documentation
- Document all API Gateway endpoints: method, path, auth type, request/response format
- Document Lambda function catalog: name, trigger, purpose, timeout, memory, IAM role
- Document event-driven integrations: SQS queues, SNS topics, EventBridge rules, and their consumers
- Document DynamoDB table schemas: partition key, sort key, GSIs, and access patterns

### Cost Documentation
- Document expected monthly cost breakdown by service
- Document auto-scaling configurations and cost implications
- Document reserved capacity and Savings Plans commitments
- Include cost alerts and budget thresholds`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## AWS Migration Assistance

**Available skill:** \`aws-cdk-scaffold\` — use when generating CDK infrastructure for migrated projects.

### AWS SDK v2 to v3 Migration
- Replace monolithic \`aws-sdk\` import with modular clients: \`@aws-sdk/client-s3\`, \`@aws-sdk/client-dynamodb\`
- Update command pattern: \`new S3Client({}).send(new GetObjectCommand({...}))\` instead of \`s3.getObject({...}).promise()\`
- Use \`@aws-sdk/lib-dynamodb\` (DynamoDBDocumentClient) for simplified DynamoDB operations
- Update middleware stack usage — v3 uses a different middleware architecture
- Remove \`AWS.config.update()\` calls — v3 uses per-client configuration

### CloudFormation to CDK Migration
- Map existing CloudFormation resources to L2 constructs where available
- Import existing resources with \`MyConstruct.fromArn()\` or \`MyConstruct.fromLookup()\` to avoid recreation
- Use \`cdk import\` to adopt existing CloudFormation resources into CDK stacks
- Migrate incrementally — start with new resources in CDK, gradually import existing ones
- Preserve logical IDs of stateful resources to avoid replacement

### Lambda Runtime Upgrades
- Check for deprecated runtime usage (Node.js 16, Python 3.8, etc.)
- Update Lambda layers for new runtime compatibility
- Test cold start performance — newer runtimes may have different characteristics
- Update SDK versions bundled in deployment packages
- Check for breaking changes in runtime APIs (Node.js crypto, Python asyncio, etc.)

### Multi-Account Migration
- Use AWS Organizations with SCPs for account-level guardrails
- Use AWS Control Tower for automated account provisioning with guardrails
- Migrate to IAM Identity Center (SSO) for centralized human access
- Use cross-account IAM roles instead of shared credentials
- Use AWS RAM (Resource Access Manager) for sharing resources across accounts`,
      },
    ],
    skills: [
      {
        name: 'aws-cdk-scaffold',
        description: 'Generate production-ready AWS CDK infrastructure with proper security, tagging, and best practices',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# AWS CDK Scaffold

## Purpose
Generate a complete, production-ready AWS CDK project following AWS Well-Architected best practices including proper IAM, encryption, tagging, monitoring, and stack organization.

## Process

### 1. Determine Architecture Pattern
Identify the infrastructure pattern needed:
- **Serverless API**: API Gateway + Lambda + DynamoDB
- **Container Service**: ECS Fargate + ALB + RDS
- **Static Website**: S3 + CloudFront + ACM
- **Event-Driven**: SQS/SNS + Lambda + EventBridge
- **Full-Stack**: Combination of above patterns

### 2. Generate CDK App Structure
\`\`\`
infra/
  bin/
    app.ts                  # CDK app entry point — instantiate stacks per environment
  lib/
    stacks/
      data-stack.ts         # Stateful resources (DynamoDB, S3, RDS)
      api-stack.ts          # Stateless resources (Lambda, API Gateway)
      monitoring-stack.ts   # CloudWatch dashboards, alarms, SNS topics
    constructs/
      api-service.ts        # Reusable construct: API + Lambda + IAM
      data-store.ts         # Reusable construct: DynamoDB table with GSIs
  lambda/
    api/                    # Lambda handler code co-located with infra
      index.ts
  test/
    stacks/
      data-stack.test.ts    # CDK assertion tests
      api-stack.test.ts
  cdk.json
  cdk.context.json          # Committed for deterministic synthesis
\`\`\`

### 3. Apply Security Defaults
- Enable encryption on all data stores (SSE-KMS or SSE-S3)
- Set removal policy to RETAIN on stateful resources
- Use \`grant*\` methods for IAM — never write raw IAM policies
- Enable VPC endpoints for AWS service access
- Enable X-Ray tracing on Lambda and API Gateway
- Set Lambda reserved concurrency to prevent runaway costs

### 4. Apply Tagging
\`\`\`typescript
import { Tags } from 'aws-cdk-lib';

Tags.of(app).add('Project', projectName);
Tags.of(app).add('Environment', stage);
Tags.of(app).add('Owner', teamName);
Tags.of(app).add('ManagedBy', 'cdk');
Tags.of(app).add('CostCenter', costCenter);
\`\`\`

### 5. Add Monitoring
- CloudWatch alarms for: Lambda errors, API Gateway 5xx, DynamoDB throttling, SQS dead-letter queue depth
- CloudWatch dashboard with key metrics
- SNS topic for alarm notifications
- X-Ray tracing for distributed request tracking

### 6. Generate Tests
- Unit tests for each construct using \`Template.fromStack()\`
- Assert stateful resource logical IDs remain stable
- Assert encryption is enabled on all data stores
- Assert IAM policies follow least privilege

## Security Checklist
- [ ] All S3 buckets encrypted with public access blocked
- [ ] All DynamoDB tables encrypted with PITR enabled
- [ ] Lambda execution roles scoped to specific resources
- [ ] VPC endpoints for S3, DynamoDB, Secrets Manager
- [ ] CloudTrail enabled for API auditing
- [ ] Secrets in Secrets Manager, not environment variables
- [ ] Removal policy RETAIN on stateful resources
- [ ] Tags applied to all resources
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
            command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';const ext=f.split(\'.\').pop()||\'\';if(!/^(ts|js|json|ya?ml|py|java|go|rs|cs)$/.test(ext))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/AKIA[0-9A-Z]{16}/.test(c))issues.push(\'CRITICAL: AWS access key ID detected (AKIA...) — use IAM roles or environment variables\');if(/[\\x27\\x22][A-Za-z0-9\\/+=]{40}[\\x27\\x22]/.test(c)&&/aws|secret|key/i.test(c))issues.push(\'WARNING: Possible AWS secret access key detected — use IAM roles or Secrets Manager\');if(/(Action|action)[\\x27\\x22:\\s]+[\\x27\\x22]\\*[\\x27\\x22]/.test(c)&&/(Resource|resource)[\\x27\\x22:\\s]+[\\x27\\x22]\\*[\\x27\\x22]/.test(c))issues.push(\'WARNING: IAM policy with Action:* and Resource:* detected — scope to specific actions and resources\');if(/0\\.0\\.0\\.0\\/0/.test(c)&&/(ingress|inbound|security.?group|sg)/i.test(c))issues.push(\'WARNING: Security group with 0.0.0.0/0 ingress — restrict to specific CIDRs\');issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/cdk.*\\.ts$|stack.*\\.ts$|construct.*\\.ts$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/bucketName\\s*:/i.test(c)||/functionName\\s*:/i.test(c)||/tableName\\s*:/i.test(c))issues.push(\'INFO: Hardcoded resource name detected — let CDK generate names for safer deployments\');if(/RemovalPolicy\\.DESTROY/.test(c)&&!/test|dev|staging/i.test(f))issues.push(\'WARNING: RemovalPolicy.DESTROY on non-dev file — use RETAIN for production stateful resources\');if(/(new.*Table|new.*Bucket|new.*DatabaseInstance)/.test(c)&&!/encryption|encrypted/i.test(c))issues.push(\'INFO: Stateful resource without explicit encryption configuration — verify encryption is enabled\');issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
