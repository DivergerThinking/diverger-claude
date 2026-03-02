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
        heading: 'AWS Cloud Conventions',
        order: 4020,
        content: `## AWS Cloud Conventions

### Well-Architected Framework Principles
- Design for failure: assume every component can fail — use multi-AZ deployments, retries with exponential backoff, and circuit breakers
- Apply the principle of least privilege to ALL IAM policies, security groups, and resource policies
- Automate everything: infrastructure changes go through IaC (CDK, CloudFormation, Terraform) — no manual console changes in production
- Use managed services over self-hosted when possible — let AWS handle undifferentiated heavy lifting (RDS over self-managed DB, Fargate over EC2 for containers)
- Tag all resources consistently for cost allocation, ownership tracking, and automated operations
- Encrypt data at rest (KMS, SSE) and in transit (TLS 1.2+) — no exceptions
- Design for cost awareness: use right-sizing, spot instances, reserved capacity, and Savings Plans
- Enable observability from day one: CloudWatch metrics, alarms, dashboards, and X-Ray tracing

### IAM Security
- Use IAM roles for ALL service-to-service communication — never use long-lived access keys
- Use IAM Identity Center (SSO) for human user access — never create IAM users with console passwords
- Enable MFA on all human accounts, especially the root account
- Scope IAM policies to specific resources and actions — avoid \`Resource: "*"\` and \`Action: "*"\`
- Use conditions in IAM policies: \`aws:SourceIp\`, \`aws:RequestedRegion\`, \`aws:PrincipalOrgID\`
- Use IAM Access Analyzer to identify unused permissions and public/cross-account access
- Use Service Control Policies (SCPs) in AWS Organizations for account-level guardrails
- Use permission boundaries to delegate IAM management without granting full admin
- Rotate credentials regularly and remove unused IAM users, roles, and access keys
- Never use the root account for daily operations — lock it down with MFA hardware token

### S3 Best Practices
- Enable server-side encryption (SSE-S3 or SSE-KMS) on all buckets — use bucket policies to enforce
- Block public access at the account level (\`S3 Block Public Access\`) and bucket level by default
- Enable versioning for critical data buckets — use lifecycle policies to manage version costs
- Use S3 access points for application-level access control instead of complex bucket policies
- Use S3 Intelligent-Tiering or lifecycle policies to move infrequently accessed data to cheaper storage classes
- Enable access logging and CloudTrail data events for audit trails on sensitive buckets
- Use pre-signed URLs for temporary access — never make buckets public for file sharing
- Use multipart upload for files >100MB and transfer acceleration for cross-region uploads

### Lambda Best Practices
- Initialize SDK clients and database connections outside the handler function to reuse across invocations
- Keep functions focused on a single responsibility — under 15 seconds of execution for API-backed functions
- Set appropriate memory (proportional to CPU) and timeout configurations — use AWS Lambda Power Tuning to find optimal settings
- Write idempotent code — Lambda guarantees at-least-once delivery, not exactly-once
- Use environment variables for configuration, AWS Secrets Manager or SSM Parameter Store for secrets
- Use Lambda layers for shared dependencies — keep deployment packages small
- Use structured JSON logging with correlation IDs for distributed tracing
- Use reserved concurrency for critical functions, provisioned concurrency for latency-sensitive workloads
- Never store user data in the execution environment — it persists across invocations and leaks data
- Avoid recursive Lambda invocations — use Step Functions for orchestration
- Cache static assets in \`/tmp\` (up to 10GB ephemeral storage) for subsequent invocations
- Use Powertools for AWS Lambda for idempotency, structured logging, metrics, and tracing

### DynamoDB Best Practices
- Design tables around access patterns — understand query requirements BEFORE creating tables
- Use single-table design when multiple entities share access patterns to minimize latency and cost
- Choose partition keys with high cardinality to distribute workload evenly
- Use composite sort keys for flexible querying (e.g., \`STATUS#TIMESTAMP\`)
- Use Global Secondary Indexes (GSIs) for alternate query patterns — local secondary indexes only if you need strong consistency
- Use on-demand capacity for unpredictable workloads, provisioned with auto-scaling for steady workloads
- Enable point-in-time recovery (PITR) for critical tables
- Use DynamoDB Streams for event-driven architectures and cross-region replication

### Networking & VPC
- Use VPC endpoints (Gateway and Interface) for private access to AWS services — avoid NAT Gateway costs for AWS-to-AWS traffic
- Use private subnets for databases, application servers, and Lambda functions — public subnets only for load balancers and bastion hosts
- Use security groups as the primary network access control — stateful, easier to manage than NACLs
- Follow the principle of least privilege for security groups: specific ports, specific source CIDR or security group references
- Use Transit Gateway for multi-VPC and hybrid connectivity instead of VPC peering at scale
- Enable VPC Flow Logs for network monitoring and security analysis

### Monitoring & Observability
- Create CloudWatch alarms for every critical metric: error rates, latency p99, queue depth, throttling
- Use CloudWatch Contributor Insights to identify top-N contributors to operational issues
- Use AWS X-Ray for distributed tracing across Lambda, API Gateway, and downstream services
- Use CloudWatch Logs Insights for querying structured logs at scale
- Enable AWS Config for configuration compliance monitoring
- Enable GuardDuty for threat detection across accounts
- Use Security Hub for centralized security findings aggregation
- Use AWS Cost Anomaly Detection to catch unexpected spending spikes`,
      },
      {
        heading: 'AWS CDK & Infrastructure as Code',
        order: 4021,
        content: `## AWS CDK & Infrastructure as Code

### CDK Application Structure
- Model infrastructure with Constructs (reusable logical units), deploy with Stacks (deployment units)
- Keep infrastructure code and runtime code (Lambda handlers, Docker images) in the same package for atomic versioning
- Use L2 (curated) and L3 (pattern) constructs over L1 (raw CloudFormation) for safer defaults
- Organize by feature/domain: each construct encapsulates a complete capability (API + Lambda + DynamoDB)
- Start simple and add complexity as requirements evolve — do not over-architect the CDK app upfront

### CDK Best Practices
- Let CDK generate resource names — do not hardcode physical names (prevents duplicate deployments, enables replacement)
- Pass references via construct properties (props), not environment variables inside constructs
- Use \`grant*\` methods for IAM permissions: \`bucket.grantRead(myLambda)\` — generates least-privilege policies automatically
- Separate stateful resources (databases, S3 buckets) from stateless resources (Lambda, API Gateway) into different stacks
- Enable termination protection on stateful stacks
- Commit \`cdk.context.json\` to version control for deterministic synthesis
- Model all environments (dev, staging, production) as separate stacks in the same app — one commit produces all templates
- Make decisions at synthesis time using programming language constructs (if/for), not CloudFormation Conditions or Parameters
- Define removal policies and log retention explicitly — CDK defaults to RETAIN which may cause resource leaks
- Use Aspects for cross-cutting concerns: enforce encryption, validate tagging, audit security groups
- Never perform side effects (API calls, resource modifications) during synthesis

### CDK Security
- Use CDK \`grant*\` methods instead of manually writing IAM policies — they generate least-privilege automatically
- Enforce guardrails with SCPs and permission boundaries, not just CDK wrapper constructs
- Use \`cdk-nag\` for static analysis of CloudFormation templates generated by CDK
- Validate templates with CloudFormation Guard before deployment
- Use CDK Pipelines for automated, auditable deployments with approval stages

### CDK Testing
- Write unit tests asserting logical IDs of stateful resources remain stable (renaming causes replacement)
- Test infrastructure assertions: \`Template.fromStack(stack).hasResourceProperties(...)\`
- Use snapshot tests to catch unintended drift in generated CloudFormation templates
- Test each construct in isolation with mock dependencies

### CloudFormation Best Practices
- Use \`DeletionPolicy: Retain\` on stateful resources (databases, S3 buckets) to prevent accidental data loss
- Use \`UpdateReplacePolicy: Retain\` for resources that cannot be recreated without data loss
- Use stack policies to prevent updates to critical resources
- Use change sets to preview infrastructure changes before applying them
- Use nested stacks or StackSets for multi-account/multi-region deployments
- Export outputs sparingly — cross-stack references create tight coupling and prevent independent stack updates`,
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
        description: 'AWS IAM security, encryption, network isolation, and secret management best practices',
        content: `# AWS Security Best Practices

## Why This Matters
AWS misconfigurations are the leading cause of cloud security breaches. These rules follow the
AWS Well-Architected Security Pillar and IAM best practices documentation to ensure defense in
depth across all AWS resources.

---

## IAM — Identity and Access Management

### Least Privilege (MANDATORY)
Every IAM policy MUST grant only the minimum permissions needed for the task.

### Correct — scoped policy
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject",
      "s3:PutObject"
    ],
    "Resource": "arn:aws:s3:::my-app-uploads/*",
    "Condition": {
      "StringEquals": {
        "aws:PrincipalOrgID": "o-1234567890"
      }
    }
  }]
}
\`\`\`

### Anti-Pattern — overly permissive policy
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:*",
    "Resource": "*"
  }]
}
\`\`\`

### IAM Rules
- Use IAM roles for ALL service-to-service communication — NEVER create long-lived access keys
- Use IAM Identity Center (SSO) for human access — never create IAM users with passwords
- Enable MFA on all human accounts — hardware MFA tokens for root account
- Never use the root account for daily operations
- Use IAM Access Analyzer to identify unused permissions, public access, and cross-account access
- Use Service Control Policies (SCPs) for organization-level guardrails
- Use permission boundaries to safely delegate IAM management
- Review and audit IAM policies quarterly using access last-used information
- Remove unused IAM users, roles, and access keys promptly
- Use IAM policy conditions to restrict by source IP, region, organization, or TLS version

---

## Encryption

### At Rest
- Enable SSE-S3 or SSE-KMS on all S3 buckets — use bucket policies to deny unencrypted uploads
- Enable encryption on RDS, DynamoDB, EBS volumes, EFS, and Kinesis streams
- Use AWS KMS customer-managed keys (CMKs) for fine-grained key rotation and access control
- Enable automatic key rotation on KMS keys (every 365 days)

### In Transit
- Enforce TLS 1.2+ on all endpoints — use \`aws:SecureTransport\` condition in S3 bucket policies
- Use ACM (AWS Certificate Manager) for TLS certificates — auto-renewal, free for AWS services
- Enable HTTPS-only on CloudFront distributions and API Gateway stages
- Use VPC endpoints to keep traffic within the AWS network (no internet traversal)

### Anti-Pattern
\`\`\`json
{
  "Effect": "Allow",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::my-bucket/*"
}
// Problem: allows unencrypted uploads — add condition:
// "Condition": { "StringEquals": { "s3:x-amz-server-side-encryption": "aws:kms" } }
\`\`\`

---

## Network Security

- Use private subnets for databases, application servers, and Lambda functions
- Use VPC endpoints (Gateway for S3/DynamoDB, Interface for other services) for private access
- Scope security groups to specific ports and specific source security groups or CIDRs
- Use NACLs as a secondary defense layer at the subnet boundary — security groups are primary
- Enable VPC Flow Logs for network monitoring and security investigation
- Never use \`0.0.0.0/0\` as source in security groups for production workloads (except ALB port 443)
- Use AWS WAF on CloudFront and ALB for web application protection (SQL injection, XSS, rate limiting)

---

## Secret Management

- Use AWS Secrets Manager for database credentials, API keys, and third-party tokens
- Use SSM Parameter Store (SecureString) for configuration values and non-rotating secrets
- Enable automatic rotation on Secrets Manager secrets (Lambda-based rotation functions)
- Never store secrets in environment variables for Lambda — use Secrets Manager with caching layer
- Never store secrets in S3, DynamoDB, or source code
- Use IAM policies to restrict secret access to specific roles and functions

### Correct — Lambda retrieving secret
\`\`\`typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Initialize outside handler for connection reuse
const client = new SecretsManagerClient({});
let cachedSecret: string | undefined;

export async function handler() {
  if (!cachedSecret) {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: 'my-app/db-credentials' })
    );
    cachedSecret = response.SecretString;
  }
  const credentials = JSON.parse(cachedSecret!);
  // Use credentials...
}
\`\`\`

### Anti-Pattern
\`\`\`typescript
// BAD: secret in environment variable — visible in Lambda console and CloudTrail
export async function handler() {
  const dbPassword = process.env.DB_PASSWORD; // Never do this for sensitive secrets
}
\`\`\`

---

## Logging & Monitoring

- Enable CloudTrail in all regions for API activity auditing — send to centralized S3 bucket with MFA delete
- Enable CloudTrail data events for S3 and Lambda on sensitive resources
- Enable AWS Config for configuration compliance monitoring and drift detection
- Enable GuardDuty for threat detection (cryptocurrency mining, compromised credentials, unusual API calls)
- Enable Security Hub for centralized security findings across Config, GuardDuty, IAM Access Analyzer, and Inspector
- Enable AWS Config rules for CIS Benchmarks and PCI DSS compliance (if applicable)
- Never log sensitive data: access keys, passwords, tokens, PII
`,
      },
      {
        path: 'infra/aws-tagging.md',
        governance: 'recommended',
        description: 'AWS resource tagging strategy for cost allocation, ownership, and automated operations',
        content: `# AWS Resource Tagging Strategy

## Why This Matters
Consistent tagging enables cost allocation, ownership tracking, automated operations (auto-shutdown
of dev resources), compliance auditing, and incident response. AWS cost reports are useless without
proper tagging. These conventions follow AWS tagging best practices.

---

## Required Tags (MANDATORY on all resources)

| Tag Key | Description | Example Values |
|---------|-------------|----------------|
| \`Environment\` | Deployment environment | \`dev\`, \`staging\`, \`production\` |
| \`Project\` | Application or project name | \`payment-service\`, \`user-api\` |
| \`Owner\` | Team or individual responsible | \`platform-team\`, \`backend\` |
| \`CostCenter\` | Billing allocation identifier | \`eng-100\`, \`marketing-200\` |
| \`ManagedBy\` | How the resource is managed | \`cdk\`, \`terraform\`, \`cloudformation\`, \`manual\` |

## Optional Tags

| Tag Key | Description | Example Values |
|---------|-------------|----------------|
| \`Version\` | Application version deployed | \`v2.3.1\`, \`1.0.0\` |
| \`Compliance\` | Regulatory requirements | \`hipaa\`, \`soc2\`, \`pci-dss\`, \`gdpr\` |
| \`DataClassification\` | Data sensitivity level | \`public\`, \`internal\`, \`confidential\`, \`restricted\` |
| \`AutoShutdown\` | Scheduled shutdown eligibility | \`true\`, \`false\` |
| \`BackupSchedule\` | Backup frequency requirement | \`daily\`, \`weekly\`, \`none\` |

---

## Enforcement

### CDK — default tags at stack level
\`\`\`typescript
import { Tags } from 'aws-cdk-lib';

Tags.of(app).add('Project', 'payment-service');
Tags.of(app).add('ManagedBy', 'cdk');
Tags.of(app).add('Owner', 'platform-team');
\`\`\`

### AWS Organizations — tag policies
- Use AWS Organizations tag policies to enforce required tags and allowed values
- Use AWS Config rule \`required-tags\` to detect non-compliant resources
- Use SCPs to deny \`CreateStack\` / \`RunInstances\` without required tags

### Guidelines
- Use PascalCase for tag keys (AWS convention)
- Keep tag values lowercase and consistent
- Automate tag compliance checks in CI/CD pipelines
- Use Cost Allocation Tags in AWS Billing for cost reports by project/team/environment
- Review tag compliance monthly with AWS Config or custom reporting
`,
      },
      {
        path: 'infra/aws-cdk-conventions.md',
        governance: 'recommended',
        description: 'AWS CDK construct design, stack organization, and deployment patterns',
        content: `# AWS CDK Conventions

## Why This Matters
AWS CDK enables infrastructure as code using general-purpose programming languages. Well-structured
CDK code is testable, reusable, and safe to deploy. These conventions follow the official AWS CDK
best practices (docs.aws.amazon.com/cdk/v2/guide/best-practices.html).

---

## Application Structure

### Correct — constructs compose resources, stacks deploy them
\`\`\`typescript
// constructs/api-service.ts — reusable construct
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface ApiServiceProps {
  tableName?: string;
  memorySize?: number;
}

export class ApiService extends Construct {
  public readonly table: dynamodb.Table;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiServiceProps = {}) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const handler = new lambda.Function(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/api'),
      memorySize: props.memorySize ?? 256,
      timeout: cdk.Duration.seconds(15),
      environment: {
        TABLE_NAME: this.table.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    this.table.grantReadWriteData(handler); // Least-privilege IAM

    this.api = new apigateway.RestApi(this, 'Api', {
      deployOptions: { tracingEnabled: true },
    });
    this.api.root.addMethod('ANY', new apigateway.LambdaIntegration(handler));
  }
}
\`\`\`

### Anti-Pattern — everything directly in a stack
\`\`\`typescript
// BAD: all resources in a single stack class — not reusable, hard to test
export class MyStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    // 200 lines of interleaved resource definitions...
    // Problem: cannot reuse, cannot test in isolation, hard to understand
  }
}
\`\`\`

---

## Key Conventions

### Names and References
- Let CDK generate resource names — do not hardcode \`bucketName\`, \`functionName\`, etc.
- Pass references between constructs via properties, not environment variables or SSM lookups during synth
- Use \`cdk.CfnOutput\` for values that external systems need (API URL, queue ARN)

### Stacks
- Separate stateful (DynamoDB, S3, RDS) and stateless (Lambda, API Gateway, Step Functions) resources into different stacks
- Enable termination protection on stateful stacks: \`terminationProtection: true\`
- Model all environments as separate stack instances:
\`\`\`typescript
new ApiStack(app, 'Api-Dev', { env: devEnv, stage: 'dev' });
new ApiStack(app, 'Api-Prod', { env: prodEnv, stage: 'production' });
\`\`\`

### Synthesis Hygiene
- Commit \`cdk.context.json\` to version control for deterministic builds
- Never perform side effects (API calls, file writes) during synthesis
- Use \`if\`/\`for\` in TypeScript instead of CloudFormation Conditions or Parameters

### Testing
\`\`\`typescript
import { Template } from 'aws-cdk-lib/assertions';

test('creates DynamoDB table with PITR enabled', () => {
  const app = new cdk.App();
  const stack = new DataStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
  });
});

test('Lambda function has appropriate timeout', () => {
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Timeout: 15,
    MemorySize: 256,
  });
});
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## AWS-Specific Review Checklist

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
            command: 'node -e "const f=process.argv[1]||\'\';const ext=f.split(\'.\').pop()||\'\';if(!/^(ts|js|json|ya?ml|py|java|go|rs|cs)$/.test(ext))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/AKIA[0-9A-Z]{16}/.test(c))issues.push(\'CRITICAL: AWS access key ID detected (AKIA...) — use IAM roles or environment variables\');if(/[\\x27\\x22][A-Za-z0-9\\/+=]{40}[\\x27\\x22]/.test(c)&&/aws|secret|key/i.test(c))issues.push(\'WARNING: Possible AWS secret access key detected — use IAM roles or Secrets Manager\');if(/(Action|action)[\\x27\\x22:\\s]+[\\x27\\x22]\\*[\\x27\\x22]/.test(c)&&/(Resource|resource)[\\x27\\x22:\\s]+[\\x27\\x22]\\*[\\x27\\x22]/.test(c))issues.push(\'WARNING: IAM policy with Action:* and Resource:* detected — scope to specific actions and resources\');if(/0\\.0\\.0\\.0\\/0/.test(c)&&/(ingress|inbound|security.?group|sg)/i.test(c))issues.push(\'WARNING: Security group with 0.0.0.0/0 ingress — restrict to specific CIDRs\');issues.forEach(i=>console.log(i))" -- "$CLAUDE_FILE_PATH"',
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
            command: 'node -e "const f=process.argv[1]||\'\';if(!/cdk.*\\.ts$|stack.*\\.ts$|construct.*\\.ts$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/bucketName\\s*:/i.test(c)||/functionName\\s*:/i.test(c)||/tableName\\s*:/i.test(c))issues.push(\'INFO: Hardcoded resource name detected — let CDK generate names for safer deployments\');if(/RemovalPolicy\\.DESTROY/.test(c)&&!/test|dev|staging/i.test(f))issues.push(\'WARNING: RemovalPolicy.DESTROY on non-dev file — use RETAIN for production stateful resources\');if(/(new.*Table|new.*Bucket|new.*DatabaseInstance)/.test(c)&&!/encryption|encrypted/i.test(c))issues.push(\'INFO: Stateful resource without explicit encryption configuration — verify encryption is enabled\');issues.forEach(i=>console.log(i))" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
