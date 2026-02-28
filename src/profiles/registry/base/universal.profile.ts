import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';
import { SENSITIVE_PATTERNS } from '../../../core/constants.js';

export const universalProfile: Profile = {
  id: 'base/universal',
  name: 'Universal Base',
  layer: PROFILE_LAYERS.BASE,
  technologyIds: ['*'],
  contributions: {
    claudeMd: [
      {
        heading: 'Code Quality Standards',
        order: 0,
        content: `## Code Quality Standards

- Follow clean code principles: meaningful names, small functions, single responsibility
- Apply SOLID principles where appropriate
- Prefer composition over inheritance
- Keep functions under 30 lines when possible
- No commented-out code in production
- DRY: Don't Repeat Yourself, but don't over-abstract prematurely
- YAGNI: You Aren't Gonna Need It - only build what's currently needed
- Prefer explicit over implicit behavior`,
      },
      {
        heading: 'Git Conventions',
        order: 1,
        content: `## Git Conventions

- Write clear, descriptive commit messages
- Use conventional commits format: type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore, perf, ci
- Keep commits atomic - one logical change per commit
- Never commit secrets, credentials, or API keys`,
      },
      {
        heading: 'Error Handling',
        order: 2,
        content: `## Error Handling

- Handle errors explicitly, never silently swallow them
- Use typed error classes when possible
- Log errors with sufficient context for debugging
- Fail fast on unrecoverable errors
- Provide meaningful error messages to users`,
      },
    ],
    settings: {
      permissions: {
        deny: SENSITIVE_PATTERNS.map((p) => `Read(${p})`),
      },
    },
    rules: [
      {
        path: 'code-style.md',
        governance: 'mandatory',
        description: 'Universal code style rules',
        content: `# Code Style Rules

## Naming Conventions
- Use descriptive, meaningful names
- Boolean variables should start with is/has/should/can
- Functions should describe what they do, not how

## Functions
- Keep functions focused on a single task
- Avoid side effects when possible
- Prefer pure functions for business logic

## Comments
- Code should be self-documenting
- Only add comments for "why", not "what"
- Keep comments up to date with code changes

## Error Handling
- Never use empty catch blocks
- Always handle Promise rejections
- Use specific error types over generic ones
`,
      },
      {
        path: 'security.md',
        governance: 'mandatory',
        description: 'Universal security rules',
        content: `# Security Rules

## Sensitive Data
- NEVER read, log, or output API keys, passwords, or tokens
- Do not access .env files, .pem files, or credential stores
- When handling user data, be aware of PII regulations

## Input Validation
- Always validate external input (user input, API responses)
- Use parameterized queries for database operations
- Sanitize output to prevent XSS

## Dependencies
- Be cautious about adding new dependencies
- Prefer well-maintained, widely-used packages
- Check for known vulnerabilities before adding
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'define',
        description: 'Reviews code for quality, security, and best practices',
        prompt: `You are an expert code reviewer. Review the code for:

## General Review Criteria
- Code quality and readability
- SOLID principles adherence
- Error handling completeness
- Security vulnerabilities (OWASP Top 10)
- Performance anti-patterns
- Test coverage gaps

Provide specific, actionable feedback with line references.
Format your review as:
- 🔴 Critical: Must fix before merge
- 🟡 Warning: Should fix, but not blocking
- 🟢 Suggestion: Nice to have improvement`,
        skills: [],
      },
      {
        name: 'test-writer',
        type: 'define',
        description: 'Writes comprehensive tests for code',
        prompt: `You are an expert test writer. Write tests that:

## Testing Principles
- Test behavior, not implementation
- Follow the Arrange-Act-Assert pattern
- Cover happy path, edge cases, and error cases
- Use descriptive test names that explain the scenario
- Keep tests independent and deterministic
- Avoid testing implementation details`,
        skills: [],
      },
      {
        name: 'security-checker',
        type: 'define',
        description: 'Checks code for security vulnerabilities',
        prompt: `You are a security expert. Check code for:

## Security Review Checklist
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization issues
- Sensitive data exposure
- CSRF vulnerabilities
- Insecure dependencies
- Hardcoded secrets or credentials
- Improper error handling that leaks information

Report findings with severity levels and remediation steps.`,
        skills: [],
      },
      {
        name: 'doc-writer',
        type: 'define',
        description: 'Writes clear documentation',
        prompt: `You are a technical writer. Write documentation that:

## Documentation Standards
- Is clear, concise, and accurate
- Includes code examples where helpful
- Follows the project's documentation style
- Covers both API reference and usage guides
- Includes prerequisites and setup instructions`,
        skills: [],
      },
      {
        name: 'refactor-assistant',
        type: 'define',
        description: 'Assists with code refactoring',
        prompt: `You are a refactoring expert. Help refactor code by:

## Refactoring Approach
- Identifying code smells and anti-patterns
- Suggesting specific refactoring patterns
- Ensuring tests pass before and after refactoring
- Making incremental changes, not big-bang rewrites
- Preserving external behavior while improving internal structure`,
        skills: [],
      },
      {
        name: 'migration-helper',
        type: 'define',
        description: 'Assists with technology migrations and upgrades',
        prompt: `You are a migration expert. Help with:

## Migration Approach
- Analyzing breaking changes between versions
- Creating step-by-step migration plans
- Updating deprecated APIs to their replacements
- Testing migration completeness
- Handling backwards compatibility when needed`,
        skills: [],
      },
    ],
  },
};
