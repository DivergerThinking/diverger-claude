import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const googleCloudProfile: Profile = {
  id: 'infra/google-cloud',
  name: 'Google Cloud',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['google-cloud'],
  contributions: {
    claudeMd: [
      {
        heading: 'Google Cloud Conventions',
        order: 42,
        content: `## Google Cloud Conventions

GCP services accessed via official Python client libraries. Use Application Default Credentials (ADC), never hardcode service account keys.

**Detailed rules:** see \`.claude/rules/infra/google-cloud/\` directory.

**Key rules:**
- Use ADC (\`google.auth.default()\`) — never embed service account JSON in code
- Prefer async client libraries (\`AsyncClient\`) for non-blocking I/O
- Store secrets in Secret Manager — never in environment variables or config files
- Use Workload Identity for GKE/Cloud Run instead of exported service account keys`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(gcloud:*)',
          'Bash(gsutil:*)',
          'Bash(bq:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/google-cloud/auth-and-credentials.md',
        paths: ['**/*.py', '**/*.yaml', '**/*.yml'],
        governance: 'mandatory',
        description: 'Google Cloud authentication and credential management',
        content: `# Google Cloud Authentication & Credentials

## Application Default Credentials (ADC)
- Always use ADC — never hardcode or embed service account JSON keys in code or environment variables
- Local development: \`gcloud auth application-default login\`
- Cloud Run / GKE: attach the service account to the resource — credentials are injected automatically
- Use Workload Identity Federation for GKE instead of exporting service account keys

## Credential Scopes
- Use minimal OAuth scopes: \`https://www.googleapis.com/auth/cloud-platform\` is too broad for most uses
- Prefer service-specific scopes (e.g., \`https://www.googleapis.com/auth/devstorage.read_only\`)
- Use IAM conditions to restrict access by time, resource, or request attributes

## Secret Manager
- Store all secrets (API keys, DB passwords, tokens) in Secret Manager — never in env vars, config files, or code
- Access secrets via \`google-cloud-secret-manager\`: \`client.access_secret_version(name=...)\`
- Pin to a specific version in production — never use \`latest\` in production deployments
- Rotate secrets regularly and update Secret Manager — never update code to change a secret

## Service Account Hygiene
- Follow least privilege: grant only the IAM roles the service actually needs
- Never grant \`roles/owner\` or \`roles/editor\` to application service accounts
- Prefer predefined roles over primitive roles (Owner/Editor/Viewer)
- Audit service account keys regularly — prefer keyless auth (Workload Identity) where possible
`,
      },
      {
        path: 'infra/google-cloud/storage-and-data.md',
        paths: ['**/*.py'],
        governance: 'mandatory',
        description: 'Google Cloud Storage and data service patterns',
        content: `# Google Cloud Storage & Data

## Cloud Storage (GCS)
- Use \`google-cloud-storage\` client — never call GCS REST API directly
- Prefer streaming for large files: \`blob.open("rb")\` instead of \`blob.download_as_bytes()\`
- Always set \`Content-Type\` when uploading — do not rely on auto-detection
- Use signed URLs for temporary, scoped access — never make buckets/objects public unless intentional
- Enable object versioning on buckets storing critical data
- Set lifecycle policies to auto-delete temporary or expired objects

## BigQuery
- Use parameterized queries — never interpolate user input into query strings (SQL injection)
- Use \`job_config.query_parameters\` for all variable substitution
- Always specify \`location\` when creating jobs — avoid relying on defaults
- Use partitioned tables for time-series data; cluster on high-cardinality filter columns
- Set \`maximum_bytes_billed\` on queries to prevent runaway costs

## Firestore
- Use server timestamps (\`SERVER_TIMESTAMP\`) — never client-side timestamps for ordering
- Batch writes with \`batch.commit()\` for atomic multi-document operations
- Use transactions for read-modify-write operations to prevent race conditions
- Design for Firestore limits: max 1 write/sec per document, max 1 MiB per document
`,
      },
      {
        path: 'infra/google-cloud/vertex-ai.md',
        paths: ['**/*.py'],
        governance: 'recommended',
        description: 'Vertex AI and Generative AI patterns',
        content: `# Vertex AI & Generative AI

## Vertex AI SDK
- Initialize once per process: \`vertexai.init(project=PROJECT_ID, location=LOCATION)\`
- Use \`GenerativeModel\` for Gemini: \`model = GenerativeModel("gemini-1.5-pro")\`
- Always set \`generation_config\` with explicit \`max_output_tokens\` and \`temperature\`
- Use \`safety_settings\` to configure content filters — do not disable without justification

## Streaming
- Prefer \`generate_content_async\` with streaming for long responses: \`async for chunk in response\`
- Handle \`StopCandidateException\` for safety-filtered responses
- Always check \`finish_reason\` before processing the response

## Cost and Quota Management
- Track token usage via \`response.usage_metadata\` — log input/output tokens per request
- Implement client-side rate limiting to stay within quota limits
- Cache responses for identical prompts using a content-addressable cache
- Set project-level budget alerts in GCP Billing

## Model Versioning
- Pin to a specific model version in production (e.g., \`gemini-1.5-pro-001\`) — not the alias
- Test model updates in staging before switching production traffic
- Document the model version and prompt version together in version control
`,
      },
      {
        path: 'infra/google-cloud/cloud-run.md',
        paths: ['Dockerfile', 'docker-compose*.yml', '**/*.yaml'],
        governance: 'recommended',
        description: 'Cloud Run deployment patterns',
        content: `# Google Cloud Run

## Container Requirements
- Listen on \`$PORT\` (injected by Cloud Run, default 8080) — never hardcode the port
- Handle \`SIGTERM\` for graceful shutdown: drain in-flight requests within the deadline (default 10s)
- Start fast: minimize startup time — Cloud Run bills from container start to first response
- Use a non-root user in Dockerfile — Cloud Run supports rootless containers

## Configuration
- Pass config via environment variables — never bake secrets into the image
- Use Secret Manager + Cloud Run secret integration: mount secrets as env vars or volumes
- Set \`--concurrency\` based on service capacity — default 80 concurrent requests per instance
- Set \`--max-instances\` to cap scaling and control costs

## Health Checks
- Implement \`/health\` (liveness) and \`/ready\` (readiness) endpoints
- Return 200 for healthy, 503 for unhealthy — Cloud Run uses HTTP health checks
- Liveness check: is the process alive? Readiness check: is the service ready to handle traffic?

## Networking
- Use VPC connector for private resource access (Cloud SQL, Memorystore, internal services)
- Use Cloud Run domain mapping or a load balancer for custom domains with managed TLS
- Configure \`--ingress=internal\` for internal-only services — not accessible from the internet
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Google Cloud-Specific Review
- Verify ADC is used for authentication — flag any hardcoded service account keys, JSON key files in code, or credentials in env vars
- Check Secret Manager is used for all secrets — flag any API keys or passwords in config files or environment variables
- Verify GCS uploads set explicit Content-Type — flag missing content type
- Check BigQuery queries use parameterized queries — flag any string interpolation in SQL
- Verify Cloud Run services listen on \`$PORT\` — flag hardcoded port numbers
- Check Vertex AI calls set explicit \`max_output_tokens\` and \`generation_config\`
- Verify IAM roles follow least privilege — flag \`roles/owner\` or \`roles/editor\` on application accounts
- Check Firestore operations use transactions for read-modify-write patterns`,
      },
    ],
    skills: [
      {
        name: 'gcloud-scaffold',
        description: 'Scaffold Google Cloud service integration (GCS, Secret Manager, Vertex AI)',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Google Cloud Service Scaffold

Scaffold a Google Cloud service integration following project conventions:

## Steps
1. Identify the GCP service needed (GCS, Secret Manager, Vertex AI, BigQuery, Firestore)
2. Add the client library to pyproject.toml dependencies
3. Create a service wrapper class that:
   - Initializes the client using ADC (no hardcoded credentials)
   - Exposes async methods for I/O-bound operations
   - Handles GCP API errors with typed exceptions
4. Add Secret Manager integration if the service requires API keys
5. Write unit tests with mocked GCP clients

## Checklist
- [ ] ADC used — no service account JSON in code
- [ ] Async client used where available
- [ ] Secrets in Secret Manager, not env vars
- [ ] GCP exceptions caught and re-raised as domain exceptions
- [ ] Unit test with \`unittest.mock.patch\` on the GCP client
`,
      },
    ],
  },
};
