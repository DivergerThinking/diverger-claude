import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const remixProfile: Profile = {
  id: 'frameworks/remix',
  name: 'Remix',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['remix'],
  dependsOn: ['frameworks/react'],
  contributions: {
    claudeMd: [
      {
        heading: 'Remix Conventions',
        order: 20,
        content: `## Remix Conventions

Web-standards-first framework. Loader/action pattern with progressive enhancement.

**Detailed rules:** see \`.claude/rules/remix/\` directory.

**Key rules:**
- Every route has a loader (GET data) and/or action (mutations) — colocated with the component
- Use \`<Form>\` for mutations with progressive enhancement, \`useFetcher\` for non-navigation mutations
- Nested routes via file-based routing — each segment owns its data loading and error boundaries
- Always validate action inputs with Zod, always check auth in loaders
- Use \`defer\` for non-critical data, \`redirect\` after successful mutations`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx remix:*)',
          'Bash(npx remix vite\\:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run start:*)',
        ],
      },
    },
    rules: [
      {
        path: 'remix/loader-action-patterns.md',
        paths: ['app/**/*', 'app/routes/**/*'],
        governance: 'mandatory',
        description: 'Remix loader/action pattern, data loading, and mutation conventions',
        content: `# Remix Loader & Action Patterns

## Loader — Server-Side Data Loading (GET)
- Loaders run on the server for every GET request to a route
- Return data with \`json()\` helper — Remix serializes and sends to the component
- Always check authentication and authorization inside the loader
- Use \`throw redirect('/login')\` for unauthenticated users — do NOT return null
- Use \`throw json({ message: 'Not found' }, { status: 404 })\` for missing resources

### Loader Pattern
\`\`\`typescript
import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { requireUser } from '~/auth.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!user) throw redirect('/login');

  const item = await db.item.findUnique({ where: { id: params.id } });
  if (!item) throw json({ message: 'Not found' }, { status: 404 });
  if (item.ownerId !== user.id) throw json({ message: 'Forbidden' }, { status: 403 });

  return json({ item });
}
\`\`\`

## Action — Server-Side Mutations (POST/PUT/DELETE)
- Actions handle non-GET requests (form submissions, mutations)
- Always validate ALL input with Zod before processing
- Always verify authentication and authorization
- Return typed responses: \`{ success, errors? }\` or redirect after success
- Use \`redirect()\` after successful mutations to prevent double-submit

### Action Pattern
\`\`\`typescript
import { redirect, json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  if (!user) throw redirect('/login');

  const formData = await request.formData();
  const result = CreateSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 422 });
  }

  await db.item.create({ data: { ...result.data, ownerId: user.id } });
  return redirect('/items');
}
\`\`\`

## Key Rules
- Loaders and actions are server-only — safe for secrets, DB queries, and auth checks
- Never import loader/action code in client-side modules
- Use \`invariant()\` or \`throw\` for expected conditions — Remix catches and renders ErrorBoundary
- Prefer \`throw json()\` over \`return json()\` for error states — cleaner control flow
`,
      },
      {
        path: 'remix/routing-and-ui-patterns.md',
        paths: ['app/**/*', 'app/routes/**/*'],
        governance: 'mandatory',
        description: 'Remix nested routing, forms, fetchers, and UI patterns',
        content: `# Remix Routing & UI Patterns

## File-Based Routing
- \`app/routes/_index.tsx\` — root index route (\`/\`)
- \`app/routes/about.tsx\` — static route (\`/about\`)
- \`app/routes/users.$userId.tsx\` — dynamic segment (\`/users/:userId\`)
- \`app/routes/users._index.tsx\` — index of parent layout
- \`app/routes/_auth.tsx\` — pathless layout (groups routes under shared layout)
- \`app/routes/_auth.login.tsx\` — child of pathless layout (\`/login\`)
- \`app/routes/api.webhook.ts\` — resource route (no UI, just loader/action)

## Nested Routes & Outlets
- Parent routes render \`<Outlet />\` where child route UI appears
- Each route segment owns its own data loading — no waterfall when navigating
- Use \`useMatches()\` to access data from parent routes when needed
- Route modules are independent — a child never imports from its parent

## Form Component — Progressive Enhancement
\`\`\`tsx
import { Form, useActionData, useNavigation } from '@remix-run/react';

export default function NewItem() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      <input name="title" defaultValue="" />
      {actionData?.errors?.title && <p>{actionData.errors.title}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </Form>
  );
}
\`\`\`

## Fetcher — Non-Navigation Mutations
- Use \`useFetcher()\` for mutations that should NOT trigger a page navigation
- Common use cases: like buttons, inline edits, add-to-cart, delete from list
- Fetcher revalidates loader data after action completes

\`\`\`tsx
function DeleteButton({ itemId }: { itemId: string }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== 'idle';

  return (
    <fetcher.Form method="post" action={\`/items/\${itemId}/delete\`}>
      <button type="submit" disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </fetcher.Form>
  );
}
\`\`\`

## Error & Catch Boundaries
- Export \`ErrorBoundary\` from route modules to catch loader/action/render errors
- Use \`isRouteErrorResponse()\` to distinguish expected errors (404, 403) from unexpected
- Each route can have its own ErrorBoundary — errors stay contained to the segment

## Deferred Data
- Use \`defer()\` for non-critical data that can stream after initial render
- Wrap deferred values in \`<Await>\` with a \`<Suspense>\` fallback
- Critical data (above the fold): return directly; non-critical (below the fold): defer
`,
      },
      {
        path: 'remix/security.md',
        paths: ['app/**/*', 'app/routes/**/*'],
        governance: 'mandatory',
        description: 'Remix security patterns for loaders, actions, and CSRF protection',
        content: `# Remix Security

## Loader Authentication
- EVERY loader serving protected data MUST verify the user session
- Use a shared \`requireUser(request)\` utility that throws redirect to login
- Never return data from a loader without checking if the user is authorized to see it
- Check resource ownership — prevent IDOR by verifying \`resource.ownerId === user.id\`

### Auth Utility Pattern
\`\`\`typescript
// app/auth.server.ts
import { redirect } from '@remix-run/node';
import { getSession } from './session.server';

export async function requireUser(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');
  if (!userId) throw redirect('/login');

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw redirect('/login');

  return user;
}
\`\`\`

## Action Input Validation
- Validate ALL form data with Zod before any processing
- Never trust \`formData\` directly — always parse through a schema
- Return structured error responses for invalid input
- Sanitize string inputs to prevent XSS (especially if rendering user content)

## CSRF Protection
- Remix \`<Form>\` uses standard HTML forms — add CSRF tokens for session-based auth
- Use \`remix-utils/csrf\` or a custom CSRF token pattern
- Verify the CSRF token in every action that modifies data

## Session Security
- Use \`createCookieSessionStorage()\` with secure options
- Set \`httpOnly: true\`, \`secure: true\`, \`sameSite: 'lax'\`
- Rotate session IDs after login to prevent session fixation
- Set reasonable session expiration — no permanent sessions

## Content Security
- Set security headers via Remix entry.server or middleware
- Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
- Never use \`dangerouslySetInnerHTML\` with unsanitized user input
- Sanitize Markdown/rich-text content before rendering

## Resource Routes
- Resource routes (no default export) are API endpoints — apply same security as loaders/actions
- Always validate input, check auth, and return proper status codes
- Rate-limit sensitive resource routes (login, password reset, file upload)
`,
      },
      {
        path: 'remix/performance.md',
        paths: ['app/**/*', 'app/routes/**/*'],
        governance: 'recommended',
        description: 'Remix performance optimization, caching, and data loading strategies',
        content: `# Remix Performance

## Data Loading Optimization
- Remix parallelizes loader calls for nested routes — no waterfall by default
- Use \`defer()\` for non-critical data that can load after the initial render
- Avoid fetching data in \`useEffect\` — use loaders for server-side data
- Use \`shouldRevalidate\` to prevent unnecessary loader re-runs on navigation

## HTTP Caching Headers
- Set \`Cache-Control\` headers in loader responses for cacheable data
- Use \`stale-while-revalidate\` for data that changes infrequently
- CDN caching: add \`s-maxage\` for shared cache, \`max-age\` for browser cache

\`\`\`typescript
export async function loader() {
  const data = await getPublicData();
  return json(data, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
\`\`\`

## Prefetching
- \`<Link prefetch="intent">\` — prefetch on hover/focus (recommended default)
- \`<Link prefetch="render">\` — prefetch as soon as the link renders (for critical navigation)
- \`<Link prefetch="viewport">\` — prefetch when link enters viewport (for long lists)

## Bundle Optimization
- Use \`remix-flat-routes\` for better route organization in large apps
- Lazy-load heavy client-side libraries with dynamic \`import()\`
- Keep route modules focused — split large components into separate files
- Use \`clientLoader\` for client-side caching of previously loaded data

## Image and Asset Optimization
- Use responsive images with \`srcset\` and \`sizes\` attributes
- Serve optimized images via a CDN or image optimization service
- Set long cache headers for static assets (Remix adds content hashes)
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['remix-route-generator'],
        prompt: `## Remix-Specific Review

### Loader & Action Patterns
- Verify every loader checks authentication before returning data
- Check that actions validate ALL inputs with Zod or similar schema library
- Verify actions redirect after successful mutations to prevent double-submit
- Check that error responses use proper HTTP status codes (422 for validation, 403 for forbidden, 404 for not found)
- Verify loaders use \`throw redirect()\` for unauthenticated users, not \`return null\`
- Check that loaders verify resource ownership to prevent IDOR vulnerabilities

### Routing & UI
- Verify \`ErrorBoundary\` is exported from route modules with data loading
- Check that \`isRouteErrorResponse()\` is used to distinguish expected from unexpected errors
- Verify \`<Form>\` is used for mutations instead of manual fetch calls (progressive enhancement)
- Check that \`useFetcher\` is used for non-navigation mutations (likes, inline edits, delete)
- Verify \`useNavigation().state\` is used to show loading/submitting states
- Check that \`<Link prefetch="intent">\` is used for navigation links

### Data Flow
- Verify no data fetching in \`useEffect\` — use loaders for server data
- Check that \`defer()\` is used for non-critical below-the-fold data
- Verify \`shouldRevalidate\` is considered for routes with expensive loaders
- Check that \`useActionData\` is used to display form errors from actions
- Verify resource routes (no UI) have proper auth and validation

### Performance
- Check for proper \`Cache-Control\` headers on cacheable loader responses
- Verify no waterfall patterns — data should load in parallel via nested routes
- Check that heavy client libraries are dynamically imported`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Remix Security Review

### Authentication & Authorization
- Verify EVERY loader serving protected data calls \`requireUser(request)\` or equivalent
- Check that EVERY action verifies authentication before processing
- Verify resource ownership checks in loaders that return user-specific data
- Check that session configuration uses \`httpOnly: true\`, \`secure: true\`, \`sameSite: 'lax'\`
- Verify session IDs are rotated after login

### Input Validation
- Verify ALL actions parse form data through a Zod schema before processing
- Check for raw \`formData.get()\` usage without validation — flag as security risk
- Verify string inputs are sanitized if they will be rendered as HTML
- Check that file upload actions validate file type, size, and content

### CSRF & Headers
- Verify CSRF protection is in place for session-based authentication
- Check that security headers are set (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Verify no \`dangerouslySetInnerHTML\` with unsanitized user content
- Check that CORS is configured restrictively for resource routes

### Session Security
- Verify session storage uses secure cookie configuration
- Check for sensitive data stored in sessions (should be minimal — IDs only)
- Verify session expiration is set to a reasonable duration
- Check that logout properly destroys the session`,
      },
    ],
    skills: [
      {
        name: 'remix-route-generator',
        description: 'Scaffold a new Remix route with loader, action, component, and error boundary',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Remix Route Generator

Generate a complete Remix route module with:

1. **Loader** — authenticated data fetching with proper error handling
2. **Action** — Zod-validated mutations with redirect on success
3. **Component** — \`<Form>\` with progressive enhancement, loading states, error display
4. **ErrorBoundary** — handles both expected (4xx) and unexpected errors
5. **Meta** — SEO metadata via \`meta\` export

### Template: Route Module
\`\`\`tsx
import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, useLoaderData, useActionData, useNavigation, isRouteErrorResponse, useRouteError } from '@remix-run/react';
import { z } from 'zod';
import { requireUser } from '~/auth.server';

const InputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
});

export const meta: MetaFunction = () => [
  { title: 'Page Title' },
  { name: 'description', content: 'Page description' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const items = await db.item.findMany({ where: { ownerId: user.id } });
  return json({ items });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const result = InputSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 422 });
  }

  await db.item.create({ data: { ...result.data, ownerId: user.id } });
  return redirect('/items');
}

export default function ItemsPage() {
  const { items } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div>
      <h1>Items</h1>
      <Form method="post">
        <input name="title" />
        {actionData?.errors?.title && <p className="error">{actionData.errors.title}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
      </Form>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div role="alert">
        <h2>{error.status} — {error.statusText}</h2>
        <p>{error.data?.message ?? 'An error occurred'}</p>
      </div>
    );
  }

  return (
    <div role="alert">
      <h2>Unexpected Error</h2>
      <p>Something went wrong. Please try again.</p>
    </div>
  );
}
\`\`\`
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
if (!/app\\/routes\\//.test(f) || !/\\.(tsx|ts)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/export\\s+(async\\s+)?function\\s+loader/.test(c)) {
  const loaderBody = c.split(/export\\s+(async\\s+)?function\\s+loader/)[2] || '';
  const firstBlock = loaderBody.slice(0, 600);
  if (!/requireUser|getUser|session|auth|authenticate|getSession/.test(firstBlock)) {
    console.log('Warning: Loader detected without apparent authentication check. Always verify the user session in loaders serving protected data.');
  }
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
if (!/app\\/routes\\//.test(f) || !/\\.(tsx|ts)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/export\\s+(async\\s+)?function\\s+action/.test(c)) {
  const actionBody = c.split(/export\\s+(async\\s+)?function\\s+action/)[2] || '';
  const firstBlock = actionBody.slice(0, 800);
  if (!/z\\.|zod|schema|parse|safeParse|validate/.test(firstBlock)) {
    console.log('Warning: Action detected without apparent input validation. Always validate form data with Zod before processing.');
  }
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
