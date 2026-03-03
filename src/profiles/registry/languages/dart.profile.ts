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

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes, enums, typedefs | UpperCamelCase | \`HttpClient\`, \`JsonParser\` |
| Libraries, packages, files | lowercase_with_underscores | \`my_package\`, \`string_utils.dart\` |
| Variables, functions, params | lowerCamelCase | \`itemCount\`, \`fetchUsers()\` |
| Constants | lowerCamelCase (NOT SCREAMING_CAPS) | \`defaultTimeout\`, \`maxRetries\` |
| Private members | leading underscore | \`_internalCache\` |
| Enum values | lowerCamelCase | \`Color.deepOrange\` |

## Documentation

- Use \`///\` doc comments for all public APIs
- Start with third-person verb: "Returns...", "Creates...", "Throws..."
- Use \`[ClassName]\`/\`[methodName]\` for cross-references
- First sentence is a concise summary visible in IDE hover

## Import Organization

- Order: \`dart:\` SDK -> \`package:\` third-party -> relative imports
- Separate groups with blank lines, sort alphabetically within each group

## Function & Method Design

- Use named parameters for 3+ params or boolean flags — mark mandatory with \`required\`
- Prefer expression bodies (\`=>\`) for single-expression functions and getters
- Use \`typedef\` for complex reused function signatures
- Side-effect functions return \`void\` or \`Future<void>\`

## Type System

- Annotate public API types explicitly; use inference for obvious locals
- Use \`Object\` instead of \`dynamic\` for catch-all with static checking
- Avoid \`dynamic\` except at serialization boundaries — cast to typed values immediately
- Use \`FutureOr<T>\` sparingly — prefer explicit \`Future<T>\` or \`T\`
`,
      },
      {
        path: 'dart/dart-null-safety-and-patterns.md',
        paths: ['**/*.dart'],
        governance: 'mandatory',
        description: 'Dart sound null safety, pattern matching, records, and sealed classes',
        content: `# Dart Null Safety & Modern Patterns

## Sound Null Safety

- Every type is non-nullable by default — append \`?\` only when null is a valid domain value
- Use \`required\` for mandatory named parameters — never rely on implicit null
- Null-aware operators: \`?.\` (access), \`??\` (coalescing), \`??=\` (assignment), \`?[]\` (index)
- Use \`late\` sparingly — only when initialization before access is guaranteed (e.g., \`initState\`)
- NEVER use null assertion (\`!\`) in production — use pattern matching or explicit null checks

## Pattern Matching (Dart 3+)

- Use switch expressions for multi-branch value computation (exhaustive, concise)
- Destructure records: \`final (name, age) = getUserInfo();\`
- Use \`if case\` for null checking + extraction in one step
- Destructure lists and maps in patterns
- Use guard clauses with ranges: \`>= 200 && < 300\`

## Records (Dart 3+)

- Use records for lightweight multi-value returns instead of one-off classes
- Use named fields for clarity: \`({String host, int port})\`
- Destructure with \`final (name, age) = ...\` or \`final (:host, :port) = ...\`

## Sealed Classes (Dart 3+)

- Use \`sealed\` for type hierarchies with compiler-enforced exhaustive matching
- Subtypes must be in the same library
- Use with switch expressions for exhaustive pattern matching

## Class Modifiers (Dart 3+)

- \`sealed\`: abstract + exhaustive subtypes (same library only)
- \`final\`: cannot be extended or implemented outside library
- \`base\`: can be extended but not implemented outside
- \`interface\`: can be implemented but not extended outside
- \`mixin class\`: usable as both class and mixin

## Extension Types (Dart 3.3+)

- Use for zero-cost type-safe wrappers (erased at runtime)
- Create distinct compile-time types from primitives: \`extension type UserId(int value)\`
- Prevents accidental mixing of semantically different values
`,
      },
      {
        path: 'dart/dart-error-handling-and-async.md',
        paths: ['**/*.dart'],
        governance: 'mandatory',
        description: 'Dart error handling patterns, async/await, streams, and concurrency',
        content: `# Dart Error Handling & Async Patterns

## Error Handling

- Define domain-specific exceptions using sealed class hierarchy implementing \`Exception\`
- Never throw raw strings (\`throw 'error'\`) — use typed exceptions
- Catch specific types with \`on TypeException catch (e)\` — add context, wrap or rethrow
- Never use empty catch blocks — always log or rethrow
- Never catch \`Error\` subclasses (programming bugs) — let them crash
- Include original exception as \`cause\` when wrapping

## Async / Await

- Prefer \`async\`/\`await\` over \`.then()\` chains for readability
- Use \`Future.wait()\` for concurrent independent async operations
- Wrap fire-and-forget futures with \`unawaited()\` + \`.catchError()\`
- Always handle Future errors — never leave Futures unhandled

## Streams

- Use \`async*\` generators with \`yield\` for creating streams
- Use stream operators (\`where\`, \`map\`, \`distinct\`, \`handleError\`) for transformations
- ALWAYS cancel stream subscriptions in \`dispose()\` — prevents memory leaks
- Never listen to single-subscription stream more than once — use \`asBroadcastStream()\` if needed
- Never block the event loop inside stream handlers

## Isolates

- Use \`Isolate.run()\` (Dart 2.19+) for CPU-heavy work
- Use Flutter's \`compute()\` for heavy JSON parsing or data processing
- Keep main isolate responsive — offload sorting, parsing, encryption
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.dart$" && command -v dart >/dev/null 2>&1 && dart format --set-exit-if-changed "$FILE_PATH" 2>/dev/null || true',
            timeout: 15,
            statusMessage: 'Checking Dart formatting with dart format',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.dart$" && grep -nE "\\bProcess\\.(run|start)\\b" "$FILE_PATH" | head -5 | grep -q "." && { echo "Warning: Process.run/start detected — verify no user-controlled input reaches the command arguments" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for Process.run/start usage',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.dart$" && grep -nE "\\bdynamic\\b" "$FILE_PATH" | grep -v "//.*dynamic" | grep -v "fromJson\\|toJson\\|decode\\|encode" | head -5 | grep -q "." && { echo "Warning: dynamic type detected outside serialization boundaries — consider using typed alternatives" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for dynamic type outside serialization',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.dart$" && grep -cE "^\\s*///" "$FILE_PATH" | grep -q "^0$" && grep -qE "^(class|enum|mixin|extension|typedef|sealed|final class|base class|interface class)\\b" "$FILE_PATH" && { echo "Warning: public type declarations found without any doc comments (///)" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for missing doc comments on public types',
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
