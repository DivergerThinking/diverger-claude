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
- Group related routes with \`e.Group()\`, apply auth middleware at the group level
- Use RESTful conventions: GET reads, POST creates, PUT full updates, PATCH partial, DELETE removals
- Keep handlers thin: extract request data, call service, write response
- Name routes for URL generation: \`e.GET("/users/:id", getUser).Name = "get-user"\`
- Prefer separate handler functions over anonymous closures for testability

## Middleware Composition
- Global: \`e.Use()\`, group: \`g.Use()\`, per-route: extra args to route registration
- Use \`echo.MiddlewareFunc\` signature, call \`next(c)\` to proceed — never forget
- Use Skipper pattern for conditional bypass

## Recommended Middleware Order
1. Recover — catch panics
2. RequestID — inject X-Request-ID for tracing
3. Logger / RequestLoggerWithConfig — structured access logs
4. CORS / CORSWithConfig — cross-origin policy
5. Secure / SecureWithConfig — security headers
6. RateLimiter — request throttling
7. ContextTimeoutWithConfig — handler-level timeouts (v4.12+)
8. Auth middleware (at the group level)

## Request Binding & Validation
- Use \`c.Bind()\` for automatic binding (JSON, XML, form), then \`c.Validate()\` for struct validation
- Register a custom validator implementing \`echo.Validator\` (go-playground/validator/v10)
- Return \`echo.NewHTTPError(http.StatusBadRequest, details)\` on failure
- Never parse raw body manually — use binding

## Error Handling
- Return errors from handlers — Echo routes them to \`HTTPErrorHandler\`
- Use \`echo.NewHTTPError(status, message)\` for HTTP errors
- Use \`.SetInternal(err)\` to attach original error for logging without client exposure
- Customize \`e.HTTPErrorHandler\` for consistent JSON envelope: \`{"code": int, "message": "...", "request_id": "..."}\`
- Map domain sentinel errors to HTTP status codes in the error handler
- Never expose internal details, stack traces, or file paths
`,
      },
      {
        path: 'echo/project-structure.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Echo project structure, layered architecture, and dependency injection',
        content: `# Echo Project Structure

## Recommended Layout
- \`cmd/api/main.go\` — Entry point: wire deps, start server
- \`internal/handler/\` — HTTP handlers (Echo-specific) + handler tests
- \`internal/service/\` — Business logic (framework-agnostic, no Echo imports)
- \`internal/repository/\` — Data access layer
- \`internal/middleware/\` — Custom Echo middleware
- \`internal/model/\` — Domain models, DTOs, sentinel errors
- \`internal/validator/\` — Custom echo.Validator implementation

## Handler Pattern
- Handler structs accept service interfaces via constructors
- Handlers: extract from \`echo.Context\`, call service with \`c.Request().Context()\`, write response
- Never import \`echo\` in service or repository packages
- Map domain errors to \`echo.NewHTTPError()\`: ErrNotFound -> 404, etc.
- Use \`.SetInternal(err)\` to attach original error for server-side logging
- Register routes in a dedicated function receiving the Echo instance and handler

## Configuration & Startup
- Load config from environment (envconfig, koanf, viper) into a typed struct
- Wire all dependencies in main.go — the only place that knows all concrete types
- Set \`e.HTTPErrorHandler\` for consistent JSON error envelope
- Never use global mutable state for configuration

## Graceful Shutdown
- Start server in goroutine, handle SIGINT/SIGTERM, call \`e.Shutdown(ctx)\`
- Set explicit ReadTimeout, WriteTimeout, IdleTimeout on \`e.Server\`

## Custom Context
- Prefer \`c.Set()\`/\`c.Get()\` for request-scoped data (logger, user, tenant)
- Extend \`echo.Context\` only when type-safe access is needed — register custom context middleware first
`,
      },
      {
        path: 'echo/testing-patterns.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Echo handler testing, middleware testing, and integration test patterns',
        content: `# Echo Testing Patterns

## Handler Unit Tests
- Use \`httptest.NewRequest()\` + \`httptest.NewRecorder()\` + \`e.NewContext()\`
- Set path params with \`c.SetParamNames()\` and \`c.SetParamValues()\`
- Mock service interfaces — never mock HTTP internals or Echo itself
- Use table-driven tests with \`t.Run()\` for multiple scenarios
- Test: success path, not found, validation error, service error, empty/missing params
- Check returned \`echo.HTTPError\` with \`errors.As(err, &he)\` for error code and message
- Verify response body by unmarshaling \`rec.Body\`

## Middleware Tests
- Test in isolation with a minimal \`echo.HandlerFunc\` that records whether it was called
- Verify pass-through: middleware calls \`next(c)\` on success, handler executes
- Verify rejection: middleware returns error or aborts chain on failure
- Test Skipper function if middleware supports conditional bypass
- Test both allowed and rejected scenarios (valid vs invalid auth tokens)

## Integration Tests
- Create full Echo instance with all middleware and routes: \`httptest.NewServer(e)\`
- Test full pipeline: middleware -> handler -> service -> response
- Verify middleware ordering produces expected headers (X-Request-Id, CORS, security headers)
- Test error pipeline: handler error -> HTTPErrorHandler -> response envelope
- Verify internal errors are NOT exposed in response body
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
            statusMessage: 'Checking for internal error exposure in Echo JSON responses',
            command:
              'FILE_PATH=$(cat | node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.go$" && grep -nE "func\\s+\\w+\\(c\\s+(\\*?echo\\.Context|echo\\.Context)\\)\\s+error\\s*\\{" "$FILE_PATH" | while read -r line; do linenum=$(echo "$line" | cut -d: -f1); tail -n +"$linenum" "$FILE_PATH" | head -30 | grep -qE "c\\.JSON\\(.*err\\.Error\\(\\)" && { echo "Warning: handler at line $linenum may expose internal error details via err.Error() in JSON response — use echo.NewHTTPError instead" >&2; exit 2; }; done || exit 0',
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
            statusMessage: 'Checking for missing HTTPErrorHandler in Echo setup',
            command:
              'FILE_PATH=$(cat | node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.go$" && grep -nE "echo\\.New\\(\\)" "$FILE_PATH" | head -1 | while read -r line; do linenum=$(echo "$line" | cut -d: -f1); tail -n +"$linenum" "$FILE_PATH" | head -50 | grep -qE "HTTPErrorHandler" || { echo "Warning: echo.New() created without setting a custom HTTPErrorHandler — consider configuring e.HTTPErrorHandler for consistent error responses" >&2; exit 2; }; done || exit 0',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
