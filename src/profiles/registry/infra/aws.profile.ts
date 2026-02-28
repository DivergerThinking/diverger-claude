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

- Follow the principle of least privilege for all IAM policies
- Use IAM roles instead of long-lived access keys
- Enable versioning and encryption on all S3 buckets
- Use environment variables or AWS Systems Manager Parameter Store for configuration
- Keep Lambda functions small and focused on a single responsibility
- Use CloudFormation or Terraform for infrastructure as code - no manual console changes
- Enable CloudTrail logging for audit and compliance
- Tag all resources consistently for cost allocation and organization
- Use VPC endpoints for private access to AWS services
- Prefer managed services over self-hosted alternatives when appropriate`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(aws:*)',
          'Bash(sam:*)',
          'Bash(cdk:*)',
          'Bash(npx cdk:*)',
        ],
        deny: [
          'Bash(aws iam create-access-key:*)',
          'Bash(aws sts get-session-token:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/aws-conventions.md',
        governance: 'mandatory',
        description: 'AWS best practices and conventions',
        content: `# AWS Conventions

## IAM
- Follow least privilege: grant only permissions needed for the task
- Use IAM roles for EC2 instances, Lambda functions, and ECS tasks
- Never use root account for daily operations
- Use AWS Organizations and SCPs for multi-account governance
- Enable MFA on all human user accounts
- Review and audit IAM policies regularly
- Use IAM Access Analyzer to identify unused permissions

## S3
- Enable server-side encryption (SSE-S3 or SSE-KMS) on all buckets
- Enable versioning for critical data buckets
- Block public access by default - use bucket policies for explicit access
- Configure lifecycle policies for cost optimization
- Use S3 access points for application-level access control
- Enable access logging for audit trails

## Lambda
- Keep functions focused on a single responsibility
- Set appropriate memory and timeout configurations
- Use environment variables for configuration, not hardcoded values
- Use Lambda layers for shared dependencies
- Implement structured logging with correlation IDs
- Use reserved concurrency for critical functions
- Handle cold starts with provisioned concurrency for latency-sensitive workloads

## Security Best Practices
- Encrypt data at rest and in transit
- Use VPC for network isolation of resources
- Enable AWS Config for compliance monitoring
- Use AWS Secrets Manager for secrets, not environment variables for sensitive values
- Enable GuardDuty for threat detection
- Use Security Hub for centralized security findings
`,
      },
      {
        path: 'infra/aws-tagging.md',
        governance: 'recommended',
        description: 'AWS resource tagging conventions',
        content: `# AWS Resource Tagging

## Required Tags
- \`Environment\`: dev, staging, production
- \`Project\`: project or application name
- \`Owner\`: team or individual responsible
- \`CostCenter\`: for billing allocation

## Optional Tags
- \`ManagedBy\`: terraform, cloudformation, manual
- \`Version\`: application or infrastructure version
- \`Compliance\`: regulatory requirements (HIPAA, SOC2, etc.)

## Guidelines
- Use consistent casing (PascalCase for keys recommended)
- Enforce tagging with AWS Organizations tag policies
- Automate tag compliance checks in CI/CD pipeline
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## AWS-Specific Review
- Check IAM policies follow least privilege principle
- Verify S3 buckets have encryption and public access blocked
- Check Lambda functions have appropriate memory/timeout settings
- Verify no hardcoded AWS credentials in code
- Check for proper use of environment variables vs Secrets Manager
- Verify resource tagging compliance
- Check for proper error handling in Lambda functions`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## AWS Security Review
- Verify IAM policies are scoped to minimum required permissions
- Check for wildcard (*) permissions in IAM policies
- Verify encryption is enabled for all data stores (S3, RDS, DynamoDB)
- Check for public access on S3, RDS, and other resources
- Verify VPC configuration and security group rules
- Check for hardcoded credentials or access keys
- Verify CloudTrail and logging are enabled`,
      },
    ],
  },
};
