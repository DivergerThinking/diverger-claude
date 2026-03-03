import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const swiftuiProfile: Profile = {
  id: 'frameworks/swiftui',
  name: 'SwiftUI',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['swiftui'],
  dependsOn: ['languages/swift'],
  contributions: {
    claudeMd: [
      {
        heading: 'SwiftUI Conventions',
        order: 2000,
        content: `## SwiftUI Conventions

Declarative UI framework. View composition, data flow with property wrappers.

**Detailed rules:** see \`.claude/rules/swiftui/\` directory.

**Key rules:**
- Small views (<40 lines body), extract subviews as separate structs
- \`@State\` for local, \`@Binding\` for parent-owned, \`@ObservedObject\`/\`@StateObject\` for models
- Prefer \`LazyVStack\`/\`LazyHStack\` over \`VStack\`/\`HStack\` for large lists
- Preview providers for every view — test visual states`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(xcodebuild:*)',
          'Bash(swift build:*)',
          'Bash(swift test:*)',
          'Bash(swift package:*)',
          'Bash(xcrun:*)',
          'Bash(swiftlint:*)',
          'Bash(swiftformat:*)',
          'Bash(xcode-select:*)',
        ],
      },
    },
    rules: [
      {
        path: 'swiftui/view-composition-and-data-flow.md',
        paths: ['**/*.swift'],
        governance: 'mandatory',
        description: 'SwiftUI view composition, property wrappers, navigation, and data flow patterns',
        content: `# SwiftUI View Composition & Data Flow

## View Structure Rules
- Keep view body under 40 lines — extract sub-views as separate structs (not helper methods that return \`some View\`)
- One view per file — name the file after the view struct
- Use \`Group\`, \`Section\`, and container views for layout — avoid deeply nested modifier chains
- Pass required data via initializers — use environment only for app-wide or system values
- Use \`@ViewBuilder\` for custom container views that compose child views

### Correct — extracted sub-view

\`\`\`swift
struct UserProfileView: View {
    let user: User

    var body: some View {
        ScrollView {
            ProfileHeader(user: user)
            ProfileStats(stats: user.stats)
            ProfileActions(userId: user.id)
        }
    }
}

struct ProfileHeader: View {
    let user: User

    var body: some View {
        VStack(spacing: 12) {
            AsyncImage(url: user.avatarURL) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                ProgressView()
            }
            .frame(width: 80, height: 80)
            .clipShape(Circle())

            Text(user.displayName)
                .font(.title2.bold())
        }
    }
}
\`\`\`

### Anti-Pattern — monolithic view body

\`\`\`swift
// BAD: 100+ line body, no extraction, hard to test or preview individually
struct UserProfileView: View {
    let user: User
    var body: some View {
        ScrollView {
            VStack {
                // 100+ lines of inline UI code mixing header, stats, actions
                // Problem: impossible to preview sub-sections, violates SRP
            }
        }
    }
}
\`\`\`

## Property Wrapper Selection

| Scenario | Property Wrapper | Notes |
|----------|-----------------|-------|
| Local value state (Bool, String, Int) | \`@State private\` | Always mark \`private\` |
| Pass state to child (two-way) | \`@Binding\` | Child does not own the data |
| Shared reference model (iOS 17+) | \`@Observable\` class + \`@State\` or \`@Environment\` | Replaces ObservableObject |
| Create binding to @Observable prop | \`@Bindable\` | Wraps @Observable for $ syntax |
| System/app-wide value | \`@Environment(\\.key)\` | Color scheme, locale, modelContext |
| Non-sensitive user preference | \`@AppStorage("key")\` | Backed by UserDefaults (plaintext) |
| SwiftData fetch | \`@Query\` | Auto-updates on model changes |
| Focus tracking | \`@FocusState\` | TextField focus management |

### Correct — @Observable with @State ownership

\`\`\`swift
@Observable
class ProfileViewModel {
    var username = ""
    var isLoading = false
    var error: Error?

    func loadProfile() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let profile = try await ProfileService.fetch()
            username = profile.username
        } catch {
            self.error = error
        }
    }
}

struct ProfileView: View {
    @State private var viewModel = ProfileViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else {
                Text(viewModel.username)
            }
        }
        .task {
            await viewModel.loadProfile()
        }
    }
}
\`\`\`

### Anti-Pattern — wrong wrapper for owned state

\`\`\`swift
// BAD: @ObservedObject does not own the lifecycle — object may be recreated on re-render
struct ProfileView: View {
    @ObservedObject var viewModel = ProfileViewModel() // recreated every re-render!
    // Fix: use @StateObject (pre-iOS 17) or @State with @Observable (iOS 17+)
}
\`\`\`

## Navigation

- Always use \`NavigationStack\` with \`.navigationDestination(for:)\` — never deprecated \`NavigationView\`
- Define routes as an enum conforming to \`Hashable\`
- Use \`NavigationPath\` for programmatic navigation and deep linking

### Correct — type-safe navigation

\`\`\`swift
enum AppRoute: Hashable {
    case profile(userId: String)
    case settings
    case productDetail(productId: String)
}

struct ContentView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .profile(let userId):
                        ProfileView(userId: userId)
                    case .settings:
                        SettingsView()
                    case .productDetail(let productId):
                        ProductDetailView(productId: productId)
                    }
                }
        }
    }
}
\`\`\`
`,
      },
      {
        path: 'swiftui/performance-and-rendering.md',
        paths: ['**/*.swift'],
        governance: 'mandatory',
        description: 'SwiftUI body evaluation, rendering performance, lists, images, and animations',
        content: `# SwiftUI Performance & Rendering

## Body Evaluation
- The \`body\` property is called frequently — it must be fast and side-effect-free
- Never perform network calls, file I/O, or heavy computation in \`body\` — use \`.task\` or \`.onAppear\`
- Break large views into smaller sub-views — SwiftUI only re-evaluates the sub-view whose state changed
- Use \`@Observable\` (iOS 17+) for fine-grained updates — only properties actually read in body trigger re-evaluation
- Add \`Equatable\` conformance to view structs to let SwiftUI skip unnecessary evaluations

### Correct — task modifier for async work

\`\`\`swift
struct ProductListView: View {
    @State private var products: [Product] = []
    @State private var isLoading = true

    var body: some View {
        List(products) { product in
            ProductRow(product: product)
        }
        .overlay {
            if isLoading { ProgressView() }
        }
        .task {
            // Called when view appears, cancelled when view disappears
            do {
                products = try await ProductService.fetchAll()
            } catch {
                // handle error
            }
            isLoading = false
        }
    }
}
\`\`\`

### Anti-Pattern — side effects in body

\`\`\`swift
// BAD: body is called on every state change — this triggers infinite re-fetches
var body: some View {
    let _ = Task { products = try await fetchProducts() } // side effect in body!
    List(products) { ProductRow(product: $0) }
}
\`\`\`

## List & Scroll Performance
- Use \`List\` for large data sets — it provides cell recycling similar to UITableView
- Use \`LazyVStack\` / \`LazyHStack\` inside \`ScrollView\` when \`List\` styling is not needed — they load views on demand
- Do NOT use \`VStack\` / \`HStack\` for large collections — they instantiate ALL children immediately
- Provide explicit \`id\` in \`ForEach\` using a stable, unique identifier — never use array indices
- Use \`.task\` on the last visible item to implement pagination / infinite scroll
- Prefer \`List\` over \`LazyVStack\` for very large datasets — \`List\` provides view recycling; \`LazyVStack\` creates and discards

### Correct — LazyVStack with stable IDs

\`\`\`swift
ScrollView {
    LazyVStack(spacing: 8) {
        ForEach(items, id: \\.id) { item in
            ItemRow(item: item)
        }
    }
}
\`\`\`

## Image Performance
- Use \`AsyncImage\` for remote images with placeholder and error states
- Apply \`.resizable()\` and \`.aspectRatio(contentMode:)\` before \`.frame()\` for proper sizing
- Use \`Image(systemName:)\` for SF Symbols — they scale with Dynamic Type automatically
- Cache images appropriately — \`AsyncImage\` does not cache by default; use a caching library for production apps

## Animation Performance
- Use \`withAnimation\` for state-driven animations
- Always use \`.animation(.default, value: someValue)\` — never \`.animation(.default)\` without a value parameter
- Use \`matchedGeometryEffect\` for shared element transitions between views
- Use \`PhaseAnimator\` and \`KeyframeAnimator\` (iOS 17+) for multi-step animations
- Limit animation scope — do not animate expensive views or entire large view hierarchies
- Use \`.contentTransition(.numericText())\` for animated number changes
`,
      },
      {
        path: 'swiftui/security-and-data-protection.md',
        paths: ['**/*.swift'],
        governance: 'mandatory',
        description: 'iOS app security: Keychain, ATS, certificate pinning, and secure data handling',
        content: `# SwiftUI Security & Data Protection

## Sensitive Data Storage
- NEVER store tokens, passwords, API keys, or secrets in \`@AppStorage\` / UserDefaults — it is unencrypted plaintext
- Use iOS Keychain Services for credentials and tokens — data is encrypted and tied to device security
- Use \`kSecAttrAccessibleWhenUnlockedThisDeviceOnly\` for maximum protection (not synced to iCloud Keychain)
- Clear Keychain items on user logout
- Use biometric authentication (Face ID / Touch ID) with \`LAContext\` to gate access to sensitive operations

### Correct — Keychain storage

\`\`\`swift
import Security

func storeToken(_ token: String, forAccount account: String) throws {
    let data = Data(token.utf8)
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: account,
        kSecValueData as String: data,
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    ]
    let status = SecItemAdd(query as CFDictionary, nil)
    guard status == errSecSuccess || status == errSecDuplicateItem else {
        throw KeychainError.unhandledError(status: status)
    }
}
\`\`\`

### Anti-Pattern — UserDefaults for secrets

\`\`\`swift
// BAD: UserDefaults is plaintext — readable by anyone with device access
UserDefaults.standard.set(authToken, forKey: "authToken")
// Also BAD: @AppStorage("authToken") — same underlying storage
\`\`\`

## Network Security
- Use HTTPS for ALL network requests — iOS App Transport Security (ATS) enforces this by default
- NEVER disable ATS globally in Info.plist — configure exceptions only for specific legacy domains with justification
- Implement certificate pinning for sensitive APIs (authentication, payments, health data)
- Pin public key hashes rather than full certificates to allow certificate rotation
- Validate all server responses — do not trust data format or values from the network

## App Transport Security
- ATS is enabled by default — all connections must use TLS 1.2+ with forward secrecy
- If you must add exceptions, document the reason in the Info.plist and in code review
- Apple may reject App Store submissions with \`NSAllowsArbitraryLoads = YES\` without justification

## Code & Binary Security
- Never hardcode API keys, secrets, or credentials in Swift source files — use Xcode configuration files or a secrets manager
- Enable Bitcode and App Thinning for optimized, harder-to-reverse-engineer binaries
- Use \`@_spi(Internal)\` or access control (\`internal\`, \`fileprivate\`) to limit API surface
- Implement jailbreak detection for sensitive apps (banking, health) — but do not rely on it as sole defense
- Validate all deep link URLs — malicious apps can craft URLs targeting your scheme

## Data Protection
- Use the correct \`NSFileProtectionComplete\` class for sensitive files on disk
- Implement proper data classification — PII, financial data, health data require different handling
- Encrypt sensitive data at rest using CryptoKit — do not implement custom cryptography
- Use \`URLSession\` with proper TLS configuration — do not disable certificate validation in production
`,
      },
      {
        path: 'swiftui/accessibility-and-hig.md',
        paths: ['**/*.swift'],
        governance: 'recommended',
        description: 'Apple Human Interface Guidelines compliance and accessibility best practices',
        content: `# SwiftUI Accessibility & Human Interface Guidelines

## Accessibility Requirements
- Every interactive element must have an accessibility label — use \`.accessibilityLabel()\` for custom views
- Use \`.accessibilityHint()\` to describe the result of an action ("Opens the user profile")
- Use \`.accessibilityValue()\` for controls with variable state (sliders, steppers, progress)
- Group related elements with \`.accessibilityElement(children: .combine)\` to reduce VoiceOver verbosity
- Hide decorative images with \`.accessibilityHidden(true)\`
- Test with VoiceOver enabled on a real device — simulator VoiceOver is not identical

## Dynamic Type Support
- Never hardcode font sizes — use semantic fonts: \`.font(.body)\`, \`.font(.headline)\`, \`.font(.caption)\`
- Use \`@ScaledMetric\` for custom dimensions that should scale with Dynamic Type
- Test at all Dynamic Type sizes, including the largest accessibility sizes
- Ensure layouts adapt gracefully — use \`ViewThatFits\` (iOS 16+) for adaptive layouts

## Color & Contrast
- Use semantic colors (\`.primary\`, \`.secondary\`, \`.accentColor\`) — they adapt to light/dark mode automatically
- Ensure minimum 4.5:1 contrast ratio for normal text, 3:1 for large text (WCAG AA)
- Never convey information through color alone — use icons, patterns, or text labels as well
- Support both light and dark color schemes — test in both modes

## Platform Conventions (HIG)
- Use standard navigation patterns: tab bars for top-level sections, navigation stacks for drill-down
- Use system-provided controls (Toggle, Picker, DatePicker) — they include built-in accessibility
- Respect safe areas — never place interactive elements under notches, home indicators, or Dynamic Island
- Use \`.sheet()\` for modals, \`.alert()\` for critical decisions, \`.confirmationDialog()\` for action lists
- Provide haptic feedback for meaningful interactions using \`UIImpactFeedbackGenerator\`
- Support multitasking on iPad — test Slide Over, Split View, and Stage Manager
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## SwiftUI-Specific Review

### View Structure & Composition
- Check that view body is under 40 lines — flag monolithic bodies that should be extracted into sub-views
- Verify sub-views are separate structs, not methods returning \`some View\`
- Check for \`AnyView\` usage — flag it as harmful to SwiftUI diffing; recommend \`@ViewBuilder\` or \`Group\`
- Verify views use semantic SwiftUI components (\`Label\`, \`Toggle\`, \`Picker\`) over custom implementations

### Property Wrappers & Data Flow
- Check property wrappers are used correctly: \`@State\` must be \`private\`, \`@Binding\` for child views
- Verify \`@Observable\` is used instead of \`ObservableObject\` for iOS 17+ targets
- Flag \`@ObservedObject\` used to create new instances (should be \`@StateObject\` or \`@State\` + \`@Observable\`)
- Check \`@AppStorage\` is not used for sensitive data (tokens, passwords, secrets)
- Verify \`@Environment\` is used only for system/app-wide values, not for required view data

### Navigation & APIs
- Verify \`NavigationStack\` usage — flag deprecated \`NavigationView\`
- Check \`.animation(.default)\` has a \`value:\` parameter — flag unscoped animations
- Verify \`.task\` modifier is used for async work — flag \`Task { }\` or network calls inside \`body\`
- Check previews exist for all views using \`#Preview\` macro (not deprecated \`PreviewProvider\`)

### Performance
- Check for \`VStack\`/\`HStack\` with large \`ForEach\` — should use \`LazyVStack\`/\`LazyHStack\` or \`List\`
- Verify list items use stable IDs — flag array indices as \`ForEach\` IDs
- Check \`AsyncImage\` has placeholder and error handling

### Security
- Verify Keychain is used for sensitive storage — flag UserDefaults/\`@AppStorage\` for secrets
- Check that ATS is not disabled globally in Info.plist
- Verify deep link URL handlers validate input

### Available Skills
- \`swiftui-view-generator\`: Generate a complete SwiftUI view with architecture, previews, and tests
- \`swiftui-navigation-setup\`: Set up type-safe navigation with NavigationStack, route enum, and deep linking`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## SwiftUI Testing

### Unit Testing with Swift Testing / XCTest
- Test view models and business logic with \`@Test\` (Swift Testing) or \`XCTestCase\`
- Use \`@Observable\` view models that are testable without view instantiation
- Test async methods with \`async/await\` in test functions — use \`confirmation()\` for expectations
- Mock network services using protocol-based dependency injection
- Test SwiftData models with in-memory \`ModelContainer\` — never use persistent stores in tests

### View Testing
- Use ViewInspector for runtime inspection of SwiftUI view hierarchy
- Test that views render correct content for each state (loading, loaded, error, empty)
- Test navigation by verifying \`NavigationPath\` mutations
- Test \`@Binding\` behavior by providing test bindings and asserting state changes
- Use snapshot testing (swift-snapshot-testing) to catch unintended visual regressions

### Preview as Testing
- Create previews for every view — treat them as visual test cases
- Cover multiple configurations per view: light/dark, accessibility sizes, device types
- Use mock data and in-memory stores in previews — previews should never depend on external services
- Use \`#Preview\` macro with descriptive names for each configuration

### Integration Testing
- Test full navigation flows with XCUITest — verify screen transitions and data persistence
- Test deep link handling end-to-end
- Test Keychain operations with real Keychain in integration tests (not mocked)
- Test SwiftData persistence with temporary in-memory containers

### Available Skills
- \`swiftui-view-generator\`: Generate a complete SwiftUI view with architecture, previews, and tests`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## SwiftUI & iOS Security Review

### Data Storage
- Verify NO credentials, tokens, API keys, or secrets are stored in UserDefaults or \`@AppStorage\` (unencrypted)
- Check that Keychain Services is used for all sensitive persistent data
- Verify Keychain access level is \`kSecAttrAccessibleWhenUnlockedThisDeviceOnly\` for maximum security
- Check that biometric authentication gates access to sensitive operations

### Network Security
- Verify App Transport Security is NOT disabled globally (\`NSAllowsArbitraryLoads\` must not be \`YES\`)
- Check that all API calls use HTTPS — flag any HTTP URLs
- Verify certificate pinning is implemented for sensitive APIs (authentication, payments)
- Check that \`URLSession\` delegates do not bypass certificate validation in production

### Code Security
- Verify API keys and secrets are not hardcoded in Swift source files
- Check that sensitive data is not logged via \`print()\` or \`os_log\` in release builds
- Verify deep link URL scheme handlers validate and sanitize input
- Check that \`Info.plist\` does not expose unnecessary URL schemes or permissions
- Verify file protection class is set for sensitive on-disk data (\`NSFileProtectionComplete\`)

### Binary Security
- Check for jailbreak detection in sensitive apps
- Verify that debugging is disabled in release builds
- Check that screenshot prevention is applied for sensitive screens (\`.privacySensitive()\`)`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## SwiftUI Documentation Standards

### Code Documentation
- Document all public view APIs with Swift DocC comments (\`///\` triple slash)
- Include \`- Parameter\` and \`- Returns\` annotations for public methods
- Document custom \`ViewModifier\` types with usage examples in DocC
- Add \`// MARK: -\` sections to organize large view files (Properties, Body, Subviews, Actions)

### Preview Documentation
- Treat previews as living documentation — name them to describe the scenario being demonstrated
- Create a preview catalog showing all states of each view component
- Document environment dependencies required by each view

### Architecture Documentation
- Document the data flow for complex view hierarchies (which view owns which state)
- Document navigation structure with a route enum reference
- Document SwiftData model relationships and migration strategies`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## SwiftUI Refactoring Patterns

### Common Refactoring Targets
- **Large body extraction**: Split monolithic body into sub-view structs with clear data contracts
- **ObservableObject to @Observable**: Remove @Published wrappers, protocol conformance; add @Observable macro
- **NavigationView to NavigationStack**: Replace NavigationView with NavigationStack + value-driven navigation
- **onAppear to .task**: Replace \`.onAppear { Task { ... } }\` with \`.task { ... }\` for automatic cancellation
- **Inline styles to ViewModifier**: Extract repeated modifier chains into reusable ViewModifier structs
- **AnyView elimination**: Replace AnyView with @ViewBuilder or Group for type-safe composition
- **StateObject to @State + @Observable**: Migrate @StateObject + ObservableObject to @State + @Observable on iOS 17+

### Safety Rules for SwiftUI Refactoring
- Always verify previews still render after each refactoring step
- Test that navigation paths remain functional after route refactoring
- Verify data flow is preserved — @Binding connections must not be broken
- Run accessibility audit after refactoring to ensure labels and hints are preserved

### Available Skills
- \`swiftui-view-generator\`: Generate a complete SwiftUI view with architecture, previews, and tests
- \`swiftui-navigation-setup\`: Set up type-safe navigation with NavigationStack, route enum, and deep linking`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## SwiftUI Migration Guidance

### ObservableObject to @Observable (iOS 17+)
1. Add \`@Observable\` macro to the class
2. Remove \`: ObservableObject\` protocol conformance
3. Remove all \`@Published\` property wrappers
4. Replace \`@StateObject\` with \`@State\` in owning views
5. Replace \`@ObservedObject\` with direct property or \`@Bindable\`
6. Replace \`@EnvironmentObject\` with \`@Environment\`
7. Verify that views only re-render when properties they read change

### NavigationView to NavigationStack
1. Replace \`NavigationView\` with \`NavigationStack\`
2. Replace \`NavigationLink(destination:)\` with \`NavigationLink(value:)\`
3. Add \`.navigationDestination(for:)\` modifiers
4. Define route enum conforming to \`Hashable\`
5. Replace programmatic navigation with \`NavigationPath\`

### UIKit Hosting to Native SwiftUI
- Replace \`UIHostingController\` wrapping patterns with pure SwiftUI navigation
- Migrate \`UIViewRepresentable\` / \`UIViewControllerRepresentable\` only when native SwiftUI alternatives exist
- Use \`.searchable()\`, \`.refreshable()\`, \`.toolbar()\` instead of UIKit navigation item configuration

### Core Data to SwiftData (iOS 17+)
1. Replace \`NSManagedObject\` subclasses with \`@Model\` classes
2. Replace \`@FetchRequest\` with \`@Query\`
3. Replace \`NSPersistentContainer\` with \`ModelContainer\`
4. Replace \`NSManagedObjectContext\` with \`ModelContext\`
5. Test migration with production-like data volumes

### Available Skills
- \`swiftui-view-generator\`: Generate a complete SwiftUI view with architecture, previews, and tests
- \`swiftui-navigation-setup\`: Set up type-safe navigation with NavigationStack, route enum, and deep linking`,
      },
    ],
    skills: [
      {
        name: 'swiftui-view-generator',
        description: 'Generate a complete SwiftUI view with proper architecture, previews, and tests',
        content: `# SwiftUI View Generator

Generate a complete SwiftUI view following Apple best practices:

## Files to Generate

### 1. View File (\`<Name>View.swift\`)
\`\`\`swift
import SwiftUI

struct <Name>View: View {
    // Use @State for local state
    // Use @Binding for parent-provided state
    // Use @Environment for system values or injected dependencies

    var body: some View {
        // Keep under 40 lines
        // Extract sub-views as separate structs
        // Use .task for async data loading
        // Handle loading, error, and empty states
    }
}
\`\`\`

### 2. ViewModel (if needed) (\`<Name>ViewModel.swift\`)
\`\`\`swift
import Observation

@Observable
class <Name>ViewModel {
    var items: [Item] = []
    var isLoading = false
    var error: Error?

    func load() async {
        isLoading = true
        defer { isLoading = false }
        // fetch data
    }
}
\`\`\`

### 3. Preview Configuration
\`\`\`swift
#Preview("<Name> - Default") {
    <Name>View()
}

#Preview("<Name> - Loading") {
    <Name>View() // with loading state mock
}

#Preview("<Name> - Error") {
    <Name>View() // with error state mock
}

#Preview("<Name> - Dark Mode") {
    <Name>View()
        .preferredColorScheme(.dark)
}
\`\`\`

### 4. Test File (\`<Name>ViewTests.swift\`)
- Test ViewModel logic with async/await
- Test view states (loading, loaded, error, empty)
- Verify accessibility labels and hints
- Use in-memory data stores for SwiftData dependencies

### Conventions
- View files end with \`View\` suffix: \`ProfileView.swift\`
- ViewModel files end with \`ViewModel\` suffix: \`ProfileViewModel.swift\`
- One primary view per file
- Extract sub-views when body exceeds 40 lines
- Use semantic SwiftUI components (Label, Toggle, Picker)
- Add accessibility labels to all custom interactive elements
`,
      },
      {
        name: 'swiftui-navigation-setup',
        description: 'Set up type-safe navigation with NavigationStack, route enum, and deep linking',
        content: `# SwiftUI Navigation Setup

Generate a complete type-safe navigation architecture:

## Files to Generate

### 1. Route Enum (\`AppRoute.swift\`)
\`\`\`swift
enum AppRoute: Hashable {
    case home
    case detail(id: String)
    case settings
    case profile(userId: String)
}
\`\`\`

### 2. Router (\`AppRouter.swift\`)
\`\`\`swift
@Observable
class AppRouter {
    var path = NavigationPath()

    func navigate(to route: AppRoute) {
        path.append(route)
    }

    func popToRoot() {
        path = NavigationPath()
    }

    func handleDeepLink(_ url: URL) {
        // Parse URL and push appropriate route
    }
}
\`\`\`

### 3. Root Navigation View
\`\`\`swift
struct RootNavigationView: View {
    @State private var router = AppRouter()

    var body: some View {
        NavigationStack(path: $router.path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .home: HomeView()
                    case .detail(let id): DetailView(id: id)
                    case .settings: SettingsView()
                    case .profile(let userId): ProfileView(userId: userId)
                    }
                }
        }
        .environment(router)
        .onOpenURL { url in
            router.handleDeepLink(url)
        }
    }
}
\`\`\`

### 4. Deep Link Configuration
- Parse URL paths to AppRoute cases
- Handle universal links and custom URL schemes
- Validate and sanitize all URL parameters
- Test deep links with xcrun simctl openurl
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
            command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.swift\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/NavigationView\\b/.test(c)&&!/\\/\\/.*NavigationView/.test(c))console.log(\'HOOK_EXIT:1:NavigationView is deprecated. Use NavigationStack or NavigationSplitView instead (available iOS 16+).\')" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.swift\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/\\.animation\\s*\\([^)]*\\)/.test(c)&&!/\\.animation\\s*\\([^,]+,\\s*value:/.test(c)&&!/\\/\\//.test(c.split(\'.animation\')[0].split(\'\\n\').pop()||\'\')){console.log(\'WARNING: .animation() without value: parameter detected. Use .animation(.default, value: someValue) to scope animations and avoid unexpected behavior.\')}" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.swift\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/@AppStorage/.test(c)&&/(token|password|secret|credential|apiKey|api_key|accessKey|refreshToken)/i.test(c))console.log(\'HOOK_EXIT:1:SECURITY: Storing sensitive data in @AppStorage (UserDefaults — unencrypted). Use Keychain Services instead.\')" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.swift\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const lines=c.split(\'\\n\');let inBody=false,depth=0,bodyLines=0,maxBody=0;for(const l of lines){if(/var\\s+body\\s*:\\s*some\\s+View/.test(l)){inBody=true;depth=0;bodyLines=0}if(inBody){if(l.includes(\'{\'))depth++;if(l.includes(\'}\'))depth--;bodyLines++;if(depth===0&&bodyLines>1){if(bodyLines>maxBody)maxBody=bodyLines;inBody=false}}}if(maxBody>50)console.log(\'WARNING: View body is \'+maxBody+\' lines. Extract sub-views to keep body under 40 lines for readability and performance.\')" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'swiftlint',
        filePath: '.swiftlint.yml',
        config: {
          opt_in_rules: [
            'empty_count',
            'closure_spacing',
            'contains_over_first_not_nil',
            'discouraged_optional_boolean',
            'explicit_init',
            'fatal_error_message',
            'first_where',
            'modifier_order',
            'overridden_super_call',
            'private_outlet',
            'redundant_nil_coalescing',
            'sorted_first_last',
            'unowned_variable_capture',
            'vertical_parameter_alignment_on_call',
          ],
          disabled_rules: [
            'trailing_whitespace',
          ],
          line_length: {
            warning: 120,
            error: 160,
            ignores_urls: true,
            ignores_function_declarations: false,
            ignores_comments: true,
          },
          function_body_length: {
            warning: 40,
            error: 80,
          },
          type_body_length: {
            warning: 200,
            error: 400,
          },
          file_length: {
            warning: 400,
            error: 600,
          },
          excluded: [
            'DerivedData',
            '.build',
            'Pods',
            'Carthage',
            'Package.swift',
          ],
        },
        mergeStrategy: 'create-only',
      },
      {
        type: 'xcode-build-settings',
        filePath: 'xcconfig/SwiftUI-Shared.xcconfig',
        config: {
          SWIFT_STRICT_CONCURRENCY: 'complete',
          ENABLE_USER_SCRIPT_SANDBOXING: 'YES',
          SWIFT_VERSION: '5.9',
          IPHONEOS_DEPLOYMENT_TARGET: '17.0',
          ENABLE_PREVIEWS: 'YES',
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
