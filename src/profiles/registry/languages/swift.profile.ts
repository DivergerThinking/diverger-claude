import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const swiftProfile: Profile = {
  id: 'languages/swift',
  name: 'Swift',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['swift'],
  contributions: {
    claudeMd: [
      {
        heading: 'Swift Conventions',
        order: 10,
        content: `## Swift Conventions

Swift API Design Guidelines. Value types preferred, protocol-oriented programming.

**Detailed rules:** see \`.claude/rules/swift/\` directory.

**Key rules:**
- Use \`struct\` by default, \`class\` only when reference semantics are needed
- Guard-let for early exits, if-let for optional binding, avoid force unwrapping
- Protocol extensions for default implementations, generics for type-safe abstractions
- Structured concurrency with \`async\`/\`await\`, actors for shared mutable state`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(swift:*)',
          'Bash(swift build:*)',
          'Bash(swift test:*)',
          'Bash(swift run:*)',
          'Bash(swift package:*)',
          'Bash(swiftc:*)',
          'Bash(xcodebuild:*)',
          'Bash(xcrun:*)',
          'Bash(swiftlint:*)',
          'Bash(swiftformat:*)',
          'Bash(xctrace:*)',
          'Bash(simctl:*)',
          'Bash(instruments:*)',
        ],
      },
    },
    rules: [
      {
        path: 'swift/naming-and-style.md',
        paths: ['**/*.swift'],
        governance: 'mandatory',
        description:
          'Swift naming conventions from API Design Guidelines and Google Swift Style Guide',
        content: `# Swift Naming & Style Guide

## Naming Conventions (API Design Guidelines)

- Types, protocols: UpperCamelCase — \`UserProfile\`, \`Codable\`, \`Sendable\`
- Functions, methods, properties: lowerCamelCase — \`fetchUser()\`, \`itemCount\`
- Mutating methods: verb phrases (\`sort()\`); non-mutating: noun/participle (\`sorted()\`)
- Factory methods: \`make\` prefix — \`makeIterator()\`
- Booleans read as assertions: \`isEmpty\`, \`isValid\`, \`hasChanges\`, \`canUndo\`
- Argument labels read grammatically at the call site
- Omit first label when argument is direct object of verb: \`removeItem(item)\`

## Access Control

- Start with most restrictive, widen only when needed
- \`private\` (default for internals) -> \`fileprivate\` -> \`internal\` -> \`package\` -> \`public\` -> \`open\`
- Use \`open\` only when subclassing is an explicit design decision
- Expose only what clients need — keep implementation details private

## Documentation

- Use \`///\` for all public types, functions, properties
- First line: brief summary sentence
- Document with \`- Parameter name:\`, \`- Returns:\`, \`- Throws:\` sections
- Include code examples for non-obvious APIs
`,
      },
      {
        path: 'swift/value-types-and-optionals.md',
        paths: ['**/*.swift'],
        governance: 'mandatory',
        description:
          'Swift value types, optionals safety, and pattern matching best practices',
        content: `# Swift Value Types, Optionals & Pattern Matching

## Value Types vs Reference Types

- Use \`struct\` by default — value semantics, copied on assignment, thread-safe
- Use \`class\` only when identity matters, inheritance is needed, or \`deinit\` is required
- Use \`enum\` for finite state sets with associated data, or as namespace (caseless enum)
- Prefer \`let\` over \`var\` — mutation only when necessary

## Optionals

- Use \`guard let\` for early exit — keeps happy path unindented
- Use \`if let\` when both present and absent branches have meaningful work
- Use \`??\` for default values, \`?.\` for optional chaining
- Use \`.map\`/\`.flatMap\` for optional transformations
- Use \`compactMap\` to filter nil and unwrap in one pass
- NEVER force unwrap (\`!\`) — use guard/if let, \`??\`, or throw instead
- NEVER use \`as!\` — use \`as?\` with guard/if let

## Pattern Matching

- Always match exhaustively — avoid \`default\` when all enum cases are known
- Use \`if case let\` for single-variant extraction
- Use \`for case let\` for filtering collections by pattern
- Use tuple matching and range matching in switch for multi-dimensional dispatch
- The compiler enforces exhaustiveness — omit \`default\` to catch new cases at compile time
`,
      },
      {
        path: 'swift/concurrency.md',
        paths: ['**/*.swift'],
        governance: 'mandatory',
        description:
          'Swift structured concurrency: async/await, actors, Sendable, TaskGroup',
        content: `# Swift Structured Concurrency

## async/await

- Mark functions \`async\` when they perform I/O or call other async functions
- Use \`try await\` to propagate errors from async throwing functions
- Never use completion handlers in new code — use async/await

## Concurrent Execution

- \`async let\` — for a fixed number of independent parallel operations
- \`withThrowingTaskGroup\` — for dynamic number of parallel tasks
- \`Task { }\` — bridge from synchronous context (UIKit lifecycle) to async

## Actors

- Use \`actor\` for shared mutable state — serializes access automatically
- Mark methods \`nonisolated\` when they don't access mutable state
- Use \`@MainActor\` for UI-bound view models and controllers
- Access actor properties/methods with \`await\`

## Sendable

- Value types (structs, enums) with Sendable properties are automatically Sendable
- Mark closures crossing concurrency boundaries as \`@Sendable\`
- Use \`@unchecked Sendable\` only with a \`// SAFETY:\` comment proving thread safety
- Never use \`@unchecked Sendable\` without locks, atomics, or other synchronization

## Strict Concurrency

- Enable strict concurrency checking: \`StrictConcurrency\` feature flag or \`SWIFT_STRICT_CONCURRENCY = complete\`
- Address all concurrency warnings — they become errors in future Swift versions
`,
      },
      {
        path: 'swift/error-handling-and-protocols.md',
        paths: ['**/*.swift'],
        governance: 'recommended',
        description:
          'Swift error handling patterns, protocol-oriented design, and generics',
        content: `# Swift Error Handling, Protocols & Generics

## Error Handling

- Define domain-specific errors as enums conforming to \`Error\` with associated values
- Implement \`LocalizedError\` for user-facing error descriptions
- Use \`throws\` for synchronous errors, \`async throws\` for async
- Use \`Result<T, E>\` only when callbacks cannot throw
- Use typed throws (Swift 6+) to specify exact error types: \`throws(ParseError)\`
- Never swallow errors with empty catch blocks — always log or rethrow
- Catch specific error types — not bare \`catch\`

## Protocol-Oriented Design

- Prefer protocols over base classes — composition over inheritance
- Use protocol extensions for default implementations
- Compose capabilities through multiple protocol conformances
- Use \`some Protocol\` (opaque types) when compiler should know concrete type
- Use \`any Protocol\` (existentials) for heterogeneous collections
- Prefer \`some\` over \`any\` for performance — existentials have indirection overhead

## Generics

- Use constrained generics with \`where\` clauses for type-safe abstractions
- Prefer generics over \`Any\` — provides compile-time type safety
- Use \`associatedtype\` in protocols for generic capability requirements
`,
      },
      {
        path: 'swift/project-structure.md',
        paths: ['**/*.swift'],
        governance: 'recommended',
        description:
          'Swift project structure, SPM conventions, and performance practices',
        content: `# Swift Project Structure & Practices

## SPM Layout

- Library: \`Sources/MyLibrary/\` with public API, \`Tests/MyLibraryTests/\`
- Application: \`Sources/MyApp/\` with thin \`main.swift\`, Features/, Core/
- Xcode: Organize by feature (Auth/, Dashboard/, Settings/) with shared Core/

## Extension Conventions

- Place extensions in separate files: \`TypeName+Capability.swift\`
- One extension per protocol conformance
- Use \`// MARK: -\` to separate logical sections within a file

## Performance Practices

- Swift collections use copy-on-write — mutation copies only when buffer is shared
- Use \`[weak self]\` in closures stored as properties or passed to long-lived objects
- Use \`[unowned self]\` only when self is guaranteed to outlive the closure
- Use \`lazy var\` for expensive resources initialized on first access
- Profile on real devices — Simulator performance differs from hardware
- Use Xcode Instruments for performance analysis, \`XCTMetric\` for regression detection
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Swift-Specific Review

### API Design Guidelines Adherence
- Verify naming follows Swift API Design Guidelines: clarity at the point of use
- Check mutating methods use verb phrases (sort), non-mutating use noun/participle (sorted)
- Verify factory methods use make prefix (makeIterator)
- Check boolean properties read as assertions (isEmpty, isValid, hasChanges)
- Verify argument labels read grammatically at the call site
- Check protocols use -able/-ible/-ing for capabilities, nouns for what-it-is

### Value Types & Optionals
- Verify struct is used over class unless identity/inheritance is explicitly needed
- Flag force unwrapping (!) — suggest guard let, if let, or ?? alternatives
- Check for proper use of compactMap over filter+map with force unwrap
- Verify let is used by default — var only where mutation is necessary
- Flag Any/AnyObject usage — suggest generics or protocols

### Concurrency (Swift 5.5+)
- Check for proper async/await usage — no completion handlers in new code
- Verify Sendable conformance for types crossing isolation boundaries
- Flag @unchecked Sendable without a // SAFETY: comment
- Check that mutable shared state is protected by actors, not manual locks
- Verify @MainActor is applied to UI-related code
- Flag blocking operations (synchronous I/O) inside async functions

### Error Handling
- Verify custom error types conform to Error with associated values for context
- Check for empty catch blocks — always handle or propagate errors
- Verify errors provide LocalizedError conformance for user-facing messages
- Flag catch blocks that swallow error context

### Access Control
- Verify access starts restrictive (private) and expands only as needed
- Check that implementation details are not exposed as public API
- Flag open access level unless subclassing is an explicit design decision

### Memory Management
- Check for retain cycles: closures stored as properties must capture [weak self] or [unowned self]
- Verify delegate properties use weak references
- Flag strong reference cycles between objects`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Swift Testing

### XCTest (Traditional)
- Use XCTestCase subclasses with func test...() methods
- Use XCTAssertEqual, XCTAssertThrowsError, XCTAssertNil, XCTAssertNotNil
- Test async functions with async test methods (func testX() async throws)
- Use XCTUnwrap instead of force-unwrapping in tests
- Use XCUITest for UI testing with accessibility identifiers

### Swift Testing Framework (Swift 5.10+ / Xcode 16+)
- Use @Test attribute for test functions — no class subclassing needed
- Use @Suite for test grouping and shared setup
- Use #expect(expression) for assertions and #require(expression) for preconditions
- Use parameterized tests with @Test(arguments:) for table-driven testing
- Use withKnownIssue {} for known failures

### Test Organization
\`\`\`swift
// Swift Testing example
@Suite("PaymentService")
struct PaymentServiceTests {
    let sut: PaymentService
    let mockGateway: MockPaymentGateway

    init() {
        mockGateway = MockPaymentGateway()
        sut = PaymentService(gateway: mockGateway)
    }

    @Test("processes valid payment")
    func validPayment() async throws {
        let result = try await sut.process(amount: 100)
        #expect(result.status == .success)
    }

    @Test("rejects negative amount", arguments: [-1, -100, -0.01])
    func negativeAmount(amount: Decimal) async {
        await #expect(throws: PaymentError.invalidAmount(amount)) {
            try await sut.process(amount: amount)
        }
    }
}
\`\`\`

### Mocking Strategy
- Use protocols for dependencies — inject mock conformances in tests
- Prefer hand-written mocks over mocking frameworks for clarity
- Use actor-based mocks for concurrent test scenarios`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Swift-Specific Security Review

### Memory & Data Safety
- Verify no force unwrapping of user-provided or network data
- Check that sensitive data (passwords, tokens) is stored in Keychain, not UserDefaults
- Verify URLSession uses certificate pinning for sensitive endpoints
- Flag hardcoded API keys, secrets, or credentials in source code
- Check that sensitive strings use Data instead of String to enable secure clearing

### Input Validation
- Verify all external input (URL parameters, JSON payloads, deep links) is validated before use
- Check URL construction uses URLComponents — never string interpolation for URLs
- Verify file paths from external input are sandboxed to the app container
- Flag direct use of NSCoding/NSKeyedUnarchiver on untrusted data — use Codable

### App Transport Security
- Verify Info.plist does not disable ATS (NSAllowsArbitraryLoads = YES) in production
- Check that exception domains are justified and minimal
- Verify TLS 1.2+ is enforced for all network connections

### Concurrency Safety
- Verify Sendable conformance on types crossing isolation boundaries
- Flag data races: mutable state accessed from multiple tasks without actor isolation
- Check for @unchecked Sendable without safety justification
- Verify no DispatchQueue.main.sync calls from the main thread (deadlock risk)`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['swift-spm-helper'],
        prompt: `## Swift-Specific Refactoring

### Modernization
- Convert completion handler APIs to async/await using withCheckedThrowingContinuation
- Replace Combine publishers with AsyncSequence/AsyncStream where appropriate
- Replace DispatchQueue for shared state with actors
- Replace delegate patterns with async sequences or closures
- Replace NotificationCenter observers with AsyncSequence notifications
- Migrate from NSCoding to Codable for serialization

### Protocol Refactoring
- Extract protocol from concrete type when multiple conformances are needed
- Replace class inheritance hierarchies with protocol composition
- Add default implementations via protocol extensions to reduce conformance boilerplate
- Replace type erasure (AnyPublisher, AnySequence) with opaque types (some) where possible

### Value Type Migration
- Convert classes to structs when identity is not needed
- Replace mutable class properties with immutable struct + mutation methods
- Use enum with associated values instead of class hierarchy for finite state sets`,
      },
    ],
    skills: [
      {
        name: 'swift-spm-helper',
        description:
          'Swift Package Manager commands, dependency management, and build operations',
        content: `# Swift Package Manager Helper

## Build & Run
- \`swift build\` — compile the package in debug mode
- \`swift build -c release\` — compile with optimizations
- \`swift run\` — build and run the executable target
- \`swift run TargetName\` — run a specific executable target
- \`swift build --show-bin-path\` — show the path to built binaries

## Testing
- \`swift test\` — run all tests
- \`swift test --filter TestSuiteName\` — run tests matching a pattern
- \`swift test --filter TestSuiteName/testMethodName\` — run a specific test
- \`swift test --parallel\` — run tests in parallel
- \`swift test --enable-code-coverage\` — generate code coverage data
- \`swift test -c release\` — run tests with release optimizations (for perf tests)
- \`xcrun llvm-cov report .build/debug/MyPackagePackageTests.xctest/Contents/MacOS/MyPackagePackageTests --instr-profile .build/debug/codecov/default.profdata\` — view coverage report

## Dependency Management
- \`swift package resolve\` — resolve and fetch dependencies
- \`swift package update\` — update dependencies to latest compatible versions
- \`swift package show-dependencies\` — display the dependency tree
- \`swift package show-dependencies --format json\` — JSON dependency tree
- \`swift package reset\` — clear the build and package caches

## Package Authoring
- \`swift package init --type library\` — create a new library package
- \`swift package init --type executable\` — create a new executable package
- \`swift package dump-package\` — output Package.swift as JSON
- \`swift package describe\` — describe the package structure
- \`swift package generate-xcodeproj\` — generate an Xcode project (legacy)

## Xcode Build
- \`xcodebuild -scheme MyScheme -destination 'platform=iOS Simulator,name=iPhone 16' build\` — build for simulator
- \`xcodebuild -scheme MyScheme test\` — run tests via xcodebuild
- \`xcodebuild -showdestinations -scheme MyScheme\` — list available destinations
- \`xcodebuild -list\` — list all schemes and targets
`,
      },
      {
        name: 'swift-modernize',
        description:
          'Modernize legacy Swift patterns to structured concurrency, actors, and Swift 6',
        content: `# Swift Modernization Skill

## Completion Handlers to async/await

### Using Continuations
\`\`\`swift
// Before: completion handler
func fetchData(completion: @escaping (Result<Data, Error>) -> Void) { ... }

// After: async/await wrapper using continuation
func fetchData() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        fetchData { result in
            continuation.resume(with: result)
        }
    }
}
\`\`\`

## Delegates to AsyncStream
\`\`\`swift
// Before: delegate pattern
protocol LocationDelegate: AnyObject {
    func didUpdateLocation(_ location: CLLocation)
    func didFailWithError(_ error: Error)
}

// After: AsyncStream
func locationUpdates() -> AsyncThrowingStream<CLLocation, Error> {
    AsyncThrowingStream { continuation in
        let delegate = StreamingLocationDelegate(continuation: continuation)
        locationManager.delegate = delegate
        locationManager.startUpdatingLocation()

        continuation.onTermination = { _ in
            locationManager.stopUpdatingLocation()
        }
    }
}
\`\`\`

## DispatchQueue to Actors
\`\`\`swift
// Before: manual locking with DispatchQueue
class UserCache {
    private let queue = DispatchQueue(label: "cache.queue")
    private var storage: [String: User] = [:]

    func get(_ key: String) -> User? {
        queue.sync { storage[key] }
    }

    func set(_ user: User, for key: String) {
        queue.async { self.storage[key] = user }
    }
}

// After: actor with automatic isolation
actor UserCache {
    private var storage: [String: User] = [:]

    func get(_ key: String) -> User? {
        storage[key]
    }

    func set(_ user: User, for key: String) {
        storage[key] = user
    }
}
\`\`\`

## Combine to AsyncSequence
\`\`\`swift
// Before: Combine publisher
cancellable = publisher
    .filter { $0.isActive }
    .map { $0.name }
    .sink { name in process(name) }

// After: AsyncSequence
for await user in users.values where user.isActive {
    process(user.name)
}
\`\`\`

## NotificationCenter to AsyncSequence
\`\`\`swift
// Before: selector-based observation
NotificationCenter.default.addObserver(
    self, selector: #selector(handleNotification), name: .dataDidChange, object: nil
)

// After: async notification sequence
for await _ in NotificationCenter.default.notifications(named: .dataDidChange) {
    await refreshData()
}
\`\`\`
`,
      },
      {
        name: 'swift-debug',
        description:
          'Swift debugging, LLDB commands, Instruments profiling, and diagnostics',
        content: `# Swift Debug & Diagnostics Skill

## LLDB Debugger
- \`po expression\` — print object description (uses debugDescription)
- \`p expression\` — print value with type information
- \`v variableName\` — print local variable (fast, no expression evaluation)
- \`expression variable = newValue\` — modify a variable at runtime
- \`thread backtrace\` / \`bt\` — show current thread's call stack
- \`thread backtrace all\` — show all threads' call stacks
- \`breakpoint set -n functionName\` — set breakpoint by function name
- \`breakpoint set -f file.swift -l 42\` — set breakpoint by file and line
- \`watchpoint set variable variableName\` — break when a variable changes
- \`image lookup -rn "ClassName"\` — search for symbols matching a regex

## Runtime Diagnostics

### Thread Sanitizer (TSan)
Enable in Xcode: Edit Scheme > Run > Diagnostics > Thread Sanitizer
Detects data races at runtime — run regularly during development.

### Address Sanitizer (ASan)
Enable in Xcode: Edit Scheme > Run > Diagnostics > Address Sanitizer
Detects memory errors: use-after-free, buffer overflow, stack overflow.

### Undefined Behavior Sanitizer (UBSan)
Detects undefined behavior: integer overflow, null pointer dereference, alignment violations.

### Memory Graph Debugger
Use Xcode's Debug Memory Graph to visualize retain cycles and leaked objects.

## Instruments Profiling
- Time Profiler — identify CPU bottlenecks and hot functions
- Allocations — track memory allocation patterns and growth
- Leaks — detect memory leaks from retain cycles
- Network — profile network request timing and payload sizes
- Core Data — analyze fetch performance and faulting behavior
- SwiftUI View Body — profile SwiftUI view update frequency (Xcode 15+)
- Launch Time — measure app launch duration and bottlenecks

## Structured Logging (OSLog)
\`\`\`swift
import os

private let logger = Logger(subsystem: "com.company.myapp", category: "networking")

func fetchUser(id: String) async throws -> User {
    logger.info("Fetching user: \\(id, privacy: .public)")
    let start = Date()

    do {
        let user = try await apiClient.fetch(id: id)
        logger.info("User fetched in \\(Date().timeIntervalSince(start))s")
        return user
    } catch {
        logger.error("Failed to fetch user \\(id): \\(error.localizedDescription)")
        throw error
    }
}

// Privacy levels:
// .public — visible in Console.app and log archives
// .private — redacted in production, visible in Xcode debugger
// .sensitive — always redacted
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.swift$" && grep -nE "\\![[:space:]]*$|as!|try!|\\bfirst!|\\blast!" "$FILE_PATH" | head -5 | grep -q "." && { echo "Warning: force unwrap (!) detected — verify this is intentional and safe" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for force unwrap usage',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.swift$" && grep -nE "@unchecked Sendable" "$FILE_PATH" | while IFS=: read -r line _; do prev=$((line - 1)); sed -n "${prev}p" "$FILE_PATH" | grep -qiE "SAFETY:|safety:" || { echo "Warning: @unchecked Sendable at line $line missing // SAFETY: comment" >&2; exit 2; }; done || exit 0',
            timeout: 10,
            statusMessage: 'Checking for @unchecked Sendable without SAFETY comment',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.swift$" && command -v swiftlint >/dev/null 2>&1 && swiftlint lint --quiet --path "$FILE_PATH" 2>/dev/null | head -10 | grep -q "." && { echo "SwiftLint issues detected — review and fix" >&2; exit 2; } || exit 0',
            timeout: 15,
            statusMessage: 'Running SwiftLint checks',
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'swiftlint',
        filePath: '.swiftlint.yml',
        config: {
          disabled_rules: ['trailing_whitespace'],
          opt_in_rules: [
            'empty_count',
            'missing_docs',
            'fatal_error_message',
            'force_unwrapping',
            'implicitly_unwrapped_optional',
            'private_outlet',
            'private_action',
            'overridden_super_call',
            'closure_end_indentation',
            'closure_spacing',
            'collection_alignment',
            'contains_over_filter_count',
            'contains_over_first_not_nil',
            'discouraged_optional_boolean',
            'empty_string',
            'enum_case_associated_values_count',
            'first_where',
            'flatmap_over_map_reduce',
            'last_where',
            'legacy_multiple',
            'modifier_order',
            'multiline_arguments',
            'multiline_parameters',
            'operator_usage_whitespace',
            'prefer_self_in_static_references',
            'prefer_zero_over_explicit_init',
            'redundant_nil_coalescing',
            'sorted_first_last',
            'toggle_bool',
            'unneeded_parentheses_in_closure_argument',
            'vertical_parameter_alignment_on_call',
            'yoda_condition',
          ],
          analyzer_rules: [
            'unused_import',
            'unused_declaration',
          ],
          line_length: { warning: 120, error: 200, ignores_comments: true },
          type_body_length: { warning: 300, error: 500 },
          file_length: { warning: 500, error: 1000 },
          function_body_length: { warning: 40, error: 80 },
          function_parameter_count: { warning: 5, error: 8 },
          type_name: {
            min_length: { warning: 3, error: 2 },
            max_length: { warning: 50, error: 60 },
          },
          identifier_name: {
            min_length: { warning: 2, error: 1 },
            max_length: { warning: 50, error: 60 },
            excluded: ['id', 'x', 'y', 'i', 'j', 'k', 'to', 'at', 'by', 'on', 'in', 'up'],
          },
          nesting: {
            type_level: { warning: 2 },
            function_level: { warning: 3 },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
