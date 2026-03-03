import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const bunProfile: Profile = {
  id: 'infra/bun',
  name: 'Bun',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['bun'],
  contributions: {
    claudeMd: [
      {
        heading: 'Bun Runtime Conventions',
        order: 40,
        content: `## Bun Runtime Conventions

All-in-one JavaScript/TypeScript toolkit. Native TypeScript, built-in bundler, test runner, package manager.

**Detailed rules:** see \`.claude/rules/bun/\` directory.

**Key rules:**
- Use Bun APIs (Bun.file, Bun.serve, Bun.write) instead of Node.js equivalents where possible
- Use \`bun test\` for testing — built-in test runner with Jest-compatible API
- Use \`bun build\` for bundling — no separate bundler needed
- Binary lockfile (\`bun.lockb\`) — always commit, do not manually edit`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(bun:*)',
          'Bash(bunx:*)',
          'Bash(bun run:*)',
          'Bash(bun test:*)',
          'Bash(bun build:*)',
          'Bash(bun install:*)',
          'Bash(bun add:*)',
          'Bash(bun remove:*)',
          'Bash(bun update:*)',
          'Bash(bun link:*)',
          'Bash(bun pm:*)',
          'Bash(bun create:*)',
          'Bash(bun init:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/bun-conventions.md',
        governance: 'mandatory',
        paths: ['bunfig.toml', '*.ts', '*.tsx'],
        description: 'Bun runtime conventions — APIs, package management, bundler, test runner, macros, and workspace management',
        content: `# Bun Runtime Conventions

## Bun-Native APIs
- Use \`Bun.file()\` for file I/O — returns a \`BunFile\` (lazy, memory-efficient)
- Use \`Bun.write()\` for writing files — accepts string, Blob, ArrayBuffer, Response
- Use \`Bun.serve()\` for HTTP servers — built-in, fast, supports WebSocket upgrades
- Use \`Bun.spawn()\` / \`Bun.spawnSync()\` for subprocesses — prefer over Node.js child_process
- Use \`Bun.hash()\` and \`Bun.CryptoHasher\` for hashing — faster than Node.js crypto
- Use \`Bun.Transpiler\` for programmatic TypeScript/JSX transpilation
- Use \`Bun.sleep()\` and \`Bun.sleepSync()\` instead of setTimeout wrappers
- Use \`Bun.peek()\` to read a Promise's result without awaiting (non-blocking inspection)

## Package Management
- Bun uses a binary lockfile (\`bun.lockb\`) — always commit it to version control
- Never manually edit \`bun.lockb\` — use \`bun install\` to regenerate
- Use \`bun add <pkg>\` / \`bun remove <pkg>\` for dependency management
- Use \`bun add -d <pkg>\` for devDependencies (not --save-dev)
- Use \`bunx <pkg>\` instead of \`npx\` for running package binaries
- Bun reads \`package.json\` — no separate manifest format needed

## Native TypeScript Support
- Bun runs TypeScript natively — no compilation step needed
- Import \`.ts\` files directly with \`.ts\` extension in source code
- JSX/TSX supported out of the box with zero configuration
- Configure TypeScript options in \`tsconfig.json\` as usual
- Use \`bun --hot\` for hot module reloading in development

## Bundler (bun build)
- Use \`bun build ./src/index.ts --outdir ./dist\` for bundling
- Supports code splitting with \`--splitting\` flag
- Target environments: \`browser\`, \`bun\`, \`node\`
- Use \`--minify\` for production builds (minifies whitespace, syntax, and identifiers)
- Configure externals to exclude packages from the bundle
- Tree-shaking is enabled by default — no configuration needed

## Test Runner (bun test)
- Built-in test runner with Jest-compatible API (\`describe\`, \`it\`, \`expect\`)
- Import test utilities from \`bun:test\` module
- Supports lifecycle hooks: \`beforeAll\`, \`afterAll\`, \`beforeEach\`, \`afterEach\`
- Snapshot testing supported with \`toMatchSnapshot()\`
- Use \`--coverage\` flag for code coverage reports
- Use \`--watch\` for re-running tests on file changes
- Use \`--bail\` to stop on first failure
- Test files: \`*.test.ts\`, \`*.test.tsx\`, \`*.spec.ts\`, \`*.spec.tsx\`

## Macros
- Bun supports compile-time code execution via macros
- Import with \`{ type: 'macro' }\` attribute
- Macros run at bundle time and inline the result — use for build-time constants
- Never use macros for runtime-dependent logic (environment variables, user input)

## Workspace Management
- Configure workspaces in \`package.json\` \`workspaces\` array
- Bun hoists dependencies to the root by default
- Use \`bun install --filter <workspace>\` to install specific workspaces
- Each workspace can have its own \`bunfig.toml\` for local overrides

## bunfig.toml Configuration
- Use \`bunfig.toml\` for Bun-specific configuration (install behavior, test runner, macros)
- Configure \`[install]\` section for registry, scopes, and trusted dependencies
- Configure \`[test]\` section for test runner options (coverage, timeout, bail)
- Configure \`[run]\` section for script runner behavior
`,
      },
      {
        path: 'infra/bun-security.md',
        governance: 'mandatory',
        paths: ['bunfig.toml', '*.ts', '*.tsx'],
        description: 'Bun security — subprocess safety, trusted dependencies, and input validation',
        content: `# Bun Security Best Practices

## Subprocess Safety (Bun.spawn)
- NEVER pass unsanitized user input directly to \`Bun.spawn()\` or \`Bun.spawnSync()\`
- Always use the array form for command arguments — avoid string interpolation in commands
- Validate and sanitize all inputs before passing to subprocess commands
- Set \`cwd\` explicitly to prevent path traversal attacks
- Use \`env\` option to pass only required environment variables — avoid inheriting full process.env
- Set appropriate \`timeout\` on long-running subprocesses to prevent resource exhaustion

## Trusted Dependencies
- Configure \`trustedDependencies\` in \`package.json\` to control which packages can run install scripts
- By default, Bun does not run arbitrary install scripts — this is a security feature
- Only add packages to \`trustedDependencies\` after auditing their postinstall scripts
- Review \`bunfig.toml\` \`[install].allowedScripts\` for additional script execution control

## File System Safety
- Use \`Bun.file()\` with validated paths — prevent path traversal with input validation
- Never construct file paths from user input without sanitization
- Use \`path.resolve()\` and verify the result stays within expected directories
- Set appropriate file permissions when writing with \`Bun.write()\`

## HTTP Server Security (Bun.serve)
- Validate all request inputs (headers, query params, body) before processing
- Set appropriate CORS headers — never use wildcard origin on authenticated endpoints
- Implement rate limiting for public-facing endpoints
- Use TLS in production — configure \`tls\` option in \`Bun.serve()\`
- Handle errors gracefully — never expose internal error details to clients
- Set \`maxRequestBodySize\` to prevent denial-of-service via large payloads

## Environment Variables
- Use \`Bun.env\` (or \`process.env\`) to access environment variables
- Never commit \`.env\` files with real secrets — use \`.env.example\` with placeholders
- Load environment-specific configs: \`.env.local\`, \`.env.production\`, \`.env.development\`
- Bun auto-loads \`.env\` files — ensure sensitive files are in \`.gitignore\`
`,
      },
      {
        path: 'infra/bun-patterns.md',
        governance: 'recommended',
        paths: ['bunfig.toml', '*.ts', '*.tsx'],
        description: 'Bun recommended patterns — HTTP server, file I/O, WebSocket, and migration from Node.js',
        content: `# Bun Recommended Patterns

## HTTP Server Pattern
\`\`\`typescript
Bun.serve({
  port: Bun.env.PORT ?? 3000,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      return new Response('ok', { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  },
  error(error) {
    return new Response('Internal Server Error', { status: 500 });
  },
});
\`\`\`

## File I/O Pattern
\`\`\`typescript
// Reading
const file = Bun.file('./data.json');
const data = await file.json();

// Writing
await Bun.write('./output.txt', 'Hello, Bun!');
await Bun.write('./data.json', JSON.stringify(data, null, 2));
\`\`\`

## WebSocket Server Pattern
\`\`\`typescript
Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) return; // WebSocket upgrade
    return new Response('HTTP fallback', { status: 200 });
  },
  websocket: {
    open(ws) { /* connection opened */ },
    message(ws, message) { /* handle message */ },
    close(ws, code, reason) { /* connection closed */ },
  },
});
\`\`\`

## Testing Pattern
\`\`\`typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';

describe('MyService', () => {
  beforeEach(() => { /* setup */ });

  it('should handle requests', async () => {
    const result = await myService.handle({ input: 'test' });
    expect(result.status).toBe(200);
  });
});
\`\`\`

## Migration from Node.js
- Replace \`fs.readFile\` with \`Bun.file().text()\` or \`.json()\`
- Replace \`fs.writeFile\` with \`Bun.write()\`
- Replace \`http.createServer\` with \`Bun.serve()\`
- Replace \`child_process.spawn\` with \`Bun.spawn()\`
- Replace \`crypto.createHash\` with \`Bun.hash()\` or \`new Bun.CryptoHasher()\`
- Replace \`setTimeout\` wrappers with \`Bun.sleep()\`
- Replace \`npx\` with \`bunx\` for package binary execution
- Node.js APIs are still available as a compatibility layer — migrate incrementally
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Bun-Specific Review

**Available skill:** \`bun-project-scaffold\` — use when scaffolding new Bun projects.

### API Usage
- Verify Bun-native APIs are used where available (Bun.file, Bun.serve, Bun.write, Bun.spawn)
- Check that Node.js polyfills are not used when a Bun-native equivalent exists
- Verify \`bun:test\` imports are used instead of Jest/Vitest in Bun test files
- Check that \`bunx\` is used instead of \`npx\` in scripts and documentation

### Configuration
- Verify \`bunfig.toml\` is properly structured with appropriate sections
- Check that \`bun.lockb\` is committed to version control (not in .gitignore)
- Verify \`package.json\` scripts use \`bun\` commands where appropriate
- Check TypeScript configuration is compatible with Bun's native support

### Performance
- Verify \`Bun.file()\` is used for file reads instead of \`fs.readFileSync\` (lazy loading)
- Check that \`Bun.serve()\` is used for HTTP servers instead of Express/Fastify where possible
- Verify \`bun build\` is configured with appropriate target (browser, bun, or node)
- Check for unnecessary polyfills or compatibility packages that Bun handles natively

### Testing
- Verify test files use \`bun:test\` module imports
- Check that \`--coverage\` is configured for CI test runs
- Verify snapshot files are committed when using \`toMatchSnapshot()\`
- Check that test timeouts are configured appropriately`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Bun Security Review

**Available skill:** \`bun-project-scaffold\` — use when generating secure Bun configurations from scratch.

### Subprocess Security
- Check all \`Bun.spawn()\` and \`Bun.spawnSync()\` calls for user input injection
- Verify command arguments use array form, not string concatenation
- Check that \`cwd\` is set explicitly on subprocess calls
- Verify \`env\` option restricts environment variables passed to subprocesses
- Check for appropriate \`timeout\` settings on long-running processes

### Dependency Security
- Verify \`trustedDependencies\` in package.json is minimal and audited
- Check that \`bunfig.toml\` install configuration restricts script execution
- Verify no unnecessary packages have install script permissions
- Check for known vulnerabilities in dependencies

### Server Security
- Verify \`Bun.serve()\` endpoints validate all request inputs
- Check for CORS configuration — flag wildcard origin on authenticated endpoints
- Verify \`maxRequestBodySize\` is configured to prevent DoS
- Check that TLS is configured for production servers
- Verify error handlers do not leak internal details

### File System Security
- Check all \`Bun.file()\` paths for potential path traversal
- Verify file write operations use validated paths within expected directories
- Check that \`.env\` files with secrets are not committed to version control
- Verify \`Bun.env\` access does not expose secrets in client-side code`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Bun Documentation Standards

**Available skill:** \`bun-project-scaffold\` — use when scaffolding documented Bun projects.

### README
- Document that the project uses Bun as its runtime and package manager
- Include minimum Bun version requirement
- Document setup: \`bun install\` for dependencies, \`bun run dev\` for development
- Document testing: \`bun test\` for running tests, \`bun test --coverage\` for coverage
- Document build: \`bun build\` command with target and output configuration
- List all \`package.json\` scripts with descriptions

### Configuration Documentation
- Document \`bunfig.toml\` sections and their purpose
- Document \`trustedDependencies\` rationale for each listed package
- Document workspace configuration if using Bun workspaces
- Provide \`.env.example\` with all required environment variables

### API Documentation
- Document Bun-specific APIs used in the project (Bun.serve, Bun.file, etc.)
- Note any Node.js compatibility limitations relevant to the project
- Document WebSocket protocol if using Bun.serve WebSocket support`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Bun Migration Assistance

**Available skill:** \`bun-project-scaffold\` — use when generating Bun configs for migrated projects.

### From Node.js to Bun
- Replace \`package-lock.json\` / \`yarn.lock\` with \`bun.lockb\` (run \`bun install\`)
- Migrate npm/yarn scripts to bun equivalents in package.json
- Replace \`fs\` module calls with Bun.file()/Bun.write() where beneficial
- Replace \`http.createServer\` with \`Bun.serve()\` for HTTP servers
- Replace \`child_process\` with \`Bun.spawn()\` for subprocesses
- Replace \`crypto\` hashing with \`Bun.hash()\` / \`Bun.CryptoHasher\`
- Note: Node.js APIs remain available — migrate incrementally, not all at once

### From Jest/Vitest to bun:test
- Replace \`jest\` or \`vitest\` imports with \`bun:test\`
- Replace \`jest.fn()\` with \`mock()\` from \`bun:test\`
- Replace \`jest.mock()\` with \`mock.module()\` from \`bun:test\`
- Update test scripts in package.json to use \`bun test\`
- Snapshot files are compatible — no migration needed

### From webpack/esbuild to bun build
- Replace webpack/esbuild config with \`bun build\` CLI flags or Bun.build() API
- Map entry points, output directory, and target to bun build equivalents
- Configure code splitting with \`--splitting\` if needed
- Configure externals for server-side bundles
- Note: bun build does not support all webpack loaders — check compatibility`,
      },
    ],
    skills: [
      {
        name: 'bun-project-scaffold',
        description: 'Scaffold a Bun project with bunfig.toml, test setup, and recommended configuration',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Bun Project Scaffold

Generate a complete, production-ready Bun project setup including:

## 1. bunfig.toml Configuration

Generate a bunfig.toml with:
- \`[install]\` section: registry configuration, trusted dependencies, optional dependencies behavior
- \`[test]\` section: coverage enabled, timeout defaults, test file patterns
- \`[run]\` section: environment file loading order

Template:
\`\`\`toml
[install]
# Only allow install scripts from audited packages
# trustedDependencies = ["package-name"]

[test]
coverage = true
coverageReporter = ["text", "lcov"]
timeout = 5000

[run]
# Load environment variables in order
preload = ["./src/env.ts"]
\`\`\`

## 2. Package.json Scripts

Add Bun-optimized scripts:
\`\`\`json
{
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist --target bun --minify",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch",
    "lint": "bun run biome check .",
    "typecheck": "tsc --noEmit"
  }
}
\`\`\`

## 3. Test Setup

Generate a sample test file using \`bun:test\`:
\`\`\`typescript
import { describe, it, expect } from 'bun:test';

describe('example', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
\`\`\`

## 4. TypeScript Configuration

Generate tsconfig.json compatible with Bun:
\`\`\`json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  }
}
\`\`\`

## 5. Environment Template

Generate .env.example with placeholder values and .gitignore entry for .env files.

## Quality Checklist
- [ ] bunfig.toml has appropriate install and test configuration
- [ ] package.json scripts use bun commands
- [ ] TypeScript configured with bun-types
- [ ] Test setup uses bun:test module
- [ ] .env.example provided with all required variables
- [ ] .gitignore includes .env files (not bun.lockb)
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.(ts|tsx)$" && grep -nE "Bun\\.spawn(Sync)?\\s*\\(" "$FILE_PATH" 2>/dev/null | grep -qE "\\$|\\`|\\buser|\\breq\\b|\\binput\\b|\\bparams\\b|\\bquery\\b|\\bbody\\b" && { echo "WARNING: Potential unsafe user input in Bun.spawn() — validate and sanitize all inputs, use array form for arguments" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for unsafe Bun.spawn usage with user input',
          },
        ],
      },
    ],
  },
};
