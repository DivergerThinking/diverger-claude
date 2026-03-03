---
name: security-guide
description: Detailed reference for OWASP Top 10 2025 security rules with examples
disable-model-invocation: true
user-invocable: true
---

# Security Rules (OWASP Top 10 2025) — Full Reference

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
