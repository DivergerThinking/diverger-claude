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

Express-inspired Go framework built on fasthttp. High throughput, familiar API.

**Detailed rules:** see \`.claude/rules/fiber/\` directory.

**Key rules:**
- Route grouping with \`app.Group()\`, middleware for cross-cutting concerns
- \`c.BodyParser()\` for input binding, validate with struct tags or custom validators
- Use Fiber's built-in middleware: recover, logger, limiter, cors, helmet
- Note: fasthttp is NOT net/http compatible — some Go libraries may not work`,
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
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Fiber routing, middleware, and error handling patterns',
        content: `# Fiber Routing & Middleware

## Route Organization
- Group related routes with \`app.Group()\`, apply auth middleware at the group level
- Register specific routes before wildcards — Fiber matches in declaration order
- Name routes for URL generation: \`app.Get("/users", handler).Name("list-users")\`
- Never add routes dynamically after \`app.Listen()\`

## Middleware
- Middleware signature: \`func(c fiber.Ctx) error\` (v3) or \`func(c *fiber.Ctx) error\` (v2)
- Use built-in middleware: recover, logger, cors, limiter, helmet, compress, requestid
- Order: recover -> requestid -> logger -> helmet -> CORS -> compress -> rate-limit -> auth -> handlers
- Recover middleware must be FIRST — Fiber does NOT recover panics by default
- Configure via config structs: \`cors.New(cors.Config{...})\`

## Request Parsing & Validation
- Use \`c.Bind().Body()\` (v3) or \`c.BodyParser()\` (v2) for body parsing
- Configure \`StructValidator\` in \`fiber.Config\` for automatic go-playground/validator integration
- Always check parsing and validation errors — return 400 with descriptive messages
- Copy fasthttp-sourced values (\`c.Body()\`, \`c.Params()\`, \`c.Query()\`) before passing to goroutines — buffers are reused

## Error Handling
- Return errors from handlers — Fiber's \`ErrorHandler\` processes them centrally
- Use \`fiber.NewError(code, message)\` for HTTP-level errors
- Configure custom \`ErrorHandler\` in \`fiber.Config\` for consistent JSON error responses
- Standard shape: \`{"code": int, "message": "..."}\`
- Log errors server-side — never expose internal details to clients

## fasthttp Considerations
- fasthttp reuses byte buffers across connections — never store references to \`c.Body()\`, \`c.Params()\`, \`c.Query()\` beyond handler return
- Use \`copy()\` for byte slices or \`string()\` conversion when passing to goroutines
- net/http middleware is NOT compatible — use the fiber adaptor package for interop
`,
      },
      {
        path: 'fiber/project-structure.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Fiber project structure, configuration, and lifecycle management',
        content: `# Fiber Project Structure & Lifecycle

## Recommended Layout
- \`cmd/api/main.go\` — Entry point: wire deps, configure Fiber, start listener
- \`internal/handler/\` — HTTP handlers (Fiber-specific) + \`routes.go\` for route registration
- \`internal/service/\` — Business logic (framework-agnostic, no Fiber imports)
- \`internal/repository/\` — Data access layer
- \`internal/middleware/\` — Custom Fiber middleware
- \`internal/model/\` — Domain models and DTOs (json + validate tags)
- \`internal/config/\` — Configuration loading

## Handler Pattern
- Create handler structs accepting service interfaces via constructors
- Handlers: extract from \`fiber.Ctx\`, call services, write response — nothing else
- Define service interfaces in the handler package (consumer-side)
- Never import Fiber in service or repository packages
- Register routes in a dedicated function: \`RegisterRoutes(app, handler)\`
- Map domain errors to \`fiber.NewError()\` — wrap unexpected errors with \`fmt.Errorf\`

## fiber.Config
- Set AppName, ErrorHandler, StructValidator (v3), ReadTimeout, WriteTimeout, IdleTimeout, BodyLimit
- Use Prefork cautiously — in-memory state is NOT shared across worker processes

## Graceful Shutdown
- Handle SIGINT/SIGTERM with \`signal.Notify\`, call \`app.ShutdownWithContext(ctx)\`
- Register OnPreShutdown/OnPostShutdown hooks for cleanup (close DB, flush buffers)
- Never just call \`app.Listen()\` without shutdown handling

## Static Files
- Use \`app.Static()\` with MaxAge for browser caching in production
- Serve SPA with NotFound fallback to index.html
`,
      },
      {
        path: 'fiber/security-production.md',
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Fiber production hardening and security best practices',
        content: `# Fiber Security & Production Hardening

## Security Middleware
- Use Helmet for security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Configure CORS restrictively — never \`AllowOrigins: "*"\` in production
- Use Limiter on auth endpoints (e.g., 10/15min by IP) and public APIs
- Use CSRF middleware for form-based state-changing operations
- Use RequestID for tracing and correlation in logs

## Production Configuration
- Set ReadTimeout, WriteTimeout, IdleTimeout to prevent slow-loris attacks
- Set BodyLimit to prevent oversized payloads
- Enable \`ProxyHeader\` + \`EnableTrustedProxyCheck\` + \`TrustedProxies\` when behind a reverse proxy
- Use Prefork cautiously — in-memory state is NOT shared across workers

## Input Safety
- Validate and sanitize all path params, query strings, and request bodies
- Use parameterized queries — never concatenate user input into SQL
- Validate file uploads: MIME type, size limits, sanitized filenames
- Use struct-level validation via StructValidator — never parse raw body manually
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Fiber-Specific Review

### fasthttp Memory Safety
- Check for stored references to c.Body(), c.Params(), c.Query(), c.FormValue() beyond handler scope — these are reused by fasthttp
- Verify copy() or string() conversion when values are passed to goroutines, channels, or stored in structs
- Check that fiber.Ctx is not captured in closures that outlive the handler

### Middleware & Routing
- Verify Recover middleware is registered FIRST — Fiber does not recover panics by default
- Check middleware ordering: recover -> requestid -> logger -> helmet -> CORS -> compress -> limiter -> auth -> handlers
- Verify route groups are used for shared middleware and path prefixes
- Check that specific routes are registered before wildcard/catch-all routes
- Verify no routes are added dynamically after app.Listen()

### Architecture
- Check that fiber.Ctx is NOT passed to the service layer — services must be framework-agnostic
- Verify handlers are thin: extract from Ctx, call service, write response
- Check that service dependencies are injected via interfaces (consumer-defined)
- Verify no direct database access from handlers

### Error Handling
- Verify handlers return errors instead of silently handling them
- Check that ErrorHandler is configured in fiber.Config for consistent error responses
- Verify fiber.NewError(code, message) is used for HTTP-level errors
- Check that internal error details (stack traces, SQL) are not exposed in responses

### Production Readiness
- Verify ReadTimeout, WriteTimeout, and IdleTimeout are set in fiber.Config
- Check that BodyLimit is configured to prevent oversized payloads
- Verify CORS is configured restrictively (no wildcard "*" in production)
- Check for graceful shutdown with signal handling and ShutdownWithContext/ShutdownWithTimeout
- Verify ProxyHeader and TrustedProxies are configured when behind a reverse proxy
- Check consistent JSON response shapes across all endpoints (success and error)

**Available skills:** Use \`fiber-handler-generator\` to scaffold new handlers, \`fiber-middleware-generator\` for middleware.`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Fiber Testing

### Handler Integration Tests
- Use app.Test() with httptest.NewRequest() for handler integration tests — this sends requests through the full middleware chain
- In v3, use fiber.TestConfig{} for configurable test behavior (timeout, FailOnTimeout)
- Use fasthttputil.InMemoryListener() for faster tests that avoid network overhead
- Verify correct HTTP status codes, Content-Type headers, and JSON response shapes in every test

### Correct Test Pattern
\`\`\`go
func TestGetUser_Success(t *testing.T) {
    // Arrange
    mockSvc := &mockUserService{
        getByIDFn: func(ctx context.Context, id string) (*model.User, error) {
            return &model.User{ID: "123", Name: "Alice"}, nil
        },
    }
    handler := NewUserHandler(mockSvc)

    app := fiber.New()
    app.Get("/users/:id", handler.GetByID)

    req := httptest.NewRequest(http.MethodGet, "/users/123", nil)
    req.Header.Set("Content-Type", "application/json")

    // Act
    resp, err := app.Test(req)

    // Assert
    require.NoError(t, err)
    assert.Equal(t, fiber.StatusOK, resp.StatusCode)

    var user model.User
    err = json.NewDecoder(resp.Body).Decode(&user)
    require.NoError(t, err)
    assert.Equal(t, "123", user.ID)
    assert.Equal(t, "Alice", user.Name)
}
\`\`\`

### Testing Coverage
- Test middleware in isolation with minimal app setups — register only the middleware under test
- Test request body parsing with valid and invalid payloads using c.Bind().Body() / c.BodyParser()
- Mock service layer interfaces — not HTTP internals or database
- Test error cases: parsing failures, validation errors, service errors, auth failures, not found
- Test the custom ErrorHandler with various error types including fiber.NewError() and wrapped errors
- Test route groups to verify middleware is applied correctly (e.g., auth group requires token)
- Test fasthttp edge cases: empty body, missing Content-Type, oversized payload

**Available skills:** Use \`fiber-handler-generator\` to scaffold handlers with tests, \`fiber-middleware-generator\` for middleware with tests.`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Fiber-Specific Security

### fasthttp Memory Reuse
- Verify no handler stores references to c.Body(), c.Params(), or c.Query() in structs, maps, or goroutines without copying
- Check closures capturing fiber.Ctx — the context is reused after handler returns

### Production Hardening
- Verify Helmet middleware is configured for security headers
- Check CORS configuration — AllowOrigins must not be "*" in production
- Verify Limiter middleware is applied to auth endpoints and public APIs
- Check that ReadTimeout, WriteTimeout, IdleTimeout, and BodyLimit are set
- Verify ProxyHeader and TrustedProxies are configured when deployed behind a load balancer
- Check that Prefork mode accounts for non-shared in-memory state across worker processes

**Available skills:** Use \`fiber-handler-generator\` to scaffold secure handlers, \`fiber-middleware-generator\` for security middleware.`,
      },
    ],
    skills: [
      {
        name: 'fiber-handler-generator',
        description: 'Generate Fiber HTTP handlers with validation, error handling, and tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Fiber Handler Generator

Generate a complete Fiber HTTP handler following these steps:

## 1. Define Request/Response Models
- Create request struct with json and validate tags
- Create response struct with json tags
- Place in internal/model/ package

## 2. Define Service Interface (Consumer-Side)
- Define the interface in the handler package (not the service package)
- Keep it minimal — only the methods this handler needs

## 3. Implement Handler
- Create handler struct with service interface as dependency
- Constructor: func NewXxxHandler(svc XxxService) *XxxHandler
- Handler method signature: func (h *XxxHandler) MethodName(c fiber.Ctx) error
- Parse request with c.Bind().Body() (v3) or c.BodyParser() (v2) + validation
- Call service with c.Context() for context propagation
- Return fiber.NewError(code, message) for client errors
- Return fmt.Errorf("operation: %w", err) for unexpected errors (ErrorHandler formats the response)
- Copy fasthttp-sourced values before passing to goroutines

## 4. Register Routes
- Create func RegisterXxxRoutes(app *fiber.App, h *XxxHandler)
- Group routes under a common prefix
- Apply middleware at the group level

## 5. Write Integration Test
- Use app.Test() with httptest.NewRequest()
- Mock the service interface
- Test success, validation error, not found, and internal error cases
- Verify status codes and JSON response shapes
`,
      },
      {
        name: 'fiber-middleware-generator',
        description: 'Generate custom Fiber middleware with config pattern',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Fiber Middleware Generator

Generate custom Fiber middleware following the config pattern:

## Structure
\`\`\`go
package middleware

// Config holds configuration for the middleware.
type Config struct {
    // Next defines a function to skip this middleware when returning true.
    Next func(c fiber.Ctx) bool

    // Add custom config fields here
}

// ConfigDefault is the default config.
var ConfigDefault = Config{
    Next: nil,
}

// New creates a new middleware handler.
func New(config ...Config) fiber.Handler {
    cfg := configDefault(config...)

    return func(c fiber.Ctx) error {
        if cfg.Next != nil && cfg.Next(c) {
            return c.Next()
        }

        // Middleware logic here (before handler)

        err := c.Next()

        // Middleware logic here (after handler)

        return err
    }
}

func configDefault(config ...Config) Config {
    if len(config) < 1 {
        return ConfigDefault
    }
    cfg := config[0]
    // Apply defaults for zero-value fields
    return cfg
}
\`\`\`

## Key Points
- Follow the Config pattern used by all official Fiber middleware
- Include a Next function for conditional skip
- Provide sensible defaults in ConfigDefault
- Return fiber.Handler from the New() function
- Write tests with minimal app setup and app.Test()
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
            statusMessage: 'Checking for fasthttp buffer references passed to goroutines',
            command:
              'FILE_PATH=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.go$" && grep -nE "c\\.(Body|Params|Query|FormValue)\\(" "$FILE_PATH" | grep -E "go\\s+func|chan\\s|<-" > /dev/null 2>&1 && { echo "Warning: possible fasthttp buffer reference passed to goroutine or channel — verify values are copied" >&2; exit 2; } || exit 0',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
