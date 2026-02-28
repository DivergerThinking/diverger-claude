import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const echoProfile: Profile = {
  id: 'frameworks/echo',
  name: 'Echo',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['echo'],
  contributions: {
    claudeMd: [
      {
        heading: 'Echo Conventions',
        order: 20,
        content: `## Echo Conventions

- Use echo.New() to create the Echo instance and configure it at startup
- Register routes with e.GET(), e.POST(), e.PUT(), e.DELETE() on the Echo instance
- Use echo.Context (c) for all request/response operations within handlers
- Use c.Bind() for request body binding with struct tags for validation
- Use c.JSON() for JSON responses, c.String() for plain text, c.HTML() for templates
- Group routes with e.Group() for shared middleware and path prefixes
- Use built-in middleware: middleware.Logger(), middleware.Recover(), middleware.CORS()
- Use echo-validator with echo.Validator interface for struct-level validation
- Handle errors by returning echo.NewHTTPError() from handlers
- Use echo.HTTPErrorHandler for centralized error formatting
- Use c.Get() and c.Set() for passing data through middleware chain
- Configure graceful shutdown with signal handling and e.Shutdown()`,
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
        path: 'echo/routing-middleware.md',
        governance: 'mandatory',
        description: 'Echo routing and middleware patterns',
        content: `# Echo Routing & Middleware

## Route Organization
- Group related routes under a common path prefix using e.Group()
- Apply authentication middleware at the group level with g.Use()
- Use RESTful conventions: e.GET for reads, e.POST for creates, e.PUT for updates, e.DELETE for deletes
- Keep handler functions small - delegate business logic to service packages
- Use route naming with e.GET("/users", handler).Name = "get-users" for URL generation

## Middleware Patterns
- Use echo.MiddlewareFunc signature for all custom middleware
- Call next(c) to proceed to the next handler in the chain
- Use built-in middleware from the middleware package: Logger, Recover, CORS, Gzip, Secure
- Configure middleware with functional options: middleware.CORSWithConfig(middleware.CORSConfig{})
- Order middleware: recover -> logger -> CORS -> secure -> auth -> rate-limit -> handlers
- Create middleware factories that return echo.MiddlewareFunc for configurable middleware

## Request Binding & Validation
- Use c.Bind() for automatic binding based on Content-Type header
- Use c.QueryParam(), c.Param(), c.FormValue() for individual values
- Register a custom validator implementing echo.Validator interface
- Use echo-validator (go-playground/validator) for struct tag validation
- Return echo.NewHTTPError(http.StatusBadRequest, "message") on validation failure

## Error Handling
- Return errors from handlers - Echo collects and processes them centrally
- Use echo.NewHTTPError() for HTTP-specific errors with status codes
- Customize e.HTTPErrorHandler for consistent error response formatting
- Define a standard error response struct with code, message, and optional details
- Never expose internal error details to clients in production
- Log errors with request context using Echo's logger or a structured logger
`,
      },
      {
        path: 'echo/project-structure.md',
        governance: 'recommended',
        description: 'Echo project structure and organization',
        content: `# Echo Project Structure

## Recommended Layout
- \`/cmd\` - Application entry points (main.go)
- \`/internal/handler\` - HTTP handlers (Echo-specific)
- \`/internal/service\` - Business logic (framework-agnostic)
- \`/internal/repository\` - Data access layer
- \`/internal/middleware\` - Custom Echo middleware
- \`/internal/model\` - Domain models and DTOs
- \`/internal/validator\` - Custom validators implementing echo.Validator
- \`/pkg\` - Reusable library code

## Handler Pattern
- Handlers extract data from echo.Context, call services, write response
- Never import Echo in service or repository packages
- Use interfaces for dependency injection between layers
- Create handler structs that accept service dependencies via constructors
- Register routes in a separate function: func RegisterRoutes(e *echo.Echo, h *Handler)

## Configuration
- Use environment variables or config files (viper, envconfig)
- Create a config struct loaded at startup, passed via dependency injection
- Never use global mutable state for configuration
- Use build tags or config profiles for environment-specific settings

## Custom Context
- Extend echo.Context only when truly needed for cross-cutting data
- Prefer c.Set()/c.Get() for passing request-scoped data
- If extending, create a custom context middleware at the top of the chain
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Echo-Specific Review
- Check that handlers return errors instead of handling them inline
- Verify a custom HTTPErrorHandler is configured for consistent error responses
- Verify middleware ordering: recover -> logger -> CORS -> secure -> auth -> handlers
- Check that route groups are used for shared middleware and path prefixes
- Check that echo.Context is not passed to the service layer (keep services framework-agnostic)
- Verify echo-validator or equivalent is registered for struct validation
- Check for proper graceful shutdown handling with e.Shutdown()
- Verify consistent JSON response shapes across all endpoints
- Check that built-in middleware is configured with explicit options, not defaults in production`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Echo Testing
- Use httptest.NewRequest() and httptest.NewRecorder() with echo.New().NewContext() for unit tests
- Set up test Echo instances with only the middleware needed for the test
- Test middleware in isolation with minimal route setups
- Test request binding with valid and invalid payloads using c.Bind()
- Mock service layer interfaces, not HTTP internals
- Test error cases: binding failures, service errors, auth failures
- Verify correct HTTP status codes and JSON response shapes
- Test custom HTTPErrorHandler with various error types`,
      },
    ],
  },
};
