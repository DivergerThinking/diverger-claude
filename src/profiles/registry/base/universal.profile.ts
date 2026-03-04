import type { Profile, HookScriptDefinition } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';
import { SENSITIVE_PATTERNS } from '../../../core/constants.js';
import {
  makePreToolUseBlockerScript,
  makeFilePatternCheckScript,
  nodeJsonExtract,
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
      filename: 'pre-commit-validator.sh',
      isPreToolUse: true,
      content: `#!/bin/bash
# PreToolUse blocker: Validate commit prerequisites before allowing git commit
# Blocks commits when plugin build is stale or TypeScript has errors
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | node -e "${nodeJsonExtract('.tool_input.command')}")

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^\\s*git\\s+commit'; then
  exit 0
fi

ERRORS=""

# Check 1: Plugin version consistency (package.json must match plugin.json)
if [ -f "package.json" ] && [ -f "plugin/.claude-plugin/plugin.json" ]; then
  PKG_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version||'')}catch{console.log('')}")
  PLUGIN_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('plugin/.claude-plugin/plugin.json','utf8')).version||'')}catch{console.log('')}")
  if [ -n "$PKG_VERSION" ] && [ -n "$PLUGIN_VERSION" ] && [ "$PKG_VERSION" != "$PLUGIN_VERSION" ]; then
    ERRORS="\${ERRORS}Plugin build stale: package.json=\${PKG_VERSION} but plugin.json=\${PLUGIN_VERSION}. Run npm run build:plugin first. "
  fi
fi

# Check 2: TypeScript compilation (only if tsconfig.json exists)
if [ -f "tsconfig.json" ] && command -v npx >/dev/null 2>&1; then
  TSC_OUTPUT=$(npx tsc --noEmit --pretty false 2>&1 || true)
  TSC_EXIT=$?
  if echo "$TSC_OUTPUT" | grep -qE 'error TS[0-9]+'; then
    TSC_COUNT=$(echo "$TSC_OUTPUT" | grep -cE 'error TS[0-9]+' || echo "0")
    ERRORS="\${ERRORS}TypeScript compilation: \${TSC_COUNT} error(s) detected. Fix type errors before committing. "
  fi
fi

# If errors found, deny the commit
if [ -n "$ERRORS" ]; then
  node -e "console.log(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:'Pre-commit validation failed: '+process.argv[1]}}))" -- "$ERRORS"
  exit 0
fi

# All checks passed
exit 0
`,
    },
    {
      filename: 'check-trailing-newline.sh',
      isPreToolUse: false,
      content: `#!/bin/bash
# Check that file ends with a newline
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "${nodeJsonExtract('.tool_input.file_path')}")
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
        allow: [
          'Bash(git:*)',
        ],
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
      // Pre-commit validation: block commits with stale builds or type errors
      {
        event: 'PreToolUse',
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/pre-commit-validator.sh',
            timeout: 30,
            statusMessage: 'Validating commit prerequisites...',
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
        path: 'development-process.md',
        governance: 'recommended',
        description: 'Development process rules for build, commit, and CI awareness',
        isDynamic: true,
        content: `# Development Process Rules

## Pre-commit Checklist
Before committing, always verify:
{{BUILD_COMMANDS}}

## After Modifying Source Code
- If the project has a build step: rebuild before committing
- If you changed config files (CI, Docker, etc.): verify they are syntactically valid
- If you added new modules: ensure they are properly exported/registered

## CI Awareness
- Check recent CI status before starting work: \`gh run list --limit 3\`
- If CI is failing, prioritize fixing it before new work
- After pushing, verify CI passes: \`gh run watch\`
`,
      },
      {
        path: 'architecture-and-style.md',
        governance: 'mandatory',
        description: 'Universal architecture, naming, and code style rules',
        content: `# Architecture & Code Style Rules

Clean Code, SOLID, and security-first development. Conventional Commits for all git messages.

**Key principles:**
- Small functions (<30 lines), meaningful names, guard clauses over nesting
- Handle errors explicitly — no empty catch blocks, typed errors with context
- Parameterized queries, input validation, no hardcoded secrets (OWASP Top 10)
- Atomic commits in imperative mood, \`<type>[scope]: <description>\` format
- Profile before optimizing — prefer O(n) over O(n²), paginate large datasets

For detailed examples and reference, invoke: /architecture-style-guide
`,
      },
      {
        path: 'security.md',
        governance: 'mandatory',
        description: 'Universal security rules aligned with OWASP Top 10 2025',
        content: `# Security Rules (OWASP Top 10 2025)

Security-first development. Parameterized queries, input validation, no hardcoded secrets.

**Key rules:**
- Deny access by default; validate resource ownership (prevent IDOR)
- ALWAYS use parameterized queries — never concatenate user input
- Pin dependency versions; audit regularly; verify lockfile integrity
- Use established crypto libraries only; never store passwords in plaintext
- Least privilege for all components; rate limiting on sensitive endpoints
- NEVER read, log, or output API keys, passwords, tokens, or private keys
- Use environment variables or secret managers — never hardcode credentials
- Handle all error paths; fail securely; never expose internals to users

For detailed examples and reference, invoke: /security-guide
`,
      },
      {
        path: 'git-workflow.md',
        governance: 'recommended',
        description: 'Git workflow and Conventional Commits guidelines',
        content: `# Git Workflow & Conventional Commits

Atomic commits in Conventional Commits format. Imperative mood, scoped changes, no secrets in diffs.

**Key rules:**
- Format: \`<type>[optional scope]: <description>\`
- Types: feat (MINOR), fix (PATCH), docs, style, refactor, perf, test, chore, ci, build, revert
- Breaking changes: footer \`BREAKING CHANGE: desc\` or \`feat(api)!: desc\` (triggers MAJOR)
- Keep commits atomic — one logical change per commit
- Subject line max 72 characters; imperative mood ("add" not "added")
- Never commit generated files, build artifacts, or secrets
- Never force-push to shared branches (main, develop, release/*)

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

This checklist is automatically enriched based on the detected technology stack — language idioms, framework conventions, and infrastructure constraints are layered in by diverger profiles.
Tech-specific reference skills may be available for deeper guidance (e.g., /react-hooks-guide, /ts-conventions-guide, /go-patterns-guide). Invoke them when reviewing stack-specific patterns.

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
- Snapshot tests for logic that should have explicit assertions

Testing patterns are adapted to the detected stack — the test runner, assertion style, mocking approach, and file conventions are determined by the active diverger profiles.
Framework-specific testing guidance (e.g., React Testing Library patterns, pytest fixtures, Go table-driven tests) is embedded when the corresponding technology is detected.`,
        skills: [],
      },
      {
        name: 'security-checker',
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

Security checks are adapted to the detected stack — language-specific vulnerability patterns, framework security middleware, and infrastructure hardening rules are layered in by diverger profiles.
Tech-specific security guides may be available (e.g., /node-security-guide, /django-security-guide, /docker-security-guide). Invoke them for stack-targeted remediation advice.

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

## Stack-Aware Refactoring
Refactoring patterns are adapted to the detected technology stack — language idioms, framework lifecycle methods, and project structure conventions are taken into account by diverger profiles.
For example: extracting a React component follows different patterns than extracting a Go interface or restructuring a Django app.

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
      {
        name: 'diverger-doctor',
        description: 'Diagnose project health with a 0-100 score across 6 categories',
        userInvocable: true,
        allowedTools: [
          'Read',
          'Glob',
          'Grep',
          'Bash',
          'mcp__diverger-claude__detect_stack',
          'mcp__diverger-claude__check_config',
          'mcp__diverger-claude__check_plugin_health',
        ],
        content: `# Diverger Doctor — Project Health Diagnostic

You are a project health diagnostician. Your job is to evaluate the current project
across 6 categories and produce a weighted health score from 0 to 100.

## Step 1: Detect the Stack

Use the \\\`mcp__diverger-claude__detect_stack\\\` MCP tool to identify the project's
technology stack. This determines which package manager, test runner, linter, and
security audit commands to use in subsequent steps.

## Step 2: Run 6 Diagnostic Categories

Run each category in order. For each, assign a score from 0 to 100.

### Category 1: Config Health (weight: 25%)
- Use \\\`mcp__diverger-claude__check_config\\\` to validate the .claude/ configuration.
- Score 100 if all checks pass with no warnings or errors.
- Deduct 15 points per error, 5 points per warning. Minimum score: 0.

### Category 2: Plugin Health (weight: 15%)
- Use \\\`mcp__diverger-claude__check_plugin_health\\\` to run plugin diagnostics.
- Score 100 if all health checks pass.
- Deduct points proportionally: score = (passing_checks / total_checks) * 100.

### Category 3: Dependency Freshness (weight: 15%)
- Based on detected stack, run the appropriate outdated check:
  - Node/npm: \\\`npm outdated --json\\\`
  - Node/pnpm: \\\`pnpm outdated --format json\\\`
  - Python/pip: \\\`pip list --outdated --format json\\\`
  - Go: \\\`go list -m -u all\\\`
  - Rust: \\\`cargo outdated --format json\\\` (if cargo-outdated installed)
  - Other: skip this category, assign score 50 (neutral).
- Score = (up_to_date_packages / total_packages) * 100. If no packages found, score 100.

### Category 4: Test Coverage (weight: 20%)
- Based on detected stack, run the test command with coverage:
  - Node/vitest: \\\`npx vitest run --coverage --reporter=json\\\`
  - Node/jest: \\\`npx jest --coverage --json\\\`
  - Python/pytest: \\\`pytest --cov --cov-report=json\\\`
  - Go: \\\`go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out\\\`
  - Other: check if a coverage report file exists; if not, assign score 50 (neutral).
- Extract the overall line/statement coverage percentage. Score = that percentage.
- If tests fail to run, score 0 and note the failure.

### Category 5: Security (weight: 15%)
- Based on detected stack, run the appropriate security audit:
  - Node/npm: \\\`npm audit --json\\\`
  - Node/pnpm: \\\`pnpm audit --json\\\`
  - Python: \\\`pip-audit --format json\\\` or \\\`safety check --json\\\`
  - Rust: \\\`cargo audit --json\\\`
  - Go: \\\`govulncheck ./...\\\`
  - Other: skip, assign score 75 (neutral-optimistic).
- Score: 100 if no vulnerabilities. Deduct 5 per low, 10 per moderate, 20 per high, 30 per critical. Minimum: 0.

### Category 6: Code Quality (weight: 10%)
- Based on detected stack, run the linter:
  - Node: \\\`npx eslint . --format json\\\` or check for biome/oxlint config
  - Python: \\\`ruff check --format json .\\\` or \\\`flake8 --format json\\\`
  - Go: \\\`golangci-lint run --out-format json\\\`
  - Rust: \\\`cargo clippy --message-format json\\\`
  - Other: skip, assign score 75 (neutral-optimistic).
- Score: 100 if 0 issues. Deduct 2 per warning, 5 per error. Minimum: 0.

## Step 3: Calculate Weighted Total Score

Compute the final score using these weights:
- Config Health:        score * 0.25
- Plugin Health:        score * 0.15
- Dependency Freshness: score * 0.15
- Test Coverage:        score * 0.20
- Security:             score * 0.15
- Code Quality:         score * 0.10

Total = sum of weighted scores, rounded to nearest integer.

## Step 4: Output Results Table

Present results in this exact format:

\\\`\\\`\\\`
=== DIVERGER DOCTOR — Project Health Report ===

Category              Score   Weight   Weighted   Status
-----------------------------------------------------
Config Health           XX    25%       XX.X      [indicator]
Plugin Health           XX    15%       XX.X      [indicator]
Dependency Freshness    XX    15%       XX.X      [indicator]
Test Coverage           XX    20%       XX.X      [indicator]
Security                XX    15%       XX.X      [indicator]
Code Quality            XX    10%       XX.X      [indicator]
-----------------------------------------------------
TOTAL SCORE:            XX / 100       [overall indicator]
\\\`\\\`\\\`

Status indicators:
- Score >= 80: GREEN (healthy)
- Score 50-79: YELLOW (needs attention)
- Score < 50:  RED (critical)

Overall indicator:
- >= 80: HEALTHY
- 50-79: FAIR
- < 50:  UNHEALTHY

## Step 5: Top 3 Actionable Recommendations

Sort categories by score (ascending). For the 3 lowest-scoring categories,
provide one concrete, actionable recommendation each. Format:

1. **[Category Name] (score: XX)**: [Specific action to improve, e.g.,
   "Run npm audit fix to resolve 3 moderate vulnerabilities"]
2. ...
3. ...

If all categories score >= 80, congratulate the project and suggest
one area for further improvement.

## Step 6: Record Findings

Use \\\`mcp__diverger-claude__record_learning\\\` to save the diagnostic results with:
- type: "diagnostic"
- context: "diverger-doctor health check"
- content: summary including total score, date, and per-category scores

This enables tracking health trends over time.

## Important Notes
- If a tool or command is not available, assign the neutral score noted above for that category.
- Do NOT install missing tools — just note them as unavailable and score neutrally.
- Run all commands with reasonable timeouts. If a command hangs, skip it.
- Always show the full table even if some categories were skipped.
`,
      },
      {
        name: 'diverger-quickstart',
        description: 'Guided onboarding after diverger init — explore your configuration in 5 minutes',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Diverger Quickstart — Explore Your Configuration in 5 Minutes

You just ran \\\`diverger init\\\` (or the \\\`generate_config\\\` MCP tool). Follow these steps
to understand and get the most out of your new \\\`.claude/\\\` configuration.

---

## Step 1: Verify your configuration
Confirm that \\\`.claude/\\\` was generated with rules, agents, skills, and hooks:
\\\`\\\`\\\`
ls .claude/rules/ .claude/agents/ .claude/skills/ .claude/hooks/
\\\`\\\`\\\`
You should see files matching your detected stack (e.g., \\\`typescript.md\\\`, \\\`react.md\\\`).

## Step 2: Run /diverger-status
See your detected stack, applied profiles, and configuration summary:
\\\`\\\`\\\`
/diverger-status
\\\`\\\`\\\`

## Step 3: Run /diverger-doctor
Get your initial project health score and identify any configuration issues:
\\\`\\\`\\\`
/diverger-doctor
\\\`\\\`\\\`

## Step 4: Explore your rules
Browse \\\`.claude/rules/\\\` to see what guidelines were generated for your stack.
Each rule file covers a specific concern — architecture, security, git workflow,
plus language- and framework-specific conventions.

## Step 5: Discover available commands
List all slash commands available for your detected technologies:
\\\`\\\`\\\`
/commands
\\\`\\\`\\\`
Stack-adapted skills like style guides, testing helpers, and review tools will appear.

## Step 6: Try a code review
Use the \\\`code-reviewer\\\` agent on a recent file to see a stack-adapted review:
\\\`\\\`\\\`
@code-reviewer Review src/path/to/recent-file.ts
\\\`\\\`\\\`
The reviewer applies your detected stack's conventions automatically.

## Step 7: Next steps
- \\\`/diverger-audit\\\` — Full audit of your project configuration and code quality
- \\\`/diverger-test-suite\\\` — Identify test coverage gaps and generate missing tests
- \\\`/diverger-check\\\` — Validate configuration governance and detect drift
- Edit \\\`.claude/rules/\\\` files to customize rules for your team's preferences
`,
      },
      {
        name: 'diverger-welcome',
        description: 'Quick project briefing: detected stack, recent activity, available commands, and session context',
        userInvocable: true,
        content: `# Project Briefing — Welcome

You are a project briefing assistant. Your job is to quickly orient the developer
by presenting the most useful information about the current project in a concise format.

## Step 1: Project Identity

Read the following files (skip any that don't exist):
- CLAUDE.md — look for "About This Project" section
- package.json / pubspec.yaml / Cargo.toml / pyproject.toml / go.mod — name and description
- README.md — first paragraph

Present: project name, one-line description, architecture pattern if detected.

## Step 2: Git Status

Run these commands and present results concisely:
- \\\`git branch --show-current\\\` — current branch
- \\\`git log --oneline -5\\\` — last 5 commits
- \\\`git status --short\\\` — uncommitted changes (if any)
- \\\`git stash list\\\` — stashed changes (if any)

## Step 3: Available Commands

Read package.json scripts (or Makefile targets, or pyproject.toml scripts) and list
the key development commands: build, test, lint, dev, start.
Use the package manager detected from lockfiles (npm/yarn/pnpm/bun/pip/cargo/go).

## Step 4: Key Directories

List the main directories that exist in the project root (src/, lib/, tests/, docs/, etc.)
with a one-line purpose based on their conventional meaning.

## Step 5: Quick Health Indicators

Run lightweight checks only (no long-running commands):
- Does a lockfile exist? (dependency management)
- Does \\\`.claude/\\\` directory exist? (diverger configured)
- Is there a CI config? (.github/workflows/, .gitlab-ci.yml, Jenkinsfile, etc.)
- Count TODO/FIXME/HACK comments (quick grep, show count only)

## Output Format

Present results as a compact briefing (under 40 lines):

\\\`\\\`\\\`
=== PROJECT BRIEFING ===

[Project Name] — [description]
Branch: [branch] | Last commit: [time-ago] by [author]
[N] uncommitted changes | [N] stashed changes

--- Recent Activity (last 5 commits) ---
[commit list]

--- Commands ---
[command list with package manager prefix]

--- Directories ---
[directory list]

--- Health ---
[lockfile] [ci] [diverger] [todos count]
\\\`\\\`\\\`

## Important Notes
- Be FAST. Do not run build, test, or lint commands. Only read files and run git commands.
- If a file does not exist, skip that section silently.
- Keep the total output under 40 lines.
- This skill works for ANY technology — do not assume any specific language or framework.
`,
      },
      {
        name: 'diverger-triage',
        description: 'Triage open GitHub issues: analyze codebase, respond intelligently, generate local implementation plans',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Triage de Issues de GitHub

Analiza issues abiertas, responde con conocimiento del codebase y genera planes locales accionables: $ARGUMENTS

## Objetivo

Convertir cada issue abierta en una **respuesta inteligente** (comment en GitHub) + un **plan local accionable** (archivo en \\\`docs/plans/partners_contributions/\\\`). El plan debe ser lo suficientemente detallado para que otra sesion de Claude lo ejecute sin ambiguedad.

## Pasos

### 1. Verificar prerrequisitos

- Ejecuta: \\\`gh auth status\\\` — si falla, informa al usuario y termina
- Verifica que existe directorio \\\`docs/plans/partners_contributions/\\\` — si no, crealo

### 2. Listar issues abiertas

- Ejecuta: \\\`gh issue list --state open --json number,title,body,author,labels,createdAt,comments\\\`
- Si se paso un numero de issue como argumento ($ARGUMENTS), filtra solo esa issue
- Si no hay issues abiertas, informa al usuario y termina
- Muestra resumen: N issues abiertas con numero y titulo

### 3. Para cada issue, analizar en profundidad

**3a. Leer la issue completa:**
- \\\`gh issue view {number} --json number,title,body,author,labels,comments\\\`
- Identifica: que pide exactamente, que contexto da, que preguntas hace

**3b. Clasificar:**
- **feature-request**: Nueva funcionalidad o extension de arquitectura
- **bug**: Error o comportamiento inesperado
- **profile-request**: Soporte para nueva tecnologia/framework
- **question**: Pregunta sobre uso o documentacion
- **already-implemented**: La funcionalidad ya existe (verificar buscando en el codebase)
- **duplicate**: Duplicado de otra issue abierta (comparar con las demas)

**3c. Investigar el codebase:**
- Busca archivos, modulos y tests relevantes a lo que pide la issue
- Entiende la arquitectura actual relacionada con la peticion
- Identifica que existe hoy, que falta, y que habria que cambiar
- Si es \\\`already-implemented\\\`: localiza exactamente donde esta implementado

### 4. Responder en la issue (comment inteligente)

El comment debe demostrar que **entendemos el codebase y la peticion**:

- NUNCA uses respuestas genericas tipo "un mantenedor lo revisara"
- Siempre referencia archivos reales del codebase (paths relativos)
- Si la issue hace preguntas, responde CADA una
- Si clasificas como \\\`already-implemented\\\`, da instrucciones exactas de uso
- Incluye: saludo contextual, respuesta a preguntas, estado actual de la arquitectura,
  propuesta o siguiente paso
- Ejecuta: \\\`gh issue comment {number} --body "..."\\\`

### 5. Generar plan local (para issues accionables)

Solo para issues clasificadas como \\\`feature-request\\\`, \\\`bug\\\`, o \\\`profile-request\\\`.

Crea archivo: \\\`docs/plans/partners_contributions/issue-{number}-{slug}.md\\\`
donde slug = titulo en kebab-case (max 40 chars)

El plan debe incluir:
- **Tabla de contexto**: issue link, autor, fecha, labels, clasificacion
- **Resumen de la peticion**: 2-3 frases
- **Analisis del estado actual**: archivos, modulos, tipos relevantes con paths concretos
- **Plan de implementacion**: fases con tabla de archivos a crear/modificar
- **Tests**: que tests crear y que validan
- **Verificacion**: pasos para validar (typecheck, test, build)
- **Complejidad estimada**: Baja/Media/Alta con justificacion

### 6. Actualizar labels

- Si clasificaste como \\\`already-implemented\\\`: anade label, sugiere cerrar con comment
- Si generaste plan: anade label \\\`planned\\\`
- Ejecuta: \\\`gh issue edit {number} --add-label {label}\\\`

### 7. Resumen final

Muestra tabla con cada issue procesada: numero, titulo, clasificacion, plan generado, accion tomada

## Notas importantes
- Usa \\\`gh\\\` CLI para toda interaccion con GitHub
- **No cierres issues automaticamente** — solo sugiere cerrar con comment
- Los planes van en \\\`docs/plans/partners_contributions/\\\` (NO en docs/plans/ raiz)
- Invierte tiempo en investigar el codebase ANTES de responder
- Si no puedes acceder al repo con \\\`gh\\\`, informa y termina
`,
      },
    ],
  },
};
