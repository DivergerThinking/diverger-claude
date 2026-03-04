import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const detoxProfile: Profile = {
  id: 'testing/detox',
  name: 'Detox',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['detox'],
  dependsOn: ['frameworks/react-native'],
  contributions: {
    claudeMd: [
      {
        heading: 'Detox Conventions',
        order: 30,
        content: `## Detox Conventions

Gray-box E2E testing for React Native. Automatic synchronization with the app.

**Detailed rules:** see \`.claude/rules/detox/\` directory.

**Key rules:**
- \`element(by.id(...))\` for reliable selectors — set \`testID\` props on components
- Detox auto-syncs with animations and network — avoid manual waits
- \`device.reloadReactNative()\` in \`beforeEach\` for clean state
- Run on CI with \`detox build\` + \`detox test\` — release builds for reliability`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx detox:*)',
          'Bash(detox test:*)',
          'Bash(detox build:*)',
          'Bash(npm run e2e:*)',
          'Bash(yarn e2e:*)',
          'Bash(pnpm e2e:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/detox-conventions.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', 'e2e/**/*'],
        governance: 'mandatory',
        description: 'Detox E2E testing conventions — element selection, synchronization, device API, and test structure',
        content: `# Detox E2E Testing Conventions

## Element Selection
- ALWAYS use \`testID\` prop with \`by.id()\` as primary matcher
- Forward \`testID\` to the nearest native component in custom components
- Use consistent naming: \`'ScreenName.ElementDescription'\`
- Use \`by.text()\` for verification, not interaction targets
- Never use index-based matchers (\`atIndex()\`) — brittle and order-dependent
- Combine matchers with \`and()\` for precise selection

## Synchronization
- Trust Detox auto-sync — it waits for animations, network, bridge, and timers
- Never use arbitrary sleeps — use \`waitFor\` with \`.withTimeout(ms)\`
- Every \`waitFor\` MUST include \`.withTimeout(ms)\` — without it, waitFor is a no-op
- Use \`device.disableSynchronization()\` ONLY for loading state tests — re-enable immediately
- Use \`device.setURLBlacklist()\` for endpoints that block sync (analytics, long-polling)

## Device API
- \`device.launchApp({newInstance: true})\` — fresh start in \`beforeAll\`
- \`device.reloadReactNative()\` — fast JS-only reset in \`beforeEach\`
- \`device.sendToHome()\` + \`launchApp({newInstance: false})\` — background/foreground testing
- \`device.openURL({url: 'scheme://path'})\` — deep link testing
- \`device.launchApp({delete: true})\` — full reinstall for clean state

## Test Structure
- Structure by user journey: \`describe('Login Flow', ...)\`
- Keep each test focused on one flow step
- \`beforeAll\` for expensive setup, \`beforeEach\` for per-test reset
- Clean up in \`afterAll\` — no artifacts left for other suites
- Run serially in CI — parallel requires dedicated devices per worker

## Artifacts & Debugging
- Configure in \`.detoxrc.js\`: screenshots, videos, logs, timeline traces
- Use \`shouldTakeAutomaticSnapshots\` for failure screenshots
- Use \`--loglevel verbose\` to debug sync issues in CI
- Keep only failed test artifacts: \`"shouldKeepArtifactsOfPassingTests": false\`
`,
      },
      {
        path: 'testing/detox-configuration.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', 'e2e/**/*'],
        governance: 'recommended',
        description: 'Detox configuration best practices for .detoxrc.js, test runner, and CI setup',
        content: `# Detox Configuration Best Practices

## .detoxrc.js Structure
- Configure \`testRunner\` with Jest: args, setupTimeout (120000ms), teardownTimeout (30000ms)
- Define \`apps\` for each platform: iOS (\`ios.app\` + xcodebuild), Android (\`android.apk\` + gradle)
- Define \`devices\`: iOS simulator and Android emulator with specific device types
- Create \`configurations\` combining device + app (e.g., \`ios.sim.debug\`, \`android.emu.debug\`)
- Configure \`artifacts\`: screenshots on failure, video on failure, logs and timeline for all

## Jest Configuration (e2e/jest.config.js)
- Set \`testMatch\` to \`e2e/**/*.test.{js,ts}\`
- Set \`testTimeout: 120000\` and \`maxWorkers: 1\` (serial execution)
- Use Detox Jest runner globals: globalSetup, globalTeardown, reporter, testEnvironment

## Directory Structure
- \`e2e/\` — test files organized by user flow
- \`e2e/jest.config.js\` — Jest config for Detox
- \`e2e/artifacts/\` — auto-generated test artifacts
- \`.detoxrc.js\` — Detox configuration at project root

## CI Configuration
- Build binary once, reuse across test runs (separate build and test steps)
- Use headless mode: \`--headless\` or \`-no-window\`
- Use \`--retries N\` to re-run failed test files
- Use \`--reuse\` flag to avoid reinitializing device between files
- Set \`maxWorkers: 1\` — Detox tests must run serially per device
- Increase \`setupTimeout\` in CI (120000ms+) for slower emulator boot
- Persist artifacts as CI build artifacts for post-failure analysis
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Detox E2E Test Review Checklist
Available skills: detox-test-generator
- Verify \`testID\` props are used for element selection — \`by.id()\` should be the primary matcher
- Check that \`testID\` is forwarded to native components in custom React Native components
- Verify testID naming follows a consistent convention (e.g., \`'ScreenName.ElementDescription'\`)
- Check that no \`by.type()\` or index-based selectors (\`atIndex()\`) are used unless justified
- Verify no arbitrary sleeps or manual waits — use Detox auto-sync or \`waitFor().withTimeout()\`
- Check that every \`waitFor\` call includes \`.withTimeout(ms)\` — without it, waitFor is a no-op
- Verify \`device.disableSynchronization()\` is always paired with \`device.enableSynchronization()\`
- Check proper use of device API: \`launchApp({newInstance: true})\` vs \`reloadReactNative()\` for state resets
- Verify tests are independent — each test must work without relying on state from previous tests
- Check that test data is cleaned up in \`afterAll\` and state is reset in \`beforeEach\`
- Verify artifacts are configured for CI failure debugging (screenshots, logs)
- Check that both iOS and Android configurations exist in \`.detoxrc.js\` for cross-platform coverage`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Detox E2E Test Writing Guidelines
Available skills: detox-test-generator
- Structure tests around user journeys: group with \`describe('Feature Flow', ...)\`
- Use \`testID\` props with \`by.id()\` for all element interaction — forward testID in custom components
- Use consistent testID naming: \`'ScreenName.ElementName'\` (e.g., \`'Login.EmailInput'\`, \`'Login.SubmitButton'\`)
- Use \`device.launchApp({newInstance: true})\` in \`beforeAll\` for suite setup
- Use \`device.reloadReactNative()\` in \`beforeEach\` for faster per-test state resets
- Use \`waitFor(element(by.id('x'))).toBeVisible().withTimeout(5000)\` for async elements — always set timeout
- Use \`element.typeText()\` for keyboard input that triggers callbacks, \`element.replaceText()\` for speed
- Use \`element.clearText()\` before typing to ensure clean input state
- Use \`expect(element).toBeVisible()\` for visibility, \`toExist()\` for existence, \`toHaveText()\` for content
- Test both iOS and Android paths — configure both platforms in \`.detoxrc.js\`
- Use \`device.sendToHome()\` + \`device.launchApp({newInstance: false})\` for background/foreground testing
- Use \`device.openURL({url: 'scheme://path'})\` for deep link testing
- Keep one assertion per test step — split complex verifications into multiple tests
- Use artifacts (screenshots, logs) for debugging failures — configure in \`.detoxrc.js\``,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Detox Security Review
- Verify test data does not contain real credentials, API keys, or PII — use mock/dummy values
- Check that \`device.setURLBlacklist()\` is not accidentally blocking security-critical endpoints
- Verify deep link tests (\`device.openURL()\`) do not use production URLs or real user data
- Check that test artifacts (screenshots, logs) do not capture sensitive data on screen
- Verify CI configuration does not expose secrets in environment variables accessible to Detox
- Check that test setup does not bypass authentication in a way that masks security vulnerabilities`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Detox Test Refactoring Guidance
Available skills: detox-test-generator
- Extract repeated element interactions into reusable helper functions or screen objects
- Create a screen object pattern: one class per screen encapsulating testIDs and common actions
- Replace hardcoded testID strings with constants defined in a central \`testIDs.ts\` file
- Consolidate repeated login/authentication flows into shared \`beforeAll\` helpers
- Replace \`device.launchApp({newInstance: true})\` with \`device.reloadReactNative()\` where only JS reset is needed
- Move common device setup and teardown into shared test utilities
- Extract \`waitFor\` patterns with standard timeouts into utility functions`,
      },
    ],
    skills: [
      {
        name: 'detox-test-generator',
        description: 'Generate Detox E2E test suites for React Native user flows',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Detox E2E Test Generator

## Purpose
Generate comprehensive Detox E2E test suites for React Native user flows following gray-box testing best practices.

## Process

### 1. Analyze the User Flow
- Identify all screens involved in the flow
- Map user interactions: taps, text input, scrolling, navigation
- Identify async transitions that need waitFor
- Identify preconditions: authentication, data seeding, app state

### 2. Set Up Test File Structure
\`\`\`typescript
describe('Feature Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // One-time setup: login, seed data
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Per-test state reset
  });

  afterAll(async () => {
    // Clean up test data
  });

  it('should [expected behavior] when [user action]', async () => {
    // Arrange: navigate to the right screen
    // Act: perform user interaction
    // Assert: verify expected outcome
  });
});
\`\`\`

### 3. Write Tests in This Order
1. **Happy path**: complete the flow successfully end-to-end
2. **Validation errors**: invalid input shows appropriate error messages
3. **Edge cases**: empty states, long text, special characters
4. **Device interactions**: background/foreground, deep links, rotation
5. **Cross-platform**: iOS-specific and Android-specific behaviors

### 4. Test Templates

#### Tap and Verify
\`\`\`typescript
it('should navigate to profile when avatar is tapped', async () => {
  await element(by.id('Home.AvatarButton')).tap();
  await expect(element(by.id('Profile.Screen'))).toBeVisible();
});
\`\`\`

#### Text Input and Submit
\`\`\`typescript
it('should login with valid credentials', async () => {
  await element(by.id('Login.EmailInput')).typeText('user@example.com');
  await element(by.id('Login.PasswordInput')).typeText('testPassword123');
  await element(by.id('Login.SubmitButton')).tap();
  await waitFor(element(by.id('Home.Screen')))
    .toBeVisible()
    .withTimeout(10000);
});
\`\`\`

#### Scroll and Find
\`\`\`typescript
it('should find item at bottom of list', async () => {
  await waitFor(element(by.id('ItemList.Item_42')))
    .toBeVisible()
    .whileElement(by.id('ItemList.ScrollView'))
    .scroll(200, 'down');
  await expect(element(by.id('ItemList.Item_42'))).toBeVisible();
});
\`\`\`

#### Background/Foreground
\`\`\`typescript
it('should preserve state when returning from background', async () => {
  await element(by.id('Editor.TextInput')).typeText('draft content');
  await device.sendToHome();
  await device.launchApp({ newInstance: false });
  await expect(element(by.id('Editor.TextInput'))).toHaveText('draft content');
});
\`\`\`

#### Deep Link
\`\`\`typescript
it('should open product detail via deep link', async () => {
  await device.openURL({ url: 'myapp://product/123' });
  await waitFor(element(by.id('ProductDetail.Screen')))
    .toBeVisible()
    .withTimeout(5000);
  await expect(element(by.id('ProductDetail.Title'))).toHaveText('Product 123');
});
\`\`\`

## Quality Checklist
- [ ] All element interactions use \`by.id()\` with testID props
- [ ] testID naming follows \`ScreenName.ElementName\` convention
- [ ] All \`waitFor\` calls include \`.withTimeout(ms)\`
- [ ] Tests are independent — each can run in isolation
- [ ] State is reset in \`beforeEach\` with \`device.reloadReactNative()\`
- [ ] Both iOS and Android paths are considered
- [ ] Assertions use \`toBeVisible()\`, \`toExist()\`, or \`toHaveText()\` appropriately
- [ ] No arbitrary sleeps or manual waits
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "e2e/.*\\.(test|spec)\\.(ts|js)$" && grep -cE "\\b(test\\.only|describe\\.only|fit|fdescribe)\\b" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Focused test detected (.only) in Detox E2E test — remove before committing to avoid skipping other E2E tests" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for .only in Detox E2E tests',
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "e2e/.*\\.(test|spec)\\.(ts|js)$" && grep -nE "waitFor\\(" "$FILE_PATH" | while read line; do linenum=$(echo "$line" | cut -d: -f1); context=$(sed -n "${linenum},$((linenum+3))p" "$FILE_PATH"); echo "$context" | grep -q "withTimeout" || { echo "Warning: waitFor() without .withTimeout() at line $linenum — without a timeout, waitFor does nothing in Detox" >&2; exit 2; }; done 2>/dev/null || exit 0',
            timeout: 10,
            statusMessage: 'Checking for waitFor() without .withTimeout() in Detox tests',
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'detox-config',
        filePath: '.detoxrc.js',
        config: {
          testRunner: {
            args: {
              $0: 'jest',
              config: 'e2e/jest.config.js',
            },
            jest: {
              setupTimeout: 120000,
              teardownTimeout: 30000,
            },
          },
          apps: {
            'ios.debug': {
              type: 'ios.app',
              binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/App.app',
              build: 'xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
            },
            'android.debug': {
              type: 'android.apk',
              binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
              build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
              reversePorts: [8081],
            },
          },
          devices: {
            simulator: {
              type: 'ios.simulator',
              device: { type: 'iPhone 15' },
            },
            emulator: {
              type: 'android.emulator',
              device: { avdName: 'Pixel_7_API_34' },
            },
          },
          configurations: {
            'ios.sim.debug': {
              device: 'simulator',
              app: 'ios.debug',
            },
            'android.emu.debug': {
              device: 'emulator',
              app: 'android.debug',
            },
          },
          artifacts: {
            rootDir: 'e2e/artifacts',
            plugins: {
              screenshot: { shouldTakeAutomaticSnapshots: true, keepOnlyFailedTestsArtifacts: true },
              video: 'failing',
              log: 'all',
              timeline: 'all',
            },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
