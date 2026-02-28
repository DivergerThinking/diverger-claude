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

- Follow the Rust API Guidelines and Clippy recommendations
- Use \`Result<T, E>\` for operations that can fail - avoid \`unwrap()\` in production code
- Use \`Option<T>\` for values that may be absent
- Leverage the ownership system - prefer borrowing (\`&T\`, \`&mut T\`) over cloning
- Use lifetimes explicitly only when the compiler cannot infer them
- Prefer \`impl Trait\` in function signatures for cleaner APIs
- Use derive macros for common traits (\`Debug\`, \`Clone\`, \`PartialEq\`, \`Serialize\`)
- Prefer iterators and combinators over manual loops
- Use \`cargo clippy\` and \`cargo fmt\` as standard development tools`,
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
          'Bash(rustc:*)',
        ],
      },
    },
    rules: [
      {
        path: 'rust/conventions.md',
        governance: 'mandatory',
        description: 'Rust coding conventions',
        content: `# Rust Conventions

## Ownership and Borrowing
- Prefer borrowing (\`&T\`) over transferring ownership when the caller needs to retain the value
- Use \`&mut T\` only when mutation is required
- Avoid unnecessary \`.clone()\` - use references or restructure ownership
- Use \`Cow<'_, T>\` when a function may or may not need to own its data
- Prefer \`Arc<T>\` for shared ownership across threads, \`Rc<T>\` for single-threaded sharing

## Lifetimes
- Let the compiler infer lifetimes via elision rules when possible
- Annotate lifetimes explicitly only when required by the compiler
- Use \`'static\` sparingly - prefer bounded lifetimes
- Name lifetimes descriptively for complex signatures (\`'input\`, \`'conn\`)

## Error Handling
- Use \`Result<T, E>\` for all fallible operations
- Define custom error enums for library/module-level errors
- Use \`thiserror\` for library error types, \`anyhow\` for application error handling
- Use the \`?\` operator for error propagation - avoid manual match on Result
- Never use \`unwrap()\` or \`expect()\` in production code paths
- Use \`Option<T>\` for values that may be absent - chain with \`.map()\`, \`.and_then()\`, \`.unwrap_or_default()\`

## Traits and Generics
- Use traits to define shared behavior and polymorphism
- Prefer \`impl Trait\` in argument position for simple generic bounds
- Use \`where\` clauses for complex trait bounds to improve readability
- Derive common traits: \`Debug\`, \`Clone\`, \`PartialEq\`, \`Eq\`, \`Hash\` as appropriate
- Implement \`Display\` for user-facing types, \`Debug\` for developer-facing output
- Use \`From\`/\`Into\` for idiomatic type conversions
`,
      },
      {
        path: 'rust/patterns.md',
        governance: 'recommended',
        description: 'Rust patterns and idioms',
        content: `# Rust Patterns

## Derive Macros
- Always derive \`Debug\` on structs and enums
- Derive \`Clone\`, \`PartialEq\`, \`Eq\` when meaningful for the type
- Use \`serde::Serialize\` / \`Deserialize\` for data interchange types
- Use \`Default\` and implement it with \`#[derive(Default)]\` or a manual impl for complex defaults

## Pattern Matching
- Use exhaustive match over if-let chains when handling multiple variants
- Use \`if let\` for single-variant matching where other cases are no-ops
- Use \`matches!()\` macro for boolean pattern checks
- Use \`@\` bindings to capture and destructure simultaneously

## Iterators
- Prefer iterator combinators (\`.map()\`, \`.filter()\`, \`.collect()\`) over manual loops
- Use \`.iter()\` for borrowing, \`.into_iter()\` for consuming, \`.iter_mut()\` for mutable borrowing
- Use \`Iterator::collect::<Result<Vec<_>, _>>()\` for fallible collection transforms
- Prefer lazy iterators - only collect when needed

## Project Structure
- Use \`mod.rs\` or file-based modules consistently within a project
- Expose a clean public API from \`lib.rs\` - keep internals private
- Use \`pub(crate)\` for crate-internal visibility
- Organize by domain/feature, not by type (models, handlers, etc.)
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Rust-Specific Review
- Check for unnecessary .clone() calls - suggest borrowing where possible
- Verify no unwrap()/expect() in production code paths
- Check for proper error propagation with the ? operator
- Verify Result and Option are used instead of panicking
- Check for proper lifetime annotations - not too many, not too few
- Verify derive macros include Debug on all public types
- Check for potential ownership issues and unnecessary allocations
- Verify unsafe blocks are justified and documented`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Rust Testing
- Use #[cfg(test)] mod tests for unit tests within the same file
- Use Result<(), Box<dyn Error>> return type for tests that can fail
- Test both Ok and Err variants of Result-returning functions
- Test Option with Some and None cases
- Use assert_eq!, assert_ne!, and assert! macros with descriptive messages
- Use #[should_panic(expected = "...")] for panic-testing where appropriate
- Use proptest or quickcheck for property-based testing`,
      },
    ],
  },
};
