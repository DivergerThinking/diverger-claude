import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const trpcProfile: Profile = {
  id: 'frameworks/trpc',
  name: 'tRPC',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['trpc'],
  dependsOn: ['languages/typescript'],
  contributions: {
    claudeMd: [
      {
        heading: 'tRPC Conventions',
        order: 20,
        content: `## tRPC Conventions

End-to-end type-safe APIs without code generation. Router-based architecture with Zod validation.

**Detailed rules:** see \`.claude/rules/trpc/\` directory.

**Key rules:**
- Organize procedures into domain routers, merge into a root appRouter
- Every mutation MUST have \`.input()\` validation with Zod — no unvalidated mutations
- Use middleware for cross-cutting concerns: auth, logging, rate limiting
- Throw \`TRPCError\` with proper codes, never raw Error or HTTP status codes
- Infer types from router: \`RouterInput\`, \`RouterOutput\` — never duplicate type definitions`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run start:*)',
          'Bash(npm test:*)',
        ],
      },
    },
    rules: [
      {
        path: 'trpc/router-organization.md',
        paths: ['**/trpc/**/*', '**/routers/**/*', '**/procedures/**/*', 'server/**/*'],
        governance: 'mandatory',
        description: 'tRPC router structure, procedure types, and type inference patterns',
        content: `# tRPC Router Organization

## Project Structure
\`\`\`
server/
  trpc/
    trpc.ts          — tRPC instance, context, base procedures
    routers/
      _app.ts        — root appRouter merging all domain routers
      user.ts        — user domain router
      post.ts        — post domain router
    middleware/
      auth.ts        — authentication middleware
      rateLimit.ts   — rate limiting middleware
\`\`\`

## Creating the tRPC Instance
\`\`\`typescript
// server/trpc/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
export const adminProcedure = t.procedure.use(enforceAuth).use(enforceAdmin);
\`\`\`

## Domain Router Pattern
\`\`\`typescript
// server/trpc/routers/post.ts
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const postRouter = router({
  // Query — read operation
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input.id } });
      if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      return post;
    }),

  // Mutation — write operation
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: { ...input, authorId: ctx.user.id },
      });
    }),
});
\`\`\`

## Root Router (AppRouter)
\`\`\`typescript
// server/trpc/routers/_app.ts
import { router } from '../trpc';
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = router({
  user: userRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
\`\`\`

## Type Inference — Never Duplicate Types
\`\`\`typescript
// Infer types directly from the router — single source of truth
import type { AppRouter } from '../server/trpc/routers/_app';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

// Usage
type CreatePostInput = RouterInput['post']['create'];
type PostOutput = RouterOutput['post']['getById'];
\`\`\`

## Key Rules
- One router per domain/feature — never put all procedures in a single file
- Merge routers in \`_app.ts\` — this is the single entry point
- Use \`publicProcedure\` for unauthenticated, \`protectedProcedure\` for authenticated
- Always infer types from the router — never create duplicate type definitions
`,
      },
      {
        path: 'trpc/input-validation-and-middleware.md',
        paths: ['**/trpc/**/*', '**/routers/**/*', '**/procedures/**/*', 'server/**/*'],
        governance: 'mandatory',
        description: 'tRPC input validation with Zod, middleware patterns, and error handling',
        content: `# tRPC Input Validation & Middleware

## Input Validation with Zod
Every procedure that accepts input MUST use \`.input()\` with a Zod schema:

\`\`\`typescript
// CORRECT: validated input
const updateUser = protectedProcedure
  .input(z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    bio: z.string().max(500).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // input is fully typed and validated
    return ctx.db.user.update({
      where: { id: ctx.user.id },
      data: input,
    });
  });

// WRONG: mutation without input validation
const deleteUser = protectedProcedure
  .mutation(async ({ ctx }) => {
    // This is only acceptable if the procedure uses no external input
    // (e.g., deleting the authenticated user's own account)
    return ctx.db.user.delete({ where: { id: ctx.user.id } });
  });
\`\`\`

## Reusable Input Schemas
\`\`\`typescript
// shared/schemas/post.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).max(10).default([]),
});

export const updatePostSchema = createPostSchema.partial();

export const postIdSchema = z.object({ id: z.string().cuid() });

export const paginationSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().min(1).max(100).default(20),
});
\`\`\`

## Authentication Middleware
\`\`\`typescript
// server/trpc/middleware/auth.ts
import { TRPCError } from '@trpc/server';
import { t } from '../trpc';

export const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user, // narrowed type — guaranteed non-null
    },
  });
});

export const enforceAdmin = t.middleware(async ({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});
\`\`\`

## Error Handling with TRPCError
\`\`\`typescript
// Always use TRPCError with proper codes — never raw Error
throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid input' });
throw new TRPCError({ code: 'CONFLICT', message: 'Resource already exists' });
throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error' });
\`\`\`

## Logging Middleware
\`\`\`typescript
export const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  console.log(\`[\${type}] \${path} - \${duration}ms\`);
  return result;
});
\`\`\`

## Key Rules
- Every mutation MUST have \`.input()\` validation — queries accepting parameters must too
- Chain middleware: \`procedure.use(auth).use(rateLimit).input(schema).mutation(...)\`
- Middleware narrows context types — \`protectedProcedure\` guarantees \`ctx.user\` exists
- Use \`TRPCError\` codes that map to HTTP status: UNAUTHORIZED=401, FORBIDDEN=403, NOT_FOUND=404
- Never catch TRPCError in procedures — let tRPC handle error formatting
`,
      },
      {
        path: 'trpc/security.md',
        paths: ['**/trpc/**/*', '**/routers/**/*', '**/procedures/**/*', 'server/**/*'],
        governance: 'mandatory',
        description: 'tRPC security patterns for auth, input validation, and rate limiting',
        content: `# tRPC Security

## Authentication
- Create a \`protectedProcedure\` that enforces auth via middleware — use it for all protected routes
- Context creation: extract session/token from request headers in \`createContext\`
- Never trust client-provided user IDs — always use \`ctx.user.id\` from the verified session
- Verify token expiration and signature in the context creation function

### Context Pattern
\`\`\`typescript
// server/trpc/context.ts
import { getServerSession } from 'next-auth';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

export async function createContext(opts: CreateNextContextOptions) {
  const session = await getServerSession(opts.req, opts.res, authOptions);
  return {
    session,
    db: prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
\`\`\`

## Authorization
- Check resource ownership in procedures — not just authentication
- Use middleware layers: \`auth → role check → resource ownership\`
- Prevent IDOR: verify \`resource.ownerId === ctx.user.id\` before returning data

\`\`\`typescript
const deletePost = protectedProcedure
  .input(z.object({ id: z.string().cuid() }))
  .mutation(async ({ ctx, input }) => {
    const post = await ctx.db.post.findUniqueOrThrow({ where: { id: input.id } });

    // Authorization: verify ownership
    if (post.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to delete this post' });
    }

    return ctx.db.post.delete({ where: { id: input.id } });
  });
\`\`\`

## Rate Limiting
\`\`\`typescript
import { TRPCError } from '@trpc/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimitMiddleware = (maxRequests: number, windowMs: number) =>
  t.middleware(async ({ ctx, next }) => {
    const key = ctx.user?.id ?? ctx.ip ?? 'anonymous';
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (entry && entry.resetAt > now && entry.count >= maxRequests) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
    }

    if (!entry || entry.resetAt <= now) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
    }

    return next();
  });
\`\`\`

## Input Validation Rules
- EVERY mutation MUST have \`.input()\` with a Zod schema — no exceptions
- Queries accepting user input MUST also validate with \`.input()\`
- Use \`.transform()\` for data normalization (trim, lowercase email)
- Set reasonable limits: string maxLength, array maxLength, number ranges
- Use \`.refine()\` for complex validation (password strength, date ranges)

## Error Information Leakage
- Never expose internal error details in production — use \`errorFormatter\` to sanitize
- Log full errors server-side, return generic messages to client
- Only expose Zod validation errors — they are safe and useful for form feedback
- Never include stack traces, file paths, or SQL errors in responses

## Key Rules
- Auth middleware on ALL non-public procedures — default to protected
- Always check resource ownership, not just authentication
- Rate-limit sensitive operations: login, signup, password reset, file upload
- Sanitize error responses — expose Zod errors, hide internal details
`,
      },
      {
        path: 'trpc/client-patterns.md',
        paths: ['**/trpc/**/*', '**/*.tsx', '**/*.ts'],
        governance: 'recommended',
        description: 'tRPC client setup, React Query integration, and usage patterns',
        content: `# tRPC Client Patterns

## Client Setup with React Query
\`\`\`typescript
// utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/trpc/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
\`\`\`

## Provider Setup
\`\`\`tsx
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { trpc } from '../utils/trpc';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
    mutations: { retry: false },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
\`\`\`

## Query Patterns
\`\`\`tsx
function PostList() {
  // Basic query
  const { data, isLoading, error } = trpc.post.getAll.useQuery();

  // Query with input
  const { data: post } = trpc.post.getById.useQuery({ id: postId });

  // Conditional query
  const { data: user } = trpc.user.getById.useQuery(
    { id: userId },
    { enabled: !!userId },
  );

  // Infinite query for pagination
  const { data, fetchNextPage, hasNextPage } = trpc.post.getAll.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
}
\`\`\`

## Mutation Patterns
\`\`\`tsx
function CreatePost() {
  const utils = trpc.useUtils();

  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch post list after creating
      utils.post.getAll.invalidate();
    },
    onError: (error) => {
      // Handle Zod validation errors from the server
      if (error.data?.zodError) {
        // Display field-level errors
      }
    },
  });

  function handleSubmit(data: CreatePostInput) {
    createPost.mutate(data);
  }
}
\`\`\`

## Optimistic Updates
\`\`\`tsx
const toggleLike = trpc.post.toggleLike.useMutation({
  onMutate: async ({ postId }) => {
    await utils.post.getById.cancel({ id: postId });
    const previous = utils.post.getById.getData({ id: postId });

    utils.post.getById.setData({ id: postId }, (old) =>
      old ? { ...old, liked: !old.liked, likeCount: old.likeCount + (old.liked ? -1 : 1) } : old
    );

    return { previous };
  },
  onError: (err, { postId }, context) => {
    utils.post.getById.setData({ id: postId }, context?.previous);
  },
  onSettled: (_, __, { postId }) => {
    utils.post.getById.invalidate({ id: postId });
  },
});
\`\`\`

## Key Rules
- Use \`trpc.useUtils()\` for cache invalidation after mutations
- Invalidate related queries in \`onSuccess\` — keep UI in sync with server
- Handle \`error.data.zodError\` for user-friendly form validation feedback
- Use \`enabled\` option for conditional queries — never call hooks conditionally
- Prefer \`useSuspenseQuery\` with React Suspense boundaries for cleaner loading states
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['trpc-router-generator'],
        prompt: `## tRPC-Specific Review

### Router Organization
- Verify routers are organized by domain/feature — no monolithic router files
- Check that all domain routers are merged in the root appRouter
- Verify consistent naming: \`userRouter\`, \`postRouter\`, etc.
- Check that the tRPC instance (trpc.ts) exports base procedures: \`publicProcedure\`, \`protectedProcedure\`

### Input Validation
- Verify EVERY mutation has \`.input()\` with a Zod schema — flag unvalidated mutations as CRITICAL
- Check that queries accepting parameters also have \`.input()\` validation
- Verify input schemas have reasonable limits: string maxLength, array max, number ranges
- Check for reusable shared schemas (pagination, common filters)
- Verify \`.transform()\` is used for data normalization where needed

### Authentication & Authorization
- Verify \`protectedProcedure\` is used for all non-public procedures
- Check that middleware narrows context types properly (ctx.user is non-null after auth)
- Verify resource ownership checks in procedures that access user-specific data
- Check that admin procedures use an additional role-check middleware
- Verify context creation extracts and validates the session/token from the request

### Error Handling
- Verify \`TRPCError\` is used with proper codes — never raw Error or HTTP status numbers
- Check that error codes match semantics: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST
- Verify the errorFormatter sanitizes internal errors in production
- Check that procedures do not catch TRPCError (let tRPC handle formatting)

### Type Safety
- Verify types are inferred from the router (\`inferRouterInputs\`, \`inferRouterOutputs\`)
- Check for duplicate type definitions that should be inferred from the router
- Verify \`superjson\` transformer is configured if using Dates, Maps, Sets, BigInt
- Check that \`AppRouter\` type is exported for client-side usage`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## tRPC Security Review

### Authentication
- Verify auth middleware throws UNAUTHORIZED for missing/invalid sessions
- Check that \`protectedProcedure\` is the default for non-public routes
- Verify context creation validates tokens properly (signature, expiration)
- Check that session data is loaded from a trusted source, not from request body

### Authorization
- Verify resource ownership is checked before returning or modifying user data
- Check for IDOR vulnerabilities: procedures that accept IDs but don't verify ownership
- Verify admin-only procedures use a role-check middleware
- Check that bulk operations (deleteMany, updateMany) verify ownership on all records

### Input Validation
- Flag any mutation without \`.input()\` as CRITICAL security risk
- Check that string inputs have maxLength constraints
- Verify array inputs have max element constraints
- Check for dangerous patterns: regex from user input, dynamic code evaluation
- Verify file upload procedures validate file type and size

### Rate Limiting
- Check that sensitive procedures have rate limiting (login, signup, password reset)
- Verify rate limiting uses a persistent store in production (not in-memory)
- Check that rate limit keys include user/IP identification

### Error Exposure
- Verify errorFormatter does not expose internal error details in production
- Check that stack traces and file paths are not included in error responses
- Verify database errors are caught and converted to TRPCError with safe messages
- Check that Zod errors are the only detailed error information returned to clients`,
      },
    ],
    skills: [
      {
        name: 'trpc-router-generator',
        description: 'Scaffold a new tRPC router with typed procedures and middleware',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# tRPC Router Generator

Generate a complete tRPC domain router with:

1. **Input schemas** — Zod schemas for all procedure inputs
2. **Router file** — query, mutation, and subscription procedures
3. **Root router registration** — merge into appRouter
4. **Client-side hooks** — React Query usage examples

### Template: Input Schemas
\`\`\`typescript
// server/trpc/schemas/resource.ts
import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const updateResourceSchema = createResourceSchema.partial();

export const resourceIdSchema = z.object({
  id: z.string().cuid(),
});

export const listResourcesSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
});
\`\`\`

### Template: Router
\`\`\`typescript
// server/trpc/routers/resource.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createResourceSchema,
  updateResourceSchema,
  resourceIdSchema,
  listResourcesSchema,
} from '../schemas/resource';

export const resourceRouter = router({
  list: publicProcedure
    .input(listResourcesSchema)
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.resource.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: input.search ? { name: { contains: input.search } } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      const hasMore = items.length > input.limit;
      return {
        items: items.slice(0, input.limit),
        nextCursor: hasMore ? items[input.limit - 1].id : undefined,
      };
    }),

  getById: publicProcedure
    .input(resourceIdSchema)
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.resource.findUnique({ where: { id: input.id } });
      if (!item) throw new TRPCError({ code: 'NOT_FOUND' });
      return item;
    }),

  create: protectedProcedure
    .input(createResourceSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.resource.create({
        data: { ...input, ownerId: ctx.user.id },
      });
    }),

  update: protectedProcedure
    .input(resourceIdSchema.merge(updateResourceSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.db.resource.findUniqueOrThrow({ where: { id } });
      if (existing.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return ctx.db.resource.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(resourceIdSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.resource.findUniqueOrThrow({ where: { id: input.id } });
      if (existing.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return ctx.db.resource.delete({ where: { id: input.id } });
    }),
});
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
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.(ts|js)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (!/router|procedure|trpc/i.test(f) && !/\\.mutation\\s*\\(/.test(c)) process.exit(0);
const mutations = c.split(/\\.mutation\\s*\\(/);
if (mutations.length <= 1) process.exit(0);
for (let i = 1; i < mutations.length; i++) {
  const before = mutations[i - 1];
  const lastLines = before.slice(-300);
  if (!/\\.input\\s*\\(/.test(lastLines)) {
    const lineNum = c.slice(0, c.indexOf(mutations[i - 1]) + mutations[i - 1].length).split('\\n').length;
    console.log('Warning: Mutation near line ' + lineNum + ' has no .input() validation. Every mutation should validate its input with a Zod schema.');
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
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.(ts|js)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/throw\\s+new\\s+Error\\s*\\(/.test(c) && /trpc|router|procedure/i.test(c)) {
  if (!/TRPCError/.test(c.split(/throw\\s+new\\s+Error/)[0].slice(-200))) {
    console.log('Warning: Raw Error thrown in tRPC procedure. Use TRPCError with a proper code (NOT_FOUND, UNAUTHORIZED, FORBIDDEN, BAD_REQUEST) for consistent error handling.');
  }
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
