import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const axumProfile: Profile = {
  id: 'frameworks/axum',
  name: 'Axum',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['axum'],
  contributions: {
    claudeMd: [
      {
        heading: 'Axum Conventions',
        order: 20,
        content: `## Axum Conventions

Tower-based async web framework. Extractors for request parsing, middleware via Tower layers.

**Detailed rules:** see \`.claude/rules/axum/\` directory.

**Key rules:**
- Extractors (\`Path\`, \`Query\`, \`Json\`) for type-safe request parsing
- Tower middleware layers for auth, logging, rate-limiting — compose with \`ServiceBuilder\`
- Shared state via \`Extension\` or \`State\`, use \`Arc\` for thread-safe sharing
- Error handling: implement \`IntoResponse\` for custom error types`,
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
          'Bash(cargo doc:*)',
          'Bash(cargo add:*)',
          'Bash(cargo nextest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'axum/architecture.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Axum architecture: handlers, extractors, state, and routing (0.8+)',
        content: `# Axum Architecture

## Handler Patterns
- Handlers are async functions whose parameters are extractors; return type must implement \`IntoResponse\`
- Body-consuming extractors (\`Json\`, \`Form\`, \`Bytes\`, \`String\`) must be the LAST handler parameter
- Return \`Result<T, AppError>\` where both T and AppError implement \`IntoResponse\`
- Keep handlers thin — business logic lives in domain/service modules

## Routing (0.8+ Syntax)
- Use brace syntax for path params: \`/{id}\` — colon syntax \`/:id\` was removed in 0.8
- Compose routes: \`.route("/", get(list).post(create))\`, \`.route("/{id}", get(show).put(update).delete(destroy))\`
- Use \`.nest("/prefix", sub_router)\` for route grouping, \`.merge()\` for combining routers
- Set \`.fallback(handler_404)\` for unmatched routes
- Wildcard routes use \`/{*rest}\` not \`/*rest\`

## Application State
- Use \`State<T>\` extractor with \`Router::with_state()\` — NOT \`Extension<T>\` (untyped, panics if missing)
- Wrap expensive-to-clone fields in \`Arc\` (caches, HTTP clients); pools like \`PgPool\` are already Arc internally
- Use \`FromRef\` derive for sub-states so handlers extract only what they need

## Extractors
- Built-in: \`Path<T>\`, \`Query<T>\`, \`State<T>\`, \`HeaderMap\` (non-consuming); \`Json<T>\`, \`Form<T>\`, \`Bytes\`, \`String\`, \`Request\` (consuming)
- Custom extractors: implement \`FromRequestParts<S>\` (non-consuming) or \`FromRequest<S>\` (consuming)
- Auth extractors: implement \`FromRequestParts\` to extract and validate JWT/token from Authorization header

## Error Handling
- Define a single \`AppError\` enum with \`thiserror\` derives implementing \`IntoResponse\`
- Map errors to structured JSON: \`{ "error": "CODE", "message": "..." }\` with appropriate HTTP status codes
- Use \`#[from]\` for automatic error conversions from external crates
- Never leak internal error details to clients — log details server-side, return generic messages
`,
      },
      {
        path: 'axum/middleware-and-layers.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Axum middleware patterns with Tower layers and tower-http',
        content: `# Axum Middleware & Tower Layers

## Tower Layer System
- Axum delegates middleware to Tower \`Layer\` + \`Service\` traits — entire Tower ecosystem available
- Compose layers with \`ServiceBuilder::new().layer(...).layer(...)\`
- Key tower-http layers: \`TraceLayer\`, \`CorsLayer\`, \`CompressionLayer\`, \`TimeoutLayer\`, \`RequestBodyLimitLayer\`, \`SetResponseHeaderLayer\`

## Custom Middleware
- Simple: \`middleware::from_fn(async fn(req, next) -> Response)\`
- With state: \`middleware::from_fn_with_state(state, async fn(State(s), req, next) -> Result<Response, Error>)\`
- Insert user/context into request extensions via \`request.extensions_mut().insert(value)\`

## Per-Scope Middleware
- Apply auth middleware only to protected route groups using \`.layer()\` on specific routers
- Merge public and protected routers: \`Router::new().merge(public).merge(protected).with_state(state)\`

## Recommended Layer Ordering
1. **TraceLayer** — outermost, captures full request lifecycle
2. **CompressionLayer** — compress response bodies
3. **CorsLayer** — handle CORS preflight and headers
4. **TimeoutLayer** — enforce request deadlines
5. **RequestBodyLimitLayer** — protect against oversized payloads
6. **Auth middleware** — closest to handlers, runs after all cross-cutting concerns

## Critical Rules
- Never use \`CorsLayer::permissive()\` in production — use specific allowed origins
- Never block the async runtime — use \`tokio::time::sleep\`, not \`std::thread::sleep\`
- Always set \`RequestBodyLimitLayer\` to prevent oversized payload attacks
- Always set \`TimeoutLayer\` to enforce request deadlines
`,
      },
      {
        path: 'axum/project-structure.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Axum project structure, graceful shutdown, and production patterns',
        content: `# Axum Project Structure & Production Patterns

## Recommended Project Layout
- \`main.rs\` — entry point: build state, bind listener, serve with graceful shutdown
- \`lib.rs\` — \`app(state) -> Router\` function for testability
- \`config.rs\` — configuration from env/files (serde + envy/config crate)
- \`error.rs\` — \`AppError\` enum + \`IntoResponse\` impl
- \`state.rs\` — \`AppState\` struct + \`FromRef\` sub-states
- \`routes/\` — handler modules + route composition functions returning Router
- \`middleware/\` — auth middleware, request ID injection
- \`domain/\` — business logic, models, services
- \`db/\` — pool setup, migrations, query modules by entity
- \`tests/\` — \`common/mod.rs\` for TestApp, \`api/\` for endpoint integration tests

## Entry Point Pattern
- Initialize structured JSON logging with \`tracing\` + \`tracing-subscriber\`
- Load config from environment, build database pool and \`AppState\`
- Build app via \`lib.rs::app(state)\`, bind \`TcpListener\`, serve with \`with_graceful_shutdown()\`
- Shutdown signal: \`tokio::select!\` on ctrl_c + SIGTERM

## Health & Readiness
- \`/health\` — returns 200 OK (liveness)
- \`/ready\` — checks database connectivity, returns 200 or 503

## Production Checklist
- Graceful shutdown with timeout
- Structured JSON logging with \`tracing\`
- Request body size limits via \`RequestBodyLimitLayer\`
- Request timeout via \`TimeoutLayer\`
- CORS locked to specific origins (not \`permissive()\`)
- Security headers: X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options
- Database connection pool with limits and idle timeouts
- Run behind reverse proxy (nginx/traefik) for TLS termination
- Build with \`--release\` and \`lto = true\` for production
`,
      },
      {
        path: 'axum/testing.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Axum testing patterns: integration tests with oneshot, test helpers',
        content: `# Axum Testing Patterns

## Integration Testing with tower::ServiceExt
- Build the full Router with test state and use \`tower::ServiceExt::oneshot(request)\`
- Construct requests with \`Request::builder()\` from the \`http\` crate
- Read response body with \`http_body_util::BodyExt::collect().await.to_bytes()\`
- Clone the Router for each oneshot call — oneshot consumes the service
- Do NOT start a real TCP server for unit/integration tests — use oneshot

## Test Helper Pattern
- Create a \`TestApp\` struct with convenience methods (\`get\`, \`post_json\`, etc.)
- Build test state with test database pool and test config defaults
- Each test builds its own Router instance with fresh state — no shared mutable state

## What to Test
- Happy path: valid request -> expected status code + response body
- Validation: invalid JSON -> 422, missing required fields -> 400
- Not found: nonexistent resource -> 404 with structured error body
- Authentication: missing/invalid token -> 401, expired token -> 401
- Authorization: forbidden action -> 403
- Error responses: verify JSON error body shape matches \`{ "error": "CODE", "message": "..." }\`
- Middleware: auth rejects unauthenticated, CORS headers present, timeout works

## Test Conventions
- Use \`#[tokio::test]\` for all async test functions
- Use \`assert_eq!\` on \`response.status()\` for clear failure messages
- Deserialize response bodies and assert on specific fields, not raw strings
- Test error responses by verifying both status code and body structure
- Do not share mutable state between tests
- Do not assert on exact error message strings — assert on error codes/status
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Axum Review

**Available skills:** axum-handler-generator, axum-middleware-skill

### Routing & Handlers
- Verify path parameters use brace syntax \`/{id}\` not colon syntax \`/:id\` (removed in 0.8)
- Check that body-consuming extractors (Json, Form, Bytes, String) are the LAST handler parameter
- Verify handlers return \`Result<T, AppError>\` where both T and AppError implement IntoResponse
- Check that handlers are thin — business logic lives in domain/service modules, not in handlers
- Verify all request/response structs derive \`serde::Serialize\` and/or \`serde::Deserialize\`
- Check that wildcard routes use \`/{*rest}\` not \`/*rest\`

### State Management
- Verify application state uses \`State<T>\` extractor with \`Router::with_state()\` — not \`Extension<T>\`
- Check that \`Arc<T>\` wraps expensive-to-clone fields (DB pools, caches, HTTP clients)
- Verify sub-states use \`FromRef\` derive for granular state extraction
- Check state is not cloned unnecessarily — prefer borrowing in handlers where possible

### Error Handling
- Verify a single \`AppError\` enum implements \`IntoResponse\` with structured JSON bodies
- Check that internal errors are not leaked to clients — log details, return generic message
- Verify \`thiserror\` \`#[from]\` is used for automatic error conversions
- Check that error responses include appropriate HTTP status codes

### Middleware & Layers
- Verify Tower layer ordering: tracing → compression → CORS → timeout → body limit → auth
- Check that \`CorsLayer\` is NOT set to \`permissive()\` in production code
- Verify \`TraceLayer\` is applied as the outermost layer for full request lifecycle tracing
- Check for blocking operations in middleware — must use async I/O only
- Verify \`RequestBodyLimitLayer\` is set to prevent oversized payload attacks
- Check \`TimeoutLayer\` is configured for appropriate request deadlines

### Production Readiness
- Verify graceful shutdown is configured with \`with_graceful_shutdown()\`
- Check for health (\`/health\`) and readiness (\`/ready\`) endpoints
- Verify structured logging with \`tracing\` and \`tracing-subscriber\` (not \`println!\` or \`eprintln!\`)
- Check that security headers are set: X-Content-Type-Options, X-Frame-Options, HSTS
- Verify the app() function is in lib.rs and returns Router for testability`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Axum Testing

**Available skills:** axum-handler-generator, axum-middleware-skill

### Integration Tests (Preferred)
- Build the full Router with test state and use \`tower::ServiceExt::oneshot(request)\`
- Construct requests with \`Request::builder()\` from the \`http\` crate
- Read response body with \`http_body_util::BodyExt::collect().await.to_bytes()\`
- Create a \`TestApp\` helper struct with convenience methods (get, post_json, etc.)
- Clone the Router for each oneshot call — oneshot consumes the service

### What to Test
- Happy path: valid request → expected status code + response body
- Validation: invalid JSON → 422, missing required fields → 400
- Not found: nonexistent resource → 404 with structured error body
- Authentication: missing/invalid token → 401, expired token → 401
- Authorization: forbidden action → 403
- Error responses: verify JSON error body shape matches \`{ "error": "CODE", "message": "..." }\`
- Middleware: auth rejects unauthenticated, CORS headers present, timeout works

### Test Patterns
- Use \`#[tokio::test]\` for all async test functions
- Isolate tests: each test builds its own Router instance with fresh state
- Use \`assert_eq!\` on \`response.status()\` for clear failure messages
- Deserialize response bodies and assert on specific fields, not raw strings
- Test error responses by verifying both status code and body structure

### Anti-Patterns
- Do not start a real TCP server for unit/integration tests — use oneshot
- Do not share mutable state between tests — each test gets its own state
- Do not assert on exact error message strings — assert on error codes/status`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Axum Security Review

**Available skills:** axum-handler-generator, axum-middleware-skill

### Input Validation
- Verify all user input extracted via Json<T>, Path<T>, Query<T> uses validated types (not raw String for IDs, emails, etc.)
- Check for request body size limits via \`RequestBodyLimitLayer\` — unbounded bodies enable DoS
- Verify custom extractors reject malformed input with appropriate HTTP error codes
- Check that path traversal is prevented in file-serving routes

### Authentication & Authorization
- Verify auth middleware runs BEFORE route handlers (layer ordering)
- Check that JWT/token verification is done in a shared extractor or middleware, not duplicated in handlers
- Verify sensitive endpoints cannot be accessed without authentication
- Check for proper RBAC — authorization checks happen after authentication

### HTTP Security
- Verify CorsLayer uses specific allowed origins — never \`CorsLayer::permissive()\` in production
- Check security headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Strict-Transport-Security
- Verify error responses do not leak internal details (stack traces, file paths, SQL queries)
- Check that \`TraceLayer\` does not log sensitive data (passwords, tokens, PII)

### Tower Service Safety
- Verify all handlers return \`Infallible\` error type through IntoResponse — unhandled errors terminate connections
- Check that panics in handlers are caught (consider \`tower::catch_panic::CatchPanic\` layer)
- Verify timeout is set on all routes to prevent slowloris-style attacks`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Axum Refactoring

**Available skills:** axum-handler-generator, axum-middleware-skill

### Common Refactorings
- Extract repeated extractor combinations into custom extractor structs (e.g., AuthUser, Pagination)
- Consolidate per-handler error mapping into a single AppError IntoResponse implementation
- Move business logic from handlers to domain modules — handlers should only extract, call, respond
- Replace inline closures in route definitions with named handler functions
- Introduce FromRef sub-states to reduce coupling — handlers extract only the state they need
- Replace manual middleware with \`axum::middleware::from_fn\` or \`from_fn_with_state\`
- Extract route definitions into module-level functions that return Router for composability`,
      },
    ],
    skills: [
      {
        name: 'axum-handler-generator',
        description: 'Generate Axum HTTP handlers with extractors, error types, and tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Axum Handler Generator

Generate a complete Axum handler with:

1. **Request/Response types** — structs with \`serde::Serialize\`/\`Deserialize\` derives
2. **Handler function** — async fn with typed extractors:
   - \`State<T>\` for application state
   - \`Path<T>\` for URL parameters (use brace syntax: \`/{id}\`)
   - \`Query<T>\` for query string parameters
   - \`Json<T>\` as the LAST parameter for request body
3. **Return type** — \`Result<(StatusCode, Json<T>), AppError>\` or \`Result<Json<T>, AppError>\`
4. **Route definition** — \`Router::new().route("/path/{id}", get(handler).post(handler))\`
5. **Error handling** — \`AppError\` enum implementing \`IntoResponse\` with structured JSON
6. **Integration test** — using \`tower::ServiceExt::oneshot\` with \`Request::builder()\`

Template:
\`\`\`rust
use axum::{extract::{Path, State, Json}, http::StatusCode, response::IntoResponse, Router, routing::get};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CreateItemRequest {
    name: String,
    // ... fields
}

#[derive(Serialize)]
struct ItemResponse {
    id: i64,
    name: String,
    // ... fields
}

async fn create_item(
    State(db): State<DbPool>,
    Json(payload): Json<CreateItemRequest>,
) -> Result<(StatusCode, Json<ItemResponse>), AppError> {
    let item = db.insert_item(&payload).await?;
    Ok((StatusCode::CREATED, Json(item.into())))
}

fn item_routes() -> Router<AppState> {
    Router::new()
        .route("/items", get(list_items).post(create_item))
        .route("/items/{id}", get(get_item).put(update_item).delete(delete_item))
}
\`\`\`
`,
      },
      {
        name: 'axum-middleware-skill',
        description: 'Create Tower middleware and layers for Axum applications',
        content: `# Axum Middleware Skill

## from_fn Middleware (Simple)

\`\`\`rust
use axum::{middleware::{self, Next}, extract::Request, response::Response};

async fn my_middleware(request: Request, next: Next) -> Response {
    // Pre-processing
    let response = next.run(request).await;
    // Post-processing
    response
}

// Apply:
router.layer(middleware::from_fn(my_middleware))
\`\`\`

## from_fn_with_state Middleware (With State)

\`\`\`rust
async fn auth_middleware(
    State(auth): State<AuthService>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Extract and verify token
    // Insert user into request extensions
    Ok(next.run(request).await)
}

// Apply:
router.layer(middleware::from_fn_with_state(state, auth_middleware))
\`\`\`

## Tower Layer (Complex/Reusable)

For middleware that needs to be configurable or published as a crate:

\`\`\`rust
use tower::{Layer, Service};
use std::task::{Context, Poll};
use std::future::Future;
use std::pin::Pin;

#[derive(Clone)]
struct MyLayer { /* config fields */ }

impl<S> Layer<S> for MyLayer {
    type Service = MyMiddleware<S>;
    fn layer(&self, inner: S) -> Self::Service {
        MyMiddleware { inner, /* config */ }
    }
}

#[derive(Clone)]
struct MyMiddleware<S> { inner: S, /* config fields */ }

impl<S, B> Service<Request<B>> for MyMiddleware<S>
where
    S: Service<Request<B>, Response = Response> + Clone + Send + 'static,
    S::Future: Send + 'static,
    B: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: Request<B>) -> Self::Future {
        let mut inner = self.inner.clone();
        Box::pin(async move {
            // Pre-processing
            let response = inner.call(request).await?;
            // Post-processing
            Ok(response)
        })
    }
}
\`\`\`

## Common tower-http Layers

| Layer | Purpose | Crate Feature |
|-------|---------|---------------|
| \`TraceLayer\` | Structured logging for requests | \`trace\` |
| \`CorsLayer\` | CORS headers | \`cors\` |
| \`CompressionLayer\` | gzip/br/zstd compression | \`compression-full\` |
| \`TimeoutLayer\` | Request deadline | \`timeout\` |
| \`RequestBodyLimitLayer\` | Payload size limit | \`limit\` |
| \`SetResponseHeaderLayer\` | Custom response headers | \`set-header\` |
| \`CatchPanicLayer\` | Convert panics to 500 | \`catch-panic\` |
| \`PropagateHeaderLayer\` | Forward headers from request | \`propagate-header\` |
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
            statusMessage: 'Checking for colon path parameters in Axum routes',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "\\broute\\s*\\(\\s*\"[^\"]*:[^\"]*\"" "$FILE_PATH" | head -3 | grep -q "." && { echo "Warning: colon path parameters detected — Axum 0.8+ requires brace syntax: /{param} not /:param" >&2; exit 2; } || exit 0',
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
            statusMessage: 'Checking for CorsLayer::permissive() in Axum code',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "CorsLayer\\s*::\\s*permissive\\s*\\(\\)" "$FILE_PATH" | head -3 | grep -q "." && { echo "Warning: CorsLayer::permissive() detected — use specific allowed origins in production" >&2; exit 2; } || exit 0',
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
            statusMessage: 'Checking for Extension<T> usage in Axum code',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "Extension\\s*<" "$FILE_PATH" | grep -v "extensions_mut" | head -3 | grep -q "." && { echo "Warning: Extension<T> detected — prefer State<T> with Router::with_state() for compile-time safety" >&2; exit 2; } || exit 0',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
