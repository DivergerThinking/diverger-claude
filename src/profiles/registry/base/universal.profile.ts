import type { Profile, HookScriptDefinition } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';
import { SENSITIVE_PATTERNS } from '../../../core/constants.js';
import {
  makePreToolUseBlockerScript,
  makeFilePatternCheckScript,
} from '../../hook-script-templates.js';

function buildUniversalHookScripts(): HookScriptDefinition[] {
  return [
    {
      filename: 'secret-scanner.sh',
      isPreToolUse: true,
      content: makePreToolUseBlockerScript({
        filename: 'secret-scanner.sh',
        inputField: '.tool_input.content',
        pattern: '(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[0-9a-zA-Z]{48}|ghp_[0-9a-zA-Z]{36}|-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----|password\\s*[:=]\\s*["\x27][^"\x27]{4,}|secret\\s*[:=]\\s*["\x27][^"\x27]{4,}|api[_-]?key\\s*[:=]\\s*["\x27][^"\x27]{4,})',
        reason: 'Potential secret or API key detected — blocked before writing',
      }),
    },
    {
      filename: 'destructive-cmd-blocker.sh',
      isPreToolUse: true,
      content: makePreToolUseBlockerScript({
        filename: 'destructive-cmd-blocker.sh',
        inputField: '.tool_input.command',
        pattern: '(git\\s+push\\s+--force|git\\s+push\\s+-f\\b|git\\s+reset\\s+--hard|rm\\s+-rf\\s+/|git\\s+clean\\s+-fd|git\\s+checkout\\s+--\\s+\\.|curl\\s+.*\\|\\s*(bash|sh|sudo)|wget\\s+.*\\|\\s*(bash|sh|sudo))',
        reason: 'Destructive or dangerous command detected — blocked for safety',
      }),
    },
    {
      filename: 'check-long-lines.sh',
      isPreToolUse: false,
      content: makeFilePatternCheckScript({
        filename: 'check-long-lines.sh',
        pattern: '^.{300,}$',
        message: 'Warning: file contains lines over 300 characters — consider wrapping',
        exitCode: 2,
      }),
    },
    {
      filename: 'check-trailing-newline.sh',
      isPreToolUse: false,
      content: `#!/bin/bash
# Check that file ends with a newline
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then exit 0; fi
if [ -s "$FILE_PATH" ]; then
  LAST_CHAR=$(tail -c 1 "$FILE_PATH" 2>/dev/null | od -An -tx1 | tr -d ' ')
  if [ "$LAST_CHAR" != "0a" ] && [ "$LAST_CHAR" != "" ]; then
    echo "Warning: file does not end with a newline" >&2
    exit 2
  fi
fi
exit 0
`,
    },
  ];
}

