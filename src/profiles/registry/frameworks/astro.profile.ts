import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const astroProfile: Profile = {
  id: 'frameworks/astro',
  name: 'Astro',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['astro'],
  dependsOn: ['languages/typescript'],
  contributions: {
    claudeMd: [
      {
        heading: 'Astro Conventions',
        order: 20,
        content: `## Astro Conventions

Island architecture — zero JS by default, partial hydration only where needed.

**Detailed rules:** see \`.claude/rules/astro/\` directory.

**Key rules:**
- \`.astro\` files: frontmatter (component script) + template (HTML), zero client JS by default
- Use \`client:*\` directives only on interactive components — \`client:load\`, \`client:idle\`, \`client:visible\`
- Content collections with type-safe schemas for structured content (Markdown, MDX, JSON, YAML)
- Static by default — use \`output: 'server'\` or \`output: 'hybrid'\` only when SSR is needed
- Props via \`Astro.props\`, slots for composition, scoped styles by default`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx astro:*)',
          'Bash(npx astro add:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run preview:*)',
        ],
      },
    },
    rules: [
      {
        path: 'astro/component-architecture.md',
        paths: ['src/**/*.astro', 'src/pages/**/*', 'src/components/**/*', 'astro.config.*'],
        governance: 'mandatory',
        description: 'Astro component format, island architecture, and hydration directives',
        content: `# Astro Component Architecture

## .astro File Format
Every \`.astro\` file has two sections separated by \`---\` fences:
1. **Component script** (frontmatter) — runs at build time (or request time in SSR)
2. **Template** — HTML-like markup with expressions in \`{}\`

\`\`\`astro
---
// Component script: runs on the server
import Layout from '../layouts/Layout.astro';
import Card from '../components/Card.astro';

interface Props {
  title: string;
}

const { title } = Astro.props;
const posts = await fetch('https://api.example.com/posts').then(r => r.json());
---

<Layout title={title}>
  <h1>{title}</h1>
  <ul>
    {posts.map((post) => (
      <li><Card title={post.title} href={post.url} /></li>
    ))}
  </ul>
</Layout>

<style>
  /* Scoped by default — only applies to this component */
  h1 { color: var(--accent); }
</style>
\`\`\`

## Island Architecture — Partial Hydration
- Astro components render to static HTML with zero JavaScript by default
- Use framework components (React, Vue, Svelte) ONLY for interactive islands
- Apply hydration directives to control when the component's JS loads

### Hydration Directives
| Directive | When JS Loads | Use Case |
|-----------|--------------|----------|
| \`client:load\` | Immediately on page load | Above-the-fold interactive UI |
| \`client:idle\` | After page is idle | Non-critical interactive UI |
| \`client:visible\` | When component enters viewport | Below-the-fold components |
| \`client:media="(max-width: 768px)"\` | When media query matches | Mobile-only interactivity |
| \`client:only="react"\` | Client-only, no SSR | Components that use browser APIs |

### Key Rules
- NEVER add a \`client:*\` directive to an Astro component — only framework components
- Default to NO directive (static HTML) — add hydration only if the component needs interactivity
- Prefer \`client:idle\` or \`client:visible\` over \`client:load\` for non-critical components
- Use \`client:only\` ONLY for components that depend on browser-only APIs (no SSR fallback)

## Props and Slots
- Define \`Props\` interface in frontmatter for type-safe props
- Access via \`Astro.props\` — destructure for convenience
- Use \`<slot />\` for children, named slots with \`<slot name="header" />\`
- Provide default slot content: \`<slot>Default content</slot>\`

## Scoped Styles
- Styles in \`<style>\` are scoped to the component by default
- Use \`<style is:global>\` sparingly — only for truly global styles
- Use CSS custom properties (variables) for theming across components
- Use \`class:list\` directive for conditional classes
`,
      },
      {
        path: 'astro/content-collections.md',
        paths: ['src/content/**/*', 'src/pages/**/*', 'astro.config.*'],
        governance: 'mandatory',
        description: 'Astro content collections, schemas, and type-safe content management',
        content: `# Astro Content Collections

## Defining Collections
Content collections live in \`src/content/\` with a schema defined in \`src/content/config.ts\`:

\`\`\`typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content', // Markdown, MDX
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  type: 'data', // JSON, YAML
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url(),
  }),
});

export const collections = { blog, authors };
\`\`\`

## Querying Collections
\`\`\`astro
---
import { getCollection, getEntry } from 'astro:content';

// Get all entries (filtered)
const publishedPosts = await getCollection('blog', ({ data }) => !data.draft);

// Get single entry
const post = await getEntry('blog', 'my-post-slug');
---
\`\`\`

## Rendering Content
\`\`\`astro
---
const { Content, headings } = await post.render();
---
<article>
  <h1>{post.data.title}</h1>
  <time datetime={post.data.pubDate.toISOString()}>
    {post.data.pubDate.toLocaleDateString()}
  </time>
  <Content />
</article>
\`\`\`

## Key Rules
- Always define schemas for type safety — Astro validates at build time
- Use \`z.coerce.date()\` for date fields in frontmatter
- Filter drafts in production: \`({ data }) => !data.draft\`
- Use collection references (\`reference()\`) for relationships between collections
- Generate static pages with \`getStaticPaths()\` from collection entries
- Never import content files directly — always use \`getCollection\`/\`getEntry\` APIs
`,
      },
      {
        path: 'astro/security.md',
        paths: ['src/**/*.astro', 'src/pages/**/*', 'astro.config.*'],
        governance: 'mandatory',
        description: 'Astro security patterns for content, dynamic routes, and headers',
        content: `# Astro Security

## Content Sanitization
- Astro auto-escapes expressions in templates — \`{userInput}\` is safe by default
- NEVER use \`set:html\` with unsanitized user content — XSS risk
- For Markdown/MDX content: use rehype-sanitize plugin to strip dangerous HTML
- Validate all frontmatter data through collection schemas

### Safe Pattern
\`\`\`astro
---
// User input is auto-escaped in expressions
const comment = await getComment(Astro.params.id);
---
<p>{comment.text}</p> <!-- Safe: auto-escaped -->
\`\`\`

### Dangerous Anti-Pattern
\`\`\`astro
<!-- NEVER do this with user content -->
<div set:html={userContent} /> <!-- XSS risk if not sanitized -->
\`\`\`

## Dynamic Route Validation
- Validate all route parameters in \`getStaticPaths()\` or server-side routes
- Never trust \`Astro.params\` without validation — especially in SSR mode
- Use Zod to validate query parameters from \`Astro.url.searchParams\`
- Return 404 for invalid parameters instead of rendering with bad data

\`\`\`astro
---
import { z } from 'zod';
const idSchema = z.string().uuid();
const result = idSchema.safeParse(Astro.params.id);
if (!result.success) {
  return Astro.redirect('/404');
}
const item = await db.item.findUnique({ where: { id: result.data } });
if (!item) return Astro.redirect('/404');
---
\`\`\`

## Security Headers
- Configure headers in the deployment adapter or middleware
- Set Content-Security-Policy to restrict inline scripts and external resources
- Enable HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

## SSR Security (server/hybrid mode)
- Authenticate requests in middleware for protected routes
- Never expose API keys or secrets in client-side code — keep in server-only modules
- Validate and sanitize form submissions in API endpoints
- Rate-limit API routes and form submissions
- Use \`import.meta.env\` for secrets — only non-\`PUBLIC_\` vars are server-only

## Key Rules
- Prefix client-safe env vars with \`PUBLIC_\` — all others are server-only
- Never use \`set:html\` with user-generated content without sanitization
- Always validate dynamic route parameters
- Keep secrets out of client bundles — Astro strips non-PUBLIC_ vars automatically
`,
      },
      {
        path: 'astro/routing-and-pages.md',
        paths: ['src/pages/**/*', 'src/layouts/**/*', 'astro.config.*'],
        governance: 'recommended',
        description: 'Astro routing, layouts, pages, and rendering modes',
        content: `# Astro Routing & Pages

## File-Based Routing
- \`src/pages/index.astro\` → \`/\`
- \`src/pages/about.astro\` → \`/about\`
- \`src/pages/blog/[slug].astro\` → \`/blog/:slug\` (dynamic)
- \`src/pages/blog/[...path].astro\` → \`/blog/*\` (rest/catch-all)
- \`src/pages/api/data.ts\` → API endpoint (no UI)

## Layouts
- Layouts are regular Astro components that wrap page content via \`<slot />\`
- Apply layouts in page frontmatter or by importing and wrapping

\`\`\`astro
---
// src/layouts/Base.astro
interface Props { title: string; description?: string; }
const { title, description = 'Default description' } = Astro.props;
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content={description} />
  <title>{title}</title>
</head>
<body>
  <nav><!-- shared navigation --></nav>
  <main><slot /></main>
  <footer><!-- shared footer --></footer>
</body>
</html>
\`\`\`

## Static vs Server Rendering
- **Static (default)**: all pages built to HTML at build time — fastest, best for content sites
- **Server (\`output: 'server'\`)**: all pages rendered on request — for dynamic apps
- **Hybrid (\`output: 'hybrid'\`)**: static by default, opt-in to server per-page
- Per-page override: \`export const prerender = false\` (in hybrid) or \`= true\` (in server)

## Dynamic Routes — getStaticPaths
\`\`\`astro
---
// src/pages/blog/[slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---
\`\`\`

## SEO and Metadata
- Set \`<title>\`, \`<meta name="description">\`, and OpenGraph tags in layout or page
- Use \`Astro.site\` for canonical URLs (set \`site\` in \`astro.config.mjs\`)
- Generate \`sitemap.xml\` with \`@astrojs/sitemap\` integration
- Use structured data (JSON-LD) for rich search results
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['astro-page-generator'],
        prompt: `## Astro-Specific Review

### Component Architecture
- Verify \`.astro\` files have proper frontmatter/template separation
- Check that \`Props\` interface is defined for components that accept props
- Verify props are accessed via \`Astro.props\` with proper destructuring
- Check that \`<slot />\` is used for composition instead of prop drilling
- Verify scoped styles are used by default — \`is:global\` only when justified

### Island Architecture & Hydration
- Check that \`client:*\` directives are ONLY on framework components (React, Vue, Svelte), never on Astro components
- Verify components without interactivity have NO hydration directive (static by default)
- Check that \`client:load\` is used only for above-the-fold interactive UI
- Verify \`client:idle\` or \`client:visible\` is preferred for non-critical interactive components
- Check for unnecessary hydration — does the component truly need client-side JS?

### Content Collections
- Verify collection schemas are defined in \`src/content/config.ts\`
- Check that \`getCollection\`/\`getEntry\` APIs are used instead of direct file imports
- Verify draft filtering in production: \`({ data }) => !data.draft\`
- Check that date fields use \`z.coerce.date()\` for proper parsing

### Routing & Pages
- Verify \`getStaticPaths()\` is exported from dynamic route pages (in static mode)
- Check that layouts use \`<slot />\` and set proper \`<head>\` metadata
- Verify SEO metadata (title, description, OpenGraph) is set on all pages
- Check for missing \`alt\` attributes on \`<img>\` tags

### Security
- Check for \`set:html\` usage with user-generated content — must be sanitized
- Verify dynamic route parameters are validated before use
- Check that non-\`PUBLIC_\` env vars are not referenced in client-side code
- Verify API endpoints validate input and check authentication`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Astro Security Review

### Content Safety
- Check for \`set:html\` with unsanitized user content — flag as XSS risk
- Verify Markdown/MDX content uses rehype-sanitize plugin if accepting user content
- Check that all template expressions use auto-escaping (no raw HTML injection)
- Verify frontmatter data is validated through collection schemas

### Environment Variables
- Verify secrets (API keys, DB URLs) do NOT use \`PUBLIC_\` prefix
- Check that \`import.meta.env\` usage in client components only accesses \`PUBLIC_\` vars
- Verify \`.env\` files are in \`.gitignore\`
- Check that SSR endpoints do not leak secret env vars in responses

### Route Security
- Verify dynamic route parameters are validated (Zod or similar)
- Check that \`Astro.url.searchParams\` values are validated before use
- Verify API endpoints authenticate requests and validate input
- Check for open redirect vulnerabilities in server-side redirects

### Headers & Transport
- Verify security headers are configured (CSP, HSTS, X-Frame-Options)
- Check that CORS is configured restrictively for API endpoints
- Verify no sensitive data in URL query parameters
- Check that forms include CSRF protection when using server-side processing`,
      },
    ],
    skills: [
      {
        name: 'astro-page-generator',
        description: 'Scaffold a new Astro page with frontmatter, layout, and content',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Astro Page Generator

Generate a complete Astro page with:

1. **Page file** in \`src/pages/\` with proper frontmatter and template
2. **Layout** reference or new layout if needed
3. **Content collection** entry if the page uses structured content
4. **SEO metadata** — title, description, OpenGraph tags

### Template: Static Page
\`\`\`astro
---
import Layout from '../layouts/Base.astro';
import Card from '../components/Card.astro';

const pageTitle = 'Page Title';
const pageDescription = 'A description for SEO.';

const items = await getCollection('items');
---

<Layout title={pageTitle} description={pageDescription}>
  <h1>{pageTitle}</h1>
  <p>{pageDescription}</p>

  <section>
    {items.map((item) => (
      <Card title={item.data.title} href={\`/items/\${item.slug}\`} />
    ))}
  </section>
</Layout>
\`\`\`

### Template: Dynamic Route
\`\`\`astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Base.astro';

export async function getStaticPaths() {
  const entries = await getCollection('blog');
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---

<Layout title={entry.data.title} description={entry.data.description}>
  <article>
    <h1>{entry.data.title}</h1>
    <time datetime={entry.data.pubDate.toISOString()}>
      {entry.data.pubDate.toLocaleDateString()}
    </time>
    <Content />
  </article>
</Layout>
\`\`\`

### Template: API Endpoint (SSR)
\`\`\`typescript
// src/pages/api/items.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = CreateSchema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ errors: result.error.flatten() }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const item = await db.item.create({ data: result.data });
  return new Response(JSON.stringify(item), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
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
if (!/\\.astro$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
const templateSection = c.split('---').slice(2).join('---');
const componentImports = c.match(/import\\s+\\w+\\s+from\\s+['\"](?!.*\\.astro)[^'\"]*['\"]/g) || [];
for (const imp of componentImports) {
  const compName = imp.match(/import\\s+(\\w+)/)?.[1];
  if (compName && new RegExp('<' + compName + '\\\\b(?![^>]*client:)').test(templateSection)) {
    // Framework component without hydration directive — likely intentional (static)
  }
  if (compName && /client:(load|idle|visible|media|only)/.test(templateSection)) {
    const usages = templateSection.match(new RegExp('<' + compName + '[^>]*>', 'g')) || [];
    for (const usage of usages) {
      if (/client:load/.test(usage) && !/onClick|onChange|onSubmit|useState|interactive/.test(c)) {
        console.log('Warning: client:load on ' + compName + ' but no obvious interactivity detected. Consider client:idle or client:visible for non-critical components, or remove the directive entirely for static rendering.');
        break;
      }
    }
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
if (!/\\.astro$/.test(f) && !/\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/set:html/.test(c) && !/sanitize|DOMPurify|rehype-sanitize|escape/.test(c)) {
  console.log('Warning: set:html detected without apparent sanitization. If rendering user-generated content, sanitize with DOMPurify or rehype-sanitize to prevent XSS.');
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
