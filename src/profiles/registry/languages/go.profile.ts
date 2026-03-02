import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const goProfile: Profile = {
  id: 'languages/go',
  name: 'Go',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['go'],
  contributions: {
    claudeMd: [
      {
        heading: 'Go Conventions',
        order: 10,
        content: `## Go Conventions

- Follow Effective Go, Go Code Review Comments, and the Google Go Style Guide
- Use \`gofmt\` / \`goimports\` for formatting — never deviate from standard formatting
- Handle every returned error — never discard errors with \`_\`
- Return \`error\` instead of panicking — reserve \`panic\` for truly unrecoverable programmer bugs
- Accept interfaces, return concrete structs — keep interfaces small (1-3 methods)
- Define interfaces at the consumer, not the implementer
- Use \`context.Context\` as the first parameter for cancellation, deadlines, and request-scoped values
- Prefer composition via struct embedding over deep type hierarchies
- Use goroutines and channels for concurrent operations; protect shared state with \`sync.Mutex\`
- Use \`log/slog\` (Go 1.21+) for structured logging with key-value pairs
- Use generics judiciously — prefer concrete types or interfaces when they suffice
- Run \`go vet\`, \`staticcheck\`, and \`golangci-lint\` before every commit`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(go:*)',
          'Bash(go build:*)',
          'Bash(go test:*)',
          'Bash(go run:*)',
          'Bash(go vet:*)',
          'Bash(go mod:*)',
          'Bash(go generate:*)',
          'Bash(golangci-lint:*)',
          'Bash(staticcheck:*)',
          'Bash(govulncheck:*)',
          'Bash(dlv:*)',
        ],
      },
    },
    rules: [
      {
        path: 'go/conventions.md',
        governance: 'mandatory',
        description: 'Go coding conventions from Effective Go, Code Review Comments, and Google Style Guide',
        content: `# Go Conventions

## Naming (Effective Go + Code Review Comments)

### Exported vs Unexported
- Exported identifiers: PascalCase (\`UserService\`, \`GetUser\`, \`ErrNotFound\`)
- Unexported identifiers: camelCase (\`userRepo\`, \`handleRequest\`, \`defaultTimeout\`)

### Packages
- Short, lowercase, single-word — no underscores, no mixedCaps (\`http\`, \`user\`, \`auth\`)
- Name by what it provides, not what it contains — \`transport\` not \`transportUtils\`
- Avoid stutter: \`http.Client\` not \`http.HTTPClient\`; \`user.New()\` not \`user.NewUser()\`

### Interfaces
- Name by behavior; use -er suffix for single-method interfaces (\`Reader\`, \`Writer\`, \`Stringer\`)
- Multi-method interfaces describe capability: \`ReadWriter\`, \`FileSystem\`
- Never prefix with \`I\` — Go does not use \`IReader\`

### Acronyms and Initialisms
- All-caps for acronyms: \`HTTPClient\`, \`userID\`, \`xmlParser\`, \`URL\`
- When unexported, all-lowercase: \`httpClient\`, \`urlPath\`

### Receivers
- Short (1-2 letter), consistent abbreviation of the type name: \`s\` for \`Server\`, \`c\` for \`Client\`
- Never use \`self\` or \`this\`
- Be consistent within a type — all methods use the same receiver name

### Correct
\`\`\`go
package auth

// TokenValidator validates authentication tokens.
type TokenValidator interface {
    Validate(ctx context.Context, token string) (Claims, error)
}

type service struct {
    repo    Repository
    logger  *slog.Logger
}

func (s *service) Authenticate(ctx context.Context, creds Credentials) (*User, error) {
    // ...
}
\`\`\`

### Anti-Pattern
\`\`\`go
package auth_utils // Bad: underscore in package name

type ITokenValidator interface { // Bad: I-prefix on interface
    ValidateToken(token string) bool // Bad: no context, no error return
}

type AuthService struct { // Bad: stutters as auth.AuthService
    self *AuthService // Bad: self reference
}

func (self *AuthService) DoAuth(creds interface{}) { // Bad: self receiver, empty interface, no error
}
\`\`\`

---

## Error Handling (Effective Go + Code Review Comments)

### Return and Check Errors
- Always check returned errors — never assign to \`_\`
- Return early on error to keep the "happy path" unindented (indent error flow)
- Wrap errors with context using \`fmt.Errorf("operation failed: %w", err)\`

### Error Types and Sentinel Errors
- Define sentinel errors for expected conditions: \`var ErrNotFound = errors.New("not found")\`
- Use custom error types only when callers need structured data from the error
- Use \`errors.Is()\` for sentinel comparison and \`errors.As()\` for type assertion
- Error strings are lowercase, no punctuation — they often get composed

### Correct
\`\`\`go
func (s *service) GetUser(ctx context.Context, id string) (*User, error) {
    if id == "" {
        return nil, fmt.Errorf("get user: %w", ErrInvalidInput)
    }

    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("get user %q: %w", id, ErrNotFound)
        }
        return nil, fmt.Errorf("get user %q: %w", id, err)
    }

    return user, nil
}
\`\`\`

### Anti-Pattern
\`\`\`go
func (s *service) GetUser(ctx context.Context, id string) *User {
    user, _ := s.repo.FindByID(ctx, id)  // Bad: discarded error
    return user
}

func (s *service) GetUser2(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err == nil {                        // Bad: non-error path is indented
        if user.Active {
            return user, nil
        }
        return nil, ErrInactive
    }
    return nil, err                        // Bad: error path at bottom, hard to follow
}
\`\`\`

---

## Interfaces (Effective Go + Google Style Guide)

### Design Principles
- Keep interfaces small: 1-3 methods maximum; favor composition of small interfaces
- Define interfaces where they are consumed, not where they are implemented
- Accept interfaces, return concrete structs
- Use the empty interface \`any\` sparingly — prefer concrete types or small interfaces
- Use interface embedding to compose larger contracts from small ones

### Correct
\`\`\`go
// Defined in the consumer package, not the implementation
type UserFinder interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

// Service depends on the abstraction
func NewService(finder UserFinder, logger *slog.Logger) *Service {
    return &Service{finder: finder, logger: logger}
}
\`\`\`

### Anti-Pattern
\`\`\`go
// Bad: overly broad interface defined alongside implementation
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, opts ListOpts) ([]*User, error)
    Count(ctx context.Context) (int, error)
    // Bad: forces all consumers to depend on all 7 methods
}
\`\`\`

---

## Concurrency (Effective Go + Code Review Comments)

### Goroutines
- Always ensure goroutines can exit — avoid goroutine leaks
- Use \`context.Context\` for cancellation and timeouts in every goroutine
- Propagate errors from goroutines back to the caller via channels or \`errgroup\`
- Never launch a goroutine without understanding who owns its lifecycle

### Synchronization
- Prefer channels for coordination and communication between goroutines
- Use \`sync.Mutex\` for simple shared state protection
- Use \`sync.RWMutex\` when reads vastly outnumber writes
- Use \`sync.Once\` for lazy, thread-safe initialization
- Use \`sync.WaitGroup\` to wait on a known set of goroutines
- Use \`golang.org/x/sync/errgroup\` for goroutine groups that return errors

### Correct
\`\`\`go
func (s *service) FetchAll(ctx context.Context, ids []string) ([]*User, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make([]*User, len(ids))

    for i, id := range ids {
        g.Go(func() error {
            user, err := s.repo.FindByID(ctx, id)
            if err != nil {
                return fmt.Errorf("fetch user %q: %w", id, err)
            }
            results[i] = user // Safe: each goroutine writes to its own index
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}
\`\`\`

### Anti-Pattern
\`\`\`go
func (s *service) FetchAll(ids []string) []*User {
    var results []*User
    for _, id := range ids {
        go func() {
            user, _ := s.repo.FindByID(context.TODO(), id) // Bad: no cancellation, discarded error
            results = append(results, user)                  // Bad: data race on slice
        }()
    }
    time.Sleep(2 * time.Second) // Bad: arbitrary sleep instead of synchronization
    return results
}
\`\`\`

---

## Context (Code Review Comments)
- Pass \`context.Context\` as the first parameter to every function that does I/O or may block
- Name the parameter \`ctx\` — always
- Never store context in a struct field — pass it explicitly
- Use \`context.WithTimeout\` or \`context.WithCancel\` to bound operations
- Use \`context.WithValue\` sparingly — only for request-scoped data (trace IDs, auth), never for function parameters

---

## Documentation (Code Review Comments + Google Style Guide)
- Every exported function, type, variable, and constant must have a doc comment
- Doc comments are full sentences starting with the name of the thing being documented
- Package comments appear in \`doc.go\` or above the \`package\` clause
- Use \`// Deprecated:\` to mark deprecated APIs with a migration path
- Use examples (\`func ExampleFunctionName()\`) for non-obvious APIs
`,
      },
      {
        path: 'go/structure.md',
        governance: 'recommended',
        description: 'Go project structure, testing idioms, and module management',
        content: `# Go Project Structure & Testing

## Project Layout
- Use \`cmd/<app>/main.go\` for application entry points — keep \`main\` thin
- Use \`internal/\` for private packages (enforced by the Go compiler)
- Use \`pkg/\` only for genuinely reusable library code intended for external consumption
- Organize by domain/feature, not by technical layer (\`internal/auth/\`, \`internal/order/\`)
- Avoid generic package names: \`utils\`, \`helpers\`, \`common\`, \`base\` are code smells

### Correct
\`\`\`
cmd/
  api/main.go
  worker/main.go
internal/
  auth/
    handler.go
    service.go
    repository.go
    auth_test.go
  order/
    handler.go
    service.go
    order_test.go
\`\`\`

### Anti-Pattern
\`\`\`
handlers/
  auth_handler.go
  order_handler.go
services/
  auth_service.go
  order_service.go
models/
  user.go
  order.go
utils/
  helpers.go      # Bad: generic package with unrelated functions
  # Problem: one feature change touches many directories
\`\`\`

---

## Testing Idioms

### Table-Driven Tests
- Use table-driven tests for functions with multiple input scenarios
- Name each test case clearly to serve as documentation
- Use \`t.Run()\` for sub-tests so failures pinpoint the exact case
- Use \`t.Parallel()\` for tests that can safely run concurrently

\`\`\`go
func TestParseAge(t *testing.T) {
    t.Parallel()

    tests := []struct {
        name    string
        input   string
        want    int
        wantErr bool
    }{
        {name: "valid age", input: "25", want: 25},
        {name: "zero", input: "0", want: 0},
        {name: "negative", input: "-1", wantErr: true},
        {name: "non-numeric", input: "abc", wantErr: true},
        {name: "empty string", input: "", wantErr: true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()

            got, err := ParseAge(tt.input)
            if tt.wantErr {
                if err == nil {
                    t.Errorf("ParseAge(%q) expected error, got %d", tt.input, got)
                }
                return
            }
            if err != nil {
                t.Fatalf("ParseAge(%q) unexpected error: %v", tt.input, err)
            }
            if got != tt.want {
                t.Errorf("ParseAge(%q) = %d, want %d", tt.input, got, tt.want)
            }
        })
    }
}
\`\`\`

### Test Helpers
- Use \`t.Helper()\` in every test helper function so failures report the caller's line
- Use \`t.Cleanup()\` for teardown instead of manual defer in helpers
- Use \`testing.TB\` to write helpers that work for both tests and benchmarks

### Black-Box Testing
- Use \`_test\` package suffix (\`package auth_test\`) for testing only the exported API
- Use regular package (\`package auth\`) for white-box tests of internal logic

### Benchmarks
- Use \`func BenchmarkXxx(b *testing.B)\` for performance-critical paths
- Reset the timer with \`b.ResetTimer()\` after expensive setup
- Use \`b.ReportAllocs()\` to track memory allocations
- Use \`b.RunParallel()\` for concurrent benchmarks

### Fuzz Tests (Go 1.18+)
- Use \`func FuzzXxx(f *testing.F)\` for input parsing and validation functions
- Add seed corpus entries with \`f.Add()\` for known edge cases
- Run with \`go test -fuzz=FuzzXxx -fuzztime=30s\`

---

## Dependency Management

### Go Modules
- Use Go modules (\`go.mod\`) — never use \`GOPATH\` mode
- Run \`go mod tidy\` to remove unused and add missing dependencies
- Pin dependency versions explicitly — review \`go.sum\` changes in code review
- Use \`go mod vendor\` if vendoring is required by CI or organizational policy
- Prefer stdlib over third-party packages when the stdlib solution is adequate

### Security
- Run \`govulncheck ./...\` to scan for known vulnerabilities in dependencies
- Run \`go mod verify\` to ensure module checksums match \`go.sum\`
- Review dependency changes carefully — supply chain attacks target Go modules too

### Multi-Module Workspaces (Go 1.18+)
- Use \`go.work\` for local development with multiple modules
- Never commit \`go.work\` unless the repository is intentionally a multi-module workspace
`,
      },
      {
        path: 'go/performance-and-safety.md',
        governance: 'recommended',
        description: 'Go performance patterns, memory safety, and security guidelines',
        content: `# Go Performance & Safety

## Memory and Allocation Patterns
- Preallocate slices when the size is known: \`make([]T, 0, knownSize)\`
- Prefer \`strings.Builder\` over repeated string concatenation in loops
- Use \`sync.Pool\` for frequently allocated and discarded objects (buffers, parsers)
- Avoid capturing loop variables in goroutines — they share the pointer in pre-1.22 Go
- Use value receivers for small, immutable structs; pointer receivers for large structs or when mutation is needed
- Declare nil slices (\`var s []T\`) instead of empty slices (\`s := []T{}\`) unless JSON serialization requires \`[]\` over \`null\`

### Correct
\`\`\`go
func buildNames(users []*User) []string {
    names := make([]string, 0, len(users))
    for _, u := range users {
        names = append(names, u.FullName())
    }
    return names
}
\`\`\`

### Anti-Pattern
\`\`\`go
func buildNames(users []*User) []string {
    var names []string // No preallocation — causes repeated slice growth
    for _, u := range users {
        names = append(names, u.FullName())
    }
    return names
}
\`\`\`

---

## Structured Logging (log/slog, Go 1.21+)
- Use \`log/slog\` for all new code — avoid the legacy \`log\` package
- Use JSON handler in production, text handler in development
- Include request-scoped context (trace ID, user ID) via \`slog.With()\`
- Never log sensitive data: passwords, tokens, PII, API keys
- Use \`slog.LevelVar\` to change log levels at runtime without restart

\`\`\`go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))

logger.InfoContext(ctx, "user authenticated",
    slog.String("user_id", userID),
    slog.String("method", "oauth2"),
    slog.Duration("latency", elapsed),
)
\`\`\`

---

## Generics (Go 1.18+)
- Use generics for type-safe collections, algorithms, and utility functions
- Prefer concrete types or interfaces when generics add complexity without clear benefit
- Name type parameters descriptively for domain types, single-letter for utility: \`[T any]\`, \`[K comparable, V any]\`
- Use constraints from \`golang.org/x/exp/constraints\` or define project-specific constraints
- Let the compiler infer type parameters — avoid explicit instantiation unless ambiguous

### Correct
\`\`\`go
func Map[T, U any](items []T, fn func(T) U) []U {
    result := make([]U, len(items))
    for i, item := range items {
        result[i] = fn(item)
    }
    return result
}
\`\`\`

### Anti-Pattern
\`\`\`go
func Map(items []any, fn func(any) any) []any { // Bad: loses type safety
    result := make([]any, len(items))
    for i, item := range items {
        result[i] = fn(item) // Caller must type-assert every result
    }
    return result
}
\`\`\`

---

## Security Practices (Go-Specific)
- Use \`crypto/rand\` for all random values — never \`math/rand\` for security-sensitive operations
- Use \`database/sql\` parameterized queries — never concatenate user input into SQL
- Use \`html/template\` (auto-escaping) over \`text/template\` for HTML output
- Use \`golang.org/x/crypto/bcrypt\` or \`argon2\` for password hashing — never SHA/MD5
- Validate and sanitize all external input — use allowlists over denylists
- Run \`govulncheck\` in CI to catch known vulnerabilities in dependencies
- Use \`go-playground/validator\` for struct field validation in HTTP handlers
- Set timeouts on all \`http.Server\` and \`http.Client\` instances — never use defaults

\`\`\`go
// Correct: parameterized query
row := db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", userID)

// Anti-Pattern: SQL injection vulnerability
row := db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = " + userID)
\`\`\`

\`\`\`go
// Correct: HTTP server with explicit timeouts
srv := &http.Server{
    Addr:         ":8080",
    ReadTimeout:  5 * time.Second,
    WriteTimeout: 10 * time.Second,
    IdleTimeout:  120 * time.Second,
    Handler:      mux,
}
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Go-Specific Review

### Error Handling
- Check for discarded errors (assigned to _)
- Verify error wrapping includes context via fmt.Errorf with %w verb
- Verify error strings are lowercase without trailing punctuation
- Check that errors.Is() and errors.As() are used instead of direct comparison or type assertion

### Concurrency Safety
- Check for goroutine leaks — every goroutine must have a clear exit path
- Verify context.Context is passed and respected for cancellation
- Check for data races on shared state — use -race flag or review sync primitives
- Verify sync.WaitGroup or errgroup is used instead of time.Sleep for synchronization

### Interface Design
- Verify interfaces are small (1-3 methods) and defined at the consumer
- Check for interface pollution — not every type needs an interface
- Verify no stutter in package.TypeName combinations

### Naming and Style
- Check receiver names are short, consistent, and never self/this
- Verify acronyms use consistent casing (HTTP, ID, URL — all caps)
- Check package names are short, lowercase, no underscores
- Verify doc comments on all exported identifiers are full sentences starting with the name

### Performance
- Check for missing slice preallocation when size is known
- Verify no string concatenation in loops — should use strings.Builder
- Check for proper use of value vs pointer receivers
- Verify HTTP clients and servers have explicit timeouts

### Security
- Check for crypto/rand usage instead of math/rand for security operations
- Verify SQL queries use parameterized statements
- Check for html/template over text/template for HTML rendering
- Verify no sensitive data in log statements`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Go Testing

### Structure
- Use table-driven tests with named sub-tests via t.Run("case name", func(t *testing.T){...})
- Use t.Helper() in all test helper functions so failures report the caller
- Use t.Parallel() for tests that can run concurrently
- Use t.Cleanup() for teardown instead of manual defer chains

### Assertions
- Use testify/assert for non-fatal assertions, testify/require for fatal assertions
- Alternatively, use stdlib testing with clear failure messages including input and expected vs actual
- Always include the input in error messages: t.Errorf("Func(%q) = %v, want %v", input, got, want)

### Coverage
- Test both success and error paths for every function that returns error
- Test edge cases: empty input, nil pointers, zero values, context cancellation, timeouts
- Use _test package suffix for black-box tests of exported API
- Mock dependencies with interfaces and hand-written fakes or testify/mock

### Benchmarks and Fuzz
- Write benchmarks for performance-critical code: func BenchmarkXxx(b *testing.B)
- Use b.ReportAllocs() and b.ResetTimer() for accurate measurements
- Use fuzz tests for input parsing: func FuzzXxx(f *testing.F) with seed corpus`,
      },
    ],
    skills: [
      {
        name: 'go-module-manager',
        description: 'Go dependency management, module operations, and vulnerability scanning',
        content: `# Go Module Manager Skill

## Dependency Management
- \`go mod tidy\` — remove unused and add missing dependencies
- \`go get package@version\` — add or update a specific dependency
- \`go get -u ./...\` — update all dependencies to latest minor/patch
- \`go get -u=patch ./...\` — update only to latest patch versions
- \`go list -m -u all\` — check for available updates

## Version Pinning and Verification
- Pin versions in go.mod — review go.sum changes in every PR
- \`go mod verify\` — ensure checksums match go.sum
- \`go mod vendor\` — create vendor directory if required by CI policy
- \`go mod graph\` — visualize the dependency tree for debugging

## Security Scanning
- \`govulncheck ./...\` — scan for known vulnerabilities in dependencies and stdlib
- \`go mod why package\` — understand why a dependency is included
- Review \`go.sum\` diffs — new or changed hashes indicate dependency changes

## Workspace Mode (Go 1.18+)
- \`go work init ./module1 ./module2\` — create multi-module workspace
- \`go work use ./new-module\` — add a module to the workspace
- Never commit \`go.work\` unless the repo is intentionally multi-module
- Use \`GOWORK=off\` to disable workspace mode in CI builds

## Troubleshooting
- \`go mod download\` — pre-fetch dependencies to the module cache
- \`go clean -modcache\` — clear the module cache if corrupted
- \`GOFLAGS=-mod=mod\` — allow auto-updates to go.mod during builds
- \`GOPROXY=direct\` — bypass proxy for private modules
- \`GONOSUMCHECK=pattern\` — skip checksum verification for private modules
`,
      },
      {
        name: 'go-debug-profile',
        description: 'Go debugging with delve and performance profiling with pprof',
        content: `# Go Debug & Profile Skill

## Delve Debugger (dlv)
- \`dlv debug ./cmd/app\` — start debugging the main package
- \`dlv test ./internal/auth\` — debug tests in a package
- \`dlv attach <pid>\` — attach to a running process
- \`dlv connect localhost:2345\` — remote debugging (use with \`dlv --headless\`)

### Common Delve Commands
- \`break main.go:42\` or \`b service.go:100\` — set breakpoints
- \`continue\` / \`c\` — run until next breakpoint
- \`next\` / \`n\` — step over, \`step\` / \`s\` — step into
- \`print expr\` / \`p expr\` — evaluate expression
- \`goroutines\` — list all goroutines
- \`goroutine <id>\` — switch to a specific goroutine
- \`stack\` / \`bt\` — print stack trace
- \`locals\` — print local variables
- \`condition <bp> <expr>\` — conditional breakpoint

## Performance Profiling (pprof)
- Import \`_ "net/http/pprof"\` and serve on a debug port for live profiling
- \`go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof\` — profile benchmarks
- \`go tool pprof cpu.prof\` — analyze CPU profile
- \`go tool pprof -http=:8080 cpu.prof\` — web UI for flame graphs
- \`go tool pprof mem.prof\` — analyze memory allocations

### Common pprof Commands
- \`top\` — show top functions by CPU/memory
- \`list FuncName\` — annotated source for a function
- \`web\` — open call graph in browser (requires graphviz)
- \`traces\` — show execution traces

## Race Detector
- \`go test -race ./...\` — run tests with race detector enabled
- \`go build -race\` — build with race detector for staging environments
- Always run with -race in CI — it catches data races at runtime

## Trace Tool
- \`go test -trace=trace.out ./...\` — capture execution trace
- \`go tool trace trace.out\` — analyze goroutine scheduling, GC pauses, and blocking
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_TOOL_OUTPUT" | grep -qE "^# command-line-arguments$|cannot use .+ as .+ in|undefined:" && echo "HOOK_EXIT:0:Go compilation error detected — review the error and fix before proceeding" || true',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'golangci',
        filePath: '.golangci.yml',
        mergeStrategy: 'create-only',
        config: {
          linters: {
            enable: [
              'errcheck',
              'gosimple',
              'govet',
              'ineffassign',
              'staticcheck',
              'unused',
              'gocritic',
              'gofmt',
              'goimports',
              'misspell',
              'prealloc',
              'revive',
              'gosec',
              'bodyclose',
              'noctx',
              'exhaustive',
              'exportloopref',
            ],
          },
          'linters-settings': {
            govet: {
              'check-shadowing': true,
            },
            gocritic: {
              'enabled-checks': [
                'appendAssign',
                'argOrder',
                'badCall',
                'badCond',
                'badLock',
                'badRegexp',
                'builtinShadowDecl',
                'dupArg',
                'dupBranchBody',
                'dupCase',
                'dupSubExpr',
                'emptyFallthrough',
                'evalOrder',
                'externalErrorReassign',
                'filepathJoin',
                'nilValReturn',
                'rangeExprCopy',
                'sloppyReassign',
                'truncateCmp',
                'unnecessaryDefer',
              ],
            },
            revive: {
              rules: [
                { name: 'blank-imports' },
                { name: 'context-as-argument' },
                { name: 'context-keys-type' },
                { name: 'error-return' },
                { name: 'error-naming' },
                { name: 'error-strings' },
                { name: 'exported' },
                { name: 'increment-decrement' },
                { name: 'indent-error-flow' },
                { name: 'range' },
                { name: 'receiver-naming' },
                { name: 'redefines-builtin-id' },
                { name: 'superfluous-else' },
                { name: 'time-naming' },
                { name: 'unreachable-code' },
                { name: 'unused-parameter' },
                { name: 'var-declaration' },
              ],
            },
            gosec: {
              severity: 'medium',
              confidence: 'medium',
            },
            exhaustive: {
              'default-signifies-exhaustive': true,
            },
          },
          run: {
            timeout: '5m',
          },
          issues: {
            'max-issues-per-linter': 50,
            'max-same-issues': 5,
          },
        },
      },
    ],
  },
};
