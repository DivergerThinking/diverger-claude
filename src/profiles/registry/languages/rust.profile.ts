import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const rustProfile: Profile = {
  id: 'languages/rust',
  name: 'Rust',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['rust'],
  contributions: {
    claudeMd: [
      {
        heading: 'Rust Conventions',
        order: 10,
        content: `## Rust Conventions

Ownership-driven design. Let the compiler guide you — fix warnings, not suppress them.

**Detailed rules:** see \`.claude/rules/rust/\` directory.

**Key rules:**
- Prefer \`&str\` over \`String\` in function parameters, use \`impl Trait\` for flexibility
- Error handling: \`Result<T, E>\` everywhere, \`thiserror\` for libraries, \`anyhow\` for apps
- Use \`clippy\` and \`rustfmt\` — address all lints before committing
- Unsafe blocks require safety comments documenting invariants`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(cargo:*)',
          'Bash(cargo build:*)',
          'Bash(cargo test:*)',
          'Bash(cargo run:*)',
          'Bash(cargo clippy:*)',
          'Bash(cargo fmt:*)',
          'Bash(cargo check:*)',
          'Bash(cargo doc:*)',
          'Bash(cargo bench:*)',
          'Bash(cargo add:*)',
          'Bash(cargo tree:*)',
          'Bash(cargo audit:*)',
          'Bash(cargo expand:*)',
          'Bash(rustc:*)',
          'Bash(rustup:*)',
        ],
      },
    },
    rules: [
      {
        path: 'rust/ownership-and-errors.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Rust ownership, borrowing, lifetimes, and error handling conventions',
        content: `# Rust Ownership, Borrowing & Error Handling

## Ownership & Borrowing

- Borrow with \`&T\` by default — clone only when you truly need an independent copy
- Use \`&[T]\` and \`&str\` in function parameters instead of \`Vec<T>\` and \`String\`
- Use \`Cow<'_, T>\` when a function sometimes borrows and sometimes allocates
- Use \`Arc<T>\` + \`Mutex<T>\`/\`RwLock<T>\` for shared ownership across threads
- Use \`Rc<T>\` for single-threaded shared ownership only — never in async/multi-threaded
- Avoid unnecessary \`Box<T>\` — prefer stack allocation when size is known

## Lifetimes

- Let the compiler infer lifetimes via elision rules — annotate only when required
- Name lifetimes descriptively: \`'input\`, \`'conn\`, \`'query\` — not just \`'a\`
- Use \`'static\` sparingly — prefer bounded lifetimes for flexibility

## Error Handling

- Every fallible operation must return \`Result<T, E>\` — never panic in library code
- Use \`thiserror\` for library error types with \`#[derive(Debug, Error)]\`
- Use \`anyhow\` for application code with \`.context("description")?\`
- Propagate with \`?\` operator — never match Result/Option manually
- Use \`#[from]\` on thiserror variants for automatic \`?\` conversion
- Annotate \`#[must_use]\` on functions where ignoring the return is a bug
- Never use \`unwrap()\`/\`expect()\` in production code paths
- Use \`map_err\` to add context when converting between error types
`,
      },
      {
        path: 'rust/api-design.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Rust API design following official API Guidelines (naming, traits, conversions)',
        content: `# Rust API Design (API Guidelines)

## Naming Conventions (C-CASE)

| Item | Convention | Example |
|------|-----------|---------|
| Types, traits | UpperCamelCase | \`HttpClient\`, \`IntoIterator\` |
| Functions, methods | snake_case | \`read_to_string\`, \`is_empty\` |
| Constants, statics | SCREAMING_SNAKE_CASE | \`MAX_CONNECTIONS\`, \`DEFAULT_PORT\` |
| Modules | snake_case | \`file_utils\`, \`error_handling\` |

## Conversion Naming (C-CONV)

- \`as_\` — free, borrows \`&self\`: \`as_bytes()\`, \`as_str()\`
- \`to_\` — expensive (may allocate), borrows \`&self\`: \`to_string()\`, \`to_vec()\`
- \`into_\` — variable cost, consumes \`self\`: \`into_inner()\`, \`into_vec()\`

## Getter & Predicate Naming

- Getters omit \`get_\` prefix: \`fn name(&self) -> &str\` not \`fn get_name()\`
- Boolean predicates use \`is_\`, \`has_\`, \`can_\`, \`should_\` prefixes

## Standard Trait Implementations

- Always derive: \`Debug\` (all public types), \`Clone\`, \`PartialEq\`/\`Eq\`, \`Hash\`, \`Default\`
- Implement manually: \`Display\`, \`From<T>\`/\`TryFrom<T>\`, \`AsRef<T>\`, \`Iterator\`
- \`Deref\` only for smart pointer types — never for general "inheritance"
- Use \`#[non_exhaustive]\` on public enums and structs that may grow

## Design Patterns

- Use builder pattern when a struct has more than 3 optional fields
- Use newtype pattern to wrap primitives for type safety (\`UserId(u64)\`, \`OrderId(u64)\`)
- Use \`From\`/\`TryFrom\` instead of custom conversion methods

## Module Visibility

- Expose clean public API from \`lib.rs\` — keep internals private
- Use \`pub(crate)\` for crate-internal items shared across modules
- Use \`pub(super)\` for parent-module-only visibility

## Documentation (C-DOC)

- Use \`///\` for public items, \`//!\` for module/crate-level docs
- First line is a short summary sentence
- Include \`# Examples\` with runnable doc tests, \`# Errors\`, \`# Panics\` sections
`,
      },
      {
        path: 'rust/patterns-and-idioms.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Rust patterns, iterators, async, unsafe, and project structure idioms',
        content: `# Rust Patterns & Idioms

## Pattern Matching

- Use exhaustive \`match\` over if-let chains for multiple variants
- Use \`if let\` for single-variant matching only
- Use \`matches!\` macro for boolean checks: \`matches!(status, Status::Ok | Status::Created)\`
- Use \`@\` bindings to capture and match simultaneously

## Iterators

- Prefer iterator combinators (\`filter\`, \`map\`, \`collect\`) over manual loops
- Use \`collect::<Result<Vec<_>, _>>()\` for fallible collection processing
- \`.iter()\` borrows (\`&T\`), \`.iter_mut()\` borrows mutably, \`.into_iter()\` consumes
- Prefer lazy iterators — only \`.collect()\` when needed

## Async Rust

- Use \`tokio::fs\` and \`tokio::io\` — never blocking \`std::fs\` in async context
- Use \`tokio::task::spawn_blocking\` for CPU-heavy work in async context
- Only use cancellation-safe operations inside \`tokio::select!\`
- Ensure \`tokio::spawn\` tasks handle errors (not silently dropped)

## Unsafe Code Rules

- Minimize unsafe — exhaust safe alternatives first
- Every \`unsafe\` block MUST have a \`// SAFETY:\` comment explaining invariants
- Encapsulate unsafe behind safe abstractions
- Use \`#[deny(unsafe_code)]\` at crate level; opt in per-module with \`#[allow(unsafe_code)]\`

## Project Structure

- Binary crate: thin \`main.rs\`, \`lib.rs\` for public API, \`error.rs\` for error types
- Library crate: \`lib.rs\` re-exports, \`internal/\` for \`pub(crate)\` implementation
- Use \`[workspace]\` for multi-crate projects, share deps via \`[workspace.dependencies]\`
- Keep shared types in a dedicated \`-core\` or \`-types\` crate

## Cargo.toml Best Practices

- Set \`edition = "2021"\` and \`rust-version\` (MSRV) for libraries
- Use \`[lints.clippy]\` section for project-wide Clippy configuration
- Use \`[features]\` for optional functionality — avoid feature creep
- Group dependencies: workspace, external, dev-dependencies
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['rust-cargo-helper', 'rust-debug-skill'],
        prompt: `## Rust-Specific Review

### Ownership & Performance
- Flag unnecessary \`.clone()\` calls — suggest borrowing, \`Cow\`, or restructured ownership
- Flag unnecessary heap allocations (\`Box\`, \`Vec\`, \`String\`) where stack or borrowed data suffices
- Check for moves of large structs where a reference would work
- Verify \`Arc\` is used over \`Rc\` in async/multi-threaded contexts

### Error Handling
- Verify no \`unwrap()\`, \`expect()\`, or \`panic!()\` in production code paths
- Verify errors propagate with \`?\` and include context (\`anyhow::Context\` or \`map_err\`)
- Check that custom error types derive \`Debug\` and implement \`Display\` (via \`thiserror\`)
- Verify \`#[must_use]\` on functions where ignoring the return value is a bug

### API Guidelines Adherence
- Verify naming follows Rust API Guidelines: \`as_\`/\`to_\`/\`into_\` conversions, no \`get_\` prefix on getters
- Verify boolean methods use \`is_\`/\`has_\`/\`can_\` prefixes
- Check that public types derive \`Debug\`, \`Clone\`, \`PartialEq\` as appropriate
- Check \`From\`/\`TryFrom\` is used instead of custom conversion methods
- Verify \`#[non_exhaustive]\` on public enums and structs that may grow

### Unsafe & Safety
- Verify every \`unsafe\` block has a \`// SAFETY:\` comment
- Check that unsafe is encapsulated behind a safe public API
- Flag gratuitous unsafe — suggest safe alternatives if they exist

### Async
- Flag blocking operations (\`std::fs\`, \`std::thread::sleep\`) inside async functions
- Verify \`tokio::spawn\` tasks handle errors (not silently dropped)
- Check for cancellation safety in \`select!\` branches

### Clippy & Formatting
- Verify code passes \`cargo clippy --all-targets -- -D warnings\`
- Verify code is formatted with \`cargo fmt\`
- Flag \`#[allow(clippy::...)]\` without a justification comment`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Rust Testing

### Unit Tests
- Place unit tests in \`#[cfg(test)] mod tests\` at the bottom of the source file
- Use \`Result<(), Box<dyn std::error::Error>>\` return type for tests that use \`?\`
- Use \`#[should_panic(expected = "message")]\` for tests that verify panic behavior

### Test Coverage
- Test both \`Ok\` and \`Err\` variants of \`Result\`-returning functions
- Test \`Some\` and \`None\` cases for \`Option\`-returning functions
- Test boundary conditions: empty inputs, max values, Unicode, zero-length slices
- Use \`assert_eq!\`, \`assert_ne!\`, \`assert!\` with descriptive messages as the last argument

### Async Tests
- Use \`#[tokio::test]\` for async test functions
- Use \`#[tokio::test(flavor = "multi_thread")]\` when testing concurrent behavior
- Test timeout behavior with \`tokio::time::timeout\`

### Property-Based & Fuzzing
- Use \`proptest\` or \`quickcheck\` for property-based testing of pure functions
- Use \`cargo-fuzz\` to fuzz parsers and deserializers

### Doc Tests
- Write runnable examples in \`///\` doc comments — they compile and run as tests
- Use \`# fn main()\` wrapper in doc tests that need error handling
- Mark non-runnable examples with \`\\\`\\\`\\\`rust,no_run\`

### Integration Tests
- Place integration tests in \`tests/\` directory as separate crates
- Use \`#[test_case]\` or \`rstest\` for parameterized tests
- Use \`tempfile\` crate for tests that need temporary directories or files`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Rust-Specific Security Review

### Memory Safety
- Audit every \`unsafe\` block: verify the safety invariant comment is accurate and complete
- Flag \`unsafe\` blocks that lack \`// SAFETY:\` comments
- Check FFI boundaries: verify foreign function signatures match C ABI exactly
- Verify raw pointer arithmetic is bounds-checked before dereferencing
- Flag transmute usage — suggest safer alternatives (\`bytemuck\`, \`zerocopy\`)

### Input Validation
- Verify all external input (network, CLI args, file content) is validated before use
- Check for integer overflow in arithmetic on untrusted input — use \`checked_add\`, \`saturating_mul\`
- Verify string parsing handles malformed UTF-8 gracefully
- Flag unbounded allocations from untrusted size values (e.g., \`Vec::with_capacity(user_input)\`)

### Dependency Security
- Run \`cargo audit\` to check for known vulnerabilities
- Verify \`Cargo.lock\` is committed for binary crates
- Flag \`[patch]\` or \`[replace]\` sections that override upstream crates
- Check for unnecessary use of \`openssl\` — prefer \`rustls\` for TLS when possible

### Concurrency Safety
- Verify \`Send\` and \`Sync\` bounds are correct for types shared across threads
- Check for data races in \`unsafe\` code that circumvents Rust's ownership model
- Verify \`Mutex\` and \`RwLock\` are not held across \`.await\` points (use \`tokio::sync\` variants)`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['rust-cargo-helper', 'rust-debug-skill'],
        prompt: `## Rust-Specific Refactoring

### Ownership Refactoring
- Convert \`.clone()\`-heavy code to use references, \`Cow\`, or restructured ownership
- Extract large structs into smaller, focused types to reduce move/clone cost
- Replace \`Rc<RefCell<T>>\` with cleaner ownership patterns when possible

### API Improvements
- Replace manual conversion methods with \`From\`/\`TryFrom\` implementations
- Replace builder-with-setters to builder-with-chaining pattern
- Add \`#[must_use]\`, \`#[non_exhaustive]\` where applicable
- Replace stringly-typed parameters with newtype wrappers or enums

### Error Type Refactoring
- Consolidate ad-hoc error strings into structured \`thiserror\` enums
- Replace \`Box<dyn Error>\` in library code with domain-specific error types
- Add \`#[from]\` attributes on \`thiserror\` variants to enable automatic \`?\` conversion`,
      },
    ],
    skills: [
      {
        name: 'rust-cargo-helper',
        description: 'Cargo commands, Clippy workflows, and dependency management for Rust',
        content: `# Rust Cargo Helper Skill

## Build & Check
- \`cargo build\` — compile the project in debug mode
- \`cargo build --release\` — compile with optimizations
- \`cargo check\` — fast compilation check without producing binaries
- \`cargo check --all-targets\` — also check tests, benches, and examples
- \`cargo build --target x86_64-unknown-linux-musl\` — cross-compile for specific target

## Testing
- \`cargo test\` — run all tests (unit, integration, doc tests)
- \`cargo test test_name\` — run tests matching a name pattern
- \`cargo test -- --nocapture\` — show stdout/stderr output from tests
- \`cargo test --doc\` — run only doc tests
- \`cargo test --workspace\` — test all crates in a workspace
- \`cargo nextest run\` — faster test runner with better output (cargo-nextest)

## Linting & Formatting
- \`cargo clippy --all-targets --all-features -- -D warnings\` — comprehensive linting, treat warnings as errors
- \`cargo clippy --fix --allow-dirty\` — automatically apply Clippy suggestions
- \`cargo fmt\` — format all source files with rustfmt
- \`cargo fmt -- --check\` — check formatting without modifying files
- Configure project-wide lint levels in \`Cargo.toml\` under \`[lints.clippy]\`

## Documentation
- \`cargo doc --open\` — generate and view HTML documentation
- \`cargo doc --no-deps\` — generate docs only for your crate (skip dependencies)
- \`cargo doc --document-private-items\` — include private items in docs

## Dependency Management
- \`cargo add crate_name\` — add a dependency to Cargo.toml
- \`cargo add crate_name --features feature1,feature2\` — add with specific features
- \`cargo add crate_name --dev\` — add as dev-dependency
- \`cargo update\` — update dependencies within semver constraints
- \`cargo outdated\` — check for newer versions (install: cargo-outdated)
- \`cargo audit\` — check for security vulnerabilities (install: cargo-audit)
- \`cargo tree\` — visualize the dependency graph
- \`cargo tree -d\` — show only duplicate dependencies

## Workspace Management
- Use \`[workspace]\` in root Cargo.toml for multi-crate projects
- Use \`[workspace.dependencies]\` to share dependency versions across workspace
- \`cargo build -p crate_name\` — build a specific workspace member
- \`cargo test --workspace\` — test all crates in the workspace

## Profiling & Benchmarks
- \`cargo bench\` — run benchmarks (use \`criterion\` crate for reliable results)
- \`RUSTFLAGS="-C target-cpu=native" cargo build --release\` — build optimized for current CPU
- \`cargo bloat --release\` — analyze binary size by function (cargo-bloat)
- \`cargo llvm-lines\` — count lines of LLVM IR per function (find monomorphization bloat)
`,
      },
      {
        name: 'rust-debug-skill',
        description: 'Rust debugging, profiling, and diagnostic tools',
        content: `# Rust Debug & Diagnostics Skill

## Environment Variables for Debugging
- \`RUST_BACKTRACE=1\` — show backtraces on panic
- \`RUST_BACKTRACE=full\` — show full backtraces with all frames
- \`RUST_LOG=debug\` — set log level when using \`env_logger\` or \`tracing-subscriber\`
- \`RUST_LOG=my_crate=trace,hyper=warn\` — per-crate log levels

## Compiler Diagnostics
- \`cargo expand\` — expand macros to see generated code (install: cargo-expand)
- \`cargo +nightly rustc -- -Z macro-backtrace\` — better macro error traces
- \`rustc --explain E0308\` — get detailed explanation for a compiler error code

## Runtime Debugging
- Use \`dbg!(expression)\` for quick debug prints (prints file, line, expression, and value)
- Use \`tracing\` crate with \`tracing-subscriber\` for structured async-aware logging
- Use \`#[instrument]\` attribute from \`tracing\` to automatically log function entry/exit

## Memory & Safety Tools
- \`cargo +nightly miri test\` — detect undefined behavior in unsafe code
- Install: \`rustup +nightly component add miri\`
- Miri detects: use-after-free, out-of-bounds access, invalid pointer dereference, data races
- Use \`valgrind --tool=memcheck\` for native memory leak detection

## Performance Profiling
- \`cargo flamegraph\` — generate CPU flamegraph for release builds (install: cargo-flamegraph)
- \`cargo bench\` with \`criterion\` — statistical benchmarking with regression detection
- \`perf record cargo run --release && perf report\` — Linux perf profiling
- \`cargo bloat --release --crates\` — analyze binary size contribution per crate
- Use \`dhat\` crate for heap profiling in tests

## Common Debugging Patterns
\`\`\`rust
// Quick inspection without removing from expression chain
let result = compute()
    .map(|v| { dbg!(&v); v })
    .and_then(process);

// Conditional logging with tracing
use tracing::{info, warn, instrument};

#[instrument(skip(password))]  // log args except sensitive ones
async fn login(username: &str, password: &str) -> Result<Token> {
    info!("login attempt");
    // ...
}
\`\`\`
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && command -v cargo >/dev/null 2>&1 && cargo fmt -- --check "$FILE_PATH" 2>/dev/null || true',
            timeout: 15,
            statusMessage: 'Checking Rust formatting with cargo fmt',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "\\bunwrap\\(\\)|\\bexpect\\(" "$FILE_PATH" | head -5 | grep -q "." && { echo "Warning: unwrap()/expect() detected — verify these are not in production code paths" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for unwrap()/expect() usage',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "^\\s*unsafe\\s*\\{" "$FILE_PATH" | while IFS=: read -r line _; do prev=$((line - 1)); sed -n "${prev}p" "$FILE_PATH" | grep -q "SAFETY:" || { echo "Warning: unsafe block at line $line missing // SAFETY: comment" >&2; exit 2; }; done || exit 0',
            timeout: 10,
            statusMessage: 'Checking for unsafe blocks without SAFETY comments',
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'clippy',
        filePath: 'clippy.toml',
        mergeStrategy: 'create-only',
        config: {
          'msrv': '1.75.0',
          'cognitive-complexity-threshold': 25,
          'too-many-arguments-threshold': 7,
          'type-complexity-threshold': 250,
          'single-char-binding-names-threshold': 4,
          'too-large-for-stack': 200,
          'verbose-bit-mask-threshold': 1,
          'literal-suffix-style': 'separated',
          'doc-valid-idents': [
            'GitHub',
            'GitLab',
            'JavaScript',
            'TypeScript',
            'OpenSSL',
            'PostgreSQL',
            'MySQL',
            'MongoDB',
            'GraphQL',
            'OAuth',
            'WebSocket',
          ],
        },
      },
    ],
  },
};
