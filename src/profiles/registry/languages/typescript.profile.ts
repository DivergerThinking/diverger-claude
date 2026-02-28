import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

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

- Use strict mode (\`"strict": true\` in tsconfig)
- Prefer \`interface\` over \`type\` for object shapes (unless union/intersection needed)
- Use \`unknown\` instead of \`any\` - explicitly narrow types
- Enable \`noUncheckedIndexedAccess\` for safer array/object access
- Use discriminated unions for state machines and variant types
- Prefer const assertions (\`as const\`) for literal types
- Use branded types for domain-specific validation (e.g., UserId, Email)
- Avoid enums in most cases - prefer union types or const objects
- Use \`satisfies\` operator for type-safe assignments with type inference`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx tsc:*)',
          'Bash(npx tsx:*)',
        ],
      },
    },
    rules: [
      {
        path: 'typescript/conventions.md',
        governance: 'mandatory',
        description: 'TypeScript coding conventions',
        content: `# TypeScript Conventions

## Type Safety
- Never use \`any\` - use \`unknown\` and narrow with type guards
- Enable strict mode in tsconfig.json
- Use explicit return types on exported functions
- Prefer \`interface\` for object shapes, \`type\` for unions/intersections

## Patterns
- Use discriminated unions for state management
- Prefer \`readonly\` arrays and properties when mutation is not needed
- Use \`satisfies\` for type-safe assignments
- Use const assertions for literal type inference
- Prefer template literal types for string manipulation types

## Imports
- Use named imports, avoid default exports
- Group imports: external libs → internal modules → types
- Use type-only imports (\`import type {}\`) when only importing types

## Error Handling
- Use typed error classes extending Error
- Use Result/Either pattern for expected failures
- Never catch and ignore errors without logging
`,
      },
      {
        path: 'typescript/naming.md',
        governance: 'recommended',
        description: 'TypeScript naming conventions',
        content: `# TypeScript Naming Conventions

## Files
- Use kebab-case for file names: \`user-service.ts\`
- Use .ts extension, .tsx only for files with JSX
- Test files: \`*.test.ts\` or \`*.spec.ts\`

## Code
- Interfaces: PascalCase, no "I" prefix (\`User\`, not \`IUser\`)
- Type aliases: PascalCase (\`UserId\`, \`ApiResponse\`)
- Constants: SCREAMING_SNAKE_CASE for true constants, camelCase for config objects
- Functions: camelCase, descriptive verbs (\`getUserById\`, \`validateEmail\`)
- Variables: camelCase, descriptive nouns
- Booleans: \`is\`, \`has\`, \`should\`, \`can\` prefix
- Generic types: Single uppercase letter for simple (\`T\`, \`K\`, \`V\`), descriptive for complex (\`TResponse\`, \`TInput\`)
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## TypeScript-Specific Review
- Check for any \`any\` types - suggest \`unknown\` with type guards
- Verify strict mode is enabled
- Check for proper use of \`readonly\` on immutable data
- Verify discriminated unions have exhaustive checks
- Check for potential null/undefined issues
- Verify proper error typing in catch blocks
- Check import organization and type-only imports`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## TypeScript Testing
- Use proper typing for test fixtures and mocks
- Type mock implementations correctly
- Test type narrowing and type guard functions
- Verify generic function behavior with different type parameters`,
      },
    ],
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
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
            skipLibCheck: true,
            resolveJsonModule: true,
            isolatedModules: true,
          },
        },
      },
    ],
  },
};
