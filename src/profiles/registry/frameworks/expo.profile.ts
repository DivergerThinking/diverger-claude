import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const expoProfile: Profile = {
  id: 'frameworks/expo',
  name: 'Expo',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['expo'],
  dependsOn: ['frameworks/react-native'],
  contributions: {
    claudeMd: [{
      heading: 'Expo Conventions',
      order: 20,
      content: `## Expo Conventions

Managed workflow preferred. Expo Router for file-based navigation, EAS for builds.

**Detailed rules:** see \`.claude/rules/expo/\` directory.

**Key rules:**
- Expo Router for file-based routing in \`app/\` directory
- Use Expo SDK modules (\`expo-camera\`, \`expo-notifications\`) over bare RN equivalents
- EAS Build for CI/CD, EAS Update for OTA updates
- Config plugins for native customization without ejecting`,
    }],
    settings: {
      permissions: {
        allow: [
          'Bash(npx expo:*)',
          'Bash(npx expo start:*)',
          'Bash(npx expo prebuild:*)',
          'Bash(npx expo install:*)',
          'Bash(npx expo export:*)',
          'Bash(npx expo run:*)',
          'Bash(npx expo lint:*)',
          'Bash(eas:*)',
          'Bash(npx eas:*)',
          'Bash(npx eas build:*)',
          'Bash(npx eas update:*)',
          'Bash(npx eas submit:*)',
          'Bash(npx create-expo-module:*)',
        ],
      },
    },
    rules: [
      {
        path: 'expo/config-plugins.md',
        paths: ['**/*.tsx', '**/*.ts', 'app/**/*'],
        governance: 'mandatory',
        description: 'Expo config plugins: creation, idempotency, and native modification patterns',
        content: `# Expo Config Plugins

## Plugin Fundamentals
- Config plugins run at prebuild time to modify native projects (ios/, android/)
- Use the \`expo/config-plugins\` API: \`withAndroidManifest\`, \`withInfoPlist\`, \`withAppBuildGradle\`, etc.
- Write plugins in TypeScript — add \`import 'tsx/cjs'\` in \`app.config.ts\` for local TS support
- Keep platform-specific code in separate functions/files (withAndroid.ts, withIos.ts)

## Idempotency (Critical)
- Plugins MUST be idempotent — running prebuild twice must produce identical native output
- Always check for existing values before inserting into manifests or plists
- Never append unconditionally — duplicates accumulate across prebuild runs
- Use helper functions from \`expo/config-plugins\` for consistent error messages

## Common Plugin Patterns
- Android permissions: check existing permissions before adding with \`AndroidConfig.Permissions\`
- iOS Info.plist: use \`withInfoPlist\` with existence checks for usage descriptions
- Background modes: merge with \`new Set()\` to avoid duplicates
- Build.gradle modifications: use \`withAppBuildGradle\` for Android build config

## Testing Plugins
- Run \`npx expo prebuild --clean\` to test plugin output from scratch
- Inspect generated ios/ and android/ directories to verify changes
- Use \`npx expo config --type prebuild\` to preview final resolved config
- Test idempotency: run prebuild twice and compare output
`,
      },
      {
        path: 'expo/eas-deployment.md',
        paths: ['**/*.tsx', '**/*.ts', 'app/**/*'],
        governance: 'mandatory',
        description: 'EAS Build, Submit, and Update configuration and workflows',
        content: `# EAS Deployment (Build, Submit, Update)

## eas.json Build Profiles
- Always define three profiles: development, preview, and production
- Development: \`developmentClient: true\`, \`distribution: "internal"\`
- Preview: \`distribution: "internal"\` for testing
- Production: \`autoIncrement: true\` for store builds

## Environment Variables & Secrets
- Use EAS environment variables (stored on EAS servers) for secrets — NOT the \`env\` field in eas.json
- Scope secrets to environments: development, preview, production
- Use \`eas env:create\` to add secrets; \`eas env:pull\` to sync locally
- The \`env\` field in eas.json is for non-sensitive config only (APP_VARIANT, feature flags)
- Never commit \`.env.local\` or service account keys to source control

## EAS Update (OTA)
- Use \`eas update\` for JavaScript-only changes — no native module additions
- Configure \`runtimeVersion\` in \`app.config.ts\`: \`{ policy: "fingerprint" }\` (auto) or \`{ policy: "appVersion" }\` (manual)
- Always test on preview channel before pushing to production
- Use update branches: \`eas update --branch preview --message "Fix copy"\`
- Never push directly to production without preview testing

## EAS Submit
- Automate store submissions with \`eas submit --auto-submit\` on production builds
- Configure ASC API keys for iOS, Google Service Account JSON for Android
- Test internal distribution builds before submitting to stores

## Continuous Native Generation (CNG)
- Add ios/ and android/ to .gitignore when using CNG
- Run \`npx expo prebuild --clean\` to regenerate from scratch
- Commit native directories only when debugging or using bare workflow
`,
      },
      {
        path: 'expo/expo-modules.md',
        paths: ['**/*.tsx', '**/*.ts', 'app/**/*'],
        governance: 'recommended',
        description: 'Expo Modules API for custom native Swift and Kotlin modules',
        content: `# Expo Modules API

## When to Use
- Native functionality not available in existing Expo SDK packages
- Wrapping a third-party native SDK (payments, analytics, hardware)
- High-performance native code for computation or rendering

## Creating a Module
- Local module: \`npx create-expo-module@latest --local\` — scaffolds in \`modules/\` directory
- Standalone library: \`npx create-expo-module@latest my-module\`

## Module Structure
- \`expo-module.config.json\` — module metadata listing Swift/Kotlin class names
- \`src/index.ts\` — TypeScript API surface (the contract)
- \`ios/MyModule.swift\` — iOS implementation
- \`android/.../MyModule.kt\` — Android implementation
- List Swift class names under \`ios.modules\`, fully-qualified Kotlin names under \`android.modules\`
- Run \`npx pod-install\` after modifying \`expo-module.config.json\`

## Best Practices
- Keep TypeScript API surface minimal and well-typed — TS is the contract, native is implementation
- Handle errors in native code and propagate as typed exceptions to JS
- Use \`expo-modules-core\` APIs (Events, SharedObjects, Views) instead of raw bridge APIs
- Write unit tests for both Swift and Kotlin implementations
- Document native dependencies and required permissions
`,
      },
      {
        path: 'expo/expo-router-patterns.md',
        paths: ['**/*.tsx', '**/*.ts', 'app/**/*'],
        governance: 'mandatory',
        description: 'Expo Router file-system routing, layouts, typed routes, and API routes',
        content: `# Expo Router Patterns

## File-System Routing Conventions
- \`app/_layout.tsx\` — root layout (Stack, Tabs, or Drawer navigator) wrapping the entire app
- \`app/index.tsx\` — home screen (\`/\`)
- \`app/+not-found.tsx\` — unmatched routes fallback
- \`app/(group)/_layout.tsx\` — layout for route groups (parentheses naming convention)
- \`app/[id].tsx\` — dynamic route segment
- \`app/api/hello+api.ts\` — server route (API endpoint)

## Layout Files (_layout.tsx)
- Always define a root \`_layout.tsx\` wrapping the entire app
- Place providers (theme, auth, fonts, splash screen) in the root layout
- Use layouts to define navigator types (Stack, Tabs, Drawer) per route group

## Typed Routes
- Enable in app.config.ts: \`{ experiments: { typedRoutes: true } }\`
- Expo CLI generates type definitions on first \`npx expo start\`
- Use \`<Link href="...">\` and \`router.push("...")\` with full type safety
- Invalid routes produce TypeScript errors at compile time

## API Routes (+api.ts)
- Export named HTTP method handlers: \`GET\`, \`POST\`, \`PUT\`, \`DELETE\`
- API routes run server-side — safe for secrets and sensitive logic
- Validate all input — treat like any server endpoint
- Use \`ExpoRequest\`/\`ExpoResponse\` types from \`expo-router/server\`

## Deep Linking
- Every file-based route is automatically a deep link — no extra config needed
- Use \`+native-intent.tsx\` for custom URL-to-route mapping on native
- Test deep links: \`npx uri-scheme open "myapp://profile/123" --ios\`
- Configure \`scheme\` in app.config.ts for custom URL schemes
- Configure universal links (iOS) and app links (Android) in EAS for production
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Expo-Specific Review

### SDK & Module Usage
- Verify Expo SDK modules are used instead of bare community native modules when available
- Check that custom native modules use the Expo Modules API (not raw TurboModules or NativeModules)
- Verify expo-module.config.json lists all Swift/Kotlin module classes correctly

### Config Plugins
- Verify all config plugins are idempotent — running prebuild twice produces identical output
- Check for duplicate entries in manifests/plists caused by non-idempotent plugins
- Verify plugins handle the case where a value already exists before inserting

### Expo Router
- Verify _layout.tsx exists at every route group level that defines a navigator
- Check that typed routes are used for navigation (Link href, router.push) — no hardcoded string paths without types
- Verify +api.ts routes validate all input and do not expose secrets in responses
- Check that +not-found.tsx exists for unmatched route handling
- Verify route groups use parentheses naming convention correctly

### Environment Variables
- Verify secrets are NOT in EXPO_PUBLIC_ prefixed variables
- Check that process.env.EXPO_PUBLIC_* is accessed via dot notation only (not destructured or bracket-accessed)
- Verify .env files with secrets are in .gitignore

### EAS Configuration
- Verify eas.json has development, preview, and production build profiles
- Check that sensitive values use EAS environment variables, not the env field in eas.json
- Verify runtimeVersion is configured for OTA update compatibility

### New Architecture
- Check third-party libraries for New Architecture compatibility when targeting SDK 53+
- Verify no deprecated packages are used (expo-av replaced by expo-video/expo-audio)

### Available Skills
- \`expo-prebuild-guide\`: Guide for managed-to-bare workflow migration using Expo prebuild
- \`expo-eas-setup\`: Step-by-step EAS Build, Submit, and Update setup`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Expo Testing Patterns

### Component Testing
- Use @testing-library/react-native for component tests
- Mock expo-router navigation: jest.mock('expo-router') with useRouter, Link, useLocalSearchParams
- Mock Expo SDK modules (expo-camera, expo-location) at the module level
- Test screen components with mocked navigation params

### API Route Testing
- Test +api.ts route handlers by calling exported functions (GET, POST) with mock ExpoRequest
- Assert on response status codes, headers, and JSON body
- Test input validation — pass invalid data and verify 400 responses
- Verify error responses do not leak internal details

### Config Plugin Testing
- Test plugins by applying them to a mock config and asserting on modResults
- Verify idempotency: apply plugin twice and assert identical output
- Test edge cases: missing fields, existing values, empty arrays

### E2E with Detox or Maestro
- Prefer Maestro for Expo projects — simpler setup, YAML-based flows
- Use \`testID\` props for reliable element targeting in E2E tests
- Test critical flows: onboarding, auth, main navigation, deep linking
- Test on both iOS simulator and Android emulator`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Expo Security Review

### Secrets & Environment
- Verify no secrets in EXPO_PUBLIC_ variables — they are compiled into the JS bundle and visible to anyone
- Check that API keys in app.config.ts come from non-prefixed env vars (build-time only) or EAS secrets
- Verify .env.local, service account keys, and .p8 files are in .gitignore
- Check that +api.ts server routes (not client code) handle sensitive API calls

### EAS Secrets
- Verify production secrets use EAS environment variables, not eas.json env field
- Check that service account keys for store submission are stored as EAS secrets
- Verify development/preview/production secret scoping is correct

### OTA Update Safety
- Verify runtimeVersion policy prevents incompatible JS updates on older native binaries
- Check that OTA updates are tested on preview channel before production

### Deep Linking
- Verify deep link handlers validate and sanitize incoming URL parameters
- Check that sensitive routes (payment, account settings) require authentication after deep link entry

### Available Skills
- \`expo-prebuild-guide\`: Guide for managed-to-bare workflow migration using Expo prebuild
- \`expo-eas-setup\`: Step-by-step EAS Build, Submit, and Update setup`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Expo SDK Migration

### Pre-Migration Checklist
- Read the Expo SDK changelog for breaking changes before upgrading
- Check all third-party native libraries for compatibility with the target SDK
- Verify EAS CLI is updated to the latest version
- Back up eas.json and app.config.ts before making changes

### Common Migration Patterns (SDK 52 to 53+)
- expo-av Video replaced by expo-video — migrate all Video usages
- expo-av Audio replaced by expo-audio — migrate all Audio usages
- New Architecture enabled by default — test all native modules
- Remove metro and metro-resolver overrides added for previous expo-router versions
- Update React Native to the version bundled with the target SDK (e.g., RN 0.79 for SDK 53)
- Verify package.json exports compliance — Metro in SDK 53 enforces exports strictly

### Post-Migration
- Run \`npx expo-doctor\` to check for known issues
- Run \`npx expo prebuild --clean\` to regenerate native projects
- Test on both platforms (iOS + Android) with development builds
- Verify EAS Build succeeds for all profiles (development, preview, production)

### Available Skills
- \`expo-prebuild-guide\`: Guide for managed-to-bare workflow migration using Expo prebuild
- \`expo-eas-setup\`: Step-by-step EAS Build, Submit, and Update setup`,
      },
    ],
    skills: [
      {
        name: 'expo-prebuild-guide',
        description: 'Guide for managed-to-bare workflow migration using Expo prebuild',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Expo Prebuild & CNG Guide

## Continuous Native Generation (CNG)
CNG means native projects (ios/, android/) are generated from app.config.ts + config plugins.
This is the recommended approach — treat native directories as build artifacts.

## Prebuild Commands
\`\`\`bash
# Generate native projects (preserves existing changes)
npx expo prebuild

# Clean regeneration (deletes ios/ and android/ first)
npx expo prebuild --clean

# Platform-specific
npx expo prebuild --platform ios
npx expo prebuild --platform android

# Preview resolved config without generating
npx expo config --type prebuild
\`\`\`

## When to Prebuild
- After adding a library with native code
- After modifying app.config.ts plugins array
- After changing native configuration (permissions, schemes, build settings)
- After upgrading Expo SDK version

## CNG Workflow
1. Add ios/ and android/ to .gitignore
2. Define all native config via app.config.ts and config plugins
3. Let EAS Build run prebuild automatically
4. Only commit native directories for debugging or bare workflow

## Migration Checklist (Managed to Bare)
1. Run \`npx expo prebuild\` to generate native projects
2. Remove ios/ and android/ from .gitignore
3. Review and customize native projects directly
4. Update Podfile and build.gradle as needed
5. Set up EAS Build for bare workflow
6. Update CI/CD pipeline for native builds
7. Verify all Expo SDK modules still function
8. Configure expo-dev-client for development builds
`,
      },
      {
        name: 'expo-eas-setup',
        description: 'Step-by-step EAS Build, Submit, and Update setup for new Expo projects',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# EAS Setup Guide

## Initial Setup
\`\`\`bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Initialize EAS in your project (creates eas.json)
eas build:configure
\`\`\`

## Build Profiles (eas.json)
\`\`\`json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
\`\`\`

## Build Commands
\`\`\`bash
# Development build (with dev client)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build (internal distribution)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
\`\`\`

## Environment Variables
\`\`\`bash
# Add a secret
eas env:create --name API_SECRET --value "sk-..." --environment production --visibility secret

# Pull secrets locally for testing
eas env:pull --environment development

# List all variables
eas env:list
\`\`\`

## OTA Updates
\`\`\`bash
# Push update to preview
eas update --branch preview --message "Fix: button alignment"

# Push update to production
eas update --branch production --message "Fix: button alignment"

# List recent updates
eas update:list
\`\`\`

## Store Submission
\`\`\`bash
# Submit latest production build to stores
eas submit --platform ios --latest
eas submit --platform android --latest

# Auto-submit after build
eas build --profile production --platform all --auto-submit
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
          statusMessage: 'Checking for EXPO_PUBLIC_ env var access patterns',
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty'); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.(tsx?|jsx?)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
const issues = [];
// Check for destructured EXPO_PUBLIC_ env vars (won't be inlined)
if (/(?:const|let|var)\\s*\\{[^}]*EXPO_PUBLIC_/.test(c)) {
  issues.push('EXPO_PUBLIC_ env var destructured from process.env — this will NOT be inlined. Use process.env.EXPO_PUBLIC_VARNAME with dot notation.');
}
// Check for bracket access to EXPO_PUBLIC_ env vars
if (/process\\.env\\[.EXPO_PUBLIC_/.test(c)) {
  issues.push('EXPO_PUBLIC_ env var accessed via bracket notation — this will NOT be inlined. Use process.env.EXPO_PUBLIC_VARNAME with dot notation.');
}
if (issues.length) { console.error('Warning: ' + issues.join(' | ')); process.exit(2); }
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          statusMessage: 'Checking Expo app.config for runtimeVersion and secrets',
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty'); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/app\\.config\\.(ts|js)$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
const issues = [];
if (/runtimeVersion/.test(c) === false) {
  issues.push('No runtimeVersion configured — OTA updates may be delivered to incompatible native binaries.');
}
if (/EXPO_PUBLIC_/.test(c) && /process\\.env\\.EXPO_PUBLIC_/.test(c)) {
  // OK — using dot notation in config
} else if (/sk[-_]|secret|password|private.*key/i.test(c) && !/process\\.env\\./.test(c)) {
  issues.push('Possible hardcoded secret detected in app.config — use environment variables.');
}
if (issues.length) { console.error('Warning: ' + issues.join(' | ')); process.exit(2); }
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          statusMessage: 'Checking Expo +api.ts handlers for input validation',
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty'); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\+api\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
const exports = c.match(/export\\s+(?:async\\s+)?function\\s+(GET|POST|PUT|PATCH|DELETE)/g) || [];
const warnings = [];
for (const exp of exports) {
  const fnName = exp.match(/(GET|POST|PUT|PATCH|DELETE)/)?.[1];
  // Find the function body (rough heuristic)
  const fnIdx = c.indexOf(exp);
  const body = c.slice(fnIdx, fnIdx + 800);
  if (fnName !== 'GET' && !/validate|parse|safeParse|schema|zod|yup/i.test(body)) {
    warnings.push('Warning: +api.ts ' + fnName + ' handler has no apparent input validation. Always validate request data.');
  }
}
if (warnings.length) { console.error(warnings.join(' | ')); process.exit(2); }
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
