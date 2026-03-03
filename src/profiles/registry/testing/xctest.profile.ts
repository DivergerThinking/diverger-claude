import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const xctestProfile: Profile = {
  id: 'testing/xctest',
  name: 'XCTest',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['xctest'],
  dependsOn: ['languages/swift'],
  contributions: {
    claudeMd: [
      {
        heading: 'XCTest Conventions',
        order: 30,
        content: `## XCTest Conventions

Apple's native test framework. Unit tests, UI tests, performance tests.

**Detailed rules:** see \`.claude/rules/xctest/\` directory.

**Key rules:**
- \`XCTAssert*\` family for assertions, \`XCTExpectFailure\` for known issues
- UI tests: accessibility identifiers for element queries, not coordinates
- \`setUp()\`/\`tearDown()\` for test lifecycle, \`addTeardownBlock\` for async cleanup
- \`measure {}\` blocks for performance regression testing`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(xcodebuild test:*)',
          'Bash(xcodebuild build-for-testing:*)',
          'Bash(xcodebuild test-without-building:*)',
          'Bash(xcrun simctl:*)',
          'Bash(swift test:*)',
          'Bash(xcresulttool:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/xctest-conventions.md',
        paths: ['**/*Tests.swift', '**/*Test.swift', '**/Tests/**/*.swift'],
        governance: 'mandatory',
        description:
          'XCTest and Swift Testing conventions — assertions, async testing, UI testing, accessibility identifiers, and test lifecycle',
        content: `# XCTest & Swift Testing Conventions

## Framework Selection
- Use **Swift Testing** (\`@Test\`, \`#expect\`) for all new unit and integration tests (Xcode 16+)
- Use **XCTest** (\`XCTestCase\`, \`XCTAssert*\`) for UI tests (XCUITest) and performance measurement tests
- Both frameworks coexist in the same test target — migrate incrementally, not all at once

---

## Swift Testing Rules

### Test Functions
- Mark test functions with \`@Test\` — no \`test\` prefix required
- Use \`@Test("Descriptive name")\` for human-readable display names in the test navigator
- Use \`#expect(expression)\` for all assertions — it captures both sides of the expression on failure
- Use \`#require(expression)\` for preconditions that must be true for the test to continue
- Use \`try #require(optionalValue)\` to safely unwrap optionals — fails the test if nil

### Correct
\`\`\`swift
@Test("Adding item to empty cart sets count to 1")
func addItemToEmptyCart() {
    let cart = Cart()
    cart.add(Item(name: "Widget", price: 9.99))
    #expect(cart.itemCount == 1)
    #expect(cart.total == 9.99)
}

@Test("Parsing invalid JSON throws DecodingError")
func parseInvalidJSON() throws {
    let data = Data("not json".utf8)
    #expect(throws: DecodingError.self) {
        try JSONDecoder().decode(User.self, from: data)
    }
}
\`\`\`

### Anti-Pattern
\`\`\`swift
// BAD: Using XCTAssert in new tests when Swift Testing is available
func testAddItemToEmptyCart() {
    let cart = Cart()
    cart.add(Item(name: "Widget", price: 9.99))
    XCTAssertEqual(cart.itemCount, 1)  // Use #expect instead
}
\`\`\`

### Parameterized Tests
- Use \`@Test(arguments:)\` to run the same test logic with different inputs
- Each argument becomes an independent, parallel test case
- Use with collections of enum cases, arrays, or zip'd argument pairs

\`\`\`swift
@Test("Validating email formats", arguments: [
    ("user@example.com", true),
    ("invalid-email", false),
    ("user@.com", false),
    ("user@domain.co.uk", true),
])
func validateEmail(email: String, isValid: Bool) {
    #expect(EmailValidator.isValid(email) == isValid)
}
\`\`\`

### Tags and Organization
- Define custom tags: \`extension Tag { @Tag static var networking: Self }\`
- Apply tags: \`@Test(.tags(.networking))\` for filtering test runs
- Use \`@Suite("Suite Name")\` on types to group related tests
- Use \`@Suite(.serialized)\` only when tests have genuine order dependencies

---

## XCTest Rules

### Test Lifecycle
- Use \`setUpWithError()\` / \`tearDownWithError()\` (throwing variants) over \`setUp()\` / \`tearDown()\`
- Use \`override class func setUp()\` for expensive one-time setup shared across all tests in a class
- Never leave state between tests — every test must start from a known clean state
- Use \`addTeardownBlock { }\` for cleanup that must happen even if the test throws

### Assertions
- ALWAYS include a descriptive message: \`XCTAssertEqual(result, 42, "Expected answer to life, universe, and everything")\`
- Use \`XCTUnwrap(optional)\` to unwrap optionals — never force-unwrap (\`!\`) in tests
- Use \`XCTAssertThrowsError(try expr) { error in ... }\` to verify both that code throws AND the specific error type
- Use specific assertions over generic boolean: \`XCTAssertEqual\` over \`XCTAssertTrue(a == b)\` — better failure messages

### Correct
\`\`\`swift
func testFetchUser_WhenNotFound_ThrowsNotFoundError() async throws {
    let service = UserService(repository: MockRepository(users: []))
    do {
        _ = try await service.fetchUser(id: "nonexistent")
        XCTFail("Expected NotFoundError to be thrown")
    } catch {
        XCTAssertTrue(error is NotFoundError, "Expected NotFoundError, got \\(type(of: error))")
    }
}
\`\`\`

### Anti-Pattern
\`\`\`swift
// BAD: Force-unwrapping in tests — crashes instead of failing gracefully
func testFetchUser() {
    let user = service.fetchUser(id: "1")!  // Use XCTUnwrap instead
    XCTAssert(user.name == "Alice")         // Use XCTAssertEqual for better failure message
}
\`\`\`

---

## Async Testing Rules
- For \`async/await\` code: mark test methods \`async throws\` and use \`await\` directly — no expectations needed
- For callback/delegate patterns: use \`XCTestExpectation\` with \`fulfillment(of:timeout:)\`
- Every expectation MUST have a timeout — default is 1s, set explicitly for clarity
- NEVER use \`sleep()\` or \`Thread.sleep()\` — always use expectations or async test methods
- Use \`XCTNSPredicateExpectation\` for polling conditions on KVO-observable properties

### Correct
\`\`\`swift
// Modern async test — clean, no expectations needed
func testFetchProfile_ReturnsValidData() async throws {
    let profile = try await profileService.fetchProfile(userId: "123")
    XCTAssertEqual(profile.name, "Alice")
    XCTAssertFalse(profile.email.isEmpty)
}

// Legacy callback pattern — use expectations
func testDownload_CompletionCalled() {
    let expectation = expectation(description: "Download completes")
    downloader.download(url: testURL) { result in
        XCTAssertNotNil(result)
        expectation.fulfill()
    }
    wait(for: [expectation], timeout: 10.0)
}
\`\`\`

### Anti-Pattern
\`\`\`swift
// BAD: Using sleep instead of proper synchronization
func testAsyncOperation() {
    service.startOperation()
    Thread.sleep(forTimeInterval: 3.0)  // Flaky and slow
    XCTAssertTrue(service.isComplete)
}
\`\`\`

---

## XCUITest Rules

### Element Selection (Priority Order)
1. \`app.buttons["accessibilityIdentifier"]\` — element type + accessibility identifier (preferred)
2. \`app.descendants(matching: .any)["identifier"]\` — any type by identifier (resilient to type changes)
3. \`app.staticTexts["Visible Text"]\` — text content (for verification, not interaction)
4. \`app.buttons.matching(identifier: "id").firstMatch\` — first match when multiple exist
- NEVER use element indices (\`app.buttons.element(boundBy: 2)\`) — brittle and order-dependent
- Set \`.accessibilityIdentifier\` on all interactive elements in production code

### Identifier Naming Convention
- Use \`screenName.elementDescription\`: \`"login.emailField"\`, \`"login.submitButton"\`, \`"profile.avatarImage"\`
- Keep identifiers stable across releases — they are the test contract with the UI
- Define identifiers as constants in a shared enum: \`enum AccessibilityID { static let loginEmail = "login.emailField" }\`

### Waiting for Elements
- Use \`element.waitForExistence(timeout: 5)\` for elements that appear asynchronously
- Assert on the return value: \`XCTAssertTrue(element.waitForExistence(timeout: 5), "Expected element to appear")\`
- Use \`XCTNSPredicateExpectation\` for complex conditions: property changes, count changes, value matches
- NEVER use \`sleep()\` or \`Thread.sleep()\` — always use \`waitForExistence\` or predicate-based waits

### System Alerts
- Use \`addUIInterruptionMonitor(withDescription:handler:)\` to handle permission dialogs and system alerts
- Register monitors in \`setUp()\` before the test triggers the alert
- Call \`app.tap()\` after the alert is expected to trigger the interruption monitor

### Accessibility Auditing
- Use \`try app.performAccessibilityAudit()\` (Xcode 15+) in UI tests to catch accessibility regressions
- Pass audit types to scope: \`.performAccessibilityAudit(for: [.dynamicType, .contrast])\`
- Run accessibility audits in a dedicated test plan to avoid slowing down functional UI tests

---

## Test Plans
- Create separate \`.xctestplan\` files for: unit tests, integration tests, UI tests, performance tests
- Configure environment variables and launch arguments per plan for different test scenarios
- Enable code coverage only in unit/integration plans — disable in performance plans
- Use test repetition modes in plans: "Run Until Failure" for flaky test detection, "Retry on Failure" for CI resilience
- Share test plans across schemes via Xcode scheme editor > Test action > Test Plans
`,
      },
      {
        path: 'testing/xctest-configuration.md',
        paths: ['**/*Tests.swift', '**/*Test.swift', '**/Tests/**/*.swift'],
        governance: 'recommended',
        description:
          'XCTest configuration best practices for test plans, CI integration with xcodebuild, and test target organization',
        content: `# XCTest Configuration Best Practices

## Test Target Organization
\`\`\`
MyApp/
  MyAppTests/                 # Unit + integration tests (XCTest + Swift Testing)
    Models/
      UserTests.swift
      CartTests.swift
    Services/
      AuthServiceTests.swift
      PaymentServiceTests.swift
    Mocks/
      MockUserRepository.swift
      MockNetworkClient.swift
    Helpers/
      TestFixtures.swift
  MyAppUITests/               # XCUITest UI tests only
    Screens/
      LoginScreenTests.swift
      DashboardScreenTests.swift
    PageObjects/
      LoginPage.swift
      DashboardPage.swift
    Helpers/
      AccessibilityIDs.swift
      UITestHelpers.swift
\`\`\`

## Test Plan Configuration

### UnitTests.xctestplan
- Targets: \`MyAppTests\` (unit tests only)
- Code coverage: enabled, scoped to \`MyApp\` target
- Parallelization: enabled
- Environment variables: \`IS_TESTING=1\`

### UITests.xctestplan
- Targets: \`MyAppUITests\`
- Code coverage: disabled (UI tests are slow, coverage adds overhead)
- Parallelization: enabled (tests on separate simulators)
- Language/region: configure multiple for localization testing
- Test repetition: retry on failure (1 retry) for CI resilience

### PerformanceTests.xctestplan
- Targets: \`MyAppTests\` (performance test methods only, filtered by tag or class)
- Code coverage: disabled
- Build configuration: Release (for meaningful measurements)
- Parallelization: disabled (performance tests need exclusive CPU)

## CI Integration with xcodebuild

### Running Tests
\`\`\`bash
# Run unit tests
xcodebuild test \\
  -workspace MyApp.xcworkspace \\
  -scheme MyApp \\
  -testPlan UnitTests \\
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \\
  -resultBundlePath ./build/UnitTests.xcresult

# Run UI tests with parallel execution
xcodebuild test \\
  -workspace MyApp.xcworkspace \\
  -scheme MyApp \\
  -testPlan UITests \\
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \\
  -parallel-testing-enabled YES \\
  -parallel-testing-worker-count 4 \\
  -resultBundlePath ./build/UITests.xcresult

# Build for testing (separate build and test steps in CI)
xcodebuild build-for-testing \\
  -workspace MyApp.xcworkspace \\
  -scheme MyApp \\
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \\
  -derivedDataPath ./build/DerivedData

# Test without building (uses previous build)
xcodebuild test-without-building \\
  -workspace MyApp.xcworkspace \\
  -scheme MyApp \\
  -testPlan UnitTests \\
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \\
  -derivedDataPath ./build/DerivedData \\
  -resultBundlePath ./build/UnitTests.xcresult
\`\`\`

### Extracting Results
\`\`\`bash
# Extract test summary from xcresult bundle
xcrun xcresulttool get --path ./build/UnitTests.xcresult --format json

# Export code coverage report
xcrun xccov view --report --json ./build/UnitTests.xcresult > coverage.json
\`\`\`

## Page Object Pattern for XCUITest
\`\`\`swift
protocol Screen {
    var app: XCUIApplication { get }
}

struct LoginScreen: Screen {
    let app: XCUIApplication

    var emailField: XCUIElement { app.textFields["login.emailField"] }
    var passwordField: XCUIElement { app.secureTextFields["login.passwordField"] }
    var submitButton: XCUIElement { app.buttons["login.submitButton"] }
    var errorLabel: XCUIElement { app.staticTexts["login.errorLabel"] }

    @discardableResult
    func typeEmail(_ email: String) -> Self {
        emailField.tap()
        emailField.typeText(email)
        return self
    }

    @discardableResult
    func typePassword(_ password: String) -> Self {
        passwordField.tap()
        passwordField.typeText(password)
        return self
    }

    @discardableResult
    func tapSubmit() -> Self {
        submitButton.tap()
        return self
    }

    func login(email: String, password: String) -> DashboardScreen {
        typeEmail(email)
            .typePassword(password)
            .tapSubmit()
        return DashboardScreen(app: app)
    }
}
\`\`\`

## Timeout Guidelines
| Test Type | Recommended Timeout |
|-----------|-------------------|
| Unit test assertion | No timeout needed |
| Async expectation (local) | 5 seconds |
| Async expectation (network/CI) | 15-30 seconds |
| UI element waitForExistence | 5-10 seconds |
| UI test total | < 30 seconds |
| Performance measurement | Framework-managed |

## Accessibility ID Constants
\`\`\`swift
// Shared between app and UI test targets
enum AccessibilityID {
    enum Login {
        static let emailField = "login.emailField"
        static let passwordField = "login.passwordField"
        static let submitButton = "login.submitButton"
        static let errorLabel = "login.errorLabel"
    }
    enum Dashboard {
        static let welcomeLabel = "dashboard.welcomeLabel"
        static let profileButton = "dashboard.profileButton"
    }
}
\`\`\`

Define these in a shared framework or source file included in both the app target and UI test target.
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## XCTest & Swift Testing Review Checklist
Available skills: xctest-suite-generator
- Verify new unit tests use Swift Testing (\`@Test\`, \`#expect\`) when the project targets Xcode 16+ — flag new \`XCTestCase\` subclasses for non-UI tests
- Check that \`#expect\` is used instead of \`XCTAssert*\` in Swift Testing test functions — mixing frameworks in the same function is not allowed
- Verify parameterized tests use \`@Test(arguments:)\` instead of loops or duplicated test functions
- Check that all XCTest assertions include descriptive message parameters — bare \`XCTAssertEqual(a, b)\` without context is insufficient
- Verify no force-unwrapping (\`!\`) in test code — use \`XCTUnwrap\` (XCTest) or \`try #require\` (Swift Testing)
- Check that async tests use \`async throws\` test methods — flag legacy \`XCTestExpectation\` usage for async/await code
- Verify no \`sleep()\` or \`Thread.sleep()\` calls in any test — use \`waitForExistence\`, expectations, or async/await
- Check XCUITest element selection uses accessibility identifiers, not text content or element indices
- Verify accessibility identifiers follow \`screenName.elementDescription\` naming convention
- Check that \`waitForExistence(timeout:)\` return value is asserted — calling it without checking the result is a silent failure
- Verify \`XCTestExpectation\` calls always include explicit timeout values
- Check that UI tests use \`addUIInterruptionMonitor\` for system alerts instead of hardcoded tap sequences
- Verify test plans exist for separate test categories (unit, UI, performance)
- Check that performance tests run in Release configuration — Debug builds give meaningless measurements
- Verify mocks and test doubles do not contain real credentials, API keys, or PII`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## XCTest & Swift Testing — Test Writing Guidelines
Available skills: xctest-suite-generator
- For new unit tests: use Swift Testing with \`@Test\`, \`#expect\`, \`#require\` — cleaner syntax, better failure messages
- For UI tests: use XCTest with \`XCUIApplication\`, accessibility identifiers, and Page Object pattern
- Use \`@Test("Descriptive name")\` for human-readable names in the test navigator
- Use \`@Test(arguments: collection)\` for parameterized tests — each argument runs as an independent parallel test case
- Use \`#expect(throws: ErrorType.self) { ... }\` to verify error-throwing code in Swift Testing
- Use \`confirmation("callback invoked") { confirm in ... confirm() }\` to verify callbacks are invoked
- Use \`try #require(optionalValue)\` to safely unwrap optionals — fails the test if nil
- For XCTest: use \`setUpWithError()\` / \`tearDownWithError()\` over non-throwing variants
- For XCTest: always include descriptive messages in assertions: \`XCTAssertEqual(a, b, "Reason")\`
- For XCUITest: set \`.accessibilityIdentifier\` on interactive elements and use Page Object pattern
- For XCUITest: use \`element.waitForExistence(timeout: 5)\` for async elements — assert on the return value
- For XCUITest: use \`addUIInterruptionMonitor(withDescription:handler:)\` for system alert handling
- For XCUITest: use \`app.performAccessibilityAudit()\` to catch accessibility regressions
- For async code: use \`async throws\` test methods with \`await\` — avoid \`XCTestExpectation\` for async/await code
- For performance: use \`measure(metrics:) { ... }\` with \`XCTClockMetric\`, \`XCTMemoryMetric\`, \`XCTCPUMetric\`
- Organize tests by feature/module, not by test type — colocate related tests together`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## XCTest Security Review
- Verify test fixtures and mock data do not contain real credentials, API keys, tokens, or PII — use dummy/generated values
- Check that \`app.launchEnvironment\` in UI tests does not pass real production secrets to the test app
- Verify \`.xctestplan\` environment variables do not contain secrets — use CI secret injection instead
- Check that \`.xcresult\` bundles and test artifacts are not committed to version control — they may contain screenshots with sensitive data
- Verify UI test screenshots (captured on failure) do not expose sensitive information visible on screen
- Check that test network stubs/mocks do not use real API endpoints — all external calls must be mocked
- Verify shared accessibility ID constants do not inadvertently expose internal architecture to the UI test target
- Check that \`storageState\` or keychain setup in tests uses test-only credentials, not real user accounts
- Verify performance test baselines do not leak internal metrics to public CI logs`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## XCTest & Swift Testing Refactoring Guidance
Available skills: xctest-suite-generator
- Migrate XCTest unit tests to Swift Testing: replace \`XCTestCase\` subclass with \`@Suite\` struct, \`func testX()\` with \`@Test func x()\`, \`XCTAssertEqual\` with \`#expect\`
- Replace duplicated test methods with parameterized \`@Test(arguments:)\` tests — reduces code and runs each case in parallel
- Replace \`XCTUnwrap\` with \`try #require(optionalValue)\` when migrating to Swift Testing
- Extract repeated \`setUp\` / \`tearDown\` patterns into shared test helper functions or protocols
- Extract XCUITest element queries into Page Object structs with typed properties and action methods
- Replace hardcoded accessibility identifier strings with shared \`AccessibilityID\` enum constants
- Consolidate duplicated UI test login flows into a shared login helper method on the Page Object
- Replace \`XCTestExpectation\` + \`wait(for:timeout:)\` with \`async throws\` test methods where the SUT supports async/await
- Move test fixtures (mock data, JSON files) into a shared \`TestHelpers\` directory used by both test targets
- Extract common assertion sequences into custom assertion helper functions for readability
- Separate performance tests into their own test class and test plan for independent execution`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## XCTest to Swift Testing Migration Guidance
- Both frameworks coexist in the same target — migrate incrementally, one test class at a time
- Replace \`class MyTests: XCTestCase\` with \`@Suite struct MyTests\` — structs are preferred for value semantics
- Replace \`func testX()\` with \`@Test func x()\` — the \`test\` prefix is no longer needed
- Replace \`XCTAssertEqual(a, b)\` with \`#expect(a == b)\` — captures both sides on failure
- Replace \`XCTAssertTrue(expr)\` / \`XCTAssertFalse(expr)\` with \`#expect(expr)\` / \`#expect(!expr)\`
- Replace \`XCTAssertNil(x)\` with \`#expect(x == nil)\`
- Replace \`XCTAssertNotNil(x)\` with \`#expect(x != nil)\` or \`try #require(x)\` for unwrapping
- Replace \`XCTUnwrap(x)\` with \`try #require(x)\`
- Replace \`XCTAssertThrowsError(try expr)\` with \`#expect(throws: ErrorType.self) { try expr }\`
- Replace \`XCTFail("message")\` with \`Issue.record("message")\`
- Replace \`setUp()\` / \`tearDown()\` with \`init()\` / \`deinit\` on the suite struct (or use \`addTeardownBlock\`)
- Replace \`override class func setUp()\` — no direct equivalent; use a shared computed property or lazy initialization
- NOTE: Do NOT migrate UI tests (XCUITest) or performance tests — Swift Testing does not support these yet
- NOTE: \`XCTestExpectation\` has no Swift Testing equivalent — use \`confirmation()\` for callback verification instead
- NOTE: \`continueAfterFailure\` has no equivalent — Swift Testing always continues after \`#expect\` failures (use \`#require\` to halt)`,
      },
    ],
    skills: [
      {
        name: 'xctest-suite-generator',
        description:
          'Generate comprehensive XCTest and Swift Testing test suites with proper structure, async testing, parameterized tests, and Page Objects for UI tests',
        content: `# XCTest & Swift Testing Suite Generator

## Purpose
Generate well-structured test suites using Swift Testing for unit/integration tests and XCTest for UI tests, following Apple platform best practices.

## Process

### 1. Analyze the Code Under Test
- Identify public API surface: functions, methods, initializers, properties
- Map input/output relationships and error conditions
- Identify async operations: async/await, callbacks, delegates, Combine publishers
- For UI: identify screens, navigation flows, interactive elements

### 2. Generate Swift Testing Unit Tests
\`\`\`swift
import Testing
@testable import MyApp

@Suite("CartService")
struct CartServiceTests {
    let sut: CartService
    let mockRepository: MockCartRepository

    init() {
        mockRepository = MockCartRepository()
        sut = CartService(repository: mockRepository)
    }

    @Test("Adding item increases cart count")
    func addItem() async throws {
        let item = Item(id: "1", name: "Widget", price: 9.99)
        try await sut.addItem(item)
        #expect(sut.itemCount == 1)
        #expect(sut.total == 9.99)
    }

    @Test("Adding duplicate item increases quantity")
    func addDuplicateItem() async throws {
        let item = Item(id: "1", name: "Widget", price: 9.99)
        try await sut.addItem(item)
        try await sut.addItem(item)
        #expect(sut.itemCount == 1)
        #expect(sut.quantity(for: "1") == 2)
    }

    @Test("Removing last item empties cart")
    func removeLastItem() async throws {
        let item = Item(id: "1", name: "Widget", price: 9.99)
        try await sut.addItem(item)
        try await sut.removeItem(id: "1")
        #expect(sut.itemCount == 0)
        #expect(sut.total == 0)
    }

    @Test("Removing nonexistent item throws NotFoundError")
    func removeNonexistentItem() {
        #expect(throws: CartError.itemNotFound) {
            try await sut.removeItem(id: "nonexistent")
        }
    }

    @Test("Discount calculation for various tiers", arguments: [
        (tier: "bronze", discount: 0.05),
        (tier: "silver", discount: 0.10),
        (tier: "gold", discount: 0.15),
        (tier: "platinum", discount: 0.20),
    ])
    func discountByTier(tier: String, discount: Double) {
        let result = sut.calculateDiscount(tier: tier, subtotal: 100.0)
        #expect(result == 100.0 * discount)
    }
}
\`\`\`

### 3. Generate XCUITest UI Tests with Page Objects
\`\`\`swift
// Page Object
struct LoginScreen {
    let app: XCUIApplication

    var emailField: XCUIElement { app.textFields["login.emailField"] }
    var passwordField: XCUIElement { app.secureTextFields["login.passwordField"] }
    var submitButton: XCUIElement { app.buttons["login.submitButton"] }
    var errorLabel: XCUIElement { app.staticTexts["login.errorLabel"] }

    func login(email: String, password: String) -> DashboardScreen {
        emailField.tap()
        emailField.typeText(email)
        passwordField.tap()
        passwordField.typeText(password)
        submitButton.tap()
        return DashboardScreen(app: app)
    }
}

// Test
final class LoginUITests: XCTestCase {
    var app: XCUIApplication!
    var loginScreen: LoginScreen!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
        loginScreen = LoginScreen(app: app)
    }

    func testSuccessfulLogin_NavigatesToDashboard() {
        let dashboard = loginScreen.login(email: "user@example.com", password: "password123")
        XCTAssertTrue(
            dashboard.welcomeLabel.waitForExistence(timeout: 5),
            "Dashboard should appear after successful login"
        )
    }

    func testInvalidCredentials_ShowsError() {
        _ = loginScreen.login(email: "user@example.com", password: "wrong")
        XCTAssertTrue(
            loginScreen.errorLabel.waitForExistence(timeout: 5),
            "Error label should appear for invalid credentials"
        )
        XCTAssertEqual(loginScreen.errorLabel.label, "Invalid email or password")
    }

    func testAccessibilityAudit() throws {
        try app.performAccessibilityAudit()
    }
}
\`\`\`

### 4. Generate Async Tests
\`\`\`swift
@Suite("NetworkClient")
struct NetworkClientTests {
    @Test("Successful fetch returns decoded data")
    func successfulFetch() async throws {
        let client = NetworkClient(session: MockURLSession(
            data: validUserJSON,
            response: HTTPURLResponse(statusCode: 200)
        ))
        let user = try await client.fetch(User.self, from: "/users/1")
        #expect(user.name == "Alice")
    }

    @Test("Server error throws NetworkError.serverError")
    func serverError() async {
        let client = NetworkClient(session: MockURLSession(
            data: Data(),
            response: HTTPURLResponse(statusCode: 500)
        ))
        await #expect(throws: NetworkError.serverError(500)) {
            try await client.fetch(User.self, from: "/users/1")
        }
    }
}
\`\`\`

## Quality Checklist
- [ ] New unit tests use Swift Testing (\`@Test\`, \`#expect\`) — not XCTest
- [ ] UI tests use XCTest with Page Object pattern and accessibility identifiers
- [ ] Parameterized tests use \`@Test(arguments:)\` — no duplicated test functions
- [ ] Async tests use \`async throws\` — no \`XCTestExpectation\` for async/await code
- [ ] No \`sleep()\` or \`Thread.sleep()\` anywhere in the test suite
- [ ] No force-unwrapping — use \`try #require\` or \`XCTUnwrap\`
- [ ] All XCTest assertions include descriptive messages
- [ ] Accessibility identifiers follow \`screenName.elementDescription\` convention
- [ ] Tests are independent — no shared mutable state, no execution order dependency
- [ ] Mocks use dummy data — no real credentials or PII
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "Tests?\\.swift$" && grep -cE "\\b(Thread\\.sleep|sleep\\()" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:1:Anti-pattern: sleep()/Thread.sleep() detected in test file — use waitForExistence(), XCTestExpectation, or async/await instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "Tests?\\.swift$" && grep -nE "\\![[:space:]]*$|\\!\\)" "$CLAUDE_FILE_PATH" | grep -vE "(XCTAssert|#expect|#require|!=|//" | head -1 | grep -q "." && echo "HOOK_EXIT:0:Warning: possible force-unwrap detected in test file — prefer XCTUnwrap (XCTest) or try #require (Swift Testing) for safe unwrapping" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "UITests?\\.swift$" && grep -cE "\\.element\\(boundBy:" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:0:Warning: index-based element selection detected in UI test — use accessibility identifiers instead of element(boundBy:)" || true',
            timeout: 10,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'xcode-build-settings',
        filePath: 'xctest.xctestplan',
        config: {
          configurations: [
            {
              name: 'Unit Tests',
              options: {
                codeCoverageEnabled: true,
                testExecutionOrdering: 'random',
                testRepetitionMode: 'retryOnFailure',
                maximumTestRepetitions: 2,
              },
            },
          ],
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
