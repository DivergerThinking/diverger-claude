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

- Use extractors (web::Json, web::Path, web::Query) for request data - type-safe and validated
- Define handlers as async functions returning impl Responder
- Use App::app_data() for shared state (DB pools, config) wrapped in web::Data<T>
- Organize routes with web::scope() for path prefixes and shared middleware
- Use middleware for cross-cutting concerns: Logger, CORS, authentication
- Implement FromRequest for custom extractors (auth tokens, pagination)
- Use actix_web::Error and ResponseError trait for structured error handling
- Configure worker count based on CPU cores for production
- Use #[actix_web::main] for the entry point with HttpServer::new()
- Enable TLS in production, handle graceful shutdown with server.stop()
- Use serde for JSON serialization/deserialization with derive macros`,
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
        path: 'actix-web/architecture.md',
        governance: 'mandatory',
        description: 'Actix Web architecture and handler patterns',
        content: `# Actix Web Architecture

## Handler Patterns
- Handlers are async functions: \`async fn handler(data: web::Data<AppState>) -> impl Responder\`
- Use extractors for typed request data: web::Json<T>, web::Path<T>, web::Query<T>
- Return HttpResponse or implement Responder for custom types
- Keep handlers thin - delegate business logic to service modules

## Application State
- Wrap shared state in web::Data<T> with App::app_data()
- Use Arc<T> for state shared across workers (DB pools, caches)
- Access state via extractor: \`web::Data<AppState>\` in handler signature
- Never use mutable global state - use interior mutability (Mutex, RwLock) if needed

## Route Organization
- Use web::scope() to group related routes under a path prefix
- Apply middleware per-scope for auth, rate limiting, etc.
- Use web::resource() for multiple HTTP methods on the same path
- Configure routes in a separate function for testability

## Error Handling
- Implement the ResponseError trait for custom error types
- Map internal errors to appropriate HTTP status codes
- Return structured JSON error responses with error code and message
- Use From<T> implementations for error conversion chains
- Log errors with context before converting to HTTP responses

## Middleware
- Use wrap() to apply middleware to App, Scope, or Resource
- Built-in: Logger, Compress, DefaultHeaders, CORS
- Custom middleware: implement Transform and Service traits, or use from_fn()
- Order matters: first added = outermost (runs first on request, last on response)
`,
      },
      {
        path: 'actix-web/performance.md',
        governance: 'recommended',
        description: 'Actix Web performance and deployment patterns',
        content: `# Actix Web Performance

## Worker Configuration
- Default workers = number of logical CPUs - appropriate for most cases
- CPU-bound work: use web::block() to run on Tokio's blocking threadpool
- I/O-bound handlers: use async throughout, avoid blocking the runtime

## Connection Handling
- Configure keep-alive timeout based on deployment (reverse proxy or direct)
- Set appropriate request payload limits with PayloadConfig
- Use streaming responses for large data with HttpResponse::streaming()

## Deployment
- Run behind a reverse proxy (nginx, traefik) for TLS termination
- Set trusted proxies for correct client IP extraction
- Use environment-based configuration for port, workers, and TLS
- Enable compression middleware for API responses
- Use health check endpoints for load balancer integration
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Actix Web Review
- Check that handlers use extractors for request data, not manual parsing
- Verify shared state is wrapped in web::Data and accessed via extractors
- Check for proper error handling with ResponseError implementations
- Verify middleware ordering and scope-based route organization
- Check that blocking operations use web::block()
- Verify serde derive macros on all request/response structs
- Check for proper CORS and security middleware configuration
- Verify graceful shutdown handling in the server setup`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Actix Web Testing
- Use actix_web::test module for integration tests
- Create test app with test::init_service(App::new().configure(routes))
- Use TestRequest::get/post().to(handler) for unit testing handlers
- Mock services by injecting test implementations via app_data
- Test extractors with valid and invalid payloads
- Verify HTTP status codes and JSON response shapes
- Test middleware by wrapping test handlers
- Test error responses for all error types`,
      },
    ],
  },
};
