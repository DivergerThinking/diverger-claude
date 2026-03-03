import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const flutterProfile: Profile = {
  id: 'frameworks/flutter',
  name: 'Flutter',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['flutter'],
  dependsOn: ['languages/dart'],
  contributions: {
    claudeMd: [{
      heading: 'Flutter Conventions',
      order: 2000,
      content: `## Flutter Conventions

Widget-based UI composition. Declarative, immutable widget trees with state management.

**Detailed rules:** see \`.claude/rules/flutter/\` directory.

**Key rules:**
- Small, composable widgets — extract when a build method exceeds ~60 lines
- \`const\` constructors for stateless widgets, keys for list items
- State management: Provider/Riverpod for app state, \`StatefulWidget\` for local UI state
- Follow \`dart analyze\` — zero warnings, use \`flutter_lints\` or \`very_good_analysis\``,
    }],
    settings: {
      permissions: {
        allow: [
          'Bash(flutter:*)',
          'Bash(flutter run:*)',
          'Bash(flutter test:*)',
          'Bash(flutter build:*)',
          'Bash(flutter analyze:*)',
          'Bash(flutter pub:*)',
          'Bash(flutter gen-l10n:*)',
          'Bash(flutter clean:*)',
          'Bash(dart:*)',
          'Bash(dart run build_runner:*)',
          'Bash(dart fix:*)',
          'Bash(dart format:*)',
        ],
      },
    },
    rules: [
      {
        path: 'flutter/architecture-and-patterns.md',
        paths: ['**/*.dart', 'lib/**/*'],
        governance: 'mandatory',
        description: 'Flutter architecture (MVVM), widget composition, state management, and navigation',
        content: `# Flutter Architecture & Patterns

## MVVM Architecture (Flutter Team Recommended)
- Separate UI (widgets) from data (repositories, services) with ViewModels as intermediary
- Repositories abstract data sources (API + local cache) — widgets never call APIs directly
- ViewModels extend \`ChangeNotifier\` (or use Riverpod \`AsyncNotifier\`) with loading/error/data states
- Inject dependencies via constructor — no manually instantiated services in widgets
- Use consistent state management across codebase (Riverpod OR Bloc OR Provider — not mixed)

## Widget Composition Rules
- Extract sub-views as separate \`StatelessWidget\` classes — NOT helper methods returning widgets
- Helper methods lose widget identity, cannot use \`const\`, have no key support, no optimization
- Keep build() under 60 lines — extract sub-widget classes when exceeded
- Use \`const\` constructors for stateless widgets; add \`Key\` parameters for list items
- Convert unnecessary \`StatefulWidget\` to \`StatelessWidget\` when state is managed externally

## Immutable Data Models
- Use \`freezed\` for data classes — generates equality, copyWith, JSON serialization, sealed unions
- Never mutate models from the UI layer — use \`copyWith\` to create new instances
- Include \`factory User.fromJson(Map<String, dynamic>)\` for deserialization

## Routing with go_router
- Use \`GoRouter\` with typed route constants — no magic strings
- Implement \`redirect\` for auth flow (redirect to login when unauthenticated)
- Use path parameters: \`/user/:userId\` with \`state.pathParameters['userId']\`
- Use \`StatefulShellRoute.indexedStack\` for bottom tab navigation
- Configure deep linking and test on both platforms
`,
      },
      {
        path: 'flutter/performance.md',
        paths: ['**/*.dart', 'lib/**/*'],
        governance: 'mandatory',
        description: 'Flutter performance: build optimization, lists, animations, memory, and profiling',
        content: `# Flutter Performance

## Frame Rate Targets
- Target 16ms per frame (60 FPS); 8ms for 120Hz devices
- Always profile in release mode — debug mode adds significant overhead

## Build Optimization
- Use \`const\` constructors everywhere possible — Flutter short-circuits rebuild for const widgets
- Localize \`setState\` to the smallest subtree — never call setState at page level
- Pass non-animated children via \`widget.child\` so they do not rebuild

## Lists and Grids
- Use \`ListView.builder\`/\`GridView.builder\` for all lists — only builds visible items
- Never use \`ListView(children: [...])\` with \`List.generate\` or \`.map()\` for large collections
- Implement \`itemExtent\` or \`prototypeItem\` for fixed-height rows to skip measurement
- Use \`SliverList\`/\`SliverGrid\` inside \`CustomScrollView\` for complex scrollable layouts
- Cache network images with \`CachedNetworkImage\`

## Animations
- Use \`AnimatedBuilder\` with \`child\` parameter — child is built once, reused on every tick
- Prefer implicit animations (\`AnimatedOpacity\`, \`AnimatedContainer\`) for simple transitions
- Never use \`Opacity\` widget in animations — use \`AnimatedOpacity\` or \`FadeTransition\`
- Always dispose \`AnimationController\` in \`dispose()\`

## Avoid Expensive Operations
- Avoid \`ShaderMask\`, \`ColorFilter\`, \`Opacity\` widgets — they trigger expensive \`saveLayer()\` calls
- Prefer \`borderRadius\` on \`BoxDecoration\` over \`ClipRRect\` when possible
- Use \`StringBuffer\` for concatenation in loops (O(n) vs O(n^2))

## Memory Management
- Dispose controllers, streams, animations, and scroll controllers in \`dispose()\`
- Resize images before display — use \`Image.asset(cacheWidth:, cacheHeight:)\`
- Use \`AutomaticKeepAliveClientMixin\` sparingly — prevents disposal of off-screen content

## Profiling Checklist
- Profile in release mode: \`flutter run --profile\`
- Use Flutter DevTools Timeline to find expensive frames
- Use \`RepaintBoundary\` to isolate independently-changing expensive sub-trees
- Never override \`operator==\` on Widget subclasses — causes O(N^2) behavior
`,
      },
      {
        path: 'flutter/testing-strategy.md',
        paths: ['**/*.dart', 'lib/**/*'],
        governance: 'mandatory',
        description: 'Flutter testing: unit, widget, integration tests and mocking patterns',
        content: `# Flutter Testing Strategy

## Three Types of Tests
- **Unit** — ViewModels, repositories, services, utilities (fast, mocked dependencies)
- **Widget** — widget rendering, interactions, state changes (medium, mocked + flutter_test)
- **Integration** — complete user flows across screens (slow, real app or mocked backend)

## Unit Tests
- Use \`mockito\` with \`@GenerateMocks\` for type-safe mocks
- Test every ViewModel method: happy path, error handling, loading state transitions
- Use \`setUp\`/\`tearDown\` for consistent test setup
- Verify \`notifyListeners()\` is called at the right times

## Widget Tests
- Use \`tester.pumpWidget()\` to render in isolation with mocked providers
- Test loading, success, error, and empty states for every screen
- Key APIs: \`pumpAndSettle()\`, \`tester.tap()\`, \`tester.enterText()\`, \`find.byType/byKey/text\`
- Mock dependencies with Provider/Riverpod overrides — inject fakes
- Test user interactions and verify navigation events with \`MockNavigatorObserver\`

## Integration Tests
- Write \`integration_test/\` flows for critical user journeys (login, onboarding, core features)
- Use \`Key\` widgets on all interactive elements for reliable selectors
- Test on both iOS and Android — platform-specific bugs are common
- Test deep linking and app lifecycle (background, foreground, restore)

## Golden Tests
- Use \`matchesGoldenFile\` for visual regression testing of key screens
- Generate goldens with \`flutter test --update-goldens\`

## Mocking Strategy
- Use \`mockito\` + \`@GenerateMocks\` for type-safe mocks
- Prefer fakes (manual implementations) for complex dependencies
- Mock platform channels with \`TestDefaultBinaryMessengerBinding\`

## Test File Naming
- Unit: \`test/unit/<feature>_test.dart\`
- Widget: \`test/widget/<widget_name>_test.dart\`
- Integration: \`integration_test/<flow_name>_test.dart\`
`,
      },
      {
        path: 'flutter/security.md',
        paths: ['**/*.dart', 'lib/**/*'],
        governance: 'recommended',
        description: 'Flutter mobile security: secure storage, network safety, and platform hardening',
        content: `# Flutter Security

## Sensitive Data Storage
- NEVER store secrets, tokens, or passwords in SharedPreferences — plaintext on disk
- Use \`flutter_secure_storage\` for credentials (iOS Keychain / Android EncryptedSharedPreferences)
- Clear secure storage on user logout
- Use \`Hive\` with encryption for structured sensitive local data

## Network Security
- Use HTTPS for ALL network requests — no exceptions
- Do not disable ATS (App Transport Security) on iOS
- Implement certificate pinning for sensitive APIs (authentication, payments)
- Validate SSL certificates — do not ignore SSL errors in production
- Use \`dio\` or \`http\` interceptors for centralized auth header injection

## Code Security
- Do not bundle API keys in Dart source — extractable from release builds
- Use \`--dart-define\` or \`envied\` package for environment-specific configuration
- Enable obfuscation: \`flutter build apk --obfuscate --split-debug-info=./debug-info\`
- Validate all deep link URLs — malicious apps can send crafted URLs
- Sanitize user input before displaying — prevent XSS in WebView contexts

## App Integrity
- Implement jailbreak/root detection for sensitive apps (banking, health)
- Use code signing for both iOS and Android release builds
- Set \`android:allowBackup="false"\` in AndroidManifest.xml
- Protect sensitive screens from screenshots (FLAG_SECURE on Android)

## Input Validation
- Validate form input with Flutter form validators — never trust client input alone
- Use server-side validation as primary defense — client-side is for UX only
- Sanitize data before passing to platform channels — prevent native-side injection
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Flutter-Specific Review

### Architecture & State Management
- Verify MVVM pattern: business logic in ViewModels/notifiers, NOT in widgets
- Check that repositories abstract data sources — widgets should never call APIs directly
- Verify dependency injection is used — no manually instantiated services in widgets
- Check that state management approach is consistent across the codebase (Riverpod OR Bloc OR Provider — not mixed)
- Verify data models are immutable (freezed or manual copyWith) — never mutate models from UI

### Widget Quality
- Check for const constructors wherever possible — missing const wastes rebuild cycles
- Verify widget size — extract sub-widget classes if build() exceeds 80 lines
- Check for helper methods returning widgets — should be separate StatelessWidget classes
- Verify proper disposal of controllers, streams, and AnimationControllers in dispose()
- Check for unnecessary StatefulWidgets that could be StatelessWidgets
- Verify Key usage in lists — ValueKey with stable IDs, never array indices

### Performance
- Check for setState called high in the widget tree — should be localized to smallest subtree
- Verify ListView.builder/GridView.builder usage for all lists — flag eager ListView with children
- Check for Opacity widget in animations — should use AnimatedOpacity or FadeTransition
- Verify AnimatedBuilder passes non-animated children via child parameter
- Check for inline style objects or widget creation inside build — extract to const or cache
- Flag saveLayer-triggering widgets: ShaderMask, ColorFilter, unoptimized Opacity

### Navigation & Security
- Verify go_router (or equivalent) with typed route constants — no magic strings
- Check that deep linking is configured and tested
- Verify sensitive data uses flutter_secure_storage, NOT SharedPreferences
- Check that API keys are not hardcoded in Dart source files
- Verify code obfuscation flags in release build configuration

### Available Skills
- \`flutter-feature-generator\`: Generate a complete Flutter feature following MVVM architecture with tests
- \`flutter-platform-channel-generator\`: Generate type-safe platform channels using pigeon`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Flutter Testing

### Unit Tests (ViewModels, Repositories, Services)
- Use mockito with @GenerateMocks for type-safe mocks of dependencies
- Test every ViewModel method: happy path, error handling, loading states, edge cases
- Test repositories with mocked services — verify caching, fallback, and error propagation
- Use \`setUp\` and \`tearDown\` for consistent test setup and cleanup
- Verify notifyListeners() is called at the right times with ChangeNotifier

### Widget Tests
- Use flutter_test and pumpWidget to render widgets in isolation
- Mock dependencies with Provider/Riverpod overrides — inject fakes, not real services
- Test loading, success, error, and empty states for every screen
- Use find.byType, find.byKey, find.text to locate widgets — prefer Key-based selectors
- Test user interactions: tester.tap, tester.enterText, tester.drag
- Use pumpAndSettle for animations, pump(duration) for specific frame timing
- Test navigation events with MockNavigatorObserver

### Integration Tests
- Write integration_test/ flows for critical user journeys (login, onboarding, core features)
- Use Key widgets on all interactive elements for reliable test selectors
- Test on both iOS and Android — platform-specific bugs are common
- Test deep linking with integration test URL handling
- Test app lifecycle: background, foreground, restore from killed state

### Golden Tests
- Use matchesGoldenFile for visual regression testing of key screens
- Generate goldens with \`flutter test --update-goldens\`
- Review golden diffs in pull requests to catch unintended visual changes

### Available Skills
- \`flutter-feature-generator\`: Generate a complete Flutter feature following MVVM architecture with tests`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Flutter Security Review

### Sensitive Data
- Verify NO credentials, tokens, or secrets are stored in SharedPreferences (plaintext)
- Check that flutter_secure_storage is used for sensitive data (iOS Keychain / Android Keystore)
- Verify API keys are NOT hardcoded in Dart source — they are extractable from builds
- Check that sensitive data is not logged via print(), debugPrint(), or crash reporting
- Verify --obfuscate flag is enabled for release builds

### Network Security
- Verify all API calls use HTTPS — flag any HTTP URLs
- Check for disabled ATS (App Transport Security) in iOS Info.plist
- Verify certificate pinning is implemented for sensitive APIs (auth, payments)
- Check that error responses from APIs do not expose internal details to users

### Platform Security
- Verify android:allowBackup="false" is set in AndroidManifest.xml
- Check that deep link URL schemes are validated — reject unexpected parameters
- Verify WebView content is sandboxed and JavaScript injection is prevented
- Check for jailbreak/root detection in sensitive apps (banking, health)
- Verify ProGuard/R8 rules are configured for Android release builds`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Flutter Documentation

### API Documentation
- Document all public classes and methods with DartDoc comments (///)
- Include @param descriptions for constructor parameters
- Add code examples in /// blocks — they are verified by dartdoc
- Document widget usage with a brief description of what it renders and when to use it

### Architecture Documentation
- Document the data flow: Widget -> ViewModel -> Repository -> Service
- Explain state management approach and conventions chosen for the project
- Document routing structure and deep link paths
- Include setup instructions for code generation (build_runner, freezed, etc.)

### README Conventions for Flutter Projects
- Include prerequisites: Flutter SDK version, Dart version, platform-specific setup
- Document environment setup: .env files, API keys, backend configuration
- List common commands: run, test, build, code generation, localization
- Document platform-specific requirements (Xcode version, Android SDK, signing)`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Flutter Refactoring Patterns

### Widget Decomposition
- Extract large build() methods into separate widget classes — not helper methods
- Convert StatefulWidget to StatelessWidget when local state is managed externally (Provider, Riverpod)
- Extract repeated widget patterns into configurable reusable widgets with const constructors
- Move business logic from StatefulWidget.initState/build to ViewModels or controllers

### State Management Migration
- When migrating from setState to Provider/Riverpod: extract state to ChangeNotifier first
- Move data fetching from widget lifecycle to ViewModel — test ViewModel independently
- Replace manual state flags (isLoading, hasError) with AsyncValue/Result pattern
- Consolidate scattered Provider.of calls to a single context.watch at the top of build

### Performance Refactoring
- Add const to all constructors and widget instantiations where possible
- Replace ListView(children: [...]) with ListView.builder for dynamic lists
- Wrap independently-changing subtrees in RepaintBoundary
- Extract animated children to the child parameter of AnimatedBuilder
- Replace Opacity animations with AnimatedOpacity or FadeTransition

### Available Skills
- \`flutter-feature-generator\`: Generate a complete Flutter feature following MVVM architecture with tests
- \`flutter-platform-channel-generator\`: Generate type-safe platform channels using pigeon`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Flutter Migration Guidance

### Flutter Version Upgrades
- Read the Flutter migration guide and breaking changes for the target version
- Run \`flutter upgrade\` and then \`flutter analyze\` to find issues
- Use \`dart fix --apply\` for automated migration of deprecated APIs
- Update pub dependencies with \`flutter pub upgrade --major-versions\` and verify compatibility
- Test on all target platforms after upgrade — platform-specific regressions are common

### Common Migrations
- **Null safety**: Use \`dart migrate\` for pre-null-safety code
- **Material 3**: Replace deprecated Material 2 widgets with M3 equivalents, update ThemeData to use ColorScheme.fromSeed
- **Navigator 2.0 to go_router**: Map existing route definitions to GoRoute declarations
- **Provider to Riverpod**: Replace ChangeNotifierProvider with Riverpod's NotifierProvider, update context.watch to ref.watch
- **setState to state management**: Extract state to ChangeNotifier, wrap widget in ChangeNotifierProvider

### Dependency Migration
- Check pub.dev for migration guides when upgrading major versions
- Update code generation dependencies (freezed, json_serializable) together
- Run build_runner after dependency updates: \`dart run build_runner build --delete-conflicting-outputs\`
- Verify platform plugin compatibility on both iOS and Android after updates`,
      },
    ],
    skills: [
      {
        name: 'flutter-feature-generator',
        description: 'Generate a complete Flutter feature following MVVM architecture with tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Flutter Feature Generator

Generate a complete Flutter feature following MVVM architecture and Flutter team recommendations.

## Files to Generate

### 1. Data Model (\`lib/data/models/<name>.dart\`)
- Use freezed for immutable data class with equality, copyWith, and JSON serialization
- Include factory constructor fromJson
- Add relevant default values

### 2. Repository (\`lib/data/repositories/<name>_repository.dart\`)
- Define abstract class with all required methods
- Implement concrete class with API service and optional local caching
- Handle network errors with fallback to cached data
- Return typed Results or throw domain-specific exceptions

### 3. ViewModel (\`lib/ui/<feature>/<feature>_view_model.dart\`)
- Extend ChangeNotifier (or use Riverpod AsyncNotifier)
- Expose loading, error, and data states
- Accept repository via constructor injection
- Contain all business logic — no UI code
- Call notifyListeners() after state changes

### 4. Screen Widget (\`lib/ui/<feature>/<feature>_screen.dart\`)
- StatelessWidget with ChangeNotifierProvider (or ConsumerWidget for Riverpod)
- Handle loading state (CircularProgressIndicator)
- Handle error state (error message + retry button)
- Handle empty state (informative empty view)
- Handle success state (display data)
- Use const constructors and extract sub-widgets

### 5. Route Registration (\`lib/routing/router.dart\`)
- Add GoRoute with typed path parameters
- Include route constant in routes file

### 6. Unit Test (\`test/unit/<feature>_view_model_test.dart\`)
- Mock repository with @GenerateMocks
- Test happy path, error path, loading state transitions
- Test edge cases (empty data, null fields)

### 7. Widget Test (\`test/widget/<feature>_screen_test.dart\`)
- Test loading, success, error, and empty states
- Test user interactions (tap, scroll, text input)
- Mock ViewModel or inject fake repository

## Naming Conventions
- Screens: \`<Feature>Screen\` (e.g., \`ProfileScreen\`)
- ViewModels: \`<Feature>ViewModel\` (e.g., \`ProfileViewModel\`)
- Repositories: \`<Feature>Repository\` (e.g., \`UserRepository\`)
- Models: \`<Name>\` (e.g., \`User\`, \`Product\`)
- Files: \`snake_case.dart\` (e.g., \`profile_screen.dart\`)
`,
      },
      {
        name: 'flutter-platform-channel-generator',
        description: 'Generate type-safe platform channels using pigeon',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Flutter Platform Channel Generator

Generate type-safe platform channels using the pigeon package.

## Files to Generate

### 1. Pigeon Definition (\`pigeons/<name>_api.dart\`)
\`\`\`dart
import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(PigeonOptions(
  dartOut: 'lib/src/generated/<name>_api.g.dart',
  kotlinOut: 'android/app/src/main/kotlin/com/example/<Name>Api.kt',
  swiftOut: 'ios/Runner/<Name>Api.swift',
))
class DeviceInfoResult {
  late String model;
  late String osVersion;
  late double batteryLevel;
}

@HostApi()
abstract class DeviceInfoApi {
  DeviceInfoResult getDeviceInfo();
  @async
  double getBatteryLevel();
}
\`\`\`

### 2. Run Code Generation
\`\`\`bash
dart run pigeon --input pigeons/<name>_api.dart
\`\`\`

### 3. Dart Wrapper (\`lib/src/<name>_service.dart\`)
- Import generated API class
- Wrap calls with error handling (PlatformException)
- Provide fallback values for non-critical failures
- Add logging for debugging

### 4. Android Implementation (\`android/.../\<Name>ApiImpl.kt\`)
- Implement generated HostApi interface
- Handle Android-specific APIs
- Return results using generated result classes

### 5. iOS Implementation (\`ios/Runner/<Name>ApiImpl.swift\`)
- Implement generated protocol
- Handle iOS-specific APIs
- Return results using generated data classes

### 6. Tests
- Mock the generated API class in Dart unit tests
- Test error handling for PlatformException
- Test on both platforms with integration tests
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for setState in large Flutter widgets',
          command: 'FILE_PATH=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/setState\\s*\\(/.test(c)&&c.split(\'\\n\').length>120){console.error(\'WARNING: setState in a large widget (>120 lines). Consider extracting state management to a ViewModel or ChangeNotifier for better testability and separation of concerns.\');process.exit(2)}" -- "$FILE_PATH" || true',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for sensitive data in SharedPreferences',
          command: 'FILE_PATH=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/SharedPreferences/.test(c)&&/(token|password|secret|credential|apiKey|api_key|auth)/i.test(c)){console.error(\'SECURITY: Storing sensitive data in SharedPreferences (unencrypted). Use flutter_secure_storage for credentials and tokens.\');process.exit(2)}" -- "$FILE_PATH" || true',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for excessive private widget helper methods in Flutter code',
          command: 'FILE_PATH=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const m=c.match(/Widget\\s+_\\w+\\s*\\(/g);if(m&&m.length>=3){console.error(\'WARNING: \'+m.length+\' private helper methods returning widgets detected. Extract them as separate StatelessWidget classes for better performance and reusability.\');process.exit(2)}" -- "$FILE_PATH" || true',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for eager ListView with children in Flutter code',
          command: 'FILE_PATH=$(cat | jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/ListView\\s*\\(/.test(c)&&/children\\s*:/.test(c)&&/List\\.generate|map\\s*\\(/.test(c)){console.error(\'WARNING: Eager ListView with children detected. Use ListView.builder for lazy construction and better performance with large lists.\');process.exit(2)}" -- "$FILE_PATH" || true',
          timeout: 5,
        }],
      },
    ],
    externalTools: [
      {
        type: 'dart-analysis',
        filePath: 'analysis_options.yaml',
        config: {
          include: 'package:flutter_lints/flutter.yaml',
          linter: {
            rules: {
              prefer_const_constructors: true,
              prefer_const_declarations: true,
              prefer_const_literals_to_create_immutables: true,
              sized_box_for_whitespace: true,
              use_key_in_widget_constructors: true,
              avoid_print: true,
              prefer_final_locals: true,
              always_declare_return_types: true,
              annotate_overrides: true,
              avoid_unnecessary_containers: true,
              prefer_single_quotes: true,
            },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
