import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const expressProfile: Profile = {
  id: 'frameworks/express',
  name: 'Express',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['express'],
  contributions: {
    claudeMd: [
      {
        heading: 'Express Conventions',
        order: 20,
        content: `## Express Conventions

Middleware-based architecture. Route → validate → handle → respond pattern.

**Detailed rules:** see \`.claude/rules/express/\` directory.

**Key rules:**
- Centralized error handling middleware — never swallow errors in route handlers
- Validate request input at the boundary (Zod, Joi, or express-validator)
- Use Router for route grouping, separate concerns: routes → controllers → services
- Security middleware: helmet, cors, rate-limiting on auth endpoints`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(node:*)',
          'Bash(npx nodemon:*)',
          'Bash(npx tsx:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run start:*)',
          'Bash(npm run build:*)',
          'Bash(npm test:*)',
          'Bash(npm audit:*)',
        ],
      },
    },
    rules: [
      {
        path: 'express/middleware-and-error-handling.md',
        paths: ['**/*.ts', '**/*.js', 'routes/**/*', 'middleware/**/*'],
        governance: 'mandatory',
        description: 'Express middleware chain, error handling, and async patterns',
        content: `# Express Middleware & Error Handling

## Middleware Chain Order
Global middleware must be registered in this order for correct behavior:
1. **CORS** — \`cors()\` with explicit allowed origins (never \`*\` in production)
2. **Security headers** — \`helmet()\`
3. **Compression** — \`compression()\`
4. **Body parsing** — \`express.json({ limit: '100kb' })\`, \`express.urlencoded({ extended: false })\`
5. **Request logging** — pino-http, morgan, or custom
6. **Authentication** — JWT verification, session hydration
7. **Routes** — resource routers
8. **404 handler** — catch-all for unmatched routes
9. **Error handler** — centralized \`(err, req, res, next)\` middleware

### Correct

\`\`\`typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { authMiddleware } from './middleware/auth.js';
import { userRouter } from './routes/users.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

const app = express();

// 1-5: Global middleware in correct order
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(pinoHttp());

// 6-7: Auth + routes
app.use('/api', authMiddleware);
app.use('/api/users', userRouter);

// 8-9: Error handling (MUST be last)
app.use(notFoundHandler);
app.use(errorHandler);
\`\`\`

## Error Handling Middleware
The error handler MUST have exactly four parameters: \`(err, req, res, next)\`. Express uses the arity to identify it.

### Correct

\`\`\`typescript
import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Delegate to default handler if headers already sent
  if (res.headersSent) {
    return _next(err);
  }

  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log full error server-side with context
  req.log?.error({ err, requestId: req.id, path: req.path }, 'Request failed');

  // Send safe response to client
  res.status(statusCode).json({
    error: {
      message: statusCode >= 500 && isProduction
        ? 'Internal server error'
        : err.message,
      code: err.code ?? 'INTERNAL_ERROR',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
\`\`\`

### Anti-Pattern

\`\`\`typescript
// WRONG: Missing 4th parameter — Express will NOT recognize this as an error handler
app.use((err: Error, req: Request, res: Response) => {
  res.status(500).json({ error: err.stack }); // Leaks stack trace to client
});
\`\`\`

## Async Error Handling

### Express 5 (recommended)
Rejected promises and thrown errors in async handlers are automatically caught and forwarded to the error handler:

\`\`\`typescript
// Express 5: no wrapper needed — rejected promise goes to error handler
app.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');  // Automatically caught
  }
  res.json(user);
});
\`\`\`

### Express 4 (legacy)
Wrap async handlers or use \`express-async-errors\`:

\`\`\`typescript
// Express 4: errors in async handlers require explicit forwarding
import 'express-async-errors'; // Monkey-patches Express to catch async errors

// OR wrap manually:
const asyncHandler = (fn: Function) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json(user);
}));
\`\`\`

## Custom Error Classes
Define typed errors with HTTP status codes for the error handler:

\`\`\`typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: Record<string, string>) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}
\`\`\`
`,
      },
      {
        path: 'express/security.md',
        paths: ['**/*.ts', '**/*.js', 'routes/**/*', 'middleware/**/*'],
        governance: 'mandatory',
        description: 'Express security patterns from official best practices',
        content: `# Express Security

> Based on the official Express.js Security Best Practices guide.

## Helmet — Security Headers
Always use \`helmet\` as the first middleware after CORS. It sets these headers by default:
- \`Content-Security-Policy\` — allowlist for page content sources
- \`Strict-Transport-Security\` — enforce HTTPS (HSTS)
- \`X-Content-Type-Options: nosniff\` — prevent MIME sniffing
- \`X-Frame-Options: SAMEORIGIN\` — clickjacking protection
- \`Cross-Origin-Opener-Policy\` — process isolation
- \`Referrer-Policy\` — control Referer header leakage

\`\`\`typescript
import helmet from 'helmet';
app.use(helmet());
\`\`\`

## Rate Limiting
Protect authentication and public endpoints against brute-force attacks:

\`\`\`typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, try again later', code: 'RATE_LIMITED' } },
});

app.use('/api/auth/login', authLimiter);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // 100 requests per minute
});

app.use('/api/', apiLimiter);
\`\`\`

## Cookie & Session Security
- Never use the default session cookie name — rename it to reduce fingerprinting
- Set cookie flags: \`secure: true\`, \`httpOnly: true\`, \`sameSite: 'strict'\`
- Set reasonable expiration — do not create permanent sessions
- Use a production-grade session store (Redis, PostgreSQL) — never the default in-memory store

\`\`\`typescript
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  name: 'sid',                   // Custom name, not 'connect.sid'
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ client: redisClient }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,     // 1 hour
  },
}));
\`\`\`

## CORS Configuration
Never use wildcard \`*\` in production. Specify exact allowed origins:

\`\`\`typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24h preflight cache
}));
\`\`\`

## Input Validation
Validate all user input (params, query, body) using a schema library before processing:

\`\`\`typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Invalid input', formatZodErrors(result.error));
    }
    req.body = result.data;  // Replace body with parsed + coerced data
    next();
  };
}

router.post('/users', validate(createUserSchema), userController.create);
\`\`\`

## Dependency Auditing
Regularly check for known vulnerabilities:
\`\`\`bash
npm audit
npx snyk test
\`\`\`

## Trust Proxy
When behind a reverse proxy (Nginx, AWS ALB), configure trust proxy so \`req.ip\`, \`req.protocol\`, and \`req.hostname\` reflect the real client:

\`\`\`typescript
// Trust first proxy (e.g., Nginx on the same machine)
app.set('trust proxy', 1);
\`\`\`

## Open Redirect Prevention
Never redirect to unvalidated user-supplied URLs:

\`\`\`typescript
app.get('/redirect', (req, res) => {
  const target = req.query.url as string;
  try {
    const parsed = new URL(target);
    if (parsed.hostname !== 'example.com') {
      return res.status(400).json({ error: { message: 'Invalid redirect target' } });
    }
    res.redirect(target);
  } catch {
    res.status(400).json({ error: { message: 'Invalid URL' } });
  }
});
\`\`\`
`,
      },
      {
        path: 'express/route-organization.md',
        paths: ['**/*.ts', '**/*.js', 'routes/**/*', 'middleware/**/*'],
        governance: 'recommended',
        description: 'Express route organization, project structure, and architecture',
        content: `# Express Route Organization & Architecture

## Recommended Project Structure
\`\`\`
src/
  app.ts                    # Express app setup (middleware, routes, error handling)
  server.ts                 # HTTP server, graceful shutdown, cluster setup
  config/
    index.ts                # Environment-based configuration (validated with Zod)
  routes/
    index.ts                # Route registration (mounts all routers)
    users.router.ts         # /api/users routes
    orders.router.ts        # /api/orders routes
  controllers/
    users.controller.ts     # Request handling — calls services, sends response
    orders.controller.ts
  services/
    users.service.ts        # Business logic — framework-agnostic, no req/res
    orders.service.ts
  middleware/
    auth.ts                 # JWT verification, session hydration
    validate.ts             # Zod/Joi validation middleware factory
    errors.ts               # Error handler + 404 handler
    request-id.ts           # Attach unique ID to each request
  errors/
    app-error.ts            # Base AppError class + typed subclasses
  types/
    express.d.ts            # Module augmentation for Request (user, id, log)
\`\`\`

## Router Pattern
Use \`express.Router()\` to group routes by resource. Keep route files thin — delegate to controllers.

\`\`\`typescript
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './users.schemas.js';
import * as usersController from '../controllers/users.controller.js';

export const userRouter = Router();

userRouter
  .route('/')
  .get(usersController.list)
  .post(validate(createUserSchema), usersController.create);

userRouter
  .route('/:id')
  .get(usersController.getById)
  .patch(validate(updateUserSchema), usersController.update)
  .delete(usersController.remove);
\`\`\`

## Controller Pattern
Controllers extract data from the request, invoke the service, and format the response. No business logic.

\`\`\`typescript
import type { Request, Response } from 'express';
import * as userService from '../services/users.service.js';

export async function create(req: Request, res: Response): Promise<void> {
  const user = await userService.create(req.body);
  res.status(201).json({ data: user });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await userService.findById(req.params.id);
  res.json({ data: user });
}
\`\`\`

## Service Layer
Services contain all business logic and are framework-agnostic — they never import \`express\` or touch \`req\`/\`res\`.

\`\`\`typescript
import { NotFoundError } from '../errors/app-error.js';
import { userRepository } from '../repositories/users.repository.js';

export async function findById(id: string) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError(\`User \${id} not found\`);
  return user;
}
\`\`\`

## Graceful Shutdown
Handle SIGTERM/SIGINT so in-flight requests complete before the process exits:

\`\`\`typescript
const server = app.listen(port, () => {
  console.log(\`Listening on port \${port}\`);
});

function gracefulShutdown(signal: string) {
  console.log(\`\${signal} received — shutting down gracefully\`);
  server.close(async () => {
    await closeDatabasePool();
    process.exit(0);
  });
  // Force exit after 30s
  setTimeout(() => process.exit(1), 30_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
\`\`\`

## Express 5 Migration Checklist
When upgrading from Express 4 to 5:
- Replace \`req.param(name)\` with \`req.params.name\`, \`req.body.name\`, or \`req.query.name\`
- Rename \`res.sendfile()\` to \`res.sendFile()\`
- Use \`res.status(code).json(body)\` instead of \`res.json(body, code)\`
- Name wildcard routes: \`/*splat\` instead of \`/*\` (use \`/{*splat}\` to also match root)
- Optional params use brace syntax: \`/:file{.:ext}\` instead of \`/:file.:ext?\`
- \`req.query\` is read-only (getter) — do not mutate it
- \`req.body\` is \`undefined\` when no body parser matches (was \`{}\` in v4)
- Remove \`express-async-errors\` — Express 5 catches rejected promises natively
- Escape reserved characters in route paths: \`( ) [ ] ? + !\` must be preceded by \`\\\`
- \`app.listen\` callback receives an error argument: \`(err) => { if (err) throw err; }\`
`,
      },
      {
        path: 'express/performance.md',
        paths: ['**/*.ts', '**/*.js', 'routes/**/*', 'middleware/**/*'],
        governance: 'recommended',
        description: 'Express performance patterns from official best practices',
        content: `# Express Performance

> Based on the official Express.js Performance Best Practices guide.

## Code-Level

### Avoid Synchronous Functions
Never use synchronous variants of Node.js APIs in request handlers (\`fs.readFileSync\`, \`crypto.pbkdf2Sync\`). They block the entire event loop.
Use \`--trace-sync-io\` during development to detect synchronous calls:
\`\`\`bash
node --trace-sync-io server.js
\`\`\`

### Use Proper Logging
- Use \`pino\` (fastest structured JSON logger) or \`winston\` — never \`console.log\` in production
- \`console.log\` and \`console.error\` are synchronous when writing to a terminal — they block the event loop
- Use the \`debug\` module for development-only diagnostics

### Response Compression
Use gzip/Brotli compression to reduce response size:
\`\`\`typescript
import compression from 'compression';
app.use(compression());
\`\`\`
For high-traffic production, offload compression to the reverse proxy (Nginx).

### Handle Exceptions
- Never leave rejected promises unhandled — they crash the process in Node.js 16+
- Never listen for \`uncaughtException\` as a recovery strategy — it is unreliable
- Use \`process.on('unhandledRejection', ...)\` only for logging, then exit

## Infrastructure-Level

### Set NODE_ENV=production
Performance improves up to 3x in production mode. Set via environment, not code:
\`\`\`bash
NODE_ENV=production node server.js
\`\`\`

### Run in a Cluster
Spawn one worker per CPU core to utilize multi-core systems:
\`\`\`typescript
import cluster from 'node:cluster';
import os from 'node:os';

if (cluster.isPrimary) {
  const cpuCount = os.availableParallelism?.() ?? os.cpus().length;
  for (let i = 0; i < cpuCount; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.log(\`Worker \${worker.process.pid} exited — forking replacement\`);
    cluster.fork();
  });
} else {
  app.listen(port);
}
\`\`\`
Cluster instances do NOT share memory — use Redis for sessions and shared state.

### Use a Reverse Proxy
Place Nginx or a cloud load balancer in front of Express to handle:
- TLS termination
- Static file serving
- Response compression
- Request caching
- Load balancing

### Cache Responses
- Use \`Cache-Control\` headers for static and semi-static resources
- Use Redis or Varnish for application-level response caching
- Consider \`apicache\` or \`express-cache-controller\` for route-level caching
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['express-middleware-generator', 'express-router-generator'],
        prompt: `## Express-Specific Review

### Middleware & Error Handling
- Verify global middleware order: CORS -> helmet -> compression -> body parsing -> logging -> auth -> routes -> 404 -> error handler
- Check that the error-handling middleware has exactly 4 parameters: \`(err, req, res, next)\`
- Verify the error handler checks \`res.headersSent\` before sending a response
- Check that async route handlers properly forward errors (Express 5 auto-catches; Express 4 needs a wrapper)
- Verify no raw error objects or stack traces are sent in production responses
- Check for a custom 404 handler before the error handler

### Security
- Verify \`helmet()\` is applied and loaded early in the middleware chain
- Check CORS configuration — no wildcard (\`*\`) origin in production
- Verify rate limiting on authentication and public-facing endpoints
- Check input validation on all POST/PUT/PATCH endpoints (Zod, Joi, or express-validator)
- Verify cookie/session security flags: \`httpOnly\`, \`secure\`, \`sameSite\`
- Check that the default session cookie name is changed
- Verify \`trust proxy\` is configured when behind a reverse proxy
- Check for open redirect vulnerabilities in any redirect logic
- Verify \`express.json()\` has a \`limit\` option to prevent large-payload attacks

### Architecture
- Verify proper separation: routes -> controllers -> services -> data access
- Check that controllers contain no business logic (only request extraction + response formatting)
- Verify services are framework-agnostic (no \`req\`/\`res\` imports)
- Check custom error classes with HTTP status codes are used instead of inline \`res.status()\` in services
- Verify HTTP status codes are correct: 201 for creation, 204 for deletion, 422 for validation errors

### Performance
- Check for synchronous function calls in request handlers (\`readFileSync\`, \`execSync\`)
- Verify \`NODE_ENV=production\` is documented for deployment
- Check for proper logging library (pino/winston) instead of \`console.log\`
- Verify compression middleware is applied or delegated to reverse proxy
- Check for graceful shutdown handling (SIGTERM/SIGINT)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['express-middleware-generator', 'express-router-generator'],
        prompt: `## Express Testing

### Integration Tests with Supertest
- Use \`supertest\` for HTTP-level integration tests — test the real Express app
- Test each route: success (200/201), validation errors (400/422), auth failures (401/403), not found (404), server errors (500)
- Test middleware in isolation by creating minimal Express apps with only the middleware under test
- Verify response shapes match the API contract (consistent \`{ data }\` or \`{ error }\` envelopes)

### Middleware Testing
- Test error handling middleware with various error types (AppError subclasses, generic Error, string)
- Verify error handler returns safe messages in production mode (no stack traces)
- Test authentication middleware with valid, invalid, expired, and missing tokens
- Test rate limiting by sending requests beyond the threshold
- Test validation middleware with valid, invalid, and edge-case payloads

### Service Layer Tests
- Unit-test services independently — mock repository/data-access layer
- Test that services throw typed errors (NotFoundError, ValidationError) for expected failure cases
- Verify services never import Express types

### Example Pattern
\`\`\`typescript
import request from 'supertest';
import { app } from '../app.js';

describe('POST /api/users', () => {
  it('should create a user and return 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('should return 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'not-an-email', name: 'Test' })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
\`\`\``,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        skills: ['express-middleware-generator'],
        prompt: `## Express Security Audit

### Headers & Transport
- Verify \`helmet()\` is loaded — check for Content-Security-Policy, HSTS, X-Content-Type-Options, X-Frame-Options
- Verify TLS is enforced end-to-end (HSTS header, secure cookies, \`trust proxy\` when behind TLS terminator)
- Check that \`x-powered-by\` is disabled (\`app.disable('x-powered-by')\` or \`helmet()\`)

### Authentication & Session
- Verify session cookie name is changed from the default \`connect.sid\`
- Check cookie flags: \`httpOnly: true\`, \`secure: true\`, \`sameSite: 'strict'\`
- Verify session store is production-grade (Redis, database) — not MemoryStore
- Check for rate limiting on login, signup, and password-reset endpoints
- Verify JWT tokens are validated with proper algorithm pinning (no \`algorithms: ['none']\`)

### Input & Injection
- Verify all POST/PUT/PATCH routes have schema validation middleware before the handler
- Check that \`express.json()\` has a \`limit\` option (default is 100kb — ensure it is explicit)
- Verify query parameters and URL params are validated before use
- Check for SQL injection: all database queries must use parameterized statements
- Check for NoSQL injection: MongoDB queries must not accept raw user objects as filters
- Verify no user input is concatenated into shell commands, file paths, or regex patterns
- Check for open redirect: \`res.redirect()\` must validate the target URL hostname

### CORS
- Verify \`cors()\` origin is an explicit allowlist — never \`origin: true\` or \`origin: '*'\` in production
- Check that \`credentials: true\` is only used with specific origins (not with wildcard)

### Error Exposure
- Verify error responses in production mode do not include stack traces, file paths, or query details
- Check that 500 errors return a generic message, not \`err.message\` from unhandled errors
- Verify the error handler distinguishes operational errors (safe to expose) from programmer errors (hide)`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        skills: ['express-router-generator'],
        prompt: `## Express 4 -> Express 5 Migration

### Breaking Changes to Check
- \`req.param(name)\` removed — use \`req.params.name\`, \`req.body.name\`, or \`req.query.name\`
- \`res.sendfile()\` removed — use \`res.sendFile()\` (capital F)
- \`res.json(obj, status)\` removed — use \`res.status(status).json(obj)\`
- \`res.redirect('back')\` removed — use \`res.redirect(req.get('Referrer') || '/')\`
- \`res.send(status)\` removed — use \`res.sendStatus(status)\`
- \`req.host\` now includes port number
- \`req.query\` is read-only (getter) — do not mutate it
- \`req.body\` is \`undefined\` when unparsed (was \`{}\` in v4)
- Default query parser changed from \`extended\` to \`simple\`
- \`express.urlencoded()\` defaults \`extended\` to \`false\`

### Route Path Syntax Changes
- Wildcard routes must be named: \`/*splat\` (not \`/*\`); use \`/{*splat}\` to also match root
- Optional parameters use braces: \`/:file{.:ext}\` (not \`/:file.:ext?\`)
- Reserved characters \`( ) [ ] ? + !\` in paths must be escaped with \`\\\`
- \`req.params\` for wildcard routes returns arrays: \`req.params.splat\` is \`['foo', 'bar']\`

### New in Express 5
- Async error handling: rejected promises in handlers auto-forward to the error handler
- Brotli encoding support
- \`app.listen()\` callback receives error as first argument
- \`res.clearCookie()\` ignores \`maxAge\` and \`expires\` options
- \`res.status()\` only accepts integers 100-999
- Static file dotfiles default changed to \`"ignore"\` — explicitly serve \`.well-known\` if needed`,
      },
    ],
    skills: [
      {
        name: 'express-middleware-generator',
        description: 'Generate Express middleware with proper patterns and TypeScript types',
        content: `# Express Middleware Generator

Generate Express middleware following official best practices:

## For standard middleware:
- Correct signature: \`(req: Request, res: Response, next: NextFunction) => void\`
- Single responsibility — one concern per middleware
- Always call \`next()\` or send a response — never leave requests hanging
- TypeScript types for any Request augmentation (use module augmentation)

## For error-handling middleware:
- MUST have 4 parameters: \`(err: Error, req: Request, res: Response, next: NextFunction)\`
- Check \`res.headersSent\` before sending
- Separate operational errors (safe to expose) from programmer errors (hide from client)

## For validation middleware:
- Accept a Zod/Joi schema as parameter and return middleware
- Parse \`req.body\`, \`req.query\`, or \`req.params\` against the schema
- Replace the parsed field with validated data (coerced types)
- Throw a \`ValidationError\` with structured details on failure

## Output:
- The middleware implementation with full TypeScript types
- A unit test using supertest with a minimal Express app
- Integration instructions (where to place in the middleware chain)
`,
      },
      {
        name: 'express-router-generator',
        description: 'Generate Express resource routers with controller, service, and validation',
        content: `# Express Router Generator

Generate a complete Express resource module:

1. **Router** (\`routes/<resource>.router.ts\`)
   - CRUD routes using \`Router().route()\` chaining
   - Validation middleware on POST/PUT/PATCH routes
   - Auth middleware where needed

2. **Controller** (\`controllers/<resource>.controller.ts\`)
   - Async handlers that extract request data, call service, send response
   - Proper HTTP status codes (200, 201, 204, 404, 422)
   - Consistent response shape: \`{ data }\` for success, \`{ error }\` for failure

3. **Service** (\`services/<resource>.service.ts\`)
   - Business logic with no Express imports
   - Throws typed errors (NotFoundError, ValidationError)
   - Accepts and returns plain objects or DTOs

4. **Schemas** (\`routes/<resource>.schemas.ts\`)
   - Zod schemas for create, update, and query parameters
   - TypeScript types inferred from schemas (\`z.infer<typeof schema>\`)

5. **Tests** (\`__tests__/<resource>.test.ts\`)
   - Supertest integration tests for each endpoint
   - Happy path, validation, not found, and auth failure cases
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!/route|controller|router/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/router\\.(post|put|patch)\\s*\\(/.test(c)&&!/valid|schema|zod|joi|celebrate/.test(c.toLowerCase()))console.log(\'WARNING: Route with POST/PUT/PATCH but no validation middleware detected. Add input validation before the handler.\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!/middleware|error|handler/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/err\\s*,\\s*req\\s*,\\s*res\\s*[^,)]*\\)/.test(c)&&!/next/.test(c.split(/err\\s*,\\s*req\\s*,\\s*res/)[1]||\'next\'))console.log(\'WARNING: Error-handling middleware MUST have 4 parameters (err, req, res, next). Missing next parameter.\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.ts$|\\.js$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/res\\.redirect\\s*\\(/.test(c)&&!/new\\s+URL|hostname|host/.test(c))console.log(\'WARNING: res.redirect() detected without URL validation. Validate the redirect target to prevent open redirect vulnerabilities.\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
