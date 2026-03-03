import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const svelteProfile: Profile = {
  id: 'frameworks/svelte',
  name: 'Svelte',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['svelte'],
  contributions: {
    claudeMd: [
      {
        heading: 'Svelte Conventions',
        order: 20,
        content: `## Svelte Conventions

Svelte 5 runes (\`$state\`, \`$derived\`, \`$effect\`). Minimal boilerplate, compiler-driven reactivity.

**Detailed rules:** see \`.claude/rules/svelte/\` directory.

**Key rules:**
- Use runes: \`$state()\` for reactive state, \`$derived()\` for computed, \`$effect()\` sparingly
- Components are \`.svelte\` files — one component per file, props via \`$props()\`
- SvelteKit for routing and SSR — \`+page.svelte\`, \`+layout.svelte\`, \`+server.ts\`
- Minimal \`$effect\` usage — derive state instead of syncing it`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx vite:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run preview:*)',
          'Bash(npx vitest:*)',
          'Bash(npx svelte-kit:*)',
          'Bash(npx svelte-check:*)',
          'Bash(npx playwright:*)',
        ],
      },
    },
    rules: [
      {
        path: 'svelte/architecture.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'mandatory',
        description: 'SvelteKit architecture, routing, data loading, and form actions',
        content: `# Svelte / SvelteKit Architecture

## SvelteKit Project Structure
\`\`\`
src/
  routes/          # File-based routing
    +page.svelte   # Route UI component
    +page.ts       # Universal load function (server + client)
    +page.server.ts# Server-only load + form actions
    +layout.svelte # Shared layout (wraps child routes)
    +layout.server.ts # Layout-level server load
    +error.svelte  # Error boundary per segment
    +server.ts     # API endpoint (GET, POST, PUT, DELETE)
    (group)/       # Route group — organizes without affecting URL
    [...rest]/     # Rest parameter — catches remaining segments
  lib/             # Shared code ($lib alias)
    components/    # Reusable UI components
    server/        # Server-only code ($lib/server)
    utils/         # Shared utilities
    stores/        # .svelte.ts files with shared $state
  params/          # Route parameter matchers
  app.html         # HTML shell template
  app.d.ts         # Generated type definitions
  hooks.server.ts  # Server hooks (handle, handleFetch, handleError)
  hooks.client.ts  # Client hooks (handleError)
static/            # Static assets (served at /)
svelte.config.js   # SvelteKit configuration
vite.config.ts     # Vite configuration
\`\`\`

## Routing

### File Conventions
- \`src/routes/+page.svelte\` renders at \`/\`
- \`src/routes/blog/[slug]/+page.svelte\` renders at \`/blog/:slug\`
- \`src/routes/[...path]/+page.svelte\` catches all unmatched routes
- \`src/routes/(marketing)/about/+page.svelte\` groups without URL impact

### Correct — dynamic route with parameter matcher
\`\`\`svelte
<!-- src/routes/users/[id=integer]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<h1>{data.user.name}</h1>
\`\`\`

\`\`\`typescript
// src/params/integer.ts
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => /^\\d+$/.test(param);
\`\`\`

## Data Loading

### Server Load Functions
\`\`\`typescript
// src/routes/users/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals, depends }) => {
  depends('app:users');

  const users = await locals.db.users.findMany();
  if (!users) throw error(404, 'Users not found');

  return { users };
};
\`\`\`

### Universal vs Server Load
- Use \`+page.server.ts\` (default) — data is always fetched on the server, serialized to the client
- Use \`+page.ts\` only when the load function must also run on client-side navigation AND does not access secrets
- Server load has access to \`locals\`, cookies, database — universal load does not

## Form Actions

### Correct — form with progressive enhancement and validation
\`\`\`typescript
// src/routes/login/+page.server.ts
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    if (!email || !password) {
      return fail(400, { email, message: 'Email and password are required' });
    }

    const user = await locals.auth.login(email, password);
    if (!user) {
      return fail(401, { email, message: 'Invalid credentials' });
    }

    throw redirect(303, '/dashboard');
  },
};
\`\`\`

\`\`\`svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import type { ActionData } from './$types';
  import { enhance } from '$app/forms';

  let { form }: { form: ActionData } = $props();
</script>

<form method="POST" use:enhance>
  <label>
    Email
    <input name="email" type="email" value={form?.email ?? ''} />
  </label>
  <label>
    Password
    <input name="password" type="password" />
  </label>
  {#if form?.message}
    <p class="error">{form.message}</p>
  {/if}
  <button type="submit">Log in</button>
</form>
\`\`\`

## Hooks (Server Middleware)

### Correct — server hooks for auth and error handling
\`\`\`typescript
// src/hooks.server.ts
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session');
  if (sessionToken) {
    event.locals.user = await validateSession(sessionToken);
  }
  return resolve(event);
};

export const handleError: HandleServerError = async ({ error, event }) => {
  const errorId = crypto.randomUUID();
  console.error(\`[error:\${errorId}]\`, error);
  return { message: 'An unexpected error occurred', errorId };
};
\`\`\`
`,
      },
      {
        path: 'svelte/reactivity-and-components.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'mandatory',
        description: 'Svelte 5 runes, component patterns, snippets, and state management',
        content: `# Svelte 5 Reactivity & Component Patterns

## Runes — The Svelte 5 Reactivity Model

### $state — Mutable Reactive State
\`\`\`svelte
<script lang="ts">
  let count = $state(0);
  let user = $state<{ name: string; email: string }>({ name: '', email: '' });

  // Deep reactivity: mutations to nested properties trigger updates
  function updateName(name: string) {
    user.name = name; // This is reactive
  }
</script>
\`\`\`

### $state.raw — Non-Deep Reactive State
Use for large arrays or objects replaced wholesale (better performance):
\`\`\`svelte
<script lang="ts">
  let items = $state.raw<Item[]>([]);

  // Reassignment triggers reactivity, but mutation does NOT
  function setItems(newItems: Item[]) {
    items = newItems; // Triggers update
  }
  // items.push(item) would NOT trigger an update — use reassignment
</script>
\`\`\`

### $derived — Computed Values
\`\`\`svelte
<script lang="ts">
  let items = $state<CartItem[]>([]);
  let total = $derived(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  let isEmpty = $derived(items.length === 0);

  // For multi-statement derivations use $derived.by
  let summary = $derived.by(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = subtotal * 0.21;
    return { subtotal, tax, total: subtotal + tax };
  });
</script>
\`\`\`

### $effect — Side Effects Only
\`\`\`svelte
<script lang="ts">
  let query = $state('');

  // Correct: side effect that syncs with external system
  $effect(() => {
    const controller = new AbortController();
    fetch(\`/api/search?q=\${query}\`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults);
    return () => controller.abort(); // Cleanup function
  });
</script>
\`\`\`

### Anti-Pattern — using $effect to derive state
\`\`\`svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $state(0);

  // WRONG: do not use $effect to derive state — use $derived instead
  $effect(() => {
    doubled = count * 2;
  });

  // CORRECT:
  let doubled = $derived(count * 2);
</script>
\`\`\`

## Component Props ($props)
\`\`\`svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
    onAction?: (id: string) => void;
    children?: import('svelte').Snippet;
  }

  let { title, count = 0, onAction, children }: Props = $props();
</script>

<div>
  <h2>{title} ({count})</h2>
  <button onclick={() => onAction?.('123')}>Act</button>
  {@render children?.()}
</div>
\`\`\`

## Snippets — Reusable Template Fragments
Replace Svelte 4 slots with snippets:

### Correct — snippet as prop for customizable rendering
\`\`\`svelte
<!-- DataTable.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props<T> {
    items: T[];
    row: Snippet<[T]>;
    header?: Snippet;
  }

  let { items, row, header }: Props<any> = $props();
</script>

<table>
  {#if header}
    <thead>{@render header()}</thead>
  {/if}
  <tbody>
    {#each items as item (item.id)}
      <tr>{@render row(item)}</tr>
    {/each}
  </tbody>
</table>
\`\`\`

\`\`\`svelte
<!-- Usage -->
<DataTable items={users}>
  {#snippet header()}
    <tr><th>Name</th><th>Email</th></tr>
  {/snippet}
  {#snippet row(user)}
    <td>{user.name}</td><td>{user.email}</td>
  {/snippet}
</DataTable>
\`\`\`

## Shared Reactive State (.svelte.ts files)
\`\`\`typescript
// src/lib/stores/counter.svelte.ts
export function createCounter(initial = 0) {
  let count = $state(initial);
  let doubled = $derived(count * 2);

  return {
    get count() { return count; },
    get doubled() { return doubled; },
    increment() { count += 1; },
    reset() { count = initial; },
  };
}

// Usage: import and call in any component
// const counter = createCounter();
// counter.increment(); // reactive
\`\`\`

## Event Handling (Svelte 5)
Svelte 5 replaces \`on:\` event directives with standard callback props:

### Correct
\`\`\`svelte
<button onclick={() => count += 1}>Increment</button>
<input oninput={(e) => query = e.currentTarget.value} />
\`\`\`

### Anti-Pattern (Svelte 4 legacy)
\`\`\`svelte
<!-- DEPRECATED in Svelte 5 — do not use on: directive -->
<button on:click={() => count += 1}>Increment</button>
\`\`\`

## Lifecycle
- \`$effect\` replaces \`onMount\` for most use cases — the cleanup return replaces \`onDestroy\`
- Use \`onMount\` only when you need code that runs exclusively on the client after initial render
- Use \`untrack()\` inside \`$effect\` to read reactive values without creating a dependency
`,
      },
      {
        path: 'svelte/performance-and-ssr.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'recommended' as const,
        description: 'SvelteKit SSR, streaming, caching, transitions, and bundle optimization',
        content: `# SvelteKit Performance & SSR

## Server-Side Rendering (SSR)

### Data Fetching
- Fetch data in \`+page.server.ts\` load functions — avoids client-side waterfalls
- Use \`Promise.all\` for independent data fetches within a single load function
- Use \`depends()\` and \`invalidate()\` / \`invalidateAll()\` for targeted re-fetching
- Return only serializable data from load functions — no class instances, functions, or Dates

### Streaming
\`\`\`typescript
// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Fast data loads first, slow data streams in
  const quickData = await locals.db.getSummary();
  return {
    summary: quickData,
    analytics: locals.db.getAnalytics(), // Unresolved promise — streams when ready
  };
};
\`\`\`

\`\`\`svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<h1>Dashboard</h1>
<div>{data.summary.title}</div>

{#await data.analytics}
  <p>Loading analytics...</p>
{:then analytics}
  <AnalyticsChart data={analytics} />
{:catch error}
  <p>Failed to load analytics</p>
{/await}
\`\`\`

### Caching
- Set cache headers in server load functions for CDN/browser caching
- Use \`setHeaders\` from the load event for per-route cache control
- Configure prerendering with \`export const prerender = true\` for static pages

\`\`\`typescript
// src/routes/blog/[slug]/+page.server.ts
export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const post = await getPost(params.slug);
  setHeaders({ 'cache-control': 'public, max-age=3600, s-maxage=86400' });
  return { post };
};
\`\`\`

## Transitions & Animations

### Built-in Transitions
\`\`\`svelte
<script lang="ts">
  import { fade, fly, slide, scale } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  let visible = $state(true);
  let items = $state<Item[]>([]);
</script>

<!-- Simple enter/exit -->
{#if visible}
  <div transition:fade={{ duration: 200 }}>Fading content</div>
{/if}

<!-- Separate in/out -->
{#if visible}
  <div in:fly={{ y: -20, duration: 300 }} out:fade={{ duration: 150 }}>
    Flies in, fades out
  </div>
{/if}

<!-- List with flip animation -->
{#each items as item (item.id)}
  <div animate:flip={{ duration: 300 }} transition:fade>
    {item.name}
  </div>
{/each}
\`\`\`

### Performance Rules for Transitions
- Use \`|local\` modifier to prevent transitions on initial mount: \`transition:fade|local\`
- Avoid transitions on frequently toggled elements — prefer CSS \`opacity\` or \`visibility\`
- Keep transition durations under 300ms for interactive elements
- Use \`animate:flip\` only on \`{#each}\` blocks with keyed items

## Bundle & Runtime Optimization
- SvelteKit auto-splits code per route — no manual config needed
- Use dynamic imports for heavy libraries only used in specific routes
- Set \`ssr: false\` per page only for components that truly cannot render on the server
- Prefer \`$state.raw\` over \`$state\` for large collections that are replaced, not mutated
- Keep reactive state granular — multiple small \`$state\` values over one large object
- Avoid \`$effect\` chains — each effect that sets state triggers another cycle
- Use \`{#key expression}\` blocks to force re-creation when identity changes

## Prerendering & Adapters
- Use \`export const prerender = true\` for static pages (blog posts, docs, marketing)
- Use \`@sveltejs/adapter-auto\` for auto-detected deployment targets
- Use \`@sveltejs/adapter-node\` for Node.js servers
- Use \`@sveltejs/adapter-vercel\` / \`adapter-cloudflare\` for edge platforms
- Configure \`trailingSlash\` in \`svelte.config.js\` for URL consistency
`,
      },
      {
        path: 'svelte/naming-and-files.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'recommended' as const,
        description: 'Svelte naming conventions and file organization',
        content: `# Svelte Naming & File Conventions

## File Naming
- Component files: PascalCase (\`UserCard.svelte\`, \`DataTable.svelte\`)
- Store files: camelCase with \`.svelte.ts\` extension (\`counter.svelte.ts\`, \`auth.svelte.ts\`)
- Utility files: camelCase (\`formatDate.ts\`, \`validators.ts\`)
- Route files: follow SvelteKit conventions (\`+page.svelte\`, \`+page.server.ts\`, \`+layout.svelte\`)
- Test files: same name with \`.test.ts\` suffix (\`UserCard.test.ts\`)

## Component Naming
- PascalCase for component names matching the filename
- Props interface: inline destructuring with \`$props()\` or named \`Props\` type
- Event callbacks: \`onEventName\` pattern (\`onClick\`, \`onSubmit\`, \`onChange\`)

### Correct
\`\`\`svelte
<!-- UserCard.svelte -->
<script lang="ts">
  interface Props {
    name: string;
    email: string;
    onSelect?: (id: string) => void;
  }

  let { name, email, onSelect }: Props = $props();
</script>
\`\`\`

## $lib Organization
\`\`\`
src/lib/
  components/      # Reusable UI components (PascalCase .svelte files)
    ui/            # Generic UI primitives (Button, Modal, Input)
    domain/        # Domain-specific components (UserCard, OrderRow)
  server/          # Server-only code (DB clients, auth helpers)
  stores/          # Shared reactive state (.svelte.ts files)
  utils/           # Pure utility functions
  types/           # Shared TypeScript types
  index.ts         # Public API for the library (optional)
\`\`\`

## Route Organization
- Group related routes with \`(groupName)/\` folders
- Colocate route-specific components alongside the route file
- Extract shared route logic into \`$lib/server/\` or \`$lib/stores/\`

### Correct
\`\`\`
src/routes/
  (marketing)/
    about/+page.svelte
    pricing/+page.svelte
  (app)/
    dashboard/+page.svelte
    dashboard/+page.server.ts
    settings/+page.svelte
    +layout.svelte           # App-wide authenticated layout
    +layout.server.ts        # Auth check for all app routes
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['svelte-component-generator', 'svelte-route-generator'],
        prompt: `## Svelte / SvelteKit Review Checklist

### Runes & Reactivity
- Verify Svelte 5 runes are used: \`$state\`, \`$derived\`, \`$effect\`, \`$props\` — flag any Svelte 4 patterns (\`export let\`, \`$:\` labels, \`on:\` events)
- Check that \`$derived\` is used for computed values — flag \`$effect\` used to derive state
- Verify \`$state.raw\` is used for large collections that are replaced wholesale
- Check that \`$effect\` includes cleanup returns for subscriptions, timers, and abort controllers
- Verify \`$props\` has TypeScript types — flag untyped props

### Component Patterns
- Check that snippets (\`{#snippet}\` / \`{@render}\`) are used instead of Svelte 4 \`<slot />\`
- Verify event handlers use \`onclick\` / \`oninput\` — flag \`on:click\` / \`on:input\` directives
- Check components are small and focused — flag components exceeding 200 lines
- Verify scoped CSS is used — flag unnecessary \`:global()\`
- Check for proper accessibility: semantic HTML, ARIA labels, keyboard handling

### SvelteKit Data Flow
- Verify server-side load functions in \`+page.server.ts\` for data fetching — flag client-side fetch in \`onMount\`
- Check that form actions use \`use:enhance\` for progressive enhancement
- Verify \`fail()\` is used for validation errors in form actions — flag throwing errors
- Check that \`$lib\` alias is used — flag relative imports reaching outside the current route
- Verify server-only code is in \`+page.server.ts\`, \`+server.ts\`, or \`$lib/server/\`
- Check for proper error handling with \`+error.svelte\` boundaries per route segment

### Security
- Verify all form action inputs are validated server-side — never trust client data
- Check that secrets/API keys are only accessed in server load functions or \`$lib/server\`
- Verify \`hooks.server.ts\` handles auth consistently for protected routes`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['svelte-component-generator', 'svelte-route-generator'],
        prompt: `## Svelte / SvelteKit Testing

### Component Testing
- Use \`@testing-library/svelte\` with Vitest for component tests
- Render components with \`render(Component, { props })\` and query the DOM
- Test user interactions via \`@testing-library/user-event\` — click, type, select
- Test reactive state changes by interacting and asserting DOM updates (no direct state access)
- Test snippet rendering by passing snippet props as functions
- Use \`cleanup()\` or auto-cleanup between tests

### Example Pattern
\`\`\`typescript
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Counter from './Counter.svelte';

test('increments count on button click', async () => {
  const user = userEvent.setup();
  render(Counter, { props: { initial: 0 } });

  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('1')).toBeInTheDocument();
});
\`\`\`

### Server Load & Actions Testing
- Test load functions by calling them directly with mocked event objects (\`params\`, \`locals\`, \`cookies\`)
- Test form actions by constructing \`Request\` objects with \`FormData\`
- Verify \`fail()\` responses for validation errors
- Verify \`redirect()\` calls for successful mutations
- Mock database and auth services in \`locals\`

### SvelteKit Module Mocking
- Mock \`$app/navigation\` (\`goto\`, \`invalidate\`, \`invalidateAll\`)
- Mock \`$app/stores\` (\`page\`, \`navigating\`, \`updated\`)
- Mock \`$app/forms\` (\`enhance\`) when testing form components
- Use \`vi.mock()\` for SvelteKit module mocks in Vitest`,
      },
    ],
    skills: [
      {
        name: 'svelte-component-generator',
        description: 'Generate Svelte 5 components with runes, TypeScript, and tests',
        content: `# Svelte 5 Component Generator

Generate a Svelte 5 component following these requirements:

## Component File (.svelte)
- Use \`<script lang="ts">\` with Svelte 5 runes
- Declare props with \`$props()\` and a TypeScript \`Props\` interface
- Use \`$state\` for local mutable state
- Use \`$derived\` / \`$derived.by\` for computed values
- Use \`$effect\` only for DOM side effects or external sync — include cleanup
- Use snippets (\`{#snippet}\`) instead of slots for reusable template fragments
- Use \`onclick\` / \`oninput\` for event handling — not \`on:click\`
- Include scoped \`<style>\` block with CSS custom properties for theming
- Add semantic HTML and ARIA attributes for accessibility

## Test File (.test.ts)
- Use \`@testing-library/svelte\` + Vitest
- Test rendering with different prop combinations
- Test user interactions and resulting DOM changes
- Test accessibility: roles, labels, keyboard navigation

## SvelteKit Integration (if route component)
- Create \`+page.server.ts\` with typed load function
- Create form actions with \`fail()\` validation
- Add \`use:enhance\` to forms
- Add \`+error.svelte\` for the route segment
`,
      },
      {
        name: 'svelte-route-generator',
        description: 'Generate SvelteKit routes with load functions, form actions, and error handling',
        content: `# SvelteKit Route Generator

Generate a complete SvelteKit route with:

## Server Load (+page.server.ts)
- Typed \`PageServerLoad\` function from \`./$types\`
- Data fetching via \`locals\` (database, auth)
- Error handling with \`error()\` from \`@sveltejs/kit\`
- Proper use of \`depends()\` for invalidation keys
- Cache headers via \`setHeaders\` when applicable

## Form Actions (+page.server.ts)
- Named actions when multiple forms exist on the page
- Input validation with \`fail()\` for errors
- \`redirect()\` for successful mutations
- TypeScript types for form data

## Page Component (+page.svelte)
- \`$props()\` to receive \`data\` and \`form\` from server
- \`use:enhance\` on all forms for progressive enhancement
- Loading states with \`{#await}\` for streamed data
- Proper error display from form action results

## Error Boundary (+error.svelte)
- Access error via \`$page.error\` from \`$app/stores\`
- User-friendly error message — no stack traces
- Navigation link back to a safe route

## Layout (+layout.svelte / +layout.server.ts)
- Shared layout with \`{@render children()}\` for child routes
- Layout-level load for shared data (auth, navigation)
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
              'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.svelte\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/export\\s+let\\s/.test(c))issues.push(\'export let detected — use $props() in Svelte 5\');if(/\\$:\\s/.test(c)&&!/\\$:\\/\\//.test(c))issues.push(\'$: reactive label detected — use $derived or $effect in Svelte 5\');if(/on:click|on:input|on:change|on:submit/.test(c))issues.push(\'on: event directive detected — use onclick/oninput in Svelte 5\');if(/<slot/.test(c)&&!/<slot\\s/.test(c)||/<slot\\s/.test(c))issues.push(\'<slot> detected — use {#snippet} and {@render} in Svelte 5\');if(issues.length)console.log(\'Warning: \'+issues.join(\'; \'))" -- "$CLAUDE_FILE_PATH"',
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
              'node -e "const f=process.argv[1]||\'\';if(!/\\+page\\.server\\.(ts|js)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/actions/.test(c)&&!/fail\\(/.test(c))console.log(\'Warning: form actions without fail() — add validation error handling with fail() from @sveltejs/kit\')" -- "$CLAUDE_FILE_PATH"',
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
              'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.svelte\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/\\$effect\\s*\\(/.test(c)){const lines=c.split(\'\\n\');let hasCleanup=false;let inEffect=false;let depth=0;for(const l of lines){if(/\\$effect\\s*\\(/.test(l)){inEffect=true;depth=0;}if(inEffect){depth+=(l.match(/\\{/g)||[]).length-(l.match(/\\}/g)||[]).length;if(/return\\s*\\(\\)\\s*=>/.test(l)||/return\\s*\\(\\)\\s*\\{/.test(l)||/return\\s+function/.test(l))hasCleanup=true;if(depth<=0&&inEffect){inEffect=false;}}}if(!hasCleanup&&/fetch|addEventListener|subscribe|setInterval|setTimeout/.test(c))console.log(\'Warning: $effect with async/subscription pattern but no cleanup return detected — add return () => cleanup()\')}" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'eslint' as const,
        filePath: 'svelte.config.js',
        config: {
          kit: {
            alias: {
              $lib: 'src/lib',
              '$lib/*': 'src/lib/*',
            },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
