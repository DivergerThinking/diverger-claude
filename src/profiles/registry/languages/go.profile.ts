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

- Follow Effective Go and the Go Code Review Comments guide
- Use \`gofmt\` / \`goimports\` for formatting - never deviate from standard formatting
- Handle errors explicitly - never discard errors with \`_\`
- Prefer returning \`error\` over panicking - reserve \`panic\` for truly unrecoverable situations
- Use interfaces for abstraction - keep them small (1-3 methods)
- Accept interfaces, return structs
- Use goroutines and channels for concurrent operations
- Prefer composition over inheritance via struct embedding
- Use context.Context for cancellation, deadlines, and request-scoped values`,
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
          'Bash(golangci-lint:*)',
        ],
      },
    },
    rules: [
      {
        path: 'go/conventions.md',
        governance: 'mandatory',
        description: 'Go coding conventions',
        content: `# Go Conventions

## Naming
- Exported identifiers: PascalCase (\`UserService\`, \`GetUser\`)
- Unexported identifiers: camelCase (\`userRepo\`, \`handleRequest\`)
- Packages: short, lowercase, single-word (\`http\`, \`user\`, \`auth\`)
- Interfaces: name by behavior, use -er suffix for single-method (\`Reader\`, \`Writer\`, \`Stringer\`)
- Avoid stuttering: \`user.User\` not \`user.UserStruct\`
- Acronyms are all-caps: \`HTTPClient\`, \`userID\`, \`xmlParser\`

## Error Handling
- Always check returned errors - never use \`_\` to discard them
- Use \`fmt.Errorf("context: %w", err)\` to wrap errors with context
- Use \`errors.Is()\` and \`errors.As()\` for error inspection
- Define sentinel errors with \`var ErrNotFound = errors.New("not found")\`
- Define custom error types for errors that carry structured data
- Return early on error - avoid deep nesting

## Interfaces
- Keep interfaces small: 1-3 methods maximum
- Define interfaces where they are consumed, not where they are implemented
- Use the empty interface \`any\` sparingly - prefer concrete types or small interfaces
- Use interface embedding for composition

## Concurrency
- Use goroutines for concurrent tasks, channels for communication
- Prefer \`sync.WaitGroup\` for waiting on multiple goroutines
- Use \`context.Context\` for cancellation and timeouts
- Avoid goroutine leaks - always ensure goroutines can exit
- Use \`sync.Mutex\` for simple shared state, channels for complex coordination
- Prefer \`sync.Once\` for one-time initialization
`,
      },
      {
        path: 'go/structure.md',
        governance: 'recommended',
        description: 'Go package structure and testing conventions',
        content: `# Go Package Structure

## Project Layout
- Follow the standard Go project layout
- Use \`cmd/\` for application entry points
- Use \`internal/\` for private packages
- Use \`pkg/\` sparingly - only for truly reusable library code
- Keep \`main.go\` thin - delegate to internal packages

## Testing
- Test files live alongside code: \`user.go\` / \`user_test.go\`
- Use table-driven tests for multiple input scenarios
- Use \`testify\` or stdlib \`testing\` package - be consistent within a project
- Use \`t.Helper()\` in test helper functions
- Use \`t.Parallel()\` for independent tests
- Use \`_test\` package suffix for black-box testing of exported API
- Use build tags for integration tests: \`//go:build integration\`

## Dependencies
- Use Go modules (\`go.mod\`) for dependency management
- Minimize external dependencies - prefer stdlib when possible
- Pin dependency versions explicitly
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Go-Specific Review
- Check for unchecked errors (discarded with _)
- Verify error wrapping includes context via fmt.Errorf with %w
- Check for goroutine leaks - ensure all goroutines can exit
- Verify proper use of context.Context for cancellation
- Check for data races on shared state
- Verify interfaces are small and defined at the consumer
- Check for proper package naming (no stuttering)
- Verify defer usage for resource cleanup`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Go Testing
- Use table-driven tests with named sub-tests via t.Run
- Use t.Helper() in all test helper functions
- Use t.Parallel() for tests that can run concurrently
- Test error cases explicitly - verify error messages and types
- Use testify/assert or testify/require for readable assertions
- Mock dependencies with interfaces and hand-written mocks or testify/mock`,
      },
    ],
  },
};
