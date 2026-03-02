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

### Ownership, Borrowing & Lifetimes
- Prefer borrowing (\`&T\`, \`&mut T\`) over transferring ownership when the caller retains the value
- Use \`Cow<'_, T>\` when a function may or may not need to own its data
- Avoid unnecessary \`.clone()\` — restructure ownership or use references instead
- Let the compiler infer lifetimes via elision rules; annotate explicitly only when required
- Name lifetimes descriptively for complex signatures (\`'input\`, \`'conn\`, \`'ctx\`)
- Use \`'static\` sparingly — prefer bounded lifetimes for flexibility

### Error Handling
- Use \`Result<T, E>\` for all fallible operations — never panic in library code
- Use \`thiserror\` for library error types, \`anyhow\` for application-level error handling
- Propagate errors with the \`?\` operator — avoid manual \`match\` on \`Result\`
- Never use \`unwrap()\` or \`expect()\` in production code paths — use \`.unwrap_or_default()\`, \`.ok()\`, or \`?\`
- Chain \`Option<T>\` with \`.map()\`, \`.and_then()\`, \`.unwrap_or_default()\`, \`.ok_or()\`
- Annotate functions with \`#[must_use]\` when ignoring the return value is likely a bug

### Naming (Rust API Guidelines)
- Types and traits: \`UpperCamelCase\` — \`HttpClient\`, \`ConnectionPool\`
- Functions, methods, local variables: \`snake_case\` — \`read_to_string\`, \`is_empty\`
- Constants and statics: \`SCREAMING_SNAKE_CASE\` — \`MAX_RETRIES\`, \`DEFAULT_PORT\`
- Type conversions follow standard naming: \`as_\` (cheap ref-to-ref), \`to_\` (expensive conversion), \`into_\` (ownership transfer)
- Getter methods omit \`get_\` prefix: \`.name()\` not \`.get_name()\`
- Boolean methods/predicates: \`is_\`, \`has_\`, \`can_\`, \`should_\` prefixes
- Iterator-producing methods: \`iter()\` (borrows), \`iter_mut()\` (mut borrows), \`into_iter()\` (consumes)

### Traits & Generics
- Derive standard traits: \`Debug\` on all types, \`Clone\`, \`PartialEq\`, \`Eq\`, \`Hash\` as appropriate
- Implement \`Display\` for user-facing types, \`Debug\` for developer output
- Use \`From\`/\`TryFrom\` for idiomatic type conversions — implement \`From<T>\` to get \`Into<T>\` free
- Use \`AsRef<T>\` and \`AsMut<T>\` to accept multiple input types cheaply
- Prefer \`impl Trait\` in argument position for simple bounds; use \`where\` clauses for complex bounds
- Use \`#[non_exhaustive]\` on public enums and structs for forward compatibility

### Async Rust
- Prefer \`tokio\` as the async runtime for production workloads
- Mark async functions with \`async fn\` — avoid manual \`Future\` implementations unless necessary
- Use \`tokio::spawn\` for concurrent tasks, \`tokio::select!\` for racing futures
- Always use cancellation-safe operations inside \`select!\` — consult tokio docs for safety guarantees
- Prefer \`async-trait\` crate or Rust 1.75+ native async trait methods

### Tooling
- Run \`cargo fmt\` on every save — never deviate from \`rustfmt\` standard formatting
- Run \`cargo clippy --all-targets --all-features -- -D warnings\` as a gate before commits
- Run \`cargo test\` before pushing — include doc tests and integration tests
- Use \`cargo doc --open\` to verify documentation renders correctly`,
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
        governance: 'mandatory',
        description: 'Rust ownership, borrowing, lifetimes, and error handling conventions',
        content: `# Rust Ownership, Borrowing & Error Handling

## Ownership & Borrowing

### Prefer Borrowing Over Cloning
Borrow with \`&T\` when the caller needs to retain the value. Clone only when you truly need an independent copy.

\`\`\`rust
// Anti-pattern: unnecessary clone
fn process(items: Vec<String>) {
    let first = items[0].clone(); // wasteful if we only need to read
    println!("{first}");
}

// Correct: borrow instead
fn process(items: &[String]) {
    if let Some(first) = items.first() {
        println!("{first}");
    }
}
\`\`\`

### Use Cow for Conditional Ownership
When a function sometimes needs to allocate and sometimes can borrow, use \`Cow<'_, T>\`.

\`\`\`rust
use std::borrow::Cow;

fn normalize_path(path: &str) -> Cow<'_, str> {
    if path.contains("//") {
        Cow::Owned(path.replace("//", "/"))
    } else {
        Cow::Borrowed(path)
    }
}
\`\`\`

### Smart Pointers for Shared Ownership
- Use \`Arc<T>\` for shared ownership across threads (with \`Mutex<T>\` or \`RwLock<T>\` for interior mutability)
- Use \`Rc<T>\` for single-threaded shared ownership only
- Never use \`Rc<T>\` in async or multi-threaded contexts — it is not \`Send\`

## Lifetimes

- Let the compiler infer lifetimes via elision rules — annotate only when required
- Name lifetimes descriptively: \`'input\`, \`'conn\`, \`'query\` — not just \`'a\`
- Use \`'static\` sparingly; prefer bounded lifetimes for flexibility

\`\`\`rust
// Anti-pattern: forcing 'static when not needed
fn extract_name(data: &'static str) -> &'static str { /* ... */ }

// Correct: use elision or bounded lifetime
fn extract_name(data: &str) -> &str { /* ... */ }
\`\`\`

## Error Handling

### Use Result<T, E> Consistently
Every fallible operation must return \`Result\`. Never panic in library code.

\`\`\`rust
// Anti-pattern: panicking in library code
pub fn parse_config(input: &str) -> Config {
    serde_json::from_str(input).unwrap() // panics on invalid input
}

// Correct: return Result with descriptive error
pub fn parse_config(input: &str) -> Result<Config, ConfigError> {
    serde_json::from_str(input).map_err(ConfigError::Parse)
}
\`\`\`

### Define Domain Error Types with thiserror
\`\`\`rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("file not found: {path}")]
    NotFound { path: String },
    #[error("permission denied for {path}")]
    PermissionDenied { path: String },
    #[error("I/O error")]
    Io(#[from] std::io::Error),
}
\`\`\`

### Use anyhow for Application Code
\`\`\`rust
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let config = std::fs::read_to_string("config.toml")
        .context("failed to read config file")?;
    let parsed: Config = toml::from_str(&config)
        .context("failed to parse config TOML")?;
    run(parsed)
}
\`\`\`

### Propagate with ? — Never Match Manually
\`\`\`rust
// Anti-pattern: manual match on Result
let file = match std::fs::read_to_string(path) {
    Ok(f) => f,
    Err(e) => return Err(e.into()),
};

// Correct: use ? operator
let file = std::fs::read_to_string(path)?;
\`\`\`

### Annotate #[must_use] on Important Return Values
\`\`\`rust
#[must_use]
pub fn validate(input: &str) -> ValidationResult {
    // Ignoring this result is almost certainly a bug
    // ...
}
\`\`\`
`,
      },
      {
        path: 'rust/api-design.md',
        governance: 'mandatory',
        description: 'Rust API design following official API Guidelines (naming, traits, conversions)',
        content: `# Rust API Design (API Guidelines)

## Naming Conventions (C-CASE)

| Item | Convention | Example |
|------|-----------|---------|
| Types, traits | UpperCamelCase | \`HttpClient\`, \`IntoIterator\` |
| Functions, methods | snake_case | \`read_to_string\`, \`is_empty\` |
| Local variables | snake_case | \`retry_count\`, \`user_name\` |
| Constants, statics | SCREAMING_SNAKE_CASE | \`MAX_CONNECTIONS\`, \`DEFAULT_PORT\` |
| Modules | snake_case | \`file_utils\`, \`error_handling\` |
| Type parameters | short UpperCamelCase | \`T\`, \`E\`, \`K\`, \`V\`, \`S\` |
| Lifetimes | short lowercase | \`'a\`, \`'de\`, \`'input\` |

## Conversion Method Naming (C-CONV)

| Prefix | Cost | Ownership | Example |
|--------|------|-----------|---------|
| \`as_\` | Free (no allocation) | Borrows \`&self\` | \`as_bytes()\`, \`as_str()\` |
| \`to_\` | Expensive (may allocate) | Borrows \`&self\` | \`to_string()\`, \`to_vec()\` |
| \`into_\` | Variable | Consumes \`self\` | \`into_inner()\`, \`into_vec()\` |

\`\`\`rust
// Anti-pattern: wrong prefix
impl Buffer {
    fn to_slice(&self) -> &[u8] { &self.data }  // free conversion, use as_
    fn as_owned(&self) -> Vec<u8> { self.data.clone() }  // allocates, use to_
}

// Correct: prefixes reflect cost and ownership
impl Buffer {
    fn as_slice(&self) -> &[u8] { &self.data }
    fn to_vec(&self) -> Vec<u8> { self.data.clone() }
    fn into_vec(self) -> Vec<u8> { self.data }
}
\`\`\`

## Getter Naming (C-GETTER)
Getter methods omit the \`get_\` prefix. Use \`get_\` only when the operation is a lookup or has a side effect.

\`\`\`rust
// Anti-pattern: Java-style getter
impl User {
    fn get_name(&self) -> &str { &self.name }
}

// Correct: idiomatic Rust getter
impl User {
    fn name(&self) -> &str { &self.name }
}
\`\`\`

## Boolean Predicates (C-BOOL)
Methods returning \`bool\` use \`is_\`, \`has_\`, \`can_\`, \`should_\` prefixes.

\`\`\`rust
impl Connection {
    fn is_connected(&self) -> bool { /* ... */ }
    fn has_pending_data(&self) -> bool { /* ... */ }
    fn can_write(&self) -> bool { /* ... */ }
}
\`\`\`

## Standard Trait Implementations

### Always Derive
- \`Debug\` — on ALL public types (required for good error messages and logging)
- \`Clone\` — when the type is logically copyable
- \`PartialEq\`, \`Eq\` — when equality comparison is meaningful
- \`Hash\` — when the type may be used as a HashMap/HashSet key (requires \`Eq\`)
- \`Default\` — when there is a natural default value

### Implement Manually When Needed
- \`Display\` — for user-facing output; keep \`Debug\` for developer output
- \`From<T>\` / \`TryFrom<T>\` — for type conversions (implementing \`From\` gives \`Into\` for free)
- \`AsRef<T>\` / \`AsMut<T>\` — to accept \`&str\`, \`String\`, \`&Path\`, \`PathBuf\` etc. generically
- \`Deref\` — only for smart pointer types, never for general "inheritance"
- \`Iterator\` — for custom collection types

### Forward Compatibility
- Use \`#[non_exhaustive]\` on public enums so adding variants is not a breaking change
- Use \`#[non_exhaustive]\` on public structs when fields may be added later

\`\`\`rust
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub enum DatabaseError {
    ConnectionFailed,
    QueryTimeout { duration_ms: u64 },
    AuthenticationFailed,
}
\`\`\`

## Builder Pattern for Complex Construction
Use the builder pattern when a struct has more than 3 optional fields.

\`\`\`rust
pub struct ServerConfig {
    host: String,
    port: u16,
    max_connections: usize,
    tls_enabled: bool,
    timeout_ms: u64,
}

impl ServerConfig {
    pub fn builder(host: impl Into<String>, port: u16) -> ServerConfigBuilder {
        ServerConfigBuilder {
            host: host.into(),
            port,
            max_connections: 100,
            tls_enabled: false,
            timeout_ms: 30_000,
        }
    }
}

pub struct ServerConfigBuilder { /* fields */ }

impl ServerConfigBuilder {
    pub fn max_connections(mut self, n: usize) -> Self { self.max_connections = n; self }
    pub fn tls(mut self, enabled: bool) -> Self { self.tls_enabled = enabled; self }
    pub fn timeout_ms(mut self, ms: u64) -> Self { self.timeout_ms = ms; self }
    pub fn build(self) -> ServerConfig { /* ... */ }
}
\`\`\`

## Newtype Pattern for Type Safety
Wrap primitive types to prevent mixing semantically different values.

\`\`\`rust
// Anti-pattern: easy to confuse user_id and order_id
fn process(user_id: u64, order_id: u64) { /* ... */ }

// Correct: newtype wrappers enforce type safety
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(pub u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OrderId(pub u64);

fn process(user_id: UserId, order_id: OrderId) { /* ... */ }
\`\`\`

## Module Visibility
- Expose a clean public API from \`lib.rs\` — keep internals private
- Use \`pub(crate)\` for crate-internal items shared across modules
- Use \`pub(super)\` for parent-module-only visibility
- Never expose implementation details as public API

## Documentation Conventions (C-DOC)
- Use \`///\` for public item documentation, \`//!\` for module/crate-level docs
- First line is a short summary sentence (shows in search results)
- Include \`# Examples\` section with runnable doc tests
- Include \`# Errors\` section for functions returning \`Result\`
- Include \`# Panics\` section if the function can panic

\`\`\`rust
/// Parses a configuration file from the given path.
///
/// # Examples
///
/// \\\`\\\`\\\`rust
/// let config = parse_config("config.toml")?;
/// assert_eq!(config.port, 8080);
/// \\\`\\\`\\\`
///
/// # Errors
///
/// Returns \`ConfigError::NotFound\` if the file does not exist.
/// Returns \`ConfigError::Parse\` if the file contains invalid TOML.
pub fn parse_config(path: &str) -> Result<Config, ConfigError> { /* ... */ }
\`\`\`
`,
      },
      {
        path: 'rust/patterns-and-idioms.md',
        governance: 'recommended',
        description: 'Rust patterns, iterators, async, unsafe, and project structure idioms',
        content: `# Rust Patterns & Idioms

## Pattern Matching

### Exhaustive Match Over If-Let Chains
\`\`\`rust
// Anti-pattern: chaining if-let for multiple variants
if let Some(Ok(value)) = result {
    handle_value(value);
} else if let Some(Err(e)) = result {
    handle_error(e);
}

// Correct: exhaustive match
match result {
    Some(Ok(value)) => handle_value(value),
    Some(Err(e)) => handle_error(e),
    None => handle_none(),
}
\`\`\`

### Use if-let for Single-Variant Matching
\`\`\`rust
// Correct: simple single-variant check
if let Some(user) = find_user(id) {
    greet(&user);
}
\`\`\`

### Use matches! for Boolean Checks
\`\`\`rust
// Anti-pattern: verbose match for a boolean check
let is_success = match status {
    Status::Ok | Status::Created => true,
    _ => false,
};

// Correct: use matches! macro
let is_success = matches!(status, Status::Ok | Status::Created);
\`\`\`

### Use @ Bindings to Capture and Match
\`\`\`rust
match response.status_code {
    code @ 200..=299 => println!("Success: {code}"),
    code @ 400..=499 => println!("Client error: {code}"),
    code @ 500..=599 => println!("Server error: {code}"),
    code => println!("Unexpected: {code}"),
}
\`\`\`

## Iterators

### Prefer Combinators Over Manual Loops
\`\`\`rust
// Anti-pattern: manual loop with mutable accumulator
let mut names = Vec::new();
for user in &users {
    if user.is_active {
        names.push(user.name.clone());
    }
}

// Correct: iterator chain
let names: Vec<_> = users.iter()
    .filter(|u| u.is_active)
    .map(|u| u.name.clone())
    .collect();
\`\`\`

### Fallible Collection with collect::<Result<_, _>>()
\`\`\`rust
let parsed: Result<Vec<i32>, _> = strings.iter()
    .map(|s| s.parse::<i32>())
    .collect();
\`\`\`

### Iterator Protocol
- \`.iter()\` borrows elements (\`&T\`)
- \`.iter_mut()\` borrows elements mutably (\`&mut T\`)
- \`.into_iter()\` consumes the collection (takes ownership of \`T\`)
- Prefer lazy iterators — only \`.collect()\` when needed

## Async Rust

### Tokio Runtime Conventions
\`\`\`rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let listener = TcpListener::bind("0.0.0.0:8080").await?;
    loop {
        let (stream, _) = listener.accept().await?;
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream).await {
                eprintln!("Connection error: {e}");
            }
        });
    }
}
\`\`\`

### Async Anti-Patterns
\`\`\`rust
// Anti-pattern: blocking the async runtime
async fn read_file(path: &str) -> Result<String> {
    std::fs::read_to_string(path).map_err(Into::into) // blocks the thread!
}

// Correct: use async I/O
async fn read_file(path: &str) -> Result<String> {
    tokio::fs::read_to_string(path).await.map_err(Into::into)
}

// Correct alternative: spawn blocking for CPU-heavy work
async fn compress(data: Vec<u8>) -> Result<Vec<u8>> {
    tokio::task::spawn_blocking(move || cpu_heavy_compress(&data)).await?
}
\`\`\`

### select! Cancellation Safety
- Only use cancellation-safe operations inside \`tokio::select!\`
- \`tokio::io::AsyncReadExt::read\` is NOT cancellation-safe
- \`tokio::sync::mpsc::Receiver::recv\` IS cancellation-safe
- Consult the tokio docs for each operation's cancellation safety guarantee

## Unsafe Code Rules

- Minimize unsafe usage — exhaust safe alternatives first
- Every \`unsafe\` block MUST have a \`// SAFETY:\` comment explaining why the invariants hold
- Encapsulate unsafe code behind safe abstractions
- Never use unsafe for performance unless profiling proves it is necessary and the safe version is a bottleneck
- Use \`#[deny(unsafe_code)]\` at the crate level; opt in per-module with \`#[allow(unsafe_code)]\`

\`\`\`rust
// Correct: justified and documented unsafe
// SAFETY: We have exclusive access to the buffer and the length is validated
// against the buffer capacity in the constructor.
unsafe {
    std::ptr::copy_nonoverlapping(src.as_ptr(), dst.as_mut_ptr(), len);
}
\`\`\`

## Project Structure

### Binary Crate
\`\`\`
src/
  main.rs          # thin entry point — parse args, wire deps, delegate
  lib.rs           # public API surface
  config.rs        # configuration types and parsing
  error.rs         # error types (thiserror)
  domain/          # business logic by feature
    mod.rs
    users.rs
    orders.rs
  infra/           # I/O adapters (DB, HTTP clients, filesystem)
    mod.rs
    database.rs
    http_client.rs
tests/
  integration/     # integration tests (separate binaries)
    api_test.rs
benches/
  benchmarks.rs    # criterion benchmarks
\`\`\`

### Library Crate
\`\`\`
src/
  lib.rs           # public API re-exports, crate-level docs
  types.rs         # public types
  error.rs         # error types
  internal/        # implementation details (pub(crate))
    mod.rs
    parser.rs
    validator.rs
\`\`\`

### Workspace Layout
- Use \`[workspace]\` in root Cargo.toml for multi-crate projects
- Share dependencies via \`[workspace.dependencies]\`
- Keep shared types in a dedicated \`-core\` or \`-types\` crate
- Use \`cargo test --workspace\` to test all crates

## Cargo.toml Best Practices
- Set \`edition = "2021"\` (or latest stable edition)
- Set \`rust-version\` (MSRV) for libraries
- Use \`[lints.clippy]\` section for project-wide Clippy configuration
- Group dependencies: workspace deps, external deps, dev-dependencies
- Use \`[features]\` for optional functionality — avoid feature creep
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && command -v cargo >/dev/null 2>&1 && cargo fmt -- --check "$CLAUDE_FILE_PATH" 2>/dev/null || true',
            timeout: 15,
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nP "\\bunwrap\\(\\)|\\bexpect\\(" "$CLAUDE_FILE_PATH" | head -5 | grep -q "." && echo "HOOK_EXIT:0:Warning: unwrap()/expect() detected — verify these are not in production code paths" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.rs$" && grep -nP "^\\s*unsafe\\s*\\{" "$CLAUDE_FILE_PATH" | while IFS=: read -r line _; do prev=$((line - 1)); sed -n "${prev}p" "$CLAUDE_FILE_PATH" | grep -q "SAFETY:" || echo "HOOK_EXIT:0:Warning: unsafe block at line $line missing // SAFETY: comment"; done || true',
            timeout: 10,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'clippy' as any,
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
