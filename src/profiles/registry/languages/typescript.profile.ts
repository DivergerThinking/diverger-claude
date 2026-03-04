import type { Profile, HookScriptDefinition } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';
import { makeFilePatternCheckScript } from '../../hook-script-templates.js';

function buildTypescriptHookScripts(): HookScriptDefinition[] {
  return [
    {
      filename: 'ts-any-check.sh',
      isPreToolUse: false,
      content: `#!/bin/bash
# Warn on unqualified "any" types in TypeScript files
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}")
if [ -z "$FILE_PATH" ]; then exit 0; fi
echo "$FILE_PATH" | grep -qE '\\.(ts|tsx)$' || exit 0
if grep -nE "\\bany\\b" "$FILE_PATH" | grep -vE "(// eslint-disable|// @ts-|// any:|as any // justified)" | head -5 | grep -q "."; then
  echo "Warning: file contains unqualified \\"any\\" types — consider using \\"unknown\\" with type guards" >&2
  exit 2
fi
exit 0
`,
    },
    {
      filename: 'ts-ignore-check.sh',
      isPreToolUse: false,
      content: makeFilePatternCheckScript({
        filename: 'ts-ignore-check.sh',
        pattern: '@ts-ignore',
        message: 'Warning: @ts-ignore found — prefer @ts-expect-error with description',
        exitCode: 2,
        fileExtensions: ['.ts', '.tsx'],
      }),
    },
    {
      filename: 'ts-catch-unknown.sh',
      isPreToolUse: false,
      content: `#!/bin/bash
# Warn on catch blocks without :unknown type annotation
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}")
if [ -z "$FILE_PATH" ]; then exit 0; fi
echo "$FILE_PATH" | grep -qE '\\.(ts|tsx)$' || exit 0
if grep -nE "\\bcatch\\s*\\(\\w+\\)" "$FILE_PATH" | grep -vE ":\\s*unknown" | head -3 | grep -q "."; then
  echo "Warning: catch block without explicit :unknown type annotation" >&2
  exit 2
fi
exit 0
`,
    },
    {
      filename: 'ts-enum-check.sh',
      isPreToolUse: false,
      content: makeFilePatternCheckScript({
        filename: 'ts-enum-check.sh',
        pattern: '^\\s*enum\\s+',
        message: 'Warning: enum declaration found — prefer const arrays with as const and derived union types',
        exitCode: 2,
        fileExtensions: ['.ts', '.tsx'],
      }),
    },
  ];
}

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

