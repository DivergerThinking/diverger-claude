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
Register global middleware in this order:
1. CORS — \`cors()\` with explicit allowed origins (never \`*\` in production)
2. Security headers — \`helmet()\`
3. Compression — \`compression()\`
4. Body parsing — \`express.json({ limit: '100kb' })\`, \`express.urlencoded({ extended: false })\`
5. Request logging — pino-http, morgan, or custom
6. Authentication — JWT verification, session hydration
7. Routes — resource routers
8. 404 handler — catch-all for unmatched routes
9. Error handler — centralized \`(err, req, res, next)\` middleware (MUST be last)

## Error Handling Middleware
- MUST have exactly 4 parameters: \`(err, req, res, next)\` — Express uses arity to identify it
- Check \`res.headersSent\` before sending a response
- Log full error server-side; send safe message to client (no stack traces in production)
- Distinguish operational errors (safe to expose) from programmer errors (generic 500)

## Async Error Handling
- Express 5: async errors auto-forwarded to error handler (no wrapper needed)
- Express 4: use \`express-async-errors\` package or manual async wrapper with \`.catch(next)\`

## Custom Error Classes
- Base \`AppError\` extends \`Error\` with \`statusCode\`, \`code\`, \`isOperational\`
- Subclasses: \`NotFoundError\` (404), \`ValidationError\` (422), \`UnauthorizedError\` (401), \`ForbiddenError\` (403)
- Services throw typed errors; error handler maps them to HTTP responses
`,
      },
      {
        path: 'express/security.md',
        paths: ['**/*.ts', '**/*.js', 'routes/**/*', 'middleware/**/*'],
        governance: 'mandatory',
        description: 'Express security patterns from official best practices',
        content: `# Express Security

## Helmet — Security Headers
- Always use \`helmet()\` as first middleware after CORS
- Sets CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## Rate Limiting
- Protect auth endpoints: \`express-rate-limit\` with strict limits (10 attempts / 15 min)
- Protect API: general limiter (100 req / min)
- Use \`standardHeaders: true\`, \`legacyHeaders: false\`

## Cookie & Session Security
- Rename default session cookie (not \`connect.sid\`)
- Cookie flags: \`secure: true\`, \`httpOnly: true\`, \`sameSite: 'strict'\`
- Reasonable expiration — no permanent sessions
- Production session store (Redis, PostgreSQL) — never in-memory MemoryStore

## CORS Configuration
- Never wildcard \`*\` in production — explicit origin allowlist
- Set \`credentials: true\` only with specific origins
- Configure \`methods\`, \`allowedHeaders\`, \`maxAge\`

## Input Validation
- Validate all input (params, query, body) with schema library (Zod, Joi) before processing
- Validation middleware replaces body with parsed + coerced data
- Apply on all POST/PUT/PATCH routes

## Trust Proxy
- Configure \`app.set('trust proxy', 1)\` when behind reverse proxy (Nginx, ALB)
- Ensures correct \`req.ip\`, \`req.protocol\`, \`req.hostname\`

## Open Redirect Prevention
- Never redirect to unvalidated user-supplied URLs
- Validate hostname before \`res.redirect()\`

## Dependency Auditing
- Regular \`npm audit\` and \`npx snyk test\`
`,
      },
      {
        path: 'express/route-organization.md',
        paths: ['**/*.ts', '**/*.js', 'routes/**/*', 'middleware/**/*'],
        governance: 'recommended',
        description: 'Express route organization, project structure, and architecture',
        content: `# Express Route Organization & Architecture

## Project Structure
- \`app.ts\` — Express setup (middleware, routes, error handling)
- \`server.ts\` — HTTP server, graceful shutdown, cluster
- \`routes/\` — Router files per resource, validation middleware on mutating routes
- \`controllers/\` — Request extraction + response formatting, no business logic
- \`services/\` — Business logic, framework-agnostic (no req/res imports)
- \`middleware/\` — auth, validation, error handler, request-id
- \`errors/\` — AppError base class + typed subclasses
- \`types/express.d.ts\` — module augmentation for Request (user, id, log)

## Separation of Concerns
- Routes: thin, delegate to controllers, apply validation middleware
- Controllers: extract from request, call service, format response. No business logic.
- Services: all business logic, throw typed errors. Never import Express types.
- Correct HTTP status codes: 201 (create), 204 (delete), 422 (validation), 404 (not found)

## Graceful Shutdown
- Handle SIGTERM/SIGINT — close server, drain connections, close DB pool
- Force exit after timeout (30s) as safety net

## Express 5 Migration
- Async errors auto-caught — remove \`express-async-errors\`
- \`req.param()\` removed — use \`req.params\`, \`req.body\`, \`req.query\`
- Wildcard routes must be named: \`/*splat\` (not \`/*\`)
- Optional params: \`/:file{.:ext}\` (not \`/:file.:ext?\`)
- \`req.query\` is read-only; \`req.body\` is \`undefined\` without body parser
- \`app.listen\` callback receives error argument
`,
      },
      {
        path: 'express/security-enforcement.md',
        paths: ['**/*.ts'],
        governance: 'mandatory',
        description: 'Express security enforcement: helmet, validation, parameterized queries, auth middleware, error hiding',
        content: `# Express Security — Enforcement

## Helmet
- ALWAYS use \`helmet()\` — it sets 11+ security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Load it early in the middleware chain (right after CORS)
- Never disable critical headers without explicit justification in code comments

## Input Validation
- ALL POST/PUT/PATCH endpoints MUST have validation middleware (Zod, Joi, or express-validator)
- Validate params and query strings on GET endpoints that accept user input
- Replace \`req.body\` with the parsed result — never trust the raw payload
- Set \`express.json({ limit: '100kb' })\` to prevent large-payload attacks

## Parameterized Queries
- NEVER concatenate user input into SQL or NoSQL queries
- Use parameterized statements: \`db.query('SELECT * FROM users WHERE id = $1', [id])\`
- With ORMs (Prisma, TypeORM, Sequelize): use the query builder, never \`$queryRaw\` with interpolation
- MongoDB: validate and cast types before querying (prevent \`{ "$gt": "" }\` injection)

## Authentication Middleware
- JWT verification MUST pin the algorithm: \`jwt.verify(token, secret, { algorithms: ['HS256'] })\`
- Never accept the \`none\` algorithm
- Auth middleware must return 401 with a generic message — never reveal whether the user exists
- Protect all non-public routes with authentication middleware at the router level

## Error Handling — Hide Internals
- Production error handler MUST NOT expose: stack traces, file paths, database query text, internal error messages
- Operational errors (4xx): return the typed error message
- Programmer errors (5xx): return a generic "Something went wrong" message
- Always log the full error server-side for debugging
`,
      },
      {
        path: 'express/performance.md',
        paths: ['**/*.ts', '**/*.js', 'routes/**/*', 'middleware/**/*'],
        governance: 'recommended',
        description: 'Express performance patterns from official best practices',
        content: `# Express Performance

## Code-Level
- Never use synchronous Node.js APIs in handlers (\`readFileSync\`, \`execSync\`) — blocks event loop
- Use \`--trace-sync-io\` during development to detect sync calls
- Use \`pino\` or \`winston\` for logging — never \`console.log\` in production (synchronous on terminals)
- Use \`compression()\` middleware or offload to reverse proxy (Nginx) for high traffic
- Never leave rejected promises unhandled — crashes in Node.js 16+
- Use \`process.on('unhandledRejection', ...)\` only for logging, then exit

## Infrastructure-Level
- Set \`NODE_ENV=production\` — up to 3x performance improvement
- Run in cluster: one worker per CPU core, Redis for shared state
- Reverse proxy (Nginx, ALB) for TLS, static files, compression, caching, load balancing
- \`Cache-Control\` headers for static resources; Redis/Varnish for application-level caching
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
        name: 'express-middleware-guide',
        description: 'Detailed reference for Express middleware patterns: execution order, error-handling, async wrappers, common stack, and factories',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Express Middleware Patterns — Detailed Reference

## Middleware Execution Order
Express middleware runs in the order it is registered. The global stack must follow a strict
sequence so that downstream handlers have access to parsed bodies, authenticated users, etc.

### Recommended Order
1. \`cors()\` — must be before any response is sent
2. \`helmet()\` — sets security headers early
3. \`compression()\` — compress responses before they leave
4. \`express.json({ limit: '100kb' })\` / \`express.urlencoded({ extended: false })\`
5. Request logging (\`morgan\`, \`pino-http\`)
6. Authentication middleware (JWT verify, session hydrate)
7. Resource routers (\`app.use('/api/users', usersRouter)\`)
8. 404 catch-all
9. Centralized error handler (4-param middleware — MUST be last)

### Correct
\\\`\\\`\\\`typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { authMiddleware } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';
import { usersRouter } from './routes/users.router.js';

const app = express();

// 1-5: Global middleware in correct order
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined'));

// 6: Auth
app.use('/api', authMiddleware);

// 7: Routes
app.use('/api/users', usersRouter);

// 8-9: Error handling — always last
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
const app = express();
// WRONG: routes registered before body parsing
app.use('/api/users', usersRouter);
app.use(express.json());
// WRONG: error handler before routes — will never be reached
app.use(errorHandler);
app.use(helmet()); // WRONG: headers set after routes already responded
\\\`\\\`\\\`

## Error-Handling Middleware (4 Parameters)
Express identifies error-handling middleware by its arity (exactly 4 parameters).
If you omit \`next\` or destructure, Express treats it as regular middleware and skips it.

### Correct
\\\`\\\`\\\`typescript
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Programmer error — hide details from client
  req.log?.error(err, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: only 3 params — Express will NOT call this for errors
app.use((err: Error, req: Request, res: Response) => {
  res.status(500).json({ message: err.message, stack: err.stack }); // leaks info
});
\\\`\\\`\\\`

## Router-Level vs App-Level Middleware
- \`app.use()\` — applies to every request globally
- \`router.use()\` — applies only within that router prefix
- Inline middleware — applies only to that specific route

### Correct
\\\`\\\`\\\`typescript
// App-level: applies globally
app.use(helmet());

// Router-level: applies to /api/admin/* only
const adminRouter = Router();
adminRouter.use(requireRole('admin'));
adminRouter.get('/dashboard', getDashboard);

// Inline: applies to this single route
router.post('/upload', uploadLimit('10mb'), handleUpload);
\\\`\\\`\\\`

## Async Error Handling

### Express 5 (auto-catch)
\\\`\\\`\\\`typescript
// Express 5: rejected promises auto-forward to error handler
router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id); // throws → caught
  res.json({ data: user });
});
\\\`\\\`\\\`

### Express 4 (manual wrapper)
\\\`\\\`\\\`typescript
// Option A: express-async-errors (import once at entry point)
import 'express-async-errors';

// Option B: wrapper function
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
const asyncHandler = (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => fn(req, res, next).catch(next);

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json({ data: user });
}));
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG (Express 4): unhandled rejection crashes the process
router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id); // if this throws → crash
  res.json({ data: user });
});
\\\`\\\`\\\`

## Common Middleware Stack
| Middleware | Purpose | Install |
|---|---|---|
| \`helmet\` | Security headers (CSP, HSTS, X-Frame) | \`npm i helmet\` |
| \`cors\` | Cross-Origin Resource Sharing | \`npm i cors\` |
| \`express-rate-limit\` | Rate limiting per IP | \`npm i express-rate-limit\` |
| \`compression\` | gzip/brotli compression | \`npm i compression\` |
| \`morgan\` / \`pino-http\` | HTTP request logging | \`npm i morgan\` |
| \`express-async-errors\` | Auto-catch async errors (v4) | \`npm i express-async-errors\` |
| \`cookie-parser\` | Parse Cookie header | \`npm i cookie-parser\` |
| \`express-session\` | Server-side sessions | \`npm i express-session\` |

## Middleware Factories (Custom Parameterized Middleware)
Use a factory function when middleware needs configuration.

### Correct
\\\`\\\`\\\`typescript
import type { RequestHandler } from 'express';

// Factory: returns configured middleware
function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
      return;
    }
    next();
  };
}

// Usage
router.delete('/users/:id', requireRole('admin'), deleteUser);
router.get('/reports', requireRole('admin', 'manager'), getReports);
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: hardcoded role, not reusable
router.delete('/users/:id', (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
});
\\\`\\\`\\\`
`,
      },
      {
        name: 'express-security-guide',
        description: 'Detailed reference for Express security: helmet, CORS, rate limiting, input validation, injection prevention, auth patterns',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Express Security — Detailed Reference

## Helmet Configuration
Helmet sets security-related HTTP headers. Always load it early in the middleware chain.

### Correct
\\\`\\\`\\\`typescript
import helmet from 'helmet';

app.use(helmet());

// Or with custom CSP for apps that load external scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.example.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // disable if embedding cross-origin resources
}));
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: disabling helmet entirely for "convenience"
app.use(helmet({ contentSecurityPolicy: false, hsts: false }));
// WRONG: no helmet at all — missing 11+ security headers
\\\`\\\`\\\`

## CORS Setup
Never use wildcard origin in production. Always specify exact origins.

### Correct
\\\`\\\`\\\`typescript
import cors from 'cors';

const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // preflight cache 24h
}));
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: allows any origin — credentials exposed to attackers
app.use(cors({ origin: '*', credentials: true }));
// WRONG: origin: true reflects the requesting origin — same as wildcard
app.use(cors({ origin: true }));
\\\`\\\`\\\`

## Rate Limiting
Protect auth endpoints aggressively and general API with broader limits.

### Correct
\\\`\\\`\\\`typescript
import rateLimit from 'express-rate-limit';

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

// Strict auth limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: no rate limiting on login — brute-force attacks possible
app.post('/api/auth/login', loginHandler);
// WRONG: rate limit too generous on auth (1000 attempts per minute)
app.use('/api/auth/login', rateLimit({ windowMs: 60000, max: 1000 }));
\\\`\\\`\\\`

## Input Validation (Zod or express-validator)
Validate ALL input at the boundary. Never trust req.body, req.query, or req.params.

### Correct — Zod
\\\`\\\`\\\`typescript
import { z } from 'zod';
import type { RequestHandler } from 'express';

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

function validate<T>(schema: z.ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          details: result.error.flatten().fieldErrors,
        },
      });
      return;
    }
    req.body = result.data; // replace with parsed + coerced data
    next();
  };
}

router.post('/users', validate(createUserSchema), createUser);
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: no validation — accepts any shape, any size
router.post('/users', async (req, res) => {
  const user = await db.users.create(req.body); // SQL injection, mass assignment
  res.json(user);
});
\\\`\\\`\\\`

## SQL / NoSQL Injection Prevention
ALWAYS use parameterized queries. Never concatenate user input into queries.

### Correct — Parameterized Queries
\\\`\\\`\\\`typescript
// SQL (pg, mysql2, knex, Prisma)
const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);

// Prisma
const user = await prisma.user.findUnique({ where: { id: req.params.id } });

// MongoDB — validate and cast types before querying
const id = z.string().regex(/^[a-f0-9]{24}$/).parse(req.params.id);
const user = await User.findById(id);
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: SQL injection via string concatenation
const user = await db.query(\\\`SELECT * FROM users WHERE id = '\${req.params.id}'\\\`);

// WRONG: NoSQL injection — attacker sends { "$gt": "" } as body
const user = await User.findOne({ email: req.body.email });
// Fix: validate that email is a string before querying
\\\`\\\`\\\`

## XSS Prevention
- Helmet sets \`Content-Security-Policy\` and \`X-Content-Type-Options: nosniff\`
- Never reflect user input in HTML responses without escaping
- API-only servers: set \`Content-Type: application/json\` — browsers won't execute JSON as script

### Correct
\\\`\\\`\\\`typescript
// API responses are JSON — safe by default
res.json({ data: user });

// If rendering HTML (SSR), always escape user data
import escapeHtml from 'escape-html';
res.send(\\\`<h1>\${escapeHtml(user.name)}</h1>\\\`);
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: reflects user input as HTML — XSS
res.send(\\\`<h1>Welcome, \${req.query.name}</h1>\\\`);
\\\`\\\`\\\`

## CSRF Protection
For cookie-based auth (sessions), use CSRF tokens. Token-based auth (JWT in header) is
inherently immune to CSRF since browsers do not auto-attach custom headers.

### Correct
\\\`\\\`\\\`typescript
import csrf from 'csurf';

// Only needed for session/cookie auth
app.use(csrf({ cookie: { httpOnly: true, secure: true, sameSite: 'strict' } }));

// Send token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: req.csrfToken() });
});
\\\`\\\`\\\`

## Session Security
### Correct
\\\`\\\`\\\`typescript
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  name: 'app.sid', // NEVER use default 'connect.sid'
  secret: process.env.SESSION_SECRET!,
  store: new RedisStore({ client: redisClient }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
  },
}));
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: default name, in-memory store, insecure cookies
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  // no cookie security, no store — leaks memory, insecure
}));
\\\`\\\`\\\`

## Authentication Patterns (JWT + Passport)

### Correct — JWT Verification Middleware
\\\`\\\`\\\`typescript
import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';

export const authenticate: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    return;
  }

  try {
    const token = header.slice(7);
    // ALWAYS pin algorithm to prevent 'none' algorithm attack
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    });
    req.user = payload as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: no algorithm pinning — attacker can use 'none' algorithm
const payload = jwt.verify(token, secret);
// WRONG: error message reveals implementation details
catch (err) { res.status(401).json({ error: err.message }); }
\\\`\\\`\\\`

## Error Handling That Does Not Leak Information
Production error handler must hide stack traces, file paths, and query details.

### Correct
\\\`\\\`\\\`typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) { next(err); return; }

  // Operational error — safe to show message
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Programmer error — log internally, hide from client
  req.log?.error({ err, reqId: req.id }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: leaks stack trace, file paths, DB query details
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: err.message,
    stack: err.stack,
    query: (err as any).query, // DB query exposed
  });
});
\\\`\\\`\\\`
`,
      },
      {
        name: 'express-middleware-generator',
        description: 'Generate Express middleware with proper patterns and TypeScript types',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/route|controller|router/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/router\\.(post|put|patch)\\s*\\(/.test(c)&&!/valid|schema|zod|joi|celebrate/.test(c.toLowerCase()))console.log(\'WARNING: Route with POST/PUT/PATCH but no validation middleware detected. Add input validation before the handler.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/middleware|error|handler/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/err\\s*,\\s*req\\s*,\\s*res\\s*[^,)]*\\)/.test(c)&&!/next/.test(c.split(/err\\s*,\\s*req\\s*,\\s*res/)[1]||\'next\'))console.log(\'WARNING: Error-handling middleware MUST have 4 parameters (err, req, res, next). Missing next parameter.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.ts$|\\.js$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/res\\.redirect\\s*\\(/.test(c)&&!/new\\s+URL|hostname|host/.test(c))console.log(\'WARNING: res.redirect() detected without URL validation. Validate the redirect target to prevent open redirect vulnerabilities.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/route|controller|router/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const lines=c.split(\'\\n\');let warn=false;for(let i=0;i<lines.length;i++){const l=lines[i];if(/\\basync\\b/.test(l)&&/\\b(req|request)\\b/.test(l)&&/\\b(res|response)\\b/.test(l)){let hasTryCatch=false;let braceDepth=0;for(let j=i;j<Math.min(i+50,lines.length);j++){if(/try\\s*\\{/.test(lines[j]))hasTryCatch=true;if(/\\.catch\\s*\\(/.test(lines[j]))hasTryCatch=true;if(/asyncHandler|express-async-errors|catchAsync/.test(lines[j]))hasTryCatch=true;}if(!hasTryCatch&&!/express-async-errors/.test(c)){warn=true;break;}}}if(warn)console.log(\'WARNING: Async route handler without error handling detected. Wrap in try/catch, use asyncHandler wrapper, or install express-async-errors (Express 4). Express 5 catches async errors automatically.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/app|server|index/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const secMiddleware=[\'helmet\',\'cors\',\'rateLimit\',\'rate-limit\',\'csrf\',\'session\'];const lines=c.split(\'\\n\');const warns=[];for(const l of lines){if(/app\\.use\\s*\\(/.test(l)){for(const mw of secMiddleware){if(new RegExp(mw,\'i\').test(l)&&!/app\\.use\\s*\\(\\s*[\\x27\\x22\\/]/.test(l)&&!/app\\.use\\s*\\(\\s*[\\x27\\x22]\\//,\'\').test(l)){const hasPath=/app\\.use\\s*\\(\\s*[\\x27\\x22\\x60]\\//.test(l);if(!hasPath&&mw!==\'helmet\'&&mw!==\'compression\'){warns.push(mw);}}}}}if(warns.length>0)console.log(\'WARNING: Security middleware (\'+warns.join(\', \')+\') applied globally without path prefix. Consider scoping with app.use(\\\'/api\\\', ...) to limit exposure.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
