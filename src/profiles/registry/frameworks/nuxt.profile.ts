import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const nuxtProfile: Profile = {
  id: 'frameworks/nuxt',
  name: 'Nuxt',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['nuxt'],
  dependsOn: ['frameworks/vue'],
  contributions: {
    claudeMd: [
      {
        heading: 'Nuxt Conventions',
        order: 20,
        content: `## Nuxt Conventions

Nuxt 3 with auto-imports, file-based routing, and \`useFetch\`/\`useAsyncData\` for data loading.

**Detailed rules:** see \`.claude/rules/nuxt/\` directory.

**Key rules:**
- File-based routing in \`pages/\`, layouts in \`layouts/\`, server routes in \`server/api/\`
- \`useFetch\` for component data, \`$fetch\` for event handlers — avoid mixing
- Composables auto-imported from \`composables/\` — prefix with \`use\`
- Server-side: use \`defineEventHandler\`, validate with \`zod\` or \`h3\` validators`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx nuxi:*)',
          'Bash(npx nuxt:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run generate:*)',
          'Bash(npm run preview:*)',
          'Bash(npx vitest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'nuxt/architecture.md',
        paths: ['**/*.vue', 'pages/**/*', 'server/**/*', 'composables/**/*'],
        governance: 'mandatory',
        description: 'Nuxt directory structure, routing, data fetching, server routes, and state management',
        content: `# Nuxt Architecture

## Directory Structure (Nuxt 4)

Nuxt 4 introduced the \`app/\` directory as the application root, separating client-side
application code from server code and shared utilities. Respect this boundary strictly.

\`\`\`
app/
  pages/             # File-based routing — each .vue becomes a route
  components/        # Auto-imported Vue components (supports subdirectories)
  composables/       # Auto-imported composable functions (use* prefix)
  layouts/           # Page layout wrappers (default.vue, admin.vue, etc.)
  middleware/        # Route middleware (navigation guards)
  plugins/           # Nuxt/Vue plugins (client, server, or universal)
  app.vue            # Root component (or app.config.ts for app-level config)
  error.vue          # Global error page
  assets/            # Build-processed assets (CSS, SCSS, images)
server/
  api/               # Server API routes (Nitro h3 handlers)
  routes/            # Non-API server routes
  middleware/        # Server-side middleware (runs on every request)
  plugins/           # Nitro lifecycle plugins (e.g., DB init)
  utils/             # Server-only utilities (auto-imported in server context)
  tsconfig.json      # Server-specific TypeScript config
shared/
  types/             # Types shared between app/ and server/
  utils/             # Utilities shared between app/ and server/
public/              # Static assets served at root URL (favicon, robots.txt)
layers/              # Nuxt layers for shared configuration
content/             # Markdown/YAML content (when using @nuxt/content)
nuxt.config.ts       # Nuxt configuration
\`\`\`

---

## File-Based Routing

Every \`.vue\` file in \`app/pages/\` automatically becomes a route.

\`\`\`typescript
// Route mapping examples:
// app/pages/index.vue          -> /
// app/pages/about.vue          -> /about
// app/pages/users/index.vue    -> /users
// app/pages/users/[id].vue     -> /users/:id   (dynamic param)
// app/pages/posts/[...slug].vue -> /posts/*     (catch-all)
// app/pages/[[optional]].vue   -> /:optional?  (optional param)
\`\`\`

\`\`\`vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const userId = route.params.id as string

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
  keepalive: true,
})

const { data: user, status } = await useFetch(\`/api/users/\${userId}\`)
</script>

<template>
  <div v-if="status === 'pending'">Loading...</div>
  <div v-else-if="user">
    <h1>{{ user.name }}</h1>
  </div>
</template>
\`\`\`

### Route Middleware
- Place global middleware in \`app/middleware/\` with a \`.global.ts\` suffix
- Place named middleware in \`app/middleware/\` and reference via \`definePageMeta\`
- Inline middleware is defined directly in \`definePageMeta\` for page-specific guards

\`\`\`typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
\`\`\`

---

## Auto-Imports

Nuxt auto-imports from several sources. Never add manual imports for these:

| Source | What is auto-imported |
|--------|----------------------|
| Vue | \`ref\`, \`computed\`, \`watch\`, \`reactive\`, \`onMounted\`, etc. |
| Nuxt composables | \`useFetch\`, \`useAsyncData\`, \`useHead\`, \`useState\`, \`navigateTo\`, etc. |
| \`app/composables/\` | All named exports (scans top-level files and \`index.ts\` in subdirs) |
| \`app/utils/\` | All named exports |
| \`server/utils/\` | All named exports (server context only) |
| \`app/components/\` | All \`.vue\` components (prefix by subdirectory name) |

Use \`#imports\` for explicit imports when auto-import is ambiguous or for type-only imports:

\`\`\`typescript
import type { Ref } from '#imports'
\`\`\`

---

## Data Fetching

### useFetch — for API calls in component setup
\`\`\`vue
<script setup lang="ts">
// Simple GET with SSR support, caching, and deduplication
const { data: posts, status, error, refresh } = await useFetch('/api/posts')

// With query params, transform, and watch
const page = ref(1)
const { data: results } = await useFetch('/api/search', {
  query: { page, q: 'nuxt' },
  transform: (response) => response.items,
  watch: [page],
})
\`\`\`

### useAsyncData — for custom async logic
\`\`\`vue
<script setup lang="ts">
// Wraps any async function with SSR support
const { data: stats } = await useAsyncData('dashboard-stats', () => {
  return Promise.all([
    $fetch('/api/stats/users'),
    $fetch('/api/stats/revenue'),
  ])
})
\`\`\`

### Anti-Patterns
\`\`\`typescript
// WRONG: $fetch in component setup — causes double fetch (server + client)
const data = await $fetch('/api/posts')

// WRONG: raw fetch — no SSR payload transfer, no caching
const data = await fetch('/api/posts').then(r => r.json())

// CORRECT: use $fetch only inside event handlers or server routes
async function handleDelete(id: string) {
  await $fetch(\`/api/posts/\${id}\`, { method: 'DELETE' })
  await refreshNuxtData('posts')
}
\`\`\`

---

## Server Routes (Nitro)

### API Endpoints
\`\`\`typescript
// server/api/users/[id].get.ts — GET /api/users/:id
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing user ID' })
  }
  const user = await getUserById(id)
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  return user
})
\`\`\`

\`\`\`typescript
// server/api/users.post.ts — POST /api/users
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  // Always validate input in server routes
  if (!body.email || !body.name) {
    throw createError({ statusCode: 422, message: 'Name and email required' })
  }
  return await createUser(body)
})
\`\`\`

### Method Suffixes
Use file suffixes to scope handlers to HTTP methods:
- \`users.get.ts\` — handles GET only
- \`users.post.ts\` — handles POST only
- \`users/[id].put.ts\` — handles PUT only
- \`users/[id].delete.ts\` — handles DELETE only

### Server Middleware
\`\`\`typescript
// server/middleware/log.ts — runs on EVERY server request
export default defineEventHandler((event) => {
  console.log(\`[\${event.method}] \${getRequestURL(event)}\`)
  // Do NOT return a value — returning ends the request
})
\`\`\`

### Server Utilities
Place shared server logic in \`server/utils/\` — these are auto-imported in the server context:
\`\`\`typescript
// server/utils/db.ts
export function getUserById(id: string) {
  return db.select().from(users).where(eq(users.id, id)).get()
}
\`\`\`

---

## State Management

### useState — SSR-safe reactive state
\`\`\`vue
<script setup lang="ts">
// SSR-safe — serialized from server, hydrated on client
const counter = useState<number>('counter', () => 0)
const user = useState<User | null>('current-user', () => null)
\`\`\`

### When to use what
| Need | Solution |
|------|----------|
| Local component state | \`ref()\` / \`reactive()\` |
| State shared across components (SSR-safe) | \`useState()\` |
| Complex state with actions and getters | Pinia with \`@pinia/nuxt\` |
| Environment values | \`useRuntimeConfig()\` |
| Build-time values | \`useAppConfig()\` |

### Anti-Pattern: Module-scope refs
\`\`\`typescript
// WRONG: Shared across ALL users in SSR — state leak vulnerability
const count = ref(0)
export function useCounter() { return { count } }

// CORRECT: SSR-safe per-request state
export function useCounter() {
  const count = useState('counter', () => 0)
  return { count }
}
\`\`\`

---

## Layouts

\`\`\`vue
<!-- app/layouts/default.vue -->
<template>
  <div>
    <AppHeader />
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
\`\`\`

\`\`\`vue
<!-- Set layout per page -->
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})
</script>
\`\`\`

Disable the default layout for a specific page with \`layout: false\`.
`,
      },
      {
        path: 'nuxt/rendering-and-deployment.md',
        paths: ['**/*.vue', 'pages/**/*', 'server/**/*', 'composables/**/*'],
        governance: 'recommended' as const,
        description: 'Nuxt rendering modes, route rules, Nitro deployment, modules, SEO, error handling, and layers',
        content: `# Nuxt Rendering, Deployment & Advanced Patterns

## Rendering Modes

Nuxt supports hybrid rendering — configure per route with \`routeRules\`:

\`\`\`typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/':           { prerender: true },           // SSG at build time
    '/blog/**':    { isr: 3600 },                 // ISR: regenerate every hour
    '/admin/**':   { ssr: false },                // SPA: client-only
    '/api/**':     { cors: true, headers: { 'cache-control': 's-maxage=60' } },
    '/dashboard':  { swr: 600 },                  // Stale-While-Revalidate
  },
})
\`\`\`

| Mode | When to use |
|------|-------------|
| \`ssr: true\` (default) | Dynamic content that needs SEO and fresh data |
| \`prerender: true\` | Static pages known at build time (landing, blog posts) |
| \`isr: seconds\` | Content that changes occasionally (product pages) |
| \`swr: seconds\` | Serve stale while revalidating in background |
| \`ssr: false\` | Client-only pages with no SEO need (admin dashboards) |

---

## Nitro Deployment

Configure the deployment target with Nitro presets:

\`\`\`typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server',  // Also: vercel, netlify, cloudflare-pages, bun, deno, etc.
    storage: {
      redis: { driver: 'redis', url: process.env.REDIS_URL },
    },
  },
})
\`\`\`

### Nitro Features
- **Storage**: \`useStorage()\` for KV storage with multiple drivers (fs, redis, cloudflare-kv)
- **Caching**: \`defineCachedEventHandler\` and \`defineCachedFunction\` for server-side caching
- **Tasks**: \`defineTask()\` for background processing and scheduled jobs
- **Plugins**: \`defineNitroPlugin()\` for server lifecycle hooks (DB init, graceful shutdown)

\`\`\`typescript
// server/api/posts.get.ts — with Nitro caching
export default defineCachedEventHandler(async (event) => {
  return await db.select().from(posts).all()
}, {
  maxAge: 60 * 10,  // Cache for 10 minutes
  swr: true,        // Serve stale while revalidating
})
\`\`\`

---

## Modules

Register modules in \`nuxt.config.ts\`. Prefer official and well-maintained community modules:

\`\`\`typescript
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',          // State management
    '@nuxt/image',          // Image optimization
    '@nuxt/content',        // Markdown/YAML content
    '@nuxt/fonts',          // Font optimization
    '@nuxtjs/i18n',         // Internationalization
    '@nuxt/test-utils/module', // Testing utilities
    '@nuxt/eslint',         // ESLint integration
  ],
})
\`\`\`

### Custom Module Development
\`\`\`typescript
// modules/my-module.ts
export default defineNuxtModule({
  meta: { name: 'my-module', configKey: 'myModule' },
  defaults: { enabled: true },
  setup(options, nuxt) {
    if (!options.enabled) return
    addImports({ name: 'useMyHelper', from: resolve('./runtime/composables') })
  },
})
\`\`\`

---

## SEO & Head Management

\`\`\`vue
<script setup lang="ts">
// Recommended: useSeoMeta for type-safe SEO tags
useSeoMeta({
  title: 'My Page Title',
  ogTitle: 'My Page Title',
  description: 'Page description for search engines',
  ogDescription: 'Page description for social sharing',
  ogImage: 'https://example.com/og-image.png',
  twitterCard: 'summary_large_image',
})

// useHead for non-SEO head tags (scripts, links, etc.)
useHead({
  htmlAttrs: { lang: 'en' },
  link: [{ rel: 'canonical', href: 'https://example.com/page' }],
})
</script>
\`\`\`

Use \`useServerSeoMeta\` in server routes or plugins for SEO tags that only need server rendering.
Set global defaults in \`nuxt.config.ts\` with the \`app.head\` property.

---

## Error Handling

### Application Errors
\`\`\`vue
<!-- app/error.vue — global error page -->
<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()

const handleClear = () => clearError({ redirect: '/' })
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleClear">Go Home</button>
  </div>
</template>
\`\`\`

### In-Page Error Handling
\`\`\`vue
<script setup lang="ts">
const { data, error } = await useFetch('/api/data')

// Use NuxtErrorBoundary for granular error isolation
</script>

<template>
  <NuxtErrorBoundary>
    <DataDisplay :data="data" />
    <template #error="{ error, clearError }">
      <p>Something went wrong: {{ error.message }}</p>
      <button @click="clearError">Retry</button>
    </template>
  </NuxtErrorBoundary>
</template>
\`\`\`

### Server Error Handling
\`\`\`typescript
// server/api/resource.get.ts
export default defineEventHandler(async (event) => {
  try {
    return await fetchExternalService()
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: 'External service unavailable',
      // Never expose internal error details to clients
    })
  }
})
\`\`\`

---

## Nuxt Layers

Layers allow extending a Nuxt application with shared components, composables, pages, and config:

\`\`\`typescript
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [
    './layers/base',           // Local layer
    'github:org/nuxt-layer',   // Remote layer from GitHub
    '@company/shared-layer',   // npm package layer
  ],
})
\`\`\`

Use layers for: design systems, shared configs, multi-tenant apps, and monorepo shared code.

---

## Environment & Configuration

\`\`\`typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only (never exposed to client)
    secretApiKey: '',           // Overridden by NUXT_SECRET_API_KEY env var
    database: { url: '' },      // Overridden by NUXT_DATABASE_URL env var
    // Client-exposed (use with caution)
    public: {
      apiBase: '/api',          // Overridden by NUXT_PUBLIC_API_BASE env var
      siteUrl: '',              // Overridden by NUXT_PUBLIC_SITE_URL env var
    },
  },
  appConfig: {
    // Build-time config, does NOT change per environment
    theme: { primaryColor: '#3B82F6' },
  },
})
\`\`\`

\`\`\`typescript
// Access in app code
const config = useRuntimeConfig()
// Server: config.secretApiKey (available)
// Client: config.public.apiBase (only public is available)

// Access build-time config
const appConfig = useAppConfig()
\`\`\`

### Anti-Pattern
\`\`\`typescript
// WRONG: hardcoded secrets in source code
const apiKey = 'sk-1234567890'

// WRONG: using process.env directly in app code
const apiUrl = process.env.API_URL

// CORRECT: use runtimeConfig with NUXT_ env var prefixes
const { secretApiKey } = useRuntimeConfig()
const { public: { apiBase } } = useRuntimeConfig()
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['nuxt-page-generator', 'nuxt-api-route-generator'],
        prompt: `## Nuxt-Specific Review

### Routing & Navigation
- Verify file-based routing conventions in pages/ — correct dynamic param syntax ([param], [...slug], [[optional]])
- Check that NuxtLink is used for internal navigation, never raw <a> tags
- Verify definePageMeta is used for layout, middleware, and transitions
- Check that route middleware follows naming convention and uses defineNuxtRouteMiddleware

### Data Fetching
- Verify useFetch or useAsyncData is used in component setup — flag raw $fetch or fetch in setup context
- Check that $fetch is used only inside event handlers, onMounted, or server routes
- Verify unique keys are provided to useAsyncData when fetching the same endpoint with different params
- Check for missing error handling on useFetch/useAsyncData (status, error ref)
- Verify lazy option or Suspense usage for non-critical data

### Auto-Imports
- Flag unnecessary manual imports of Vue APIs (ref, computed, watch) — they are auto-imported
- Flag unnecessary imports of Nuxt composables (useFetch, useHead, useState, navigateTo)
- Flag unnecessary component imports — components in app/components/ are auto-imported
- Verify #imports is used for explicit type-only imports when needed

### Server Routes
- Verify server/api/ handlers use defineEventHandler
- Check that all input is validated in server routes (readBody, getQuery, getRouterParam)
- Verify createError is used for error responses with proper status codes
- Check that server middleware does not return values (returning ends the request)
- Verify HTTP method suffixes are used (.get.ts, .post.ts) for method-specific handlers

### State Management
- Verify useState is used for shared state instead of module-scope ref() — SSR state leak risk
- Check that useRuntimeConfig is used for env values, not process.env in app code
- Verify runtimeConfig.public is used for client-accessible values
- Check for proper Pinia store setup when using @pinia/nuxt

### SEO & Head
- Verify useSeoMeta or useHead is used for page-level metadata
- Check for useServerSeoMeta when tags only need server rendering
- Flag pages missing title and description metadata

### Error Handling
- Verify app/error.vue exists for global error handling
- Check NuxtErrorBoundary usage for granular error isolation
- Verify server routes use createError with appropriate status codes`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['nuxt-page-generator', 'nuxt-api-route-generator'],
        prompt: `## Nuxt Testing

### Setup
- Use @nuxt/test-utils with Vitest for Nuxt-aware testing
- Register @nuxt/test-utils/module in nuxt.config.ts modules for test mode
- Use \`setup\` option from @nuxt/test-utils/e2e for full Nuxt context in integration tests

### Component Testing
- Use mountSuspended from @nuxt/test-utils/runtime to mount components with Nuxt context
- Test pages and components with SSR compatibility — mountSuspended handles async setup
- Mock useFetch and useAsyncData responses using vi.mock('#imports') or mockNuxtImport
- Test definePageMeta by verifying layout and middleware assignments

### Server Route Testing
- Test server routes by calling them with $fetch in a Nuxt test context
- Use setup({ host }) from @nuxt/test-utils to start a test server
- Validate response status, headers, and body for all HTTP methods
- Test error cases: invalid input, missing resources, unauthorized access

### Composable Testing
- Test composables in isolation using renderSuspended or a test component wrapper
- Verify SSR behavior: test that useState returns the same value on hydration
- Mock external dependencies (API calls, browser APIs)

### Middleware Testing
- Test route middleware by calling the middleware function directly
- Verify navigation guards: redirect conditions, auth checks
- Mock useUserSession or other auth composables

### E2E Testing
- Use @nuxt/test-utils with Playwright or Cypress for E2E tests
- Test full page renders including SSR hydration
- Verify SEO metadata in rendered HTML
- Test client-side navigation and data fetching transitions`,
      },
    ],
    skills: [
      {
        name: 'nuxt-page-generator',
        description: 'Generate Nuxt pages with proper Nuxt 4 patterns',
        content: `# Nuxt Page Generator

Generate a Nuxt page following Nuxt 4 conventions:

## File Structure
- Page in \`app/pages/\` with correct file-based routing name
- Server API route in \`server/api/\` if the page needs backend data
- Composable in \`app/composables/\` if the page has reusable logic

## Page Template
\`\`\`vue
<script setup lang="ts">
// 1. Page metadata
definePageMeta({
  layout: 'default',
  middleware: [],
})

// 2. SEO metadata
useSeoMeta({
  title: 'Page Title',
  description: 'Page description',
})

// 3. Data fetching with useFetch or useAsyncData
const { data, status, error } = await useFetch('/api/resource')

// 4. Local state and computed values (auto-imported, no manual imports)
const searchQuery = ref('')
const filteredData = computed(() =>
  data.value?.filter(item => item.name.includes(searchQuery.value)) ?? []
)

// 5. Event handlers using $fetch for mutations
async function handleCreate(payload: CreatePayload) {
  await $fetch('/api/resource', { method: 'POST', body: payload })
  await refreshNuxtData()
}
</script>

<template>
  <div>
    <NuxtErrorBoundary>
      <div v-if="status === 'pending'">Loading...</div>
      <div v-else-if="error">Error: {{ error.message }}</div>
      <div v-else>
        <!-- Page content using data -->
      </div>
      <template #error="{ error: boundaryError, clearError }">
        <p>{{ boundaryError.message }}</p>
        <button @click="clearError">Retry</button>
      </template>
    </NuxtErrorBoundary>
  </div>
</template>
\`\`\`

## Server API Route Template
\`\`\`typescript
// server/api/resource.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  // Validate, fetch from DB/external service, return data
  return { items: [] }
})
\`\`\`

## Test Template
\`\`\`typescript
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import MyPage from '~/pages/my-page.vue'

describe('MyPage', () => {
  it('renders page content when data loads', async () => {
    const component = await mountSuspended(MyPage)
    expect(component.text()).toContain('Expected content')
  })
})
\`\`\`
`,
      },
      {
        name: 'nuxt-api-route-generator',
        description: 'Generate Nuxt server API routes with validation and error handling',
        content: `# Nuxt API Route Generator

Generate Nitro server API routes following Nuxt conventions:

## CRUD Route Set
For a given resource, generate the following files:
- \`server/api/[resource].get.ts\` — List all (with pagination)
- \`server/api/[resource].post.ts\` — Create new
- \`server/api/[resource]/[id].get.ts\` — Get by ID
- \`server/api/[resource]/[id].put.ts\` — Update by ID
- \`server/api/[resource]/[id].delete.ts\` — Delete by ID

## Template
\`\`\`typescript
// server/api/posts/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing post ID' })
  }

  const post = await getPostById(id)
  if (!post) {
    throw createError({ statusCode: 404, message: 'Post not found' })
  }

  return post
})
\`\`\`

\`\`\`typescript
// server/api/posts.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<{ title: string; content: string }>(event)

  if (!body.title?.trim() || !body.content?.trim()) {
    throw createError({ statusCode: 422, message: 'Title and content are required' })
  }

  return await createPost(body)
})
\`\`\`

## Key Patterns
- Always validate all inputs (params, query, body)
- Use HTTP method suffixes for file names
- Use createError for all error responses with proper status codes
- Place shared DB/service logic in server/utils/ (auto-imported)
- Use defineCachedEventHandler for read endpoints that benefit from caching
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'node -e "const f=process.argv[1]||\'\';const c=require(\'fs\').readFileSync(f,\'utf8\');if(/composables[\\\\/]/.test(f)&&/^import\\s.*from\\s+[\'\\\"](vue|nuxt|#app)[\'\\\"]/m.test(c))console.log(\'Warning: composable has manual imports of Vue/Nuxt APIs — these are auto-imported in Nuxt, remove the import statements\')" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'node -e "const f=process.argv[1]||\'\';if(!/pages[\\\\/]/.test(f)||!/\\.vue$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/await\\s+\\$fetch\\s*\\(/.test(c)&&/setup/.test(c)&&!/onMounted|onClick|onSubmit|handle[A-Z]/.test(c))console.log(\'Warning: $fetch used in page setup — use useFetch or useAsyncData instead to avoid double fetching\')" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'node -e "const f=process.argv[1]||\'\';if(!/server[\\\\/]middleware[\\\\/]/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/return\\s+(?!void|undefined)/.test(c)&&!/createError|throw/.test(c))console.log(\'Warning: server middleware returns a value — this ends the request. Remove the return unless intentional.\')" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
