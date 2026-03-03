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
- Define routes with attribute macros: \`#[get]\`, \`#[post]\`, \`#[put]\`, \`#[delete]\`
- Use \`data = "<param>"\` attribute for body-consuming routes
- Path segment: \`<id>\` maps to \`FromParam\`; multiple: \`<path..>\` maps to \`PathBuf\`
- Query string: \`?<page>&<per_page>\` with \`FromForm\` — supports \`Option<T>\` and defaults
- Use \`rank\` to disambiguate when multiple routes could match
- Return \`Result<T, ApiError>\` where both implement \`Responder\`

## Application State
- Register state at build time with \`.manage(T)\`, access via \`&State<T>\` guard
- Use \`rocket_db_pools\` with \`#[derive(Database)]\` for connection pooling
- Configure database pools in \`Rocket.toml\` under \`[default.databases.<name>]\`
- \`Sentinel\` types (\`State\`, \`Connection\`) catch missing state at launch time

## Route Organization
- Mount route groups with path prefixes: \`.mount("/api/v1/users", routes::users::routes())\`
- Keep \`routes![]\` macro calls in a central location or per-module function
- Register catchers: \`.register("/", catchers![not_found, internal_error])\`

## Error Handling
- Register catchers for common HTTP codes (400, 404, 422, 500) using \`#[catch(N)]\`
- Use \`#[derive(Responder)]\` with \`#[response(status = N)]\` for custom error types
- Implement \`From<ExternalError>\` for seamless \`?\` conversion to \`ApiError\`
- Return structured JSON error bodies: \`{ "code": 404, "message": "..." }\`
- Log internal errors before mapping to generic HTTP responses

## Fairings (Middleware)
- \`Shield\` — security headers (enabled by default) — do not accidentally remove it
- Use \`AdHoc\` fairings for simple lifecycle hooks (migrations, config loading, startup logging)
- Custom fairings: implement \`Fairing\` trait with \`on_request\`/\`on_response\` for cross-cutting concerns
- Use \`local_cache\` on Request for per-request caching of computed values (e.g., request timing)
- Fairings are for globally applicable concerns — use request guards for per-route auth
`,
      },
      {
        path: 'rocket/request-guards.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Rocket request guards, data guards, and validation patterns',
        content: `# Rocket Request Guards & Data Validation

## Request Guards
- Guards are the primary mechanism for auth, authorization, and request validation
- Implement \`FromRequest\` trait — guard runs before the handler
- \`Outcome::Success(value)\` — guard succeeded, handler receives the value
- \`Outcome::Error((status, error))\` — guard failed, Rocket calls the matching catcher
- \`Outcome::Forward(status)\` — guard cannot determine, try next matching route
- Chain multiple guards in handler signature for multi-step validation (auth → role → params)
- Return generic error messages from guards — do not leak auth internals

## Data Guards
- \`Json<T>\` — JSON request body (T must derive \`Deserialize\` with \`#[serde(crate = "rocket::serde")]\`)
- \`Form<T>\` — URL-encoded form data; use \`#[field(validate = ...)]\` for input validation
- \`Strict<Form<T>>\` — rejects extra fields (use where unexpected data should be rejected)
- \`TempFile\` — multipart file uploads with \`#[field(validate = len(..SIZE))]\` for size limits
- Use \`input.into_inner()\` to extract the deserialized struct from \`Json<T>\`

## Custom FromParam
- Implement \`FromParam\` for type-safe path parameter parsing (e.g., validated \`UserId(i64)\`)
- Rocket's built-in \`FromParam\` for \`PathBuf\` is safe against directory traversal by default

## Configuration
- Define profiles in \`Rocket.toml\`: \`[default]\`, \`[debug]\`, \`[release]\`
- Set \`limits\` for request body sizes: \`{ form = "64 kB", json = "1 MiB", data-form = "10 MiB" }\`
- Environment overrides: \`ROCKET_PORT\`, \`ROCKET_ADDRESS\`, \`ROCKET_LOG_LEVEL\`, \`ROCKET_SECRET_KEY\`, \`ROCKET_PROFILE\`
- Use \`AdHoc::config::<T>()\` for custom configuration structs deserialized from Rocket.toml
- Set \`secret_key\` in \`[release]\` profile (required for private cookies) — prefer \`ROCKET_SECRET_KEY\` env var
- Use environment variables for secrets — never commit them in Rocket.toml
`,
      },
      {
        path: 'rocket/deployment.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Rocket production deployment, streaming, and performance patterns',
        content: `# Rocket Deployment & Performance

## Production Deployment
- Always deploy behind a reverse proxy (nginx, HAProxy, Traefik) for TLS termination, rate limiting, and load balancing
- Set \`address = "0.0.0.0"\` and the desired port in the \`[release]\` profile
- Always compile with \`--release\` for production — debug builds are significantly slower
- Use multi-stage Docker builds: builder stage with Rust toolchain, runtime stage with minimal base

## Configuration Checklist
- Set \`secret_key\` in release profile — generate with \`openssl rand -base64 32\`
- Set \`log_level\` to \`"normal"\` or \`"critical"\` in production
- Configure \`limits\` for request body sizes to prevent abuse
- Set database pool \`max_connections\` appropriately
- Use environment variables for secrets — never commit them in Rocket.toml

## Streaming Responses
- Use \`EventStream!\` for Server-Sent Events (SSE) with async generators
- Use \`rocket_ws\` with \`Stream!\` for WebSocket connections
- Use streaming responses for large payloads instead of buffering into memory

## Graceful Shutdown
- Rocket v0.5 stops accepting new connections and waits for in-flight requests
- Configure grace period in \`Rocket.toml\` or via the \`Shutdown\` config
- Use \`on_shutdown\` fairing to clean up resources (close DB connections, flush logs)
- Use \`Shutdown\` request guard to trigger programmatic shutdown

## Performance Considerations
- Use \`&str\` over \`String\` in form fields and query parameters (zero-copy borrowing)
- Use \`rocket_db_pools\` for connection pooling — avoid creating connections per request
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
            statusMessage: 'Checking for unregistered Rocket catchers',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "#\\[catch\\(" "$FILE_PATH" | grep -q "." && ! grep -qE "register\\(" "$FILE_PATH" && { echo "Warning: #[catch] found but no register() call — catchers must be registered with rocket.register()" >&2; exit 2; } || exit 0',
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
            statusMessage: 'Checking for secret_key in Rocket.toml',
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "Rocket\\.toml$" && grep -qE "secret_key" "$FILE_PATH" && grep -vqE "^\\s*#" "$FILE_PATH" | grep -qE "secret_key\\s*=\\s*\"[^\"]{10,}\"" && { echo "Warning: secret_key found in Rocket.toml — prefer ROCKET_SECRET_KEY environment variable for production" >&2; exit 2; } || exit 0',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
