import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const rocketProfile: Profile = {
  id: 'frameworks/rocket',
  name: 'Rocket',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['rocket'],
  contributions: {
    claudeMd: [
      {
        heading: 'Rocket Conventions',
        order: 20,
        content: `## Rocket Conventions

Type-driven web framework. Request guards for validation, fairings for middleware.

**Detailed rules:** see \`.claude/rules/rocket/\` directory.

**Key rules:**
- Request guards (\`FromRequest\`) for auth and validation — type system enforces correctness
- Fairings for cross-cutting concerns (logging, CORS, timing)
- Responders for consistent response types, catchers for error pages
- Use managed state (\`State<T>\`) for shared resources, never global mutable state`,
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
        ],
      },
    },
    rules: [
      {
        path: 'rocket/architecture.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Rocket architecture, route patterns, state, and error handling',
        content: `# Rocket Architecture

## Route Patterns

### Handler Declaration
Define routes with attribute macros and typed parameters:

\`\`\`rust
#[get("/users/<id>")]
async fn get_user(id: i64, db: &State<DbPool>) -> Result<Json<User>, Status> {
    let user = db.find_user(id).await.map_err(|_| Status::InternalServerError)?;
    user.map(Json).ok_or(Status::NotFound)
}

#[post("/users", data = "<input>")]
async fn create_user(
    input: Json<CreateUserRequest>,
    db: &State<DbPool>,
    auth: AuthenticatedUser,
) -> Result<(Status, Json<User>), ApiError> {
    let user = db.create_user(input.into_inner(), auth.id).await?;
    Ok((Status::Created, Json(user)))
}
\`\`\`

### Path and Query Parameters
- Path segment: \`<id>\` maps to a parameter implementing \`FromParam\`
- Multiple segments: \`<path..>\` maps to \`PathBuf\` or custom \`FromSegments\` type
- Query string: \`?<page>&<per_page>\` with \`FromForm\` — supports optional (\`Option<T>\`) and default values

\`\`\`rust
#[get("/search?<q>&<page>&<per_page>")]
async fn search(
    q: &str,
    page: Option<u32>,
    per_page: Option<u32>,
) -> Json<SearchResults> {
    let page = page.unwrap_or(1);
    let per_page = per_page.unwrap_or(20).min(100);
    // ...
}
\`\`\`

### Route Ranking
When multiple routes could match, use \`rank\` to disambiguate:

\`\`\`rust
#[get("/users/<id>", rank = 1)]
async fn get_user_by_id(id: i64) -> Json<User> { /* ... */ }

#[get("/users/<name>", rank = 2)]
async fn get_user_by_name(name: &str) -> Json<User> { /* ... */ }
\`\`\`

## Application State

### Managed State
Register state at build time, access via \`&State<T>\` guard:

\`\`\`rust
struct AppConfig {
    api_key: String,
    max_retries: u32,
}

#[launch]
fn rocket() -> _ {
    let config = AppConfig {
        api_key: std::env::var("API_KEY").expect("API_KEY required"),
        max_retries: 3,
    };

    rocket::build()
        .manage(config)
        .mount("/api", routes![handler])
}

#[get("/status")]
fn handler(config: &State<AppConfig>) -> String {
    format!("Max retries: {}", config.max_retries)
}
\`\`\`

### Database Pools with rocket_db_pools
\`\`\`rust
use rocket_db_pools::{Database, Connection, sqlx};

#[derive(Database)]
#[database("app_db")]
struct AppDb(sqlx::PgPool);

#[get("/users/<id>")]
async fn get_user(mut db: Connection<AppDb>, id: i64) -> Result<Json<User>, Status> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&mut **db)
        .await
        .map_err(|_| Status::InternalServerError)?
        .map(Json)
        .ok_or(Status::NotFound)
}
\`\`\`

Configure in \`Rocket.toml\`:
\`\`\`toml
[default.databases.app_db]
url = "postgres://user:pass@localhost/mydb"
max_connections = 10
\`\`\`

## Route Organization
- Mount route groups with path prefixes for modularity
- Keep \`routes![]\` macro calls in a central location or per-module function

\`\`\`rust
// src/routes/users.rs
pub fn routes() -> Vec<rocket::Route> {
    routes![list_users, get_user, create_user, update_user, delete_user]
}

// src/main.rs
#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/api/v1/users", routes::users::routes())
        .mount("/api/v1/orders", routes::orders::routes())
        .register("/", catchers![not_found, internal_error])
}
\`\`\`

## Error Handling

### Catchers
Register catchers for common HTTP error codes:

\`\`\`rust
#[catch(404)]
fn not_found(req: &Request) -> Json<ErrorResponse> {
    Json(ErrorResponse {
        code: 404,
        message: format!("Resource not found: {}", req.uri()),
    })
}

#[catch(422)]
fn unprocessable(req: &Request) -> Json<ErrorResponse> {
    Json(ErrorResponse {
        code: 422,
        message: "Invalid request data".into(),
    })
}

#[catch(500)]
fn internal_error() -> Json<ErrorResponse> {
    Json(ErrorResponse {
        code: 500,
        message: "Internal server error".into(),
    })
}
\`\`\`

### Custom Error Types with Responder
\`\`\`rust
use rocket::response::Responder;

#[derive(Debug, Responder)]
pub enum ApiError {
    #[response(status = 400)]
    BadRequest(Json<ErrorResponse>),
    #[response(status = 404)]
    NotFound(Json<ErrorResponse>),
    #[response(status = 409)]
    Conflict(Json<ErrorResponse>),
    #[response(status = 500)]
    Internal(Json<ErrorResponse>),
}

impl From<sqlx::Error> for ApiError {
    fn from(e: sqlx::Error) -> Self {
        tracing::error!("Database error: {e}");
        ApiError::Internal(Json(ErrorResponse {
            code: 500,
            message: "Internal server error".into(),
        }))
    }
}
\`\`\`

## Fairings (Middleware)

### Built-in Fairings
- \`Shield\` — security headers (enabled by default: X-Content-Type-Options, X-Frame-Options, Permissions-Policy)
- Use \`AdHoc\` for simple lifecycle hooks without a dedicated struct

### Custom Fairing Example
\`\`\`rust
use rocket::fairing::{Fairing, Info, Kind};
use rocket::{Request, Response, Data};

pub struct RequestTimer;

#[rocket::async_trait]
impl Fairing for RequestTimer {
    fn info(&self) -> Info {
        Info {
            name: "Request Timer",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, req: &mut Request<'_>, _data: &mut Data<'_>) {
        req.local_cache(|| std::time::Instant::now());
    }

    async fn on_response<'r>(&self, req: &'r Request<'_>, res: &mut Response<'r>) {
        let start = req.local_cache(|| std::time::Instant::now());
        let duration = start.elapsed();
        res.set_raw_header("X-Response-Time", format!("{duration:.2?}"));
    }
}
\`\`\`

### AdHoc Fairings
\`\`\`rust
use rocket::fairing::AdHoc;

rocket::build()
    .attach(AdHoc::on_ignite("DB Migrations", |rocket| async {
        // Run migrations at startup
        let db = AppDb::fetch(&rocket).expect("database");
        sqlx::migrate!().run(&**db).await.expect("migrations");
        rocket
    }))
    .attach(AdHoc::on_liftoff("Startup Log", |_| Box::pin(async {
        tracing::info!("Application launched successfully");
    })))
    .attach(AdHoc::config::<AppConfig>())
\`\`\`
`,
      },
      {
        path: 'rocket/request-guards.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Rocket request guards, data guards, and validation patterns',
        content: `# Rocket Request Guards & Data Validation

## Request Guards
Request guards are Rocket's primary mechanism for authentication, authorization, and request validation.
A guard runs before the handler — failure short-circuits with an error or forward.

### Implementing FromRequest
\`\`\`rust
use rocket::request::{self, FromRequest, Request, Outcome};
use rocket::http::Status;

pub struct AuthenticatedUser {
    pub id: i64,
    pub role: UserRole,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthenticatedUser {
    type Error = AuthError;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let token = req.headers().get_one("Authorization")
            .and_then(|h| h.strip_prefix("Bearer "));

        match token {
            Some(token) => match validate_jwt(token).await {
                Ok(claims) => Outcome::Success(AuthenticatedUser {
                    id: claims.sub,
                    role: claims.role,
                }),
                Err(e) => Outcome::Error((Status::Unauthorized, AuthError::InvalidToken(e))),
            },
            None => Outcome::Error((Status::Unauthorized, AuthError::MissingToken)),
        }
    }
}
\`\`\`

### Chaining Multiple Guards
Layer guards in a handler signature for multi-step validation:

\`\`\`rust
#[delete("/admin/users/<id>")]
async fn delete_user(
    auth: AuthenticatedUser,   // 1st: must be authenticated
    admin: AdminGuard,         // 2nd: must be admin role
    id: i64,                   // 3rd: path parameter
    db: &State<DbPool>,       // state access
) -> Result<Status, ApiError> {
    db.delete_user(id).await?;
    Ok(Status::NoContent)
}
\`\`\`

### Outcome Variants
- \`Outcome::Success(value)\` — guard succeeded, handler receives the value
- \`Outcome::Error((status, error))\` — guard failed, Rocket calls the matching catcher
- \`Outcome::Forward(status)\` — guard cannot determine, try next matching route

## Data Guards

### JSON Bodies
\`\`\`rust
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
}

#[post("/users", data = "<input>")]
async fn create_user(input: Json<CreateUserRequest>) -> (Status, Json<User>) {
    // input.into_inner() extracts the deserialized struct
    // ...
}
\`\`\`

### Form Data with Validation
\`\`\`rust
use rocket::form::{FromForm, Strict};

#[derive(Debug, FromForm)]
pub struct LoginForm<'r> {
    #[field(validate = len(3..=64))]
    username: &'r str,
    #[field(validate = len(8..))]
    password: &'r str,
    #[field(default = false)]
    remember_me: bool,
}

#[post("/login", data = "<form>")]
async fn login(form: Form<LoginForm<'_>>) -> Result<Json<Token>, Status> {
    // Form validation happens automatically via #[field(validate)]
    // ...
}

// Use Strict<Form<T>> to reject extra fields
#[post("/strict-login", data = "<form>")]
async fn strict_login(form: Strict<Form<LoginForm<'_>>>) -> Result<Json<Token>, Status> {
    // ...
}
\`\`\`

### Multipart File Uploads
\`\`\`rust
use rocket::fs::TempFile;
use rocket::form::Form;

#[derive(FromForm)]
pub struct Upload<'r> {
    #[field(validate = len(..5_000_000))]  // 5MB limit
    file: TempFile<'r>,
    description: String,
}

#[post("/upload", data = "<upload>")]
async fn upload_file(mut upload: Form<Upload<'_>>) -> Result<String, std::io::Error> {
    let path = format!("uploads/{}", upload.file.name().unwrap_or("unknown"));
    upload.file.persist_to(&path).await?;
    Ok(format!("Uploaded to {path}"))
}
\`\`\`

### Custom FromParam
\`\`\`rust
use rocket::request::FromParam;

pub struct UserId(i64);

impl<'r> FromParam<'r> for UserId {
    type Error = &'r str;

    fn from_param(param: &'r str) -> Result<Self, Self::Error> {
        param.parse::<i64>()
            .map(UserId)
            .map_err(|_| param)
    }
}

#[get("/users/<id>")]
async fn get_user(id: UserId) -> Json<User> {
    // id.0 is the validated i64
    // ...
}
\`\`\`

## Configuration

### Rocket.toml Profiles
\`\`\`toml
[default]
address = "127.0.0.1"
port = 8000
limits = { form = "64 kB", json = "1 MiB", data-form = "10 MiB" }

[debug]
log_level = "debug"

[release]
address = "0.0.0.0"
port = 8080
log_level = "normal"
secret_key = "generate-with-openssl-rand-base64-32"

[default.databases.app_db]
url = "postgres://user:pass@localhost/mydb"
\`\`\`

### Environment Variable Overrides
- \`ROCKET_PORT=9000\` overrides the port
- \`ROCKET_ADDRESS=0.0.0.0\` overrides the bind address
- \`ROCKET_LOG_LEVEL=off\` disables logging
- \`ROCKET_SECRET_KEY=...\` sets the secret key for private cookies
- \`ROCKET_PROFILE=release\` selects the configuration profile

### Custom Configuration Structs
\`\`\`rust
use rocket::serde::Deserialize;
use rocket::fairing::AdHoc;

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct AppConfig {
    external_api_url: String,
    max_upload_size: u64,
    feature_flags: FeatureFlags,
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .attach(AdHoc::config::<AppConfig>())
}
\`\`\`
`,
      },
      {
        path: 'rocket/deployment.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Rocket production deployment, streaming, and performance patterns',
        content: `# Rocket Deployment & Performance

## Production Deployment

### Reverse Proxy
Rocket does not include built-in DDoS mitigation. In production, always deploy behind a reverse proxy:
- Use nginx, HAProxy, or Traefik for TLS termination, rate limiting, and load balancing
- Set \`address = "0.0.0.0"\` and the desired port in the \`[release]\` profile
- Always compile with \`--release\` for production — debug builds are significantly slower

### Docker Deployment
\`\`\`dockerfile
# Build stage
FROM rust:1.80 AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/usr/local/cargo/registry \\
    --mount=type=cache,target=/app/target \\
    cargo build --release && cp target/release/myapp /myapp

# Runtime stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /myapp /usr/local/bin/myapp
COPY Rocket.toml /etc/myapp/Rocket.toml
ENV ROCKET_PROFILE=release
ENV ROCKET_ADDRESS=0.0.0.0
EXPOSE 8080
CMD ["myapp"]
\`\`\`

### Configuration Checklist
- Set \`secret_key\` in release profile (required for private cookies) — generate with \`openssl rand -base64 32\`
- Set \`log_level\` to \`"normal"\` or \`"critical"\` in production
- Configure \`limits\` for request body sizes to prevent abuse
- Set database pool \`max_connections\` appropriately
- Use environment variables for secrets — never commit them in Rocket.toml

## Streaming Responses

### Server-Sent Events (SSE)
\`\`\`rust
use rocket::response::stream::{EventStream, Event};
use rocket::tokio::time::{self, Duration};

#[get("/events")]
fn events() -> EventStream![] {
    EventStream! {
        let mut interval = time::interval(Duration::from_secs(1));
        loop {
            let now = time::Instant::now();
            yield Event::data(format!("ping at {now:?}"));
            interval.tick().await;
        }
    }
}
\`\`\`

### WebSockets (rocket_ws)
\`\`\`rust
use rocket_ws::{WebSocket, Stream, Message};

#[get("/ws/chat")]
fn chat(ws: WebSocket) -> Stream!['static] {
    Stream! { ws =>
        for await message in ws {
            match message {
                Ok(Message::Text(text)) => {
                    yield Message::Text(format!("Echo: {text}"));
                }
                Ok(Message::Close(_)) => break,
                _ => {}
            }
        }
    }
}
\`\`\`

## Graceful Shutdown
Rocket v0.5 supports configurable graceful shutdown:
- Default behavior: stop accepting new connections and wait for in-flight requests
- Configure grace period in \`Rocket.toml\` or via the \`Shutdown\` config
- Use \`on_shutdown\` fairing to clean up resources (close DB connections, flush logs)
- Use \`Shutdown\` request guard to trigger programmatic shutdown

\`\`\`rust
use rocket::Shutdown;

#[get("/admin/shutdown")]
fn shutdown(shutdown: Shutdown, _admin: AdminGuard) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}
\`\`\`

## Performance Considerations
- Use \`&str\` over \`String\` in form fields and query parameters (zero-copy borrowing)
- Use \`rocket_db_pools\` for connection pooling — avoid creating connections per request
- Use streaming responses for large payloads instead of buffering into memory
- Set appropriate \`limits\` in Rocket.toml to prevent oversized request bodies
- Use \`local_cache\` on Request for per-request caching of computed values
- Compile with \`--release\` and LTO (\`[profile.release] lto = true\`) for production binaries
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Rocket Review

**Available skills:** rocket-handler-generator, rocket-guard-generator

### Route & Handler Quality
- Check that routes use attribute macros (\`#[get]\`, \`#[post]\`, etc.) with proper path definitions and \`data\` attribute for body
- Verify handlers are thin — business logic lives in service modules, not in route handlers
- Check that handler return types implement \`Responder\` — prefer \`Result<T, ApiError>\` over bare types
- Verify \`rank\` is used to disambiguate overlapping routes

### Request Guards & Validation
- Verify request guards are used for authentication/authorization — not fairing-based auth on individual routes
- Check that \`FromRequest\` implementations return appropriate \`Outcome\` variants (Success, Error, Forward)
- Verify form structs use \`#[field(validate = ...)]\` for input validation, not manual checks in handlers
- Check \`Strict<Form<T>>\` is used where extra fields should be rejected

### State & Data
- Check that shared state is registered with \`.manage()\` and accessed via \`&State<T>\`
- Verify \`Sentinel\` types (\`State\`, \`Connection\`) will catch missing state at launch time
- Check for proper use of \`rocket_db_pools\` with connection pooling, not ad-hoc connections
- Verify serde \`Serialize\`/\`Deserialize\` derives on all DTO structs with \`#[serde(crate = "rocket::serde")]\`

### Error Handling
- Verify catchers are registered for common HTTP error codes (400, 404, 422, 500)
- Check for custom error types using \`#[derive(Responder)]\` with \`#[response(status)]\`
- Verify error responses return structured JSON (not plain text) with error code and message
- Check that database/external errors are mapped to appropriate HTTP status codes with logging

### Fairings & Security
- Verify fairings are used only for globally applicable concerns (CORS, logging, metrics), not per-route auth
- Check that \`Shield\` is not accidentally removed — it provides default security headers
- Verify \`Rocket.toml\` has a proper \`[release]\` profile with \`secret_key\` for private cookies
- Check that \`limits\` are configured to prevent oversized request bodies
- Verify sensitive config uses environment variables, not hardcoded values in Rocket.toml`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Rocket Testing

**Available skills:** rocket-handler-generator, rocket-guard-generator

### Integration Test Setup
- Use \`rocket::local::blocking::Client\` for synchronous tests (simpler, preferred when concurrency is not needed)
- Use \`rocket::local::asynchronous::Client\` with \`#[rocket::async_test]\` when handlers require concurrency
- Create test client with \`Client::tracked(rocket()).await\` — \`tracked\` propagates cookies across requests

\`\`\`rust
use rocket::local::blocking::Client;
use rocket::http::{Status, ContentType};

#[test]
fn test_get_user() {
    let client = Client::tracked(rocket()).expect("valid rocket");
    let response = client.get("/api/users/1").dispatch();
    assert_eq!(response.status(), Status::Ok);
    let user: User = response.into_json().expect("valid JSON");
    assert_eq!(user.id, 1);
}
\`\`\`

### Route Testing Patterns
- Test routes with \`client.get("/path").dispatch()\`, \`client.post("/path").json(&body).dispatch()\`
- Verify response status codes: \`assert_eq!(response.status(), Status::Ok)\`
- Deserialize JSON responses with \`response.into_json::<T>()\`
- Test form submissions with \`.header(ContentType::Form).body("key=value")\`
- Test file uploads with multipart form data using \`.header(ContentType::FormData)\`

### Guard Testing
- Test request guards by sending requests with and without valid auth headers
- Test that missing/invalid tokens return the correct error status (401, 403)
- Test \`Forward\` behavior by verifying the next ranked route is tried

### Error & Catcher Testing
- Test catchers by triggering error conditions (request non-existent resources for 404, send invalid JSON for 422)
- Verify catcher responses return structured JSON error bodies
- Test custom \`ApiError\` variants produce the correct status codes and messages

### State & Fairing Testing
- Mock services by injecting test implementations via \`.manage()\`
- Test fairings by verifying their side effects (response headers, logging)
- Use separate Rocket instances per test to avoid shared state contamination

### Database Testing
- Use a dedicated test database or in-memory SQLite for database tests
- Wrap database tests in transactions and roll back after each test
- Test query failures by injecting invalid state or using mock pools`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Rocket Security Review

**Available skills:** rocket-handler-generator, rocket-guard-generator

### Authentication & Authorization
- Verify all protected routes use request guards (\`FromRequest\`) for auth — not manual header parsing
- Check JWT/token validation is constant-time to prevent timing attacks
- Verify \`secret_key\` is set in the \`[release]\` Rocket.toml profile for private cookies
- Check that \`Outcome::Error\` returns generic messages — do not leak auth internals

### Input Validation
- Verify all form fields use \`#[field(validate = ...)]\` or custom validation — never trust client data
- Check \`limits\` in Rocket.toml are set to prevent oversized payloads (form, json, data-form)
- Verify file upload handlers validate file type, size, and destination path
- Check path parameters cannot cause directory traversal (Rocket's \`FromParam\` for \`PathBuf\` is safe by default)

### Shield & Security Headers
- Verify \`Shield\` fairing is attached (default) — do not accidentally remove it
- Check if custom CORS fairing allows only specific origins, not wildcard \`*\` in production
- Verify Content-Security-Policy headers if serving HTML responses

### Database & State
- Verify database queries use parameterized statements (sqlx \`$1\` syntax, Diesel query builder)
- Check that \`State<T>\` types do not expose mutable internals without proper synchronization
- Verify \`secret_key\` and database credentials are never logged or exposed in error responses`,
      },
    ],
    skills: [
      {
        name: 'rocket-handler-generator',
        description: 'Generate Rocket route handlers with guards, responders, catchers, and tests',
        content: `# Rocket Handler Generator

Generate a complete Rocket handler following these steps:

## 1. Define Request/Response Structs
- Derive \`Serialize\`/\`Deserialize\` with \`#[serde(crate = "rocket::serde")]\`
- Derive \`FromForm\` for form-based input
- Add \`#[field(validate = ...)]\` for input validation

## 2. Define the Handler
- Use the correct attribute macro: \`#[get]\`, \`#[post]\`, \`#[put]\`, \`#[delete]\`
- Add \`data = "<param>"\` attribute for body-consuming routes
- Use request guards for auth: \`AuthenticatedUser\`
- Use \`&State<T>\` for shared state and \`Connection<Db>\` for database
- Return \`Result<T, ApiError>\` where both implement \`Responder\`

## 3. Define Error Type
- Use \`#[derive(Responder)]\` with \`#[response(status = NNN)]\` per variant
- Implement \`From<ExternalError>\` for seamless \`?\` conversion
- Return structured JSON: \`{ "code": 404, "message": "Not found" }\`

## 4. Register Routes and Catchers
- Add to \`routes![]\` macro
- Mount with path prefix: \`rocket.mount("/api/v1/resource", routes![...])\`
- Register catchers: \`rocket.register("/", catchers![...])\`

## 5. Write Integration Test
- Use \`rocket::local::blocking::Client::tracked(rocket())\`
- Test happy path with valid request and assert status + JSON body
- Test error cases: missing auth, invalid input, not found
- Test guard rejection with missing/invalid headers

### Template
\`\`\`rust
use rocket::serde::{json::Json, Deserialize, Serialize};
use rocket::http::Status;
use rocket::State;

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Item {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct CreateItem {
    pub name: String,
}

#[post("/items", data = "<input>")]
pub async fn create_item(
    input: Json<CreateItem>,
    db: &State<DbPool>,
    _auth: AuthenticatedUser,
) -> Result<(Status, Json<Item>), ApiError> {
    let item = db.insert_item(input.into_inner()).await?;
    Ok((Status::Created, Json(item)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rocket::local::blocking::Client;
    use rocket::http::{Status, ContentType};

    #[test]
    fn test_create_item() {
        let client = Client::tracked(test_rocket()).expect("valid rocket");
        let response = client.post("/items")
            .header(ContentType::JSON)
            .header(rocket::http::Header::new("Authorization", "Bearer test-token"))
            .json(&CreateItem { name: "Test".into() })
            .dispatch();
        assert_eq!(response.status(), Status::Created);
    }
}
\`\`\`
`,
      },
      {
        name: 'rocket-guard-generator',
        description: 'Generate Rocket request guards for authentication, authorization, and custom extraction',
        content: `# Rocket Request Guard Generator

Generate a custom request guard:

## 1. Define the Guard Struct
\`\`\`rust
pub struct AuthenticatedUser {
    pub id: i64,
    pub email: String,
    pub role: UserRole,
}
\`\`\`

## 2. Implement FromRequest
\`\`\`rust
use rocket::request::{self, FromRequest, Request, Outcome};
use rocket::http::Status;

#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidToken(String),
    Expired,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthenticatedUser {
    type Error = AuthError;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        // 1. Extract token from Authorization header
        let token = match req.headers().get_one("Authorization") {
            Some(h) => match h.strip_prefix("Bearer ") {
                Some(t) => t,
                None => return Outcome::Error((Status::Unauthorized, AuthError::MissingToken)),
            },
            None => return Outcome::Error((Status::Unauthorized, AuthError::MissingToken)),
        };

        // 2. Validate token (use State for the JWT secret)
        let jwt_secret = req.rocket().state::<JwtSecret>()
            .expect("JwtSecret must be managed");
        match validate_jwt(token, &jwt_secret.0) {
            Ok(claims) => Outcome::Success(AuthenticatedUser {
                id: claims.sub,
                email: claims.email,
                role: claims.role,
            }),
            Err(e) => Outcome::Error((Status::Unauthorized, AuthError::InvalidToken(e.to_string()))),
        }
    }
}
\`\`\`

## 3. Create Role-Based Guards (composing guards)
\`\`\`rust
pub struct AdminGuard(pub AuthenticatedUser);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AdminGuard {
    type Error = AuthError;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let user = req.guard::<AuthenticatedUser>().await;
        match user {
            Outcome::Success(u) if u.role == UserRole::Admin => {
                Outcome::Success(AdminGuard(u))
            }
            Outcome::Success(_) => {
                Outcome::Error((Status::Forbidden, AuthError::InsufficientRole))
            }
            Outcome::Error(e) => Outcome::Error(e),
            Outcome::Forward(s) => Outcome::Forward(s),
        }
    }
}
\`\`\`

## 4. Use in Handlers
\`\`\`rust
#[get("/profile")]
async fn profile(user: AuthenticatedUser) -> Json<UserProfile> { /* ... */ }

#[delete("/admin/users/<id>")]
async fn delete_user(admin: AdminGuard, id: i64) -> Status { /* ... */ }
\`\`\`
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nE "#\\[catch\\(" "$CLAUDE_FILE_PATH" | grep -q "." && ! grep -qE "register\\(" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:0:Warning: #[catch] found but no register() call — catchers must be registered with rocket.register()" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "Rocket\\.toml$" && grep -qE "secret_key" "$CLAUDE_FILE_PATH" && grep -vqE "^\\s*#" "$CLAUDE_FILE_PATH" | grep -qE "secret_key\\s*=\\s*\"[^\"]{10,}\"" && echo "HOOK_EXIT:0:Warning: secret_key found in Rocket.toml — prefer ROCKET_SECRET_KEY environment variable for production" || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
