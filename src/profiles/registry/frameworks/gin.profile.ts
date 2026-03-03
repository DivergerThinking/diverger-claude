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

Group related routes under a common prefix with \`router.Group()\`. Apply shared middleware at the group level.

### Correct
\`\`\`go
func SetupRoutes(r *gin.Engine, userSvc UserService, orderSvc OrderService) {
    // Public routes — no auth required
    public := r.Group("/api/v1")
    {
        public.POST("/auth/login", handleLogin(userSvc))
        public.POST("/auth/register", handleRegister(userSvc))
    }

    // Protected routes — auth middleware applied once at the group level
    protected := r.Group("/api/v1")
    protected.Use(AuthMiddleware())
    {
        protected.GET("/users/:id", handleGetUser(userSvc))
        protected.PUT("/users/:id", handleUpdateUser(userSvc))
        protected.GET("/orders", handleListOrders(orderSvc))
        protected.POST("/orders", handleCreateOrder(orderSvc))
    }

    // Admin routes — auth + admin role middleware
    admin := r.Group("/api/v1/admin")
    admin.Use(AuthMiddleware(), RequireRole("admin"))
    {
        admin.GET("/users", handleListAllUsers(userSvc))
        admin.DELETE("/users/:id", handleDeleteUser(userSvc))
    }
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: auth middleware applied per-route — inconsistent, easy to forget
r.GET("/api/v1/users/:id", AuthMiddleware(), handleGetUser(svc))
r.PUT("/api/v1/users/:id", AuthMiddleware(), handleUpdateUser(svc))
r.GET("/api/v1/orders", AuthMiddleware(), handleListOrders(svc))
// Oops: forgot auth on this one — security hole
r.POST("/api/v1/orders", handleCreateOrder(svc))
\`\`\`

---

## Middleware Patterns

### Middleware Chain Order
Register global middleware in this order for correct behavior:
1. **Recovery** — \`gin.CustomRecoveryWithWriter()\` to catch panics and return JSON
2. **Request ID** — assign a unique ID to each request for tracing
3. **Logging** — structured request/response logging with latency
4. **Security headers** — HSTS, X-Content-Type-Options, X-Frame-Options
5. **CORS** — cross-origin request handling
6. **Auth** — JWT verification, session hydration (on protected groups)
7. **Rate limiting** — per-endpoint or per-user throttling
8. **Handlers** — actual route handlers

### Middleware Factory Pattern
\`\`\`go
// RateLimit returns a middleware that limits requests per IP per window.
func RateLimit(maxRequests int, window time.Duration) gin.HandlerFunc {
    limiter := newIPRateLimiter(maxRequests, window)
    return func(c *gin.Context) {
        if !limiter.Allow(c.ClientIP()) {
            c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
                "error": gin.H{
                    "code":    "RATE_LIMITED",
                    "message": "too many requests, try again later",
                },
            })
            return
        }
        c.Next()
    }
}
\`\`\`

### Custom Recovery Middleware
\`\`\`go
func JSONRecovery() gin.HandlerFunc {
    return gin.CustomRecoveryWithWriter(gin.DefaultErrorWriter, func(c *gin.Context, err any) {
        slog.ErrorContext(c.Request.Context(), "panic recovered",
            slog.Any("error", err),
            slog.String("path", c.Request.URL.Path),
            slog.String("method", c.Request.Method),
        )
        c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
            "error": gin.H{
                "code":    "INTERNAL_ERROR",
                "message": "an unexpected error occurred",
            },
        })
    })
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: middleware that does not call c.Next() or c.Abort() — request hangs
func BrokenMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.JSON(401, gin.H{"error": "unauthorized"}) // Missing c.Abort()!
            // Execution continues to the next handler despite the 401 response
        }
        // Missing c.Next() on the success path — subsequent handlers never run
    }
}
\`\`\`

---

## Request Binding & Validation

### ShouldBind vs Bind
Always use \`ShouldBind\` variants. The \`Bind\` / \`MustBindWith\` variants call \`c.AbortWithError(400, err)\` on failure, which writes a plain-text response and removes your ability to format the error.

### Multi-Source Binding
\`\`\`go
type UpdateUserRequest struct {
    // Path parameter — bound via ShouldBindUri
    ID string \`uri:"id" binding:"required,uuid"\`
}

type UpdateUserBody struct {
    Name  string \`json:"name" binding:"omitempty,min=1,max=100"\`
    Email string \`json:"email" binding:"omitempty,email"\`
    Role  string \`json:"role" binding:"omitempty,oneof=user admin editor"\`
}

func handleUpdateUser(svc UserService) gin.HandlerFunc {
    return func(c *gin.Context) {
        var params UpdateUserRequest
        if err := c.ShouldBindUri(&params); err != nil {
            c.JSON(http.StatusBadRequest, newValidationErrorResponse(err))
            return
        }

        var body UpdateUserBody
        if err := c.ShouldBindJSON(&body); err != nil {
            c.JSON(http.StatusBadRequest, newValidationErrorResponse(err))
            return
        }

        user, err := svc.UpdateUser(c.Request.Context(), params.ID, body)
        if err != nil {
            handleServiceError(c, err)
            return
        }
        c.JSON(http.StatusOK, gin.H{"data": user})
    }
}
\`\`\`

### Custom Validator Registration
\`\`\`go
import "github.com/go-playground/validator/v10"

func RegisterCustomValidators(engine *gin.Engine) {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        _ = v.RegisterValidation("slug", func(fl validator.FieldLevel) bool {
            return regexp.MustCompile(\`^[a-z0-9]+(-[a-z0-9]+)*$\`).MatchString(fl.Field().String())
        })
    }
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: uses BindJSON which aborts and writes plain-text on failure
func handleCreateUser(c *gin.Context) {
    var req CreateUserRequest
    c.BindJSON(&req) // If binding fails, writes "400 Bad Request" as text and aborts
    // Code below is unreachable on binding error — but you have no control over the response format
}

// Bad: ignores binding error entirely
func handleCreateUser2(c *gin.Context) {
    var req CreateUserRequest
    _ = c.ShouldBindJSON(&req) // Error discarded — proceeds with zero-value struct
    svc.Create(req)            // Creates user with empty fields
}
\`\`\`
`,
      },
      {
        path: 'gin/error-handling.md',
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Gin centralized error handling and standard error response patterns',
        content: `# Gin Error Handling

## Application Error Types
Define typed errors with HTTP status codes so middleware can map them consistently.

\`\`\`go
package apperror

import "net/http"

// AppError represents an application-level error with an HTTP status code.
type AppError struct {
    Code       string \`json:"code"\`
    Message    string \`json:"message"\`
    StatusCode int    \`json:"-"\`
    Err        error  \`json:"-"\`
}

func (e *AppError) Error() string { return e.Message }
func (e *AppError) Unwrap() error { return e.Err }

func NotFound(msg string) *AppError {
    return &AppError{Code: "NOT_FOUND", Message: msg, StatusCode: http.StatusNotFound}
}

func BadRequest(msg string) *AppError {
    return &AppError{Code: "BAD_REQUEST", Message: msg, StatusCode: http.StatusBadRequest}
}

func Unauthorized(msg string) *AppError {
    return &AppError{Code: "UNAUTHORIZED", Message: msg, StatusCode: http.StatusUnauthorized}
}

func Forbidden(msg string) *AppError {
    return &AppError{Code: "FORBIDDEN", Message: msg, StatusCode: http.StatusForbidden}
}

func Conflict(msg string) *AppError {
    return &AppError{Code: "CONFLICT", Message: msg, StatusCode: http.StatusConflict}
}

func Internal(msg string, err error) *AppError {
    return &AppError{Code: "INTERNAL_ERROR", Message: msg, StatusCode: http.StatusInternalServerError, Err: err}
}
\`\`\`

---

## Centralized Error Middleware
Use \`c.Error()\` to collect errors during request processing and handle them in a single middleware.

\`\`\`go
// ErrorHandler processes errors collected via c.Error() after handlers complete.
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next() // Process the request first

        if len(c.Errors) == 0 {
            return
        }

        // Take the last error (most specific)
        err := c.Errors.Last().Err

        var appErr *apperror.AppError
        if errors.As(err, &appErr) {
            // Known application error — safe to expose
            c.JSON(appErr.StatusCode, gin.H{
                "error": gin.H{
                    "code":    appErr.Code,
                    "message": appErr.Message,
                },
            })
        } else {
            // Unknown error — log details, return generic message
            slog.ErrorContext(c.Request.Context(), "unhandled error",
                slog.String("error", err.Error()),
                slog.String("path", c.Request.URL.Path),
                slog.String("method", c.Request.Method),
                slog.String("client_ip", c.ClientIP()),
            )
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": gin.H{
                    "code":    "INTERNAL_ERROR",
                    "message": "an unexpected error occurred",
                },
            })
        }
    }
}
\`\`\`

### Using c.Error() in Handlers
\`\`\`go
func handleGetUser(svc UserService) gin.HandlerFunc {
    return func(c *gin.Context) {
        user, err := svc.GetUser(c.Request.Context(), c.Param("id"))
        if err != nil {
            _ = c.Error(err) // Collected by ErrorHandler middleware
            c.Abort()
            return
        }
        c.JSON(http.StatusOK, gin.H{"data": user})
    }
}
\`\`\`

---

## Validation Error Formatting
Convert go-playground/validator errors into structured API responses.

\`\`\`go
type ValidationErrorDetail struct {
    Field   string \`json:"field"\`
    Message string \`json:"message"\`
}

func newValidationErrorResponse(err error) gin.H {
    var ve validator.ValidationErrors
    if errors.As(err, &ve) {
        details := make([]ValidationErrorDetail, len(ve))
        for i, fe := range ve {
            details[i] = ValidationErrorDetail{
                Field:   fe.Field(),
                Message: formatFieldError(fe),
            }
        }
        return gin.H{
            "error": gin.H{
                "code":    "VALIDATION_ERROR",
                "message": "request validation failed",
                "details": details,
            },
        }
    }
    return gin.H{
        "error": gin.H{
            "code":    "BAD_REQUEST",
            "message": err.Error(),
        },
    }
}

func formatFieldError(fe validator.FieldError) string {
    switch fe.Tag() {
    case "required":
        return "this field is required"
    case "email":
        return "must be a valid email address"
    case "min":
        return fmt.Sprintf("must be at least %s characters", fe.Param())
    case "max":
        return fmt.Sprintf("must be at most %s characters", fe.Param())
    case "oneof":
        return fmt.Sprintf("must be one of: %s", fe.Param())
    default:
        return fmt.Sprintf("failed on '%s' validation", fe.Tag())
    }
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: inconsistent error shapes across handlers
func handler1(c *gin.Context) {
    c.JSON(400, gin.H{"error": "bad request"})              // String error
}
func handler2(c *gin.Context) {
    c.JSON(400, gin.H{"message": "invalid input"})          // Different key
}
func handler3(c *gin.Context) {
    c.JSON(500, gin.H{"err": err.Error(), "stack": debug.Stack()}) // Leaks internals
}
\`\`\`
`,
      },
      {
        path: 'gin/project-structure.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Gin project structure, handler pattern, and production configuration',
        content: `# Gin Project Structure & Production Config

## Recommended Layout
\`\`\`
cmd/
  api/
    main.go                   # Entry point: config loading, DI wiring, server start
internal/
  handler/                    # HTTP handlers (Gin-specific)
    user_handler.go
    order_handler.go
    router.go                 # Route registration, route groups, middleware wiring
  middleware/                  # Custom Gin middleware
    auth.go
    cors.go
    ratelimit.go
    recovery.go
    request_id.go
    error_handler.go
  service/                    # Business logic (framework-agnostic, no Gin imports)
    user_service.go
    order_service.go
  repository/                 # Data access layer
    user_repo.go
    order_repo.go
  model/                      # Domain models and request/response DTOs
    user.go
    order.go
  apperror/                   # Application error types
    errors.go
  config/                     # Configuration loading (env, files)
    config.go
pkg/                          # Reusable library code (optional)
\`\`\`

---

## Handler Pattern
Handlers are thin — they extract data from the Gin context, call a service, and write the response.
Use handler constructors (closures) that accept service dependencies.

### Correct
\`\`\`go
// handleCreateOrder returns a handler that delegates to the order service.
func handleCreateOrder(svc OrderService) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req CreateOrderRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, newValidationErrorResponse(err))
            return
        }

        order, err := svc.Create(c.Request.Context(), req)
        if err != nil {
            _ = c.Error(err)
            c.Abort()
            return
        }

        c.JSON(http.StatusCreated, gin.H{"data": order})
    }
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: handler contains business logic and DB access — untestable, tightly coupled
func handleCreateOrder(c *gin.Context) {
    var req CreateOrderRequest
    c.BindJSON(&req)

    // Business logic in handler — should be in service layer
    if req.Quantity > 100 {
        req.Discount = 0.1
    }

    // Direct DB access in handler — should be in repository layer
    result := db.Create(&Order{
        UserID:   req.UserID,
        Quantity: req.Quantity,
        Discount: req.Discount,
    })
    if result.Error != nil {
        c.JSON(500, gin.H{"error": result.Error.Error()}) // Leaks DB error to client
        return
    }
    c.JSON(200, result.Value) // Wrong status: should be 201 for creation
}
\`\`\`

---

## Production Engine Setup

\`\`\`go
func NewEngine(cfg *config.Config) *gin.Engine {
    gin.SetMode(gin.ReleaseMode)

    engine := gin.New() // NOT gin.Default() — we configure middleware explicitly

    // Trusted proxies — critical for correct c.ClientIP()
    if len(cfg.TrustedProxies) > 0 {
        _ = engine.SetTrustedProxies(cfg.TrustedProxies)
    } else {
        _ = engine.SetTrustedProxies(nil) // No proxy — use remote addr directly
    }

    // 405 Method Not Allowed support
    engine.HandleMethodNotAllowed = true
    engine.NoMethod(func(c *gin.Context) {
        c.JSON(http.StatusMethodNotAllowed, gin.H{
            "error": gin.H{"code": "METHOD_NOT_ALLOWED", "message": "method not allowed"},
        })
    })

    // Custom 404 — structured JSON instead of plain text
    engine.NoRoute(func(c *gin.Context) {
        c.JSON(http.StatusNotFound, gin.H{
            "error": gin.H{"code": "NOT_FOUND", "message": "route not found"},
        })
    })

    // Global middleware in correct order
    engine.Use(
        JSONRecovery(),
        RequestIDMiddleware(),
        LoggingMiddleware(cfg.Logger),
        SecurityHeadersMiddleware(),
        CORSMiddleware(cfg.AllowedOrigins),
        ErrorHandler(),
    )

    return engine
}
\`\`\`

---

## Graceful Shutdown

\`\`\`go
func Run(engine *gin.Engine, cfg *config.Config) error {
    srv := &http.Server{
        Addr:         ":" + cfg.Port,
        Handler:      engine,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    // Start server in a goroutine
    errCh := make(chan error, 1)
    go func() {
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            errCh <- fmt.Errorf("server listen: %w", err)
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    select {
    case sig := <-quit:
        slog.Info("shutdown signal received", slog.String("signal", sig.String()))
    case err := <-errCh:
        return err
    }

    // Graceful shutdown with 30-second deadline
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        return fmt.Errorf("server shutdown: %w", err)
    }

    slog.Info("server stopped gracefully")
    return nil
}
\`\`\`

---

## Configuration
- Load configuration from environment variables or config files (\`viper\`, \`envconfig\`, \`koanf\`)
- Create a strongly-typed config struct — validate all required fields at startup
- Pass config via dependency injection — never use global mutable state
- Use build tags or separate config files for environment-specific settings (dev, staging, prod)

\`\`\`go
type Config struct {
    Port           string   \`env:"PORT" envDefault:"8080"\`
    GinMode        string   \`env:"GIN_MODE" envDefault:"release"\`
    TrustedProxies []string \`env:"TRUSTED_PROXIES" envSeparator:","\`
    AllowedOrigins []string \`env:"ALLOWED_ORIGINS" envSeparator:","\`
    DatabaseURL    string   \`env:"DATABASE_URL,required"\`
    JWTSecret      string   \`env:"JWT_SECRET,required"\`
    ReadTimeout    time.Duration \`env:"READ_TIMEOUT" envDefault:"5s"\`
    WriteTimeout   time.Duration \`env:"WRITE_TIMEOUT" envDefault:"10s"\`
}
\`\`\`
`,
      },
      {
        path: 'gin/security.md',
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Gin security patterns: trusted proxies, CORS, security headers, rate limiting',
        content: `# Gin Security

## Trusted Proxies
Gin trusts all proxies by default — \`c.ClientIP()\` may return a spoofed IP from the X-Forwarded-For header.

### Correct
\`\`\`go
// Explicit trusted proxy CIDRs — only these sources are trusted for forwarded headers
_ = engine.SetTrustedProxies([]string{"10.0.0.0/8", "172.16.0.0/12"})

// No proxy — disable trusted proxies entirely
_ = engine.SetTrustedProxies(nil)
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: trusts ALL proxies (Gin's default behavior) — c.ClientIP() can be spoofed
engine := gin.Default() // No SetTrustedProxies call — every proxy is trusted
\`\`\`

---

## Security Headers Middleware
Add security headers that Gin does not set by default.

\`\`\`go
func SecurityHeadersMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-Frame-Options", "DENY")
        c.Header("X-XSS-Protection", "0") // Disabled per OWASP — use CSP instead
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        c.Header("Content-Security-Policy", "default-src 'self'")
        c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        c.Next()
    }
}
\`\`\`

---

## CORS Middleware
Never use wildcard origins in production. Use \`gin-contrib/cors\` or a custom middleware.

\`\`\`go
import "github.com/gin-contrib/cors"

func CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
    return cors.New(cors.Config{
        AllowOrigins:     allowedOrigins,
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Request-ID"},
        ExposeHeaders:    []string{"Content-Length", "X-Request-ID"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    })
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: allows all origins — any site can make authenticated requests
cors.New(cors.Config{
    AllowAllOrigins:  true,          // Security hole with credentials
    AllowCredentials: true,
})
\`\`\`

---

## Rate Limiting
Protect auth endpoints and public APIs from abuse.

\`\`\`go
// Apply different rate limits per route group
authRoutes.Use(RateLimit(10, 15*time.Minute))   // 10 attempts per 15 min for login
apiRoutes.Use(RateLimit(100, 1*time.Minute))     // 100 req/min for general API
\`\`\`

---

## Request Size Limiting
Limit request body size to prevent denial-of-service via large payloads.

\`\`\`go
func MaxBodySize(maxBytes int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
        c.Next()
    }
}

// Apply: 1 MB limit
engine.Use(MaxBodySize(1 << 20))
\`\`\`

---

## Authentication Middleware Pattern
\`\`\`go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": gin.H{"code": "UNAUTHORIZED", "message": "missing authorization header"},
            })
            return
        }

        // Strip "Bearer " prefix
        token = strings.TrimPrefix(token, "Bearer ")

        claims, err := validateJWT(token)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": gin.H{"code": "UNAUTHORIZED", "message": "invalid or expired token"},
            })
            return
        }

        // Store claims for downstream handlers
        c.Set("user_id", claims.UserID)
        c.Set("user_role", claims.Role)
        c.Next()
    }
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: exposes why authentication failed — helps attackers
func BadAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims, err := validateJWT(c.GetHeader("Authorization"))
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{
                "error": err.Error(), // "token expired at 2025-01-15" — info leak
            })
            return
        }
        c.Set("claims", claims)
        c.Next()
    }
}
\`\`\`
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
            command:
              'f="$CLAUDE_FILE_PATH"; case "$f" in *.go) grep -nE "\\.(Bind|BindJSON|BindQuery|BindUri|BindHeader|BindYAML|BindXML|MustBindWith)\\(" "$f" 2>/dev/null | grep -v "ShouldBind" | grep -v "^$" && echo "HOOK_EXIT:0:WARNING: Use ShouldBind variants instead of Bind/MustBindWith — Bind aborts with plain-text 400 on failure, removing control over error response format" || true ;; *) true ;; esac',
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
            command:
              'f="$CLAUDE_FILE_PATH"; case "$f" in *.go) grep -nE "c\\.JSON\\(" "$f" 2>/dev/null | grep -v "AbortWithStatusJSON" | grep -vE "c\\.JSON\\(http\\.Status(OK|Created|NoContent|Accepted)" | grep -E "c\\.JSON\\(http\\.Status(BadRequest|Unauthorized|Forbidden|NotFound|InternalServerError|Conflict|UnprocessableEntity|TooManyRequests|MethodNotAllowed)" | head -3 && echo "HOOK_EXIT:0:WARNING: Consider using c.AbortWithStatusJSON() for error responses in middleware, or c.Error(err)+c.Abort() for centralized error handling" || true ;; *) true ;; esac',
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
            command:
              'f="$CLAUDE_FILE_PATH"; case "$f" in *.go) grep -nE "gin\\.Default\\(\\)" "$f" 2>/dev/null && echo "HOOK_EXIT:0:WARNING: gin.Default() includes Logger+Recovery with default settings. In production, use gin.New() with explicitly configured middleware for control over logging format and panic recovery behavior" || true ;; *) true ;; esac',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
