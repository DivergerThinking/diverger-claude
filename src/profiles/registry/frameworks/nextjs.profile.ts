import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const nextjsProfile: Profile = {
  id: 'frameworks/nextjs',
  name: 'Next.js',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['nextjs'],
  dependsOn: ['frameworks/react'],
  contributions: {
    claudeMd: [
      {
        heading: 'Next.js Conventions',
        order: 20,
        content: `## Next.js Conventions

App Router architecture. Server Components by default — add \`'use client'\` only at leaf-level interactive boundaries.

**Detailed rules:** see \`.claude/rules/nextjs/\` directory.

**Key rules:**
- Follow route segment conventions: layout → template → error → loading → not-found → page
- Server Actions are public endpoints — validate ALL inputs with Zod, check auth+authorization
- Understand the 4 caching layers: request memoization, data cache, full route cache, router cache
- Use \`next/image\`, \`next/font\`, \`next/link\` — never raw \`<img>\`, \`<a>\` for internal links
- Environment secrets: never prefix with \`NEXT_PUBLIC_\`, guard with \`import 'server-only'\``,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx next:*)',
          'Bash(npx next lint:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run start:*)',
          'Bash(npx @next/bundle-analyzer:*)',
        ],
      },
    },
    rules: [
      {
        path: 'nextjs/app-router-architecture.md',
        paths: ['app/**/*', 'src/app/**/*'],
        governance: 'mandatory',
        description: 'Next.js App Router architecture, routing, and rendering patterns',
        content: `# Next.js App Router Architecture

## Route Segment File Conventions
Every route segment supports these special files, rendered in this hierarchy:
1. \`layout.tsx\` — persistent shared UI (wraps everything below)
2. \`template.tsx\` — like layout but re-mounts on navigation
3. \`error.tsx\` — React error boundary
4. \`loading.tsx\` — Suspense boundary (shows skeleton while page loads)
5. \`not-found.tsx\` — not-found error boundary
6. \`page.tsx\` — the route's unique UI

## Server Components vs Client Components
- Default is Server Component — no directive needed
- Add \`'use client'\` ONLY on leaf-level components that need interactivity
- Server: data fetching, secrets, heavy computation, static rendering
- Client: \`useState\`/\`useEffect\`, event handlers, browser APIs, custom hooks with state
- Never put \`'use client'\` at page or layout level — keeps entire subtree client-side

## Interleaving Pattern
- Pass Server Components as \`children\` or props to Client Components to keep them server-rendered
- Client Components cannot \`import\` Server Components, but can receive them as \`children\`

## Route Organization
- Route groups \`(groupName)/\` scope layouts without affecting the URL
- Dynamic routes: \`[slug]\`, catch-all: \`[...path]\`, optional: \`[[...path]]\`
- Use \`generateStaticParams()\` for dynamic routes that can be statically generated
- Call \`notFound()\` for missing resources instead of returning null

## Key Rules
- Always create \`loading.tsx\` for segments with async data fetching
- Always create \`error.tsx\` with a retry mechanism and user-friendly message
- Export \`metadata\` or \`generateMetadata\` from all pages for SEO
- Props passed from Server to Client Components must be serializable (no functions, Dates, class instances)
`,
      },
      {
        path: 'nextjs/server-actions-and-mutations.md',
        paths: ['**/*action*.*', 'app/**/*.ts'],
        governance: 'mandatory',
        description: 'Server Actions security, validation, and mutation patterns',
        content: `# Server Actions & Mutations

## Core Rules
1. **Server Actions are public endpoints** — treat them like API routes; attackers can call them directly
2. **Validate ALL inputs** with a schema library (Zod, Valibot) on every Server Action
3. **Authorize the caller** — check session/permissions inside the action; never trust client auth state alone
4. **Revalidate after mutations** — call \`revalidatePath()\` or \`revalidateTag()\` before \`redirect()\`
5. **Return typed responses** — \`{ success, data?, error? }\` instead of throwing raw errors

## Server Action Checklist
- Files with Server Actions must have \`'use server'\` at the top
- Authenticate: verify session/JWT inside the action
- Authorize: check user roles/permissions
- Validate: parse input with Zod/Valibot schema
- Mutate: perform DB operation with error handling
- Revalidate: call \`revalidatePath()\` or \`revalidateTag()\`
- Redirect: call \`redirect()\` AFTER revalidation, never before
- Never return raw database errors to the client

## Client Component Integration
- Use \`useActionState()\` hook for form state management with Server Actions
- Disable submit button during pending state (\`isPending\`)
- Display action errors from returned state
- Use progressive enhancement: forms work without JS when using \`<form action={action}>\`
`,
      },
      {
        path: 'nextjs/caching-strategy.md',
        paths: ['app/**/*', 'src/app/**/*'],
        governance: 'mandatory',
        description: 'Next.js caching layers, revalidation, and performance optimization',
        content: `# Next.js Caching Strategy

## Four Caching Layers
| Layer | Where | Duration | Opt-out |
|-------|-------|----------|---------|
| **Request Memoization** | Server (per request) | Single request | \`AbortController.signal\` |
| **Data Cache** | Server (persistent) | Until revalidated | \`{ cache: 'no-store' }\` |
| **Full Route Cache** | Server (persistent) | Until revalidated/redeployed | \`force-dynamic\` |
| **Router Cache** | Client (in-memory) | Session / 5 min | \`router.refresh()\` |

## Revalidation Patterns
- **Time-based (ISR)**: \`fetch(url, { next: { revalidate: 60 } })\` — stale-while-revalidate
- **On-demand tag-based**: tag fetches with \`next: { tags: ['product-1'] }\`, then \`revalidateTag('product-1')\` after mutation
- **On-demand path-based**: \`revalidatePath('/blog')\` or \`revalidatePath('/blog', 'layout')\` for nested segments

## Dynamic Rendering
A route becomes dynamic automatically when it accesses:
- \`cookies()\`, \`headers()\`, \`connection()\`
- \`searchParams\` prop in Page components
- \`fetch\` with \`{ cache: 'no-store' }\`

Avoid \`dynamic = 'force-dynamic'\` — prefer time-based revalidation when data changes periodically.

## Request Memoization
- For non-fetch data sources, use \`React.cache()\` to deduplicate DB calls within a single request
- Call the cached function in multiple Server Components — only one query executes per request
- \`fetch\` calls are automatically memoized within a request (no wrapper needed)

## Key Rules
- Always choose the least aggressive caching strategy that meets your freshness requirements
- Use \`revalidateTag()\` for fine-grained invalidation of related data
- Call \`revalidatePath()\` or \`revalidateTag()\` BEFORE \`redirect()\` in Server Actions
`,
      },
      {
        path: 'nextjs/performance.md',
        paths: ['**/*.tsx', 'next.config.*'],
        governance: 'recommended',
        description: 'Next.js performance optimization, images, fonts, and bundle size',
        content: `# Next.js Performance Optimization

## Image Optimization (next/image)
- Always use \`next/image\` instead of raw \`<img>\` tags
- Add \`priority\` prop to above-the-fold LCP images
- Use \`placeholder="blur"\` with static imports for progressive loading
- Remote images: specify \`width\`/\`height\` or use \`fill\` mode with a sized container
- Configure allowed remote domains in \`next.config.ts\` via \`images.remotePatterns\`
- Always provide meaningful \`alt\` text for accessibility

## Font Optimization (next/font)
- Use \`next/font/google\` or \`next/font/local\` — self-hosted, no external requests
- Apply via CSS variables (\`variable\` option) for flexibility across the app
- Set \`display: 'swap'\` to prevent invisible text during loading

## Bundle Optimization
- Use \`next/dynamic\` for heavy client components not needed on first render
- Set \`ssr: false\` only for components that truly cannot render on the server
- Prefer named imports for tree-shaking: \`import { format } from 'date-fns'\`
- Analyze bundle size regularly with \`ANALYZE=true npm run build\`

## Metadata & SEO
- Export \`metadata\` (static) or \`generateMetadata\` (dynamic) from every page
- Include title, description, and OpenGraph/Twitter card metadata
- Use file-based metadata: \`robots.ts\`, \`sitemap.ts\`, \`opengraph-image.tsx\`
- Implement JSON-LD structured data for rich search results

## Navigation
- Always use \`next/link\` for internal navigation — never raw \`<a>\` tags
- \`next/link\` provides client-side navigation, prefetching, and scroll restoration
`,
      },
      {
        path: 'nextjs/security.md',
        paths: ['middleware.*', 'app/**/*.ts', 'src/app/**/*.ts'],
        governance: 'mandatory',
        description: 'Next.js-specific security patterns and environment variable safety',
        content: `# Next.js Security

## Environment Variable Safety
- Only \`NEXT_PUBLIC_*\` variables are sent to the client — all others are server-only
- NEVER put API keys, database URLs, or secrets in \`NEXT_PUBLIC_\` variables
- Use \`import 'server-only'\` in modules that use secrets to get a build-time error if imported in a Client Component

### Correct
\`\`\`typescript
// lib/api.ts
import 'server-only'

export async function fetchFromInternalAPI(path: string) {
  return fetch(\`\${process.env.INTERNAL_API_URL}\${path}\`, {
    headers: { Authorization: \`Bearer \${process.env.API_SECRET}\` },
  })
}
\`\`\`

### Anti-Pattern
\`\`\`typescript
// BAD: secret exposed to client via NEXT_PUBLIC_ prefix
const API_KEY = process.env.NEXT_PUBLIC_API_KEY // anyone can read this in browser devtools
\`\`\`

---

## Server Action Security Checklist
- [ ] Authenticate the caller (check session/JWT)
- [ ] Authorize the action (check user roles/permissions)
- [ ] Validate ALL inputs with a schema (Zod, Valibot)
- [ ] Never trust \`formData\` — cast carefully, reject unexpected fields
- [ ] Rate-limit sensitive actions (login, password reset)
- [ ] Never return raw database errors to the client
- [ ] Always use parameterized queries in data layer (no SQL injection via Server Actions)

---

## Middleware Security
- Validate auth tokens in \`middleware.ts\` for route protection — redirect unauthenticated users early
- Set security headers (\`Content-Security-Policy\`, \`X-Frame-Options\`, \`Strict-Transport-Security\`) in \`middleware.ts\` or \`next.config.ts\`
- Never trust \`searchParams\` or dynamic route params without validation

---

## Content Security
- Sanitize user-generated HTML before rendering (use \`DOMPurify\` or \`sanitize-html\`)
- Never use \`dangerouslySetInnerHTML\` with unsanitized user input
- Use \`nonce\` with Content-Security-Policy for inline scripts when needed
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['nextjs-route-generator'],
        prompt: `## Next.js-Specific Review

### Server / Client Component Boundary
- Verify that \`'use client'\` is added ONLY to components that need interactivity (useState, useEffect, event handlers, browser APIs)
- Check that \`'use client'\` is on the smallest leaf component, not at page or layout level
- Verify Server Components do NOT import client-only hooks (useState, useEffect, useContext)
- Check that props passed from Server to Client Components are serializable (no functions, class instances, Dates)
- Verify the interleaving pattern is used: Server Components passed as \`children\` to Client Components
- Check that modules using secrets have \`import 'server-only'\` to prevent client imports

### Server Actions & Mutations
- Verify ALL Server Actions validate inputs with a schema library (Zod, Valibot)
- Check that Server Actions verify authentication AND authorization
- Verify \`revalidatePath()\` or \`revalidateTag()\` is called after every mutation
- Check that \`redirect()\` is called AFTER revalidation, never before
- Verify error handling returns typed responses, not raw exceptions
- Check that Server Actions in separate files have \`'use server'\` at the top

### Caching & Data Fetching
- Check for unnecessary \`dynamic = 'force-dynamic'\` — prefer time-based revalidation or on-demand
- Verify \`fetch\` calls use appropriate caching: \`revalidate\`, \`tags\`, or \`no-store\` intentionally
- Check that \`React.cache()\` is used for non-fetch data sources to avoid duplicate queries
- Verify \`generateStaticParams()\` is used for dynamic routes that can be statically generated
- Check for data fetching in Client Components that should be in Server Components

### Route Conventions
- Verify \`loading.tsx\` exists for route segments with async data fetching
- Check that \`error.tsx\` provides a retry mechanism and user-friendly message
- Verify \`not-found.tsx\` is colocated where needed and \`notFound()\` is called for missing resources
- Check that \`metadata\` or \`generateMetadata\` is exported from all pages for SEO
- Verify Route Handlers (\`route.ts\`) use appropriate HTTP methods and validate inputs

### Performance
- Verify \`next/image\` is used instead of raw \`<img>\` tags
- Check that LCP images have the \`priority\` prop
- Verify \`next/font\` is used for fonts, applied via CSS variables
- Check for heavy components that should use \`next/dynamic\` with lazy loading
- Verify \`next/link\` is used for all internal navigation instead of \`<a>\` tags`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Next.js Testing Patterns

### Server Components
- Test Server Components by calling them as async functions and asserting on the returned JSX
- Mock data-fetching functions (\`fetch\`, database clients) at the module level
- Test \`generateMetadata\` functions for correct SEO output (title, description, og tags)
- Test \`generateStaticParams\` returns the expected slugs/params

### Client Components
- Use React Testing Library — render the component, interact with it, assert on DOM
- Mock \`next/navigation\` hooks: \`useRouter\`, \`useSearchParams\`, \`usePathname\`, \`useParams\`
- Mock \`next/image\` to avoid optimization overhead: \`jest.mock('next/image', () => (props) => <img {...props} />)\`
- Test loading, error, and not-found states by rendering the corresponding boundary components

### Server Actions
- Test Server Actions by calling them directly as functions with mock FormData
- Mock database/API calls and assert on revalidation calls (\`revalidatePath\`, \`revalidateTag\`)
- Verify validation: pass invalid data and assert the action returns error responses
- Verify authorization: call without session and assert rejection

### Route Handlers
- Test Route Handlers by calling the exported HTTP method functions with mock \`Request\` objects
- Assert on response status codes, headers, and body content
- Test input validation and error cases

### Integration
- Use \`next/jest\` or Vitest with \`@vitejs/plugin-react\` for proper Next.js transform support
- Configure path aliases (\`@/\`) in test config to match \`tsconfig.json\`
- Use \`msw\` (Mock Service Worker) for network-level mocking in integration tests`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        skills: ['nextjs-migration-helper'],
        prompt: `## Next.js Security Review

### Environment & Secrets
- Verify no secrets in \`NEXT_PUBLIC_*\` environment variables
- Check that server-only modules use \`import 'server-only'\` guard
- Verify \`.env.local\` and credential files are in \`.gitignore\`

### Server Actions
- Verify EVERY Server Action validates input (Zod/Valibot schema)
- Check that EVERY Server Action verifies authentication and authorization
- Verify Server Actions do not return sensitive database error details to the client
- Check for rate limiting on authentication-related Server Actions

### Middleware
- Verify auth checks in \`middleware.ts\` for protected routes
- Check that security headers (CSP, HSTS, X-Frame-Options) are set
- Verify \`matcher\` config excludes only intentionally public routes

### Content Safety
- Check for \`dangerouslySetInnerHTML\` usage with unsanitized input
- Verify user-generated content is sanitized before rendering
- Check that \`remotePatterns\` in \`next.config\` is restrictive (no wildcard hostnames)`,
      },
    ],
    skills: [
      {
        name: 'nextjs-route-generator',
        description: 'Generate complete Next.js App Router route segments with all conventions',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Next.js Route Generator

Generate a complete Next.js App Router route segment with:

1. **page.tsx** — Server Component by default; only add \`'use client'\` if the page needs interactivity
2. **layout.tsx** — shared layout for the segment and its children (if needed)
3. **loading.tsx** — Suspense skeleton with appropriate loading UI
4. **error.tsx** — error boundary with \`'use client'\`, \`reset()\` button, and user-friendly message
5. **not-found.tsx** — 404 UI for this segment (if dynamic route)
6. **Metadata** — \`generateMetadata()\` or static \`metadata\` export for SEO
7. **Server Actions** — validated with Zod, auth-checked, with revalidation

### Template: error.tsx
\`\`\`tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
\`\`\`

### Template: loading.tsx
\`\`\`tsx
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  )
}
\`\`\`
`,
      },
      {
        name: 'nextjs-migration-helper',
        description: 'Migrate Pages Router patterns to App Router equivalents',
        content: `# Next.js Pages Router to App Router Migration

## Migration Map

| Pages Router | App Router Equivalent |
|---|---|
| \`pages/index.tsx\` | \`app/page.tsx\` |
| \`pages/about.tsx\` | \`app/about/page.tsx\` |
| \`pages/_app.tsx\` | \`app/layout.tsx\` (root layout) |
| \`pages/_document.tsx\` | \`app/layout.tsx\` (\`<html>\`, \`<body>\` tags) |
| \`pages/api/hello.ts\` | \`app/api/hello/route.ts\` |
| \`getServerSideProps\` | Server Component with direct \`async/await\` fetch |
| \`getStaticProps\` | Server Component + \`fetch\` with \`revalidate\` or \`force-cache\` |
| \`getStaticPaths\` | \`generateStaticParams()\` |
| \`useRouter().query\` | \`useSearchParams()\` (Client) or \`searchParams\` prop (Server) |
| \`useRouter().push\` | \`useRouter().push()\` from \`next/navigation\` |
| \`next/head\` | \`metadata\` export or \`generateMetadata()\` |

## Key Differences
- App Router components are Server Components by default (no \`getServerSideProps\` needed)
- Data fetching happens directly in the component body, not in separate functions
- Layouts persist across navigations (no re-mount) — use \`template.tsx\` if re-mount is needed
- Route Handlers use Web Request/Response API, not \`req, res\` Node.js API
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/page\\.(tsx|jsx)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
const trimmed = c.trim();
const hasUseClient = /^['\"]use client['\"]/.test(trimmed);
const hasInteractivity = /useState|useEffect|useReducer|useRef|useCallback|useMemo|onClick|onChange|onSubmit|onKeyDown|addEventListener/.test(c);
if (hasUseClient && !hasInteractivity) {
  console.log('Warning: page.tsx has use client but no client interactivity detected. Consider making it a Server Component for better performance.');
}
if (!hasUseClient && /export (default )?(async )?function/.test(c) && !/export (const )?metadata|generateMetadata/.test(c)) {
  console.log('Warning: page.tsx has no metadata export. Add metadata or generateMetadata for SEO.');
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.(tsx|jsx)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/<img\\s/.test(c) && !/next\\/image/.test(c)) {
  console.log('Warning: Raw <img> tag detected. Use next/image for automatic optimization, lazy loading, and responsive sizing.');
}
if (/<a\\s+href=/.test(c) && /href=[\"\\x27]\\//.test(c) && !/next\\/link/.test(c)) {
  console.log('Warning: Raw <a> tag with internal href detected. Use next/link for client-side navigation and prefetching.');
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/actions?\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/['\"]use server['\"]/.test(c)) {
  const fnBodies = c.split(/export\s+(async\s+)?function/).slice(1);
  for (const body of fnBodies) {
    if (!/z\\.|zod|valibot|schema|parse|safeParse|validate/.test(body.slice(0, 500))) {
      console.log('Warning: Server Action detected without apparent input validation. Always validate inputs with Zod or similar.');
      break;
    }
  }
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
