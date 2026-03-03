import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const actixWebProfile: Profile = {
  id: 'frameworks/actix-web',
  name: 'Actix Web',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['actix-web'],
  contributions: {
    claudeMd: [
      {
        heading: 'Actix Web Conventions',
        order: 20,
        content: `## Actix Web Conventions

Actor-based async web framework. Extractors for request data, middleware for cross-cutting.

**Detailed rules:** see \`.claude/rules/actix-web/\` directory.

**Key rules:**
- Extractors (\`Path\`, \`Query\`, \`Json\`, \`Data\`) for type-safe request handling
- \`web::Data<T>\` for shared app state, \`Arc\` for thread-safe concurrent access
- Middleware via \`Transform\` trait or \`wrap_fn\` for simpler cases
- Error handling: implement \`ResponseError\` for custom error types with status codes`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(cargo build:*)',
          'Bash(cargo run:*)',
          'Bash(cargo test:*)',
          'Bash(cargo clippy:*)',
          'Bash(cargo fmt:*)',
          'Bash(cargo check:*)',
          'Bash(cargo add:*)',
          'Bash(cargo tree:*)',
        ],
      },
    },
    rules: [
      {
        path: 'actix-web/architecture.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Actix Web architecture: handlers, extractors, state, routes, and error handling',
        content: `# Actix Web Architecture

## Handler Design
- Handlers are async functions that receive extractors and return \`impl Responder\`
- Keep handlers thin — wire HTTP to domain logic via service modules, nothing more
- Use \`#[serde(deny_unknown_fields)]\` on input DTOs to reject unexpected payloads
- Never use \`.unwrap()\` or manual JSON parsing in handlers — use typed extractors

## Extractors
- \`web::Json<T>\` — JSON body; \`web::Path<T>\` — URL path params; \`web::Query<T>\` — query string
- \`web::Form<T>\` — URL-encoded form; \`web::Data<T>\` — application state; \`web::Header<T>\` — typed headers
- \`HttpRequest\` — full request access; \`web::Payload\` — raw payload stream
- Configure limits: \`JsonConfig::default().limit(1MB)\`, \`PayloadConfig::default().limit(5MB)\` via \`app_data()\`
- Custom extractors: implement \`FromRequest\` for auth guards (JWT extraction/validation)

## Application State
- Wrap state in \`web::Data::new(AppState { ... })\` — \`web::Data<T>\` clones \`Arc\`, not T
- Use \`tokio::sync::RwLock\`/\`Mutex\` for mutable shared state — never \`std::sync\` variants in async context
- Never use mutable global statics — undefined behavior across workers
- Database pools (sqlx) are already Arc internally — share via \`web::Data\`

## Route Organization
- Use \`web::ServiceConfig\` with \`configure(cfg)\` functions for modular route registration
- Group routes with \`web::scope("/prefix")\` and apply per-scope middleware with \`.wrap()\`
- CRUD pattern: \`route("", get().to(list))\`, \`route("", post().to(create))\`, \`route("/{id}", get().to(show))\`

## Error Handling
- Define \`AppError\` enum with \`thiserror\` derives implementing \`ResponseError\`
- Map to structured JSON: \`{ "error": "CODE", "message": "..." }\` with appropriate HTTP status codes
- Use \`#[from]\` for automatic conversions from external error types
- Never use string errors — loses type safety and proper status codes
- Log internal errors before mapping to generic HTTP responses
`,
      },
      {
        path: 'actix-web/middleware-and-security.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Actix Web middleware patterns, CORS, auth, and security hardening',
        content: `# Actix Web Middleware & Security

## Middleware Ordering (first added = outermost)
1. \`Logger\` — outermost, sees raw request first
2. \`NormalizePath::trim()\` — normalize trailing slashes before route matching
3. \`Compress\` — compression wraps the entire response
4. \`DefaultHeaders\` — security headers on every response (HSTS, X-Frame-Options, X-Content-Type-Options)
5. CORS — handles OPTIONS preflight before reaching routes
6. Auth middleware — applied per-scope, closest to handlers

## Custom Middleware
- Use \`from_fn\` for simple async middleware: \`App::new().wrap(from_fn(my_middleware))\`
- Use \`ErrorHandlers::new().handler(StatusCode, render_fn)\` for custom error pages
- For complex auth: use \`actix-web-httpauth\` with \`HttpAuthentication::bearer(validator)\` per-scope

## CORS Configuration
- Use \`Cors::default().allowed_origin("https://...").allowed_methods([...]).allowed_headers([...])\`
- Never use \`Cors::permissive()\` in production
- Set \`max_age(3600)\` for preflight caching

## Security Hardening Checklist
- Set \`PayloadConfig\` and \`JsonConfig\` limits to prevent oversized payloads
- Use \`NormalizePath\` to prevent path confusion attacks
- Configure CORS with explicit origins
- Set security headers via \`DefaultHeaders\` (HSTS, X-Frame-Options, X-Content-Type-Options, CSP)
- Use \`actix-limitation\` or \`actix-governor\` for rate limiting on auth endpoints
- Enable TLS via \`rustls\` or terminate at reverse proxy
- Extract real client IP with \`ConnectionInfo\` only after configuring trusted proxies
- Validate all path parameters — reject traversal attempts (\`../\`)
- Use \`#[serde(deny_unknown_fields)]\` on input structs to reject unexpected data
`,
      },
      {
        path: 'actix-web/performance-and-deployment.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Actix Web performance tuning, async patterns, and production deployment',
        content: `# Actix Web Performance & Deployment

## Worker Configuration
- Default workers = number of logical CPUs — appropriate for most workloads
- Override with \`HttpServer::new(...).workers(N)\` only after benchmarking
- Each worker runs its own Tokio runtime — state shared via \`web::Data<T>\` (Arc)

## Async Best Practices
- Never block the async runtime — use \`web::block()\` for CPU-heavy or blocking operations (image processing, Diesel queries)
- Use \`std::sync::Mutex\` only for short, non-async critical sections — use \`tokio::sync::Mutex\` when holding across \`.await\`
- Use streaming responses for large payloads — \`HttpResponse::Ok().streaming(byte_stream)\`
- All spawned tasks (\`.spawn()\`) must handle errors — do not silently drop

## Database Integration
- Use sqlx \`PgPoolOptions\` with \`max_connections\`, \`min_connections\`, \`acquire_timeout\`, \`idle_timeout\`
- Share pool via \`web::Data::new(pool)\` — do not create connections per-request
- For Diesel (blocking ORM): always wrap queries in \`web::block(move || { ... })\`

## Deployment Checklist
- Set \`keep_alive\` to match reverse proxy timeout (e.g., 75s)
- Set \`shutdown_timeout(30)\` for graceful shutdown window
- Add health check endpoint that verifies database connectivity
- Use \`Logger\` middleware for request logging
- Use \`Compress::default()\` for response compression
- Spawn signal handler for graceful shutdown: \`handle.stop(true).await\`

## Environment-Based Config
- Use \`config\` or \`dotenvy\` crate — never hardcode ports, DB URLs, or secrets
- Set \`RUST_LOG=info,actix_web=info\` for production logging levels
- Run behind reverse proxy (nginx, traefik) for TLS termination and load balancing
- Use multi-stage Docker builds: builder stage with Rust toolchain, runtime stage with minimal base
`,
      },
      {
        path: 'actix-web/testing.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Actix Web testing patterns: unit tests, integration tests, and TestServer',
        content: `# Actix Web Testing

## Integration Testing with init_service
- Build test apps with \`test::init_service(App::new().app_data(...).configure(routes))\`
- Use \`test::TestRequest::get/post/put/delete()\` with \`.set_json()\`, \`.set_form()\`, \`.insert_header()\`
- Send requests with \`test::call_service(&app, req)\` and assert on status + body
- Read response bodies with \`test::read_body_json::<T>(resp)\` for typed assertions
- Use \`#[actix_web::test]\` annotation — NOT \`#[tokio::test]\` — for proper Actix runtime

## Unit Testing Handlers
- Call handler functions directly by constructing extractor values (\`web::Data\`, \`web::Json\`, etc.)
- Useful for fast unit tests of business logic without HTTP overhead

## Full HTTP Stack Testing
- Use \`actix_test::start()\` with \`TestServer\` for real HTTP tests
- Tests serialization, headers, CORS, compression end-to-end
- Use for testing content negotiation and cookie handling

## Testing Custom Extractors
- Test auth extractors with valid and invalid tokens via \`.insert_header(("Authorization", "Bearer ..."))\`
- Verify correct status codes for missing/invalid/expired tokens (401, 403)

## Testing Middleware
- Test CORS by sending requests with Origin header and checking response headers
- Test security headers by verifying \`DefaultHeaders\` output

## Test Patterns Checklist
- Mock external dependencies (DB, HTTP clients) via trait objects injected through \`app_data\`
- Test all HTTP methods for each resource (GET, POST, PUT, DELETE)
- Test validation errors: missing fields, wrong types, oversized payloads
- Test authentication: valid token, expired token, missing token, malformed token
- Test authorization: user accessing own resource vs. another user's resource
- Test error responses: verify status codes AND JSON error body shape
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Actix Web Review

**Available skills:** actix-web-handler-generator, actix-web-middleware-generator

### Handler Quality
- Verify handlers use typed extractors — flag any manual parsing from HttpRequest body
- Check that handlers are thin: HTTP wiring only, business logic in service modules
- Verify all request/response structs derive Serialize/Deserialize with appropriate serde attributes
- Check \`#[serde(deny_unknown_fields)]\` on input DTOs to reject unexpected payloads
- Verify extractors have configured limits (JsonConfig, PayloadConfig) on app_data()

### Application State
- Check shared state is wrapped in web::Data<T> and registered with app_data()
- Verify mutable state uses tokio::sync::Mutex or RwLock — not std::sync variants
- Confirm database pools are shared via web::Data<Pool> — not created per-request
- Flag any use of mutable global statics or lazy_static with RefCell

### Error Handling
- Verify custom error types implement ResponseError with proper status code mapping
- Check that internal errors (database, I/O) are logged before mapping to HTTP responses
- Verify error responses return structured JSON, not plain text strings
- Flag any .unwrap() or .expect() in handler code paths — must use ? or proper error mapping

### Middleware & Security
- Verify middleware ordering: Logger > NormalizePath > Compress > DefaultHeaders > CORS > Auth
- Check that CORS is configured with explicit origins — flag Cors::permissive() in non-dev code
- Verify security headers are set via DefaultHeaders (HSTS, X-Frame-Options, CSP)
- Check that payload limits are configured to prevent oversized request attacks
- Verify rate limiting middleware is applied to authentication and sensitive endpoints

### Async Correctness
- Flag blocking operations (std::fs, diesel queries, CPU-heavy) not wrapped in web::block()
- Verify std::sync::Mutex is not held across .await points — must use tokio::sync::Mutex
- Check that all spawned tasks (.spawn()) handle errors — not silently dropped
- Verify streaming responses use proper async streams, not buffered full responses for large data`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Actix Web Testing

**Available skills:** actix-web-handler-generator, actix-web-middleware-generator

### Integration Tests
- Build test apps with \`test::init_service(App::new().app_data(...).configure(routes))\`
- Use \`test::TestRequest::get/post/put/delete()\` with \`.set_json()\`, \`.set_form()\`, etc.
- Send requests with \`test::call_service(&app, req)\` and assert on status + body
- Read response bodies with \`test::read_body_json::<T>(resp)\` for typed assertions
- Use \`#[actix_web::test]\` annotation — not \`#[tokio::test]\` — for proper Actix runtime

### What to Test
- All HTTP methods on each resource endpoint (CRUD coverage)
- Validation errors: missing required fields, wrong types, oversized payloads
- Authentication: valid token, expired, missing, malformed — verify 401/403
- Authorization: accessing own vs. other user's resource — verify 403
- Error responses: assert both status code AND JSON error body shape
- Custom extractors: test with valid and invalid inputs
- Middleware behavior: CORS headers, compression, security headers

### Full Stack Tests
- Use \`actix_test::start()\` with TestServer for real HTTP tests when needed
- Test content negotiation, header propagation, and cookie handling
- Test graceful degradation when dependencies (DB, cache) are unavailable

### Mocking
- Define service traits for domain logic; inject mock implementations via \`web::Data\`
- Use \`mockall\` or hand-written mocks for database and external service dependencies
- Test handlers directly by constructing extractor values when unit testing logic`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Actix Web Security Review

**Available skills:** actix-web-handler-generator, actix-web-middleware-generator

### Input Validation
- Verify JsonConfig and PayloadConfig limits are set to prevent oversized payloads
- Check that all path/query parameters are validated (type + range + format)
- Verify \`#[serde(deny_unknown_fields)]\` on input DTOs to reject injection payloads
- Flag any direct SQL string concatenation — must use parameterized queries (sqlx::query!, diesel)
- Check file upload handlers for path traversal, size limits, and content-type validation

### Authentication & Authorization
- Verify auth middleware is applied to all non-public routes
- Check that JWT validation includes expiry, issuer, and audience checks
- Verify authorization checks happen per-handler (not just authentication)
- Flag any routes missing auth middleware that handle sensitive data

### HTTP Security
- Verify CORS whitelist — Cors::permissive() must NEVER appear in production code
- Check security headers: HSTS, X-Frame-Options, X-Content-Type-Options, CSP
- Verify TLS is enforced (either rustls or reverse proxy TLS termination)
- Check cookie attributes: HttpOnly, Secure, SameSite for session cookies
- Verify NormalizePath middleware is active to prevent path confusion

### Rate Limiting
- Verify rate limiting on login, registration, password reset endpoints
- Check that rate limiter uses appropriate backend (in-memory for single instance, Redis for distributed)`,
      },
    ],
    skills: [
      {
        name: 'actix-web-handler-generator',
        description: 'Generate complete Actix-Web CRUD handlers with extractors, error handling, and tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Actix-Web Handler Generator

Generate a complete Actix-Web handler including:

## Handler Function
- Async handler function with typed extractors (web::Json, web::Path, web::Query, web::Data)
- Input DTO with \`#[derive(Deserialize)]\` and \`#[serde(deny_unknown_fields)]\`
- Output DTO with \`#[derive(Serialize)]\`
- Proper error handling returning Result<impl Responder, AppError>
- Thin handler that delegates to a service module

## Route Configuration
- Route registration in a \`configure(cfg: &mut web::ServiceConfig)\` function
- web::scope() grouping with appropriate middleware
- All CRUD methods: GET (list + by-id), POST, PUT, DELETE

## Error Type
- AppError enum with thiserror derives
- ResponseError implementation mapping to correct HTTP status codes
- Structured JSON error body: { "error": "CODE", "message": "description" }

## Integration Test
- Test with \`test::init_service\` and \`test::TestRequest\`
- Test happy path + not found + validation error + auth error
- Use \`#[actix_web::test]\` annotation
- Assert status code AND response body shape
`,
      },
      {
        name: 'actix-web-middleware-generator',
        description: 'Generate custom Actix-Web middleware for cross-cutting concerns',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Actix-Web Middleware Generator

Generate Actix-Web middleware using from_fn or Transform+Service traits:

## Simple Middleware (from_fn)
- Async function with \`(req: ServiceRequest, next: Next<B>) -> Result<ServiceResponse<B>>\`
- Request preprocessing (extract headers, set request ID, log)
- Response postprocessing (add headers, log duration, metrics)
- Conditional short-circuit (reject unauthorized, rate limit exceeded)

## Complex Middleware (Transform + Service)
- Implement Transform trait for middleware factory
- Implement Service trait for the middleware logic
- State access via Clone in the middleware struct
- Proper Pin<Box<dyn Future>> for async middleware

## Common Middleware Patterns
- Request ID injection (UUID per request in header + response)
- Request/response timing with tracing spans
- Authentication guard with JWT validation
- Rate limiting with token bucket or sliding window
- Request body logging for audit (with PII redaction)
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            statusMessage: 'Checking for Cors::permissive() in Actix-Web code',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "Cors::permissive" "$FILE_PATH" | grep -q "." && { echo "Warning: Cors::permissive() detected — must NOT be used in production. Use explicit allowed_origin()." >&2; exit 2; } || exit 0',
            timeout: 10,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            statusMessage: 'Checking for mutable static in Actix-Web code',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "static\\s+mut\\s+" "$FILE_PATH" | grep -q "." && { echo "Warning: mutable static detected — use web::Data<T> with interior mutability instead" >&2; exit 2; } || exit 0',
            timeout: 10,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            statusMessage: 'Checking for std::sync::Mutex/RwLock in Actix-Web async handlers',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "std::sync::(Mutex|RwLock)" "$FILE_PATH" | grep -q "." && { echo "Warning: std::sync::Mutex/RwLock detected in Actix handler — use tokio::sync variants to avoid blocking the async runtime" >&2; exit 2; } || exit 0',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
