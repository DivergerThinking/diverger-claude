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

Effective Go, gofmt-enforced style. Explicit error handling — never discard errors with \`_\`.

**Detailed rules:** see \`.claude/rules/go/\` directory.

**Key rules:**
- Accept interfaces, return structs — small interfaces at consumer side
- \`context.Context\` as first parameter, propagate cancellation
- Error wrapping with \`fmt.Errorf("...: %w", err)\`, check with \`errors.Is\`/\`errors.As\`
- Goroutines must have clear ownership, use \`errgroup\` for fan-out
- Run \`go vet\`, \`staticcheck\`, \`golangci-lint\` before committing`,
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
        paths: ['**/*.go'],
        governance: 'mandatory',
        description: 'Go coding conventions from Effective Go, Code Review Comments, and Google Style Guide',
        content: `# Go Conventions

Effective Go, Code Review Comments, and Google Style Guide. Explicit error handling, small interfaces, structured concurrency.

- Exported identifiers PascalCase, unexported camelCase; packages short lowercase single-word
- Avoid stutter: \`http.Client\` not \`http.HTTPClient\`; interfaces named by behavior with -er suffix
- Receivers: short 1-2 letter abbreviation, never \`self\`/\`this\`, consistent within a type
- Always check returned errors — never assign to \`_\`; wrap with \`fmt.Errorf("op: %w", err)\`
- Use \`errors.Is()\`/\`errors.As()\` for sentinel and type checks; error strings lowercase, no punctuation
- Keep interfaces small (1-3 methods), define at consumer side; accept interfaces, return structs
- Goroutines must have clear exit paths — use \`context.Context\` for cancellation
- Use \`errgroup\` for concurrent goroutines that return errors; never \`time.Sleep\` for sync
- Pass \`context.Context\` as first param (\`ctx\`), never store in struct; use \`WithTimeout\` to bound ops
- Doc comments on all exported identifiers — full sentences starting with the name

For detailed examples and reference, invoke: /go-error-handling-guide, /go-concurrency-guide`,
      },
      {
        path: 'go/structure.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Go project structure, testing idioms, and module management',
        content: `# Go Project Structure & Testing

Go project layout, testing idioms, and module management following standard Go conventions.

- Use \`cmd/<app>/main.go\` for entry points; \`internal/\` for private packages; organize by domain/feature
- Avoid generic package names (\`utils\`, \`helpers\`, \`common\`) — name by what the package provides
- Use table-driven tests with \`t.Run()\` sub-tests; use \`t.Parallel()\` when safe
- Use \`t.Helper()\` in test helpers; \`t.Cleanup()\` for teardown; \`_test\` suffix for black-box tests
- Write benchmarks with \`BenchmarkXxx\` and fuzz tests with \`FuzzXxx\` for input parsing
- Use Go modules (\`go.mod\`) — run \`go mod tidy\` and pin versions explicitly
- Run \`govulncheck ./...\` and \`go mod verify\` for dependency security
- Prefer stdlib over third-party when adequate; review \`go.sum\` diffs in PRs
- Use \`go.work\` for multi-module local dev; never commit unless intentionally multi-module

For detailed examples and reference, invoke: /go-module-manager`,
      },
      {
        path: 'go/performance-and-safety.md',
        paths: ['**/*.go'],
        governance: 'recommended',
        description: 'Go performance patterns, memory safety, and security guidelines',
        content: `# Go Performance & Safety

Memory optimization, structured logging, generics, and Go-specific security practices.

- Preallocate slices when size is known: \`make([]T, 0, knownSize)\`; use \`strings.Builder\` in loops
- Use \`sync.Pool\` for frequently allocated objects; value receivers for small immutable structs
- Use \`log/slog\` for structured logging — JSON in production, text in dev; never log sensitive data
- Use generics for type-safe collections; prefer concrete types when generics add unnecessary complexity
- Use \`crypto/rand\` for security — never \`math/rand\`; use \`bcrypt\`/\`argon2\` for passwords
- Always use parameterized SQL queries — never concatenate user input
- Use \`html/template\` (auto-escaping) over \`text/template\` for HTML output
- Set explicit timeouts on all \`http.Server\` and \`http.Client\` instances
- Run \`govulncheck\` in CI; validate all external input with allowlists over denylists

For detailed examples and reference, invoke: /go-debug-profile`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['go-module-manager', 'go-debug-profile'],
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
        skills: ['go-module-manager', 'go-debug-profile'],
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
        name: 'go-concurrency-guide',
        description: 'Detailed reference for Go concurrency patterns: goroutines, channels, errgroup, sync primitives',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Go Concurrency — Detailed Reference

## Why This Matters
Concurrency is Go's defining feature. Misusing goroutines and channels causes data races,
goroutine leaks, and deadlocks — bugs that are subtle and hard to reproduce.
These patterns follow Effective Go, the Go Blog, and the Go Concurrency Patterns talks.

---

## Goroutine Lifecycle Management

Every goroutine MUST have a clear exit path. A leaked goroutine runs forever, consuming memory.

### Correct: goroutine with cancellation
\\\`\\\`\\\`go
func processEvents(ctx context.Context, ch <-chan Event) {
    for {
        select {
        case <-ctx.Done():
            return // Clean exit on cancellation
        case event, ok := <-ch:
            if !ok {
                return // Channel closed
            }
            handle(event)
        }
    }
}
\\\`\\\`\\\`

### Anti-Pattern: goroutine leak
\\\`\\\`\\\`go
func processEvents(ch <-chan Event) {
    for event := range ch {
        handle(event) // If nobody closes ch, this goroutine runs forever
    }
}
// No way to stop this goroutine — leaked if the channel is abandoned
\\\`\\\`\\\`

---

## Channel Patterns

### Fan-Out / Fan-In
\\\`\\\`\\\`go
func fanOut(ctx context.Context, input <-chan Job, workers int) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup

    for range workers {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range input {
                select {
                case <-ctx.Done():
                    return
                case results <- process(job):
                }
            }
        }()
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}
\\\`\\\`\\\`

### Pipeline Pattern
\\\`\\\`\\\`go
func pipeline(ctx context.Context, nums <-chan int) <-chan int {
    doubled := make(chan int)
    go func() {
        defer close(doubled)
        for n := range nums {
            select {
            case <-ctx.Done():
                return
            case doubled <- n * 2:
            }
        }
    }()
    return doubled
}
\\\`\\\`\\\`

### Channel Direction — always restrict in function signatures
\\\`\\\`\\\`go
// Correct: receive-only and send-only channel types enforce direction
func producer(ctx context.Context) <-chan Event    { /* ... */ }
func consumer(events <-chan Event)                 { /* ... */ }
func relay(in <-chan Event, out chan<- Event)       { /* ... */ }
\\\`\\\`\\\`

---

## errgroup — Structured Concurrency

errgroup is the preferred pattern for concurrent goroutines that return errors.

\\\`\\\`\\\`go
func fetchAll(ctx context.Context, urls []string) ([]Response, error) {
    g, ctx := errgroup.WithContext(ctx)
    responses := make([]Response, len(urls))

    for i, url := range urls {
        g.Go(func() error {
            resp, err := httpGet(ctx, url)
            if err != nil {
                return fmt.Errorf("fetch %q: %w", url, err)
            }
            responses[i] = resp
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return responses, nil
}
\\\`\\\`\\\`

### With concurrency limit
\\\`\\\`\\\`go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10) // Max 10 concurrent goroutines
\\\`\\\`\\\`

---

## sync Primitives

### sync.Mutex — protect shared state
\\\`\\\`\\\`go
type Counter struct {
    mu    sync.Mutex
    count int
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}
\\\`\\\`\\\`

### sync.RWMutex — when reads vastly outnumber writes
\\\`\\\`\\\`go
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    val, ok := c.data[key]
    return val, ok
}

func (c *Cache) Set(key, val string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = val
}
\\\`\\\`\\\`

### sync.Once — lazy initialization
\\\`\\\`\\\`go
var (
    instance *Database
    once     sync.Once
)

func GetDB() *Database {
    once.Do(func() {
        instance = connectToDatabase()
    })
    return instance
}
\\\`\\\`\\\`

---

## Context Patterns

### Always pass context as first parameter
\\\`\\\`\\\`go
func (s *service) Process(ctx context.Context, req Request) (Response, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    result, err := s.repo.Query(ctx, req.ID)
    if err != nil {
        return Response{}, fmt.Errorf("process: %w", err)
    }
    return Response{Data: result}, nil
}
\\\`\\\`\\\`

### Anti-Patterns
- Never store context in a struct field — pass explicitly
- Never use \\\`context.TODO()\\\` in production code — it indicates an unfinished decision
- Never use \\\`context.WithValue\\\` for function parameters — only for request-scoped metadata (trace IDs)

---

## Race Detection

- Always run \\\`go test -race ./...\\\` in CI — catches data races at runtime
- Build with \\\`go build -race\\\` for staging environments
- Common race causes: shared slice/map without mutex, goroutine capturing loop variable (pre-1.22)
`,
      },
      {
        name: 'go-error-handling-guide',
        description: 'Detailed reference for Go error handling: wrapping, sentinel errors, custom types, errors.Is/As',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Go Error Handling — Detailed Reference

## Why This Matters
Go's explicit error handling is a strength, but only when used correctly.
Discarded errors, missing context, and improper wrapping cause silent failures
and debugging nightmares. These patterns follow the Go Blog and standard library conventions.

---

## Error Wrapping with Context

Always wrap errors with context about what operation failed:

### Correct
\\\`\\\`\\\`go
func (s *service) CreateOrder(ctx context.Context, req OrderRequest) (*Order, error) {
    user, err := s.users.FindByID(ctx, req.UserID)
    if err != nil {
        return nil, fmt.Errorf("create order: find user %q: %w", req.UserID, err)
    }

    order, err := s.orders.Insert(ctx, user, req.Items)
    if err != nil {
        return nil, fmt.Errorf("create order: insert: %w", err)
    }

    return order, nil
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`go
func (s *service) CreateOrder(ctx context.Context, req OrderRequest) (*Order, error) {
    user, err := s.users.FindByID(ctx, req.UserID)
    if err != nil {
        return nil, err // No context — caller can't tell WHERE the error came from
    }

    order, err := s.orders.Insert(ctx, user, req.Items)
    if err != nil {
        return nil, fmt.Errorf("failed: %v", err) // %v breaks the error chain (not %w)
    }

    return order, nil
}
\\\`\\\`\\\`

---

## Sentinel Errors

Define sentinel errors for conditions that callers need to check programmatically:

\\\`\\\`\\\`go
// Package-level sentinel errors — lowercase messages, no punctuation
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrConflict     = errors.New("conflict")
)
\\\`\\\`\\\`

### Checking with errors.Is
\\\`\\\`\\\`go
order, err := service.GetOrder(ctx, orderID)
if err != nil {
    if errors.Is(err, ErrNotFound) {
        // Handle known "not found" case
        return http.StatusNotFound, nil
    }
    // Unknown error — propagate
    return 0, fmt.Errorf("get order: %w", err)
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`go
// WRONG: direct comparison breaks when errors are wrapped
if err == ErrNotFound { // Fails if err was wrapped with fmt.Errorf("%w", ErrNotFound)
    // ...
}

// WRONG: string comparison is fragile
if err.Error() == "not found" {
    // ...
}
\\\`\\\`\\\`

---

## Custom Error Types

Use custom error types when callers need structured data from the error:

\\\`\\\`\\\`go
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s: %s", e.Field, e.Message)
}

// Check with errors.As
var valErr *ValidationError
if errors.As(err, &valErr) {
    // Access structured fields
    log.Printf("field %s: %s", valErr.Field, valErr.Message)
}
\\\`\\\`\\\`

### With wrapping support
\\\`\\\`\\\`go
type OpError struct {
    Op   string
    Err  error
}

func (e *OpError) Error() string { return fmt.Sprintf("%s: %s", e.Op, e.Err) }
func (e *OpError) Unwrap() error { return e.Err }

// Now errors.Is(opErr, ErrNotFound) works if Err wraps ErrNotFound
\\\`\\\`\\\`

---

## Error Handling Patterns

### Early return (happy path unindented)
\\\`\\\`\\\`go
func process(data []byte) (*Result, error) {
    if len(data) == 0 {
        return nil, fmt.Errorf("process: empty data")
    }

    parsed, err := parse(data)
    if err != nil {
        return nil, fmt.Errorf("process: %w", err)
    }

    validated, err := validate(parsed)
    if err != nil {
        return nil, fmt.Errorf("process: %w", err)
    }

    return transform(validated), nil
}
\\\`\\\`\\\`

### Error strings convention
- Lowercase, no trailing punctuation
- Include the operation name as prefix
- Chain naturally when wrapped: \\\`create order: find user "abc": not found\\\`

### Never discard errors
\\\`\\\`\\\`go
// WRONG: error silently discarded
result, _ := riskyOperation()

// CORRECT: handle or propagate
result, err := riskyOperation()
if err != nil {
    return fmt.Errorf("...: %w", err)
}
\\\`\\\`\\\`

---

## Multi-Error Handling (Go 1.20+)

\\\`\\\`\\\`go
// Join multiple errors
err := errors.Join(err1, err2, err3)

// errors.Is checks each error in the chain
if errors.Is(err, ErrNotFound) {
    // True if ANY of err1, err2, err3 wraps ErrNotFound
}
\\\`\\\`\\\`
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
              'echo "$CLAUDE_TOOL_OUTPUT" | grep -qE "^# command-line-arguments$|cannot use .+ as .+ in|undefined:" && { echo "Go compilation error detected — review the error and fix before proceeding" >&2; exit 2; } || exit 0',
            timeout: 5,
            statusMessage: 'Checking for Go compilation errors',
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
