import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const vercelProfile: Profile = {
  id: 'infra/vercel',
  name: 'Vercel',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['vercel'],
  contributions: {
    claudeMd: [
      {
        heading: 'Vercel Conventions',
        order: 40,
        content: `## Vercel Conventions

Edge-first deployment. Serverless/edge functions, environment-based configuration.

**Detailed rules:** see \`.claude/rules/vercel/\` directory.

**Key rules:**
- Use \`vercel.json\` for rewrites, headers, and function configuration
- Environment variables via Vercel dashboard — never commit secrets
- Edge Functions for low-latency, Serverless Functions for compute-heavy tasks
- Preview deployments for every PR — use \`VERCEL_ENV\` to detect environment`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(vercel:*)',
          'Bash(vercel dev:*)',
          'Bash(vercel env:*)',
          'Bash(vercel deploy:*)',
          'Bash(vercel ls:*)',
          'Bash(vercel inspect:*)',
          'Bash(vercel logs:*)',
          'Bash(vercel link:*)',
          'Bash(vercel build:*)',
          'Bash(vercel promote:*)',
          'Bash(vercel rollback:*)',
          'Bash(vercel certs:*)',
          'Bash(vercel dns:*)',
          'Bash(vercel domains:*)',
          'Bash(vercel project:*)',
          'Bash(vercel pull:*)',
          'Bash(vercel whoami:*)',
          'Bash(npx vercel:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/vercel-deployment-conventions.md',
        governance: 'mandatory',
        paths: ['vercel.json', 'api/**/*', '.vercel/**/*'],
        description: 'Vercel deployment configuration, functions, routing, and caching best practices',
        content: `# Vercel Deployment Conventions

## Why This Matters
Vercel deployments are immutable and globally distributed. Proper configuration ensures
fast builds, correct routing, secure headers, and optimal function performance. Mistakes
in vercel.json or function configuration can cause downtime, security vulnerabilities,
or excessive costs from misconfigured function regions and timeouts.

---

## Project Configuration

### vercel.json Structure
\`\`\`json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ],
  "redirects": [
    { "source": "/old-page", "destination": "/new-page", "permanent": true }
  ],
  "crons": [
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
\`\`\`

### Anti-Pattern — missing security headers
\`\`\`json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
\`\`\`
Problem: no security headers configured — vulnerable to XSS, clickjacking, and protocol downgrade attacks.

---

## Function Design

### Correct — Web Standard function with error handling
\`\`\`typescript
// api/users.ts
import { geolocation } from '@vercel/functions';

export async function GET(request: Request) {
  try {
    const { country } = geolocation(request);
    const data = await fetchUsers(country);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
\`\`\`

### Anti-Pattern — leaking secrets and no error handling
\`\`\`typescript
export async function GET(request: Request) {
  const apiKey = 'sk-1234567890abcdef'; // Hardcoded secret
  const data = await fetch(\`https://api.example.com?key=\${apiKey}\`);
  return new Response(JSON.stringify(await data.json()));
  // Problem: hardcoded API key, no error handling, no cache headers, no content-type
}
\`\`\`

---

## Edge Functions

### When to Use Edge Functions
- Authentication and session validation at the edge
- Geolocation-based routing and content personalization
- A/B testing and feature flag evaluation
- Bot detection and rate limiting
- Request/response header manipulation

### When NOT to Use Edge Functions
- Heavy computation or long-running tasks (use Node.js runtime)
- Operations requiring Node.js APIs (fs, child_process, net, crypto.subtle differences)
- Database connections requiring persistent TCP connections (use Node.js with connection pooling)
- Operations exceeding Edge Function size or execution limits

### Correct — Edge middleware for auth
\`\`\`typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
\`\`\`

---

## Caching Strategy

### CDN Cache Headers
\`\`\`typescript
// Static data — cache aggressively
headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }

// Dynamic data — short cache with background revalidation
headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }

// User-specific data — no CDN cache
headers: { 'Cache-Control': 'private, no-store' }

// ISR pages — use revalidate
export const revalidate = 3600; // Revalidate every hour
\`\`\`

### Anti-Pattern — unbounded cache
\`\`\`typescript
headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }
// Problem: caching API responses forever — stale data served to users with no way to purge
// Only use immutable for versioned static assets (CSS, JS bundles with content hashes)
\`\`\`

---

## Region Configuration

- Set \`regions\` in vercel.json to match your data source location to minimize function latency
- Default region is \`iad1\` (Washington, D.C.) — change if your database is elsewhere
- Use \`functionFailoverRegions\` for high-availability critical functions
- Edge Functions run globally at all edge locations — no region configuration needed
- For globally replicated databases, configure multiple regions for functions
`,
      },
      {
        path: 'infra/vercel-security.md',
        governance: 'mandatory',
        paths: ['vercel.json', 'api/**/*', '.vercel/**/*'],
        description: 'Vercel security: environment variables, headers, deployment protection, and secrets management',
        content: `# Vercel Security Best Practices

## Why This Matters
Vercel deployments are publicly accessible by default. Without proper security configuration,
preview deployments can leak unreleased features, API routes can be exploited without
authentication, and secrets can be exposed through client-side code or misconfigured
environment variables.

---

## Environment Variable Security

### Correct — environment scoping
- Store all secrets in Vercel Environment Variables with appropriate scope (Development, Preview, Production)
- Use \`NEXT_PUBLIC_\` prefix ONLY for values safe to expose to the browser (analytics IDs, public API URLs)
- Use Vercel's Sensitive Environment Variables to mask values from logs and the dashboard UI
- Rotate secrets regularly and use different values per environment

### Anti-Pattern — secret exposure
\`\`\`typescript
// BAD: secret in client-accessible code
const API_KEY = process.env.NEXT_PUBLIC_SECRET_API_KEY;
// Problem: NEXT_PUBLIC_ prefix exposes this value in the client bundle

// BAD: committed .env with real values
// .env.local
DATABASE_URL=postgres://admin:realpassword@db.example.com:5432/prod
// Problem: committed to Git, visible to all repository collaborators
\`\`\`

### Correct
\`\`\`typescript
// Server-only environment variable (no NEXT_PUBLIC_ prefix)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

// Client-safe public values
const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID;
\`\`\`

---

## Security Headers

All production deployments MUST include these security headers in vercel.json:

\`\`\`json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "0" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
\`\`\`

Adjust Content-Security-Policy directives based on your application's needs (third-party scripts, CDNs, etc.).

---

## Deployment Protection

- Enable **Deployment Protection** in project settings for preview deployments
- Use Vercel Authentication or password protection for staging environments
- Configure **Trusted IPs** to restrict access to preview deployments by IP range
- Set up **Protection Bypass** headers only for automated testing (CI/CD)
- Use \`x-vercel-protection-bypass\` header with a secret for programmatic access to protected deployments

---

## API Route Security

### Correct — authenticated API route
\`\`\`typescript
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Process authenticated request...
}
\`\`\`

### Anti-Pattern — unprotected API route
\`\`\`typescript
export async function POST(request: Request) {
  const body = await request.json();
  await db.users.delete(body.userId);
  return new Response('Deleted');
  // Problem: no authentication, no authorization, no input validation
  // Any user can delete any account
}
\`\`\`

---

## CORS Configuration

\`\`\`json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://yourdomain.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" },
        { "key": "Access-Control-Max-Age", "value": "86400" }
      ]
    }
  ]
}
\`\`\`

Never set \`Access-Control-Allow-Origin: *\` on API routes that handle authenticated requests or sensitive data.
`,
      },
      {
        path: 'infra/vercel-function-patterns.md',
        governance: 'recommended',
        paths: ['vercel.json', 'api/**/*', '.vercel/**/*'],
        description: 'Vercel function patterns: streaming, Edge Config, cron jobs, and performance optimization',
        content: `# Vercel Function Patterns

## Why This Matters
Vercel Functions are the compute backbone of modern web applications on the platform.
Understanding function patterns, runtime selection, streaming, and caching strategies
is essential for building performant, cost-efficient applications.

---

## Streaming Responses

Use streaming for AI responses, large data sets, and real-time updates:

\`\`\`typescript
// api/stream.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of await generateChunks()) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
\`\`\`

---

## Edge Config for Feature Flags

\`\`\`typescript
// middleware.ts
import { get } from '@vercel/edge-config';

export async function middleware(request: Request) {
  const maintenanceMode = await get('maintenance_mode');

  if (maintenanceMode) {
    return new Response('Service under maintenance', { status: 503 });
  }

  const betaEnabled = await get('beta_features_enabled');
  // Use for A/B testing, feature flags, IP blocking, etc.
}
\`\`\`

---

## Background Work with waitUntil

Use \`waitUntil()\` for tasks that should not block the response:

\`\`\`typescript
import { waitUntil } from '@vercel/functions';

export async function POST(request: Request) {
  const data = await request.json();
  const result = processData(data);

  // Send response immediately
  const response = new Response(JSON.stringify(result), { status: 200 });

  // Log analytics and send notifications in the background
  waitUntil(logAnalytics(data));
  waitUntil(sendNotification(result));

  return response;
}
\`\`\`

---

## Cron Job Functions

\`\`\`typescript
// api/cron/cleanup.ts
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const deletedCount = await cleanupExpiredSessions();
  return new Response(JSON.stringify({ deletedCount }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
\`\`\`

Configure in vercel.json:
\`\`\`json
{
  "crons": [
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
\`\`\`

---

## Function Performance Guidelines

### Cold Start Minimization
- Keep function bundles small — tree-shake unused imports
- Use dynamic imports for heavy dependencies that are not always needed
- Enable fluid compute for I/O-bound functions to reuse warm instances
- Place functions in the region closest to your data source

### Memory and Duration
- Start with the default memory (1024 MB) and increase only if functions fail or timeout
- Set \`maxDuration\` to the minimum necessary — shorter limits prevent runaway costs
- Monitor function execution times in Vercel Observability and optimize hot paths
- Use \`waitUntil()\` for background tasks instead of extending function duration

### Connection Management
- Never create database connections inside the request handler — use module-level singletons
- Use connection pooling services (PgBouncer, Prisma Accelerate, Neon serverless driver)
- Design functions as stateless — no shared mutable state between invocations
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Vercel-Specific Review

**Available skill:** \`vercel-scaffold\` — use when generating new Vercel configurations.

### Configuration
- Check vercel.json for proper $schema reference and valid configuration properties
- Verify framework preset matches the actual project framework
- Verify security headers are configured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Check routing rules (rewrites, redirects) for correctness and no conflicts
- Verify function configuration: appropriate memory, maxDuration, and regions

### Functions
- Verify functions use Web Standard Request/Response APIs
- Check that functions include proper error handling with appropriate HTTP status codes
- Verify Cache-Control headers are set on API responses (s-maxage, stale-while-revalidate)
- Check Edge Function usage for runtime API compatibility (no Node.js APIs in edge runtime)
- Verify middleware matcher patterns are specific — avoid matching all routes unnecessarily
- Check for proper use of waitUntil() for background work instead of blocking responses

### Environment Variables
- Verify no secrets are hardcoded in source code or committed in .env files
- Check that NEXT_PUBLIC_ prefix is only used for truly public values
- Verify server-only env vars are not accessed in client components

### Performance
- Check for proper ISR configuration with appropriate revalidate intervals
- Verify images use Vercel Image Optimization or next/image
- Check for unnecessary server-side rendering where static generation would suffice
- Verify function regions are configured close to the data source`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Vercel Security Review

**Available skill:** \`vercel-scaffold\` — use when generating secure Vercel configurations from scratch.

### Environment Variables and Secrets
- Verify no secrets committed in source code, vercel.json, or .env files
- Check for NEXT_PUBLIC_ prefix on secret values — these are exposed to the browser
- Verify sensitive environment variables are scoped to appropriate environments (dev/preview/prod)
- Check for hardcoded API keys, tokens, or connection strings in function code

### Headers and CORS
- Verify Content-Security-Policy header is configured and appropriately restrictive
- Check that HSTS is enabled with adequate max-age (minimum 1 year recommended)
- Verify CORS configuration does not use wildcard (*) origin on authenticated endpoints
- Check for X-Frame-Options to prevent clickjacking
- Verify Permissions-Policy restricts unnecessary browser APIs

### API Routes
- Verify all mutating API routes (POST, PUT, DELETE) have authentication and authorization
- Check for input validation on all request parameters and body
- Verify rate limiting is implemented for public-facing API routes
- Check cron job endpoints for proper CRON_SECRET verification
- Verify no sensitive data is leaked in API error responses

### Deployment Security
- Check that deployment protection is enabled for preview environments
- Verify no sensitive data is exposed in build logs or function logs
- Check that preview deployments do not use production secrets
- Verify protection bypass secrets are not committed to source code`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Vercel Documentation Standards

**Available skill:** \`vercel-scaffold\` — use when scaffolding documented Vercel projects.

### Deployment Documentation
- Document the deployment pipeline: Git push → Preview → Production promotion flow
- List all required environment variables with descriptions (never include actual values)
- Document vercel.json configuration and the purpose of each routing rule, header, and redirect
- Document which regions functions are deployed to and why

### Function Documentation
- Document each API route: HTTP method, request/response format, authentication requirements
- Document cron jobs: schedule, purpose, expected execution time, and failure handling
- Document middleware logic: what routes it matches, what decisions it makes
- Document Edge Config keys and their purpose, expected values, and who can update them

### Onboarding Guide
- Document how to set up local development with \`vercel dev\` and \`vercel env pull\`
- Document how to create and manage preview deployments
- Document the process for promoting a preview deployment to production
- Provide a .env.example file with all required environment variables and placeholder values`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Vercel Migration Assistance

**Available skill:** \`vercel-scaffold\` — use when generating Vercel configs for migrated projects.

### Framework Migration
- When migrating frameworks (e.g., Pages Router to App Router), update vercel.json function paths
- Update API route signatures to Web Standard Request/Response format
- Migrate environment variable prefixes if switching frameworks (NEXT_PUBLIC_ is Next.js-specific)
- Update middleware configuration for new framework patterns

### Function Runtime Migration
- Migrate from legacy serverless function signatures to Web Standard fetch/Request/Response
- Migrate from \`export default function handler(req, res)\` to \`export function GET(request)\`
- Update Edge Functions to use @vercel/functions helpers instead of deprecated context parameter
- Migrate from inline function config to vercel.json centralized configuration

### Build Configuration Migration
- Migrate from vercel.json v1/v2 to current schema with $schema reference
- Migrate from deprecated \`routes\` array to \`rewrites\`, \`redirects\`, and \`headers\` objects
- Update deprecated build configuration properties to current equivalents
- Migrate from docker/custom builders to framework-native build commands`,
      },
    ],
    skills: [
      {
        name: 'vercel-scaffold',
        description: 'Generate production-ready Vercel configuration for a project',
        content: `# Vercel Scaffold

Generate a complete, production-ready Vercel configuration including:

## 1. vercel.json Configuration

Generate a vercel.json with:
- \`$schema\` reference for IDE autocomplete
- Framework preset matching the project
- Function configuration (memory, maxDuration, regions)
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Routing rules (rewrites for SPA fallback, redirects for URL migration)
- Cron jobs if the project has scheduled tasks
- Image optimization configuration if the project serves images

Template:
\`\`\`json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "<detected-framework>",
  "regions": ["<nearest-region-to-data-source>"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
\`\`\`

## 2. Environment Variables Template

Generate a .env.example with:
- All required environment variables with descriptions
- Placeholder values (never real secrets)
- Comments explaining which are required vs optional
- Notes on which need NEXT_PUBLIC_ prefix (if Next.js)

## 3. Middleware Template (if applicable)

Generate middleware.ts with:
- Authentication check patterns
- Route matcher configuration
- Geolocation-based routing (if needed)

## 4. API Route Template

Generate a sample API route using Web Standard APIs:
- Proper Request/Response handling
- Error handling with appropriate status codes
- Cache-Control headers
- TypeScript types for request/response payloads
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
              'node -e "const f=process.argv[1]||\'\';if(!/vercel\\.json$/.test(f)&&!/vercel\\.ts$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/\\.json$/.test(f)){try{const j=JSON.parse(c);if(!j.headers||!j.headers.some(h=>h.headers&&h.headers.some(hh=>hh.key===\'Strict-Transport-Security\')))issues.push(\'WARNING: No HSTS header configured in vercel.json — add Strict-Transport-Security\');if(!j.headers||!j.headers.some(h=>h.headers&&h.headers.some(hh=>hh.key===\'X-Content-Type-Options\')))issues.push(\'WARNING: No X-Content-Type-Options header — add nosniff\');if(!j.headers||!j.headers.some(h=>h.headers&&h.headers.some(hh=>hh.key===\'X-Frame-Options\')))issues.push(\'WARNING: No X-Frame-Options header — add DENY or SAMEORIGIN\');if(j.functions){for(const[p,cfg]of Object.entries(j.functions)){if(cfg.maxDuration&&cfg.maxDuration>60)issues.push(\'INFO: Function \'+p+\' has maxDuration>\'+cfg.maxDuration+\'s — verify this is intentional\')}}if(!j.regions)issues.push(\'INFO: No regions configured — functions default to iad1 (Washington D.C.)\');}catch(e){issues.push(\'CRITICAL: Invalid JSON in vercel config file\')}}issues.forEach(i=>console.log(i))" -- "$CLAUDE_FILE_PATH"',
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
            command:
              'node -e "const f=process.argv[1]||\'\';if(!/middleware\\.(ts|js)$/.test(f)&&!/api\\//.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/NEXT_PUBLIC_.*(?:SECRET|KEY|TOKEN|PASSWORD)/i.test(c))issues.push(\'CRITICAL: NEXT_PUBLIC_ prefix on a secret variable — this value is exposed to the browser\');if(/[\"\\x27](sk-|ghp_|gho_|AKIA|AIza)[a-zA-Z0-9]/.test(c))issues.push(\'CRITICAL: Potential hardcoded API key detected in function code\');if(/headers\\.get\\([\"\\x27]authorization/.test(c)===false&&/api\\//.test(f)&&/(POST|PUT|DELETE|PATCH)/.test(c))issues.push(\'INFO: Mutating API route without apparent authorization check — verify authentication is handled\');issues.forEach(i=>console.log(i))" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
