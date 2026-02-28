import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const fiberProfile: Profile = {
  id: 'frameworks/fiber',
  name: 'Fiber',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['fiber'],
  contributions: {
    claudeMd: [
      {
        heading: 'Fiber Conventions',
        order: 20,
        content: `## Fiber Conventions

- Fiber is inspired by Express.js but built on top of fasthttp, not net/http
- Use fiber.New() with fiber.Config{} for app initialization and configuration
- Register routes with app.Get(), app.Post(), app.Put(), app.Delete()
- Use c.BodyParser() for request body parsing into structs
- Use c.JSON() for JSON responses, c.SendString() for plain text
- Group routes with app.Group() for shared middleware and path prefixes
- Use app.Use() to register global middleware
- Handle errors by returning c.Status(code).JSON() or fiber.NewError()
- Use c.Locals() for passing data through middleware chain
- Be aware that fasthttp reuses request/response objects - do not hold references after handler returns
- Use c.Params(), c.Query(), c.FormValue() for extracting request data
- Configure graceful shutdown with app.ShutdownWithTimeout()`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(go run:*)',
          'Bash(go build:*)',
          'Bash(go test:*)',
          'Bash(go mod:*)',
        ],
      },
    },
    rules: [
      {
        path: 'fiber/routing-middleware.md',
        governance: 'mandatory',
        description: 'Fiber routing and middleware patterns',
        content: `# Fiber Routing & Middleware

## Route Organization
- Group related routes under a common path prefix using app.Group()
- Apply authentication middleware at the group level with group.Use()
- Use RESTful conventions: app.Get for reads, app.Post for creates, app.Put for updates, app.Delete for deletes
- Keep handler functions small - delegate business logic to service packages
- Use route naming with app.Get("/users", handler).Name("get-users") for URL generation

## Middleware Patterns
- Use fiber.Handler signature for all custom middleware: func(c *fiber.Ctx) error
- Call c.Next() to proceed to the next handler in the chain
- Use built-in middleware from the fiber middleware package: logger, recover, cors, limiter, compress
- Configure middleware with config structs: cors.New(cors.Config{})
- Order middleware: recover -> logger -> CORS -> compress -> auth -> rate-limit -> handlers
- Create middleware factories that return fiber.Handler for configurable middleware

## Request Parsing & Validation
- Use c.BodyParser() for automatic body parsing based on Content-Type header
- Use c.Params(), c.Query(), c.QueryInt() for path and query parameters
- Use a validation library (go-playground/validator) for struct validation after parsing
- Return 400 with descriptive validation errors on parsing/validation failure
- Be careful with fasthttp memory reuse: copy values if needed beyond the handler scope

## Error Handling
- Return errors from handlers - use fiber.NewError(code, message) for HTTP errors
- Configure app.Config.ErrorHandler for centralized error response formatting
- Define a standard error response struct with code, message, and optional details
- Never expose internal error details to clients in production
- Log errors with request context using Fiber's logger or a structured logger

## fasthttp Considerations
- Do NOT store references to c.Body(), c.Params(), or c.Query() beyond the handler - they are reused
- Use copy() or string() conversion to retain values if passing to goroutines or async operations
- net/http middleware and handlers are NOT directly compatible - use adaptor package if needed
- Some third-party libraries expecting net/http will require the fiber adaptor
`,
      },
      {
        path: 'fiber/project-structure.md',
        governance: 'recommended',
        description: 'Fiber project structure and organization',
        content: `# Fiber Project Structure

## Recommended Layout
- \`/cmd\` - Application entry points (main.go)
- \`/internal/handler\` - HTTP handlers (Fiber-specific)
- \`/internal/service\` - Business logic (framework-agnostic)
- \`/internal/repository\` - Data access layer
- \`/internal/middleware\` - Custom Fiber middleware
- \`/internal/model\` - Domain models and DTOs
- \`/pkg\` - Reusable library code

## Handler Pattern
- Handlers extract data from *fiber.Ctx, call services, write response
- Never import Fiber in service or repository packages
- Use interfaces for dependency injection between layers
- Create handler structs that accept service dependencies via constructors
- Register routes in a separate function: func RegisterRoutes(app *fiber.App, h *Handler)

## Configuration
- Use environment variables or config files (viper, envconfig)
- Create a config struct loaded at startup, passed via dependency injection
- Configure fiber.Config{} at app creation for framework-level settings
- Use Prefork: true in production for multi-process mode (be aware of shared state implications)
- Never use global mutable state for configuration

## Static Files & Templates
- Use app.Static() for serving static files
- Use template engines via fiber template package if server-side rendering is needed
- Configure static file caching headers for production
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Fiber-Specific Review
- Check for fasthttp memory reuse issues: values from c.Body(), c.Params() must not be stored beyond handler scope
- Verify middleware ordering: recover -> logger -> CORS -> compress -> auth -> handlers
- Check for proper error handling - handlers should return errors, not silently ignore them
- Verify route groups are used for shared middleware and path prefixes
- Check that *fiber.Ctx is not passed to the service layer (keep services framework-agnostic)
- Verify ErrorHandler is configured in fiber.Config for consistent error responses
- Check for proper graceful shutdown handling with app.ShutdownWithTimeout()
- Verify consistent JSON response shapes across all endpoints
- Check that net/http adaptor is used correctly when integrating non-fasthttp libraries`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Fiber Testing
- Use app.Test() with httptest.NewRequest() for handler integration tests
- Fiber's app.Test() method sends requests through the full middleware chain
- Test middleware in isolation with minimal app setups
- Test request body parsing with valid and invalid payloads using c.BodyParser()
- Mock service layer interfaces, not HTTP internals
- Test error cases: parsing failures, service errors, auth failures
- Verify correct HTTP status codes and JSON response shapes
- Test the custom ErrorHandler with various error types including fiber.NewError()`,
      },
    ],
  },
};
