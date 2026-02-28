import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const ginProfile: Profile = {
  id: 'frameworks/gin',
  name: 'Gin',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['gin'],
  contributions: {
    claudeMd: [
      {
        heading: 'Gin Conventions',
        order: 20,
        content: `## Gin Conventions

- Use gin.Default() for development (includes Logger and Recovery middleware)
- Use gin.New() for production with explicitly configured middleware
- Group routes with RouterGroup for shared middleware (auth, rate limiting)
- Use c.ShouldBindJSON() / c.ShouldBindQuery() for request validation with struct tags
- Return consistent JSON response shapes with c.JSON() - include status and data/error fields
- Use gin.H{} for ad-hoc JSON responses, typed structs for documented API responses
- Use middleware for cross-cutting concerns: auth, CORS, logging, rate limiting
- Handle errors explicitly - never ignore error returns from binding or DB operations
- Use c.Set() and c.Get() for passing data through middleware chain
- Configure trusted proxies explicitly in production
- Use graceful shutdown with signal handling`,
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
        path: 'gin/routing-middleware.md',
        governance: 'mandatory',
        description: 'Gin routing and middleware patterns',
        content: `# Gin Routing & Middleware

## Route Organization
- Group related routes under a common path prefix using RouterGroup
- Apply authentication middleware at the group level, not per-route
- Use RESTful conventions: GET for reads, POST for creates, PUT for updates, DELETE for deletes
- Keep handler functions small - delegate business logic to service packages

## Middleware Patterns
- Use gin.HandlerFunc signature for all middleware
- Call c.Next() to proceed to the next handler, c.Abort() to stop the chain
- Use c.AbortWithStatusJSON() for error responses in middleware
- Order middleware: recovery -> logging -> CORS -> auth -> rate-limit -> handlers
- Create middleware factories for configurable middleware (e.g., RateLimiter(maxReqs int))

## Request Binding
- Use struct tags for validation: \`binding:"required,min=1,max=100"\`
- Use c.ShouldBindJSON() for body, c.ShouldBindQuery() for query params
- Return 400 with descriptive validation errors on binding failure
- Create custom validators for domain-specific validation rules

## Error Handling
- Define a standard error response struct with code, message, and optional details
- Use c.Error() to collect errors during request processing
- Create an error-handling middleware that formats collected errors
- Never expose internal error details to clients
- Log errors with request context (method, path, client IP, request ID)
`,
      },
      {
        path: 'gin/project-structure.md',
        governance: 'recommended',
        description: 'Gin project structure and organization',
        content: `# Gin Project Structure

## Recommended Layout
- \`/cmd\` - Application entry points (main.go)
- \`/internal/handler\` - HTTP handlers (Gin-specific)
- \`/internal/service\` - Business logic (framework-agnostic)
- \`/internal/repository\` - Data access layer
- \`/internal/middleware\` - Custom Gin middleware
- \`/internal/model\` - Domain models and DTOs
- \`/pkg\` - Reusable library code

## Handler Pattern
- Handlers extract data from Gin context, call services, write response
- Never import Gin in service or repository packages
- Use interfaces for dependency injection between layers
- Group handler constructors to accept service dependencies

## Configuration
- Use environment variables or config files (viper, envconfig)
- Create a config struct loaded at startup, passed via dependency injection
- Never use global mutable state for configuration
- Use build tags or config profiles for environment-specific settings
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Gin-Specific Review
- Check that request binding uses ShouldBind variants (not Bind which aborts on error)
- Verify middleware ordering: recovery -> logging -> CORS -> auth -> handlers
- Check for proper error handling - no silently ignored errors
- Verify route groups are used for shared middleware
- Check that Gin context is not passed to service layer (keep services framework-agnostic)
- Verify trusted proxies are configured for production
- Check for proper graceful shutdown handling
- Verify consistent JSON response shapes across all endpoints`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Gin Testing
- Use httptest.NewRecorder() with gin.CreateTestContext() for handler unit tests
- Set gin.SetMode(gin.TestMode) in test setup to reduce noise
- Test middleware in isolation with minimal router setups
- Test request binding with valid and invalid payloads
- Mock service layer interfaces, not HTTP internals
- Test error cases: binding failures, service errors, auth failures
- Verify correct HTTP status codes and JSON response shapes`,
      },
    ],
  },
};
