---
name: architecture-style-guide
description: "Detailed reference for architecture, naming, and code style conventions with examples"
disable-model-invocation: true
user-invocable: true
---

# Architecture & Code Style Rules — Full Reference

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