Strict TypeScript with maximum type safety. No \`any\`, prefer \`unknown\`. Discriminated unions over type assertions.

**Detailed rules:** see \`.claude/rules/typescript/\` directory.

**Key rules:**
- Enable \`strict\`, \`noUncheckedIndexedAccess\` — use \`satisfies\` and \`as const\` over enums
- Explicit return types on exported functions, \`catch (error: unknown)\`
- Prefer \`import type\` for type-only imports, barrel exports only at package boundary
- Use \`Result\`/discriminated union patterns for expected failures`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npm:*)',
          'Bash(npx:*)',
          'Bash(node:*)',
        ],
      },
    },
    rules: [
      {
        path: 'typescript/conventions.md',
        governance: 'mandatory',
        description: 'TypeScript coding conventions and type safety rules',
        paths: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
        content: `# TypeScript Conventions

## Type Safety Rules

- **Never use \`any\`** — use \`unknown\` and narrow with type guards or \`instanceof\`
- **Discriminated unions over boolean flags** — make states explicit, use exhaustive \`switch\` with \`never\` default
- **Use \`satisfies\`** for type-safe assignments that preserve literal inference (not type annotations that widen)
- **Use \`as const\` arrays instead of \`enum\`** — derive union types with \`(typeof ARR)[number]\`
- **No type assertions (\`as T\`)** unless narrowing from \`unknown\` after validation

## Import Rules

- Use \`import type { ... }\` for type-only imports — avoids unnecessary runtime imports
- Prefer named exports over default exports — ensures consistent import names
- Group imports: node builtins, external packages, internal modules, type imports
- Barrel exports (\`index.ts\`) only at package/module boundaries

## Error Handling

- Always use \`catch (err: unknown)\` — narrow with \`instanceof\` before accessing properties
- Never assume caught values are \`Error\` — they can be any type

## Null Safety

- Use \`??\` (nullish coalescing) not \`||\` — avoids false positives on \`0\`, \`''\`, \`false\`
- Use \`?.\` (optional chaining) for safe property access

## Function Signatures

- Explicit return types on all exported functions — prevents unintended type widening
- Use \`Promise<T>\` return type on async exported functions
- Prefer options objects over long parameter lists (3+ params)

For detailed examples and reference, invoke: /ts-conventions-guide
`,
      },
      {
        path: 'typescript/naming-and-structure.md',
        governance: 'recommended',
        description: 'TypeScript naming conventions and project structure guidelines',
        paths: ['**/*.ts', '**/*.tsx'],
        content: `# TypeScript Naming & Project Structure

Consistent naming and file organization. PascalCase types, camelCase values, kebab-case files.

**Key rules:**
- PascalCase for classes/interfaces/types, camelCase for variables/functions, UPPER_SNAKE_CASE for constants
- Boolean variables: \`is\`, \`has\`, \`should\`, \`can\` prefix
- No \`I\` prefix on interfaces, no \`T\` prefix on type aliases (except generics)
- kebab-case for file names, \`.tsx\` only for JSX files
- Barrel \`index.ts\` only at package/module boundaries
- Prefer feature-based organization over layer-based (controllers/, services/)
- Declaration order: type imports → value imports → types → constants → exports → internal

For detailed examples and reference, invoke: /ts-naming-guide
`,
      },
      {
        path: 'typescript/async-patterns.md',
        governance: 'recommended',
        description: 'TypeScript async/await patterns and Promise handling',
        paths: ['**/*.ts', '**/*.tsx'],
        content: `# TypeScript Async Patterns

## Rules

- **Always await or return Promises** — never fire-and-forget; unhandled rejections crash at runtime
- **Use \`Promise.all\`** for independent concurrent operations — avoids sequential slowdown
- **Use \`Promise.allSettled\`** when partial failure is acceptable — inspect rejected results
- **Type async return values explicitly** — \`Promise<T>\` on exported async functions
- **Avoid unnecessary \`async\`** — do not mark functions \`async\` if they never \`await\`
- **Use \`async/await\`** over \`.then()\` chains for readability
- **Handle race conditions** — use AbortController or cancellation flags in effects/fetches
- **No floating Promises** — every Promise must be awaited, returned, or explicitly voided with \`void promise\`

For detailed examples and reference, invoke: /ts-async-guide
`,
      },
    ],
    agents: [
      {
        name: 'ts-reviewer',
        type: 'define',
        model: 'sonnet',
        description: 'Reviews TypeScript code for type safety, modern patterns, and best practices',
        prompt: `You are a TypeScript code reviewer. Reference concrete line numbers.

## Checklist
1. **Type Safety**: no \`any\` (use \`unknown\`+narrow), \`catch (err: unknown)\`, explicit return types, \`satisfies\` over \`as T\`, exhaustive switches with \`never\`
2. **Modern Patterns**: \`??\` not \`||\`, \`?.\`, \`as const\` arrays not \`enum\`, \`import type\`, \`satisfies\`
3. **Async**: no fire-and-forget Promises, \`Promise.all\` for independent ops, no unnecessary \`async\`
4. **Imports**: grouped (node → external → internal → types), named exports, no circular deps

## Output: CRITICAL | WARNING | SUGGESTION | POSITIVE — explain WHY.

For detailed rules, invoke: /ts-conventions-guide`,
        skills: ['typescript-module-scaffold', 'ts-conventions-guide'],
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## TypeScript Testing Guidelines
- Use proper TypeScript types for fixtures and mocks — avoid \`any\` in tests
- Test type guards, discriminated unions, error paths, null/undefined edges, and async flows
- Do not use \`as any\` to bypass types — create proper typed fixtures
- Only mock I/O boundaries (network, filesystem, database)`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## TypeScript Security Review
- No \`any\` that bypasses input validation — \`JSON.parse()\` typed as \`unknown\`
- No \`Object.assign(target, untrustedInput)\` — prototype pollution risk
- Use \`Map<K,V>\` for user-controlled keys
- All external data validated with schema library (zod, valibot) or type guards
- No \`eval()\`, \`new Function()\`, \`exec()\` with user input — use \`execFile()\` with args
- No \`@ts-ignore\` to silence security-relevant type errors`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['typescript-module-scaffold'],
        prompt: `## TypeScript Refactoring Patterns
- Replace \`any\` with \`unknown\` + type guards
- Replace boolean flags with discriminated unions
- Replace string enums with \`as const\` arrays and derived union types
- Replace \`as T\` with type guards or \`satisfies\`
- Replace \`||\` with \`??\`, \`.then()\` with \`async/await\`, sequential awaits with \`Promise.all\``,
      },
    ],
    skills: [
      {
        name: 'typescript-module-scaffold',
        description: 'Scaffold a new TypeScript module with types, implementation, tests, and barrel export',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
      {
        name: 'ts-conventions-guide',
        description: 'Detailed reference for TypeScript type safety conventions with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# TypeScript Conventions — Detailed Reference

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
        name: 'ts-naming-guide',
        description: 'Detailed reference for TypeScript naming conventions and project structure',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# TypeScript Naming & Project Structure — Detailed Reference

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
        name: 'ts-async-guide',
        description: 'Detailed reference for TypeScript async/await patterns and Promise handling',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# TypeScript Async Patterns — Detailed Reference

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
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/ts-any-check.sh',
            timeout: 10,
            statusMessage: 'Checking for any types...',
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/ts-ignore-check.sh',
            timeout: 5,
            statusMessage: 'Checking for @ts-ignore...',
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/ts-catch-unknown.sh',
            timeout: 5,
            statusMessage: 'Checking catch block types...',
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/ts-enum-check.sh',
            timeout: 5,
            statusMessage: 'Checking for enum declarations...',
          },
        ],
      },
    ],
    hookScripts: buildTypescriptHookScripts(),
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
