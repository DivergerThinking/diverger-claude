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

High-performance Go web framework. Middleware-centric, context-based request handling.

**Detailed rules:** see \`.claude/rules/echo/\` directory.

**Key rules:**
- Group routes with \`e.Group()\`, apply middleware per group for auth/logging
- Use Echo's \`Context\` for request/response — bind and validate input structs
- Centralized error handler via \`echo.HTTPErrorHandler\`, return consistent JSON errors
- Middleware ordering matters: logger → recover → auth → rate-limit → handler`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(go run:*)',
          'Bash(go build:*)',
          'Bash(go test:*)',
          'Bash(go mod:*)',
          'Bash(go vet:*)',
          'Bash(air:*)',
        ],
      },
    },
    rules: [
      {
        path: 'echo/routing-middleware.md',
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Echo routing, middleware composition, and request pipeline',
        content: `# Echo Routing & Middleware

## Route Organization
- Group related routes under a common path prefix using \`e.Group()\`
- Apply authentication and authorization middleware at the group level with \`g.Use()\`
- Use RESTful conventions: GET for reads, POST for creates, PUT for full updates, PATCH for partial updates, DELETE for removals
- Keep handler functions thin — extract request data, call a service, write the response
- Use route naming for URL generation: \`e.GET("/users/:id", getUser).Name = "get-user"\`
- Prefer separate handler functions over anonymous closures for testability

### Correct — Route Registration
\`\`\`go
func RegisterRoutes(e *echo.Echo, h *UserHandler, auth echo.MiddlewareFunc) {
    api := e.Group("/api/v1")
    api.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(20)))

    users := api.Group("/users", auth)
    users.GET("", h.List)
    users.POST("", h.Create)
    users.GET("/:id", h.GetByID)
    users.PUT("/:id", h.Update)
    users.DELETE("/:id", h.Delete)
}
\`\`\`

### Anti-Pattern — Route Registration
\`\`\`go
func RegisterRoutes(e *echo.Echo) {
    // Bad: no grouping, no shared middleware, auth duplicated per route
    e.GET("/api/v1/users", listUsers, authMiddleware)
    e.POST("/api/v1/users", createUser, authMiddleware)
    e.GET("/api/v1/users/:id", getUser, authMiddleware)
    // Bad: anonymous closures are harder to unit test
    e.GET("/health", func(c echo.Context) error {
        return c.JSON(200, map[string]string{"status": "ok"})
    })
}
\`\`\`

---

## Middleware Composition
- Global middleware via \`e.Use()\` — applies to every request
- Group middleware via \`g.Use()\` — applies to routes in that group
- Per-route middleware as extra arguments to route registration
- Use \`echo.MiddlewareFunc\` signature for all custom middleware
- Call \`next(c)\` to proceed to the next handler in the chain
- Use the Skipper pattern (\`middleware.Skipper\`) to conditionally bypass middleware

### Recommended Global Middleware Order
1. \`middleware.Recover()\` — catch panics, convert to 500 errors
2. \`middleware.RequestID()\` — inject X-Request-ID for tracing
3. \`middleware.Logger()\` or \`middleware.RequestLoggerWithConfig()\` — structured access logs
4. \`middleware.CORS()\` / \`middleware.CORSWithConfig()\` — cross-origin policy
5. \`middleware.Secure()\` / \`middleware.SecureWithConfig()\` — security headers (XSS, HSTS, etc.)
6. \`middleware.RateLimiter()\` — request throttling
7. \`middleware.ContextTimeoutWithConfig()\` — handler-level timeouts (v4.12+)
8. Auth middleware (JWT, session, API key) — at the group level
9. Application handlers

### Correct — Custom Middleware Factory
\`\`\`go
// RequestLogger injects a structured logger with request-scoped fields.
func RequestLogger(logger *slog.Logger) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            reqID := c.Response().Header().Get(echo.HeaderXRequestID)
            reqLogger := logger.With(
                slog.String("request_id", reqID),
                slog.String("method", c.Request().Method),
                slog.String("path", c.Path()),
            )
            c.Set("logger", reqLogger)
            return next(c)
        }
    }
}
\`\`\`

### Anti-Pattern — Custom Middleware
\`\`\`go
// Bad: does not call next(c) — blocks the entire chain
func BadMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        log.Println("request received")
        return nil // Oops: forgot to call next(c)
    }
}
\`\`\`

---

## Request Binding & Validation
- Use \`c.Bind()\` for automatic binding based on Content-Type (JSON, XML, form)
- Default bind order: path params → query params → request body (each step can override)
- For explicit control, bind from a single source: use dedicated methods for path, query, or body
- Register a custom validator implementing \`echo.Validator\` (typically \`go-playground/validator/v10\`)
- Call \`c.Validate()\` after \`c.Bind()\` to trigger struct-level validation
- Return \`echo.NewHTTPError(http.StatusBadRequest, details)\` on validation failure

### Correct — Binding + Validation
\`\`\`go
type CreateUserRequest struct {
    Name  string \`json:"name" validate:"required,min=2,max=100"\`
    Email string \`json:"email" validate:"required,email"\`
    Age   int    \`json:"age" validate:"gte=0,lte=150"\`
}

func (h *UserHandler) Create(c echo.Context) error {
    var req CreateUserRequest
    if err := c.Bind(&req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
    }
    if err := c.Validate(&req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, err.Error())
    }

    user, err := h.service.Create(c.Request().Context(), req.Name, req.Email, req.Age)
    if err != nil {
        return fmt.Errorf("create user: %w", err)
    }
    return c.JSON(http.StatusCreated, user)
}
\`\`\`

### Anti-Pattern — Binding
\`\`\`go
func (h *UserHandler) Create(c echo.Context) error {
    // Bad: manual parsing, no validation, error swallowed
    body, _ := io.ReadAll(c.Request().Body)
    var req map[string]interface{}
    json.Unmarshal(body, &req)
    name := req["name"].(string) // Bad: panics on nil or wrong type
    // ...
}
\`\`\`

---

## Error Handling
- Return errors from handlers — Echo collects and routes them to \`HTTPErrorHandler\`
- Use \`echo.NewHTTPError(status, message)\` for HTTP-specific errors with proper status codes
- Use \`.SetInternal(err)\` to attach the original error for logging without exposing it to clients
- Customize \`e.HTTPErrorHandler\` for a consistent JSON error envelope across all endpoints
- Define domain-specific sentinel errors and map them to HTTP status codes in the error handler
- Never expose internal error details, stack traces, or file paths to clients

### Correct — Centralized Error Handler
\`\`\`go
type APIError struct {
    Code      int    \`json:"code"\`
    Message   string \`json:"message"\`
    RequestID string \`json:"request_id,omitempty"\`
}

func customHTTPErrorHandler(err error, c echo.Context) {
    if c.Response().Committed {
        return
    }

    code := http.StatusInternalServerError
    msg := "internal server error"

    var he *echo.HTTPError
    if errors.As(err, &he) {
        code = he.Code
        if m, ok := he.Message.(string); ok {
            msg = m
        }
        if he.Internal != nil {
            // Log the internal error, never send it to the client
            logger := c.Get("logger")
            if l, ok := logger.(*slog.Logger); ok {
                l.Error("request failed", slog.String("error", he.Internal.Error()))
            }
        }
    }

    apiErr := APIError{
        Code:      code,
        Message:   msg,
        RequestID: c.Response().Header().Get(echo.HeaderXRequestID),
    }
    _ = c.JSON(code, apiErr)
}
\`\`\`

### Anti-Pattern — Error Handling
\`\`\`go
func (h *UserHandler) GetByID(c echo.Context) error {
    user, err := h.service.GetByID(c.Request().Context(), c.Param("id"))
    if err != nil {
        // Bad: exposes internal error details to the client
        return c.JSON(500, map[string]string{"error": err.Error()})
    }
    return c.JSON(200, user)
    // Bad: doesn't return error to Echo — bypasses centralized error handling
}
\`\`\`
`,
      },
      {
        path: 'echo/project-structure.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Echo project structure, layered architecture, and dependency injection',
        content: `# Echo Project Structure

## Recommended Layout
\`\`\`
cmd/
  api/
    main.go              # Entry point: wires deps, starts server
internal/
  handler/               # HTTP handlers (Echo-specific)
    user_handler.go
    user_handler_test.go
  service/               # Business logic (framework-agnostic)
    user_service.go
    user_service_test.go
  repository/            # Data access layer
    user_repository.go
  middleware/             # Custom Echo middleware
    auth.go
    request_logger.go
  model/                 # Domain models and DTOs
    user.go
    errors.go            # Domain-specific sentinel errors
  validator/             # Custom validators (echo.Validator impl)
    validator.go
pkg/                     # Reusable library code (optional)
\`\`\`

---

## Handler Pattern — Thin Handlers, Fat Services
- Handlers extract data from \`echo.Context\`, call services, write the HTTP response
- Never import \`echo\` in service or repository packages — keep them framework-agnostic
- Use interfaces for dependency injection between layers
- Create handler structs that accept service interfaces via constructors
- Register routes in a dedicated function that receives the Echo instance and handler

### Correct — Handler Struct with DI
\`\`\`go
// internal/handler/user_handler.go
type UserService interface {
    GetByID(ctx context.Context, id string) (*model.User, error)
    Create(ctx context.Context, name, email string) (*model.User, error)
}

type UserHandler struct {
    service UserService
}

func NewUserHandler(svc UserService) *UserHandler {
    return &UserHandler{service: svc}
}

func (h *UserHandler) GetByID(c echo.Context) error {
    id := c.Param("id")
    if id == "" {
        return echo.NewHTTPError(http.StatusBadRequest, "user id is required")
    }

    user, err := h.service.GetByID(c.Request().Context(), id)
    if err != nil {
        if errors.Is(err, model.ErrNotFound) {
            return echo.NewHTTPError(http.StatusNotFound, "user not found")
        }
        return echo.NewHTTPError(http.StatusInternalServerError).SetInternal(err)
    }

    return c.JSON(http.StatusOK, user)
}
\`\`\`

### Anti-Pattern — Handler
\`\`\`go
// Bad: handler does too much — business logic mixed with HTTP concerns
func GetUser(c echo.Context) error {
    db := c.Get("db").(*sql.DB) // Bad: pulling deps from context instead of DI
    row := db.QueryRow("SELECT * FROM users WHERE id = $1", c.Param("id"))
    var user User
    row.Scan(&user.ID, &user.Name) // Bad: error ignored, business logic in handler
    return c.JSON(200, user)
}
\`\`\`

---

## Configuration & Startup
- Use environment variables or config files (envconfig, viper, koanf)
- Create a config struct loaded at startup, passed via dependency injection
- Never use global mutable state for configuration
- Wire all dependencies in \`main.go\` — the only place that knows all concrete types

### Correct — Main Startup
\`\`\`go
func main() {
    cfg := config.Load()
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    db := database.Connect(cfg.DatabaseURL)
    defer db.Close()

    userRepo := repository.NewUserRepository(db)
    userSvc := service.NewUserService(userRepo, logger)
    userHandler := handler.NewUserHandler(userSvc)

    e := echo.New()
    e.HTTPErrorHandler = handler.CustomHTTPErrorHandler(logger)

    e.Use(middleware.Recover())
    e.Use(middleware.RequestID())
    e.Use(middleware.Logger())

    handler.RegisterRoutes(e, userHandler)

    // Graceful shutdown
    go func() {
        if err := e.Start(cfg.Addr); err != nil && err != http.ErrServerClosed {
            logger.Error("server error", slog.String("error", err.Error()))
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err := e.Shutdown(ctx); err != nil {
        logger.Error("shutdown error", slog.String("error", err.Error()))
    }
}
\`\`\`

---

## Custom Context
- Prefer \`c.Set()\` / \`c.Get()\` for request-scoped data (logger, user, tenant)
- Extend \`echo.Context\` only when you need type-safe access to cross-cutting data
- If extending, register the custom context middleware first in the chain
- In v5, \`echo.Context\` is a struct — extend by embedding or use \`c.Set()\` / \`c.Get()\`
`,
      },
      {
        path: 'echo/testing-patterns.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Echo handler testing, middleware testing, and integration test patterns',
        content: `# Echo Testing Patterns

## Handler Unit Tests
- Use \`httptest.NewRequest()\` and \`httptest.NewRecorder()\` with \`e.NewContext()\`
- Set up a minimal Echo instance with only the middleware needed for the test
- Mock service interfaces — never mock HTTP internals or Echo itself
- Test request binding, validation, error mapping, and response shapes
- Use table-driven tests for handlers with multiple scenarios

### Correct — Handler Test
\`\`\`go
func TestUserHandler_GetByID(t *testing.T) {
    t.Parallel()

    tests := []struct {
        name       string
        userID     string
        mockUser   *model.User
        mockErr    error
        wantStatus int
        wantBody   string
    }{
        {
            name:       "found",
            userID:     "123",
            mockUser:   &model.User{ID: "123", Name: "Alice"},
            wantStatus: http.StatusOK,
            wantBody:   \`"name":"Alice"\`,
        },
        {
            name:       "not found",
            userID:     "999",
            mockErr:    model.ErrNotFound,
            wantStatus: http.StatusNotFound,
        },
        {
            name:       "empty id",
            userID:     "",
            wantStatus: http.StatusBadRequest,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()

            svc := &mockUserService{
                getByIDFn: func(ctx context.Context, id string) (*model.User, error) {
                    return tt.mockUser, tt.mockErr
                },
            }
            h := handler.NewUserHandler(svc)

            e := echo.New()
            req := httptest.NewRequest(http.MethodGet, "/users/"+tt.userID, nil)
            rec := httptest.NewRecorder()
            c := e.NewContext(req, rec)
            c.SetParamNames("id")
            c.SetParamValues(tt.userID)

            err := h.GetByID(c)

            if tt.wantStatus >= 400 {
                var he *echo.HTTPError
                if errors.As(err, &he) {
                    assert.Equal(t, tt.wantStatus, he.Code)
                }
                return
            }

            assert.NoError(t, err)
            assert.Equal(t, tt.wantStatus, rec.Code)
            if tt.wantBody != "" {
                assert.Contains(t, rec.Body.String(), tt.wantBody)
            }
        })
    }
}
\`\`\`

### Anti-Pattern — Handler Test
\`\`\`go
func TestGetUser(t *testing.T) {
    // Bad: testing against a real database, no isolation
    db := connectToTestDB()
    e := echo.New()
    req := httptest.NewRequest(http.MethodGet, "/users/1", nil)
    rec := httptest.NewRecorder()
    c := e.NewContext(req, rec)
    GetUser(c)                          // Bad: function-level handler, no DI
    assert.Equal(t, 200, rec.Code)      // Bad: only happy path, fragile assertion
}
\`\`\`

---

## Middleware Tests
- Test middleware in isolation with a minimal handler that records results
- Verify the middleware calls \`next(c)\` for pass-through and does not call it for rejection
- Test both allowed and rejected scenarios (e.g., valid vs invalid auth tokens)

\`\`\`go
func TestAuthMiddleware_ValidToken(t *testing.T) {
    e := echo.New()
    req := httptest.NewRequest(http.MethodGet, "/", nil)
    req.Header.Set("Authorization", "Bearer valid-token")
    rec := httptest.NewRecorder()
    c := e.NewContext(req, rec)

    handlerCalled := false
    handler := func(c echo.Context) error {
        handlerCalled = true
        return c.String(http.StatusOK, "ok")
    }

    mw := AuthMiddleware(mockTokenValidator{valid: true})
    err := mw(handler)(c)

    assert.NoError(t, err)
    assert.True(t, handlerCalled)
}
\`\`\`

---

## Integration Tests (Full Router)
- Create a full Echo instance with all middleware and routes registered
- Use \`httptest.NewServer(e)\` for end-to-end HTTP tests
- Test the full request pipeline: middleware → handler → service → response
- Useful for verifying middleware ordering, error handler, and response envelopes

\`\`\`go
func TestAPI_Integration(t *testing.T) {
    e := setupTestApp() // Factory: creates Echo, injects test deps
    ts := httptest.NewServer(e)
    defer ts.Close()

    resp, err := http.Get(ts.URL + "/api/v1/users/123")
    require.NoError(t, err)
    defer resp.Body.Close()

    assert.Equal(t, http.StatusOK, resp.StatusCode)
    assert.NotEmpty(t, resp.Header.Get("X-Request-Id"))
}
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Echo-Specific Review

### Handler Design
- Check that handlers return errors to Echo instead of writing responses inline on failure
- Verify handlers are thin: extract request → call service → write response — no business logic
- Check that echo.Context is NOT passed to the service layer — pass context.Context via c.Request().Context()
- Verify c.Bind() + c.Validate() are used together for all request input
- Check for consistent use of echo.NewHTTPError() with proper HTTP status codes

### Error Handling
- Verify a custom HTTPErrorHandler is configured for consistent JSON error envelopes
- Check that echo.NewHTTPError().SetInternal(err) is used to wrap internal errors without exposing them
- Verify domain sentinel errors are mapped to appropriate HTTP status codes
- Check that no handler returns raw error details to clients (err.Error() in response body)

### Middleware
- Verify middleware ordering: Recover → RequestID → Logger → CORS → Secure → RateLimiter → Auth → Handlers
- Check that middleware.Recover() is always first to catch panics
- Check that middleware.RequestID() is present for distributed tracing
- Verify CORS is configured with explicit origins (not "*") in production
- Verify middleware.Secure() is configured (XSS protection, HSTS, content-type nosniff)
- Check that all middleware configurations use WithConfig variants with explicit options, not defaults

### Routing
- Verify route groups are used for shared middleware and path prefixes
- Check that routes use explicit HTTP methods (not e.Any() without justification)
- Verify path parameters are validated in handlers before use

### Server Configuration
- Check that e.Server has explicit ReadTimeout, WriteTimeout, and IdleTimeout set
- Verify graceful shutdown is implemented with signal handling and e.Shutdown(ctx)
- Check that middleware.ContextTimeoutWithConfig() is used for handler-level timeouts where needed

### Validation
- Verify echo.Validator is registered (go-playground/validator/v10)
- Check that c.Validate() is called after c.Bind() for all input structs
- Verify validation errors are translated to user-friendly messages

**Available skills:** Use \`echo-handler-generator\` to scaffold new handlers, \`echo-middleware-generator\` for middleware.`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Echo Testing

### Handler Unit Tests
- Use httptest.NewRequest() and httptest.NewRecorder() with echo.New().NewContext() for handler tests
- Set path parameters with c.SetParamNames() and c.SetParamValues() before calling handler
- Set Content-Type header to "application/json" for JSON binding tests
- Use table-driven tests with t.Run() for handlers with multiple scenarios
- Mock service layer interfaces — never mock Echo itself or HTTP internals
- Test echo.HTTPError returned from handlers: use errors.As(err, &he) to check code and message
- Test response body shape by unmarshaling rec.Body into expected struct

### Binding & Validation Tests
- Test c.Bind() with valid and invalid payloads (malformed JSON, missing fields)
- Test c.Validate() with structs that violate validation rules
- Verify correct HTTP 400 status code and descriptive error messages for binding failures
- Test with different Content-Types: JSON, form-urlencoded, multipart

### Middleware Tests
- Test middleware in isolation with a minimal echo.HandlerFunc that records whether it was called
- Verify pass-through: middleware calls next(c) on success
- Verify rejection: middleware returns error or aborts chain on failure
- Test the Skipper function if the middleware supports conditional bypass

### Error Handler Tests
- Test the custom HTTPErrorHandler with various error types: echo.HTTPError, wrapped errors, unknown errors
- Verify response JSON envelope has consistent shape (code, message, request_id)
- Verify that internal errors are NOT exposed in the response body

### Integration Tests
- Use httptest.NewServer(e) for full-stack HTTP tests
- Verify middleware ordering produces expected headers (X-Request-Id, CORS, security headers)
- Test the full error pipeline: handler error → HTTPErrorHandler → response envelope

**Available skills:** Use \`echo-handler-generator\` to scaffold handlers with tests, \`echo-middleware-generator\` for middleware with tests.`,
      },
    ],
    skills: [
      {
        name: 'echo-handler-generator',
        description: 'Generate Echo HTTP handler with DI, binding, validation, error handling, and test',
        content: `# Echo Handler Generator

Generate a complete Echo HTTP handler following project conventions:

## Handler File
1. Define a service interface with the methods the handler needs (consumer-side interface)
2. Create a handler struct accepting the service interface via a NewXxxHandler constructor
3. Implement handler methods that:
   - Extract and validate path/query params
   - Call c.Bind() + c.Validate() for request bodies
   - Delegate to the service via c.Request().Context()
   - Map domain errors to echo.NewHTTPError with proper status codes
   - Return c.JSON() with the appropriate status code on success
4. Create a RegisterRoutes function that accepts *echo.Echo and the handler

## Request/Response Types
- Define request structs with json and validate tags
- Define response structs with json tags
- Place in the handler file or a shared dto package

## Test File
- Table-driven tests covering: happy path, not found, validation error, service error
- Use httptest.NewRequest + httptest.NewRecorder + e.NewContext
- Set path params with c.SetParamNames / c.SetParamValues
- Mock the service interface with a struct that has function fields
- Assert both returned error (echo.HTTPError) and response body

## Example Scaffold
\`\`\`go
// handler
type OrderService interface {
    GetByID(ctx context.Context, id string) (*model.Order, error)
}

type OrderHandler struct { service OrderService }

func NewOrderHandler(svc OrderService) *OrderHandler {
    return &OrderHandler{service: svc}
}

func (h *OrderHandler) GetByID(c echo.Context) error {
    id := c.Param("id")
    order, err := h.service.GetByID(c.Request().Context(), id)
    if err != nil {
        if errors.Is(err, model.ErrNotFound) {
            return echo.NewHTTPError(http.StatusNotFound, "order not found")
        }
        return echo.NewHTTPError(http.StatusInternalServerError).SetInternal(err)
    }
    return c.JSON(http.StatusOK, order)
}

func RegisterOrderRoutes(g *echo.Group, h *OrderHandler) {
    g.GET("/:id", h.GetByID)
}
\`\`\`
`,
      },
      {
        name: 'echo-middleware-generator',
        description: 'Generate custom Echo middleware with skipper, configuration, and tests',
        content: `# Echo Middleware Generator

Generate a custom Echo middleware following framework conventions:

## Middleware File
1. Define a Config struct with all configurable options and a Skipper field
2. Create a WithConfig constructor that applies defaults and returns echo.MiddlewareFunc
3. Create a convenience constructor with sensible defaults
4. Follow the echo.MiddlewareFunc signature: func(next echo.HandlerFunc) echo.HandlerFunc
5. Call next(c) to proceed, or return an error / echo.NewHTTPError to abort

## Template
\`\`\`go
type TenantConfig struct {
    Skipper    middleware.Skipper
    HeaderName string
    Required   bool
}

var DefaultTenantConfig = TenantConfig{
    Skipper:    middleware.DefaultSkipper,
    HeaderName: "X-Tenant-ID",
    Required:   true,
}

func TenantWithConfig(cfg TenantConfig) echo.MiddlewareFunc {
    if cfg.Skipper == nil {
        cfg.Skipper = middleware.DefaultSkipper
    }
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            if cfg.Skipper(c) {
                return next(c)
            }
            tenantID := c.Request().Header.Get(cfg.HeaderName)
            if tenantID == "" && cfg.Required {
                return echo.NewHTTPError(http.StatusBadRequest, "tenant ID is required")
            }
            c.Set("tenant_id", tenantID)
            return next(c)
        }
    }
}

func Tenant() echo.MiddlewareFunc {
    return TenantWithConfig(DefaultTenantConfig)
}
\`\`\`

## Test File
- Test pass-through when condition is met (next handler is called)
- Test rejection when condition is not met (error returned, next not called)
- Test Skipper bypasses the middleware logic
- Test configurable options change behavior
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.go$" && grep -nE "func\\s+\\w+\\(c\\s+(\\*?echo\\.Context|echo\\.Context)\\)\\s+error\\s*\\{" "$CLAUDE_FILE_PATH" | while read -r line; do linenum=$(echo "$line" | cut -d: -f1); tail -n +"$linenum" "$CLAUDE_FILE_PATH" | head -30 | grep -qE "c\\.JSON\\(.*err\\.Error\\(\\)" && echo "HOOK_EXIT:0:Warning: handler at line $linenum may expose internal error details via err.Error() in JSON response — use echo.NewHTTPError instead" && break; done || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.go$" && grep -nE "echo\\.New\\(\\)" "$CLAUDE_FILE_PATH" | head -1 | while read -r line; do linenum=$(echo "$line" | cut -d: -f1); tail -n +"$linenum" "$CLAUDE_FILE_PATH" | head -50 | grep -qE "HTTPErrorHandler" || echo "HOOK_EXIT:0:Warning: echo.New() created without setting a custom HTTPErrorHandler — consider configuring e.HTTPErrorHandler for consistent error responses"; done || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
