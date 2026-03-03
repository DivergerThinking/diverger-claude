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

Handlers are async functions whose parameters are extractors. The return type must implement \`IntoResponse\`.

\`\`\`rust
use axum::{extract::{Path, State, Json}, http::StatusCode, response::IntoResponse};

async fn get_user(
    State(db): State<DbPool>,
    Path(user_id): Path<i64>,
) -> Result<Json<User>, AppError> {
    let user = db.find_user(user_id).await?;
    Ok(Json(user))
}

async fn create_user(
    State(db): State<DbPool>,
    Json(payload): Json<CreateUserRequest>,  // body extractor LAST
) -> Result<(StatusCode, Json<User>), AppError> {
    let user = db.create_user(payload).await?;
    Ok((StatusCode::CREATED, Json(user)))
}
\`\`\`

### Anti-Pattern: manual body parsing

\`\`\`rust
// Wrong: manual body consumption — use Json<T> extractor instead
async fn bad_handler(request: Request) -> impl IntoResponse {
    let body = axum::body::to_bytes(request.into_body(), 1024).await.unwrap();
    let payload: CreateUserRequest = serde_json::from_slice(&body).unwrap();
    // ...
}
\`\`\`

## Routing (0.8+ Syntax)

\`\`\`rust
use axum::{Router, routing::{get, post, put, delete}};

fn app(state: AppState) -> Router {
    let users = Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/{id}", get(get_user).put(update_user).delete(delete_user))
        .route("/{id}/profile", get(get_profile));

    let health = Router::new()
        .route("/health", get(health_check))
        .route("/ready", get(readiness_check));

    Router::new()
        .nest("/api/v1/users", users)
        .merge(health)
        .fallback(handler_404)
        .with_state(state)
}
\`\`\`

### Anti-Pattern: old colon syntax (removed in 0.8)

\`\`\`rust
// Wrong (0.8+): colon path params no longer compile
Router::new().route("/users/:id", get(get_user));

// Correct (0.8+): use brace syntax
Router::new().route("/users/{id}", get(get_user));
\`\`\`

## Application State

\`\`\`rust
use axum::extract::FromRef;

#[derive(Clone)]
struct AppState {
    db: PgPool,          // sqlx pool is already Arc internally
    cache: Arc<Cache>,   // expensive-to-clone → wrap in Arc
    config: AppConfig,   // cheap to clone → no Arc needed
}

// Derive sub-states so handlers extract only what they need
#[derive(Clone)]
struct DbState(PgPool);

impl FromRef<AppState> for DbState {
    fn from_ref(state: &AppState) -> Self {
        DbState(state.db.clone())
    }
}
\`\`\`

### Anti-Pattern: Extension instead of State

\`\`\`rust
// Wrong: Extension is untyped at the router level and panics if missing
async fn handler(Extension(db): Extension<PgPool>) -> impl IntoResponse { /* ... */ }

// Correct: State is compile-time checked via Router::with_state()
async fn handler(State(db): State<PgPool>) -> impl IntoResponse { /* ... */ }
\`\`\`

## Extractors

### Built-in Extractors
| Extractor | Source | Consumes Body? |
|-----------|--------|----------------|
| \`Path<T>\` | URL path parameters | No |
| \`Query<T>\` | URL query string | No |
| \`State<T>\` | Application state | No |
| \`HeaderMap\` | All request headers | No |
| \`Json<T>\` | JSON request body | Yes |
| \`Form<T>\` | URL-encoded body | Yes |
| \`Bytes\` | Raw body bytes | Yes |
| \`String\` | Body as UTF-8 string | Yes |
| \`Request\` | Full request | Yes |

### Custom Extractors

\`\`\`rust
use axum::extract::FromRequestParts;
use http::request::Parts;

struct AuthUser {
    user_id: i64,
    role: Role,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;

        let claims = verify_jwt(token).map_err(|_| AppError::Unauthorized)?;
        Ok(AuthUser { user_id: claims.sub, role: claims.role })
    }
}

// Now usable as an extractor in any handler
async fn protected(user: AuthUser, Json(body): Json<Payload>) -> impl IntoResponse {
    // user is authenticated, body is parsed
}
\`\`\`

## Error Handling

\`\`\`rust
use axum::{http::StatusCode, response::IntoResponse, Json};
use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("unauthorized")]
    Unauthorized,
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("internal error")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, code) = match &self {
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "NOT_FOUND"),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
            AppError::Validation(_) => (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR"),
            AppError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"),
        };
        let body = serde_json::json!({
            "error": code,
            "message": self.to_string(),
        });
        (status, Json(body)).into_response()
    }
}
\`\`\`

### Anti-Pattern: leaking internal errors

\`\`\`rust
// Wrong: exposes internal details to the client
impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let body = format!("{:?}", self); // Debug output with stack trace
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}
\`\`\`
`,
      },
      {
        path: 'axum/middleware-and-layers.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Axum middleware patterns with Tower layers and tower-http',
        content: `# Axum Middleware & Tower Layers

## Tower Layer System

Axum delegates middleware to Tower's \`Layer\` and \`Service\` traits. This means the entire Tower ecosystem is available out of the box.

### Applying Layers

\`\`\`rust
use axum::Router;
use tower::ServiceBuilder;
use tower_http::{
    trace::TraceLayer,
    cors::CorsLayer,
    compression::CompressionLayer,
    timeout::TimeoutLayer,
    set_header::SetResponseHeaderLayer,
    limit::RequestBodyLimitLayer,
};
use std::time::Duration;
use http::header;

fn app(state: AppState) -> Router {
    let middleware = ServiceBuilder::new()
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(CorsLayer::permissive()) // tighten in production
        .layer(TimeoutLayer::new(Duration::from_secs(30)))
        .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1 MB
        .layer(SetResponseHeaderLayer::overriding(
            header::X_CONTENT_TYPE_OPTIONS,
            "nosniff".parse().unwrap(),
        ));

    Router::new()
        .nest("/api", api_routes())
        .layer(middleware)
        .with_state(state)
}
\`\`\`

## Custom Middleware with from_fn

\`\`\`rust
use axum::{middleware::{self, Next}, extract::Request, response::Response};

async fn log_request(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    let start = std::time::Instant::now();

    let response = next.run(request).await;

    tracing::info!(
        method = %method,
        uri = %uri,
        status = %response.status(),
        latency_ms = %start.elapsed().as_millis(),
    );
    response
}

// Apply:
Router::new()
    .route("/api/{*path}", get(handler))
    .layer(middleware::from_fn(log_request));
\`\`\`

## Middleware with State

\`\`\`rust
use axum::{middleware, extract::State};

async fn require_auth(
    State(auth): State<AuthService>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::Unauthorized)?;

    let user = auth.verify(token).await.map_err(|_| AppError::Unauthorized)?;
    request.extensions_mut().insert(user);
    Ok(next.run(request).await)
}

// Apply with state:
Router::new()
    .route("/protected", get(handler))
    .layer(middleware::from_fn_with_state(state.clone(), require_auth));
\`\`\`

## Per-Scope Middleware

\`\`\`rust
let public_routes = Router::new()
    .route("/health", get(health_check))
    .route("/login", post(login));

let protected_routes = Router::new()
    .route("/users", get(list_users))
    .route("/users/{id}", get(get_user))
    .layer(middleware::from_fn_with_state(state.clone(), require_auth));

Router::new()
    .merge(public_routes)
    .merge(protected_routes)
    .with_state(state)
\`\`\`

## Recommended Layer Ordering
1. **TraceLayer** — outermost, captures full request lifecycle
2. **CompressionLayer** — compress response bodies
3. **CorsLayer** — handle CORS preflight and headers
4. **TimeoutLayer** — enforce request deadlines
5. **RequestBodyLimitLayer** — protect against oversized payloads
6. **Auth middleware** — closest to handlers, runs after all cross-cutting concerns

## Anti-Pattern: blocking in middleware

\`\`\`rust
// Wrong: std::thread::sleep blocks the Tokio runtime
async fn slow_middleware(req: Request, next: Next) -> Response {
    std::thread::sleep(Duration::from_secs(1)); // blocks!
    next.run(req).await
}

// Correct: use async sleep
async fn slow_middleware(req: Request, next: Next) -> Response {
    tokio::time::sleep(Duration::from_secs(1)).await;
    next.run(req).await
}
\`\`\`
`,
      },
      {
        path: 'axum/project-structure.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Axum project structure, graceful shutdown, and production patterns',
        content: `# Axum Project Structure & Production Patterns

## Recommended Project Layout

\`\`\`
src/
  main.rs              # entry point: build state, bind listener, serve
  lib.rs               # app() function returning Router (for testability)
  config.rs            # configuration from env/files (serde + envy/config crate)
  error.rs             # AppError enum + IntoResponse impl
  state.rs             # AppState struct + FromRef sub-states
  routes/
    mod.rs             # re-export route modules, compose Router
    users.rs           # user handlers + route fn
    auth.rs            # auth handlers + route fn
    health.rs          # health/readiness endpoints
  middleware/
    mod.rs
    auth.rs            # authentication middleware
    request_id.rs      # X-Request-Id injection
  domain/
    mod.rs
    user.rs            # User model, business logic
    auth.rs            # token verification, password hashing
  db/
    mod.rs
    pool.rs            # database pool setup (sqlx, diesel, sea-orm)
    migrations.rs      # migration runner
    queries/           # query modules by entity
      users.rs
tests/
  common/
    mod.rs             # shared test setup (TestApp, test state)
  api/
    users_test.rs      # integration tests for user endpoints
    auth_test.rs       # integration tests for auth endpoints
\`\`\`

## Entry Point

\`\`\`rust
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    // Load config
    let config = AppConfig::from_env()?;

    // Build state
    let db = PgPool::connect(&config.database_url).await?;
    let state = AppState { db, config };

    // Build app
    let app = my_app::app(state);

    // Bind and serve
    let addr = format!("0.0.0.0:{}", config.port);
    let listener = TcpListener::bind(&addr).await?;
    tracing::info!("listening on {addr}");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = tokio::signal::ctrl_c();
    let mut sigterm = tokio::signal::unix::signal(
        tokio::signal::unix::SignalKind::terminate(),
    ).expect("failed to install SIGTERM handler");

    tokio::select! {
        _ = ctrl_c => tracing::info!("received CTRL+C"),
        _ = sigterm.recv() => tracing::info!("received SIGTERM"),
    }
}
\`\`\`

## testability: app() in lib.rs

\`\`\`rust
// src/lib.rs
pub fn app(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1", routes::api_router())
        .merge(routes::health_router())
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
\`\`\`

## Health & Readiness Endpoints

\`\`\`rust
async fn health_check() -> StatusCode {
    StatusCode::OK
}

async fn readiness_check(State(db): State<PgPool>) -> StatusCode {
    match sqlx::query("SELECT 1").fetch_one(&db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}
\`\`\`

## Production Checklist
- [ ] Graceful shutdown with timeout: \`tokio::time::timeout(Duration::from_secs(30), serve)\`
- [ ] Structured JSON logging with \`tracing\` + \`tracing-subscriber\`
- [ ] Request body size limits via \`RequestBodyLimitLayer\`
- [ ] Request timeout via \`TimeoutLayer\`
- [ ] CORS locked to specific origins (not \`permissive()\`)
- [ ] Security headers: \`X-Content-Type-Options\`, \`Strict-Transport-Security\`, \`X-Frame-Options\`
- [ ] Database connection pool with limits and idle timeouts
- [ ] Health check (\`/health\`) and readiness check (\`/ready\`) endpoints
- [ ] Run behind reverse proxy (nginx/traefik) for TLS termination
- [ ] Build with \`--release\` and \`lto = true\` in Cargo.toml for production
`,
      },
      {
        path: 'axum/testing.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Axum testing patterns: integration tests with oneshot, test helpers',
        content: `# Axum Testing Patterns

## Integration Testing with tower::ServiceExt

Axum's Router implements \`tower::Service\`, so you can test it directly without starting an HTTP server.

\`\`\`rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt; // for oneshot

    fn test_state() -> AppState {
        AppState {
            db: create_test_pool().await,
            config: AppConfig::test_defaults(),
        }
    }

    #[tokio::test]
    async fn test_health_check() {
        let app = app(test_state());

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_create_user_returns_201() {
        let app = app(test_state());
        let payload = serde_json::json!({
            "name": "Alice",
            "email": "alice@example.com"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/users")
                    .header("Content-Type", "application/json")
                    .body(Body::from(serde_json::to_vec(&payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let user: User = serde_json::from_slice(&body).unwrap();
        assert_eq!(user.name, "Alice");
    }

    #[tokio::test]
    async fn test_get_nonexistent_user_returns_404() {
        let app = app(test_state());

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/users/99999")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_invalid_json_returns_422() {
        let app = app(test_state());

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/users")
                    .header("Content-Type", "application/json")
                    .body(Body::from(r#"{"invalid"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }
}
\`\`\`

## Test Helper Pattern

\`\`\`rust
// tests/common/mod.rs
pub struct TestApp {
    pub app: Router,
    pub db: PgPool,
}

impl TestApp {
    pub async fn new() -> Self {
        let db = setup_test_database().await;
        let state = AppState { db: db.clone(), config: AppConfig::test_defaults() };
        let app = my_app::app(state);
        TestApp { app, db }
    }

    pub async fn get(&self, uri: &str) -> axum::response::Response {
        self.app
            .clone()
            .oneshot(Request::get(uri).body(Body::empty()).unwrap())
            .await
            .unwrap()
    }

    pub async fn post_json(&self, uri: &str, body: &impl serde::Serialize) -> axum::response::Response {
        self.app
            .clone()
            .oneshot(
                Request::post(uri)
                    .header("Content-Type", "application/json")
                    .body(Body::from(serde_json::to_vec(body).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap()
    }
}
\`\`\`

## Testing Middleware

\`\`\`rust
#[tokio::test]
async fn test_auth_middleware_rejects_unauthenticated() {
    let app = Router::new()
        .route("/protected", get(|| async { "secret" }))
        .layer(middleware::from_fn_with_state(test_state(), require_auth))
        .with_state(test_state());

    let response = app
        .oneshot(Request::get("/protected").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}
\`\`\`
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nE "\\broute\\s*\\(\\s*\"[^\"]*:[^\"]*\"" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: colon path parameters detected — Axum 0.8+ requires brace syntax: /{param} not /:param" || true',
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nE "CorsLayer\\s*::\\s*permissive\\s*\\(\\)" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: CorsLayer::permissive() detected — use specific allowed origins in production" || true',
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nE "Extension\\s*<" "$CLAUDE_FILE_PATH" | grep -v "extensions_mut" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: Extension<T> detected — prefer State<T> with Router::with_state() for compile-time safety" || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
