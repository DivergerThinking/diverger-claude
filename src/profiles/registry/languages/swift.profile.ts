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

### API Design Guidelines (swift.org)
- Clarity at the point of use is the most important goal — every declaration should read naturally at the call site
- Prefer clarity over brevity — do not abbreviate names; use full words that describe intent
- Use grammatical English phrases for method names: \`x.insert(y, at: z)\` reads as "x, insert y at z"
- Name methods and functions for their side effects: verb phrases for mutating (\`sort()\`, \`append(_:)\`), noun phrases for non-mutating (\`sorted()\`, \`appending(_:)\`)
- Boolean properties read as assertions: \`isEmpty\`, \`isConnected\`, \`hasContent\`, \`canWrite\`
- Protocols describing a capability use \`-able\`, \`-ible\`, or \`-ing\` suffix: \`Equatable\`, \`Encodable\`, \`ProgressReporting\`
- Protocols describing what something is use a noun: \`Collection\`, \`Sequence\`, \`IteratorProtocol\`

### Type System
- Prefer value types (\`struct\`, \`enum\`) over reference types (\`class\`) unless identity or reference semantics are required
- Use \`let\` by default — only use \`var\` when mutation is genuinely needed
- Leverage the type system: avoid \`Any\` and \`AnyObject\` — use generics or protocols with associated types
- Use enums with associated values for state modeling and algebraic data types
- Use property wrappers (\`@propertyWrapper\`) for reusable cross-cutting property behaviors
- Use opaque types (\`some Protocol\`) to hide implementation details while preserving type identity

### Optionals & Safety
- Never force-unwrap (\`!\`) unless failure is a programmer error with a clear invariant
- Use \`guard let\` for early exits that clarify the happy path
- Use \`if let\` / \`if case let\` for conditional binding within a scope
- Use \`??\` (nil coalescing) for default values
- Chain optionals with \`?.\` and transform with \`map\` / \`flatMap\`
- Prefer \`compactMap\` over \`filter + map\` when unwrapping optionals from sequences

### Concurrency (Swift 5.5+)
- Use \`async/await\` for all asynchronous operations — avoid completion handlers in new code
- Use \`actor\` to protect mutable shared state — prefer actor isolation over manual locking
- Mark types as \`Sendable\` when they cross concurrency boundaries
- Use \`TaskGroup\` for structured parallel work; \`async let\` for concurrent bindings
- Mark UI-related code with \`@MainActor\`
- Enable strict concurrency checking (\`SWIFT_STRICT_CONCURRENCY=complete\`) in build settings

### Tooling
- Run SwiftLint on every save — enforce consistent style across the team
- Run \`swift build\` and \`swift test\` before committing
- Use \`swift package\` commands for SPM dependency management
- Use Xcode Instruments for performance profiling and memory leak detection`,
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
        governance: 'mandatory',
        description:
          'Swift naming conventions from API Design Guidelines and Google Swift Style Guide',
        content: `# Swift Naming & Style Guide

## Naming Conventions

### Types, Protocols, and Associated Types
- UpperCamelCase for all types: \`UserProfile\`, \`NetworkManager\`, \`CachePolicy\`
- Protocols describing capability: \`Equatable\`, \`Codable\`, \`Sendable\`
- Protocols describing what something is: \`Collection\`, \`Sequence\`, \`Iterator\`
- Associated types: UpperCamelCase, descriptive: \`Element\`, \`Key\`, \`Value\`

### Functions, Methods, and Properties
- lowerCamelCase for all non-type declarations: \`fetchUser()\`, \`itemCount\`, \`isReady\`
- Mutating methods use verb phrases: \`sort()\`, \`append(_:)\`, \`removeAll()\`
- Non-mutating counterparts use noun/past-participle: \`sorted()\`, \`appending(_:)\`, \`removingAll()\`
- Factory methods start with \`make\`: \`makeIterator()\`, \`makeBody(configuration:)\`
- Boolean properties read as assertions: \`isEmpty\`, \`isValid\`, \`hasChanges\`, \`canUndo\`

### Argument Labels
- Choose labels that read grammatically at the call site
- Use first argument labels when the function name does not describe the first argument's role
- Omit the first argument label when the argument is the direct object of a verb: \`print(value)\`, \`removeItem(item)\`
- Use prepositions to clarify relationships: \`moveTo(x:y:)\`, \`fadeFrom(color:)\`

### Correct
\`\`\`swift
// Reads naturally: "queue.enqueue(message, at: priority)"
func enqueue(_ message: Message, at priority: Priority) { ... }

// Mutating: verb phrase
mutating func sort() { ... }

// Non-mutating: noun/participle
func sorted() -> [Element] { ... }

// Factory method
func makeIterator() -> IndexingIterator<Self> { ... }

// Boolean reads as assertion
var isEmpty: Bool { count == 0 }
\`\`\`

### Anti-Pattern
\`\`\`swift
// Bad: unclear at call site, abbreviation, non-grammatical
func proc(_ m: Msg, _ p: Int) { ... }  // proc(msg, 3) — meaningless

// Bad: mutating method uses noun (suggests non-mutating)
mutating func sorted() { ... }  // Confusing: mutates in place but name implies copy

// Bad: boolean does not read as assertion
var valid: Bool { ... }  // Should be isValid

// Bad: factory without make prefix
func iterator() -> SomeIterator { ... }  // Should be makeIterator()
\`\`\`

---

## Access Control

Start with the most restrictive access level and widen only when needed.

| Level | Scope | Use When |
|-------|-------|----------|
| \`private\` | Same declaration | Default choice for implementation details |
| \`fileprivate\` | Same file | Rarely — extensions in the same file that need access |
| \`internal\` | Same module | Default (implicit) for module-internal API |
| \`package\` | Same package (Swift 5.9+) | Multi-module packages sharing internal API |
| \`public\` | Any module | Module's external API |
| \`open\` | Any module + subclass | Only when subclassing is an explicit design decision |

\`\`\`swift
// Correct: expose only what clients need
public struct NetworkClient {
    public let baseURL: URL

    private let session: URLSession
    private let decoder: JSONDecoder

    public init(baseURL: URL) {
        self.baseURL = baseURL
        self.session = URLSession(configuration: .default)
        self.decoder = JSONDecoder()
    }

    public func fetch<T: Decodable>(_ endpoint: String) async throws -> T {
        let data = try await performRequest(endpoint)
        return try decoder.decode(T.self, from: data)
    }

    private func performRequest(_ endpoint: String) async throws -> Data {
        let url = baseURL.appendingPathComponent(endpoint)
        let (data, response) = try await session.data(from: url)
        try validate(response)
        return data
    }

    private func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw NetworkError.invalidResponse
        }
    }
}
\`\`\`

---

## Documentation Comments

- Use \`///\` for symbol documentation (types, functions, properties)
- Use \`/** */\` or \`//!\` sparingly — prefer \`///\`
- First line is a brief summary (one sentence)
- Document parameters with \`- Parameter name:\`, return with \`- Returns:\`, throws with \`- Throws:\`
- Include code examples for non-obvious APIs

\`\`\`swift
/// Fetches a user by their unique identifier.
///
/// Performs a network request to the user endpoint and decodes the response.
/// The request respects the client's configured timeout and retry policy.
///
/// - Parameter id: The unique identifier of the user to fetch.
/// - Returns: The decoded \`User\` object.
/// - Throws: \`NetworkError.notFound\` if no user exists with the given ID.
///           \`NetworkError.unauthorized\` if the session token has expired.
public func fetchUser(id: String) async throws -> User {
    // ...
}
\`\`\`
`,
      },
      {
        path: 'swift/value-types-and-optionals.md',
        governance: 'mandatory',
        description:
          'Swift value types, optionals safety, and pattern matching best practices',
        content: `# Swift Value Types, Optionals & Pattern Matching

## Value Types vs Reference Types

### When to Use struct (Default)
- Data is logically a value (copied on assignment)
- No need for identity — two instances with the same data are interchangeable
- Thread safety is important — value types avoid shared mutable state

### When to Use class
- Identity matters (two references to the same instance must behave as one)
- Inheritance is part of the design (UIKit subclasses, NSObject interop)
- You need deinit for resource cleanup

### When to Use enum
- A finite set of related states: \`LoadingState\`, \`Result\`, \`Direction\`
- State machines with associated data
- Namespace for related constants (caseless enum)

\`\`\`swift
// Correct: value type for a data model
struct UserProfile: Equatable, Codable, Sendable {
    let id: UUID
    var displayName: String
    var email: String
    var avatarURL: URL?
}

// Correct: enum for state modeling with associated values
enum LoadingState<T: Sendable>: Sendable {
    case idle
    case loading
    case loaded(T)
    case failed(Error)
}

// Correct: caseless enum as namespace
enum APIConstants {
    static let baseURL = URL(string: "https://api.example.com")!
    static let timeoutInterval: TimeInterval = 30
    static let maxRetries = 3
}
\`\`\`

### Anti-Pattern
\`\`\`swift
// Bad: using class for a simple data model with no identity needs
class UserProfile {
    var id: UUID          // Shared mutable state — thread-unsafe
    var displayName: String
    var email: String
    // Problem: accidental aliasing when passed around
}
\`\`\`

---

## Optionals

### guard let — Early Exit
Use \`guard\` to validate preconditions and exit early, keeping the happy path unindented.

\`\`\`swift
func processPayment(for orderID: String?) throws -> Receipt {
    guard let orderID else {
        throw PaymentError.missingOrderID
    }

    guard let order = try? orderRepository.find(by: orderID) else {
        throw PaymentError.orderNotFound(orderID)
    }

    guard order.status == .confirmed else {
        throw PaymentError.invalidStatus(order.status)
    }

    return try chargePayment(for: order)
}
\`\`\`

### if let — Conditional Binding
Use \`if let\` when both branches (present and absent) have meaningful work.

\`\`\`swift
if let cachedUser = cache.user(for: id) {
    return cachedUser
} else {
    let freshUser = try await api.fetchUser(id: id)
    cache.store(freshUser, for: id)
    return freshUser
}
\`\`\`

### Nil Coalescing and Optional Chaining
\`\`\`swift
// Default value with ??
let displayName = user.nickname ?? user.fullName ?? "Anonymous"

// Optional chaining
let cityName = user.address?.city?.name

// Transform optional with map/flatMap
let uppercased = user.nickname.map { $0.uppercased() }  // String?
let parsed = rawValue.flatMap { Int($0) }                // Int?
\`\`\`

### compactMap for Unwrapping Sequences
\`\`\`swift
// Correct: compactMap filters nil and unwraps in one pass
let validIDs = rawIDs.compactMap { UUID(uuidString: $0) }

// Anti-pattern: filter + map does the same work less clearly
let validIDs = rawIDs
    .filter { UUID(uuidString: $0) != nil }
    .map { UUID(uuidString: $0)! }  // Force unwrap — dangerous if logic changes
\`\`\`

### Anti-Pattern: Force Unwrapping
\`\`\`swift
// Bad: crashes at runtime if assumptions break
let user = users.first!                      // Use .first with guard/if let
let name = json["name"] as! String           // Use as? with guard/if let
let url = URL(string: userInput)!            // User input is never guaranteed
let value = dictionary[key]!                 // Key may not exist
\`\`\`

---

## Pattern Matching

### switch with Enums
Always match exhaustively. Avoid \`default\` when all cases are known — the compiler
catches new cases at compile time if you omit \`default\`.

\`\`\`swift
enum NetworkError: Error {
    case timeout
    case unauthorized
    case notFound
    case serverError(statusCode: Int)
}

func handle(_ error: NetworkError) {
    switch error {
    case .timeout:
        showRetryDialog()
    case .unauthorized:
        redirectToLogin()
    case .notFound:
        showEmptyState()
    case .serverError(let code) where code >= 500:
        logCritical(code: code)
        showGenericError()
    case .serverError(let code):
        logWarning(code: code)
        showGenericError()
    }
    // No default — compiler enforces exhaustiveness
}
\`\`\`

### if case let — Single Pattern Extraction
\`\`\`swift
if case .loaded(let items) = state, !items.isEmpty {
    renderList(items)
}
\`\`\`

### for case let — Filtering Collections by Pattern
\`\`\`swift
let successResults = results.compactMap { result -> User? in
    if case .success(let user) = result { return user }
    return nil
}

// Or with for-case-let
for case .success(let user) in results {
    process(user)
}
\`\`\`

### Tuple and Range Matching
\`\`\`swift
func classify(statusCode: Int, method: String) -> String {
    switch (statusCode, method) {
    case (200...299, _):       return "success"
    case (401, _):             return "unauthorized"
    case (404, "GET"):         return "not found"
    case (500...599, _):       return "server error"
    default:                   return "unknown"
    }
}
\`\`\`
`,
      },
      {
        path: 'swift/concurrency.md',
        governance: 'mandatory',
        description:
          'Swift structured concurrency: async/await, actors, Sendable, TaskGroup',
        content: `# Swift Structured Concurrency

## async/await

### Basic Usage
- Mark functions \`async\` when they perform I/O or call other async functions
- Use \`try await\` to propagate errors from async throwing functions
- Avoid mixing completion handlers and async/await in the same API layer

\`\`\`swift
// Correct: clean async/await chain
func fetchUserProfile(id: String) async throws -> UserProfile {
    let userData = try await apiClient.fetch("/users/\\(id)")
    let user = try JSONDecoder().decode(User.self, from: userData)

    let avatarData = try await apiClient.fetch(user.avatarURL)
    let avatar = UIImage(data: avatarData)

    return UserProfile(user: user, avatar: avatar)
}
\`\`\`

### Anti-Pattern: Completion Handlers in New Code
\`\`\`swift
// Bad: callback pyramid in new code — use async/await
func fetchUserProfile(id: String, completion: @escaping (Result<UserProfile, Error>) -> Void) {
    apiClient.fetch("/users/\\(id)") { result in
        switch result {
        case .success(let data):
            let user = try? JSONDecoder().decode(User.self, from: data)
            guard let user else {
                completion(.failure(DecodingError.decodingFailed))
                return
            }
            apiClient.fetch(user.avatarURL) { avatarResult in
                // Nested further...
            }
        case .failure(let error):
            completion(.failure(error))
        }
    }
}
\`\`\`

---

## Concurrent Execution

### async let — Concurrent Bindings
Use when you need to run a fixed number of independent async operations in parallel.

\`\`\`swift
func loadDashboard(userID: String) async throws -> Dashboard {
    async let profile = fetchProfile(userID: userID)
    async let orders = fetchRecentOrders(userID: userID)
    async let notifications = fetchNotifications(userID: userID)

    return try await Dashboard(
        profile: profile,
        orders: orders,
        notifications: notifications
    )
}
\`\`\`

### TaskGroup — Dynamic Parallel Work
Use when the number of concurrent tasks is determined at runtime.

\`\`\`swift
func fetchAllUsers(ids: [String]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                try await self.fetchUser(id: id)
            }
        }

        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}
\`\`\`

### Task — Bridging Sync to Async
\`\`\`swift
// Bridge from synchronous context (e.g., UIKit lifecycle)
override func viewDidLoad() {
    super.viewDidLoad()

    Task {
        do {
            let data = try await viewModel.loadData()
            updateUI(with: data)
        } catch {
            showError(error)
        }
    }
}
\`\`\`

---

## Actors

### Actor for Shared Mutable State
Actors provide data-race safety by serializing access to their mutable state.

\`\`\`swift
actor ImageCache {
    private var cache: [URL: UIImage] = [:]

    func image(for url: URL) -> UIImage? {
        cache[url]
    }

    func store(_ image: UIImage, for url: URL) {
        cache[url] = image
    }

    func clearAll() {
        cache.removeAll()
    }
}

// Usage: all access is automatically serialized
let cache = ImageCache()
let image = await cache.image(for: url)
\`\`\`

### nonisolated — Opt Out of Actor Isolation
Mark methods \`nonisolated\` when they do not access the actor's mutable state.

\`\`\`swift
actor DatabaseConnection {
    private var connection: SQLiteConnection

    // Does not access mutable state — safe to call without isolation
    nonisolated var databasePath: String {
        "/var/data/app.sqlite"
    }

    nonisolated func supportedVersions() -> [String] {
        ["3.39", "3.40", "3.41"]
    }

    func execute(_ query: String) async throws -> [Row] {
        try connection.execute(query)
    }
}
\`\`\`

### @MainActor — UI Isolation
\`\`\`swift
@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var error: Error?

    private let service: UserService

    func loadProfile(id: String) async {
        isLoading = true
        defer { isLoading = false }

        do {
            user = try await service.fetchUser(id: id)
        } catch {
            self.error = error
        }
    }
}
\`\`\`

---

## Sendable

### Value Types Are Sendable by Default
Structs and enums with only Sendable-stored properties automatically conform.

\`\`\`swift
// Automatically Sendable — all stored properties are Sendable
struct UserDTO: Codable, Sendable {
    let id: UUID
    let name: String
    let email: String
}
\`\`\`

### Mark @Sendable Closures
Closures passed across concurrency boundaries must be \`@Sendable\`.

\`\`\`swift
func perform(on queue: DispatchQueue, work: @escaping @Sendable () -> Void) {
    queue.async(execute: work)
}
\`\`\`

### @unchecked Sendable — Last Resort
Use only when you can prove thread safety through other means (locks, atomics)
and the compiler cannot verify it. Always document the safety justification.

\`\`\`swift
// SAFETY: All mutable state is protected by the internal lock.
// This class is safe to access from multiple threads concurrently.
final class ThreadSafeCounter: @unchecked Sendable {
    private var _count = 0
    private let lock = NSLock()

    var count: Int {
        lock.lock()
        defer { lock.unlock() }
        return _count
    }

    func increment() {
        lock.lock()
        defer { lock.unlock() }
        _count += 1
    }
}
\`\`\`

---

## Strict Concurrency Checking

Enable strict concurrency checking in build settings to catch data-race issues at compile time:

\`\`\`
// In Package.swift
swiftSettings: [.enableExperimentalFeature("StrictConcurrency")]

// Or in Xcode Build Settings
SWIFT_STRICT_CONCURRENCY = complete
\`\`\`

Address all warnings before they become errors in future Swift versions.
`,
      },
      {
        path: 'swift/error-handling-and-protocols.md',
        governance: 'recommended',
        description:
          'Swift error handling patterns, protocol-oriented design, and generics',
        content: `# Swift Error Handling, Protocols & Generics

## Error Handling

### Define Domain-Specific Errors
Use enums conforming to \`Error\` with associated values for context.

\`\`\`swift
enum PaymentError: Error, LocalizedError {
    case insufficientFunds(available: Decimal, required: Decimal)
    case cardDeclined(reason: String)
    case networkTimeout(after: TimeInterval)
    case invalidAmount(Decimal)

    var errorDescription: String? {
        switch self {
        case .insufficientFunds(let available, let required):
            return "Insufficient funds: \\(available) available, \\(required) required"
        case .cardDeclined(let reason):
            return "Card declined: \\(reason)"
        case .networkTimeout(let duration):
            return "Network timeout after \\(duration) seconds"
        case .invalidAmount(let amount):
            return "Invalid payment amount: \\(amount)"
        }
    }
}
\`\`\`

### Use throws for Synchronous Errors
\`\`\`swift
func validateOrder(_ order: Order) throws {
    guard !order.items.isEmpty else {
        throw OrderError.emptyCart
    }

    guard order.total > 0 else {
        throw OrderError.invalidTotal(order.total)
    }

    for item in order.items {
        guard item.quantity > 0 else {
            throw OrderError.invalidQuantity(item: item.name, quantity: item.quantity)
        }
    }
}
\`\`\`

### Use Result When Callbacks Cannot throw
\`\`\`swift
// When working with APIs that take non-throwing closures
func loadImage(from url: URL, completion: @escaping (Result<UIImage, ImageError>) -> Void) {
    URLSession.shared.dataTask(with: url) { data, response, error in
        if let error {
            completion(.failure(.networkError(error)))
            return
        }
        guard let data, let image = UIImage(data: data) else {
            completion(.failure(.invalidData))
            return
        }
        completion(.success(image))
    }.resume()
}
\`\`\`

### Typed Throws (Swift 6+)
\`\`\`swift
// Typed throws specify the exact error type a function can throw
func parse(_ input: String) throws(ParseError) -> AST {
    guard !input.isEmpty else {
        throw .emptyInput
    }
    return try tokenize(input).map(buildNode)
}
\`\`\`

### Anti-Pattern: Catch-All Silencing
\`\`\`swift
// Bad: silently swallows all errors
do {
    try dangerousOperation()
} catch {
    // Empty catch — caller never knows what happened
}

// Bad: catches everything without distinguishing error types
do {
    try processPayment()
} catch {
    print("Something went wrong")  // No context for debugging
}
\`\`\`

---

## Protocol-Oriented Design

### Prefer Protocols Over Base Classes
Protocols with default implementations via extensions provide composition without inheritance.

\`\`\`swift
protocol Cacheable {
    associatedtype CacheKey: Hashable
    var cacheKey: CacheKey { get }
    var cacheDuration: TimeInterval { get }
}

extension Cacheable {
    var cacheDuration: TimeInterval { 300 } // Default: 5 minutes
}

protocol Validatable {
    func validate() throws
}

// Compose capabilities through protocol conformance
struct UserProfile: Cacheable, Validatable, Codable, Sendable {
    let id: UUID
    var name: String
    var email: String

    var cacheKey: UUID { id }

    func validate() throws {
        guard !name.isEmpty else { throw ValidationError.emptyField("name") }
        guard email.contains("@") else { throw ValidationError.invalidEmail(email) }
    }
}
\`\`\`

### Protocol Extensions for Shared Behavior
\`\`\`swift
protocol APIEndpoint {
    var path: String { get }
    var method: HTTPMethod { get }
    var headers: [String: String] { get }
}

extension APIEndpoint {
    var headers: [String: String] {
        ["Content-Type": "application/json", "Accept": "application/json"]
    }

    func buildRequest(baseURL: URL) -> URLRequest {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method.rawValue
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        return request
    }
}
\`\`\`

### Protocol Witness / Existential Awareness
- Use \`some Protocol\` (opaque types) when you want the compiler to know the concrete type
- Use \`any Protocol\` (existential) when you need heterogeneous collections or dynamic dispatch
- Prefer \`some\` over \`any\` for performance — existentials have allocation and indirection overhead

\`\`\`swift
// some — compiler knows the concrete type (monomorphized)
func makeDataSource() -> some DataSource {
    InMemoryDataSource()
}

// any — heterogeneous collection of different conforming types
func allDataSources() -> [any DataSource] {
    [InMemoryDataSource(), SQLiteDataSource(), RemoteDataSource()]
}
\`\`\`

---

## Generics

### Constrained Generics
\`\`\`swift
// Generic function with constraints
func findDuplicates<T: Hashable>(in items: [T]) -> Set<T> {
    var seen = Set<T>()
    var duplicates = Set<T>()
    for item in items {
        if !seen.insert(item).inserted {
            duplicates.insert(item)
        }
    }
    return duplicates
}

// Generic type with where clause
struct Cache<Key: Hashable, Value> where Value: Codable & Sendable {
    private var storage: [Key: (value: Value, expiry: Date)] = [:]

    mutating func set(_ value: Value, for key: Key, ttl: TimeInterval) {
        storage[key] = (value, Date().addingTimeInterval(ttl))
    }

    func get(_ key: Key) -> Value? {
        guard let entry = storage[key], entry.expiry > Date() else { return nil }
        return entry.value
    }
}
\`\`\`

### Anti-Pattern: Unnecessary Type Erasure
\`\`\`swift
// Bad: using Any when a generic or protocol would be type-safe
func store(_ value: Any, forKey key: String) { ... }
let name = store["name"] as! String  // Runtime crash risk

// Correct: use generics for type safety
func store<T: Codable>(_ value: T, forKey key: String) { ... }
func retrieve<T: Codable>(forKey key: String) -> T? { ... }
\`\`\`
`,
      },
      {
        path: 'swift/project-structure.md',
        governance: 'recommended',
        description:
          'Swift project structure, SPM conventions, and performance practices',
        content: `# Swift Project Structure & Practices

## Swift Package Manager (SPM) Layout

### Library Package
\`\`\`
MyLibrary/
  Package.swift
  Sources/
    MyLibrary/
      MyLibrary.swift        // Public API surface
      Models/
        User.swift
        Order.swift
      Networking/
        APIClient.swift
        Endpoints.swift
      Internal/
        Helpers.swift         // internal access — not exposed to consumers
  Tests/
    MyLibraryTests/
      ModelTests.swift
      APIClientTests.swift
      Fixtures/
        sample-response.json
\`\`\`

### Application Package
\`\`\`
MyApp/
  Package.swift
  Sources/
    MyApp/
      main.swift             // Thin entry point
      App/
        AppDelegate.swift
        Configuration.swift
      Features/
        Auth/
          AuthService.swift
          AuthView.swift
          AuthViewModel.swift
        Dashboard/
          DashboardView.swift
          DashboardViewModel.swift
      Core/
        Networking/
          APIClient.swift
        Storage/
          Database.swift
        Extensions/
          Date+Formatting.swift
  Tests/
    MyAppTests/
      AuthServiceTests.swift
      DashboardViewModelTests.swift
\`\`\`

### Xcode Project
\`\`\`
MyApp.xcodeproj
MyApp/
  App/
    MyAppApp.swift           // @main entry point
    ContentView.swift
  Features/                  // Organized by feature/domain
    Auth/
    Dashboard/
    Settings/
  Core/                      // Shared infrastructure
    Networking/
    Storage/
    Extensions/
  Resources/
    Assets.xcassets
    Localizable.xcstrings
MyAppTests/
MyAppUITests/
\`\`\`

---

## Extension Conventions

- Place extensions in separate files named \`TypeName+Capability.swift\`
- Use extensions to organize conformances: one extension per protocol
- Use \`// MARK: -\` to separate logical sections within a file

\`\`\`swift
// File: User+Codable.swift
extension User: Codable {
    enum CodingKeys: String, CodingKey {
        case id, name, email
        case createdAt = "created_at"
    }
}

// File: User+Displayable.swift
extension User: Displayable {
    var displayTitle: String { name }
    var displaySubtitle: String { email }
}
\`\`\`

---

## Performance Practices

### Copy-on-Write Awareness
- Swift collections (\`Array\`, \`Dictionary\`, \`Set\`, \`String\`) use COW
- Mutation triggers a copy only when the buffer is shared
- Avoid premature optimization around COW — trust the compiler unless profiling proves otherwise

### Avoid Retain Cycles
- Use \`[weak self]\` in closures stored as properties or passed to long-lived objects
- Use \`[unowned self]\` only when you can guarantee self outlives the closure

\`\`\`swift
// Correct: weak self prevents retain cycle
class ViewModel {
    var onUpdate: (() -> Void)?

    func startObserving() {
        service.observe { [weak self] newData in
            guard let self else { return }
            self.process(newData)
        }
    }
}
\`\`\`

### Lazy Initialization
\`\`\`swift
// Expensive resources initialized only when first accessed
class DataManager {
    lazy var decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }()

    lazy var database: Database = {
        Database(path: databasePath)
    }()
}
\`\`\`

### Measurement
- Use Xcode Instruments (Time Profiler, Allocations, Leaks) for performance analysis
- Use \`XCTMetric\` in performance tests for automated regression detection
- Profile on real devices — Simulator performance differs significantly from hardware
- Avoid premature optimization — measure first, then optimize hot paths
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.swift$" && grep -nE "\\![[:space:]]*$|as!|try!|\\bfirst!|\\blast!" "$CLAUDE_FILE_PATH" | head -5 | grep -q "." && echo "HOOK_EXIT:0:Warning: force unwrap (!) detected — verify this is intentional and safe" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.swift$" && grep -nP "@unchecked Sendable" "$CLAUDE_FILE_PATH" | while IFS=: read -r line _; do prev=$((line - 1)); sed -n "${prev}p" "$CLAUDE_FILE_PATH" | grep -qiE "SAFETY:|safety:" || echo "HOOK_EXIT:0:Warning: @unchecked Sendable at line $line missing // SAFETY: comment"; done || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.swift$" && command -v swiftlint >/dev/null 2>&1 && swiftlint lint --quiet --path "$CLAUDE_FILE_PATH" 2>/dev/null | head -10 | grep -q "." && echo "HOOK_EXIT:0:SwiftLint issues detected — review and fix" || true',
            timeout: 15,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'swiftlint' as any,
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