export const universalProfile: Profile = {
  id: 'base/universal',
  name: 'Universal Base',
  layer: PROFILE_LAYERS.BASE,
  technologyIds: [], // Base profiles always apply via layer === 0, no technology match needed
  contributions: {
    claudeMd: [
      {
        heading: 'Project Conventions',
        order: 0,
        content: `## Project Conventions

Clean Code, SOLID, and security-first development. Conventional Commits for all git messages.

**Detailed rules:** see \`.claude/rules/\` directory.

**Key principles:**
- Small functions (<30 lines), meaningful names, guard clauses over nesting
- Handle errors explicitly — no empty catch blocks, typed errors with context
- Parameterized queries, input validation, no hardcoded secrets (OWASP Top 10)
- Atomic commits in imperative mood, \`<type>[scope]: <description>\` format
- Profile before optimizing — prefer O(n) over O(n²), paginate large datasets`,
      },
    ],
    settings: {
      permissions: {
        deny: SENSITIVE_PATTERNS.map((p) => `Read(${p})`),
      },
    },
    hooks: [
      // C1: Secret scanner fires BEFORE write to block it
      {
        event: 'PreToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/secret-scanner.sh',
            timeout: 10,
            statusMessage: 'Scanning for secrets...',
          },
        ],
      },
      // S4: Destructive commands blocked BEFORE execution
      {
        event: 'PreToolUse',
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/destructive-cmd-blocker.sh',
            timeout: 10,
            statusMessage: 'Checking for destructive commands...',
          },
        ],
      },
      // Post-write quality checks (exit codes)
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/check-long-lines.sh',
            timeout: 5,
            statusMessage: 'Checking line lengths...',
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/check-trailing-newline.sh',
            timeout: 5,
            statusMessage: 'Checking trailing newline...',
          },
        ],
      },
    ],
    hookScripts: buildUniversalHookScripts(),
    rules: [
      {
        path: 'architecture-and-style.md',
        governance: 'mandatory',
        description: 'Universal architecture, naming, and code style rules',
        content: `# Architecture & Code Style Rules

## Project Structure
- Organize code by feature/domain, not by technical layer when the project grows beyond trivial size
- Keep entry points thin: they wire dependencies and delegate to domain logic
- Separate I/O (filesystem, network, database) from pure business logic
- Configuration should live at the top level, not be scattered through the code

## Naming Conventions
- Names must reveal intent: \`remainingRetries\` not \`r\` or \`cnt\`
- Boolean variables: \`isActive\`, \`hasPermission\`, \`shouldRetry\`, \`canEdit\`
- Functions describe WHAT they do: \`calculateTotalPrice()\` not \`process()\`
- PascalCase for classes/interfaces/types/enums
- Avoid generic names: \`Manager\`, \`Handler\`, \`Processor\`, \`Helper\`, \`Utils\` — be specific
- UPPER_SNAKE_CASE for true constants; replace magic numbers with named constants
- No single-letter variables except loop counters (\`i\`, \`j\`)

## Function Design
- **Single responsibility**: one function = one task
- **Max 30 lines**: if longer, extract sub-functions
- **Max 3 parameters**: use an options/config object for more
- **No flag parameters**: prefer two separate functions over a boolean that changes behavior
- **No side effects**: a function named \`getUser\` must not modify state
- **Guard clauses**: validate inputs early and return, avoiding deep nesting

## Comments
- Code should be self-documenting — comments explain "why", never "what"
- Use comments for: business rule context, non-obvious trade-offs, TODO with ticket reference
- Delete commented-out code — version control is the history
- Keep comments updated — stale comments are worse than no comments

## Error Handling
- Never use empty catch blocks — always log or rethrow with context
- Always handle Promise rejections and async errors
- Use specific error types over generic ones
- Distinguish operational errors (expected) from programmer errors (bugs)
- Do not use exceptions for control flow

For detailed examples and reference, invoke: /architecture-style-guide
`,
      },
      {
        path: 'security.md',
        governance: 'mandatory',
        description: 'Universal security rules aligned with OWASP Top 10 2025',
        content: `# Security Rules (OWASP Top 10 2025)

## A01: Broken Access Control
- Deny access by default; enforce authorization on every request, not just the UI
- Validate resource ownership (prevent IDOR); centralize access control logic

## A02: Security Misconfiguration
- No default credentials in production; disable debug modes and verbose errors
- Set security headers: CSP, X-Content-Type-Options, HSTS

## A03: Software Supply Chain Failures
- Pin dependency versions; audit regularly; verify lockfile integrity
- Minimize dependencies — prefer standard library when feasible

## A04: Cryptographic Failures
- Use established libraries only (AES-256, bcrypt/Argon2, SHA-256+)
- Never store passwords in plaintext; TLS 1.2+ for data in transit
- Never hardcode encryption keys or salts in source code

## A05: Injection
- ALWAYS use parameterized queries — never concatenate user input
- Validate all external input; use allowlists over denylists

## A06: Insecure Design
- Least privilege for all components; rate limiting on sensitive endpoints

## A07: Authentication Failures
- Strong passwords (min 12 chars), MFA for sensitive operations
- Secure sessions (HttpOnly, Secure, SameSite); throttle failed logins

## A08: Software or Data Integrity Failures
- Verify signatures on updates/artifacts; never deserialize untrusted data

## A09: Security Logging & Alerting Failures
- Log auth events and access control failures; never log sensitive data

## A10: Mishandling of Exceptional Conditions
- Handle all error paths; fail securely; never expose internals to users

## Sensitive Data Protection
- NEVER read, log, or output API keys, passwords, tokens, or private keys
- Use environment variables or secret managers — never hardcode credentials
- Handle PII with care — minimize collection, encrypt at rest, restrict access

For detailed examples and reference, invoke: /security-guide
`,
      },
      {
        path: 'git-workflow.md',
        governance: 'recommended',
        description: 'Git workflow and Conventional Commits guidelines',
        content: `# Git Workflow & Conventional Commits

## Conventional Commits Format (v1.0.0)
- Format: \`<type>[optional scope]: <description>\`
- Types: feat (MINOR), fix (PATCH), docs, style, refactor, perf, test, chore, ci, build, revert
- Breaking changes: footer \`BREAKING CHANGE: desc\` or \`feat(api)!: desc\` (triggers MAJOR)

## Branch Discipline
- Keep commits atomic — one logical change per commit
- Write commit subjects in imperative mood: "add feature" not "added feature"
- Subject line max 72 characters; body wraps at 80
- Squash WIP commits before merging to main
- Never commit generated files, build artifacts, or OS-specific files (.DS_Store, Thumbs.db)
- Never force-push to shared branches (main, develop, release/*)

## Pre-Commit Checklist
- Code compiles without errors
- All tests pass
- No secrets or credentials in the diff
- Commit message follows Conventional Commits format
- Changes are scoped to one logical change

For detailed examples and reference, invoke: /git-workflow-guide
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'define',
        model: 'sonnet',
        memory: 'project',
        description: 'Reviews code for quality, security, and best practices',
        prompt: `You are an expert code reviewer. Reference concrete line numbers in every finding.

## Checklist
1. **Architecture**: SRP, OCP, DIP, no god objects, I/O separated from logic
2. **Quality**: intent-revealing names, functions <30 lines/<4 params, no nesting >3, no dead code, no magic numbers
3. **Errors**: no empty catch, async errors handled, context in errors, no leaked internals
4. **Security**: no hardcoded secrets, input validation, parameterized queries, output encoding, access control, no PII in logs
5. **Performance**: no O(n²) when O(n) works, no allocations in loops, paginate large data
6. **Tests**: new logic has tests covering happy path + edge + error cases

## Output: CRITICAL | WARNING | SUGGESTION | POSITIVE — explain WHY, not just WHAT.

For detailed rules, invoke: /architecture-style-guide, /security-guide`,
        skills: ['architecture-style-guide', 'security-guide'],
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
        name: 'security-reviewer',
        type: 'define',
        model: 'sonnet',
        description: 'Reviews code for security vulnerabilities (OWASP Top 10 2025)',
        prompt: `You are a senior application security engineer reviewing code against OWASP Top 10 2025.

## Quick Checklist
- A01: Authorization on every endpoint, IDOR prevention, deny-by-default
- A02: No debug in prod, no default creds, security headers set
- A03: Pinned deps, lockfile committed, no untrusted packages
- A04: No plaintext passwords, strong crypto, no hardcoded keys, CSPRNG
- A05: Parameterized queries, no input concatenation in SQL/shell, output encoding
- A06: Rate limiting, input size limits, least privilege
- A07: No credential leaks, secure sessions, login throttling
- A08: No unsafe deserialization, CI/CD integrity
- A09: Auth events logged, no PII in logs, structured format
- A10: All error paths handled, fail securely, generic user errors

## Severity: CRITICAL > HIGH > MEDIUM > LOW
Report: severity, location, description, impact, remediation.

For detailed rules, invoke: /security-guide`,
        skills: ['security-guide'],
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
    skills: [
      {
        name: 'architecture-style-guide',
        description: 'Detailed reference for architecture, naming, and code style conventions with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Architecture & Code Style Rules — Full Reference

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
\\\`\\\`\\\`
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
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`
src/
  controllers/
    auth.controller.ts
    orders.controller.ts
  services/
    auth.service.ts
    orders.service.ts
  # Problem: changing one feature requires touching many directories
\\\`\\\`\\\`

---

## Naming Conventions

### Variables & Functions
- Names must reveal intent: \\\`remainingRetries\\\` not \\\`r\\\` or \\\`cnt\\\`
- Boolean variables: \\\`isActive\\\`, \\\`hasPermission\\\`, \\\`shouldRetry\\\`, \\\`canEdit\\\`
- Functions describe WHAT they do: \\\`calculateTotalPrice()\\\` not \\\`process()\\\` or \\\`doStuff()\\\`
- Event handlers: \\\`onUserLogin\\\`, \\\`handlePaymentComplete\\\`
- Avoid mental mapping: no single-letter variables except loop counters (\\\`i\\\`, \\\`j\\\`)

### Classes & Types
- PascalCase for classes, interfaces, types, enums
- Avoid generic names: \\\`Manager\\\`, \\\`Handler\\\`, \\\`Processor\\\`, \\\`Helper\\\`, \\\`Utils\\\` — be specific
- Name interfaces by capability: \\\`Serializable\\\`, \\\`Cacheable\\\`, \\\`Retryable\\\`

### Constants & Configuration
- UPPER_SNAKE_CASE for true constants (compile-time or environment-level)
- Replace magic numbers with named constants: \\\`MAX_RETRY_COUNT = 3\\\` not just \\\`3\\\`

### Anti-Pattern Examples
\\\`\\\`\\\`
// Bad: meaningless names
const d = new Date();
const x = getItems().filter(i => i.a > 5);
function proc(data) { /* ... */ }

// Good: intention-revealing names
const signupDeadline = new Date();
const expensiveItems = getItems().filter(item => item.price > MIN_PRICE);
function filterExpiredSubscriptions(subscriptions) { /* ... */ }
\\\`\\\`\\\`

---

## Function Design

- **Single responsibility**: one function = one task
- **Max 30 lines**: if longer, extract sub-functions
- **Max 3 parameters**: use an options/config object for more
- **No flag parameters**: prefer two separate functions over a boolean that changes behavior
- **No side effects**: a function named \\\`getUser\\\` must not modify state
- **Guard clauses**: validate inputs early and return, avoiding deep nesting

### Correct
\\\`\\\`\\\`
function calculateDiscount(order) {
  if (!order.items.length) return 0;
  if (order.isEmployee) return order.total * 0.30;
  if (order.total > 100) return order.total * 0.10;
  return 0;
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`
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
\\\`\\\`\\\`

---

## Comments
- Code should be self-documenting — comments explain "why", never "what"
- Use comments for: business rule context, non-obvious trade-offs, TODO with ticket reference
- Delete commented-out code — version control is the history
- Keep comments updated — stale comments are worse than no comments

### Correct
\\\`\\\`\\\`
// Rate limit applies only to free-tier users per billing agreement (PROJ-1234)
if (user.tier === 'free' && requestCount > RATE_LIMIT) { ... }
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`
// Check if user is free and request count is greater than rate limit
if (user.tier === 'free' && requestCount > RATE_LIMIT) { ... }
// Problem: comment restates the code, adds no information
\\\`\\\`\\\`

---

## Error Handling
- Never use empty catch blocks — always log or rethrow with context
- Always handle Promise rejections and async errors
- Use specific error types over generic ones
- Distinguish operational errors (expected: network timeout) from programmer errors (bugs: null reference)
- Do not use exceptions for control flow

### Correct
\\\`\\\`\\\`
try {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError(\\\`User \\\${id} not found\\\`);
  return user;
} catch (error) {
  if (error instanceof NotFoundError) throw error;
  throw new DatabaseError('Failed to fetch user', { cause: error, userId: id });
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`
try {
  const user = await userRepository.findById(id);
  return user;
} catch (error) {
  // silently swallowed — caller never knows the operation failed
}
\\\`\\\`\\\`
`,
      },
      {
        name: 'security-guide',
        description: 'Detailed reference for OWASP Top 10 2025 security rules with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Security Rules (OWASP Top 10 2025) — Full Reference

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
\\\`\\\`\\\`
async function getOrder(orderId, currentUser) {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (order.userId !== currentUser.id && !currentUser.hasRole('admin')) {
    throw new ForbiddenError('Access denied');
  }
  return order;
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`
async function getOrder(orderId) {
  // No authorization check — any authenticated user can access any order
  return await orderRepo.findById(orderId);
}
\\\`\\\`\\\`

---

## A02: Security Misconfiguration
- Never use default credentials or configurations in production
- Disable debug modes, verbose error pages, and directory listings in production
- Set security headers: Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security
- Keep dependencies and runtime patched

---

## A03: Software Supply Chain Failures
- Pin dependency versions — avoid \\\`latest\\\` or floating ranges in production
- Audit dependencies regularly: \\\`npm audit\\\`, \\\`pip audit\\\`, \\\`cargo audit\\\`
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
\\\`\\\`\\\`
// Parameterized query — safe from injection
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`
// String concatenation — SQL injection vulnerability
const user = await db.query('SELECT * FROM users WHERE id = ' + userId);
\\\`\\\`\\\`

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
\\\`\\\`\\\`
try {
  const result = await paymentGateway.charge(amount);
  return { success: true, transactionId: result.id };
} catch (error) {
  logger.error('Payment failed', { amount, errorCode: error.code });
  return { success: false, message: 'Payment could not be processed' };
  // User sees generic message; details are logged server-side
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`
try {
  const result = await paymentGateway.charge(amount);
  return { success: true, transactionId: result.id };
} catch (error) {
  return { success: false, message: error.stack };
  // Leaks internal stack trace, file paths, and library versions to the client
}
\\\`\\\`\\\`

---

## Sensitive Data Protection
- NEVER read, log, or output API keys, passwords, tokens, or private keys
- Do not access .env files, .pem files, or credential stores from application code that could expose them
- Handle PII with care — minimize collection, encrypt at rest, restrict access
- Use environment variables or secret managers for credentials — never hardcode them
`,
      },
      {
        name: 'git-workflow-guide',
        description: 'Detailed reference for Git workflow and Conventional Commits with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Git Workflow & Conventional Commits — Full Reference

## Why This Matters
A disciplined Git workflow enables reliable releases, meaningful changelogs, and painless
collaboration. Conventional Commits provide a structured format that can be parsed by
tooling for automatic versioning and changelog generation.

---

## Conventional Commits Format (v1.0.0)

\\\`\\\`\\\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\\\`\\\`\\\`

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
- Footer: \\\`BREAKING CHANGE: description\\\`
- Prefix: \\\`feat(api)!: remove deprecated endpoint\\\`

Breaking changes trigger a MAJOR version bump.

### Examples
\\\`\\\`\\\`
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
\\\`\\\`\\\`

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
  },
};
