import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const denoProfile: Profile = {
  id: 'infra/deno',
  name: 'Deno',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['deno'],
  contributions: {
    claudeMd: [
      {
        heading: 'Deno Runtime Conventions',
        order: 40,
        content: `## Deno Runtime Conventions

Secure-by-default runtime. Explicit permissions, built-in toolchain, web-standard APIs.

**Detailed rules:** see \`.claude/rules/deno/\` directory.

**Key rules:**
- Use explicit permissions (--allow-net, --allow-read) — never use --allow-all in production
- Use \`deno.json\` for import maps, tasks, and configuration
- Prefer Deno.* APIs and web standards (fetch, Request, Response) over Node.js polyfills
- Use \`@std/\` (Deno Standard Library) for common utilities`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(deno:*)',
          'Bash(deno run:*)',
          'Bash(deno test:*)',
          'Bash(deno task:*)',
          'Bash(deno lint:*)',
          'Bash(deno fmt:*)',
          'Bash(deno check:*)',
          'Bash(deno bench:*)',
          'Bash(deno compile:*)',
          'Bash(deno doc:*)',
          'Bash(deno info:*)',
          'Bash(deno install:*)',
          'Bash(deno uninstall:*)',
          'Bash(deno cache:*)',
          'Bash(deno eval:*)',
          'Bash(deno repl:*)',
          'Bash(deno serve:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/deno-conventions.md',
        governance: 'mandatory',
        paths: ['deno.json', 'deno.jsonc', '*.ts', '*.tsx'],
        description: 'Deno runtime conventions — permissions model, import maps, Deno.* APIs, standard library, tasks, and testing',
        content: `# Deno Runtime Conventions

## Permissions Model (Core Concept)
- Deno is secure by default — no file, network, or environment access without explicit permission
- Grant permissions explicitly per script or task:
  - \`--allow-net=api.example.com\` — restrict network to specific hosts
  - \`--allow-read=./data,./config\` — restrict file reads to specific paths
  - \`--allow-write=./output\` — restrict file writes to specific paths
  - \`--allow-env=DATABASE_URL,PORT\` — restrict to specific environment variables
  - \`--allow-run=git,deno\` — restrict to specific subprocesses
- Use fine-grained permissions — specify hosts, paths, and variables explicitly
- NEVER use \`--allow-all\` or \`-A\` in production — it defeats the security model
- In development, use \`-A\` sparingly and document what permissions are actually needed
- Configure permissions per task in \`deno.json\` for reproducibility

## Configuration (deno.json / deno.jsonc)
- Use \`deno.json\` as the central configuration file (supports JSONC with comments)
- Configure \`imports\` for import maps — map bare specifiers to URLs or npm packages
- Configure \`tasks\` for project-specific commands (like npm scripts)
- Configure \`compilerOptions\` for TypeScript options
- Configure \`lint\` and \`fmt\` rules for code quality tooling
- Configure \`exclude\` to skip directories from analysis (vendor, node_modules)

## Import Maps
- Define import maps in \`deno.json\` \`imports\` field
- Map bare specifiers: \`"@std/path": "jsr:@std/path@^1"\`
- Map npm packages: \`"chalk": "npm:chalk@5"\`
- Group related imports with scoped mappings for cleaner code
- Prefer \`jsr:\` specifiers for Deno/JSR packages, \`npm:\` for npm packages
- Avoid raw URL imports in source code — use import maps for all external dependencies

## Deno.* APIs
- Use \`Deno.readTextFile()\` / \`Deno.writeTextFile()\` for file I/O
- Use \`Deno.readFile()\` / \`Deno.writeFile()\` for binary file I/O
- Use \`Deno.serve()\` for HTTP servers — built-in, performant, supports HTTP/2
- Use \`Deno.Command\` for subprocesses (replaces deprecated \`Deno.run\`)
- Use \`Deno.env.get()\` / \`Deno.env.set()\` for environment variables
- Use \`Deno.cwd()\` and \`Deno.realPath()\` for path operations
- Use \`Deno.openKv()\` for built-in key-value storage (Deno KV)
- Use \`Deno.cron()\` for scheduled tasks (Deno Deploy)

## Standard Library (@std/)
- Use \`@std/path\` for path manipulation (join, resolve, basename, etc.)
- Use \`@std/fs\` for filesystem utilities (walk, exists, ensureDir)
- Use \`@std/testing\` for test utilities (assertions, BDD, mocking)
- Use \`@std/async\` for async utilities (delay, debounce, retry)
- Use \`@std/encoding\` for encoding/decoding (base64, hex, YAML, TOML)
- Use \`@std/http\` for HTTP utilities (file server, status codes)
- Import from JSR: \`import { join } from "@std/path";\`
- Pin standard library versions in import maps for reproducibility

## Tasks (deno.json)
- Define tasks in \`deno.json\` \`tasks\` field — equivalent to npm scripts
- Include explicit permissions in task definitions for documentation and safety
- Common tasks: \`dev\`, \`test\`, \`lint\`, \`fmt\`, \`check\`, \`build\`, \`start\`
- Tasks run with \`deno task <name>\` — supports chaining with \`&&\`

## Testing (Deno.test)
- Use \`Deno.test()\` for defining tests — built into the runtime
- Use \`@std/testing/bdd\` for \`describe\`/\`it\` syntax if preferred
- Use \`@std/testing/mock\` for spying and stubbing
- Run tests with \`deno test\` — supports \`--filter\`, \`--parallel\`, \`--coverage\`
- Test files: \`*_test.ts\`, \`*.test.ts\`, \`*_test.tsx\`, \`*.test.tsx\`
- Use \`--allow-*\` flags on \`deno test\` to grant test-specific permissions
- Use \`--coverage=./coverage\` to generate coverage reports

## TypeScript
- Deno supports TypeScript natively — no compilation step or tsconfig needed
- Configure TypeScript options in \`deno.json\` \`compilerOptions\` if needed
- Use \`deno check\` to type-check without running (equivalent to \`tsc --noEmit\`)
- Strict mode is enabled by default — do not disable it
`,
      },
      {
        path: 'infra/deno-security.md',
        governance: 'mandatory',
        paths: ['deno.json', 'deno.jsonc', '*.ts', '*.tsx'],
        description: 'Deno security — least-privilege permissions, sandbox model, subprocess safety, and deployment hardening',
        content: `# Deno Security Best Practices

## Least-Privilege Permissions (MANDATORY)
- NEVER use \`--allow-all\` (\`-A\`) in production scripts or deployment configurations
- Grant only the minimum permissions each script needs to function
- Scope network permissions to specific hosts: \`--allow-net=api.example.com,db.internal\`
- Scope file read permissions to specific directories: \`--allow-read=./data,./config\`
- Scope file write permissions to specific directories: \`--allow-write=./output,./logs\`
- Scope environment variable access: \`--allow-env=DATABASE_URL,PORT,NODE_ENV\`
- Scope subprocess execution: \`--allow-run=git,deno\`
- Document the rationale for each permission granted in task definitions

## Permission Prompts
- In interactive development, Deno prompts for permissions at runtime
- Use prompts during development to discover actual permission requirements
- Translate discovered permissions into explicit flags for production tasks
- Never auto-approve all permission prompts in CI/CD — use explicit flags

## Sandbox Model
- Deno's security sandbox is the primary defense layer — do not undermine it
- Third-party code runs with the same permissions as the main script
- Use \`--deny-*\` flags to explicitly block specific permissions even if \`--allow-*\` is broader
- Use \`Deno.permissions.query()\` to check permissions at runtime before attempting operations
- Use \`Deno.permissions.request()\` for runtime permission escalation with user consent

## Subprocess Safety (Deno.Command)
- Validate all inputs before passing to \`Deno.Command\`
- Use array form for arguments — never construct command strings from user input
- Set \`cwd\` explicitly to prevent path traversal
- Set \`env\` to pass only required environment variables
- Use \`signal\` option with \`AbortController\` for timeout control
- Grant \`--allow-run\` only for specific executables needed

## Import Security
- Pin all import versions in import maps (deno.json) — never use \`latest\` or unpinned URLs
- Use \`jsr:\` and \`npm:\` specifiers — avoid raw URL imports from untrusted sources
- Review third-party module source code before adding to import maps
- Use \`deno.lock\` (auto-generated lockfile) — commit it to version control
- Run \`deno cache --lock=deno.lock\` in CI to verify integrity

## Deployment Hardening
- Use \`deno compile\` to produce standalone binaries with bundled permissions
- Run compiled binaries with minimal OS-level permissions
- Use container isolation (Docker/Podman) as an additional security layer
- Log permission denials for security monitoring
- Rotate secrets and tokens regularly — use environment variables, not hardcoded values

## Deno Deploy Security
- Use environment variables for secrets in Deno Deploy dashboard
- Configure BroadcastChannel permissions carefully in distributed environments
- Use Deno KV access tokens with minimal scopes
- Set appropriate CORS headers on \`Deno.serve()\` responses
`,
      },
      {
        path: 'infra/deno-patterns.md',
        governance: 'recommended',
        paths: ['deno.json', 'deno.jsonc', '*.ts', '*.tsx'],
        description: 'Deno recommended patterns — HTTP server, file I/O, testing, and migration from Node.js',
        content: `# Deno Recommended Patterns

## HTTP Server Pattern
\`\`\`typescript
Deno.serve({ port: 3000 }, async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  if (url.pathname === "/health") {
    return new Response("ok", { status: 200 });
  }
  if (url.pathname === "/api/data" && req.method === "GET") {
    const data = { message: "Hello, Deno!" };
    return Response.json(data);
  }
  return new Response("Not Found", { status: 404 });
});
\`\`\`

## File I/O Pattern
\`\`\`typescript
// Reading text
const content = await Deno.readTextFile("./data.json");
const data = JSON.parse(content);

// Writing text
await Deno.writeTextFile("./output.txt", "Hello, Deno!");

// Reading binary
const bytes = await Deno.readFile("./image.png");

// Directory operations (using @std/fs)
import { ensureDir, walk } from "@std/fs";
await ensureDir("./output");
for await (const entry of walk("./src")) {
  console.log(entry.path);
}
\`\`\`

## Testing Pattern
\`\`\`typescript
import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

describe("MyService", () => {
  it("should handle valid input", async () => {
    const result = await myService.process("valid");
    assertEquals(result.status, "ok");
  });

  it("should reject invalid input", async () => {
    await assertRejects(
      () => myService.process(""),
      Error,
      "Input cannot be empty",
    );
  });
});
\`\`\`

## deno.json Task Configuration
\`\`\`json
{
  "tasks": {
    "dev": "deno run --watch --allow-net=localhost:3000 --allow-read=./src,./data --allow-env=PORT,DATABASE_URL src/main.ts",
    "start": "deno run --allow-net=0.0.0.0:3000 --allow-read=./data --allow-env=PORT,DATABASE_URL src/main.ts",
    "test": "deno test --allow-read=./test/fixtures --coverage=./coverage",
    "check": "deno check src/**/*.ts",
    "lint": "deno lint",
    "fmt": "deno fmt"
  }
}
\`\`\`

## Import Map Configuration
\`\`\`json
{
  "imports": {
    "@std/path": "jsr:@std/path@^1",
    "@std/fs": "jsr:@std/fs@^1",
    "@std/assert": "jsr:@std/assert@^1",
    "@std/testing": "jsr:@std/testing@^1",
    "oak": "jsr:@oak/oak@^17",
    "zod": "npm:zod@^3"
  }
}
\`\`\`

## Migration from Node.js
- Replace \`require()\` with \`import\` — Deno only supports ESM
- Replace \`fs.readFileSync\` with \`Deno.readTextFileSync()\` or async equivalent
- Replace \`http.createServer\` with \`Deno.serve()\`
- Replace \`child_process.spawn\` with \`new Deno.Command()\`
- Replace \`process.env.VAR\` with \`Deno.env.get("VAR")\`
- Replace npm packages with \`npm:\` specifiers or JSR equivalents
- Replace \`__dirname\` / \`__filename\` with \`import.meta.dirname\` / \`import.meta.filename\`
- Replace \`package.json\` scripts with \`deno.json\` tasks
- Node.js compatibility: Deno supports many Node.js APIs via built-in compat layer
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Deno-Specific Review

**Available skill:** \`deno-project-scaffold\` — use when scaffolding new Deno projects.

### Permissions
- Verify all deno.json tasks include explicit permission flags — flag any using \`-A\` or \`--allow-all\`
- Check that permissions are scoped to specific hosts, paths, and variables — not blanket allows
- Verify production tasks never use \`--allow-all\`
- Check that test tasks grant only permissions needed for test execution

### API Usage
- Verify Deno.* APIs are used where available (Deno.serve, Deno.readTextFile, Deno.Command)
- Check that web standard APIs (fetch, Request, Response, URL) are preferred over polyfills
- Verify @std/ library is used for standard operations (path, fs, assert, testing)
- Check for deprecated Deno APIs (Deno.run replaced by Deno.Command, Deno.readAll, etc.)

### Configuration
- Verify import maps in deno.json pin versions for all dependencies
- Check that deno.lock is committed to version control
- Verify no raw URL imports in source code — all should go through import maps
- Check that \`compilerOptions\` in deno.json are compatible with Deno defaults

### Code Quality
- Verify \`deno lint\` and \`deno fmt\` are configured in tasks
- Check that \`deno check\` (type checking) is part of CI pipeline
- Verify test coverage is configured and adequate
- Check for proper error handling with typed errors`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Deno Security Review

**Available skill:** \`deno-project-scaffold\` — use when generating secure Deno configurations from scratch.

### Permission Audit
- Flag ANY use of \`--allow-all\` or \`-A\` in deno.json tasks or scripts — CRITICAL in production
- Verify all \`--allow-net\` permissions are scoped to specific hosts (not unscoped)
- Verify all \`--allow-read\` and \`--allow-write\` permissions are scoped to specific directories
- Verify all \`--allow-env\` permissions list specific variable names
- Verify all \`--allow-run\` permissions list specific executables
- Check for \`--deny-*\` flags as additional protection layer

### Import Security
- Verify all dependencies are pinned to specific versions in import maps
- Check for raw URL imports from untrusted sources — flag imports not in deno.json
- Verify deno.lock exists and is committed — ensures dependency integrity
- Check for imports from HTTP (not HTTPS) URLs — CRITICAL security risk

### Subprocess Safety
- Check all \`Deno.Command\` instances for user input in arguments
- Verify command arguments use array form, not string interpolation
- Check for appropriate signal/abort handling on long-running subprocesses
- Verify \`--allow-run\` only grants access to necessary executables

### Server Security
- Verify \`Deno.serve()\` endpoints validate all request inputs
- Check for CORS configuration — flag wildcard origin on authenticated endpoints
- Verify authentication is implemented on mutating API routes
- Check that secrets are accessed via \`Deno.env.get()\` not hardcoded
- Verify error responses do not leak internal details`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Deno Documentation Standards

**Available skill:** \`deno-project-scaffold\` — use when scaffolding documented Deno projects.

### README
- Document that the project uses Deno as its runtime
- Include minimum Deno version requirement
- Document setup: \`deno install\` for dependencies (if applicable)
- Document all available tasks: \`deno task dev\`, \`deno task test\`, etc.
- Document required permissions and explain why each is needed
- List required environment variables with descriptions (never include actual values)

### Permission Documentation
- Document the exact permissions each task requires and why
- Explain the rationale for each --allow-* flag granted
- Document which permissions are development-only vs production
- Provide a permissions matrix showing script-to-permission mapping

### Configuration Documentation
- Document deno.json structure: imports, tasks, compilerOptions, lint, fmt
- Document import map entries and their purpose
- Document any custom lint or fmt rules and their rationale
- Provide .env.example with all required environment variables`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Deno Migration Assistance

**Available skill:** \`deno-project-scaffold\` — use when generating Deno configs for migrated projects.

### From Node.js to Deno
- Replace \`require()\` with \`import\` statements — Deno only supports ESM
- Replace package.json with deno.json (tasks, imports, compilerOptions)
- Replace node_modules with import maps in deno.json
- Map npm packages to \`npm:\` specifiers or find JSR equivalents
- Replace Node.js APIs with Deno equivalents (fs -> Deno.readTextFile, etc.)
- Replace \`__dirname\`/\`__filename\` with \`import.meta.dirname\`/\`import.meta.filename\`
- Replace process.env with Deno.env.get()
- Identify required permissions from Node.js usage patterns

### From npm/yarn to Deno
- Replace package.json \`dependencies\` with deno.json \`imports\`
- Replace package.json \`scripts\` with deno.json \`tasks\` (include permissions)
- Remove tsconfig.json — configure in deno.json \`compilerOptions\`
- Remove node_modules from version control and .gitignore
- Replace npx with \`deno run -A npm:<package>\` or add to import map

### Testing Migration
- Replace Jest/Vitest with Deno.test or @std/testing/bdd
- Replace \`jest.fn()\` with \`@std/testing/mock\` utilities
- Replace assertion libraries with @std/assert
- Update test scripts to \`deno test\` with appropriate permission flags
- Configure coverage with \`--coverage\` flag`,
      },
    ],
    skills: [
      {
        name: 'deno-project-scaffold',
        description: 'Scaffold a Deno project with deno.json, permissions, and recommended configuration',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Deno Project Scaffold

Generate a complete, production-ready Deno project setup including:

## 1. deno.json Configuration

Generate a deno.json with:
- \`imports\`: import maps for all dependencies (JSR and npm specifiers)
- \`tasks\`: development, test, lint, fmt, check, and start tasks with explicit permissions
- \`compilerOptions\`: TypeScript strict mode configuration
- \`lint\` and \`fmt\`: code quality tool configuration
- \`exclude\`: directories to skip

Template:
\`\`\`json
{
  "imports": {
    "@std/path": "jsr:@std/path@^1",
    "@std/fs": "jsr:@std/fs@^1",
    "@std/assert": "jsr:@std/assert@^1",
    "@std/testing": "jsr:@std/testing@^1"
  },
  "tasks": {
    "dev": "deno run --watch --allow-net=localhost:3000 --allow-read=./src,./data --allow-env src/main.ts",
    "start": "deno run --allow-net=0.0.0.0:3000 --allow-read=./data --allow-env=PORT,DATABASE_URL src/main.ts",
    "test": "deno test --allow-read=./test/fixtures --coverage=./coverage",
    "check": "deno check src/**/*.ts",
    "lint": "deno lint",
    "fmt": "deno fmt",
    "fmt:check": "deno fmt --check"
  },
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "fmt": {
    "indentWidth": 2,
    "singleQuote": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
\`\`\`

## 2. Main Entry Point

Generate a src/main.ts with:
- Deno.serve() HTTP server setup
- Health check endpoint
- Structured error handling
- Environment variable loading

## 3. Test Setup

Generate a sample test file using Deno.test:
\`\`\`typescript
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

describe("example", () => {
  it("should work", () => {
    assertEquals(1 + 1, 2);
  });
});
\`\`\`

## 4. Environment Template

Generate .env.example with all required environment variables and placeholder values.

## Quality Checklist
- [ ] deno.json has import maps for all dependencies
- [ ] Tasks include explicit permission flags (no --allow-all)
- [ ] TypeScript strict mode enabled
- [ ] Lint and fmt configured
- [ ] Test setup uses @std/assert and @std/testing
- [ ] .env.example provided with all required variables
- [ ] deno.lock committed to version control
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "deno\\.jsonc?$" && grep -nE "\"--allow-all\"|\"\\-A\"|--allow-all|\\s-A\\s" "$FILE_PATH" 2>/dev/null | head -1 | grep -q "." && { echo "WARNING: --allow-all or -A flag found in deno.json tasks — use specific permissions (--allow-net, --allow-read, etc.) for production safety" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for overly permissive --allow-all in deno.json tasks',
          },
        ],
      },
    ],
  },
};
