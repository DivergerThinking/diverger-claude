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

Handlers are async functions that receive extractors and return an implementor of \`Responder\`.
Keep handlers thin — they wire HTTP to domain logic, nothing more.

\`\`\`rust
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CreateUserRequest {
    pub email: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: i64,
    pub email: String,
    pub name: String,
}

async fn create_user(
    db: web::Data<DbPool>,
    body: web::Json<CreateUserRequest>,
) -> actix_web::Result<impl Responder> {
    let user = user_service::create(&db, body.into_inner()).await?;
    Ok(HttpResponse::Created().json(UserResponse::from(user)))
}
\`\`\`

### Anti-Pattern: Fat Handler
\`\`\`rust
// WRONG — business logic, validation, DB queries all inlined in the handler
async fn create_user(body: web::Json<serde_json::Value>) -> HttpResponse {
    let email = body["email"].as_str().unwrap(); // manual parsing, panics
    // ... 80 lines of SQL, validation, email sending ...
    HttpResponse::Ok().body("done")
}
\`\`\`

## Extractors

### Built-in Extractors
| Extractor | Purpose | Example |
|-----------|---------|---------|
| \`web::Json<T>\` | JSON request body | \`web::Json<CreateItem>\` |
| \`web::Path<T>\` | URL path parameters | \`web::Path<(String, u64)>\` or \`web::Path<ItemPath>\` |
| \`web::Query<T>\` | Query string parameters | \`web::Query<PaginationParams>\` |
| \`web::Form<T>\` | URL-encoded form data | \`web::Form<LoginForm>\` |
| \`web::Data<T>\` | Application state | \`web::Data<DbPool>\` |
| \`web::Header<T>\` | Typed header extraction | \`web::Header<ContentType>\` |
| \`HttpRequest\` | Full request access | For headers, connection info |
| \`web::Payload\` | Raw payload stream | For streaming uploads |

### Extractor Configuration
\`\`\`rust
// Configure payload limits in App::app_data()
App::new()
    .app_data(web::JsonConfig::default()
        .limit(1024 * 1024)  // 1 MB max JSON body
        .error_handler(|err, _req| {
            let detail = err.to_string();
            actix_web::error::InternalError::from_response(
                err,
                HttpResponse::BadRequest().json(ErrorBody::new("INVALID_JSON", &detail)),
            ).into()
        }))
    .app_data(web::PayloadConfig::default().limit(5 * 1024 * 1024)) // 5 MB
\`\`\`

### Custom Extractor
\`\`\`rust
use actix_web::{FromRequest, HttpRequest, dev::Payload, Error};
use futures::future::{ok, Ready};

pub struct AuthenticatedUser {
    pub user_id: i64,
    pub roles: Vec<String>,
}

impl FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        // Extract and validate JWT from Authorization header
        match extract_and_validate_token(req) {
            Ok(user) => ok(user),
            Err(e) => futures::future::err(e.into()),
        }
    }
}

// Usage — now automatic in any handler:
async fn protected(user: AuthenticatedUser) -> impl Responder {
    HttpResponse::Ok().json(format!("Hello user {}", user.user_id))
}
\`\`\`

## Application State

### Shared State Pattern
\`\`\`rust
pub struct AppState {
    pub db: Pool<Postgres>,       // sqlx pool (already Arc internally)
    pub config: AppConfig,        // immutable config
    pub cache: RwLock<LruCache>,  // mutable shared cache
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url).await?;

    let state = web::Data::new(AppState {
        db: pool,
        config: AppConfig::from_env()?,
        cache: RwLock::new(LruCache::new(1000)),
    });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())  // web::Data<T> clones Arc, not T
            .configure(routes::configure)
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
\`\`\`

### Anti-Pattern: Mutable Global State
\`\`\`rust
// WRONG — no synchronization, data race across workers
static mut COUNTER: u64 = 0;

async fn increment() -> impl Responder {
    unsafe { COUNTER += 1; }  // undefined behavior
    HttpResponse::Ok().body("incremented")
}
\`\`\`

## Route Organization

### Modular Configuration
\`\`\`rust
// src/routes/mod.rs
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .configure(users::configure)
            .configure(orders::configure)
            .configure(health::configure)
    );
}

// src/routes/users.rs
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/users")
            .wrap(AuthMiddleware)
            .route("", web::get().to(list_users))
            .route("", web::post().to(create_user))
            .route("/{id}", web::get().to(get_user))
            .route("/{id}", web::put().to(update_user))
            .route("/{id}", web::delete().to(delete_user))
    );
}
\`\`\`

## Error Handling

### ResponseError Pattern
\`\`\`rust
use actix_web::{HttpResponse, ResponseError};
use thiserror::Error;
use serde::Serialize;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("resource not found: {0}")]
    NotFound(String),
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("unauthorized")]
    Unauthorized,
    #[error("internal error")]
    Internal(#[from] anyhow::Error),
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
    message: String,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let (status, error_code) = match self {
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "NOT_FOUND"),
            AppError::Validation(_) => (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR"),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
            AppError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"),
        };
        HttpResponse::build(status).json(ErrorBody {
            error: error_code.to_string(),
            message: self.to_string(),
        })
    }
}
\`\`\`

### Anti-Pattern: String Errors
\`\`\`rust
// WRONG — loses type safety and proper status codes
async fn get_user(id: web::Path<i64>) -> Result<HttpResponse, actix_web::Error> {
    let user = db.find(id.into_inner())
        .map_err(|_| actix_web::error::ErrorInternalServerError("something broke"))?;
    Ok(HttpResponse::Ok().json(user))
}
\`\`\`
`,
      },
      {
        path: 'actix-web/middleware-and-security.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Actix Web middleware patterns, CORS, auth, and security hardening',
        content: `# Actix Web Middleware & Security

## Middleware Architecture

### Middleware Ordering
First added = outermost. Order matters for correctness:

\`\`\`rust
use actix_cors::Cors;
use actix_web::middleware::{Logger, Compress, NormalizePath, DefaultHeaders};

App::new()
    // 1. Outermost: request logging (sees raw request first)
    .wrap(Logger::default())
    // 2. Normalize trailing slashes before route matching
    .wrap(NormalizePath::trim())
    // 3. Compression wraps the entire response
    .wrap(Compress::default())
    // 4. Security headers on every response
    .wrap(DefaultHeaders::new()
        .add(("X-Content-Type-Options", "nosniff"))
        .add(("X-Frame-Options", "DENY"))
        .add(("X-XSS-Protection", "1; mode=block"))
        .add(("Strict-Transport-Security", "max-age=31536000; includeSubDomains")))
    // 5. CORS — handles OPTIONS preflight before reaching routes
    .wrap(configure_cors())
    // 6. Route-specific auth middleware applied per-scope
    .configure(routes::configure)
\`\`\`

### Custom Middleware with from_fn
\`\`\`rust
use actix_web::middleware::from_fn;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::body::MessageBody;

async fn request_id_middleware(
    req: ServiceRequest,
    next: actix_web::middleware::Next<impl MessageBody>,
) -> Result<ServiceResponse<impl MessageBody>, actix_web::Error> {
    let request_id = uuid::Uuid::new_v4().to_string();
    req.headers_mut().insert(
        HeaderName::from_static("x-request-id"),
        HeaderValue::from_str(&request_id)?,
    );
    let mut res = next.call(req).await?;
    res.headers_mut().insert(
        HeaderName::from_static("x-request-id"),
        HeaderValue::from_str(&request_id)?,
    );
    Ok(res)
}

// Apply:
App::new().wrap(from_fn(request_id_middleware))
\`\`\`

### ErrorHandlers Middleware
\`\`\`rust
use actix_web::middleware::ErrorHandlers;
use actix_web::http::StatusCode;

App::new()
    .wrap(
        ErrorHandlers::new()
            .handler(StatusCode::NOT_FOUND, render_404)
            .handler(StatusCode::INTERNAL_SERVER_ERROR, render_500)
    )
\`\`\`

## CORS Configuration

\`\`\`rust
use actix_cors::Cors;

fn configure_cors() -> Cors {
    // Production: explicit whitelist
    Cors::default()
        .allowed_origin("https://app.example.com")
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
        .allowed_headers(vec![
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
        ])
        .max_age(3600)
}

// Development only — never in production:
// Cors::permissive()
\`\`\`

## Authentication Patterns

### Guard-Based Auth
\`\`\`rust
use actix_web::guard;

web::scope("/admin")
    .guard(guard::Header("Authorization", "Bearer admin-token"))
    .route("/dashboard", web::get().to(admin_dashboard))
\`\`\`

### Middleware-Based Auth (preferred for complex auth)
\`\`\`rust
// Use actix-web-httpauth for Bearer/Basic extraction
use actix_web_httpauth::middleware::HttpAuthentication;
use actix_web_httpauth::extractors::bearer::BearerAuth;

async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, (actix_web::Error, ServiceRequest)> {
    match validate_jwt(credentials.token()).await {
        Ok(_claims) => Ok(req),
        Err(e) => Err((AuthError::InvalidToken.into(), req)),
    }
}

web::scope("/api")
    .wrap(HttpAuthentication::bearer(validator))
    .configure(api_routes)
\`\`\`

## Security Hardening Checklist

- Set \`PayloadConfig\` and \`JsonConfig\` limits to prevent oversized payloads
- Use \`NormalizePath\` to prevent path confusion attacks
- Configure CORS with explicit origins — never use \`Cors::permissive()\` in production
- Set security headers via \`DefaultHeaders\` middleware (HSTS, X-Frame-Options, CSP)
- Use \`actix-limitation\` or \`actix-governor\` for rate limiting on auth endpoints
- Enable TLS via \`rustls\` or terminate TLS at reverse proxy (nginx, traefik)
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

### Never Block the Async Runtime
\`\`\`rust
// WRONG — blocks the worker thread, degrades throughput
async fn resize_image(body: web::Bytes) -> impl Responder {
    let resized = image::load_from_memory(&body)  // CPU-heavy, blocks!
        .unwrap()
        .resize(800, 600, image::imageops::Lanczos3);
    HttpResponse::Ok().body(resized.to_bytes())
}

// CORRECT — offload to blocking threadpool
async fn resize_image(body: web::Bytes) -> actix_web::Result<impl Responder> {
    let resized = web::block(move || {
        image::load_from_memory(&body)?
            .resize(800, 600, image::imageops::Lanczos3)
            .to_bytes()
    }).await??;
    Ok(HttpResponse::Ok().body(resized))
}
\`\`\`

### Streaming Responses for Large Data
\`\`\`rust
use actix_web::HttpResponse;
use futures::stream;

async fn download_large_file() -> HttpResponse {
    let byte_stream = stream::iter(
        file_chunks.into_iter().map(Ok::<_, actix_web::Error>)
    );
    HttpResponse::Ok()
        .content_type("application/octet-stream")
        .streaming(byte_stream)
}
\`\`\`

## Database Integration

### Connection Pool Setup (sqlx)
\`\`\`rust
use sqlx::postgres::PgPoolOptions;

let pool = PgPoolOptions::new()
    .max_connections(20)
    .min_connections(5)
    .acquire_timeout(std::time::Duration::from_secs(3))
    .idle_timeout(std::time::Duration::from_secs(300))
    .connect(&database_url)
    .await?;

App::new().app_data(web::Data::new(pool))
\`\`\`

### Diesel (Blocking ORM) — Always Use web::block
\`\`\`rust
async fn list_users(pool: web::Data<DbPool>) -> actix_web::Result<impl Responder> {
    let conn = pool.get().map_err(|e| actix_web::error::ErrorServiceUnavailable(e))?;
    let users = web::block(move || {
        users::table.load::<User>(&mut conn)
    }).await??;
    Ok(HttpResponse::Ok().json(users))
}
\`\`\`

## Deployment Checklist

### Production Configuration
\`\`\`rust
HttpServer::new(move || {
    App::new()
        .wrap(Logger::new("%a %r %s %b %D ms"))
        .wrap(Compress::default())
        .configure(routes::configure)
})
.workers(num_cpus::get())
.keep_alive(Duration::from_secs(75))  // match reverse proxy timeout
.shutdown_timeout(30)                  // graceful shutdown window
.bind("0.0.0.0:8080")?
.run()
.await
\`\`\`

### Health Check Endpoint
\`\`\`rust
async fn health(db: web::Data<Pool<Postgres>>) -> impl Responder {
    match sqlx::query("SELECT 1").fetch_one(db.get_ref()).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"status": "healthy"})),
        Err(_) => HttpResponse::ServiceUnavailable()
            .json(serde_json::json!({"status": "unhealthy"})),
    }
}
\`\`\`

### Graceful Shutdown
\`\`\`rust
let server = HttpServer::new(/* ... */)
    .shutdown_timeout(30)  // wait up to 30s for in-flight requests
    .bind("0.0.0.0:8080")?
    .run();

let handle = server.handle();

// Spawn signal handler
tokio::spawn(async move {
    tokio::signal::ctrl_c().await.unwrap();
    handle.stop(true).await;  // graceful=true
});

server.await
\`\`\`

### Environment-Based Config
- Use \`config\` or \`dotenvy\` crate for environment-based configuration
- Never hardcode ports, DB URLs, or secrets — read from env vars
- Set \`RUST_LOG=info,actix_web=info\` for production logging levels
- Run behind a reverse proxy (nginx, traefik) for TLS termination and load balancing
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

\`\`\`rust
#[cfg(test)]
mod tests {
    use actix_web::{test, web, App, http::StatusCode};
    use super::*;

    #[actix_web::test]
    async fn test_create_user_returns_201() {
        // Arrange
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(mock_db_pool()))
                .configure(routes::configure)
        ).await;

        let req = test::TestRequest::post()
            .uri("/api/v1/users")
            .set_json(serde_json::json!({
                "email": "test@example.com",
                "name": "Test User"
            }))
            .to_request();

        // Act
        let resp = test::call_service(&app, req).await;

        // Assert
        assert_eq!(resp.status(), StatusCode::CREATED);

        let body: UserResponse = test::read_body_json(resp).await;
        assert_eq!(body.email, "test@example.com");
    }

    #[actix_web::test]
    async fn test_get_user_not_found_returns_404() {
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(mock_db_pool()))
                .configure(routes::configure)
        ).await;

        let req = test::TestRequest::get()
            .uri("/api/v1/users/99999")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }
}
\`\`\`

## Unit Testing Handlers Directly

\`\`\`rust
#[actix_web::test]
async fn test_handler_directly() {
    let db = web::Data::new(mock_db_pool());
    let body = web::Json(CreateUserRequest {
        email: "test@example.com".into(),
        name: "Test".into(),
    });

    let resp = create_user(db, body).await.unwrap();
    // Assert on the responder
}
\`\`\`

## Testing with TestServer (Full HTTP Stack)

\`\`\`rust
use actix_test::TestServer;

#[actix_web::test]
async fn test_full_http_stack() {
    let srv = actix_test::start(|| {
        App::new()
            .app_data(web::Data::new(mock_db_pool()))
            .configure(routes::configure)
    });

    // Uses real HTTP client — tests serialization, headers, CORS, etc.
    let resp = srv.get("/api/v1/health").send().await.unwrap();
    assert!(resp.status().is_success());
}
\`\`\`

## Testing Custom Extractors

\`\`\`rust
#[actix_web::test]
async fn test_auth_extractor_with_valid_token() {
    let app = test::init_service(
        App::new().route("/protected", web::get().to(
            |user: AuthenticatedUser| async move {
                HttpResponse::Ok().json(user.user_id)
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/protected")
        .insert_header(("Authorization", "Bearer valid-test-token"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_web::test]
async fn test_auth_extractor_rejects_invalid_token() {
    let app = test::init_service(
        App::new().route("/protected", web::get().to(
            |_user: AuthenticatedUser| async { HttpResponse::Ok().finish() }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/protected")
        .insert_header(("Authorization", "Bearer invalid"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}
\`\`\`

## Testing Middleware

\`\`\`rust
#[actix_web::test]
async fn test_cors_middleware_allows_valid_origin() {
    let app = test::init_service(
        App::new()
            .wrap(configure_cors())
            .route("/api/test", web::get().to(HttpResponse::Ok))
    ).await;

    let req = test::TestRequest::get()
        .uri("/api/test")
        .insert_header(("Origin", "https://app.example.com"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.headers().contains_key("access-control-allow-origin"));
}
\`\`\`

## Test Patterns Checklist
- Mock external dependencies (DB, HTTP clients) via trait objects injected through app_data
- Test all HTTP methods for each resource (GET, POST, PUT, DELETE)
- Test validation errors: missing fields, wrong types, oversized payloads
- Test authentication: valid token, expired token, missing token, malformed token
- Test authorization: user accessing own resource vs. another user's resource
- Test error responses: verify status codes AND JSON error body shape
- Use \`#[actix_web::test]\` (not \`#[tokio::test]\`) for proper Actix runtime
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nE "Cors::permissive" "$CLAUDE_FILE_PATH" | grep -q "." && echo "HOOK_EXIT:0:Warning: Cors::permissive() detected — must NOT be used in production. Use explicit allowed_origin()." || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nE "static\\s+mut\\s+" "$CLAUDE_FILE_PATH" | grep -q "." && echo "HOOK_EXIT:0:Warning: mutable static detected — use web::Data<T> with interior mutability instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nE "std::sync::(Mutex|RwLock)" "$CLAUDE_FILE_PATH" | grep -q "." && echo "HOOK_EXIT:0:Warning: std::sync::Mutex/RwLock detected in Actix handler — use tokio::sync variants to avoid blocking the async runtime" || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
