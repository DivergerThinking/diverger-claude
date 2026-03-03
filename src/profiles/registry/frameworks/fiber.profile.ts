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
- Group related routes under a common prefix using app.Group()
- Apply authentication middleware at the group level with group.Use()
- Register specific routes before wildcards — Fiber matches in declaration order
- Use RESTful conventions: Get for reads, Post for creates, Put/Patch for updates, Delete for deletes
- Keep handler functions small — extract data from Ctx, call services, write response
- Name routes for URL generation: app.Get("/users", handler).Name("list-users")
- Never add routes dynamically after app.Listen() — Fiber's router is not designed for runtime modification

### Correct
\`\`\`go
func RegisterUserRoutes(app *fiber.App, h *UserHandler, auth fiber.Handler) {
    users := app.Group("/api/v1/users")
    users.Use(auth)

    users.Get("/", h.List).Name("list-users")
    users.Get("/:id", h.GetByID).Name("get-user")
    users.Post("/", h.Create).Name("create-user")
    users.Put("/:id", h.Update).Name("update-user")
    users.Delete("/:id", h.Delete).Name("delete-user")
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: flat routes without grouping, auth applied per-route, no naming
app.Get("/api/v1/users", authMiddleware, listUsers)
app.Get("/api/v1/users/:id", authMiddleware, getUser)
app.Post("/api/v1/users", authMiddleware, createUser)
// Problem: duplicated prefix, duplicated middleware, easy to forget auth on new routes
\`\`\`

---

## Middleware Patterns
- All middleware uses the fiber.Handler signature: func(c fiber.Ctx) error (v3) or func(c *fiber.Ctx) error (v2)
- Call c.Next() to proceed to the next handler in the chain
- Use built-in middleware from gofiber/fiber/middleware: recover, logger, cors, limiter, helmet, compress, cache, requestid, idempotency
- Configure middleware with config structs: cors.New(cors.Config{AllowOrigins: "https://example.com"})
- Order middleware: recover -> requestid -> logger -> helmet -> CORS -> compress -> rate-limit -> auth -> handlers
- Create middleware factories that return fiber.Handler for configurable middleware

### Correct
\`\`\`go
app := fiber.New(fiber.Config{
    AppName:      "my-api",
    ErrorHandler: customErrorHandler,
})

// Middleware ordering: recover first to catch panics, then observability, then security
app.Use(recover.New())
app.Use(requestid.New())
app.Use(logger.New(logger.Config{
    Format: "\${time} | \${status} | \${latency} | \${method} \${path} | \${reqHeader:X-Request-ID}\\n",
}))
app.Use(helmet.New())
app.Use(cors.New(cors.Config{
    AllowOrigins: "https://example.com",
    AllowMethods: "GET,POST,PUT,DELETE",
    AllowHeaders: "Origin,Content-Type,Authorization",
}))
app.Use(compress.New())
app.Use(limiter.New(limiter.Config{
    Max:        100,
    Expiration: 1 * time.Minute,
}))
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: recover not first, missing helmet, limiter before CORS
app.Use(logger.New())
app.Use(limiter.New())
app.Use(cors.New())
app.Use(recover.New()) // Problem: panics in logger/limiter/cors won't be caught
\`\`\`

---

## Request Parsing & Validation
- Use c.Bind().Body() (v3) or c.BodyParser() (v2) for automatic body parsing based on Content-Type
- Use c.Params() for path parameters, c.Query() / c.QueryInt() / c.QueryBool() for query parameters
- Configure a StructValidator in fiber.Config to integrate go-playground/validator for automatic struct validation
- Return 400 with descriptive validation errors on parsing or validation failure
- Copy any fasthttp-sourced values (params, query, body bytes) if needed beyond the handler scope

### Correct — v3 with StructValidator
\`\`\`go
import "github.com/go-playground/validator/v10"

type structValidator struct {
    validate *validator.Validate
}

func (v *structValidator) Validate(out any) error {
    return v.validate.Struct(out)
}

app := fiber.New(fiber.Config{
    StructValidator: &structValidator{validate: validator.New()},
})

type CreateUserRequest struct {
    Name  string \`json:"name" validate:"required,min=2,max=100"\`
    Email string \`json:"email" validate:"required,email"\`
}

func (h *UserHandler) Create(c fiber.Ctx) error {
    var req CreateUserRequest
    if err := c.Bind().Body(&req); err != nil {
        return fiber.NewError(fiber.StatusBadRequest, err.Error())
    }
    // req is already validated by StructValidator
    user, err := h.service.Create(c.Context(), req.Name, req.Email)
    if err != nil {
        return fmt.Errorf("create user: %w", err)
    }
    return c.Status(fiber.StatusCreated).JSON(user)
}
\`\`\`

### Correct — v2 with manual validation
\`\`\`go
func (h *UserHandler) Create(c *fiber.Ctx) error {
    var req CreateUserRequest
    if err := c.BodyParser(&req); err != nil {
        return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
    }
    if err := h.validator.Struct(req); err != nil {
        return fiber.NewError(fiber.StatusBadRequest, formatValidationErrors(err))
    }
    user, err := h.service.Create(c.Context(), req.Name, req.Email)
    if err != nil {
        return fmt.Errorf("create user: %w", err)
    }
    return c.Status(fiber.StatusCreated).JSON(user)
}
\`\`\`

### Anti-Pattern
\`\`\`go
func createUser(c *fiber.Ctx) error {
    var req CreateUserRequest
    c.BodyParser(&req)          // Bad: error ignored
    // No validation at all
    db.Create(&req)             // Bad: direct DB access in handler, unvalidated input
    return c.JSON(req)          // Bad: returns raw request as response
}
\`\`\`

---

## Error Handling
- Return errors from handlers — Fiber's ErrorHandler processes all returned errors centrally
- Use fiber.NewError(code, message) for HTTP-level errors with specific status codes
- Configure a custom ErrorHandler in fiber.Config for consistent error response formatting
- Add the Recover middleware to catch panics — Fiber does NOT recover from panics by default
- Define a standard error response struct with code, message, and optional details
- Never expose internal error details (stack traces, SQL queries) to clients in production

### Correct
\`\`\`go
// Standard error response shape
type ErrorResponse struct {
    Code    int    \`json:"code"\`
    Message string \`json:"message"\`
}

func customErrorHandler(c fiber.Ctx, err error) error {
    code := fiber.StatusInternalServerError
    message := "internal server error"

    var fiberErr *fiber.Error
    if errors.As(err, &fiberErr) {
        code = fiberErr.Code
        message = fiberErr.Message
    }

    slog.ErrorContext(c.Context(), "request error",
        slog.Int("status", code),
        slog.String("method", c.Method()),
        slog.String("path", c.Path()),
        slog.String("error", err.Error()),
    )

    return c.Status(code).JSON(ErrorResponse{
        Code:    code,
        Message: message,
    })
}

app := fiber.New(fiber.Config{
    ErrorHandler: customErrorHandler,
})
\`\`\`

### Anti-Pattern
\`\`\`go
func getUser(c *fiber.Ctx) error {
    user, err := service.GetUser(c.Params("id"))
    if err != nil {
        // Bad: exposes internal error, inconsistent response shape, no logging
        return c.Status(500).SendString(err.Error())
    }
    return c.JSON(user)
}
\`\`\`

---

## fasthttp Considerations
- fasthttp reuses request/response byte buffers across connections for performance
- Do NOT store references to c.Body(), c.Params(), c.Query(), c.FormValue() beyond handler return — they will be overwritten
- Use copy(dst, src) for byte slices or string() conversion to retain values for goroutines or async operations
- net/http middleware and handlers are NOT directly compatible — use the fiber adaptor package for interop
- Some third-party libraries expecting net/http (e.g., pprof, Prometheus) require the adaptor

### Correct
\`\`\`go
func (h *Handler) ProcessAsync(c fiber.Ctx) error {
    // Copy param before passing to goroutine — fasthttp reuses the buffer
    userID := string(c.Params("id"))
    body := make([]byte, len(c.Body()))
    copy(body, c.Body())

    go func() {
        // Safe: userID and body are independent copies
        h.processor.Process(context.Background(), userID, body)
    }()

    return c.SendStatus(fiber.StatusAccepted)
}
\`\`\`

### Anti-Pattern
\`\`\`go
func (h *Handler) ProcessAsync(c fiber.Ctx) error {
    go func() {
        // DANGER: c.Params("id") and c.Body() point to reused buffers
        // By the time this goroutine runs, the data may belong to another request
        h.processor.Process(context.Background(), c.Params("id"), c.Body())
    }()
    return c.SendStatus(fiber.StatusAccepted)
}
\`\`\`
`,
      },
      {
        path: 'fiber/project-structure.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Fiber project structure, configuration, and lifecycle management',
        content: `# Fiber Project Structure & Lifecycle

## Recommended Layout
- \`/cmd/api/main.go\` — Application entry point: wire dependencies, configure Fiber, start listener
- \`/internal/handler/\` — HTTP handlers (Fiber-specific): extract from Ctx, call services, write response
- \`/internal/service/\` — Business logic (framework-agnostic): pure Go, no Fiber imports
- \`/internal/repository/\` — Data access layer: database, cache, external APIs
- \`/internal/middleware/\` — Custom Fiber middleware
- \`/internal/model/\` — Domain models and DTOs (request/response structs with json + validate tags)
- \`/internal/config/\` — Configuration loading (env vars, config files)
- \`/pkg/\` — Reusable library code for external consumption

### Correct
\`\`\`
cmd/
  api/main.go
internal/
  handler/
    user.go           # UserHandler struct with Fiber handlers
    user_test.go      # Handler integration tests with app.Test()
    routes.go         # RegisterRoutes(app, handlers)
  service/
    user.go           # UserService with business logic (no Fiber imports)
    user_test.go      # Unit tests with mocked repository
  repository/
    user.go           # UserRepository (database access)
    user_test.go
  middleware/
    auth.go           # Custom JWT auth middleware
    ratelimit.go      # Custom rate-limit per user
  model/
    user.go           # User, CreateUserRequest, UserResponse
  config/
    config.go         # AppConfig struct, LoadFromEnv()
\`\`\`

### Anti-Pattern
\`\`\`
main.go             # Everything in one file
handlers.go         # All handlers in one file
db.go               # Global database connection
# Problem: no separation of concerns, untestable, global mutable state
\`\`\`

---

## Handler Pattern
- Create handler structs that accept service interfaces via constructors
- Handlers extract data from fiber.Ctx, call services, and write the response — nothing else
- Never import Fiber in service or repository packages — keep services framework-agnostic
- Register routes in a dedicated function: func RegisterRoutes(app *fiber.App, h *UserHandler)

### Correct
\`\`\`go
// internal/handler/user.go
type UserHandler struct {
    service UserService // interface, not concrete type
}

// UserService — defined in handler package (consumer-side interface)
type UserService interface {
    Create(ctx context.Context, name, email string) (*model.User, error)
    GetByID(ctx context.Context, id string) (*model.User, error)
}

func NewUserHandler(svc UserService) *UserHandler {
    return &UserHandler{service: svc}
}

func (h *UserHandler) GetByID(c fiber.Ctx) error {
    id := c.Params("id")
    user, err := h.service.GetByID(c.Context(), id)
    if err != nil {
        if errors.Is(err, service.ErrNotFound) {
            return fiber.NewError(fiber.StatusNotFound, "user not found")
        }
        return fmt.Errorf("get user %s: %w", id, err)
    }
    return c.JSON(user)
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: handler directly accesses database, no service layer, imports gorm in handler
func GetUser(c *fiber.Ctx) error {
    var user User
    db.First(&user, c.Params("id"))  // Bad: global db, no error handling, no service
    return c.JSON(user)
}
\`\`\`

---

## Configuration & Lifecycle

### fiber.Config
- Set AppName for identification in logs and monitoring
- Configure ErrorHandler for centralized error responses
- Set StructValidator for automatic request validation (v3)
- Set ReadTimeout, WriteTimeout, and IdleTimeout for production hardening
- Use BodyLimit to cap request body size (default 4MB)
- Use Prefork cautiously — it spawns multiple processes; shared mutable state (in-memory caches) will NOT be shared between processes

### Correct
\`\`\`go
app := fiber.New(fiber.Config{
    AppName:         "my-api v1.0.0",
    ErrorHandler:    customErrorHandler,
    StructValidator: &structValidator{validate: validator.New()},
    ReadTimeout:     5 * time.Second,
    WriteTimeout:    10 * time.Second,
    IdleTimeout:     120 * time.Second,
    BodyLimit:       2 * 1024 * 1024, // 2 MB
})
\`\`\`

### Graceful Shutdown
- Use signal handling with app.ShutdownWithContext() for graceful shutdown
- Register OnPreShutdown and OnPostShutdown hooks for cleanup (close DB connections, flush buffers)
- In v3, OnShutdown is replaced by OnPreShutdown + OnPostShutdown

### Correct
\`\`\`go
func main() {
    app := fiber.New(fiber.Config{...})

    app.Hooks().OnPreShutdown(func() error {
        slog.Info("server shutting down, closing connections...")
        return nil
    })
    app.Hooks().OnPostShutdown(func(err error) error {
        if err != nil {
            slog.Error("shutdown error", slog.String("error", err.Error()))
        }
        slog.Info("server stopped")
        return nil
    })

    // Start server in goroutine
    go func() {
        if err := app.Listen(":3000"); err != nil {
            slog.Error("server error", slog.String("error", err.Error()))
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    // Graceful shutdown with 10-second timeout
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err := app.ShutdownWithContext(ctx); err != nil {
        slog.Error("forced shutdown", slog.String("error", err.Error()))
    }
}
\`\`\`

### Anti-Pattern
\`\`\`go
func main() {
    app := fiber.New()
    // ...
    app.Listen(":3000") // Bad: no graceful shutdown, connections dropped on SIGTERM
}
\`\`\`

---

## Static Files & Templates
- Use app.Static() for serving static files from a directory
- Configure MaxAge in static config for browser caching in production
- Use template engines via fiber's template package if server-side rendering is needed
- Serve SPA applications with app.Static and a NotFound fallback to index.html
`,
      },
      {
        path: 'fiber/security-production.md',
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Fiber production hardening and security best practices',
        content: `# Fiber Security & Production Hardening

## Security Middleware
- Use Helmet middleware to set security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Configure CORS restrictively — never use AllowOrigins: "*" in production
- Use Limiter middleware on authentication endpoints and public APIs
- Use CSRF middleware for form-based state-changing operations
- Use RequestID middleware for tracing and correlation in logs

### Correct
\`\`\`go
// Restrictive CORS for production
app.Use(cors.New(cors.Config{
    AllowOrigins:     "https://app.example.com,https://admin.example.com",
    AllowMethods:     "GET,POST,PUT,DELETE",
    AllowHeaders:     "Origin,Content-Type,Authorization,X-Request-ID",
    AllowCredentials: true,
    MaxAge:           86400,
}))

// Rate limiting on auth endpoints
authGroup := app.Group("/auth")
authGroup.Use(limiter.New(limiter.Config{
    Max:        10,
    Expiration: 15 * time.Minute,
    KeyGenerator: func(c fiber.Ctx) string {
        return c.IP() // Rate limit by IP
    },
}))
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: wildcard CORS, no rate limiting
app.Use(cors.New(cors.Config{
    AllowOrigins: "*",          // Allows any origin
    AllowHeaders: "*",          // Allows any header
}))
\`\`\`

---

## Production Configuration
- Set ReadTimeout, WriteTimeout, and IdleTimeout to prevent slow-loris attacks
- Set BodyLimit to prevent oversized request payloads
- Disable fiber.Config.DisableStartupMessage only if you have alternative startup logging
- Use Prefork with caution: it multiplies memory usage and in-memory state is NOT shared across workers
- Enable ProxyHeader when behind a reverse proxy (e.g., "X-Forwarded-For") for correct client IP detection
- Set EnableTrustedProxyCheck and TrustedProxies to prevent IP spoofing

### Correct
\`\`\`go
app := fiber.New(fiber.Config{
    ReadTimeout:             5 * time.Second,
    WriteTimeout:            10 * time.Second,
    IdleTimeout:             120 * time.Second,
    BodyLimit:               2 * 1024 * 1024,
    ProxyHeader:             "X-Forwarded-For",
    EnableTrustedProxyCheck: true,
    TrustedProxies:          []string{"10.0.0.0/8", "172.16.0.0/12"},
})
\`\`\`

---

## Input Safety
- Always validate and sanitize path parameters, query strings, and request bodies
- Never pass raw user input to SQL queries, shell commands, or file system operations
- Use parameterized queries via database/sql or an ORM — never concatenate user input
- Validate file uploads: check MIME type, enforce size limits, sanitize filenames
- Use c.Bind().Body() (v3) or c.BodyParser() (v2) with struct validation — never parse raw body manually unless absolutely necessary
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.go$" && grep -nE "c\\.(Body|Params|Query|FormValue)\\(" "$CLAUDE_FILE_PATH" | grep -E "go\\s+func|chan\\s|<-" > /dev/null 2>&1 && echo "HOOK_EXIT:0:Warning: possible fasthttp buffer reference passed to goroutine or channel — verify values are copied" || true',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
