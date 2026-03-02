import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const typescriptProfile: Profile = {
  id: 'languages/typescript',
  name: 'TypeScript',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['typescript'],
  contributions: {
    claudeMd: [
      {
        heading: 'TypeScript Conventions',
        order: 10,
        content: `## TypeScript Conventions

### Type Safety
- Enable \`"strict": true\` in tsconfig.json — this activates noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis, alwaysStrict, and useUnknownInCatchVariables
- Enable \`noUncheckedIndexedAccess\` for safer array/object indexed access
- Use \`unknown\` instead of \`any\` — explicitly narrow with type guards, \`typeof\`, \`instanceof\`, or discriminated unions
- Use \`satisfies\` operator to validate types while preserving narrower inferred types
- Use \`as const\` assertions for literal types and immutable data structures
- Use branded/opaque types for domain-specific IDs and validated values (e.g., \`UserId\`, \`Email\`, \`PositiveInt\`)
- Prefer \`interface\` for object shapes (extendable, better error messages); use \`type\` for unions, intersections, mapped types, and conditional types
- Use \`readonly\` on properties and arrays/tuples when mutation is not needed
- Use \`NoInfer<T>\` (TS 5.4+) to control type inference in generic functions

### Imports and Exports
- Use \`import type { Foo }\` or \`import { type Foo }\` for type-only imports — reduces runtime bundle and clarifies intent
- Group imports: (1) node built-ins, (2) external packages, (3) internal modules, (4) type-only imports
- Prefer named exports over default exports — enables consistent imports across codebase
- Use ESM (\`import\`/\`export\`) — never use \`require()\` in TypeScript

### Patterns
- Use discriminated unions for state machines, variant types, and API responses — always handle exhaustively with \`switch\` + \`never\` default
- Prefer \`const\` arrays with \`as const\` over \`enum\` — unions of string literals are tree-shakeable, structurally typed, and bundle-friendly
- Use template literal types for string manipulation at the type level
- Use \`Record<K, V>\` for index signatures, \`Map<K, V>\` for dynamic key collections
- Use utility types: \`Partial<T>\`, \`Required<T>\`, \`Readonly<T>\`, \`Pick<T, K>\`, \`Omit<T, K>\`, \`ReturnType<F>\`, \`Awaited<T>\`, \`Parameters<F>\`
- Use explicit return types on exported/public functions — private/local functions may rely on inference
- Prefer nullish coalescing (\`??\`) over logical OR (\`||\`) for default values — avoids false-positive on \`0\`, \`""\`, \`false\`
- Prefer optional chaining (\`?.\`) over manual null checks

### Error Handling
- Use typed error classes extending \`Error\` with meaningful \`message\` and \`cause\`
- In catch blocks, treat the caught value as \`unknown\` (enabled by \`useUnknownInCatchVariables\`) and narrow before accessing properties
- Use Result/Either patterns for expected, recoverable failures in library code
- Never silently swallow errors — always log or rethrow with context`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx tsc:*)',
          'Bash(npx tsx:*)',
          'Bash(npx ts-node:*)',
          'Bash(npx tsc --noEmit:*)',
        ],
      },
    },
    rules: [
      {
        path: 'typescript/conventions.md',
        governance: 'mandatory',
        description: 'TypeScript coding conventions and type safety rules',
        content: `# TypeScript Conventions

## Why This Matters
TypeScript's type system prevents bugs at compile time, but only when used correctly.
These rules ensure maximum type safety, readability, and maintainability following
the TypeScript Handbook, Google TypeScript Style Guide, and community best practices.

---

## Type Safety Rules

### Never use \`any\` — use \`unknown\` and narrow
\`any\` disables all type checking and defeats the purpose of TypeScript. Use \`unknown\`
and narrow explicitly.

#### Correct
\`\`\`typescript
function parseJson(raw: string): unknown {
  return JSON.parse(raw);
}

function processPayload(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data as { name: string }).name;
  }
  throw new TypeError('Expected object with name property');
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: any disables all type checking — bugs slip through silently
function parseJson(raw: string): any {
  return JSON.parse(raw);
}

function processPayload(data: any): string {
  return data.name; // No error at compile time, crashes at runtime if name is missing
}
\`\`\`

---

### Use discriminated unions for state — not boolean flags or string literals
Discriminated unions make states explicit, exhaustive checking enforced by the compiler.

#### Correct
\`\`\`typescript
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState<T>(state: RequestState<T>): string {
  switch (state.status) {
    case 'idle': return 'Waiting...';
    case 'loading': return 'Loading...';
    case 'success': return \`Got: \${String(state.data)}\`;
    case 'error': return \`Error: \${state.error.message}\`;
    default: {
      const _exhaustive: never = state;
      return _exhaustive; // Compile error if a case is missing
    }
  }
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: boolean flags create impossible states (isLoading AND isError both true)
interface RequestState<T> {
  isLoading: boolean;
  isError: boolean;
  data: T | null;
  error: Error | null;
}
\`\`\`

---

### Use \`satisfies\` for type-safe assignments that preserve inference

#### Correct
\`\`\`typescript
type Route = { path: string; auth: boolean };
type Routes = Record<string, Route>;

const routes = {
  home: { path: '/', auth: false },
  dashboard: { path: '/dashboard', auth: true },
} satisfies Routes;

// routes.home.path is inferred as '/' (literal), not string
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: type annotation widens the type — loses literal inference
const routes: Routes = {
  home: { path: '/', auth: false },
  dashboard: { path: '/dashboard', auth: true },
};
// routes.home.path is now string, not '/'
\`\`\`

---

### Use \`as const\` and const arrays instead of enum

#### Correct
\`\`\`typescript
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number]; // 'admin' | 'editor' | 'viewer'

function hasRole(role: Role): boolean {
  return ROLES.includes(role);
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: enum generates runtime code, is nominally typed, and has quirks
// (numeric enums have reverse mappings, string enums don't)
enum Role {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}
\`\`\`

---

## Import Rules

### Use type-only imports for types

#### Correct
\`\`\`typescript
import type { User, UserRole } from './types.js';
import { createUser, deleteUser } from './user-service.js';
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: importing types as values — may generate unnecessary runtime imports
import { User, UserRole, createUser, deleteUser } from './user-service.js';
\`\`\`

---

### Prefer named exports

#### Correct
\`\`\`typescript
// user-service.ts
export function createUser(name: string): User { /* ... */ }
export function deleteUser(id: UserId): void { /* ... */ }
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: default export — inconsistent import names across codebase
export default function createUser(name: string): User { /* ... */ }
// Imported as: import createUser from './user-service.js'
// Or: import makeUser from './user-service.js' — nothing prevents renaming
\`\`\`

---

## Error Handling

### Type-safe catch blocks with \`unknown\`

#### Correct
\`\`\`typescript
try {
  await fetchData(url);
} catch (err: unknown) {
  if (err instanceof HttpError) {
    logger.warn(\`HTTP \${err.statusCode}: \${err.message}\`);
  } else if (err instanceof Error) {
    logger.error('Unexpected error', { cause: err.message });
  } else {
    logger.error('Unknown thrown value', { value: String(err) });
  }
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: assumes caught value is Error — thrown values can be anything
try {
  await fetchData(url);
} catch (err) {
  console.log(err.message); // Runtime crash if err is not an Error
}
\`\`\`

---

## Null Safety

### Use nullish coalescing (\`??\`) and optional chaining (\`?.\`)

#### Correct
\`\`\`typescript
const port = config.port ?? 3000;         // Only falls back on null/undefined
const city = user?.address?.city ?? 'Unknown';
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: || treats 0, '', and false as falsy — unintended fallback
const port = config.port || 3000;         // port 0 becomes 3000
const name = user.displayName || 'Anonymous'; // '' becomes 'Anonymous'
\`\`\`

---

## Function Signatures

### Explicit return types on exported functions
Exported functions should have explicit return types to serve as documentation,
prevent unintended return type widening, and improve compile speed.

#### Correct
\`\`\`typescript
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function fetchUser(id: string): Promise<User | null> {
  const response = await api.get(\`/users/\${id}\`);
  if (response.status === 404) return null;
  return response.data as User;
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: no return type — callers infer a complex or inaccurate type
export function calculateTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
// Refactoring the body could silently change the return type, breaking callers
\`\`\`
`,
      },
      {
        path: 'typescript/naming-and-structure.md',
        governance: 'recommended',
        description: 'TypeScript naming conventions and project structure guidelines',
        content: `# TypeScript Naming & Project Structure

## Why This Matters
Consistent naming and structure eliminate ambiguity, reduce cognitive load when navigating
the codebase, and make code self-documenting. These conventions follow the Google TypeScript
Style Guide and the TypeScript Handbook.

---

## Naming Conventions

### Identifiers

| Construct | Convention | Example |
|-----------|-----------|---------|
| Variables, functions, methods | camelCase | \`getUserById\`, \`remainingRetries\` |
| Classes, interfaces, type aliases, enums | PascalCase | \`UserService\`, \`ApiResponse\` |
| Constants (compile-time / env-level) | UPPER_SNAKE_CASE | \`MAX_RETRIES\`, \`API_BASE_URL\` |
| Config objects, module-level non-primitive constants | camelCase | \`defaultConfig\`, \`routeMap\` |
| Generic type parameters | Single uppercase or T-prefix | \`T\`, \`K\`, \`V\`, \`TResponse\`, \`TInput\` |
| Boolean variables and properties | \`is\`, \`has\`, \`should\`, \`can\` prefix | \`isActive\`, \`hasPermission\`, \`canEdit\` |
| Private class members | no underscore prefix | \`private count\` (not \`private _count\`) |

### Interfaces and Types
- No \`I\` prefix on interfaces: \`User\`, not \`IUser\`
- No \`T\` prefix on type aliases (except generics): \`ApiResponse\`, not \`TApiResponse\`
- Interfaces describe shapes: \`UserRepository\`, \`CacheOptions\`
- Type aliases describe unions/compositions: \`HttpMethod\`, \`Result<T, E>\`

### Files and Directories
- Use kebab-case for all file names: \`user-service.ts\`, \`api-client.ts\`
- Use \`.ts\` for pure TypeScript, \`.tsx\` only for files containing JSX
- Test files: \`*.test.ts\` or \`*.spec.ts\` (be consistent within the project)
- Barrel files (\`index.ts\`) only at package/module boundaries — not in every directory

---

## Project Structure

### Feature-Based Organization (Preferred)
\`\`\`
src/
  auth/
    auth.service.ts
    auth.controller.ts
    auth.types.ts
    auth.test.ts
  orders/
    orders.service.ts
    orders.repository.ts
    orders.types.ts
    orders.test.ts
  shared/
    errors.ts
    logger.ts
    types.ts
\`\`\`

### Anti-Pattern: Layer-Based Organization
\`\`\`
src/
  controllers/
    auth.controller.ts
    orders.controller.ts
  services/
    auth.service.ts
    orders.service.ts
  # Problem: adding a feature requires touching many directories
  # Problem: related code is scattered, increasing coupling between modules
\`\`\`

---

## Declaration Order Within a File

1. Type imports (\`import type { ... }\`)
2. Value imports (external packages)
3. Value imports (internal modules)
4. Type/interface declarations
5. Constants
6. Exported functions/classes
7. Internal (non-exported) functions

---

## Generic Type Parameter Naming

#### Correct
\`\`\`typescript
// Simple: single uppercase letter
function identity<T>(value: T): T { return value; }
function mapEntries<K, V>(map: Map<K, V>): [K, V][] { /* ... */ }

// Complex: descriptive T-prefixed name
function transform<TInput, TOutput>(
  input: TInput,
  fn: (val: TInput) => TOutput,
): TOutput {
  return fn(input);
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: meaningless multi-letter names that aren't T-prefixed
function transform<A, B>(input: A, fn: (val: A) => B): B {
  return fn(input);
}
\`\`\`
`,
      },
      {
        path: 'typescript/async-patterns.md',
        governance: 'recommended',
        description: 'TypeScript async/await patterns and Promise handling',
        content: `# TypeScript Async Patterns

## Why This Matters
Incorrect async handling is one of the most common sources of runtime bugs in TypeScript
applications. These rules prevent unhandled rejections, race conditions, and performance
pitfalls.

---

## Rules

### Always await or return Promises — never ignore them

#### Correct
\`\`\`typescript
async function saveUser(user: User): Promise<void> {
  await userRepository.save(user);
  await auditLog.record('user_saved', user.id);
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: fire-and-forget — unhandled rejection if save fails
async function saveUser(user: User): Promise<void> {
  userRepository.save(user); // Missing await — silent failure
  auditLog.record('user_saved', user.id);
}
\`\`\`

---

### Use \`Promise.all\` for independent concurrent operations

#### Correct
\`\`\`typescript
async function loadDashboard(userId: string): Promise<Dashboard> {
  const [user, orders, notifications] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchNotifications(userId),
  ]);
  return { user, orders, notifications };
}
\`\`\`

#### Anti-Pattern
\`\`\`typescript
// BAD: sequential awaits when operations are independent — 3x slower
async function loadDashboard(userId: string): Promise<Dashboard> {
  const user = await fetchUser(userId);
  const orders = await fetchOrders(userId);
  const notifications = await fetchNotifications(userId);
  return { user, orders, notifications };
}
\`\`\`

---

### Use \`Promise.allSettled\` when partial failure is acceptable

#### Correct
\`\`\`typescript
const results = await Promise.allSettled([
  sendEmail(user.email),
  sendPush(user.deviceToken),
  sendSms(user.phone),
]);

const failures = results.filter(
  (r): r is PromiseRejectedResult => r.status === 'rejected',
);
if (failures.length > 0) {
  logger.warn('Some notifications failed', { failures });
}
\`\`\`

---

### Type async function return values explicitly

#### Correct
\`\`\`typescript
// Explicit Promise<T> return type — callers know exactly what to expect
export async function getConfig(): Promise<AppConfig> {
  const raw = await fs.readFile('config.json', 'utf-8');
  return JSON.parse(raw) as AppConfig;
}
\`\`\`

---

### Avoid async functions that do not await anything

#### Anti-Pattern
\`\`\`typescript
// BAD: async keyword is unnecessary — adds overhead wrapping in Promise
async function add(a: number, b: number): Promise<number> {
  return a + b;
}

// GOOD: return plain value or wrap explicitly if needed
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## TypeScript-Specific Review Checklist

### Type Safety
- [ ] No \`any\` types — every \`any\` must be replaced with \`unknown\` and narrowed via type guards, \`typeof\`, \`instanceof\`, or discriminated union checks
- [ ] All catch blocks handle \`unknown\` (not implicit \`any\`) — narrow before accessing properties
- [ ] Exported functions have explicit return types
- [ ] No type assertions (\`as T\`) that bypass safety — prefer type guards or \`satisfies\`
- [ ] \`readonly\` used on properties/arrays that should not be mutated
- [ ] Discriminated unions have exhaustive \`switch\` with \`never\` default case

### Modern TypeScript Patterns
- [ ] Uses \`??\` instead of \`||\` for default values (avoid false-positive on 0, '', false)
- [ ] Uses \`?.\` for optional property access instead of manual null checks
- [ ] Uses \`satisfies\` where a type annotation would widen the inferred type
- [ ] Uses \`as const\` arrays/objects instead of \`enum\` for string literal sets
- [ ] Uses \`import type\` for type-only imports
- [ ] No \`enum\` unless there is a specific reason (runtime object needed, numeric bitflags)

### Async & Promises
- [ ] No fire-and-forget Promises (missing \`await\` or \`.catch()\`)
- [ ] Independent async operations use \`Promise.all\` not sequential \`await\`
- [ ] No unnecessary \`async\` on functions that do not \`await\` anything

### Imports & Structure
- [ ] Imports grouped: node built-ins -> external packages -> internal modules -> types
- [ ] Named exports used (no default exports)
- [ ] No circular imports between modules`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## TypeScript Testing Guidelines

### Type-Safe Testing
- Use proper TypeScript types for test fixtures, mocks, and stubs — avoid \`any\` in tests too
- Type mock implementations using the original interface (e.g., \`vi.fn<Parameters<typeof fn>, ReturnType<typeof fn>>()\`)
- Use \`satisfies\` for test fixture data to validate it matches the expected type while keeping literal inference
- Test generic functions with multiple concrete type arguments to verify polymorphic behavior

### What to Test in TypeScript Code
- Test type guard functions (\`isUser()\`, \`isAdmin()\`) with both matching and non-matching inputs
- Test discriminated union handling — ensure all variants are covered
- Test error paths — verify typed error classes are thrown with correct properties
- Test null/undefined edge cases — especially with \`strictNullChecks\` enabled
- Test async functions: success, failure, timeout, and concurrent (\`Promise.all\`) paths

### Anti-Patterns in Tests
- Do not use \`as any\` to bypass types in test data — create proper typed fixtures
- Do not test TypeScript compiler behavior (e.g., "this should not compile") — that is the compiler's job
- Do not over-mock: only mock I/O boundaries (network, filesystem, database)`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## TypeScript Security Review

### Type-Level Risks
- [ ] No \`any\` types that bypass input validation — \`any\` from external data (API responses, user input, JSON.parse) is a common injection vector
- [ ] \`JSON.parse()\` results typed as \`unknown\`, not cast directly to a trusted type
- [ ] Template literals used in SQL/HTML are parameterized or sanitized — \`\`\`\${userInput}\`\`\` in queries is injection

### Prototype and Object Safety
- [ ] No \`Object.assign(target, untrustedInput)\` without validation — prototype pollution risk
- [ ] No property access on objects from external sources without validation (\`obj[userKey]\`)
- [ ] Use \`Map<K,V>\` instead of plain objects for user-controlled keys to avoid prototype collisions

### Runtime Validation
- [ ] All external data (API responses, file reads, env vars) is validated at the boundary using a schema library (zod, valibot, io-ts) or manual type guards
- [ ] \`eval()\`, \`new Function()\`, and \`vm.runInNewContext()\` are never used with user input
- [ ] \`child_process.exec()\` commands do not include unsanitized user input — use \`execFile()\` with argument arrays

### Dependency Hygiene
- [ ] No use of \`@ts-ignore\` or \`@ts-expect-error\` to silence security-relevant type errors
- [ ] Dependencies from \`@types/\` packages are version-locked alongside their runtime counterparts`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## TypeScript Refactoring Patterns

### Type System Refactorings
- Replace \`any\` with \`unknown\` + type guards — the single highest-value refactoring in TypeScript
- Replace boolean flags with discriminated unions (e.g., \`isLoading: boolean\` -> \`status: 'idle' | 'loading' | 'success' | 'error'\`)
- Replace string enums with \`as const\` arrays and derived union types
- Extract repeated type unions into named type aliases
- Replace type assertions (\`as T\`) with type guards or \`satisfies\`
- Replace \`interface\` used for unions/intersections with \`type\` (use each for its strengths)

### Code Modernization
- Replace \`||\` with \`??\` for default values
- Replace manual null checks with \`?.\`
- Replace \`.then()/.catch()\` chains with \`async/await\`
- Replace \`Object.keys(obj).forEach\` with \`for...of\` over \`Object.entries()\`
- Replace index signatures (\`{ [key: string]: T }\`) with \`Record<string, T>\`
- Replace sequential awaits with \`Promise.all\` for independent operations

### Migration Awareness
- When upgrading to TypeScript 5.4+: leverage \`NoInfer<T>\` to control inference
- When upgrading to TypeScript 5.5+: remove manual type predicates where the compiler now infers them
- When enabling \`noUncheckedIndexedAccess\`: add null checks or use \`Map.get()\` patterns`,
      },
    ],
    skills: [
      {
        name: 'typescript-module-scaffold',
        description: 'Scaffold a new TypeScript module with types, implementation, tests, and barrel export',
        content: `# TypeScript Module Scaffold Skill

## When to Use
When creating a new feature module with its type definitions, implementation, unit tests,
and exports. This ensures consistent structure across the codebase.

## Steps

### 1. Create the type definitions file
\`\`\`typescript
// src/{feature}/{feature}.types.ts
export interface {Feature}Config {
  // Configuration options
}

export interface {Feature}Result {
  // Return type
}

export type {Feature}Error =
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'VALIDATION'; message: string; field: string }
  | { code: 'INTERNAL'; message: string; cause?: Error };
\`\`\`

### 2. Create the implementation file
\`\`\`typescript
// src/{feature}/{feature}.service.ts
import type { {Feature}Config, {Feature}Result, {Feature}Error } from './{feature}.types.js';

export function create{Feature}(config: {Feature}Config): {Feature}Result {
  // Implementation
}
\`\`\`

### 3. Create the test file
\`\`\`typescript
// src/{feature}/{feature}.test.ts
import { describe, it, expect } from 'vitest'; // or jest
import { create{Feature} } from './{feature}.service.js';
import type { {Feature}Config } from './{feature}.types.js';

describe('create{Feature}', () => {
  it('should handle valid input', () => {
    const config: {Feature}Config = { /* ... */ };
    const result = create{Feature}(config);
    expect(result).toBeDefined();
  });

  it('should throw on invalid input', () => {
    expect(() => create{Feature}(null as any)).toThrow();
  });
});
\`\`\`

### 4. Create barrel export (only at module boundary)
\`\`\`typescript
// src/{feature}/index.ts
export type { {Feature}Config, {Feature}Result, {Feature}Error } from './{feature}.types.js';
export { create{Feature} } from './{feature}.service.js';
\`\`\`

## Checklist
- [ ] Types file created with all public interfaces
- [ ] Implementation file imports types with \`import type\`
- [ ] Test file covers happy path, edge cases, and error cases
- [ ] Barrel export re-exports only the public API
- [ ] All exported functions have explicit return types
- [ ] File names use kebab-case
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.(ts|tsx)$" && grep -nE "\\bany\\b" "$CLAUDE_FILE_PATH" | grep -vE "(// eslint-disable|// @ts-|// any:|as any // justified)" | head -5 | grep -q "." && echo "HOOK_EXIT:0:Warning: file contains unqualified \\"any\\" types — consider using \\"unknown\\" with type guards" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.(ts|tsx)$" && grep -nE "@ts-ignore" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: @ts-ignore found — prefer @ts-expect-error with description (auto-removed when error is fixed)" || true',
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.(ts|tsx)$" && grep -nP "\\bcatch\\s*\\(\\w+\\)" "$CLAUDE_FILE_PATH" | grep -vE ":\\s*unknown" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: catch block without explicit :unknown type annotation — enable useUnknownInCatchVariables or annotate manually" || true',
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.(ts|tsx)$" && grep -nE "^\\s*enum\\s+" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: enum declaration found — prefer const arrays with as const and derived union types" || true',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'tsconfig',
        filePath: 'tsconfig.json',
        mergeStrategy: 'align',
        config: {
          compilerOptions: {
            strict: true,
            noUncheckedIndexedAccess: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noImplicitReturns: true,
            noFallthroughCasesInSwitch: true,
            exactOptionalPropertyTypes: true,
            noImplicitOverride: true,
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
            skipLibCheck: true,
            resolveJsonModule: true,
            isolatedModules: true,
            verbatimModuleSyntax: true,
          },
        },
      },
      {
        type: 'eslint',
        filePath: '.eslintrc.json',
        mergeStrategy: 'create-only',
        config: {
          extends: [
            'eslint:recommended',
            'plugin:@typescript-eslint/strict-type-checked',
            'plugin:@typescript-eslint/stylistic-type-checked',
          ],
          rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
          },
        },
      },
    ],
  },
};
