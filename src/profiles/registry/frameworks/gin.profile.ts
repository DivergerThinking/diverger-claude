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

Fast Go HTTP framework. Middleware chains, structured routing with \`gin.Engine\`.

**Detailed rules:** see \`.claude/rules/gin/\` directory.

**Key rules:**
- Route groups for API versioning and middleware scoping
- \`ShouldBindJSON\`/\`ShouldBindQuery\` for input validation with struct tags
- Custom middleware for auth, logging, rate-limiting — use \`c.Next()\` and \`c.Abort()\`
- Structured error responses: consistent JSON shape across all endpoints`,
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
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Gin routing, middleware chain, and request binding patterns',
        content: `# Gin Routing, Middleware & Request Binding

## Route Organization
- Group related routes under a common prefix with \`router.Group()\`
- Apply auth middleware at the group level with \`group.Use()\` — never per-route
- Separate public, protected, and admin route groups with different middleware stacks
- Use handler constructors (closures) that accept service dependencies for DI

## Middleware Chain Order
1. Recovery — \`gin.CustomRecoveryWithWriter()\` to catch panics and return JSON
2. Request ID — assign unique ID per request for tracing
3. Logging — structured request/response logging with latency
4. Security headers — HSTS, X-Content-Type-Options, X-Frame-Options
5. CORS — cross-origin request handling
6. Auth — JWT verification (on protected groups only)
7. Rate limiting — per-endpoint or per-user throttling
8. Error handler — processes \`c.Errors\` after handlers complete

## Middleware Rules
- Use factory pattern: \`func MiddlewareName(opts) gin.HandlerFunc\` for configurable middleware
- Always call \`c.Next()\` on success or \`c.Abort()\`/\`c.AbortWithStatusJSON()\` on failure — never neither
- Custom recovery middleware must return JSON, not Gin's default HTML

## Request Binding & Validation
- Always use \`ShouldBind\` variants (ShouldBindJSON, ShouldBindQuery, ShouldBindUri) — never \`Bind\`/\`MustBindWith\`
- \`Bind\` variants write plain-text 400 responses on failure, removing control over error format
- Use struct tags for validation: \`binding:"required,min=1,max=100"\`
- Bind from multiple sources: ShouldBindUri for path params, ShouldBindJSON for body, ShouldBindQuery for query
- Always check and return structured error responses on binding failure — never discard errors
- Register custom validators via \`binding.Validator.Engine().(*validator.Validate)\`
`,
      },
      {
        path: 'gin/error-handling.md',
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Gin centralized error handling and standard error response patterns',
        content: `# Gin Error Handling

## Application Error Types
- Define a typed \`AppError\` struct with Code (string), Message (string), StatusCode (int), and wrapped Err
- Implement \`Error()\` and \`Unwrap()\` methods for error interface and unwrapping support
- Create constructors: \`NotFound()\`, \`BadRequest()\`, \`Unauthorized()\`, \`Forbidden()\`, \`Conflict()\`, \`Internal()\`
- Service layer returns \`*AppError\` — middleware maps them to HTTP responses

## Centralized Error Middleware
- Use \`c.Error(err)\` in handlers to collect errors, then \`c.Abort()\` to stop the chain
- ErrorHandler middleware calls \`c.Next()\` first, then processes \`c.Errors\` after handlers complete
- Use \`errors.As(err, &appErr)\` to check for known \`AppError\` — return its code and message
- For unknown errors: log with request context (method, path, client IP), return generic 500 message
- Never expose internal error details (stack traces, SQL, file paths) to clients

## Consistent Error Response Envelope
- All errors use: \`{"error": {"code": "...", "message": "..."}}\`
- Validation errors add \`"details"\` array with field-level messages: \`{"field": "...", "message": "..."}\`
- Convert go-playground/validator errors to user-friendly messages per validation tag (required, email, min, max, oneof)
- Never return raw validator strings or inconsistent error shapes across handlers
`,
      },
      {
        path: 'gin/project-structure.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Gin project structure, handler pattern, and production configuration',
        content: `# Gin Project Structure & Production Config

## Recommended Layout
- \`cmd/api/main.go\` — Entry point: config loading, DI wiring, server start
- \`internal/handler/\` — HTTP handlers (Gin-specific) + \`router.go\` for route registration
- \`internal/middleware/\` — Custom Gin middleware (auth, cors, ratelimit, recovery, request_id, error_handler)
- \`internal/service/\` — Business logic (framework-agnostic, no Gin imports)
- \`internal/repository/\` — Data access layer
- \`internal/model/\` — Domain models and request/response DTOs
- \`internal/apperror/\` — Application error types
- \`internal/config/\` — Configuration loading (env, files)

## Handler Pattern
- Handlers are thin: extract data from Gin context, call service, write response
- Use closure constructors: \`func handleCreateOrder(svc OrderService) gin.HandlerFunc\` for DI
- Pass \`c.Request.Context()\` to the service layer — never pass \`*gin.Context\`
- Service layer must have no Gin imports — keep it framework-agnostic
- Use \`c.Error(err)\` + \`c.Abort()\` for service errors (handled by error middleware)

## Production Engine Setup
- Use \`gin.SetMode(gin.ReleaseMode)\` and \`gin.New()\` — NOT \`gin.Default()\`
- Call \`SetTrustedProxies()\` explicitly — default trusts ALL proxies
- Enable \`HandleMethodNotAllowed = true\` with custom NoMethod handler (JSON)
- Configure custom NoRoute handler returning structured JSON 404
- Register global middleware in correct order: recovery -> requestID -> logging -> security headers -> CORS -> error handler

## Graceful Shutdown
- Wrap Gin engine in \`http.Server\` with explicit ReadTimeout, WriteTimeout, IdleTimeout
- Handle SIGINT/SIGTERM with \`signal.Notify\` + \`server.Shutdown(ctx)\`
- Close database pools and connections after server shutdown

## Configuration
- Strongly-typed config struct loaded from environment variables (\`envconfig\`, \`koanf\`, \`viper\`)
- Validate all required fields at startup — fail fast on missing config
- Pass config via dependency injection — never use global mutable state
`,
      },
      {
        path: 'gin/security.md',
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Gin security patterns: trusted proxies, CORS, security headers, rate limiting',
        content: `# Gin Security

## Trusted Proxies
- Call \`SetTrustedProxies()\` explicitly with CIDR ranges — Gin's default trusts ALL proxies
- Without proper config, \`c.ClientIP()\` can be spoofed via X-Forwarded-For
- Use \`SetTrustedProxies(nil)\` when not behind a proxy

## Security Headers
- Add middleware setting: X-Content-Type-Options (nosniff), X-Frame-Options (DENY), CSP, HSTS, Referrer-Policy, Permissions-Policy
- Disable X-XSS-Protection (set to "0") per OWASP — use CSP instead
- Gin does not set these by default — you must add them explicitly

## CORS
- Use \`gin-contrib/cors\` with explicit AllowOrigins — never \`AllowAllOrigins: true\` in production
- Set AllowMethods, AllowHeaders, ExposeHeaders, and MaxAge explicitly
- Never combine \`AllowAllOrigins\` with \`AllowCredentials: true\`

## Rate Limiting
- Apply different limits per route group: strict on auth (10/15min), moderate on API (100/min)
- Use \`http.MaxBytesReader\` middleware to limit request body size and prevent DoS

## Authentication Middleware
- Extract Bearer token from Authorization header, validate JWT, store claims on context
- Use \`c.AbortWithStatusJSON()\` for auth failures — never \`c.JSON()\` without Abort
- Return generic messages ("invalid or expired token") — never expose specific failure reasons
- Set user_id and user_role on context only after successful validation
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Gin-Specific Review

### Engine Configuration
- Verify gin.SetMode(gin.ReleaseMode) is set in production (or GIN_MODE env var)
- Check that SetTrustedProxies() is called explicitly — default trusts ALL proxies
- Verify HandleMethodNotAllowed is enabled with a custom NoMethod handler
- Check that NoRoute returns structured JSON, not the default plain-text 404
- Verify MaxMultipartMemory is set if the app accepts file uploads

### Request Binding
- Check that all binding uses ShouldBind variants (ShouldBindJSON, ShouldBindQuery, ShouldBindUri) — never Bind/BindJSON/MustBindWith
- Verify binding errors are checked and returned as structured validation error responses
- Check for custom validators registered via binding.Validator.Engine()
- Verify path parameters are bound via ShouldBindUri with validation tags, not raw c.Param() without validation

### Middleware
- Verify middleware ordering: recovery -> request ID -> logging -> security headers -> CORS -> auth -> rate limit -> handlers -> error handler
- Check that all middleware calls either c.Next() or c.Abort() — never neither
- Verify c.AbortWithStatusJSON() is used (not just c.JSON()) when stopping the chain in middleware
- Check that custom recovery middleware returns JSON, not the default HTML panic page
- Verify middleware factories are used for configurable middleware instead of hardcoded values

### Error Handling
- Check for centralized error handling via c.Error() + error middleware — not ad-hoc c.JSON() for errors in every handler
- Verify consistent error response envelope: {"error": {"code": "...", "message": "..."}}
- Check that internal error details (stack traces, SQL, file paths) are never exposed to clients
- Verify errors are logged with request context (method, path, client IP, request ID, latency)
- Check that validation errors return structured details (field name + message), not raw validator strings

### Architecture
- Verify Gin context is NOT passed to the service layer — pass c.Request.Context() for cancellation
- Check that handlers are thin: extract request data, call service, write response
- Verify service layer has no gin imports — keep it framework-agnostic
- Check that handler constructors use dependency injection (closures accepting service interfaces)

### Security
- Verify CORS is configured with explicit allowed origins — no AllowAllOrigins in production
- Check for security headers middleware (HSTS, X-Content-Type-Options, X-Frame-Options, CSP)
- Verify rate limiting on authentication endpoints
- Check for request body size limits (http.MaxBytesReader or engine.MaxMultipartMemory)
- Verify auth middleware does not leak specific failure reasons to clients ("invalid token" not "token expired at ...")
- Check that JSON responses use correct HTTP status codes (201 for creation, 204 for deletion)

### Graceful Shutdown
- Verify the Gin engine is wrapped in http.Server with explicit ReadTimeout, WriteTimeout, IdleTimeout
- Check for signal.Notify handling SIGINT/SIGTERM with server.Shutdown()
- Verify database pools and connections are closed after server shutdown

**Available skills:** Use \`gin-handler-generator\` to scaffold new handlers, \`gin-middleware-generator\` for middleware.`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Gin Testing

### Handler Testing Setup
- Set gin.SetMode(gin.TestMode) in TestMain or init to suppress debug output
- Use httptest.NewRecorder() + gin.CreateTestContext(w) for isolated handler tests
- For integration tests, set up a full router with gin.New(), register routes, and use router.ServeHTTP(w, req)

### Handler Unit Tests
\`\`\`go
func TestHandleGetUser_Success(t *testing.T) {
    gin.SetMode(gin.TestMode)
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    c.Request = httptest.NewRequest(http.MethodGet, "/users/123", nil)
    c.Params = gin.Params{{Key: "id", Value: "123"}}

    mockSvc := &MockUserService{user: &User{ID: "123", Name: "Alice"}}
    handler := handleGetUser(mockSvc)
    handler(c)

    assert.Equal(t, http.StatusOK, w.Code)
    var resp map[string]any
    json.Unmarshal(w.Body.Bytes(), &resp)
    assert.Equal(t, "Alice", resp["data"].(map[string]any)["name"])
}
\`\`\`

### Integration Tests with Full Router
\`\`\`go
func TestCreateOrder_Integration(t *testing.T) {
    gin.SetMode(gin.TestMode)
    router := gin.New()
    router.POST("/orders", handleCreateOrder(mockOrderSvc))

    body := \`{"product_id": "abc", "quantity": 2}\`
    req := httptest.NewRequest(http.MethodPost, "/orders", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusCreated, w.Code)
}
\`\`\`

### Coverage Requirements
- Test request binding with valid and invalid payloads — verify 400 responses for bad input
- Test middleware in isolation with minimal router setups — one handler + the middleware under test
- Test auth middleware with valid, invalid, expired, and missing tokens
- Test error cases: binding failures, service errors (not found, conflict, internal), auth failures
- Verify correct HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500)
- Verify consistent JSON response shapes across all endpoints (data envelope, error envelope)
- Mock service layer interfaces — never mock HTTP internals or Gin context directly
- Test route groups: verify auth middleware is applied to protected routes and absent from public routes
- Test NoRoute and NoMethod handlers return structured JSON responses
- Use table-driven tests with t.Run() for handlers with multiple input scenarios

**Available skills:** Use \`gin-handler-generator\` to scaffold handlers with tests, \`gin-middleware-generator\` for middleware with tests.`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Gin Security Audit

### Proxy & IP Trust
- Verify SetTrustedProxies() is called with explicit CIDR ranges — default trusts ALL proxies
- Check that c.ClientIP() is not used for security decisions without trusted proxy configuration
- Verify ForwardedByClientIP behavior matches the deployment topology

### Headers & Transport
- Check for security headers middleware: HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Permissions-Policy
- Verify GIN_MODE is set to "release" in production (not "debug" which may leak internals)
- Check CORS configuration: no AllowAllOrigins with AllowCredentials — this is a CORS misconfiguration

### Request Handling
- Verify request body size is limited (http.MaxBytesReader or MaxMultipartMemory)
- Check that all binding uses ShouldBind variants — Bind variants write uncontrolled error responses
- Verify file upload handlers validate file type, size, and sanitize filenames
- Check for path traversal when handling file paths from user input

### Authentication
- Verify auth middleware uses c.AbortWithStatusJSON — not c.JSON without Abort (allows handler to continue)
- Check that JWT validation pins the expected algorithm (no "alg: none" bypass)
- Verify auth error messages are generic ("invalid or expired token") — no specific failure reasons
- Check that sensitive context values (user_id, role) are set only after successful validation

### Error Exposure
- Verify panic recovery middleware returns JSON, not default HTML
- Check that 500 errors return generic messages — never err.Error() from database, filesystem, or external services
- Verify validation errors do not expose internal struct field names (use json tag names)
- Check that c.Errors are processed by middleware — not left unhandled

**Available skills:** Use \`gin-handler-generator\` to scaffold secure handlers, \`gin-middleware-generator\` for security middleware.`,
      },
    ],
    skills: [
      {
        name: 'gin-handler-generator',
        description: 'Generate Gin HTTP handler with binding, validation, error handling, and test',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Gin Handler Generator

Generate a complete Gin HTTP handler following best practices:

## Handler Function
- Use closure pattern: \`func handleXxx(svc Service) gin.HandlerFunc\` for dependency injection
- Bind request data with ShouldBindJSON / ShouldBindQuery / ShouldBindUri (NEVER Bind variants)
- Use struct tags for validation: \`binding:"required,min=1,max=100"\`
- Return structured validation errors with field-level detail on binding failure
- Delegate all business logic to the service layer via interface
- Use c.Error(err) + c.Abort() for service errors (handled by error middleware)
- Return correct HTTP status: 200 OK, 201 Created, 204 No Content

## Request/Response Types
- Define request struct with binding/validation tags per source (json, uri, form, query)
- Define response struct with json tags — use typed structs, not gin.H, for documented endpoints

## Route Registration
- Register in the appropriate route group with the correct HTTP method
- Apply middleware (auth, rate limit) at the group level

## Unit Test
- gin.SetMode(gin.TestMode)
- Use httptest.NewRecorder() + gin.CreateTestContext() for isolated handler tests
- Test success path, binding failure, and service error cases
- Mock the service interface — not HTTP internals
- Assert HTTP status code and JSON response shape
`,
      },
      {
        name: 'gin-middleware-generator',
        description: 'Generate Gin middleware with factory pattern, context handling, and test',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Gin Middleware Generator

Generate a Gin middleware following best practices:

## Middleware Implementation
- Use the factory pattern: \`func MiddlewareName(opts Options) gin.HandlerFunc\`
- Always call c.Next() on success or c.Abort() / c.AbortWithStatusJSON() on failure — never neither
- Use c.Set() to pass data to downstream handlers, c.Get() / c.MustGet() to retrieve
- For error responses, always use c.AbortWithStatusJSON() — not c.JSON() without Abort

## Common Patterns
- **Auth middleware**: extract token from header, validate, set user claims on context, abort on failure
- **Rate limiter**: check rate by c.ClientIP() or user ID, abort with 429 on excess
- **Request ID**: generate UUID, set on context and response header
- **Logging**: capture start time, call c.Next(), log method/path/status/latency after response
- **Error handler**: call c.Next(), then process c.Errors with type switching on AppError

## Unit Test
- Create gin.CreateTestContext(w) with httptest.NewRecorder()
- Chain the middleware with a simple test handler
- Test both success (middleware calls next, handler executes) and failure (middleware aborts, handler skipped)
- Verify response status, headers, and body
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
            statusMessage: 'Checking for Bind/MustBindWith usage instead of ShouldBind in Gin code',
            command:
              'f=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -z "$f" ] && exit 0; case "$f" in *.go) grep -nE "\\.(Bind|BindJSON|BindQuery|BindUri|BindHeader|BindYAML|BindXML|MustBindWith)\\(" "$f" 2>/dev/null | grep -v "ShouldBind" | grep -v "^$" && { echo "WARNING: Use ShouldBind variants instead of Bind/MustBindWith — Bind aborts with plain-text 400 on failure, removing control over error response format" >&2; exit 2; } || exit 0 ;; *) exit 0 ;; esac',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            statusMessage: 'Checking for c.JSON() error responses without c.Abort() in Gin code',
            command:
              'f=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -z "$f" ] && exit 0; case "$f" in *.go) grep -nE "c\\.JSON\\(" "$f" 2>/dev/null | grep -v "AbortWithStatusJSON" | grep -vE "c\\.JSON\\(http\\.Status(OK|Created|NoContent|Accepted)" | grep -E "c\\.JSON\\(http\\.Status(BadRequest|Unauthorized|Forbidden|NotFound|InternalServerError|Conflict|UnprocessableEntity|TooManyRequests|MethodNotAllowed)" | head -3 && { echo "WARNING: Consider using c.AbortWithStatusJSON() for error responses in middleware, or c.Error(err)+c.Abort() for centralized error handling" >&2; exit 2; } || exit 0 ;; *) exit 0 ;; esac',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            statusMessage: 'Checking for gin.Default() usage in Gin code',
            command:
              'f=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -z "$f" ] && exit 0; case "$f" in *.go) grep -nE "gin\\.Default\\(\\)" "$f" 2>/dev/null && { echo "WARNING: gin.Default() includes Logger+Recovery with default settings. In production, use gin.New() with explicitly configured middleware for control over logging format and panic recovery behavior" >&2; exit 2; } || exit 0 ;; *) exit 0 ;; esac',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
