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

App Router architecture, route segment conventions, and Server/Client Component patterns.

**Key rules:**
- Route segment hierarchy: layout -> template -> error -> loading -> not-found -> page
- Default is Server Component — add \`'use client'\` ONLY on leaf-level interactive components
- Pass Server Components as \`children\` to Client Components (interleaving pattern)
- Route groups \`(groupName)/\` scope layouts without affecting URL
- Use \`generateStaticParams()\` for dynamic routes that can be statically generated
- Always create \`loading.tsx\` for segments with async data, \`error.tsx\` with retry mechanism
- Export \`metadata\` or \`generateMetadata\` from all pages for SEO
- Props from Server to Client Components must be serializable (no functions, Dates, class instances)
- Call \`notFound()\` for missing resources instead of returning null

For detailed examples and reference, invoke: /nextjs-route-generator
`,
      },
      {
        path: 'nextjs/server-actions-and-mutations.md',
        paths: ['**/*action*.*', 'app/**/*.ts'],
        governance: 'mandatory',
        description: 'Server Actions security, validation, and mutation patterns',
        content: `# Server Actions & Mutations

Server Actions are public HTTP endpoints — validate inputs, authenticate, and authorize in every action.

**Key rules:**
- Server Actions are public endpoints — attackers can call them directly via POST
- Validate ALL inputs with Zod/Valibot on every Server Action
- Authenticate (verify session/JWT) and authorize (check roles/permissions) inside the action
- Follow strict order: validate -> authenticate -> authorize -> mutate -> revalidate -> redirect
- Call \`revalidatePath()\`/\`revalidateTag()\` BEFORE \`redirect()\` — redirect throws, code after never runs
- Return typed responses \`{ success, data?, error? }\` — never throw raw errors
- Files with Server Actions must have \`'use server'\` at top
- Use \`useActionState()\` hook for form state management with \`isPending\` feedback
- Progressive enhancement: \`<form action={action}>\` works without JS

For detailed examples and reference, invoke: /nextjs-server-actions-guide
`,
      },
      {
        path: 'nextjs/caching-strategy.md',
        paths: ['app/**/*', 'src/app/**/*'],
        governance: 'mandatory',
        description: 'Next.js caching layers, revalidation, and performance optimization',
        content: `# Next.js Caching Strategy

Next.js 4 caching layers, revalidation strategies, and performance optimization patterns.

**Key rules:**
- Understand 4 layers: Request Memoization, Data Cache, Full Route Cache, Router Cache
- Time-based (ISR): \`fetch(url, { next: { revalidate: 60 } })\` for stale-while-revalidate
- On-demand: \`revalidateTag()\` for fine-grained invalidation, \`revalidatePath()\` for path-based
- Routes become dynamic when accessing \`cookies()\`, \`headers()\`, \`searchParams\`, or \`no-store\` fetch
- Avoid \`force-dynamic\` — prefer time-based revalidation when data changes periodically
- Use \`React.cache()\` for non-fetch data sources to deduplicate DB calls per request
- Choose the least aggressive caching strategy that meets freshness requirements
- Call \`revalidatePath()\`/\`revalidateTag()\` BEFORE \`redirect()\` in Server Actions
- Avoid \`cache: 'no-store'\` everywhere — only opt out when data must be truly real-time

For detailed examples and reference, invoke: /nextjs-caching-guide
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
        name: 'nextjs-caching-guide',
        description: 'Detailed reference for Next.js caching layers, revalidation strategies, and performance optimization',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Next.js Caching — Detailed Reference

## The 4 Caching Layers

Next.js has four distinct caching mechanisms that work together. Understanding when each applies is critical for correct data freshness and performance.

| Layer | Where | Duration | Purpose | Opt-out |
|-------|-------|----------|---------|---------|
| **Request Memoization** | Server (per-request) | Single request lifetime | Deduplicate identical fetches in a component tree | \`AbortController.signal\` |
| **Data Cache** | Server (persistent) | Until revalidated or opted out | Cache fetch responses across requests and deployments | \`{ cache: 'no-store' }\` |
| **Full Route Cache** | Server (persistent) | Until revalidated or redeployed | Cache rendered HTML and RSC payload for static routes | \`dynamic = 'force-dynamic'\` or dynamic functions |
| **Router Cache** | Client (in-memory) | Session duration / 5 min (dynamic) / 30s (static) | Cache visited route RSC payloads for instant back/forward | \`router.refresh()\` |

### How They Interact
1. Request hits the **Router Cache** first (client-side) — if fresh, no server request
2. On the server, the **Full Route Cache** serves pre-rendered static routes
3. During rendering, **Request Memoization** deduplicates identical fetch calls within the same request
4. Each fetch checks the **Data Cache** before hitting the origin

---

## Layer 1: Request Memoization

React and Next.js automatically memoize \`fetch()\` calls with the same URL and options within a single server request. This means you can call the same fetch in multiple Server Components without duplicate network requests.

\\\`\\\`\\\`typescript
// lib/data.ts
export async function getProduct(id: string) {
  // This fetch is automatically memoized per-request
  // Call it in multiple Server Components — only 1 network request
  const res = await fetch(\\\`https://api.example.com/products/\\\${id}\\\`);
  return res.json();
}
\\\`\\\`\\\`

For non-fetch data sources (e.g., direct database calls), use \`React.cache()\`:

\\\`\\\`\\\`typescript
import { cache } from 'react';
import { db } from '@/lib/db';

// Memoized for the duration of the request
export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } });
});

// Call getUser(id) in multiple Server Components — only 1 DB query per request
\\\`\\\`\\\`

---

## Layer 2: Data Cache

The Data Cache persists fetch responses across requests and deployments. Control it with fetch options:

### Time-Based Revalidation (ISR)
\\\`\\\`\\\`typescript
// Revalidate at most every 60 seconds (stale-while-revalidate)
const res = await fetch('https://api.example.com/products', {
  next: { revalidate: 60 },
});
\\\`\\\`\\\`

### Tag-Based Revalidation
\\\`\\\`\\\`typescript
// Tag the cached data for fine-grained invalidation
const res = await fetch(\\\`https://api.example.com/products/\\\${id}\\\`, {
  next: { tags: [\\\`product-\\\${id}\\\`, 'products'] },
});
\\\`\\\`\\\`

### Opting Out of the Data Cache
\\\`\\\`\\\`typescript
// Skip the data cache entirely — always fetch fresh
const res = await fetch('https://api.example.com/cart', {
  cache: 'no-store',
});
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// BAD: no-store everywhere "just in case" — defeats caching entirely
const products = await fetch(url, { cache: 'no-store' }); // Is this data truly real-time?
const categories = await fetch(catUrl, { cache: 'no-store' }); // Categories rarely change!

// CORRECT: use revalidation for data that changes periodically
const products = await fetch(url, { next: { revalidate: 30, tags: ['products'] } });
const categories = await fetch(catUrl, { next: { revalidate: 3600, tags: ['categories'] } });
\\\`\\\`\\\`

---

## Layer 3: Full Route Cache

Static routes (no dynamic functions) are rendered at build time and cached. A route becomes **dynamic** when it accesses:
- \`cookies()\`, \`headers()\`, \`connection()\`
- \`searchParams\` prop in Page components
- \`fetch()\` with \`{ cache: 'no-store' }\`
- \`export const dynamic = 'force-dynamic'\`
- \`unstable_noStore()\`

\\\`\\\`\\\`typescript
// This page is STATIC — rendered at build time, served from cache
export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 },
  });
  return <ProductList products={await products.json()} />;
}

// This page is DYNAMIC — rendered on every request
export default async function CartPage() {
  const session = await cookies(); // Dynamic function → opts out of Full Route Cache
  const cart = await getCart(session.get('cartId')?.value);
  return <Cart items={cart.items} />;
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// BAD: force-dynamic on a page that could be statically cached with ISR
export const dynamic = 'force-dynamic'; // Why? This page shows blog posts that change daily
export default async function BlogPage() { /* ... */ }

// CORRECT: use time-based or on-demand revalidation instead
export const revalidate = 3600; // Revalidate at most every hour
export default async function BlogPage() { /* ... */ }
\\\`\\\`\\\`

---

## Layer 4: Router Cache (Client-Side)

The Router Cache stores visited route RSC payloads in the browser for instant back/forward navigation. It is **always active** and cannot be fully disabled.

### Invalidating the Router Cache
\\\`\\\`\\\`typescript
'use client';
import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const router = useRouter();
  // router.refresh() invalidates the Router Cache for the current route
  return <button onClick={() => router.refresh()}>Refresh</button>;
}
\\\`\\\`\\\`

Server-side revalidation (\`revalidateTag\`, \`revalidatePath\`) also invalidates the Router Cache on the next navigation.

---

## On-Demand Revalidation Patterns

### revalidateTag — Fine-Grained Invalidation
\\\`\\\`\\\`typescript
// 1. Tag your fetches
async function getProduct(id: string) {
  const res = await fetch(\\\`https://api.example.com/products/\\\${id}\\\`, {
    next: { tags: [\\\`product-\\\${id}\\\`, 'products'] },
  });
  return res.json();
}

// 2. Invalidate after mutation in a Server Action
'use server';
import { revalidateTag } from 'next/cache';

export async function updateProduct(id: string, data: ProductData) {
  await db.product.update({ where: { id }, data });

  // Invalidate just this product and the product list
  revalidateTag(\\\`product-\\\${id}\\\`);
  revalidateTag('products');
}
\\\`\\\`\\\`

### revalidatePath — Path-Based Invalidation
\\\`\\\`\\\`typescript
'use server';
import { revalidatePath } from 'next/cache';

export async function publishPost(id: string) {
  await db.post.update({ where: { id }, data: { published: true } });

  revalidatePath('/blog');           // Revalidate the blog listing page
  revalidatePath(\\\`/blog/\\\${id}\\\`);    // Revalidate the specific post page
  revalidatePath('/blog', 'layout'); // Revalidate all pages under /blog layout
}
\\\`\\\`\\\`

---

## When to Use Each Strategy

| Scenario | Strategy | Example |
|----------|----------|---------|
| Marketing pages, docs | **Static** (no revalidation) | Build-time rendering, redeploy to update |
| Blog, product catalog | **ISR** (time-based revalidation) | \`next: { revalidate: 60 }\` |
| After user mutations | **On-demand** (tag/path revalidation) | \`revalidateTag('products')\` in Server Action |
| User-specific data | **Dynamic** (no cache) | Pages using \`cookies()\` or \`headers()\` |
| Real-time data | **Dynamic** + client polling/streaming | \`cache: 'no-store'\` + SWR/WebSocket |

## Common Anti-Patterns Summary
1. **\`force-dynamic\` everywhere** — Use ISR or on-demand revalidation instead
2. **\`cache: 'no-store'\` on all fetches** — Only opt out when data must be real-time
3. **No revalidation tags** — Without tags, you cannot do fine-grained on-demand invalidation
4. **Forgetting \`React.cache()\` for DB calls** — Non-fetch data is NOT auto-memoized
5. **Calling \`redirect()\` before \`revalidatePath()\`** — Always revalidate first, redirect second
`,
      },
      {
        name: 'nextjs-server-actions-guide',
        description: 'Detailed reference for Next.js Server Actions security, validation, and mutation patterns',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Next.js Server Actions — Detailed Reference

## Server Actions Are Public HTTP Endpoints

Every Server Action is exposed as a POST endpoint that anyone can call — with or without your UI. Treat them exactly like API routes: **validate all inputs, authenticate the caller, and authorize the action**.

\\\`\\\`\\\`typescript
// An attacker can call ANY Server Action directly via POST request:
// curl -X POST https://your-app.com -H "Next-Action: actionId" -d "..."
// Never assume only your form will call the action.
\\\`\\\`\\\`

---

## Complete Validation Pattern with Zod

Always validate inputs with a schema library. Never trust \`formData\` from the client.

### Correct
\\\`\\\`\\\`typescript
'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  categoryId: z.string().uuid(),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createPost(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  // 1. Validate inputs
  const parsed = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    categoryId: formData.get('categoryId'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 2. Authenticate
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'You must be signed in' };
  }

  // 3. Authorize
  const canCreate = await checkPermission(session.user.id, 'posts:create');
  if (!canCreate) {
    return { success: false, error: 'You do not have permission to create posts' };
  }

  // 4. Mutate
  let postId: string;
  try {
    const post = await db.post.create({
      data: {
        ...parsed.data,
        authorId: session.user.id,
      },
    });
    postId = post.id;
  } catch {
    return { success: false, error: 'Failed to create post. Please try again.' };
  }

  // 5. Revalidate (BEFORE redirect)
  revalidateTag('posts');

  // 6. Redirect (AFTER revalidation)
  redirect(\\\`/posts/\\\${postId}\\\`);
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
'use server';

// BAD: No validation, no auth, raw errors, redirect before revalidate
export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;      // Trusting client data!
  const content = formData.get('content') as string;   // No validation!
  // No authentication check!
  // No authorization check!
  const post = await db.post.create({                  // Raw DB errors leak to client
    data: { title, content },
  });
  redirect(\\\`/posts/\\\${post.id}\\\`);                       // Redirect BEFORE revalidation!
  revalidateTag('posts');                              // Never reached after redirect
}
\\\`\\\`\\\`

---

## The Correct Order of Operations

Every Server Action should follow this exact sequence:

1. **Validate** — Parse and validate all inputs with Zod/Valibot
2. **Authenticate** — Verify the user has a valid session
3. **Authorize** — Check the user has permission for this specific action
4. **Mutate** — Perform the database operation with error handling
5. **Revalidate** — Call \`revalidatePath()\` or \`revalidateTag()\` to update cached data
6. **Redirect** — Call \`redirect()\` AFTER revalidation (redirect throws, so code after it never runs)

---

## useActionState Hook — Form State Management

Use \`useActionState\` (React 19+) to manage Server Action form state, pending status, and error display.

\\\`\\\`\\\`typescript
'use client';

import { useActionState } from 'react';
import { createPost } from '@/app/actions';

const initialState = { success: false, error: undefined, fieldErrors: undefined };

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, initialState);

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required disabled={isPending} />
        {state.fieldErrors?.title && (
          <p role="alert" className="text-red-600">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" required disabled={isPending} />
        {state.fieldErrors?.content && (
          <p role="alert" className="text-red-600">{state.fieldErrors.content[0]}</p>
        )}
      </div>

      {state.error && (
        <div role="alert" className="text-red-600">{state.error}</div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
\\\`\\\`\\\`

---

## Progressive Enhancement

When you use \`<form action={serverAction}>\`, the form works even without JavaScript. This is progressive enhancement — the form submits as a standard HTML form POST, and Next.js handles it server-side.

\\\`\\\`\\\`typescript
// This form works without JavaScript enabled in the browser
// The Server Action receives FormData just like a traditional form submission
<form action={createPost}>
  <input name="title" required />
  <textarea name="content" required />
  <button type="submit">Create</button>
</form>
\\\`\\\`\\\`

For enhanced client-side behavior (pending states, optimistic updates), wrap with \`useActionState\` as shown above.

---

## Error Handling: Typed Responses vs Exceptions

### Correct — Typed Response Objects
\\\`\\\`\\\`typescript
'use server';

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function deletePost(postId: string): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Authentication required' };
  }

  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) {
    return { success: false, error: 'Post not found' };
  }

  if (post.authorId !== session.user.id) {
    return { success: false, error: 'You can only delete your own posts' };
  }

  try {
    await db.post.delete({ where: { id: postId } });
  } catch {
    return { success: false, error: 'Failed to delete post. Please try again.' };
  }

  revalidateTag('posts');
  return { success: true, data: undefined };
}
\\\`\\\`\\\`

### Anti-Pattern — Throwing Raw Errors
\\\`\\\`\\\`typescript
'use server';

// BAD: throwing exposes internal details and breaks progressive enhancement
export async function deletePost(postId: string) {
  const post = await db.post.delete({ where: { id: postId } }); // Raw Prisma error on failure!
  // Unhandled: "Record to delete does not exist" leaks to client
}
\\\`\\\`\\\`

---

## Authentication and Authorization Inside Actions

Never rely on client-side auth checks. Always verify server-side inside every action.

\\\`\\\`\\\`typescript
'use server';

export async function updateUserRole(userId: string, newRole: string) {
  // ALWAYS check auth inside the action — client checks can be bypassed
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Authentication required' };
  }

  // Authorization: only admins can change roles
  if (session.user.role !== 'admin') {
    return { success: false, error: 'Only administrators can change user roles' };
  }

  // Validate the role value
  const validRoles = ['user', 'editor', 'admin'] as const;
  if (!validRoles.includes(newRole as typeof validRoles[number])) {
    return { success: false, error: 'Invalid role' };
  }

  await db.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidateTag('users');
  return { success: true, data: undefined };
}
\\\`\\\`\\\`

---

## Anti-Patterns Summary

| Anti-Pattern | Why It Is Dangerous | Correct Approach |
|---|---|---|
| Trusting \`formData\` without validation | Attackers can send any data via POST | Validate with Zod \`safeParse\` |
| No authentication check | Actions are public endpoints | Call \`auth()\` in every action |
| No authorization check | Authenticated !== authorized | Check roles/permissions after auth |
| \`redirect()\` before \`revalidatePath()\` | Redirect throws — revalidation never runs | Always revalidate first |
| Throwing raw exceptions | Internal errors leak to client | Return typed \`{ success, error }\` objects |
| Inline \`'use server'\` in client component | Creates action without separate file discipline | Use \`'use server'\` at file top, import in client |
| Missing \`isPending\` UI feedback | User clicks submit multiple times | Use \`useActionState\` with disabled button |
| No rate limiting on sensitive actions | Brute-force attacks on login/password reset | Add rate limiting middleware |
`,
      },
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
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
