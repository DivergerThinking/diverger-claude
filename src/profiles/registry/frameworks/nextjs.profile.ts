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

### App Router Architecture
- Use the App Router (\`app/\` directory) for all new routes — Pages Router is legacy
- Every route segment is a folder; it becomes public only when it contains \`page.tsx\` or \`route.ts\`
- Use \`layout.tsx\` for shared UI that persists across navigations (header, sidebar, footer)
- Use \`template.tsx\` instead of \`layout.tsx\` when you need a fresh instance on every navigation (e.g. enter/exit animations)
- Colocate \`loading.tsx\`, \`error.tsx\`, and \`not-found.tsx\` in every route segment that needs them
- Use \`global-error.tsx\` at the app root for top-level error boundaries
- Use route groups \`(groupName)\` to organize routes without affecting URL structure
- Use private folders \`_folderName\` for non-routable colocated code (helpers, sub-components)

### Server Components (default)
- All components in \`app/\` are Server Components by default — do NOT add \`'use client'\` unless required
- Fetch data directly in Server Components using \`async/await\` — no \`useEffect\` + \`fetch\` pattern
- Access secrets, databases, and internal APIs safely in Server Components — they never ship to the client
- Use \`import 'server-only'\` in modules that must never be imported by Client Components
- Use \`React.cache()\` to deduplicate expensive data fetches across the component tree within a single request

### Client Components
- Add \`'use client'\` only when using: \`useState\`, \`useEffect\`, event handlers (\`onClick\`, \`onChange\`), browser APIs, or custom hooks
- Place \`'use client'\` on the smallest leaf component possible — everything it imports becomes client bundle
- Pass Server Components as \`children\` to Client Components to keep them server-rendered (interleaving pattern)
- Props from Server to Client Components must be serializable (no functions, Dates as strings, no class instances)
- Wrap third-party components that lack \`'use client'\` in a thin Client Component re-export

### Context Providers
- Context (\`createContext\`) is not available in Server Components — create a Client Component provider that accepts \`children\`
- Render providers as deep in the tree as possible to let Next.js optimize static parts above them
- Share data between Server and Client Components via \`React.cache()\` + context + \`use()\` API

### Server Actions & Server Functions
- Use \`'use server'\` directive for server-side mutations — place at function level or at top of a dedicated \`actions.ts\` file
- Server Actions are public API endpoints — validate ALL input with a schema library (Zod, Valibot)
- Always call \`revalidatePath()\` or \`revalidateTag()\` after mutations to refresh cached data
- Use \`redirect()\` after successful mutations — call \`revalidatePath/revalidateTag\` BEFORE \`redirect\`
- Handle errors gracefully and return typed response objects to the client
- Server Actions support progressive enhancement — forms work even before JavaScript hydrates

### Data Fetching & Caching
- Default behavior: static routes are cached at build time, dynamic routes render per request
- A route becomes dynamic when it uses \`cookies()\`, \`headers()\`, \`searchParams\`, or \`connection()\`
- Use \`fetch\` with \`{ next: { revalidate: N } }\` for time-based ISR (Incremental Static Regeneration)
- Use \`fetch\` with \`{ next: { tags: ['tag'] } }\` + \`revalidateTag('tag')\` for on-demand revalidation
- Use \`{ cache: 'no-store' }\` or \`force-dynamic\` only when freshness truly requires it
- Prefer \`generateStaticParams()\` for static generation of dynamic route segments at build time
- Use parallel data fetching with \`Promise.all()\` when requests are independent

### Navigation & Linking
- Use \`next/link\` for all internal navigation — never use raw \`<a>\` tags for internal routes
- \`<Link>\` prefetches routes automatically; set \`prefetch={false}\` only for rarely visited links
- Use \`useRouter()\` for programmatic navigation in Client Components only
- Use \`redirect()\` from \`next/navigation\` for server-side redirects in Server Components and Server Actions

### Images, Fonts & Metadata
- Use \`next/image\` for all images — never use raw \`<img>\` tags (automatic optimization, lazy loading, responsive sizing)
- Set \`priority\` on above-the-fold images (LCP candidates); specify \`width\`/\`height\` or use \`fill\` to prevent CLS
- Use \`next/font/google\` or \`next/font/local\` for zero-layout-shift font loading; apply via CSS variable
- Export \`metadata\` object or \`generateMetadata()\` function from every page and layout for SEO
- Use file-based metadata conventions: \`opengraph-image.tsx\`, \`icon.tsx\`, \`robots.ts\`, \`sitemap.ts\`

### Middleware
- Define \`middleware.ts\` at the project root (or \`src/\`) for cross-cutting concerns (auth, redirects, i18n, headers)
- Middleware runs on the Edge — keep it lightweight, no heavy computation or database queries
- Use \`matcher\` config to limit middleware to specific routes instead of running on every request

### Environment Variables
- Only variables prefixed with \`NEXT_PUBLIC_\` are exposed to the client bundle — all others are server-only
- Never put secrets in \`NEXT_PUBLIC_\` variables
- Use \`.env.local\` for local overrides; never commit \`.env.local\` or \`.env\` with real secrets`,
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
        governance: 'mandatory',
        description: 'Next.js App Router architecture, routing, and rendering patterns',
        content: `# Next.js App Router Architecture

## Route Segment File Conventions

Every route segment in the \`app/\` directory supports these special files, rendered in this exact hierarchy:

1. \`layout.tsx\` — persistent shared UI (wraps everything below)
2. \`template.tsx\` — like layout but re-mounts on navigation
3. \`error.tsx\` — React error boundary
4. \`loading.tsx\` — React Suspense boundary (shows skeleton while page loads)
5. \`not-found.tsx\` — not-found error boundary
6. \`page.tsx\` — the route's unique UI (or nested \`layout.tsx\` for child segments)

### Correct — complete route segment

\`\`\`
app/
  dashboard/
    layout.tsx          # persistent sidebar/nav
    loading.tsx         # skeleton while page data loads
    error.tsx           # error boundary with retry
    not-found.tsx       # 404 for this segment
    page.tsx            # dashboard home
    settings/
      page.tsx          # /dashboard/settings
    analytics/
      loading.tsx       # separate skeleton for analytics
      page.tsx          # /dashboard/analytics
\`\`\`

### Anti-Pattern — missing error/loading boundaries

\`\`\`
app/
  dashboard/
    page.tsx            # no loading.tsx = no streaming, no skeleton
                        # no error.tsx = errors bubble up or crash the whole page
\`\`\`

---

## Server Components vs Client Components

### Decision Matrix

| Need | Component Type |
|------|---------------|
| Fetch data from DB/API | Server Component |
| Access secrets/tokens | Server Component |
| Heavy computation (no client JS) | Server Component |
| Static content rendering | Server Component |
| \`useState\`, \`useReducer\` | Client Component (\`'use client'\`) |
| \`useEffect\`, lifecycle hooks | Client Component |
| Event handlers (onClick, onChange) | Client Component |
| Browser APIs (localStorage, geolocation) | Client Component |
| Custom hooks with state | Client Component |

### Correct — leaf-level 'use client' boundary

\`\`\`tsx
// app/dashboard/page.tsx — Server Component (default, no directive)
import { getMetrics } from '@/lib/data'
import { MetricsChart } from './metrics-chart'

export default async function DashboardPage() {
  const metrics = await getMetrics() // fetched on the server
  return (
    <main>
      <h1>Dashboard</h1>
      <MetricsChart data={metrics} /> {/* Client Component for interactivity */}
    </main>
  )
}
\`\`\`

\`\`\`tsx
// app/dashboard/metrics-chart.tsx — Client Component
'use client'

import { useState } from 'react'

interface MetricsChartProps {
  data: { label: string; value: number }[]
}

export function MetricsChart({ data }: MetricsChartProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  return (
    <div>
      <button onClick={() => setRange('7d')}>7 days</button>
      <button onClick={() => setRange('30d')}>30 days</button>
      {/* render chart with filtered data */}
    </div>
  )
}
\`\`\`

### Anti-Pattern — 'use client' at page level

\`\`\`tsx
// BAD: entire page is a Client Component — all children become client bundle
'use client'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(setMetrics)
  }, [])
  // Problem: fetching on client, larger JS bundle, no streaming, no SEO
  return <div>{/* ... */}</div>
}
\`\`\`

---

## Interleaving Pattern (Server inside Client)

Pass Server Components as \`children\` or props to Client Components to keep them server-rendered:

\`\`\`tsx
// app/ui/sidebar.tsx — Client Component with toggle
'use client'

import { useState } from 'react'

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <aside style={{ display: open ? 'block' : 'none' }}>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {children} {/* Server Components passed as children remain server-rendered */}
    </aside>
  )
}
\`\`\`

\`\`\`tsx
// app/layout.tsx — Server Component
import { Sidebar } from './ui/sidebar'
import { Navigation } from './ui/navigation' // Server Component

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar>
        <Navigation /> {/* stays on the server */}
      </Sidebar>
      <main>{children}</main>
    </div>
  )
}
\`\`\`

---

## Route Organization Patterns

### Route groups for layout scoping
\`\`\`
app/
  (marketing)/
    layout.tsx          # marketing-specific layout
    page.tsx            # / (home)
    about/page.tsx      # /about
  (app)/
    layout.tsx          # app layout with auth sidebar
    dashboard/page.tsx  # /dashboard
    settings/page.tsx   # /settings
\`\`\`

### Dynamic routes with static generation
\`\`\`tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getPost, getAllPostSlugs } from '@/lib/posts'

// Pre-render these paths at build time
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return <article>{/* render post */}</article>
}
\`\`\`
`,
      },
      {
        path: 'nextjs/server-actions-and-mutations.md',
        governance: 'mandatory',
        description: 'Server Actions security, validation, and mutation patterns',
        content: `# Server Actions & Mutations

## Core Rules

1. **Server Actions are public endpoints** — treat them like API routes. An attacker can call them directly.
2. **Validate ALL inputs** — use a schema library (Zod, Valibot) on every Server Action, even for logged-in users.
3. **Authorize the caller** — check session/permissions inside the action, never trust client-side auth state alone.
4. **Revalidate after mutations** — call \`revalidatePath()\` or \`revalidateTag()\` before \`redirect()\`.
5. **Return typed responses** — return \`{ success, data?, error? }\` instead of throwing raw errors to the client.

---

## Correct — secure Server Action with validation

\`\`\`typescript
// app/actions/posts.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50_000),
})

type ActionResult = { success: true } | { success: false; error: string }

export async function createPost(formData: FormData): Promise<ActionResult> {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  // 2. Validate input
  const parsed = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // 3. Perform mutation
  try {
    await db.post.create({
      data: { ...parsed.data, authorId: session.user.id },
    })
  } catch {
    return { success: false, error: 'Failed to create post' }
  }

  // 4. Revalidate THEN redirect
  revalidatePath('/posts')
  redirect('/posts')
}
\`\`\`

## Anti-Pattern — unvalidated Server Action

\`\`\`typescript
// BAD: no auth check, no input validation, no error handling
'use server'

import { db } from '@/lib/db'

export async function createPost(formData: FormData) {
  await db.post.create({
    data: {
      title: formData.get('title') as string, // unsafe cast, no validation
      content: formData.get('content') as string,
    },
  })
  // no revalidation — UI will show stale data
}
\`\`\`

---

## Using Server Actions in Client Components

\`\`\`tsx
// app/posts/create/page.tsx
'use client'

import { useActionState } from 'react'
import { createPost } from '@/app/actions/posts'

export default function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, null)

  return (
    <form action={action}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  )
}
\`\`\`
`,
      },
      {
        path: 'nextjs/caching-strategy.md',
        governance: 'mandatory',
        description: 'Next.js caching layers, revalidation, and performance optimization',
        content: `# Next.js Caching Strategy

## Four Caching Layers

| Layer | What | Where | Duration | Opt-out |
|-------|------|-------|----------|---------|
| **Request Memoization** | Return values of \`fetch\`/\`React.cache\` | Server (per request) | Single request lifecycle | \`AbortController.signal\` |
| **Data Cache** | Fetched data | Server (persistent) | Until revalidated | \`{ cache: 'no-store' }\` |
| **Full Route Cache** | HTML + RSC Payload | Server (persistent) | Until revalidated or redeployed | Dynamic APIs, \`force-dynamic\` |
| **Router Cache** | RSC Payload | Client (in-memory) | Session / 5 min | \`router.refresh()\`, \`revalidatePath\` |

---

## Revalidation Patterns

### Time-based (ISR) — stale-while-revalidate
\`\`\`typescript
// Revalidate product data every 60 seconds
const product = await fetch(\`https://api.store.com/products/\${id}\`, {
  next: { revalidate: 60 },
})
\`\`\`

### On-demand — tag-based
\`\`\`typescript
// Tag the fetch
const product = await fetch(\`https://api.store.com/products/\${id}\`, {
  next: { tags: [\`product-\${id}\`] },
})

// Revalidate in a Server Action after mutation
import { revalidateTag } from 'next/cache'

export async function updateProduct(id: string, data: ProductData) {
  'use server'
  await db.product.update({ where: { id }, data })
  revalidateTag(\`product-\${id}\`)
}
\`\`\`

### On-demand — path-based
\`\`\`typescript
import { revalidatePath } from 'next/cache'

export async function publishPost() {
  'use server'
  // ...mutation
  revalidatePath('/blog')     // revalidate the /blog route
  revalidatePath('/blog', 'layout') // revalidate including nested segments
}
\`\`\`

---

## When to Use Dynamic Rendering

A route becomes dynamic automatically when it accesses request-specific APIs:
- \`cookies()\`, \`headers()\`, \`connection()\`
- \`searchParams\` prop in Page components
- \`fetch\` with \`{ cache: 'no-store' }\`

### Correct — intentional dynamic rendering
\`\`\`tsx
// app/profile/page.tsx — must be dynamic because it reads cookies
import { cookies } from 'next/headers'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  // ...fetch user with token
}
\`\`\`

### Anti-Pattern — accidentally dynamic
\`\`\`tsx
// BAD: using force-dynamic when time-based revalidation would suffice
export const dynamic = 'force-dynamic' // skips ALL caching

export default async function ProductsPage() {
  const products = await fetch('https://api.store.com/products')
  // This data updates every few minutes — use revalidate instead:
  // next: { revalidate: 300 }
}
\`\`\`

---

## Request Memoization with React.cache

For non-fetch data sources (databases, CMS clients, GraphQL), use \`React.cache()\` to deduplicate within a single request:

\`\`\`typescript
// lib/data.ts
import { cache } from 'react'
import { db } from '@/lib/db'

export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } })
})

// Call getUser(id) in multiple Server Components — only one DB query per request
\`\`\`
`,
      },
      {
        path: 'nextjs/performance.md',
        governance: 'recommended',
        description: 'Next.js performance optimization, images, fonts, and bundle size',
        content: `# Next.js Performance Optimization

## Image Optimization with next/image

### Correct
\`\`\`tsx
import Image from 'next/image'

// Static import — width/height inferred automatically
import heroImage from '@/public/hero.jpg'

export function Hero() {
  return (
    <Image
      src={heroImage}
      alt="Product hero banner"
      priority              // above-the-fold LCP image
      placeholder="blur"    // blur-up from static import
    />
  )
}

// Remote image — must specify dimensions or use fill
export function Avatar({ url, name }: { url: string; name: string }) {
  return (
    <Image
      src={url}
      alt={\`\${name}'s avatar\`}
      width={48}
      height={48}
      className="rounded-full"
    />
  )
}

// Fill mode for unknown dimensions
export function Banner({ src }: { src: string }) {
  return (
    <div className="relative aspect-video">
      <Image src={src} alt="Banner" fill className="object-cover" />
    </div>
  )
}
\`\`\`

### Anti-Pattern
\`\`\`tsx
// BAD: raw img tag — no optimization, no lazy loading, no responsive sizing
<img src="/hero.jpg" />

// BAD: no alt text — accessibility violation
<Image src={heroImage} alt="" />

// BAD: missing priority on LCP image — slower First Contentful Paint
<Image src={heroImage} alt="Hero" /> // should have priority
\`\`\`

Configure remote image domains in \`next.config.ts\`:
\`\`\`typescript
// next.config.ts
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
}
export default config
\`\`\`

---

## Font Optimization

\`\`\`tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',       // CSS variable for flexibility
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${inter.variable} \${mono.variable}\`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
\`\`\`

---

## Bundle Optimization

- Use \`next/dynamic\` for heavy client components that are not needed on first render:
\`\`\`tsx
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('./rich-editor'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-100" />,
  ssr: false, // only if component truly cannot render on server
})
\`\`\`

- Analyze bundle size regularly:
\`\`\`bash
ANALYZE=true npm run build
\`\`\`

- Prefer named imports over namespace imports for tree-shaking:
\`\`\`typescript
// Good: tree-shakeable
import { format } from 'date-fns'

// Bad: imports entire library
import * as dateFns from 'date-fns'
\`\`\`

---

## Metadata & SEO

\`\`\`tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { getPost } from '@/lib/posts'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}
\`\`\`

- Use file-based metadata: \`robots.ts\`, \`sitemap.ts\`, \`opengraph-image.tsx\` for dynamic OG images
- Implement JSON-LD structured data for rich search results
`,
      },
      {
        path: 'nextjs/security.md',
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
          command: `node -e "
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
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `node -e "
const f = process.argv[1] || '';
if (!/\\.(tsx|jsx)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/<img\\s/.test(c) && !/next\\/image/.test(c)) {
  console.log('Warning: Raw <img> tag detected. Use next/image for automatic optimization, lazy loading, and responsive sizing.');
}
if (/<a\\s+href=/.test(c) && /href=[\"\\x27]\\//.test(c) && !/next\\/link/.test(c)) {
  console.log('Warning: Raw <a> tag with internal href detected. Use next/link for client-side navigation and prefetching.');
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `node -e "
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
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
