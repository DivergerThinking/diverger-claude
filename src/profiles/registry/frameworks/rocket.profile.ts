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

- Use attribute macros for route declarations: #[get], #[post], #[put], #[delete]
- Define handlers with typed parameters that implement FromRequest, FromParam, or FromForm
- Use request guards for authentication, authorization, and input validation
- Manage shared state with rocket::State<T> - registered via rocket.manage()
- Use fairings for middleware-like lifecycle hooks (on_request, on_response, on_ignite)
- Handle JSON with rocket::serde::json::Json<T> and derive Serialize/Deserialize
- Handle forms with #[derive(FromForm)] and Form<T> or Strict<Form<T>>
- Use catchers for custom error responses: #[catch(404)], #[catch(500)]
- Use #[launch] or #[rocket::main] for the application entry point
- Configure via Rocket.toml or environment variables (ROCKET_ prefix)
- Use responders to control response status, headers, and body
- Organize routes with mount points: rocket.mount("/api", routes![...])`,
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
        ],
      },
    },
    rules: [
      {
        path: 'rocket/architecture.md',
        governance: 'mandatory',
        description: 'Rocket architecture and route patterns',
        content: `# Rocket Architecture

## Route Patterns
- Use attribute macros for route declarations: \`#[get("/users/<id>")]\`
- Handler parameters are automatically extracted from the request
- Path parameters: \`<id>\` maps to function parameter implementing FromParam
- Query parameters: use \`<param>\` in query string or FromForm on a struct
- Return types must implement Responder: String, Json<T>, Status, (Status, Json<T>), etc.
- Keep handlers thin - delegate business logic to service modules

## Application State
- Register state with \`rocket::build().manage(my_state)\`
- Access via \`State<T>\` guard in handler signatures: \`fn handler(state: &State<MyState>)\`
- State must be Send + Sync - use Arc<Mutex<T>> or Arc<RwLock<T>> for mutable state
- Use connection pools (rocket_db_pools) for database access

## Route Organization
- Mount route groups with \`rocket.mount("/api/users", routes![list, get, create])\`
- Use mount prefixes to organize by resource or API version
- Keep routes! macro invocations in a central location or per-module
- Use route ranking to resolve ambiguous routes: \`#[get("/path", rank = 2)]\`

## Error Handling
- Register catchers with \`rocket.register("/", catchers![not_found, internal_error])\`
- Define catchers with \`#[catch(404)] fn not_found() -> Json<ErrorResponse>\`
- Use Result<T, E> in handlers where E implements Responder
- Create custom error types that implement Responder for structured error responses
- Use Status type for simple HTTP status code responses

## Fairings (Middleware)
- Implement the Fairing trait for lifecycle hooks
- on_ignite: run setup logic (DB migrations, config validation)
- on_request: modify or inspect incoming requests (logging, auth)
- on_response: modify outgoing responses (CORS headers, compression)
- Use AdHoc fairing for simple one-off fairings without a full struct
`,
      },
      {
        path: 'rocket/request-guards.md',
        governance: 'recommended',
        description: 'Rocket request guards and data validation',
        content: `# Rocket Request Guards

## Request Guards
- Implement FromRequest trait for custom guards (auth tokens, API keys)
- Guards run before the handler - failure short-circuits with an error response
- Use guards for authentication: extract and validate JWT/session from headers
- Use guards for authorization: check user roles and permissions
- Chain multiple guards in a handler signature for layered validation
- Return Outcome::Success, Outcome::Error, or Outcome::Forward

## Data Guards
- Use Json<T> for JSON request bodies with automatic deserialization
- Use Form<T> with #[derive(FromForm)] for form data
- Use Strict<Form<T>> to reject unexpected form fields
- Implement FromData for custom body parsing (file uploads, multipart)
- Validate data in FromForm/FromData implementations, not in handlers

## Parameter Guards
- Implement FromParam for custom path segment parsing
- Use Option<T> for optional path parameters
- Use Result<T, E> for parameters that may fail to parse
- Implement FromSegments for catching multiple path segments

## Configuration
- Use Rocket.toml for environment-specific configuration (debug, release)
- Override with environment variables: ROCKET_PORT, ROCKET_ADDRESS
- Access custom config with rocket::Config and custom Deserialize structs
- Use figment for advanced configuration management
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Rocket Review
- Check that routes use attribute macros (#[get], #[post]) with proper path definitions
- Verify request guards are used for authentication and authorization
- Check that shared state is registered with manage() and accessed via State<T>
- Verify catchers are registered for common HTTP error codes (404, 422, 500)
- Check for proper use of Json<T> and FromForm derives on data structs
- Verify fairings are used for cross-cutting concerns (CORS, logging)
- Check that handlers delegate business logic to service modules
- Verify Rocket.toml configuration for different environments
- Check for proper error handling with Result and custom Responder types
- Verify serde Serialize/Deserialize derives on all data transfer structs`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Rocket Testing
- Use rocket::local::asynchronous::Client for integration tests
- Create test client with Client::tracked(rocket()).await
- Test routes with client.get("/path").dispatch().await
- Verify response status codes and JSON bodies
- Test request guards by sending requests with and without valid auth headers
- Test form submissions with ContentType::Form and body data
- Test catchers by triggering error conditions (404, 500)
- Test fairings by verifying response headers and side effects
- Mock services by injecting test implementations via manage()
- Use #[rocket::async_test] or tokio::test for async test functions`,
      },
    ],
  },
};
