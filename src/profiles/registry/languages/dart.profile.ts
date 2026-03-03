import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const dartProfile: Profile = {
  id: 'languages/dart',
  name: 'Dart',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['dart'],
  contributions: {
    claudeMd: [{
      heading: 'Dart Conventions',
      order: 10,
      content: `## Dart Conventions

Effective Dart guidelines. Sound null safety, strong typing, \`dart format\` enforced.

**Detailed rules:** see \`.claude/rules/dart/\` directory.

**Key rules:**
- Sound null safety: use \`late\` sparingly, prefer null-aware operators (\`??\`, \`?.\`)
- Prefer \`final\` for local variables, \`const\` for compile-time constants
- Use named parameters for clarity, cascade notation (\`..\`) for builder-style operations
- Follow \`dart analyze\` — zero warnings before committing`,
    }],
    settings: {
      permissions: {
        allow: [
          'Bash(dart:*)',
          'Bash(dart run:*)',
          'Bash(dart test:*)',
          'Bash(dart analyze:*)',
          'Bash(dart format:*)',
          'Bash(dart compile:*)',
          'Bash(dart fix:*)',
          'Bash(dart doc:*)',
          'Bash(dart pub:*)',
          'Bash(dart create:*)',
          'Bash(pub:*)',
          'Bash(dart_test:*)',
          'Bash(build_runner:*)',
          'Bash(dart run build_runner:*)',
        ],
      },
    },
    rules: [
      {
        path: 'dart/dart-style-and-design.md',
        paths: ['**/*.dart'],
        governance: 'mandatory',
        description: 'Effective Dart style, naming, documentation, and design conventions',
        content: `# Dart Style & Design (Effective Dart)

## Why This Matters
Dart's philosophy emphasizes clarity, consistency, and safety. These rules are derived
from the official Effective Dart guides (style, documentation, usage, design) and represent
the idiomatic way to write Dart. Following them ensures tooling compatibility (\`dart format\`,
\`dart analyze\`), team consistency, and maximum benefit from Dart's type system.

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes, enums, typedefs, type params | UpperCamelCase | \`HttpClient\`, \`JsonParser\` |
| Extensions, mixins | UpperCamelCase | \`StringUtils\`, \`Loggable\` |
| Libraries, packages, directories, files | lowercase_with_underscores | \`my_package\`, \`string_utils.dart\` |
| Variables, functions, parameters | lowerCamelCase | \`itemCount\`, \`fetchUsers()\` |
| Constants | lowerCamelCase | \`defaultTimeout\`, \`maxRetries\` |
| Private members | leading underscore + lowerCamelCase | \`_internalCache\` |
| Enum values | lowerCamelCase | \`Color.deepOrange\` |

### Correct
\`\`\`dart
// Constants use lowerCamelCase, NOT SCREAMING_CAPS
const defaultTimeout = Duration(seconds: 30);
const maxRetries = 3;
const pi = 3.14159;

class HttpClient {
  final String _baseUrl;
  final int maxConnections;

  const HttpClient({required String baseUrl, this.maxConnections = 10})
      : _baseUrl = baseUrl;

  bool get isConnected => _socket != null;
}
\`\`\`

### Anti-Pattern
\`\`\`dart
// Bad: wrong casing, abbreviations, Java-style naming
const MAX_RETRIES = 3; // SCREAMING_CAPS is not Dart style
const DEFAULT_TIMEOUT = Duration(seconds: 30);

class HTTPClnt { // abbreviation, not UpperCamelCase
  String Base_URL; // PascalCase field, snake_case
  bool getIsConnected() => _socket != null; // Java-style getter
}
\`\`\`

---

## Documentation (Effective Dart: Documentation)

### Rules
- Use \`///\` (doc comments) for all public APIs — classes, methods, fields, top-level functions
- First sentence is a concise summary (shows in IDE hover and dart doc)
- Start doc comments with a third-person verb: "Returns...", "Creates...", "Throws..."
- Use \`[ClassName]\` or \`[methodName]\` for cross-references in doc comments
- Use markdown in doc comments for formatting, lists, and code blocks
- Do not use \`/* */\` block comments for API documentation

### Correct
\`\`\`dart
/// Returns the user with the given [id].
///
/// Throws [UserNotFoundException] if no user exists with that ID.
/// Returns \`null\` if the user has been soft-deleted.
///
/// \`\`\`dart
/// final user = await repository.findById(42);
/// print(user?.name);
/// \`\`\`
Future<User?> findById(int id) async {
  // ...
}
\`\`\`

### Anti-Pattern
\`\`\`dart
// Bad: no doc comment on public API, restates the obvious
// Get user by id
User? findById(int id) { // no doc comment, just a regular comment
  // ...
}
\`\`\`

---

## Import Organization

### Order
1. \`dart:\` SDK libraries
2. \`package:\` third-party and project packages
3. Relative imports (for files in the same package)

Separate each group with a blank line. Sort alphabetically within each group.

### Correct
\`\`\`dart
import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:riverpod/riverpod.dart';

import '../models/user.dart';
import 'auth_service.dart';
\`\`\`

### Anti-Pattern
\`\`\`dart
// Bad: no grouping, no sorting, wildcard show
import '../models/user.dart';
import 'dart:convert';
import 'package:http/http.dart';
import 'dart:async';
import 'auth_service.dart';
import 'package:riverpod/riverpod.dart';
\`\`\`

---

## Function & Method Design

- Use named parameters for functions with more than two parameters or boolean flags
- Mark required named parameters with \`required\`
- Prefer expression bodies (\`=>\`) for single-expression functions and getters
- Use \`typedef\` for complex function signatures that are reused
- Functions that produce side effects should return \`void\` or \`Future<void>\`

### Correct
\`\`\`dart
/// Creates a new user with the given details.
Future<User> createUser({
  required String name,
  required String email,
  int? age,
  bool isAdmin = false,
}) async {
  // ...
}

// Expression body for simple getter
double get area => width * height;

// Typedef for reused callback signature
typedef JsonDecoder<T> = T Function(Map<String, dynamic> json);
\`\`\`

### Anti-Pattern
\`\`\`dart
// Bad: positional booleans are confusing at the call site
Future<User> createUser(String name, String email, int? age, bool isAdmin) async {
  // createUser('John', 'j@x.com', null, true) — what is true?
}
\`\`\`

---

## Type System Best Practices

- Annotate public API return types and parameter types explicitly
- Use type inference for local variables when the type is obvious from the right-hand side
- Use \`Object\` instead of \`dynamic\` when you need a catch-all type with static checking
- Avoid \`dynamic\` except at serialization boundaries (JSON decoding) — always cast promptly
- Use \`FutureOr<T>\` sparingly — prefer explicit \`Future<T>\` or \`T\`

### Correct
\`\`\`dart
// Public API: explicit types
List<User> getActiveUsers(List<User> users) {
  // Local: type inference is fine when obvious
  final filtered = users.where((u) => u.isActive).toList();
  return filtered;
}

// Narrow dynamic immediately at boundaries
User fromJson(Map<String, dynamic> json) {
  final name = json['name'] as String;
  final age = json['age'] as int;
  return User(name: name, age: age);
}
\`\`\`

### Anti-Pattern
\`\`\`dart
// Bad: dynamic leaking throughout code
dynamic fetchData() async {
  final dynamic response = await http.get(uri);
  return response.body; // no type safety downstream
}
\`\`\`
`,
      },
      {
        path: 'dart/dart-null-safety-and-patterns.md',
        paths: ['**/*.dart'],
        governance: 'mandatory',
        description: 'Dart sound null safety, pattern matching, records, and sealed classes',
        content: `# Dart Null Safety & Modern Patterns

## Why This Matters
Sound null safety eliminates null reference errors at compile time. Dart 3's pattern
matching, records, and sealed classes enable expressive, type-safe code that the compiler
can verify exhaustively. Mastering these features is essential for writing correct,
maintainable Dart.

---

## Sound Null Safety

### Core Principles
- Every type is non-nullable by default (\`String\`, \`int\`, \`List<User>\`)
- Append \`?\` only when null is a valid domain value (\`String?\`, \`User?\`)
- The type system enforces null checks — no null dereference at runtime

### required Keyword
Use \`required\` for mandatory named parameters. Never rely on implicit null for "required" semantics.

\`\`\`dart
// Correct: required for mandatory named params
class ApiClient {
  final String baseUrl;
  final Duration timeout;

  const ApiClient({required this.baseUrl, this.timeout = const Duration(seconds: 30)});
}

// Anti-pattern: nullable param as "required" by convention
class ApiClient {
  final String? baseUrl; // caller might forget, gets null at runtime
  ApiClient({this.baseUrl});
}
\`\`\`

### Null-Aware Operators
\`\`\`dart
// Null-aware access
final length = name?.length;

// Null coalescing with default
final displayName = user.nickname ?? user.email;

// Null-aware assignment
cache ??= await loadCache();

// Null-aware index
final first = list?[0];

// Null-aware cascade
button
  ?..text = 'Click me'
  ..onPressed = handleClick;
\`\`\`

### When to Use late
Only use \`late\` when:
1. The field is definitely initialized before any access (e.g., in \`initState\`)
2. Lazy initialization provides a meaningful performance benefit
3. There is no cleaner alternative (nullable + null check, constructor init)

\`\`\`dart
// Acceptable: guaranteed init before access in framework lifecycle
class _MyWidgetState extends State<MyWidget> {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
  }
}

// Anti-pattern: late with no guarantee of initialization order
class Service {
  late Database db; // who initializes this? when? race condition?
  Future<void> query() async => db.execute('SELECT 1');
}
\`\`\`

### Avoid Null Assertion (!)
Use \`!\` only in tests or when the type system cannot prove non-nullability and you have
an ironclad invariant. Prefer pattern matching or explicit null checks.

\`\`\`dart
// Anti-pattern: blind null assertion
final user = users.firstWhereOrNull((u) => u.id == id)!; // throws at runtime

// Correct: explicit null handling
final user = users.firstWhereOrNull((u) => u.id == id);
if (user == null) {
  throw UserNotFoundException(id);
}
\`\`\`

---

## Pattern Matching (Dart 3+)

### Switch Expressions
Use switch expressions for multi-branch value computation. They are exhaustive and concise.

\`\`\`dart
// Correct: switch expression
String describeStatus(HttpStatus status) => switch (status) {
  HttpStatus.ok => 'Success',
  HttpStatus.notFound => 'Not found',
  HttpStatus.unauthorized => 'Unauthorized',
  HttpStatus.serverError => 'Server error',
};

// Anti-pattern: verbose switch statement for value computation
String describeStatus(HttpStatus status) {
  switch (status) {
    case HttpStatus.ok:
      return 'Success';
    case HttpStatus.notFound:
      return 'Not found';
    // easy to forget a case with no exhaustiveness check
    default:
      return 'Unknown';
  }
}
\`\`\`

### Destructuring Patterns
\`\`\`dart
// Destructure records
final (name, age) = getUserInfo();

// Destructure in if-case for null checking + extraction
if (response case Response(data: final data, statusCode: 200)) {
  processData(data);
}

// Destructure lists
final [first, second, ...rest] = items;

// Destructure maps
final {'name': String name, 'age': int age} = json;
\`\`\`

### Guard Clauses in Patterns
\`\`\`dart
final message = switch (statusCode) {
  >= 200 && < 300 => 'Success',
  == 401 => 'Unauthorized',
  == 404 => 'Not found',
  >= 500 && < 600 => 'Server error',
  _ => 'Unknown status: \$statusCode',
};
\`\`\`

---

## Records (Dart 3+)

Use records for lightweight multi-value returns instead of creating one-off classes or
returning \`Map<String, dynamic>\`.

\`\`\`dart
// Correct: record for multi-value return
(String name, int age) parseUserHeader(String header) {
  final parts = header.split(':');
  return (parts[0].trim(), int.parse(parts[1].trim()));
}

// Named fields for clarity
({String host, int port}) parseAddress(String address) {
  final parts = address.split(':');
  return (host: parts[0], port: int.parse(parts[1]));
}

// Usage with destructuring
final (name, age) = parseUserHeader('Alice:30');
final (:host, :port) = parseAddress('localhost:8080');
\`\`\`

---

## Sealed Classes (Dart 3+)

Use sealed classes to model type hierarchies where the compiler enforces exhaustive matching.

\`\`\`dart
// Correct: sealed class for result type
sealed class Result<T> {
  const Result();
}

final class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

final class Failure<T> extends Result<T> {
  final String message;
  final Object? error;
  const Failure(this.message, [this.error]);
}

// Exhaustive switch — compiler error if a subtype is missing
String describe<T>(Result<T> result) => switch (result) {
  Success(:final value) => 'Got: \$value',
  Failure(:final message) => 'Failed: \$message',
};
\`\`\`

### Class Modifiers (Dart 3+)
- \`sealed\`: abstract + exhaustive subtypes (only in same library)
- \`final\`: cannot be extended or implemented outside the library
- \`base\`: can be extended but not implemented outside the library
- \`interface\`: can be implemented but not extended outside the library
- \`mixin class\`: can be used as both a class and a mixin

\`\`\`dart
// Express intent with modifiers
final class AppConfig {
  final String apiUrl;
  final int maxRetries;
  const AppConfig({required this.apiUrl, this.maxRetries = 3});
}

// Marker: this class is designed for implementation, not extension
interface class Repository<T> {
  Future<T?> findById(int id);
  Future<List<T>> findAll();
  Future<void> save(T entity);
}
\`\`\`

---

## Extension Types (Dart 3.3+)

Use extension types for zero-cost type-safe wrappers — they are erased at runtime.

\`\`\`dart
// Type safety without runtime overhead
extension type UserId(int value) {
  bool get isValid => value > 0;
}

extension type Email(String value) {
  bool get isValid => value.contains('@');
}

// Now UserId and Email are distinct types at compile time
Future<User?> findUser(UserId id) async {
  // id.value gives the underlying int
}

// Prevents accidental mixing:
// findUser(Email('a@b.com')); // Compile error!
\`\`\`
`,
      },
      {
        path: 'dart/dart-error-handling-and-async.md',
        paths: ['**/*.dart'],
        governance: 'mandatory',
        description: 'Dart error handling patterns, async/await, streams, and concurrency',
        content: `# Dart Error Handling & Async Patterns

## Why This Matters
Robust error handling and correct async patterns prevent silent failures,
resource leaks, and race conditions. Dart's async model is built on Futures
and Streams — using them idiomatically ensures responsive, reliable applications.

---

## Error Handling

### Custom Exception Hierarchy
Define domain-specific exceptions. Never throw raw strings or generic \`Exception\`.

\`\`\`dart
// Correct: typed exception hierarchy
sealed class AppException implements Exception {
  final String message;
  final Object? cause;
  const AppException(this.message, [this.cause]);

  @override
  String toString() => '\$runtimeType: \$message';
}

final class NetworkException extends AppException {
  final int? statusCode;
  const NetworkException(super.message, {this.statusCode, super.cause});
}

final class ValidationException extends AppException {
  final Map<String, String> fieldErrors;
  const ValidationException(super.message, {this.fieldErrors = const {}});
}

final class NotFoundException extends AppException {
  final String resourceType;
  final Object resourceId;
  const NotFoundException(this.resourceType, this.resourceId)
      : super('Not found');

  @override
  String toString() => 'NotFoundException: \$resourceType #\$resourceId not found';
}
\`\`\`

### Catch Specific Types
\`\`\`dart
// Correct: catch specific, add context, rethrow or wrap
Future<User> getUser(int id) async {
  try {
    final response = await _client.get('/users/\$id');
    return User.fromJson(response.data);
  } on SocketException catch (e) {
    throw NetworkException('Failed to reach user service', cause: e);
  } on FormatException catch (e) {
    throw AppException('Invalid user data format', e);
  }
}

// Anti-pattern: catch-all that swallows context
Future<User?> getUser(int id) async {
  try {
    return await _client.get('/users/\$id').then(User.fromJson);
  } catch (e) {
    print(e); // swallowed, no rethrow, returns null silently
    return null;
  }
}
\`\`\`

### Error Anti-Patterns
- Never use empty \`catch\` blocks — always log or rethrow
- Never catch \`Error\` (programming bugs like \`RangeError\`, \`TypeError\`) — let them crash
- Never throw strings: \`throw 'something went wrong'\` — use typed exceptions
- Never use \`rethrow\` after modifying the exception — create a new one with the original as \`cause\`

---

## Async / Await

### Prefer async/await Over .then() Chains
\`\`\`dart
// Correct: readable, sequential async
Future<UserProfile> loadProfile(int userId) async {
  final user = await userRepo.findById(userId);
  if (user == null) throw NotFoundException('User', userId);
  final avatar = await assetService.getAvatar(user.avatarId);
  return UserProfile(user: user, avatar: avatar);
}

// Anti-pattern: nested .then() chains
Future<UserProfile> loadProfile(int userId) {
  return userRepo.findById(userId).then((user) {
    if (user == null) throw NotFoundException('User', userId);
    return assetService.getAvatar(user.avatarId).then((avatar) {
      return UserProfile(user: user, avatar: avatar);
    });
  });
}
\`\`\`

### Concurrent Futures with Future.wait
\`\`\`dart
// Correct: independent operations run concurrently
Future<Dashboard> loadDashboard(int userId) async {
  final results = await Future.wait([
    userRepo.findById(userId),
    orderRepo.getRecentOrders(userId),
    notificationService.getUnread(userId),
  ]);

  return Dashboard(
    user: results[0] as User,
    orders: results[1] as List<Order>,
    notifications: results[2] as List<Notification>,
  );
}
\`\`\`

### Async Error Handling
\`\`\`dart
// Always handle Future errors
Future<void> syncData() async {
  try {
    await remoteRepo.fetchAll();
  } on NetworkException catch (e) {
    logger.warning('Sync failed, using cached data: \${e.message}');
    await localRepo.loadCachedData();
  }
}

// For fire-and-forget: use unawaited() with .catchError()
import 'dart:async';
unawaited(
  analytics.trackEvent('page_view').catchError(
    (e) => logger.warning('Analytics failed: \$e'),
  ),
);
\`\`\`

---

## Streams

### When to Use Streams
- Event sequences (user interactions, WebSocket messages, sensor data)
- Reactive state management
- Processing large data sets incrementally

\`\`\`dart
// Creating a stream from an async generator
Stream<int> countDown(int from) async* {
  for (var i = from; i >= 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;
  }
}

// Transforming streams with operators
Stream<User> getActiveUsers(Stream<User> users) {
  return users
      .where((user) => user.isActive)
      .distinct()
      .handleError((e) => logger.error('Stream error: \$e'));
}

// Always cancel stream subscriptions to prevent memory leaks
late final StreamSubscription<int> _subscription;

void startListening() {
  _subscription = eventStream.listen(
    (event) => handleEvent(event),
    onError: (error) => handleError(error),
    onDone: () => handleDone(),
  );
}

void dispose() {
  _subscription.cancel(); // CRITICAL: prevent memory leak
}
\`\`\`

### Stream Anti-Patterns
- Never listen to a single-subscription stream more than once — use \`asBroadcastStream()\` if needed
- Never forget to cancel subscriptions — always cancel in \`dispose()\` or equivalent lifecycle method
- Never block the event loop with synchronous computation inside stream handlers

---

## Isolates (Heavy Computation)

Use isolates for CPU-heavy work to keep the main isolate responsive.

\`\`\`dart
import 'dart:isolate';

// Dart 2.19+: simple compute with Isolate.run
Future<List<int>> sortLargeList(List<int> data) async {
  return await Isolate.run(() {
    data.sort();
    return data;
  });
}

// For Flutter, use compute() from foundation
import 'package:flutter/foundation.dart';

Future<ParsedData> parseHeavyJson(String json) async {
  return await compute(_parseJson, json);
}

ParsedData _parseJson(String json) {
  // This runs in a separate isolate
  return ParsedData.fromJson(jsonDecode(json));
}
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Dart-Specific Review Checklist

### Null Safety & Types
- [ ] No unnecessary nullable types — prefer non-nullable with defaults
- [ ] No unguarded null assertion (\`!\`) in production code — use pattern matching or null checks
- [ ] No \`late\` fields without guaranteed initialization before access
- [ ] No \`dynamic\` leaking beyond serialization boundaries — cast to typed values immediately
- [ ] \`required\` keyword used for all mandatory named parameters
- [ ] Public APIs have explicit type annotations; local variables use type inference

### Effective Dart Style
- [ ] Constants use \`lowerCamelCase\`, not \`SCREAMING_CAPS\`
- [ ] Naming follows Effective Dart: UpperCamelCase types, lowerCamelCase members
- [ ] Imports ordered correctly: \`dart:\`, \`package:\`, relative — with blank line separators
- [ ] Relative imports used for same-package files, \`package:\` for cross-package
- [ ] \`const\` constructors used wherever possible
- [ ] Expression bodies (\`=>\`) used for single-expression functions and getters

### Documentation
- [ ] All public APIs have \`///\` doc comments with summary sentence
- [ ] Doc comments start with third-person verb: "Returns...", "Creates...", "Throws..."
- [ ] Cross-references use \`[ClassName]\` / \`[methodName]\` syntax

### Modern Dart (3.0+)
- [ ] \`sealed\` classes used for exhaustive type hierarchies
- [ ] Switch expressions used instead of switch statements for value computation
- [ ] Records used for multi-value returns instead of ad-hoc classes or tuples
- [ ] Class modifiers (\`final\`, \`sealed\`, \`base\`, \`interface\`) express design intent
- [ ] Pattern matching used for destructuring and type narrowing

### Async
- [ ] \`async\`/\`await\` used instead of \`.then()\` chains
- [ ] All stream subscriptions are cancelled in \`dispose()\` or equivalent
- [ ] \`Future.wait()\` used for concurrent independent async operations
- [ ] Fire-and-forget futures wrapped with \`unawaited()\` + \`.catchError()\`
- [ ] No synchronous blocking in async contexts

### Error Handling
- [ ] Typed exceptions used — never throw raw strings
- [ ] Specific exception types caught — no bare \`catch (e)\` without rethrow
- [ ] \`Error\` subclasses (programming bugs) are not caught — let them crash
- [ ] No empty catch blocks — always log or rethrow with context`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['dart-tooling'],
        prompt: `## Dart Testing

### Test Framework
- Use \`package:test\` for pure Dart unit and integration tests
- Use \`package:flutter_test\` for widget tests and Flutter-specific assertions
- Use \`package:mockito\` with \`@GenerateMocks\` for type-safe mock generation
- Run code generation before tests: \`dart run build_runner build\`

### Test Structure
- Group related tests with \`group()\` for logical organization
- Use \`setUp()\` / \`tearDown()\` for test fixtures and cleanup
- Use \`setUpAll()\` / \`tearDownAll()\` for expensive one-time initialization
- Name tests descriptively: \`test('findById returns null when user does not exist')\`

### Async Testing
- Use \`expectLater\` with stream matchers for testing Streams
- Use \`emitsInOrder\`, \`emitsError\`, \`emitsDone\` for stream assertions
- Use \`fakeAsync\` and \`TestWidgetsFlutterBinding\` for time-dependent tests
- Use \`completes\` and \`throwsA\` matchers for Future assertions

### Coverage Targets
- Test happy path, edge cases (empty input, null, boundary values), and error paths
- Test async error scenarios: network failures, timeouts, invalid responses
- Test stream lifecycle: subscribe, emit, error, done, cancel
- Test sealed class exhaustiveness in switch expressions

### Example
\`\`\`dart
import 'package:test/test.dart';

void main() {
  group('UserRepository', () {
    late UserRepository repository;
    late MockDatabase mockDb;

    setUp(() {
      mockDb = MockDatabase();
      repository = UserRepository(mockDb);
    });

    test('findById returns user when found', () async {
      when(mockDb.query(any)).thenAnswer((_) async => userRow);

      final user = await repository.findById(1);

      expect(user, isNotNull);
      expect(user!.name, equals('Alice'));
      verify(mockDb.query(any)).called(1);
    });

    test('findById returns null when not found', () async {
      when(mockDb.query(any)).thenAnswer((_) async => null);

      final user = await repository.findById(999);

      expect(user, isNull);
    });

    test('findById throws NetworkException on connection failure', () async {
      when(mockDb.query(any)).thenThrow(SocketException('Connection refused'));

      expect(
        () => repository.findById(1),
        throwsA(isA<NetworkException>()),
      );
    });
  });
}
\`\`\``,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Dart-Specific Security Review

### Input Validation
- [ ] All external input (API responses, user input, file content) validated before use
- [ ] JSON decoded with proper type casts — no raw \`dynamic\` passed downstream
- [ ] URL and path inputs sanitized — no path traversal (\`../\`) or open redirects
- [ ] Integer overflow checked for sizes from untrusted sources

### Serialization Safety
- [ ] No \`dart:mirrors\` in production — it breaks tree-shaking and exposes internals
- [ ] JSON deserialization uses typed factories (\`fromJson\`), not dynamic access chains
- [ ] Protobuf, MessagePack, or similar used for binary protocols instead of custom formats

### Dart-Specific Vulnerabilities
- [ ] No string interpolation in SQL queries — use parameterized queries
- [ ] No \`Process.run\` or \`Process.start\` with user-controlled arguments without sanitization
- [ ] \`dart:io\` HttpClient redirects limited to prevent SSRF
- [ ] WebSocket connections validate origin headers
- [ ] Isolate communication uses typed ports — no arbitrary object passing

### Dependency Security
- [ ] \`pubspec.lock\` committed to version control for applications (not for packages)
- [ ] Dependencies use version constraints (\`^1.2.3\`), not unconstrained
- [ ] Run \`dart pub audit\` (if available) or review advisories regularly
- [ ] Minimize dependencies — prefer \`dart:core\` and \`dart:convert\` over trivial packages

### Secrets & Configuration
- [ ] No API keys, tokens, or passwords in source code or pubspec.yaml
- [ ] Environment variables or secure storage used for secrets
- [ ] \`.env\` files excluded from version control via \`.gitignore\``,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['dart-tooling'],
        prompt: `## Dart-Specific Refactoring Patterns

### Null Safety Modernization
- Convert nullable fields to non-nullable with \`required\` keyword where appropriate
- Replace \`!\` assertions with pattern matching (\`if case\`, \`switch\`) or explicit null checks
- Replace \`late\` fields with constructor initialization or nullable + null check
- Remove redundant null checks that the type system already guarantees

### Dart 3 Migration
- Replace switch statements with switch expressions for value computation
- Introduce sealed classes for type hierarchies that need exhaustive matching
- Replace positional Tuple classes (e.g., \`Tuple2\`) with records
- Use destructuring patterns instead of manual field access
- Add class modifiers (\`final\`, \`sealed\`, \`base\`, \`interface\`) to express design intent
- Replace manual type wrappers with extension types for zero-cost abstraction

### Code Quality
- Replace \`.then()\` chains with \`async\`/\`await\`
- Replace \`SCREAMING_CAPS\` constants with \`lowerCamelCase\`
- Extract complex collection building into extension methods
- Convert verbose constructors to const where all fields are final
- Replace stringly-typed enums with proper \`enum\` declarations
- Use cascade notation (\`..\`) for multiple operations on the same object
- Replace imperative loop-and-accumulate with collection if/for or method chains`,
      },
    ],
    skills: [
      {
        name: 'dart-tooling',
        description: 'Dart CLI commands, pub workflows, analysis, and project management',
        content: `# Dart Tooling Skill

## Build & Run
- \`dart run\` — run the main entry point
- \`dart run bin/server.dart\` — run a specific file
- \`dart compile exe bin/server.dart -o server\` — compile to native executable
- \`dart compile js web/main.dart -o main.js\` — compile to JavaScript
- \`dart compile kernel lib/main.dart\` — compile to kernel snapshot for fast startup

## Analysis & Formatting
- \`dart analyze\` — run static analysis (lints, errors, warnings)
- \`dart analyze --fatal-infos\` — treat info-level diagnostics as errors
- \`dart format .\` — format all Dart files in current directory
- \`dart format --set-exit-if-changed .\` — check formatting in CI (non-zero exit on changes)
- \`dart fix --apply\` — apply all automated fixes suggested by the analyzer

## Testing
- \`dart test\` — run all tests
- \`dart test test/unit/\` — run tests in a specific directory
- \`dart test --name "findById"\` — run tests matching a name pattern
- \`dart test --coverage=coverage\` — generate coverage data
- \`dart test --reporter expanded\` — verbose test output
- \`dart test --concurrency=4\` — run tests with parallelism

## Package Management (pub)
- \`dart pub get\` — install dependencies from pubspec.yaml
- \`dart pub add http\` — add a dependency
- \`dart pub add --dev mockito build_runner\` — add dev dependencies
- \`dart pub upgrade\` — upgrade dependencies within constraints
- \`dart pub outdated\` — check for newer versions
- \`dart pub deps\` — show dependency tree
- \`dart pub publish --dry-run\` — validate package before publishing
- \`dart pub cache clean\` — clear the pub cache

## Code Generation
- \`dart run build_runner build\` — one-time code generation (json_serializable, mockito, freezed)
- \`dart run build_runner watch\` — watch mode for continuous code generation
- \`dart run build_runner build --delete-conflicting-outputs\` — clean rebuild

## Documentation
- \`dart doc .\` — generate API documentation
- \`dart doc . --validate-links\` — check for broken links in documentation

## Project Creation
- \`dart create my_project\` — create a new Dart project (console template)
- \`dart create -t web my_web_app\` — create from a specific template
- Templates: \`console\`, \`package\`, \`server-shelf\`, \`web\`
`,
      },
      {
        name: 'dart-debug',
        description: 'Dart debugging workflows: Observatory, DevTools, logging, profiling',
        content: `# Dart Debug & Diagnostics Skill

## Dart DevTools
- Launch with \`dart devtools\` or from IDE integration
- Features: CPU profiler, memory profiler, network inspector, logging viewer
- Connect to running VM: \`dart run --observe\` then open the Observatory URL

## Debug Logging
\`\`\`dart
import 'dart:developer';

// Use dart:developer log for structured logging
log(
  'User login failed',
  name: 'auth.service',
  level: 900, // WARNING level
  error: exception,
  stackTrace: stackTrace,
);

// Timeline events for performance analysis
Timeline.startSync('parseConfig');
try {
  // ... expensive operation
} finally {
  Timeline.finishSync();
}
\`\`\`

## Assertions (Debug Mode Only)
\`\`\`dart
// Assertions are stripped in release builds — use for invariants
assert(count >= 0, 'Count must be non-negative, got: \$count');

// Use assert with message in constructors
class Pagination {
  final int page;
  final int pageSize;

  Pagination({required this.page, required this.pageSize})
      : assert(page >= 0, 'page must be non-negative'),
        assert(pageSize > 0 && pageSize <= 100, 'pageSize must be 1-100');
}
\`\`\`

## Stack Traces
\`\`\`dart
// Capture current stack trace
final trace = StackTrace.current;

// Preserve stack trace when rethrowing
try {
  await riskyOperation();
} catch (e, stackTrace) {
  logger.error('Operation failed', error: e, stackTrace: stackTrace);
  rethrow; // preserves original stack trace
}
\`\`\`

## Profiling in Release Mode
- Compile with \`--profile\` flag for profiling without full debug overhead
- Use \`dart compile exe --verbosity=all\` to see compilation details
- For Flutter: \`flutter run --profile\` enables Observatory without debug mode overhead

## Common Debug Patterns
\`\`\`dart
// Conditional debug printing (stripped in release)
void debugLog(String message) {
  assert(() {
    print('[DEBUG] \$message');
    return true;
  }());
}

// Type-checking in debug mode
assert(result is Map<String, dynamic>, 'Expected Map, got \${result.runtimeType}');
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.dart$" && command -v dart >/dev/null 2>&1 && dart format --set-exit-if-changed "$CLAUDE_FILE_PATH" 2>/dev/null || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.dart$" && grep -nE "\\bProcess\\.(run|start)\\b" "$CLAUDE_FILE_PATH" | head -5 | grep -q "." && echo "HOOK_EXIT:0:Warning: Process.run/start detected — verify no user-controlled input reaches the command arguments" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.dart$" && grep -nE "\\bdynamic\\b" "$CLAUDE_FILE_PATH" | grep -v "//.*dynamic" | grep -v "fromJson\\|toJson\\|decode\\|encode" | head -5 | grep -q "." && echo "HOOK_EXIT:0:Warning: dynamic type detected outside serialization boundaries — consider using typed alternatives" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.dart$" && grep -cE "^\\s*///" "$CLAUDE_FILE_PATH" | grep -q "^0$" && grep -qE "^(class|enum|mixin|extension|typedef|sealed|final class|base class|interface class)\\b" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:0:Warning: public type declarations found without any doc comments (///)" || true',
            timeout: 10,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'dart-analysis',
        filePath: 'analysis_options.yaml',
        config: {
          include: 'package:lints/recommended.yaml',
          analyzer: {
            'language': {
              'strict-casts': true,
              'strict-inference': true,
              'strict-raw-types': true,
            },
            'errors': {
              'missing_return': 'error',
              'missing_required_param': 'error',
              'dead_code': 'warning',
            },
            'exclude': [
              '**.g.dart',
              '**.freezed.dart',
              'build/**',
            ],
          },
          linter: {
            rules: {
              // Effective Dart: Style
              prefer_single_quotes: true,
              prefer_const_constructors: true,
              prefer_const_declarations: true,
              prefer_final_fields: true,
              prefer_final_locals: true,
              prefer_final_in_for_each: true,
              sort_child_properties_last: true,
              use_super_parameters: true,
              // Effective Dart: Usage
              avoid_print: true,
              avoid_relative_lib_imports: true,
              prefer_relative_imports: true,
              avoid_unnecessary_containers: true,
              prefer_is_empty: true,
              prefer_is_not_empty: true,
              unnecessary_late: true,
              unnecessary_null_checks: true,
              unnecessary_nullable_for_final_variable_declarations: true,
              // Effective Dart: Design
              avoid_catching_errors: true,
              avoid_dynamic_calls: true,
              prefer_asserts_with_message: true,
              prefer_expression_function_bodies: true,
              use_enums: true,
              // Documentation
              public_member_api_docs: true,
              // Safety
              always_declare_return_types: true,
              annotate_overrides: true,
              type_annotate_public_apis: true,
              avoid_void_async: true,
              cancel_subscriptions: true,
              close_sinks: true,
              unawaited_futures: true,
            },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
