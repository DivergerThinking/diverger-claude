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
- Use **Swift Testing** (\`@Test\`, \`#expect\`) for new unit/integration tests (Xcode 16+)
- Use **XCTest** for UI tests (XCUITest) and performance measurement tests
- Both coexist in the same target — migrate incrementally

## Swift Testing Rules
- Use \`@Test("Descriptive name")\` — no \`test\` prefix needed
- Use \`#expect(expression)\` for assertions, \`#require()\` for preconditions
- Use \`try #require(optionalValue)\` to safely unwrap optionals
- Use \`@Test(arguments:)\` for parameterized tests — each argument runs in parallel
- Use \`@Suite("Name")\` to group tests, \`.tags()\` for filtering
- Use \`#expect(throws: ErrorType.self) { ... }\` for error testing

## XCTest Rules
- Use \`setUpWithError()\`/\`tearDownWithError()\` (throwing variants)
- Use \`addTeardownBlock { }\` for cleanup that runs even if test throws
- ALWAYS include descriptive messages in assertions
- Use \`XCTUnwrap()\` — never force-unwrap (\`!\`) in tests
- Use specific assertions: \`XCTAssertEqual\` over \`XCTAssertTrue(a == b)\`

## Async Testing
- For async/await: mark methods \`async throws\`, use \`await\` directly
- For callbacks: use \`XCTestExpectation\` with explicit timeout
- NEVER use \`sleep()\` or \`Thread.sleep()\` — use expectations or async methods
- Use \`XCTNSPredicateExpectation\` for polling KVO-observable properties

## XCUITest Rules
- Select by accessibility identifier: \`app.buttons["login.submitButton"]\`
- NEVER use element indices (\`element(boundBy:)\`) — brittle and order-dependent
- Name identifiers: \`screenName.elementDescription\` — define as shared constants
- Use \`waitForExistence(timeout:)\` and assert on return value
- Use \`addUIInterruptionMonitor()\` for system alerts
- Use \`performAccessibilityAudit()\` (Xcode 15+) for a11y regression testing

## Test Plans
- Create separate \`.xctestplan\` files for unit, UI, and performance tests
- Enable code coverage only in unit/integration plans
- Use test repetition modes: "Retry on Failure" for CI resilience
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
- \`MyAppTests/\` — unit + integration tests (XCTest + Swift Testing), organized by module
- \`MyAppTests/Mocks/\` — shared mock implementations
- \`MyAppUITests/\` — XCUITest UI tests only
- \`MyAppUITests/PageObjects/\` — Page Object structs per screen
- \`MyAppUITests/Helpers/\` — AccessibilityIDs, test helpers

## Test Plan Configuration
- **UnitTests.xctestplan**: code coverage enabled, parallelization on, \`IS_TESTING=1\`
- **UITests.xctestplan**: coverage disabled, parallel on separate simulators, retry on failure
- **PerformanceTests.xctestplan**: coverage disabled, Release build config, no parallelization

## CI Integration with xcodebuild
- Use \`xcodebuild test -testPlan <plan> -destination <sim> -resultBundlePath <path>\`
- Use \`-parallel-testing-enabled YES\` for UI tests with \`-parallel-testing-worker-count\`
- Separate build and test: \`build-for-testing\` then \`test-without-building\`
- Extract results: \`xcrun xcresulttool get --path <xcresult> --format json\`
- Export coverage: \`xcrun xccov view --report --json <xcresult>\`

## Page Object Pattern for XCUITest
- Create structs per screen with typed element properties using accessibility identifiers
- Return \`Self\` from action methods for fluent chaining
- Navigation methods return the destination screen type

## Timeout Guidelines
- Unit assertions: no timeout needed
- Async expectations: 5s local, 15-30s network/CI
- UI \`waitForExistence\`: 5-10s
- Total UI test: < 30s

## Accessibility ID Constants
- Define as \`enum AccessibilityID { enum Login { static let emailField = "login.emailField" } }\`
- Share between app and UI test targets via shared framework or source file
- Use \`screenName.elementDescription\` naming convention
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "Tests?\\.swift$" && grep -cE "\\b(Thread\\.sleep|sleep\\()" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Anti-pattern: sleep()/Thread.sleep() detected in test file — use waitForExistence(), XCTestExpectation, or async/await instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for sleep() in XCTest files',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "Tests?\\.swift$" && grep -nE "\\![[:space:]]*$|\\!\\)" "$FILE_PATH" | grep -vE "(XCTAssert|#expect|#require|!=|//" | head -1 | grep -q "." && { echo "Warning: possible force-unwrap detected in test file — prefer XCTUnwrap (XCTest) or try #require (Swift Testing) for safe unwrapping" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for force-unwrap in XCTest files',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "UITests?\\.swift$" && grep -cE "\\.element\\(boundBy:" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Warning: index-based element selection detected in UI test — use accessibility identifiers instead of element(boundBy:)" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for index-based element selection in UI tests',
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
