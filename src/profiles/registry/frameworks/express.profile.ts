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
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/route|controller|router/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/router\\.(post|put|patch)\\s*\\(/.test(c)&&!/valid|schema|zod|joi|celebrate/.test(c.toLowerCase()))console.log(\'WARNING: Route with POST/PUT/PATCH but no validation middleware detected. Add input validation before the handler.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/middleware|error|handler/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/err\\s*,\\s*req\\s*,\\s*res\\s*[^,)]*\\)/.test(c)&&!/next/.test(c.split(/err\\s*,\\s*req\\s*,\\s*res/)[1]||\'next\'))console.log(\'WARNING: Error-handling middleware MUST have 4 parameters (err, req, res, next). Missing next parameter.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.ts$|\\.js$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/res\\.redirect\\s*\\(/.test(c)&&!/new\\s+URL|hostname|host/.test(c))console.log(\'WARNING: res.redirect() detected without URL validation. Validate the redirect target to prevent open redirect vulnerabilities.\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
