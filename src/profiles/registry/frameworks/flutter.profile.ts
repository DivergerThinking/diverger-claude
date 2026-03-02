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

### Architecture (MVVM + Repository Pattern)
- Follow the Flutter team's recommended architecture: View (Widget) -> ViewModel -> Repository -> Service/Data Source
- **UI Layer**: Widgets display data and capture user events — keep widgets "dumb" with no business logic
- **Data Layer**: Repositories are the single source of truth — they abstract data sources (API, database, local storage)
- **ViewModels**: Contain all business logic and expose state to the UI via ChangeNotifier, ValueNotifier, or Riverpod notifiers
- Use dependency injection (Provider, Riverpod, or get_it) — avoid globally accessible singletons
- Use immutable data models — prefer \`freezed\` or \`built_value\` for equality, copyWith, and JSON serialization
- Follow unidirectional data flow: Data Layer -> ViewModel -> UI Layer (events flow back via commands/methods)

### Widget Composition
- Build UI through composition — small, focused, reusable widgets
- Prefer \`StatelessWidget\` over \`StatefulWidget\` when no local mutable state is needed
- Use \`const\` constructors on every widget that supports them — Flutter short-circuits rebuild work for const widgets
- Extract sub-widgets as separate widget classes, not helper methods returning widgets (functions lose widget identity and optimizations)
- Keep \`build()\` methods under 80 lines — extract sub-widgets when they grow
- Use \`Key\` correctly: \`ValueKey\` for items in lists, \`ObjectKey\` for model-based identity, \`GlobalKey\` only when truly necessary (form state, navigator state)

### State Management
- Pick one approach per project and use it consistently: Riverpod (recommended by community), Bloc, Provider, or built-in ValueNotifier
- Localize \`setState()\` calls to the smallest subtree that needs to change — never call setState high in the widget tree
- Separate UI state (selected tab, animation progress) from business state (user data, cart items)
- Never put business logic in widgets — delegate to ViewModels, controllers, or notifiers
- Dispose controllers, streams, and animation controllers in \`dispose()\` — resource leaks cause memory issues

### Navigation
- Use \`go_router\` for declarative routing — it covers 90% of Flutter navigation needs
- Define route paths as constants — no magic strings scattered through the codebase
- Handle deep links in route configuration from project start — retrofitting is difficult
- Use route guards (redirect callbacks) for authentication flows
- Use \`StatefulShellRoute\` for bottom navigation with preserved state per tab

### Styling & Theming
- Use \`ThemeData\` and \`ColorScheme.fromSeed()\` for consistent app-wide theming
- Access theme values via \`Theme.of(context)\` — never hardcode colors or text styles
- Support both Material and Cupertino design when targeting iOS and Android
- Use \`MediaQuery\` and \`LayoutBuilder\` for responsive layouts — never hardcode dimensions
- Define design tokens (spacing, radii, breakpoints) as constants in a dedicated theme file

### Platform Channels
- Use \`pigeon\` for type-safe platform channels — it generates Dart, Kotlin/Java, and Swift/ObjC code
- Define clear method channel contracts with explicit types
- Handle errors on both the Dart side and the native side — unhandled native exceptions crash the app
- Test channel calls with mock method call handlers
- Prefer existing plugins (pub.dev) over custom platform channels when available

### Project Structure
\`\`\`
lib/
  main.dart                    # entry point — wire dependencies
  app.dart                     # MaterialApp / router configuration
  config/                      # theme, constants, environment config
  routing/                     # router definition, route constants
  ui/
    core/                      # shared widgets, NOT /widgets
    <feature>/
      <feature>_screen.dart    # View (widget)
      <feature>_view_model.dart # ViewModel
      widgets/                 # feature-specific widgets
  data/
    repositories/              # repository interfaces + implementations
    services/                  # API clients, database access
    models/                    # data models (freezed / json_serializable)
  domain/                      # (optional) use cases for complex apps
  utils/                       # pure utility functions
test/
  unit/                        # ViewModel, repository, service tests
  widget/                      # widget tests with pumpWidget
  integration/                 # integration_test/ for full-app flows
\`\`\`

### Common Commands
- \`flutter run\` — run on connected device/emulator
- \`flutter test\` — run all unit and widget tests
- \`flutter test --coverage\` — generate lcov coverage report
- \`flutter analyze\` — run Dart analyzer (lint checks)
- \`flutter build apk\` / \`flutter build ios\` — release builds
- \`flutter pub get\` — fetch dependencies
- \`flutter pub outdated\` — check for dependency updates
- \`flutter gen-l10n\` — generate localization files from ARB
- \`dart run build_runner build --delete-conflicting-outputs\` — run code generation (freezed, json_serializable, etc.)`,
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
        governance: 'mandatory',
        description: 'Flutter architecture (MVVM), widget composition, state management, and navigation',
        content: `# Flutter Architecture & Patterns

## MVVM Architecture (Flutter Team Recommended)

The Flutter team strongly recommends MVVM with a clear separation between UI and data layers.

### Correct — MVVM with repository pattern

\`\`\`dart
// data/repositories/user_repository.dart
abstract class UserRepository {
  Future<User> getUser(String id);
  Future<void> updateUser(User user);
}

class UserRepositoryImpl implements UserRepository {
  final ApiService _apiService;
  final UserDao _localDao;

  UserRepositoryImpl({required ApiService apiService, required UserDao localDao})
      : _apiService = apiService,
        _localDao = localDao;

  @override
  Future<User> getUser(String id) async {
    try {
      final user = await _apiService.fetchUser(id);
      await _localDao.cacheUser(user);
      return user;
    } catch (e) {
      // Fallback to cache on network error
      return _localDao.getUser(id);
    }
  }
}
\`\`\`

\`\`\`dart
// ui/profile/profile_view_model.dart
class ProfileViewModel extends ChangeNotifier {
  final UserRepository _userRepository;

  ProfileViewModel({required UserRepository userRepository})
      : _userRepository = userRepository;

  User? _user;
  User? get user => _user;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  Future<void> loadUser(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _userRepository.getUser(id);
    } catch (e) {
      _error = 'Failed to load user profile';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
\`\`\`

\`\`\`dart
// ui/profile/profile_screen.dart
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => ProfileViewModel(
        userRepository: context.read<UserRepository>(),
      )..loadUser(userId),
      child: const _ProfileContent(),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent();

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<ProfileViewModel>();

    if (vm.isLoading) return const Center(child: CircularProgressIndicator());
    if (vm.error != null) return Center(child: Text(vm.error!));

    final user = vm.user;
    if (user == null) return const SizedBox.shrink();

    return Column(
      children: [
        Text(user.name, style: Theme.of(context).textTheme.headlineMedium),
        Text(user.email),
      ],
    );
  }
}
\`\`\`

### Anti-Pattern — business logic in widgets

\`\`\`dart
// BAD: Widget directly calls API, manages loading state, caches data
class ProfileScreen extends StatefulWidget {
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? user;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    // Business logic mixed with UI — not testable without widget test
    http.get(Uri.parse('https://api.example.com/user/1')).then((response) {
      setState(() {
        user = User.fromJson(jsonDecode(response.body));
        isLoading = false;
      });
    });
  }
}
\`\`\`

---

## Widget Composition Rules

### Correct — extract widget classes

\`\`\`dart
// Good: separate widget class — has its own Element, enables const, supports keys
class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.imageUrl, this.size = 40});

  final String imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: Image.network(imageUrl, width: size, height: size, fit: BoxFit.cover),
    );
  }
}
\`\`\`

### Anti-Pattern — helper methods returning widgets

\`\`\`dart
// BAD: loses widget identity, cannot use const, no key support, no optimization
class UserProfile extends StatelessWidget {
  Widget _buildAvatar(String url) {
    return ClipOval(
      child: Image.network(url, width: 40, height: 40, fit: BoxFit.cover),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [_buildAvatar(user.imageUrl)]);
  }
}
\`\`\`

---

## Immutable Data Models

Use \`freezed\` for data classes — it generates equality, copyWith, JSON serialization, and sealed union types:

\`\`\`dart
@freezed
class User with _\$User {
  const factory User({
    required String id,
    required String name,
    required String email,
    @Default('') String avatarUrl,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _\$UserFromJson(json);
}
\`\`\`

Never mutate models from the UI layer — use \`copyWith\` to create new instances.

---

## Routing with go_router

\`\`\`dart
final goRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final isLoggedIn = authNotifier.isLoggedIn;
    final isLoginRoute = state.matchedLocation == '/login';

    if (!isLoggedIn && !isLoginRoute) return '/login';
    if (isLoggedIn && isLoginRoute) return '/';
    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/user/:userId',
      builder: (context, state) {
        final userId = state.pathParameters['userId']!;
        return ProfileScreen(userId: userId);
      },
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, child) => ScaffoldWithNavBar(child: child),
      branches: [
        StatefulShellBranch(routes: [GoRoute(path: '/home', builder: ...)]),
        StatefulShellBranch(routes: [GoRoute(path: '/search', builder: ...)]),
        StatefulShellBranch(routes: [GoRoute(path: '/profile', builder: ...)]),
      ],
    ),
  ],
);
\`\`\`
`,
      },
      {
        path: 'flutter/performance.md',
        governance: 'mandatory',
        description: 'Flutter performance: build optimization, lists, animations, memory, and profiling',
        content: `# Flutter Performance

## Frame Rate Targets
- Target 16ms per frame (60 FPS) — split as ~8ms build + ~8ms render
- For 120Hz devices, target 8ms total per frame
- Always profile in **release mode** — debug mode adds significant overhead (dart checks, assertions)

## Build Optimization

### Use const constructors everywhere possible
\`\`\`dart
// Good: Flutter short-circuits rebuild for const widgets
const Padding(padding: EdgeInsets.all(16), child: Text('Hello'));
const SizedBox(height: 8);
const Icon(Icons.home, size: 24);
\`\`\`

### Localize setState to the smallest subtree
\`\`\`dart
// Good: only CounterDisplay rebuilds when count changes
class CounterButton extends StatefulWidget {
  final Widget child;
  const CounterButton({super.key, required this.child});

  @override
  State<CounterButton> createState() => _CounterButtonState();
}

class _CounterButtonState extends State<CounterButton> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Count: \$_count'),
        ElevatedButton(
          onPressed: () => setState(() => _count++),
          child: const Text('Increment'),
        ),
        widget.child, // Does NOT rebuild
      ],
    );
  }
}
\`\`\`

### Anti-Pattern — setState at page level
\`\`\`dart
// BAD: setState on the entire page — rebuilds ALL children including expensive ones
class MyPage extends StatefulWidget { ... }
class _MyPageState extends State<MyPage> {
  int counter = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Count: \$counter'),
        const ExpensiveWidget(),      // rebuilds unnecessarily!
        const AnotherExpensiveWidget(), // rebuilds unnecessarily!
      ],
    );
  }
}
\`\`\`

---

## Lists and Grids

### Correct — lazy-built list
\`\`\`dart
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ListTile(title: Text(items[index].title)),
)
\`\`\`

### Anti-Pattern — eager list
\`\`\`dart
// BAD: builds ALL 10,000 items at startup — causes jank and high memory usage
ListView(
  children: List.generate(10000, (i) => ListTile(title: Text('Item \$i'))),
)
\`\`\`

- Use \`ListView.builder\` and \`GridView.builder\` for all lists — they only build visible items
- Implement \`itemExtent\` or \`prototypeItem\` for fixed-height rows to skip measurement
- Use \`SliverList\` and \`SliverGrid\` inside \`CustomScrollView\` for complex scrollable layouts
- Cache network images with \`CachedNetworkImage\` — avoid re-downloading on rebuild

---

## Animations

### Correct — use AnimatedBuilder with child parameter
\`\`\`dart
AnimatedBuilder(
  animation: _controller,
  builder: (context, child) {
    return Transform.translate(
      offset: Offset(_controller.value * 100, 0),
      child: child, // Does NOT rebuild — passed through
    );
  },
  child: const ExpensiveWidget(), // Built once, reused on every tick
)
\`\`\`

### Anti-Pattern — rebuilding children on every animation tick
\`\`\`dart
// BAD: ExpensiveWidget is reconstructed on every animation frame
AnimatedBuilder(
  animation: _controller,
  builder: (context, child) {
    return Column(
      children: [
        Transform.translate(
          offset: Offset(_controller.value * 100, 0),
          child: const ExpensiveWidget(), // Rebuilt every frame!
        ),
      ],
    );
  },
)
\`\`\`

- Prefer \`AnimatedOpacity\`, \`AnimatedContainer\`, \`AnimatedPositioned\` for simple implicit animations
- Use \`AnimationController\` + \`AnimatedBuilder\` for explicit custom animations
- Never use \`Opacity\` widget in animations — use \`AnimatedOpacity\` or \`FadeTransition\` instead
- Always dispose \`AnimationController\` in \`dispose()\`

---

## Avoid Expensive Operations

### saveLayer Calls
- Avoid \`ShaderMask\`, \`ColorFilter\`, and \`Opacity\` widgets — they trigger expensive \`saveLayer()\` calls
- Use \`PerformanceOverlayLayer.checkerboardOffscreenLayers\` in DevTools to detect them
- For transparent colors, use \`Color.withOpacity()\` directly on the color instead of wrapping with \`Opacity\`

### Clipping
- Prefer \`borderRadius\` on \`BoxDecoration\` over \`ClipRRect\` when possible
- Use \`Clip.none\` (default) unless clipping is visually necessary

### String Building
\`\`\`dart
// Good: O(n) — concatenates once
final buffer = StringBuffer();
for (int i = 0; i < 1000; i++) {
  buffer.write('Item \$i ');
}
final result = buffer.toString();

// Bad: O(n^2) — creates new String each iteration
String result = '';
for (int i = 0; i < 1000; i++) {
  result += 'Item \$i ';
}
\`\`\`

---

## Memory Management
- Dispose controllers, streams, animation controllers, and scroll controllers in \`dispose()\`
- Use \`AutomaticKeepAliveClientMixin\` sparingly — it prevents disposal of off-screen tab content
- Monitor memory with Flutter DevTools memory view
- Resize images before display — avoid loading 4000x3000 images for 100x100 thumbnails
- Use \`Image.asset(cacheWidth: ..., cacheHeight: ...)\` to decode at the target resolution

---

## Profiling Checklist
- Profile in release mode: \`flutter run --profile\`
- Use Flutter DevTools Timeline to find expensive frames
- Enable "Track layouts" in DevTools Performance view to detect intrinsic passes
- Use \`debugProfileBuildsEnabled = true\` to see which widgets rebuild
- Use \`RepaintBoundary\` to isolate expensive sub-trees that change independently
- Never override \`operator==\` on Widget subclasses — it causes O(N^2) behavior
`,
      },
      {
        path: 'flutter/testing-strategy.md',
        governance: 'mandatory',
        description: 'Flutter testing: unit, widget, integration tests and mocking patterns',
        content: `# Flutter Testing Strategy

## Three Types of Tests

| Type | Purpose | Speed | Dependencies |
|------|---------|-------|-------------|
| **Unit** | Test ViewModels, repositories, services, utilities | Fast | Mocked |
| **Widget** | Test widget rendering, interactions, state changes | Medium | Mocked + flutter_test |
| **Integration** | Test complete user flows across screens | Slow | Real app or mocked backend |

## Unit Tests

Test all business logic independently from UI:

\`\`\`dart
// test/unit/profile_view_model_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

@GenerateMocks([UserRepository])
void main() {
  late MockUserRepository mockRepo;
  late ProfileViewModel viewModel;

  setUp(() {
    mockRepo = MockUserRepository();
    viewModel = ProfileViewModel(userRepository: mockRepo);
  });

  group('loadUser', () {
    test('should set user when repository returns data', () async {
      when(mockRepo.getUser('1')).thenAnswer(
        (_) async => const User(id: '1', name: 'Alice', email: 'alice@test.com'),
      );

      await viewModel.loadUser('1');

      expect(viewModel.user?.name, 'Alice');
      expect(viewModel.isLoading, false);
      expect(viewModel.error, isNull);
    });

    test('should set error when repository throws', () async {
      when(mockRepo.getUser('1')).thenThrow(Exception('Network error'));

      await viewModel.loadUser('1');

      expect(viewModel.user, isNull);
      expect(viewModel.error, isNotNull);
      expect(viewModel.isLoading, false);
    });
  });
}
\`\`\`

## Widget Tests

Test widget rendering, interactions, and state changes:

\`\`\`dart
// test/widget/profile_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('should display user name after loading', (tester) async {
    // Arrange
    await tester.pumpWidget(
      MaterialApp(
        home: ChangeNotifierProvider<ProfileViewModel>(
          create: (_) => fakeViewModel,
          child: const ProfileScreen(),
        ),
      ),
    );

    // Act — advance frames until loading completes
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Alice'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('should show error message on failure', (tester) async {
    await tester.pumpWidget(/* ... with error state ... */);
    await tester.pumpAndSettle();

    expect(find.text('Failed to load user profile'), findsOneWidget);
  });
}
\`\`\`

### Key Widget Test APIs
- \`tester.pumpWidget(widget)\` — renders the widget
- \`tester.pump()\` — triggers a single frame rebuild
- \`tester.pumpAndSettle()\` — pumps until no more frames are scheduled
- \`tester.tap(find.byKey(...))\` — simulates tap
- \`tester.enterText(find.byType(TextField), 'text')\` — simulates text input
- \`find.byType(T)\`, \`find.byKey(Key)\`, \`find.text('...')\` — widget finders

## Integration Tests

\`\`\`dart
// integration_test/app_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('complete login flow', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('email_field')), 'alice@test.com');
    await tester.enterText(find.byKey(const Key('password_field')), 'password123');
    await tester.tap(find.byKey(const Key('login_button')));
    await tester.pumpAndSettle();

    expect(find.text('Welcome, Alice'), findsOneWidget);
  });
}
\`\`\`

## Mocking Strategy
- Use \`mockito\` with \`@GenerateMocks\` for type-safe mocks
- Create fake implementations of repositories and services for widget tests
- Mock platform channels with \`TestDefaultBinaryMessengerBinding\`
- Use \`MockNavigatorObserver\` to verify navigation events
- Prefer fakes (manual implementations) for complex dependencies over mockito stubs

## Test File Naming
- Unit tests: \`test/unit/<feature>_test.dart\`
- Widget tests: \`test/widget/<widget_name>_test.dart\`
- Integration tests: \`integration_test/<flow_name>_test.dart\`
`,
      },
      {
        path: 'flutter/security.md',
        governance: 'recommended',
        description: 'Flutter mobile security: secure storage, network safety, and platform hardening',
        content: `# Flutter Security

## Sensitive Data Storage
- NEVER store secrets, tokens, or passwords in SharedPreferences — it is plaintext on disk
- Use \`flutter_secure_storage\` for credentials and tokens (iOS Keychain / Android EncryptedSharedPreferences)
- Clear secure storage on user logout
- Use \`Hive\` with encryption for structured sensitive local data

### Correct
\`\`\`dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const storage = FlutterSecureStorage();

Future<void> storeAuthToken(String token) async {
  await storage.write(key: 'auth_token', value: token);
}

Future<String?> getAuthToken() async {
  return await storage.read(key: 'auth_token');
}
\`\`\`

### Anti-Pattern
\`\`\`dart
// BAD: SharedPreferences is NOT encrypted — accessible on rooted/jailbroken devices
final prefs = await SharedPreferences.getInstance();
await prefs.setString('auth_token', token); // plaintext on disk!
\`\`\`

## Network Security
- Use HTTPS for ALL network requests — no exceptions
- Do not disable ATS (App Transport Security) on iOS
- Implement certificate pinning for sensitive APIs (authentication, payments)
- Validate SSL certificates — do not ignore SSL errors in production
- Use \`dio\` or \`http\` interceptors for centralized auth header injection

## Code Security
- Do not bundle API keys in the Dart source — they are extractable from release builds
- Use \`--dart-define\` or \`.env\` files with \`envied\` package for environment-specific configuration
- Enable code obfuscation for release builds: \`flutter build apk --obfuscate --split-debug-info=./debug-info\`
- Validate all deep link URLs — malicious apps can send crafted URLs to your app
- Sanitize user input before displaying — prevent XSS in WebView contexts

## App Integrity
- Implement jailbreak/root detection for sensitive apps (banking, health)
- Use code signing for both iOS and Android release builds
- Set \`android:allowBackup="false"\` in AndroidManifest.xml to prevent data extraction
- Protect sensitive screens from screenshots with platform channels (FLAG_SECURE on Android)

## Input Validation
- Validate all form input with Flutter form validators — never trust client input alone
- Use server-side validation as the primary defense — client-side is for UX only
- Sanitize data before passing to platform channels — prevent injection on the native side
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
- Verify code obfuscation flags in release build configuration`,
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
- Review golden diffs in pull requests to catch unintended visual changes`,
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
- Replace Opacity animations with AnimatedOpacity or FadeTransition`,
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
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/setState\\s*\\(/.test(c)&&c.split(\'\\n\').length>120)console.log(\'WARNING: setState in a large widget (>120 lines). Consider extracting state management to a ViewModel or ChangeNotifier for better testability and separation of concerns.\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/SharedPreferences/.test(c)&&/(token|password|secret|credential|apiKey|api_key|auth)/i.test(c))console.log(\'HOOK_EXIT:1:SECURITY: Storing sensitive data in SharedPreferences (unencrypted). Use flutter_secure_storage for credentials and tokens.\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const m=c.match(/Widget\\s+_\\w+\\s*\\(/g);if(m&&m.length>=3)console.log(\'WARNING: \'+m.length+\' private helper methods returning widgets detected. Extract them as separate StatelessWidget classes for better performance and reusability.\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.dart\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/ListView\\s*\\(/.test(c)&&/children\\s*:/.test(c)&&/List\\.generate|map\\s*\\(/.test(c))console.log(\'WARNING: Eager ListView with children detected. Use ListView.builder for lazy construction and better performance with large lists.\')" -- "$CLAUDE_FILE_PATH"',
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
