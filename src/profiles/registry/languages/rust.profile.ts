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

Ownership-driven design with explicit error handling. Let the compiler guide you.

- Borrow with \`&T\` by default — clone only when you truly need an independent copy
- Use \`&[T]\` and \`&str\` in function parameters instead of \`Vec<T>\` and \`String\`
- Use \`Cow<'_, T>\` when a function sometimes borrows and sometimes allocates
- Use \`Arc<T>\` + \`Mutex<T>\`/\`RwLock<T>\` for shared ownership across threads; \`Rc<T>\` for single-threaded only
- Let the compiler infer lifetimes — annotate only when required; name descriptively (\`'input\`, not \`'a\`)
- Every fallible operation must return \`Result<T, E>\` — never panic in library code
- Use \`thiserror\` for libraries, \`anyhow\` for apps — propagate with \`?\` operator
- Never use \`unwrap()\`/\`expect()\` in production code paths
- Annotate \`#[must_use]\` on functions where ignoring the return is a bug
- Use \`map_err\` or \`.context()\` to add context when converting between error types

For detailed examples and reference, invoke: /rust-ownership-guide
`,
      },
      {
        path: 'rust/api-design.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Rust API design following official API Guidelines (naming, traits, conversions)',
        content: `# Rust API Design (API Guidelines)

Follow the official Rust API Guidelines for naming, traits, and conversions.

- Types/traits in UpperCamelCase, functions in snake_case, constants in SCREAMING_SNAKE_CASE
- Conversion naming: \`as_\` (free borrow), \`to_\` (expensive borrow), \`into_\` (consumes self)
- Getters omit \`get_\` prefix; boolean predicates use \`is_\`/\`has_\`/\`can_\` prefixes
- Always derive \`Debug\`, \`Clone\`, \`PartialEq\`/\`Eq\` on public types; \`#[non_exhaustive]\` on growable enums/structs
- Use \`From\`/\`TryFrom\` instead of custom conversion methods; \`Deref\` only for smart pointers
- Use builder pattern for structs with 3+ optional fields; newtype pattern for type safety
- Expose clean public API from \`lib.rs\`; use \`pub(crate)\` and \`pub(super)\` for internal visibility
- Document public items with \`///\`, include \`# Examples\` with runnable doc tests
`,
      },
      {
        path: 'rust/patterns-and-idioms.md',
        paths: ['**/*.rs'],
        governance: 'recommended',
        description: 'Rust patterns, iterators, async, unsafe, and project structure idioms',
        content: `# Rust Patterns & Idioms

Idiomatic Rust patterns for matching, iterators, async, unsafe, and project layout.

- Use exhaustive \`match\` for multiple variants; \`if let\` for single-variant; \`matches!\` macro for boolean checks
- Prefer iterator combinators (\`filter\`, \`map\`, \`collect\`) over manual loops; keep iterators lazy
- Use \`tokio::fs\`/\`tokio::io\` in async — never blocking \`std::fs\`; \`spawn_blocking\` for CPU-heavy work
- Only use cancellation-safe operations inside \`tokio::select!\`; handle \`tokio::spawn\` errors
- Every \`unsafe\` block MUST have a \`// SAFETY:\` comment; encapsulate unsafe behind safe abstractions
- Use \`#[deny(unsafe_code)]\` at crate level; opt in per-module with \`#[allow(unsafe_code)]\`
- Binary: thin \`main.rs\` + \`lib.rs\`; library: \`lib.rs\` re-exports; use \`[workspace]\` for multi-crate
- Set \`edition = "2021"\` and \`rust-version\` (MSRV); use \`[lints.clippy]\` for project-wide config
`,
      },
      {
        path: 'rust/security.md',
        paths: ['**/*.rs'],
        governance: 'mandatory',
        description: 'Rust security rules: memory safety, input validation, dependency auditing, crypto',
        content: `# Rust Security Rules

Memory safety, input validation, dependency auditing, and crypto rules for Rust projects.

- Audit every \`unsafe\` block for accurate \`// SAFETY:\` comments; flag \`transmute\` — prefer \`bytemuck\`/\`zerocopy\`
- Verify raw pointer bounds, FFI signatures match C ABI, and \`Send\`/\`Sync\` bounds are correct
- Validate all external input before use; use \`checked_add\`/\`saturating_*\` for untrusted arithmetic
- Use \`from_utf8\` not \`from_utf8_unchecked\`; flag unbounded allocations from untrusted sizes
- Run \`cargo audit\` in CI; commit \`Cargo.lock\` for binaries; prefer \`rustls\` over \`openssl\`
- Review \`build.rs\` scripts — they run at compile time with full system access
- Use \`ring\`/\`rustls\` for crypto — never hand-roll; constant-time comparison for secrets
- Use \`OsRng\` for cryptographic randomness; never log or display secret keys
- Verify \`Mutex\`/\`RwLock\` are not held across \`.await\` — use \`tokio::sync\` variants
- Flag \`Rc<RefCell<T>>\` in async/multi-threaded contexts — use \`Arc<Mutex<T>>\` instead
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
        name: 'rust-ownership-guide',
        description: 'Detailed reference for Rust ownership, borrowing, and lifetimes with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Rust Ownership, Borrowing & Lifetimes — Detailed Reference

## Why This Matters
Ownership is Rust's most distinctive feature — it enables memory safety without garbage
collection. Misunderstanding ownership leads to fighting the borrow checker, excessive
cloning, and designs that don't leverage Rust's guarantees. Master these rules to write
idiomatic, zero-cost-abstraction code.

---

## 1. Ownership Rules

Every value in Rust has exactly one owner. When the owner goes out of scope, the value is dropped.

\\\`\\\`\\\`rust
// Correct: ownership transfer (move)
fn process(data: String) {
    println!("{data}");
} // data is dropped here

fn main() {
    let name = String::from("Alice");
    process(name);
    // name is no longer valid here — it was moved
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: using a value after move
fn main() {
    let name = String::from("Alice");
    process(name);
    println!("{name}"); // COMPILE ERROR: value used after move
}
\\\`\\\`\\\`

---

## 2. Move Semantics

Types that don't implement Copy are moved on assignment or function call.

\\\`\\\`\\\`rust
// Correct: clone when you truly need an independent copy
let original = vec![1, 2, 3];
let copy = original.clone(); // explicit clone — both are valid
process(copy);
println!("{:?}", original); // original still valid

// Anti-Pattern: unnecessary clone to "fix" borrow checker
let data = get_data();
let result = compute(&data.clone()); // BAD: just borrow &data instead
\\\`\\\`\\\`

---

## 3. Borrowing — &T vs &mut T

Shared references (&T) allow multiple readers. Mutable references (&mut T) allow
exactly one writer. You cannot have both at the same time.

\\\`\\\`\\\`rust
// Correct: borrow instead of taking ownership
fn word_count(text: &str) -> usize {
    text.split_whitespace().count()
}

fn main() {
    let article = String::from("Rust is fast and safe");
    let count = word_count(&article); // borrow — article still valid
    println!("{article} has {count} words");
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: taking String ownership when &str suffices
fn word_count(text: String) -> usize { // BAD: consumes the String unnecessarily
    text.split_whitespace().count()
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Correct: mutable borrow
fn push_greeting(names: &mut Vec<String>, name: &str) {
    names.push(format!("Hello, {name}!"));
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: simultaneous shared and mutable borrows
let mut data = vec![1, 2, 3];
let first = &data[0]; // shared borrow
data.push(4);         // COMPILE ERROR: mutable borrow while shared borrow exists
println!("{first}");
\\\`\\\`\\\`

---

## 4. Lifetime Annotations

Lifetimes tell the compiler how long references are valid. The compiler infers most
lifetimes — annotate only when required.

\\\`\\\`\\\`rust
// Correct: lifetime annotation when returning a reference
fn longest<'input>(a: &'input str, b: &'input str) -> &'input str {
    if a.len() >= b.len() { a } else { b }
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: vague lifetime names
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str { ... }
// Prefer descriptive: 'input, 'conn, 'query — not 'a, 'b
\\\`\\\`\\\`

### Common Lifetime Patterns

\\\`\\\`\\\`rust
// Struct holding a reference — must have a lifetime parameter
struct Parser<'input> {
    source: &'input str,
    position: usize,
}

// Lifetime elision: single input reference → output lifetime inferred
fn first_word(s: &str) -> &str {  // compiler infers: fn first_word<'a>(s: &'a str) -> &'a str
    s.split_whitespace().next().unwrap_or("")
}

// 'static: data lives for the entire program
const GREETING: &str = "Hello"; // &'static str
\\\`\\\`\\\`

---

## 5. Smart Pointers

| Pointer | Use Case | Thread-Safe? |
|---------|----------|-------------|
| \`Box<T>\` | Heap allocation, recursive types | N/A (single owner) |
| \`Rc<T>\` | Shared ownership, single-threaded | No |
| \`Arc<T>\` | Shared ownership, multi-threaded | Yes |
| \`RefCell<T>\` | Interior mutability, single-threaded | No |
| \`Mutex<T>\` | Interior mutability, multi-threaded | Yes |
| \`RwLock<T>\` | Multiple readers / single writer, multi-threaded | Yes |

\\\`\\\`\\\`rust
// Correct: Arc + Mutex for shared mutable state across threads
use std::sync::{Arc, Mutex};

let counter = Arc::new(Mutex::new(0));
let counter_clone = Arc::clone(&counter);

std::thread::spawn(move || {
    let mut num = counter_clone.lock().unwrap();
    *num += 1;
});
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: Rc in multi-threaded context
use std::rc::Rc;
let shared = Rc::new(data);
std::thread::spawn(move || {
    println!("{:?}", shared); // COMPILE ERROR: Rc is not Send
});
// Use Arc instead for thread-safe shared ownership
\\\`\\\`\\\`

---

## 6. Interior Mutability

\\\`\\\`\\\`rust
// Correct: RefCell for single-threaded interior mutability
use std::cell::RefCell;

struct CachedComputer {
    cache: RefCell<Option<u64>>,
}

impl CachedComputer {
    fn compute(&self) -> u64 { // &self, not &mut self
        let mut cache = self.cache.borrow_mut();
        *cache.get_or_insert_with(|| expensive_computation())
    }
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: RefCell across threads
// RefCell panics at runtime if borrow rules are violated — no compile-time safety
// Use Mutex<T> or RwLock<T> for multi-threaded interior mutability
\\\`\\\`\\\`

---

## 7. Cow (Clone on Write)

\\\`\\\`\\\`rust
use std::borrow::Cow;

// Correct: avoid allocation when input doesn't need modification
fn normalize(input: &str) -> Cow<'_, str> {
    if input.contains('\\t') {
        Cow::Owned(input.replace('\\t', "    ")) // allocates only when needed
    } else {
        Cow::Borrowed(input) // zero-cost — just borrows
    }
}
\\\`\\\`\\\`
`,
      },
      {
        name: 'rust-error-handling-guide',
        description: 'Detailed reference for Rust error handling patterns with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Rust Error Handling — Detailed Reference

## Why This Matters
Rust has no exceptions — errors are values represented by Result<T, E> and Option<T>.
This makes error handling explicit, composable, and impossible to accidentally ignore.
Mastering these patterns prevents panics in production, improves error messages for
users, and makes error flows easy to trace through the codebase.

---

## 1. Result<T, E> — The Foundation

Every fallible operation returns Result. The caller decides how to handle the error.

\\\`\\\`\\\`rust
use std::fs;
use std::io;

// Correct: return Result, let the caller decide
fn read_config(path: &str) -> Result<String, io::Error> {
    fs::read_to_string(path)
}

fn main() {
    match read_config("config.toml") {
        Ok(content) => println!("Config loaded: {}", content.len()),
        Err(e) => eprintln!("Failed to load config: {e}"),
    }
}
\\\`\\\`\\\`

---

## 2. Option<T> — Absence Without Error

Use Option when absence is a normal condition, not an error.

\\\`\\\`\\\`rust
// Correct: Option for lookups that may not find a result
fn find_user(users: &[User], id: u64) -> Option<&User> {
    users.iter().find(|u| u.id == id)
}

// Correct: convert Option to Result with context
let user = find_user(&users, 42)
    .ok_or_else(|| anyhow::anyhow!("user 42 not found"))?;
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: using Result where Option is more appropriate
fn find_user(users: &[User], id: u64) -> Result<&User, String> {
    // BAD: "not found" is not really an error here — use Option
    users.iter().find(|u| u.id == id).ok_or("not found".to_string())
}
\\\`\\\`\\\`

---

## 3. The ? Operator — Propagation

The ? operator propagates errors up the call stack, converting types via From.

\\\`\\\`\\\`rust
// Correct: chain fallible operations with ?
fn load_and_parse(path: &str) -> Result<Config, anyhow::Error> {
    let content = std::fs::read_to_string(path)?;  // io::Error → anyhow::Error
    let config: Config = toml::from_str(&content)?; // toml::de::Error → anyhow::Error
    Ok(config)
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: manual match instead of ?
fn load_and_parse(path: &str) -> Result<Config, Box<dyn std::error::Error>> {
    let content = match std::fs::read_to_string(path) { // BAD: verbose
        Ok(c) => c,
        Err(e) => return Err(Box::new(e)),
    };
    // ... more nested matches
}
\\\`\\\`\\\`

---

## 4. Custom Error Types with thiserror (Libraries)

Use thiserror for library crates — it generates Display and From implementations.

\\\`\\\`\\\`rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("file not found: {path}")]
    NotFound { path: String },

    #[error("permission denied: {path}")]
    PermissionDenied { path: String },

    #[error("corrupt data at offset {offset}: {detail}")]
    Corrupt { offset: u64, detail: String },

    #[error("I/O error")]
    Io(#[from] std::io::Error),  // auto-conversion with ?

    #[error("serialization error")]
    Serialization(#[from] serde_json::Error),
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: stringly-typed errors
fn read_data(path: &str) -> Result<Data, String> {
    // BAD: String errors lose structure, type info, and composability
    std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    // ...
}
\\\`\\\`\\\`

---

## 5. anyhow for Applications

Use anyhow in application (binary) crates for ergonomic error handling with context.

\\\`\\\`\\\`rust
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let config = load_config("app.toml")
        .context("failed to load application config")?;

    let db = connect_database(&config.db_url)
        .with_context(|| format!("failed to connect to {}", config.db_url))?;

    run_server(config, db)?;
    Ok(())
}
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: anyhow in a library crate
// BAD: library consumers can't match on specific error variants
pub fn parse(input: &str) -> anyhow::Result<Ast> { ... }
// Use thiserror with a custom enum for libraries instead
\\\`\\\`\\\`

---

## 6. Error Conversion with From

Implement From to enable automatic conversion with the ? operator.

\\\`\\\`\\\`rust
// Correct: manual From implementation (when not using thiserror #[from])
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io { source: err, context: String::new() }
    }
}

// Now ? converts automatically:
fn read_file(path: &str) -> Result<String, AppError> {
    let content = std::fs::read_to_string(path)?; // io::Error → AppError via From
    Ok(content)
}
\\\`\\\`\\\`

---

## 7. panic! vs Result — When to Panic

| Situation | Use |
|-----------|-----|
| Recoverable error (file not found, network timeout) | \`Result<T, E>\` |
| Programming bug (index out of bounds, broken invariant) | \`panic!\` |
| Prototype / example code | \`unwrap()\` (temporary only) |
| Tests | \`unwrap()\` / \`expect()\` (acceptable) |
| Production code | Never \`unwrap()\` / \`expect()\` |

\\\`\\\`\\\`rust
// Correct: panic for invariant violations (programming bugs)
fn set_percentage(value: u8) {
    assert!(value <= 100, "percentage must be 0-100, got {value}");
    // ...
}
\\\`\\\`\\\`

---

## 8. unwrap() Dangers

\\\`\\\`\\\`rust
// Anti-Pattern: unwrap in production code
let config: Config = serde_json::from_str(&data).unwrap();
// If data is malformed → panic! → process crashes

// Correct: handle the error
let config: Config = serde_json::from_str(&data)
    .context("failed to parse config JSON")?;
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Anti-Pattern: expect with unhelpful message
let port = env::var("PORT").expect("failed"); // What failed? No context.

// Correct: expect with descriptive message (only in main/setup)
let port = env::var("PORT")
    .expect("PORT environment variable must be set");
\\\`\\\`\\\`

---

## 9. Collecting Results

\\\`\\\`\\\`rust
// Correct: collect into Result<Vec<T>, E> — fails fast on first error
let parsed: Result<Vec<i32>, _> = values.iter()
    .map(|s| s.parse::<i32>())
    .collect();

let numbers = parsed.context("failed to parse number list")?;
\\\`\\\`\\\`

\\\`\\\`\\\`rust
// Correct: partition into successes and failures
let (oks, errs): (Vec<_>, Vec<_>) = values.iter()
    .map(|s| s.parse::<i32>())
    .partition(Result::is_ok);

let numbers: Vec<i32> = oks.into_iter().map(Result::unwrap).collect();
let failures: Vec<_> = errs.into_iter().map(Result::unwrap_err).collect();
\\\`\\\`\\\`

---

## 10. #[must_use] — Prevent Ignored Errors

\\\`\\\`\\\`rust
// Correct: mark functions where ignoring the return is a bug
#[must_use]
fn validate(input: &str) -> Result<(), ValidationError> {
    // ...
}

// Compiler warns if caller writes:
validate(input); // WARNING: unused Result that must be used
\\\`\\\`\\\`
`,
      },
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && command -v cargo >/dev/null 2>&1 && cargo fmt -- --check "$FILE_PATH" 2>/dev/null || true',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "\\bunwrap\\(\\)|\\bexpect\\(" "$FILE_PATH" | head -5 | grep -q "." && { echo "Warning: unwrap()/expect() detected — verify these are not in production code paths" >&2; exit 2; } || exit 0',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.rs$" && grep -nE "^\\s*unsafe\\s*\\{" "$FILE_PATH" | while IFS=: read -r line _; do prev=$((line - 1)); sed -n "${prev}p" "$FILE_PATH" | grep -q "SAFETY:" || { echo "Warning: unsafe block at line $line missing // SAFETY: comment" >&2; exit 2; }; done || exit 0',
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
