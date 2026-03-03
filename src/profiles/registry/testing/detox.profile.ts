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

## Element Selection Rules
- ALWAYS use \`testID\` prop as the primary element identifier — match with \`by.id()\`
- Forward \`testID\` to the nearest native component in custom components — \`testID\` only works on native views (View, Text, TouchableOpacity, etc.)
- Use unique, descriptive testID names with a consistent naming convention: \`'ScreenName.ElementDescription'\`
- Never use element text or label in testID names — test IDs must be independent of displayed content
- Use \`by.text()\` for verifying user-visible text, not for selecting interaction targets
- Use \`by.label()\` for accessibility label matching — useful for elements with dynamic text
- Never use index-based matchers (\`atIndex()\`) unless absolutely necessary — they are brittle and order-dependent
- Combine matchers with \`and()\` for precise selection: \`by.id('item').and(by.text('Expected'))\`

### Correct
\`\`\`jsx
// Component: always forward testID to native view
const LoginButton = ({ testID, onPress }) => (
  <TouchableOpacity testID={testID} onPress={onPress}>
    <Text>Log In</Text>
  </TouchableOpacity>
);

// Test: use by.id() for interaction, by.text() for verification
await element(by.id('Login.SubmitButton')).tap();
await expect(element(by.text('Welcome back!'))).toBeVisible();
\`\`\`

### Anti-Pattern
\`\`\`jsx
// BAD: testID not forwarded to native component
const LoginButton = ({ testID }) => (
  <View>
    <Text testID={testID}>Log In</Text>  // testID on Text, not the tappable element
  </View>
);

// BAD: selecting by text for interaction — breaks with i18n
await element(by.text('Log In')).tap();

// BAD: index-based selector — breaks if layout changes
await element(by.type('RCTView')).atIndex(3).tap();
\`\`\`

---

## Synchronization Rules
- Trust Detox auto-synchronization — it waits for animations, network, React Native bridge, and timers by default
- Never use arbitrary sleeps or manual polling — always use \`waitFor\` with a timeout when synchronization is insufficient
- Every \`waitFor\` call MUST include \`.withTimeout(ms)\` — omitting it causes the waitFor to do nothing
- Use \`device.disableSynchronization()\` ONLY for testing loading states or infinite animations — re-enable immediately with \`device.enableSynchronization()\`
- Use \`device.setURLBlacklist()\` to ignore specific network endpoints that prevent synchronization (analytics, long-polling)

### Correct
\`\`\`typescript
// Wait for async element with explicit timeout
await waitFor(element(by.id('Dashboard.Content')))
  .toBeVisible()
  .withTimeout(10000);

// Disable sync only for loading state test
await device.disableSynchronization();
await expect(element(by.id('LoadingSpinner'))).toBeVisible();
await device.enableSynchronization();
\`\`\`

### Anti-Pattern
\`\`\`typescript
// BAD: arbitrary sleep
await new Promise(resolve => setTimeout(resolve, 3000));
await expect(element(by.id('Dashboard.Content'))).toBeVisible();

// BAD: waitFor without timeout does nothing
await waitFor(element(by.id('Dashboard.Content'))).toBeVisible();

// BAD: disabling sync globally and forgetting to re-enable
await device.disableSynchronization();
await element(by.id('Submit')).tap();
// Sync never re-enabled — all subsequent tests are unsafe
\`\`\`

---

## Device API Usage
- Use \`device.launchApp({newInstance: true})\` for a fresh app start — use in \`beforeAll\` for suite-level setup
- Use \`device.reloadReactNative()\` for faster state resets — only resets JS state, native state persists
- Use \`device.sendToHome()\` followed by \`device.launchApp({newInstance: false})\` to test background/foreground transitions
- Use \`device.openURL({url: 'scheme://path'})\` to test deep link handling
- Use \`device.setURLBlacklist([patterns])\` to block network requests that interfere with synchronization
- Use \`device.launchApp({delete: true})\` to uninstall and reinstall the app for a truly clean state

---

## Test Structure
- Structure tests by user journey or feature flow: \`describe('Login Flow', ...)\`
- Keep each test focused on one user flow step — one assertion per test when possible
- Use \`beforeAll\` for expensive one-time setup (app launch, authentication)
- Use \`beforeEach\` with \`device.reloadReactNative()\` for per-test state isolation
- Clean up test data in \`afterAll\` — do not leave artifacts that affect other test suites
- Run tests serially in CI — parallel execution requires dedicated devices per worker
- Use \`test.retryTimes(count)\` via Jest for flaky test mitigation — but always investigate root cause

---

## Artifacts & Debugging
- Configure artifacts in \`.detoxrc.js\` to capture: screenshots, videos, device logs, timeline traces
- Use \`shouldTakeAutomaticSnapshots\` to auto-capture screenshots on test failure
- Use \`--loglevel verbose\` or \`--loglevel trace\` to debug synchronization issues in CI
- Use \`device.takeScreenshot('name')\` for manual screenshot capture at specific test points
- Keep only failed test artifacts in CI to save storage: \`"shouldKeepArtifactsOfPassingTests": false\`
`,
      },
      {
        path: 'testing/detox-configuration.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', 'e2e/**/*'],
        governance: 'recommended',
        description: 'Detox configuration best practices for .detoxrc.js, test runner, and CI setup',
        content: `# Detox Configuration Best Practices

## .detoxrc.js Structure
Configure Detox at the project root with \`.detoxrc.js\` (or \`.detoxrc.json\`, \`detox.config.js\`):

\`\`\`javascript
/** @type {import('detox').DetoxConfig} */
module.exports = {
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
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
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
};
\`\`\`

## Jest Configuration for Detox (e2e/jest.config.js)
\`\`\`javascript
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.{js,ts}'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
\`\`\`

## Test File Directory Structure
\`\`\`
e2e/
  jest.config.js          # Jest config for Detox
  login.test.ts           # Login flow E2E tests
  onboarding.test.ts      # Onboarding flow E2E tests
  checkout.test.ts        # Checkout flow E2E tests
  artifacts/              # Auto-generated test artifacts
.detoxrc.js               # Detox configuration
\`\`\`

## CI Configuration Tips
- Build the app binary once and reuse across test runs — separate build and test steps
- Use headless emulator/simulator mode in CI: \`--headless\` or \`-no-window\`
- Use \`--retries N\` to re-run failed test files up to N times
- Use \`--reuse\` flag to avoid reinitializing the device between test files
- Set \`maxWorkers: 1\` in Jest config — Detox tests must run serially per device
- Increase \`setupTimeout\` in CI (120000ms+) to account for slower emulator boot times
- Persist artifacts directory as CI build artifacts for post-failure analysis
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "e2e/.*\\.(test|spec)\\.(ts|js)$" && grep -cE "\\b(test\\.only|describe\\.only|fit|fdescribe)\\b" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:1:Focused test detected (.only) in Detox E2E test — remove before committing to avoid skipping other E2E tests" || true',
            timeout: 10,
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "e2e/.*\\.(test|spec)\\.(ts|js)$" && grep -nE "waitFor\\(" "$CLAUDE_FILE_PATH" | while read line; do linenum=$(echo "$line" | cut -d: -f1); context=$(sed -n "${linenum},$((linenum+3))p" "$CLAUDE_FILE_PATH"); echo "$context" | grep -q "withTimeout" || { echo "HOOK_EXIT:0:Warning: waitFor() without .withTimeout() at line $linenum — without a timeout, waitFor does nothing in Detox"; break; }; done 2>/dev/null || true',
            timeout: 10,
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
