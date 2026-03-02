import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';
import { SENSITIVE_PATTERNS } from '../../../core/constants.js';

export const universalProfile: Profile = {
  id: 'base/universal',
  name: 'Universal Base',
  layer: PROFILE_LAYERS.BASE,
  technologyIds: [], // Base profiles always apply via layer === 0, no technology match needed
  contributions: {
    claudeMd: [
      {
        heading: 'Code Quality Standards',
        order: 0,
        content: `## Code Quality Standards

### Clean Code Principles
- **Meaningful names**: variables, functions, and classes must reveal intent — no abbreviations, no single-letter names outside loops
- **Small functions**: each function does one thing, at one level of abstraction, under 30 lines
- **Single Responsibility**: every module/class/function has one reason to change
- **DRY without over-abstraction**: extract only when a pattern repeats 3+ times and the abstraction is natural
- **YAGNI**: do not build speculative features — only what is currently needed
- **Boy Scout Rule**: leave code cleaner than you found it

### SOLID Principles
- **S — Single Responsibility**: one class = one reason to change
- **O — Open/Closed**: extend behavior without modifying existing code (use interfaces, strategy pattern)
- **L — Liskov Substitution**: subtypes must be substitutable for their base types without altering correctness
- **I — Interface Segregation**: prefer many small, focused interfaces over one large interface
- **D — Dependency Inversion**: depend on abstractions, not concretions — inject dependencies

### Key Patterns
- Prefer composition over inheritance
- Prefer pure functions for business logic — no side effects, same input = same output
- Prefer explicit over implicit behavior
- Use guard clauses for early returns instead of deeply nested conditionals
- Encapsulate boundary conditions (off-by-one, null checks) in dedicated helpers

### Common Anti-Patterns to Avoid
- **God objects/functions**: classes or functions that do too much — split by responsibility
- **Primitive obsession**: use value objects or types instead of raw strings/numbers for domain concepts
- **Feature envy**: a function that uses more data from another module than its own — move it there
- **Shotgun surgery**: one change requires editing many files — consolidate related logic
- **Dead code**: remove unused functions, variables, imports — do not comment them out`,
      },
      {
        heading: 'Git Conventions',
        order: 1,
        content: `## Git Conventions

### Conventional Commits (v1.0.0)
Format: \`<type>[optional scope]: <description>\`

Types:
- \`feat\`: new feature (MINOR in SemVer)
- \`fix\`: bug fix (PATCH in SemVer)
- \`docs\`: documentation only
- \`style\`: formatting, no logic change
- \`refactor\`: code change that neither fixes a bug nor adds a feature
- \`perf\`: performance improvement
- \`test\`: adding or correcting tests
- \`chore\`: maintenance tasks (deps, config)
- \`ci\`: CI/CD configuration changes
- \`build\`: build system or external dependency changes
- \`revert\`: reverts a previous commit

Breaking changes: append \`!\` before colon or add \`BREAKING CHANGE:\` footer.
Example: \`feat(auth)!: require OAuth2 for all endpoints\`

### Commit Discipline
- Keep commits atomic — one logical change per commit
- Write imperative mood in the subject line ("add feature" not "added feature")
- Subject line max 72 characters, body wraps at 80
- Separate subject from body with a blank line
- Never commit secrets, credentials, API keys, or .env files
- Squash WIP commits before merging to main`,
      },
      {
        heading: 'Error Handling',
        order: 2,
        content: `## Error Handling

### Principles
- Handle errors explicitly — never silently swallow exceptions
- Fail fast on unrecoverable errors — do not attempt heroic recovery
- Use typed/custom error classes with meaningful messages and context
- Log errors with sufficient context: what failed, which inputs, what state
- Provide user-friendly error messages separately from debug information

### Patterns
- Use guard clauses to validate preconditions at function entry
- Wrap external calls (APIs, DB, filesystem) in try/catch with specific error types
- Propagate errors up the call stack — do not handle at the wrong level of abstraction
- Use Result/Either patterns when the language supports them for expected failures
- Distinguish between operational errors (expected) and programmer errors (bugs)

### Anti-Patterns
- Empty catch blocks — always log or rethrow
- Catch-all handlers that swallow error context
- Using exceptions for control flow
- Returning null instead of throwing on unexpected failures
- Error messages that leak internal implementation details to end users`,
      },
      {
        heading: 'Performance Awareness',
        order: 3,
        content: `## Performance Awareness

- Avoid premature optimization — profile first, optimize hot paths
- Be aware of algorithmic complexity: prefer O(n) or O(n log n) over O(n^2) for data processing
- Avoid unnecessary allocations inside tight loops
- Use pagination for large data sets — never load unbounded collections into memory
- Cache expensive computations when the result is reusable and invalidation is manageable
- Prefer streaming over buffering for large I/O operations
- Measure before and after: every optimization must be validated with benchmarks`,
      },
    ],
    settings: {
      permissions: {
        deny: SENSITIVE_PATTERNS.map((p) => `Read(${p})`),
      },
    },
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'grep -riEn "(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[0-9a-zA-Z]{48}|ghp_[0-9a-zA-Z]{36}|-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----|password\\s*[:=]\\s*[\"\\x27][^\"\\x27]{4,}|secret\\s*[:=]\\s*[\"\\x27][^\"\\x27]{4,}|api[_-]?key\\s*[:=]\\s*[\"\\x27][^\"\\x27]{4,})" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:1:Potential secret or API key detected in written file" || true',
            timeout: 10,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_TOOL_INPUT" | grep -qE "(git\\s+push\\s+--force|git\\s+push\\s+-f\\b|git\\s+reset\\s+--hard|rm\\s+-rf\\s+/|git\\s+clean\\s+-fd|git\\s+checkout\\s+--\\s+\\.)" && echo "HOOK_EXIT:1:Destructive command detected — review carefully" || true',
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
              'grep -cEn "^.{300,}$" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:0:Warning: file contains lines over 300 characters — consider wrapping" || true',
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
              'tail -c 1 "$CLAUDE_FILE_PATH" | grep -qP "\\S" && echo "HOOK_EXIT:0:Warning: file does not end with a newline" || true',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_TOOL_INPUT" | grep -qE "(curl|wget)\\s+.*\\|\\s*(bash|sh|sudo)" && echo "HOOK_EXIT:1:Piping remote scripts to shell detected — security risk" || true',
            timeout: 5,
          },
        ],
      },
    ],
    rules: [
      {
        path: 'architecture-and-style.md',
        governance: 'mandatory',
        description: 'Universal architecture, naming, and code style rules',
        content: `# Architecture & Code Style Rules

## Why This Matters
Consistent architecture and naming reduce cognitive load, make code self-documenting,
and prevent the most common maintenance problems. These rules reflect Clean Code principles
and SOLID design, applied universally regardless of language or framework.

---

## Project Structure
- Organize code by feature/domain, not by technical layer when the project grows beyond trivial size
- Keep entry points thin: they wire dependencies and delegate to domain logic
- Separate I/O (filesystem, network, database) from pure business logic
- Configuration should live at the top level, not be scattered through the code

### Correct
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
    orders.test.ts
\`\`\`

### Anti-Pattern
\`\`\`
src/
  controllers/
    auth.controller.ts
    orders.controller.ts
  services/
    auth.service.ts
    orders.service.ts
  # Problem: changing one feature requires touching many directories
\`\`\`

---

## Naming Conventions

### Variables & Functions
- Names must reveal intent: \`remainingRetries\` not \`r\` or \`cnt\`
- Boolean variables: \`isActive\`, \`hasPermission\`, \`shouldRetry\`, \`canEdit\`
- Functions describe WHAT they do: \`calculateTotalPrice()\` not \`process()\` or \`doStuff()\`
- Event handlers: \`onUserLogin\`, \`handlePaymentComplete\`
- Avoid mental mapping: no single-letter variables except loop counters (\`i\`, \`j\`)

### Classes & Types
- PascalCase for classes, interfaces, types, enums
- Avoid generic names: \`Manager\`, \`Handler\`, \`Processor\`, \`Helper\`, \`Utils\` — be specific
- Name interfaces by capability: \`Serializable\`, \`Cacheable\`, \`Retryable\`

### Constants & Configuration
- UPPER_SNAKE_CASE for true constants (compile-time or environment-level)
- Replace magic numbers with named constants: \`MAX_RETRY_COUNT = 3\` not just \`3\`

### Anti-Pattern Examples
\`\`\`
// Bad: meaningless names
const d = new Date();
const x = getItems().filter(i => i.a > 5);
function proc(data) { /* ... */ }

// Good: intention-revealing names
const signupDeadline = new Date();
const expensiveItems = getItems().filter(item => item.price > MIN_PRICE);
function filterExpiredSubscriptions(subscriptions) { /* ... */ }
\`\`\`

---

## Function Design

- **Single responsibility**: one function = one task
- **Max 30 lines**: if longer, extract sub-functions
- **Max 3 parameters**: use an options/config object for more
- **No flag parameters**: prefer two separate functions over a boolean that changes behavior
- **No side effects**: a function named \`getUser\` must not modify state
- **Guard clauses**: validate inputs early and return, avoiding deep nesting

### Correct
\`\`\`
function calculateDiscount(order) {
  if (!order.items.length) return 0;
  if (order.isEmployee) return order.total * 0.30;
  if (order.total > 100) return order.total * 0.10;
  return 0;
}
\`\`\`

### Anti-Pattern
\`\`\`
function calculateDiscount(order) {
  let discount = 0;
  if (order.items.length > 0) {
    if (order.isEmployee) {
      discount = order.total * 0.30;
    } else {
      if (order.total > 100) {
        discount = order.total * 0.10;
      }
    }
  }
  return discount;
  // Problem: deep nesting, harder to follow, easier to introduce bugs
}
\`\`\`

---

## Comments
- Code should be self-documenting — comments explain "why", never "what"
- Use comments for: business rule context, non-obvious trade-offs, TODO with ticket reference
- Delete commented-out code — version control is the history
- Keep comments updated — stale comments are worse than no comments

### Correct
\`\`\`
// Rate limit applies only to free-tier users per billing agreement (PROJ-1234)
if (user.tier === 'free' && requestCount > RATE_LIMIT) { ... }
\`\`\`

### Anti-Pattern
\`\`\`
// Check if user is free and request count is greater than rate limit
if (user.tier === 'free' && requestCount > RATE_LIMIT) { ... }
// Problem: comment restates the code, adds no information
\`\`\`

---

## Error Handling
- Never use empty catch blocks — always log or rethrow with context
- Always handle Promise rejections and async errors
- Use specific error types over generic ones
- Distinguish operational errors (expected: network timeout) from programmer errors (bugs: null reference)
- Do not use exceptions for control flow

### Correct
\`\`\`
try {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError(\`User \${id} not found\`);
  return user;
} catch (error) {
  if (error instanceof NotFoundError) throw error;
  throw new DatabaseError('Failed to fetch user', { cause: error, userId: id });
}
\`\`\`

### Anti-Pattern
\`\`\`
try {
  const user = await userRepository.findById(id);
  return user;
} catch (error) {
  // silently swallowed — caller never knows the operation failed
}
\`\`\`
`,
      },
      {
        path: 'security.md',
        governance: 'mandatory',
        description: 'Universal security rules aligned with OWASP Top 10 2025',
        content: `# Security Rules (OWASP Top 10 2025)

## Why This Matters
Security vulnerabilities are the costliest defects. These rules cover the OWASP Top 10 2025
categories, adapted as coding guidelines that apply universally across all languages and frameworks.

---

## A01: Broken Access Control
- Deny access by default — explicitly grant permissions, never rely on absence of restriction
- Enforce authorization checks on every request, not just in the UI
- Validate that the current user owns the resource being accessed (prevent IDOR)
- Use centralized access control — do not scatter authorization logic across handlers

### Correct
\`\`\`
async function getOrder(orderId, currentUser) {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (order.userId !== currentUser.id && !currentUser.hasRole('admin')) {
    throw new ForbiddenError('Access denied');
  }
  return order;
}
\`\`\`

### Anti-Pattern
\`\`\`
async function getOrder(orderId) {
  // No authorization check — any authenticated user can access any order
  return await orderRepo.findById(orderId);
}
\`\`\`

---

## A02: Security Misconfiguration
- Never use default credentials or configurations in production
- Disable debug modes, verbose error pages, and directory listings in production
- Set security headers: Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security
- Keep dependencies and runtime patched

---

## A03: Software Supply Chain Failures
- Pin dependency versions — avoid \`latest\` or floating ranges in production
- Audit dependencies regularly: \`npm audit\`, \`pip audit\`, \`cargo audit\`
- Verify package integrity (lockfile hashes, checksums)
- Minimize the number of dependencies — prefer standard library when feasible
- Never import packages from untrusted registries or sources

---

## A04: Cryptographic Failures
- Never implement custom cryptography — use established libraries
- Use strong algorithms: AES-256 for encryption, bcrypt/Argon2 for passwords, SHA-256+ for hashing
- Never store passwords in plaintext or with reversible encryption
- Use TLS 1.2+ for all data in transit
- Do not hardcode encryption keys or salts in source code

---

## A05: Injection
- ALWAYS use parameterized queries — never concatenate user input into queries
- Validate and sanitize all external input (user input, API responses, file uploads)
- Use allowlists over denylists for input validation
- Encode output according to context (HTML, URL, SQL, OS command)

### Correct
\`\`\`
// Parameterized query — safe from injection
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
\`\`\`

### Anti-Pattern
\`\`\`
// String concatenation — SQL injection vulnerability
const user = await db.query('SELECT * FROM users WHERE id = ' + userId);
\`\`\`

---

## A06: Insecure Design
- Apply threat modeling during design — identify trust boundaries and attack surfaces
- Follow the principle of least privilege for all system components
- Implement rate limiting for authentication and sensitive endpoints
- Design for failure: assume any external input or service can be malicious

---

## A07: Authentication Failures
- Enforce strong password policies (minimum 12 characters, check against breached password lists)
- Implement multi-factor authentication for sensitive operations
- Use secure session management — HttpOnly, Secure, SameSite cookie attributes
- Implement account lockout or throttling after failed login attempts
- Never expose authentication details in error messages ("Invalid credentials", not "Wrong password")

---

## A08: Software or Data Integrity Failures
- Verify signatures on updates, serialized data, and CI/CD artifacts
- Never deserialize untrusted data without validation
- Protect CI/CD pipelines — use signed commits, require code review before merge
- Use subresource integrity (SRI) for third-party scripts

---

## A09: Security Logging & Alerting Failures
- Log all authentication events, access control failures, and input validation failures
- Never log sensitive data (passwords, tokens, PII, credit card numbers)
- Use structured logging with correlation IDs for tracing
- Ensure log integrity — logs should be append-only and tamper-evident

---

## A10: Mishandling of Exceptional Conditions
- Handle all error paths — no unhandled exceptions in production
- Do not expose stack traces, internal paths, or debug info to end users
- Fail securely: on error, deny access rather than granting it
- Validate all assumptions — never trust that external data is in the expected format

### Correct
\`\`\`
try {
  const result = await paymentGateway.charge(amount);
  return { success: true, transactionId: result.id };
} catch (error) {
  logger.error('Payment failed', { amount, errorCode: error.code });
  return { success: false, message: 'Payment could not be processed' };
  // User sees generic message; details are logged server-side
}
\`\`\`

### Anti-Pattern
\`\`\`
try {
  const result = await paymentGateway.charge(amount);
  return { success: true, transactionId: result.id };
} catch (error) {
  return { success: false, message: error.stack };
  // Leaks internal stack trace, file paths, and library versions to the client
}
\`\`\`

---

## Sensitive Data Protection
- NEVER read, log, or output API keys, passwords, tokens, or private keys
- Do not access .env files, .pem files, or credential stores from application code that could expose them
- Handle PII with care — minimize collection, encrypt at rest, restrict access
- Use environment variables or secret managers for credentials — never hardcode them
`,
      },
      {
        path: 'git-workflow.md',
        governance: 'recommended',
        description: 'Git workflow and Conventional Commits guidelines',
        content: `# Git Workflow & Conventional Commits

## Why This Matters
A disciplined Git workflow enables reliable releases, meaningful changelogs, and painless
collaboration. Conventional Commits provide a structured format that can be parsed by
tooling for automatic versioning and changelog generation.

---

## Conventional Commits Format (v1.0.0)

\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

### Types
| Type | Purpose | SemVer Impact |
|------|---------|---------------|
| feat | New feature | MINOR |
| fix | Bug fix | PATCH |
| docs | Documentation only | None |
| style | Formatting, whitespace | None |
| refactor | Code restructuring, no behavior change | None |
| perf | Performance improvement | None |
| test | Adding or correcting tests | None |
| chore | Maintenance, deps, config | None |
| ci | CI/CD configuration | None |
| build | Build system changes | None |
| revert | Revert a previous commit | Varies |

### Breaking Changes
Two equivalent approaches:
- Footer: \`BREAKING CHANGE: description\`
- Prefix: \`feat(api)!: remove deprecated endpoint\`

Breaking changes trigger a MAJOR version bump.

### Examples
\`\`\`
feat(auth): add OAuth2 login with Google provider

Implements the OAuth2 authorization code flow for Google.
Includes token refresh and session persistence.

Closes #142

---

fix(parser): handle empty input without crashing

Previously, passing an empty string caused an uncaught TypeError.
Now returns an empty result object.

---

refactor!: rename UserService to AuthenticationService

BREAKING CHANGE: all imports of UserService must be updated to AuthenticationService.
\`\`\`

---

## Branch Discipline
- Keep commits atomic — one logical change per commit
- Write commit subjects in imperative mood: "add feature" not "added feature"
- Subject line max 72 characters; body wraps at 80
- Squash WIP commits before merging to main
- Never commit generated files, build artifacts, or OS-specific files (.DS_Store, Thumbs.db)
- Never force-push to shared branches (main, develop, release/*)

---

## Pre-Commit Checklist
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] No secrets or credentials in the diff
- [ ] Commit message follows Conventional Commits format
- [ ] Changes are scoped to one logical change
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'define',
        description: 'Reviews code for quality, security, and best practices',
        prompt: `You are an expert code reviewer with deep knowledge of Clean Code principles, SOLID design, and OWASP security guidelines. Your reviews are thorough, specific, and always reference concrete line numbers or code snippets.

## Review Checklist

### 1. Architecture & Design
- [ ] Single Responsibility: each function/class does one thing
- [ ] Open/Closed: new behavior via extension, not modification
- [ ] Dependency Inversion: depends on abstractions, not concretions
- [ ] No god objects or god functions (>100 lines)
- [ ] Proper separation of concerns (I/O vs business logic)

### 2. Code Quality
- [ ] Names reveal intent — no abbreviations, no generic names (data, info, temp, item)
- [ ] Functions < 30 lines, < 4 parameters
- [ ] No deep nesting (max 3 levels) — use guard clauses
- [ ] No code duplication (DRY) — but no premature abstraction either
- [ ] No dead code (unused variables, imports, functions, commented-out blocks)
- [ ] No magic numbers — use named constants

### 3. Error Handling
- [ ] No empty catch blocks
- [ ] All async operations have error handling
- [ ] Errors include sufficient context for debugging
- [ ] User-facing error messages do not leak internals
- [ ] Operational vs programmer errors are distinguished

### 4. Security (OWASP Top 10 2025)
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] Input validation on all external data
- [ ] Parameterized queries for database operations
- [ ] Output encoding to prevent XSS
- [ ] Access control checks on every sensitive operation
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Dependencies are pinned and audited

### 5. Performance
- [ ] No O(n^2) or worse where O(n) or O(n log n) is possible
- [ ] No unnecessary allocations in loops
- [ ] Large data sets use pagination or streaming
- [ ] No unbounded caches or growing memory leaks

### 6. Testing
- [ ] New logic has corresponding tests
- [ ] Tests cover happy path, edge cases, and error cases
- [ ] Tests are deterministic and independent

## Output Format
Categorize every finding:
- CRITICAL: Must fix before merge — bugs, security issues, data loss risks
- WARNING: Should fix — code smells, missing tests, unclear naming
- SUGGESTION: Nice to have — style improvements, minor refactoring opportunities
- POSITIVE: Call out good patterns worth keeping

Always explain WHY a change is needed, not just WHAT to change.`,
        skills: [],
      },
      {
        name: 'test-writer',
        type: 'define',
        description: 'Writes comprehensive tests for code',
        prompt: `You are an expert test engineer who writes thorough, maintainable tests. You understand testing theory (unit, integration, e2e) and apply it pragmatically.

## Testing Methodology

### Structure: Arrange-Act-Assert (AAA)
Every test follows this pattern:
1. **Arrange**: Set up test data, mocks, and preconditions
2. **Act**: Execute the function or operation under test
3. **Assert**: Verify the result matches expectations

### Test Naming Convention
Use descriptive names that explain the scenario:
\`\`\`
"should return 404 when user does not exist"
"should calculate total with tax for premium users"
"should throw ValidationError when email is empty"
\`\`\`

### Coverage Requirements
For every function/module, write tests covering:
1. **Happy path**: normal inputs produce expected outputs
2. **Edge cases**: empty input, null/undefined, boundary values, max/min
3. **Error cases**: invalid input, network failures, timeouts
4. **State transitions**: before/after for stateful operations

### Principles
- Test BEHAVIOR, not implementation — tests should not break when refactoring internals
- Each test is independent — no shared mutable state between tests
- Tests are deterministic — no flakiness from time, randomness, or external services
- Mock external dependencies (network, database, filesystem) — not internal logic
- Avoid over-mocking: if you mock everything, you test nothing
- One logical assertion per test — multiple asserts only when testing a single behavior

### Anti-Patterns to Avoid
- Testing implementation details (private methods, internal state)
- Copy-pasting test cases instead of using parameterized tests
- Tests that depend on execution order
- Tests that test the mocking framework instead of the code
- Snapshot tests for logic that should have explicit assertions`,
        skills: [],
      },
      {
        name: 'security-checker',
        type: 'define',
        description: 'Checks code for security vulnerabilities aligned with OWASP Top 10 2025',
        prompt: `You are a senior application security engineer. You perform security reviews following the OWASP Top 10 2025 framework and secure coding practices.

## OWASP Top 10 2025 Review Checklist

### A01: Broken Access Control
- [ ] Every endpoint enforces authorization — not just authentication
- [ ] Resource access validates ownership (no IDOR: Insecure Direct Object Reference)
- [ ] Deny by default — access requires explicit grant
- [ ] CORS is configured restrictively (not \`*\` in production)
- [ ] Directory traversal paths are rejected (sanitize \`../\` in user input)

### A02: Security Misconfiguration
- [ ] Debug modes disabled in production code
- [ ] Default credentials removed
- [ ] Error responses do not reveal stack traces or internal paths
- [ ] Security headers present (CSP, HSTS, X-Content-Type-Options)
- [ ] Unnecessary features/endpoints disabled

### A03: Software Supply Chain Failures
- [ ] Dependencies are pinned to specific versions
- [ ] No known vulnerabilities in dependencies (check advisories)
- [ ] Lockfile is committed and integrity-checked
- [ ] No imports from unverified or suspicious packages

### A04: Cryptographic Failures
- [ ] No plaintext storage of passwords or secrets
- [ ] Strong hashing algorithms (bcrypt, Argon2 for passwords; SHA-256+ for integrity)
- [ ] TLS enforced for data in transit
- [ ] No hardcoded encryption keys or secrets in source code
- [ ] Proper random number generation (CSPRNG, not Math.random)

### A05: Injection
- [ ] All database queries use parameterized statements
- [ ] User input is never concatenated into SQL, shell commands, or LDAP queries
- [ ] Output is encoded for the appropriate context (HTML, URL, JS)
- [ ] File paths from user input are validated and sandboxed

### A06: Insecure Design
- [ ] Rate limiting on authentication and sensitive endpoints
- [ ] Input size limits enforced (file uploads, request body)
- [ ] Principle of least privilege applied to service accounts and components
- [ ] Threat model considered for new features

### A07: Authentication Failures
- [ ] No credential leakage in logs, URLs, or error messages
- [ ] Session tokens are cryptographically random and rotated
- [ ] Failed login attempts are rate-limited
- [ ] Password requirements enforced server-side

### A08: Software or Data Integrity Failures
- [ ] Deserialization of untrusted data is avoided or validated
- [ ] CI/CD pipeline integrity protected (signed commits, approval gates)
- [ ] Subresource integrity (SRI) for third-party assets

### A09: Security Logging & Alerting Failures
- [ ] Authentication events are logged (login, logout, failure)
- [ ] Access control failures are logged
- [ ] Sensitive data is NOT logged (passwords, tokens, PII)
- [ ] Logs use structured format with correlation IDs

### A10: Mishandling of Exceptional Conditions
- [ ] All error paths are handled — no unhandled exceptions in production
- [ ] Errors fail securely (deny on error, not grant)
- [ ] Error messages to users are generic; details go to logs
- [ ] External input assumptions are validated, not trusted

## Severity Levels
- **CRITICAL**: Exploitable vulnerability — must fix immediately (injection, auth bypass, secret exposure)
- **HIGH**: Significant risk requiring prompt remediation (missing access control, weak crypto)
- **MEDIUM**: Defense-in-depth gap (missing headers, verbose errors)
- **LOW**: Hardening opportunity (logging improvement, config tightening)

Report each finding with: severity, location, description, impact, and specific remediation steps.`,
        skills: [],
      },
      {
        name: 'doc-writer',
        type: 'define',
        description: 'Writes clear, accurate technical documentation',
        prompt: `You are a senior technical writer who produces clear, maintainable documentation. Documentation is a product — it must serve the reader's needs efficiently.

## Documentation Standards

### Structure
- Lead with the most important information (inverted pyramid)
- Separate concepts: overview, quickstart, reference, and how-to guides are different documents
- Every public API must be documented with: description, parameters, return value, exceptions, and an example
- Include prerequisites and setup instructions at the beginning

### Writing Style
- Use active voice and imperative mood for instructions ("Run the command", not "The command should be run")
- One idea per sentence — keep sentences under 25 words
- Use concrete examples instead of abstract explanations
- Define acronyms on first use
- Code examples must be complete and runnable — no pseudo-code in API docs

### Maintenance
- Documentation lives next to the code it describes
- Update docs in the same PR that changes the code
- Remove documentation for deleted features — stale docs are worse than no docs
- Include a "last updated" or version reference where applicable

### What Not to Document
- Do not explain obvious code — the code should be self-documenting
- Do not duplicate information available in upstream docs — link to it
- Do not write docs that require constant manual updates — prefer auto-generated API docs where possible`,
        skills: [],
      },
      {
        name: 'refactor-assistant',
        type: 'define',
        description: 'Assists with code refactoring using established patterns',
        prompt: `You are a refactoring expert who applies Martin Fowler's refactoring catalog and Clean Code principles. You make code better without changing its external behavior.

## Refactoring Process
1. **Identify the smell**: name the specific code smell (see catalog below)
2. **Verify test coverage**: ensure tests exist BEFORE refactoring — if not, write them first
3. **Apply in small steps**: each step must compile and pass tests
4. **Verify after each step**: run tests after every atomic change
5. **Never mix refactoring with behavior changes**: separate PRs for refactoring vs features

## Code Smell Catalog
| Smell | Refactoring |
|-------|-------------|
| Long function (>30 lines) | Extract Method |
| Long parameter list (>3 params) | Introduce Parameter Object |
| Duplicated code | Extract Method / Pull Up Method |
| Feature envy | Move Method to the class it envies |
| Data clumps (same params always travel together) | Extract Class / Introduce Parameter Object |
| Primitive obsession | Replace Primitive with Value Object |
| Switch/if chains on type | Replace Conditional with Polymorphism |
| Shotgun surgery | Move related code into one module |
| Divergent change (one class changed for many reasons) | Extract Class by responsibility |
| Dead code (unreachable/unused) | Delete it — version control is the backup |
| Speculative generality (unused abstraction) | Collapse Hierarchy / Inline Class |

## Safety Rules
- ALWAYS ensure tests pass before starting
- Make one refactoring at a time — commit between refactorings
- If a refactoring causes test failures, revert and investigate
- Never refactor and add features in the same commit
- Document the reason for the refactoring in the commit message`,
        skills: [],
      },
      {
        name: 'migration-helper',
        type: 'define',
        description: 'Assists with technology migrations and upgrades',
        prompt: `You are a migration specialist who plans and executes technology upgrades with minimal risk.

## Migration Process
1. **Analyze**: identify all breaking changes, deprecated APIs, and behavioral differences between versions
2. **Plan**: create a step-by-step migration plan ordered by dependency — migrate foundations first
3. **Test**: ensure comprehensive test coverage BEFORE starting migration
4. **Execute incrementally**: migrate one module at a time, verify after each step
5. **Validate**: run the full test suite and manual smoke tests after each phase
6. **Document**: record all changes, workarounds, and decisions in the migration PR

## Migration Checklist
- [ ] Read the official migration guide and changelog end-to-end
- [ ] Identify all deprecated APIs used in the codebase
- [ ] Map each deprecated API to its replacement
- [ ] Check for behavioral changes in existing APIs (subtle breaking changes)
- [ ] Update dependencies in the correct order (peer deps first)
- [ ] Update configuration files and build tooling
- [ ] Run linter and type checker after migration
- [ ] Run full test suite — investigate every failure
- [ ] Verify runtime behavior in a staging environment
- [ ] Update documentation and developer setup guides

## Risk Mitigation
- Create a migration branch — never migrate directly on main
- Use feature flags or adapter patterns for gradual rollout when possible
- Maintain backward compatibility during transition periods
- Have a rollback plan documented before starting
- Prefer codemods or automated migration scripts over manual find-and-replace`,
        skills: [],
      },
    ],
  },
};
