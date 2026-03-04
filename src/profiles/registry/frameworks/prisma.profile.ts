import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const prismaProfile: Profile = {
  id: 'frameworks/prisma',
  name: 'Prisma',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['prisma'],
  dependsOn: ['languages/typescript'],
  contributions: {
    claudeMd: [
      {
        heading: 'Prisma Conventions',
        order: 20,
        content: `## Prisma Conventions

Type-safe ORM with schema-first approach. Migrations workflow, singleton client, N+1 prevention.

**Detailed rules:** see \`.claude/rules/prisma/\` directory.

**Key rules:**
- Single source of truth: \`prisma/schema.prisma\` defines all models, relations, and enums
- Use singleton PrismaClient — never instantiate per-request
- Prevent N+1 queries: use \`include\` or \`select\` explicitly, never rely on lazy loading
- Migration workflow: \`prisma migrate dev\` in development, \`prisma migrate deploy\` in production
- Never use \`$queryRaw\`/\`$executeRaw\` with string interpolation — SQL injection risk`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx prisma:*)',
          'Bash(npx prisma generate:*)',
          'Bash(npx prisma migrate dev:*)',
          'Bash(npx prisma migrate deploy:*)',
          'Bash(npx prisma db push:*)',
          'Bash(npx prisma studio:*)',
          'Bash(npx prisma format:*)',
          'Bash(npx prisma validate:*)',
        ],
        deny: [
          'Bash(npx prisma migrate reset:*)',
        ],
      },
    },
    rules: [
      {
        path: 'prisma/schema-organization.md',
        paths: ['prisma/**/*', 'prisma/schema.prisma', '**/prisma*'],
        governance: 'mandatory',
        description: 'Prisma schema organization, models, relations, and enums',
        content: `# Prisma Schema Organization

## Schema Structure
Organize \`prisma/schema.prisma\` in this order:
1. **Generator** — client configuration
2. **Datasource** — database connection
3. **Enums** — shared enumerations
4. **Models** — data models grouped by domain

\`\`\`prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- Enums ---
enum Role {
  USER
  ADMIN
}

enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// --- Auth Domain ---
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

// --- Content Domain ---
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  status    Status   @default(DRAFT)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([status])
  @@map("posts")
}
\`\`\`

## Model Conventions
- Use \`cuid()\` or \`uuid()\` for IDs — never auto-increment integers for public-facing IDs
- Always add \`createdAt\` and \`updatedAt\` fields to every model
- Use \`@@map()\` to control database table names (snake_case convention)
- Use \`@map()\` for column names when they differ from field names
- Add \`@@index()\` on foreign keys and frequently filtered/sorted fields
- Use \`@@unique()\` for composite unique constraints

## Relations
- Always define both sides of a relation for type safety
- Use explicit relation syntax: \`@relation(fields: [...], references: [...])\`
- Name relations when a model has multiple relations to the same model
- Use cascade deletes carefully — prefer \`onDelete: SetNull\` or application-level cleanup

## Key Rules
- Never modify the schema without creating a migration (\`prisma migrate dev\`)
- Run \`prisma format\` before committing schema changes
- Run \`prisma validate\` in CI to catch schema errors early
- Keep the schema as the single source of truth — never create tables manually
`,
      },
      {
        path: 'prisma/client-patterns.md',
        paths: ['**/*.ts', '**/prisma*', '**/*client*', '**/*db*'],
        governance: 'mandatory',
        description: 'Prisma client instantiation, queries, transactions, and N+1 prevention',
        content: `# Prisma Client Patterns

## Singleton Pattern
Never instantiate PrismaClient per-request — use a global singleton:

\`\`\`typescript
// lib/prisma.ts (or db.ts)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
\`\`\`

## N+1 Query Prevention
Prisma does NOT lazy-load relations. You must explicitly include them:

\`\`\`typescript
// BAD: N+1 — fetches posts, then separate query per post for author
const posts = await prisma.post.findMany();
for (const post of posts) {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// GOOD: single query with join
const posts = await prisma.post.findMany({
  include: { author: true },
});

// BETTER: select only needed fields
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    author: { select: { name: true, email: true } },
  },
});
\`\`\`

## Transactions
Use transactions for operations that must succeed or fail together:

\`\`\`typescript
// Interactive transaction — multiple operations with shared context
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email, name } });
  await tx.profile.create({ data: { userId: user.id, bio: '' } });
  return user;
});

// Sequential transaction — simple list of operations
const [deletedPosts, deletedUser] = await prisma.$transaction([
  prisma.post.deleteMany({ where: { authorId: userId } }),
  prisma.user.delete({ where: { id: userId } }),
]);
\`\`\`

## Key Rules
- Always use \`select\` or \`include\` to explicitly define the shape of returned data
- Use \`findUniqueOrThrow\`/\`findFirstOrThrow\` when the record must exist
- Use interactive transactions (\`$transaction(async (tx) => ...)\`) for complex operations
- Handle \`PrismaClientKnownRequestError\` — check \`error.code\` for specific database errors
- Use \`upsert\` instead of check-then-create patterns to avoid race conditions
`,
      },
      {
        path: 'prisma/security.md',
        paths: ['prisma/**/*', '**/*.ts', '**/prisma*'],
        governance: 'mandatory',
        description: 'Prisma security patterns, raw queries, migrations, and connection safety',
        content: `# Prisma Security

## Raw Query Safety — SQL Injection Prevention
Prisma's query builder is safe by default (parameterized queries). The risk is raw queries:

### DANGEROUS — SQL Injection
\`\`\`typescript
// NEVER do this — user input in template literal
const users = await prisma.$queryRaw\`
  SELECT * FROM users WHERE name = '\${userInput}'
\`;

// NEVER do this — string concatenation
const query = 'SELECT * FROM users WHERE name = \\'' + userInput + '\\'';
await prisma.$queryRawUnsafe(query);
\`\`\`

### SAFE — Parameterized Raw Queries
\`\`\`typescript
// Prisma.sql tagged template — auto-parameterized
import { Prisma } from '@prisma/client';

const users = await prisma.$queryRaw\`
  SELECT * FROM users WHERE name = \${userInput}
\`;

// Explicit Prisma.sql for dynamic queries
const query = Prisma.sql\`SELECT * FROM users WHERE role = \${role}\`;
await prisma.$queryRaw(query);
\`\`\`

## Migration Safety
- NEVER use \`prisma migrate reset\` in production — destroys all data
- Always review generated SQL before applying: \`prisma migrate dev --create-only\`
- Test migrations on a staging database before production deployment
- Avoid destructive operations: dropping columns, changing types, removing indexes
- Use \`prisma migrate deploy\` in production/CI — never \`dev\`

### Safe Migration Checklist
- [ ] Does the migration add columns? Use defaults or make nullable
- [ ] Does the migration rename? Use a two-step deploy (add new → migrate data → remove old)
- [ ] Does the migration add an index? Consider \`CREATE INDEX CONCURRENTLY\` for large tables
- [ ] Does the migration change types? Ensure data compatibility first

## Connection String Security
- Store \`DATABASE_URL\` in environment variables — never in code or version control
- Use connection pooling (PgBouncer, Prisma Accelerate) for serverless/edge deployments
- Set \`connection_limit\` in the connection string for serverless functions
- Enable SSL for production connections: \`?sslmode=require\`

## Data Access Patterns
- Never expose Prisma models directly in API responses — use DTOs/view models
- Strip sensitive fields (\`password\`, \`tokens\`) before returning data
- Implement row-level security by always filtering on \`userId\`/\`organizationId\`
- Use \`select\` to return only the fields the client needs

## Seeding Security
- Never seed production databases with test data
- Use separate seed scripts for development and staging
- Never hardcode real credentials in seed files
`,
      },
      {
        path: 'prisma/migrations-workflow.md',
        paths: ['prisma/**/*', 'prisma/migrations/**/*'],
        governance: 'recommended',
        description: 'Prisma migrations workflow, seeding, and database management',
        content: `# Prisma Migrations Workflow

## Development Workflow
1. Edit \`prisma/schema.prisma\`
2. Run \`npx prisma migrate dev --name descriptive-name\`
3. Review generated SQL in \`prisma/migrations/\`
4. Commit the migration with the schema change
5. Run \`npx prisma generate\` (auto-runs after migrate dev)

## Migration Commands
| Command | Environment | Purpose |
|---------|-------------|---------|
| \`prisma migrate dev\` | Development | Create + apply migration |
| \`prisma migrate dev --create-only\` | Development | Create migration without applying |
| \`prisma migrate deploy\` | Production/CI | Apply pending migrations |
| \`prisma migrate status\` | Any | Check migration state |
| \`prisma migrate resolve\` | Production | Mark migration as applied/rolled-back |
| \`prisma db push\` | Prototyping | Push schema without migrations (no history) |

## Seeding
\`\`\`typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Use upsert to make seed idempotent
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log({ admin });
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
\`\`\`

## Key Rules
- Migrations are immutable — never edit applied migration files
- Name migrations descriptively: \`add-user-role-column\`, \`create-posts-table\`
- Always commit migrations alongside schema changes
- Run \`prisma migrate deploy\` in CI/CD pipelines
- Make seeds idempotent with \`upsert\` — safe to run multiple times
- Test migration rollback strategy before applying to production
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['prisma-model-generator'],
        prompt: `## Prisma-Specific Review

### Schema Quality
- Verify all models have \`createdAt\` and \`updatedAt\` fields
- Check that IDs use \`cuid()\` or \`uuid()\` — not auto-increment for public-facing IDs
- Verify both sides of relations are defined for type safety
- Check for missing \`@@index()\` on foreign keys and frequently queried fields
- Verify \`@@map()\` is used for table naming consistency
- Check that enums are used for fixed sets of values instead of plain strings

### Client Usage
- Verify PrismaClient is instantiated as a singleton (global pattern)
- Check for N+1 queries: find loops with nested \`findUnique\`/\`findFirst\` calls
- Verify \`select\` or \`include\` is used to explicitly define returned data shape
- Check that \`findUniqueOrThrow\`/\`findFirstOrThrow\` is used when records must exist
- Verify \`upsert\` is used instead of check-then-create patterns
- Check that interactive transactions (\`$transaction(async ...)\`) are used for multi-step operations

### Query Safety
- Check for \`$queryRaw\` or \`$executeRaw\` with string interpolation — SQL injection risk
- Verify \`$queryRawUnsafe\`/\`$executeRawUnsafe\` is not used with user input
- Check that Prisma.sql tagged template is used for dynamic raw queries
- Verify PrismaClientKnownRequestError is handled with specific error codes

### Data Exposure
- Verify Prisma models are not directly returned in API responses (use DTOs)
- Check that sensitive fields (password, tokens) are stripped before returning data
- Verify row-level filtering on userId/organizationId for multi-tenant data
- Check that \`select\` limits returned fields to only what the client needs`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Prisma Security Review

### SQL Injection
- Check ALL uses of \`$queryRaw\`, \`$executeRaw\`, \`$queryRawUnsafe\`, \`$executeRawUnsafe\`
- Verify raw queries use Prisma.sql tagged template for parameterization
- Flag any string interpolation or concatenation in raw SQL as CRITICAL
- Check for dynamic table/column names — these cannot be parameterized

### Connection & Secrets
- Verify DATABASE_URL is loaded from environment variables, not hardcoded
- Check that connection strings are not logged or exposed in error responses
- Verify SSL is enabled for production database connections
- Check for connection pooling in serverless deployments

### Migration Safety
- Check for destructive migrations: column drops, type changes, table renames
- Verify \`prisma migrate reset\` is never used in production scripts or CI
- Check that migrations are tested on staging before production
- Verify migration files are not manually modified after being applied

### Data Access
- Verify row-level security: queries always filter on userId/tenantId for protected data
- Check that sensitive model fields are excluded from API responses
- Verify bulk operations (deleteMany, updateMany) have proper where clauses — not unbounded
- Check that seed files do not contain real credentials or production data`,
      },
    ],
    skills: [
      {
        name: 'prisma-model-generator',
        description: 'Scaffold a new Prisma model with relations, validation, and migration',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Prisma Model Generator

Generate a complete Prisma model with:

1. **Schema addition** to \`prisma/schema.prisma\`
   - Model with proper ID, timestamps, and @@map
   - Relations to existing models with explicit foreign keys
   - Indexes on foreign keys and frequently queried fields
   - Enums for fixed value sets

2. **TypeScript types** for the service layer
   - Create/update DTOs with Zod validation schemas
   - Response type that excludes sensitive fields

3. **Service file** with CRUD operations
   - Singleton prisma client import
   - Typed create, findById, findMany, update, delete functions
   - Proper error handling for PrismaClientKnownRequestError
   - N+1 prevention with explicit select/include

4. **Migration** — instructions to run \`prisma migrate dev --name add-model-name\`

### Template: Model
\`\`\`prisma
model ModelName {
  id        String   @id @default(cuid())
  // fields...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([foreignKeyField])
  @@map("model_names")
}
\`\`\`

### Template: Service
\`\`\`typescript
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export async function createModelName(data: CreateModelNameInput) {
  return prisma.modelName.create({
    data,
    select: { id: true, /* fields */ createdAt: true },
  });
}

export async function findModelNameById(id: string) {
  const item = await prisma.modelName.findUniqueOrThrow({
    where: { id },
    include: { relation: { select: { id: true, name: true } } },
  });
  return item;
}
\`\`\`
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.(ts|js)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/\\$queryRaw|\\$executeRaw/.test(c)) {
  const lines = c.split('\\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\\$(queryRaw|executeRaw)/.test(line) || /\\$(queryRawUnsafe|executeRawUnsafe)/.test(line)) {
      if (/\\$\\{/.test(line) && !/Prisma\\.sql/.test(lines.slice(Math.max(0, i-3), i+1).join(' '))) {
        console.log('CRITICAL: Raw SQL query at line ' + (i+1) + ' with string interpolation detected. Use Prisma.sql tagged template for parameterized queries to prevent SQL injection.');
      }
      if (/Unsafe/.test(line)) {
        console.log('Warning: $queryRawUnsafe/$executeRawUnsafe at line ' + (i+1) + '. Ensure user input is NEVER passed directly. Prefer Prisma.sql tagged template.');
      }
    }
  }
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.(ts|js)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/new\\s+PrismaClient/.test(c) && !/globalForPrisma|global|singleton/.test(c)) {
  console.log('Warning: PrismaClient instantiation detected without singleton pattern. Use a global singleton to prevent connection exhaustion. See prisma/client-patterns rule.');
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
