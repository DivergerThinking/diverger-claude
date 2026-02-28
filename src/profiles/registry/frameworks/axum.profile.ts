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

- Built on top of Tokio and Tower - leverage the Tower middleware ecosystem
- Use Router for composable route definitions with method routing (get, post, put, delete)
- Handlers are async functions: async fn(extract1, extract2) -> impl IntoResponse
- Use extractors (Json, Path, Query, State) for typed request data
- Share application state with State<AppState> extractor and Router::with_state()
- Use Tower layers for middleware: ServiceBuilder, tower_http crate
- Implement IntoResponse for custom response types and error handling
- Use axum::extract::Extension sparingly - prefer State<T> for typed state
- Nest routers with Router::nest() for modular route organization
- Use #[tokio::main] for the entry point, bind with tokio::net::TcpListener
- Use serde for JSON serialization/deserialization with derive macros
- Prefer tower_http middleware: TraceLayer, CorsLayer, CompressionLayer`,
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
        path: 'axum/architecture.md',
        governance: 'mandatory',
        description: 'Axum architecture and handler patterns',
        content: `# Axum Architecture

## Handler Patterns
- Handlers are async functions with extractors as parameters: \`async fn handler(State(state): State<AppState>, Json(body): Json<CreateItem>) -> impl IntoResponse\`
- The last extractor can consume the request body (Json, Form, Bytes)
- Non-body extractors (Path, Query, State, headers) can appear in any order
- Return types must implement IntoResponse: StatusCode, Json<T>, (StatusCode, Json<T>), Response, etc.
- Keep handlers thin - delegate business logic to service modules

## Application State
- Define state as a struct, wrap in Router::with_state()
- Access via State<AppState> extractor in handler signatures
- State must implement Clone - use Arc<T> for expensive-to-clone fields (DB pools, caches)
- Use sub-states with FromRef derive for granular state access

## Route Organization
- Use Router::new().route("/path", get(handler)) for route definitions
- Nest routers with Router::nest("/api", api_router) for modular organization
- Use Router::merge() to combine routers from different modules
- Apply middleware per-router with Router::layer()

## Error Handling
- Implement IntoResponse for custom error types to control HTTP responses
- Use Result<T, AppError> as handler return type for fallible operations
- Map internal errors to appropriate HTTP status codes in the IntoResponse impl
- Use thiserror for defining error enums with automatic From implementations
- Return structured JSON error responses with error code and message

## Extractors
- Built-in: Json<T>, Path<T>, Query<T>, State<T>, HeaderMap, Extension<T>
- Implement FromRequestParts for custom extractors that don't need the body
- Implement FromRequest for custom extractors that consume the body
- Use rejection types to customize extraction error responses
`,
      },
      {
        path: 'axum/middleware.md',
        governance: 'recommended',
        description: 'Axum middleware and Tower layer patterns',
        content: `# Axum Middleware

## Tower Layer System
- Axum uses Tower's Layer and Service traits for middleware
- Apply layers with Router::layer() or ServiceBuilder
- Use tower_http crate for common HTTP middleware
- Layers wrap services: outermost layer runs first on request, last on response

## Common Middleware
- TraceLayer from tower_http for structured logging and tracing
- CorsLayer for CORS configuration with specific origins
- CompressionLayer for response compression (gzip, br)
- TimeoutLayer for request timeout handling
- RateLimitLayer for rate limiting

## Custom Middleware
- Use axum::middleware::from_fn for simple middleware as async functions
- Middleware function signature: \`async fn(request: Request, next: Next) -> Response\`
- Access state in middleware with axum::middleware::from_fn_with_state
- For complex middleware, implement Tower Service and Layer traits directly

## Middleware Organization
- Apply global middleware at the top-level Router
- Use per-route or per-scope middleware with nested routers
- Order: tracing -> compression -> CORS -> auth -> routes
- Use ServiceBuilder to compose multiple layers in order
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Axum Review
- Check that handlers use extractors for typed request data, not manual parsing
- Verify application state uses State<T> extractor with Router::with_state()
- Check that body-consuming extractors (Json, Form) are the last parameter
- Verify IntoResponse implementations for custom error types
- Check for proper use of Tower layers and middleware ordering
- Verify serde derive macros on all request/response structs
- Check that Arc is used for expensive-to-clone state fields
- Verify route organization with nest() and merge() for modularity
- Check for proper tracing/logging middleware configuration
- Verify CORS and security middleware are properly configured`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Axum Testing
- Use axum::test helpers or tower::ServiceExt for testing
- Build test app with Router and call oneshot(request) for integration tests
- Construct requests with Request::builder() from http crate
- Test handlers directly by calling them with mock extractors
- Test extractors with valid and invalid payloads
- Verify HTTP status codes and JSON response shapes
- Test middleware by applying layers to test handlers
- Test error responses for all custom error types
- Use tokio::test for async test functions`,
      },
    ],
  },
};
