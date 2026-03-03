import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const reactNativeProfile: Profile = {
  id: 'frameworks/react-native',
  name: 'React Native',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['react-native'],
  dependsOn: ['languages/typescript'],
  contributions: {
    claudeMd: [{
      heading: 'React Native Conventions',
      order: 20,
      content: `## React Native Conventions

Cross-platform mobile with React patterns. Native modules for platform-specific features.

**Detailed rules:** see \`.claude/rules/react-native/\` directory.

**Key rules:**
- Use \`FlatList\`/\`SectionList\` with \`keyExtractor\` — never \`ScrollView\` for dynamic lists
- Platform-specific code via \`.ios.ts\`/\`.android.ts\` suffixes or \`Platform.select()\`
- Navigation with React Navigation — type-safe route params
- Performance: avoid inline styles in render, use \`useCallback\` for list item callbacks`,
    }],
    settings: {
      permissions: {
        allow: [
          'Bash(npx react-native:*)',
          'Bash(npx react-native run-ios:*)',
          'Bash(npx react-native run-android:*)',
          'Bash(npx react-native start:*)',
          'Bash(npx react-native log-ios:*)',
          'Bash(npx react-native log-android:*)',
          'Bash(npx metro:*)',
          'Bash(npx pod-install:*)',
          'Bash(cd ios && pod install:*)',
          'Bash(adb:*)',
          'Bash(xcrun simctl:*)',
        ],
      },
    },
    rules: [
      {
        path: 'react-native/architecture-and-bridge.md',
        paths: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
        governance: 'mandatory',
        description: 'New Architecture patterns, TurboModules, Fabric, and native bridge safety',
        content: `# React Native Architecture & Native Bridge

## New Architecture: TurboModules + Fabric

### TurboModule Workflow
1. Define TypeScript spec in \`specs/Native<Name>.ts\` extending \`TurboModule\`
2. Configure Codegen in \`package.json\` under \`codegenConfig\`
3. Implement platform-specific code (Kotlin/ObjC++) extending generated spec class
4. Register the package in \`MainApplication.kt\` (Android) / AppDelegate (iOS)
- Use \`TurboModuleRegistry.getEnforcing<Spec>()\` for strict typed access
- Never use untyped \`NativeModules\` — no compile-time checks, silent native crashes

## Native Bridge Safety
- Always handle errors crossing the native bridge — unhandled native exceptions crash the app
- Never pass non-serializable data across the bridge (functions, class instances, circular refs)
- Use Promises or callbacks for async native methods — never block the JS thread
- Batch bridge calls when possible — each call has overhead even with JSI
- Validate return types from native modules — native may return null/undefined unexpectedly
- Wrap all bridge calls in try/catch with fallback values

## Fabric Renderer
- Fabric enables synchronous access to the native view hierarchy from JavaScript
- Use Fabric-compatible third-party libraries — check compatibility before adopting
- Fabric enables concurrent rendering features from React 18+ (Suspense, transitions)
- View flattening in Fabric automatically reduces the native view hierarchy depth
`,
      },
      {
        path: 'react-native/performance.md',
        paths: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
        governance: 'mandatory',
        description: 'React Native performance optimization: lists, rendering, startup, memory, and frame rate',
        content: `# React Native Performance

## Frame Rate Targets
- Target 60 FPS minimum — monitor both JS thread and UI thread frame rates
- Always measure performance in release builds — dev mode adds significant overhead

## List Performance
- Use \`FlatList\`/\`SectionList\` for all lists — never \`ScrollView\` with \`.map()\` for >20 items
- Implement \`getItemLayout\` for fixed-height rows to skip measurement
- Use \`keyExtractor\` with stable unique IDs — never array indices
- Set \`windowSize\`, \`maxToRenderPerBatch\`, \`initialNumToRender\` for tuning
- Use \`React.memo\` on list item components — FlatList re-renders items frequently
- Use \`useCallback\` for \`renderItem\` and \`keyExtractor\` to prevent unnecessary re-renders
- Consider FlashList or Legend List as drop-in replacements for better recycling

## Animation Performance
- Use Reanimated for UI-thread animations — JS-driven animations cause frame drops
- Use \`useNativeDriver: true\` with built-in \`Animated\` API
- Use \`LayoutAnimation\` for simple fire-and-forget layout transitions
- Use \`transform\` instead of animating \`width\`/\`height\` — avoids expensive re-scaling
- Defer heavy work with \`InteractionManager.runAfterInteractions()\`

## Startup Optimization
- Enable Hermes engine — precompiled bytecode reduces parse time by up to 50%
- Lazy-load screens not needed at startup
- Minimize initial bundle — use \`metro-bundle-analyzer\` to identify large imports
- Pre-load critical assets during splash screen phase
- Use dynamic \`import()\` for non-critical modules

## Rendering Optimization
- Use \`React.memo\` for components that re-render frequently with same props
- Avoid inline objects/arrays/functions in JSX props — use \`useMemo\`/\`useCallback\`
- Remove \`console.log\` in production — use \`babel-plugin-transform-remove-console\`
- Use \`removeClippedSubviews\` on large off-screen view hierarchies

## Memory Management
- Clean up subscriptions, timers, and event listeners in \`useEffect\` cleanup
- Use image caching library (react-native-fast-image or expo-image)
- Monitor memory with Xcode Instruments (iOS) and Android Profiler (Android)
- Watch for retained closures capturing large objects
`,
      },
      {
        path: 'react-native/navigation-and-deeplinks.md',
        paths: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
        governance: 'mandatory',
        description: 'React Navigation patterns, deep linking, and type-safe routing',
        content: `# React Navigation & Deep Linking

## Type-Safe Navigation
- Define \`RootStackParamList\` type mapping screen names to their param types
- Use \`NativeStackScreenProps<RootStackParamList, 'ScreenName'>\` for typed route/navigation props
- Declare global \`ReactNavigation.RootParamList\` for typed \`useNavigation()\` everywhere
- Never use \`any\` type for route params — runtime crashes when params are missing

## Deep Linking Configuration
- Configure deep linking from the start — extremely hard to retrofit later
- Define a \`linking\` config mapping URL paths to screen names with param extraction
- Handle both universal links (iOS) and app links (Android) for production apps
- Test deep links on both platforms: \`npx uri-scheme open\` or \`adb shell am start\`
- Validate and sanitize incoming URL parameters — malicious apps can send crafted URLs

## Android Back Button
- Handle hardware back with \`BackHandler\` or React Navigation's \`beforeRemove\` listener
- Confirm exit on root screen — prevent accidental app close
- Test the full back stack flow with nested navigators

## Navigation Best Practices
- Use \`@react-navigation/native-stack\` over \`@react-navigation/stack\` — uses platform navigation controllers
- Use \`navigation.replace()\` instead of \`navigate()\` for auth flows to prevent going back to login
- Pass minimal serializable data in params — fetch full data on the target screen
- Use \`useFocusEffect\` for data refreshing when a screen receives focus
`,
      },
      {
        path: 'react-native/gestures-and-animations.md',
        paths: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
        governance: 'recommended',
        description: 'Gesture handling and animation patterns for React Native',
        content: `# Gestures & Animations

## Gesture Handling
- Use \`react-native-gesture-handler\` for complex gestures — processes on the native thread
- Prefer \`Gesture\` composable API (RNGH v2+) over the old handler-based API
- Always assign \`testID\` to gesture-enabled components for E2E testing
- Combine gesture handlers with Reanimated shared values for fluid gesture-driven animations

## Reanimated Best Practices
- Define animations in worklets (UI thread) — never run animation logic on JS thread
- Use \`useSharedValue\` for values that drive animations — no serialization overhead
- Use \`useAnimatedStyle\` to create styles driven by shared values
- Use \`withSpring\`, \`withTiming\`, \`withDecay\` for declarative animation curves
- Use \`runOnJS\` to call JS-thread functions from worklets (state updates, navigation)

## Animated API (built-in)
- Always set \`useNativeDriver: true\` — supports \`transform\` and \`opacity\` only
- Native driver does NOT support \`width\`, \`height\`, \`padding\`, \`margin\`
- Use \`Animated.event\` with native driver for scroll-driven animations
- Use \`LayoutAnimation.configureNext()\` for simple layout transitions
`,
      },
      {
        path: 'react-native/mobile-security.md',
        paths: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
        governance: 'mandatory',
        description: 'React Native mobile-specific security patterns',
        content: `# React Native Mobile Security

## Sensitive Data Storage
- NEVER store secrets, tokens, or passwords in AsyncStorage — unencrypted plaintext
- Use \`react-native-keychain\` (iOS Keychain / Android Keystore) for credentials and tokens
- Use \`react-native-encrypted-storage\` for sensitive data that must persist
- Clear secure storage on user logout

## Network Security
- Use TLS (HTTPS) for ALL network requests — no exceptions
- Enable certificate pinning for sensitive APIs (banking, auth, payments)
- Do not disable ATS (App Transport Security) on iOS — configure exceptions only for specific domains
- Validate SSL certificates — do not ignore SSL errors in production

## Code Security
- Enable ProGuard/R8 obfuscation for Android release builds
- Do not bundle API keys or secrets in the JavaScript bundle — they are extractable
- Use environment-specific configs via \`react-native-config\` — never hardcode URLs
- Enable Hermes bytecode — harder to reverse-engineer than plain JavaScript

## App Integrity
- Implement jailbreak/root detection for sensitive apps (banking, health)
- Use code signing verification to detect tampering
- Set \`android:allowBackup="false"\` in AndroidManifest.xml to prevent data extraction
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## React Native-Specific Review

### Platform & Architecture
- Check for platform-specific code handled correctly (\`.ios.tsx\`/\`.android.tsx\` files or \`Platform.select\`/\`Platform.OS\`)
- Verify TurboModule specs are properly typed and use \`TurboModuleRegistry.getEnforcing\` or \`.get\`
- Check that all native bridge calls have error handling — unhandled native exceptions crash the app
- Verify Codegen config in \`package.json\` matches the spec files

### Styling & Components
- Verify \`StyleSheet.create()\` usage — flag inline style objects in JSX
- Check for deprecated Touchable* components — should use \`Pressable\` instead
- Verify \`SafeAreaView\` or safe-area-context usage for notch handling
- Check \`KeyboardAvoidingView\` configuration is platform-appropriate (\`behavior\` prop)

### Lists & Performance
- Verify \`FlatList\`/\`SectionList\` usage for lists — flag \`ScrollView\` with \`.map()\` for >20 items
- Check FlatList has \`keyExtractor\`, and ideally \`getItemLayout\` for fixed-height rows
- Verify list item components are wrapped in \`React.memo\`
- Check for \`console.log\` statements that should be removed for production
- Flag animations without \`useNativeDriver: true\` or without Reanimated

### Navigation & Security
- Verify React Navigation type safety (\`RootStackParamList\`, typed \`route.params\`)
- Check deep linking configuration covers all navigable screens
- Verify sensitive data uses Keychain/Keystore, NOT AsyncStorage
- Check that API keys are not bundled in the JS source

### Available Skills
- \`rn-turbomodule-generator\`: Generate TurboModule with TypeScript spec, Codegen config, and platform implementations
- \`rn-screen-generator\`: Generate a complete React Native screen with navigation, styling, and testing`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## React Native Testing

### Component Testing
- Use React Native Testing Library (\`@testing-library/react-native\`) — test user-visible behavior
- Query by \`testID\`, \`accessibilityLabel\`, \`text\`, or \`role\` — avoid querying by component type
- Mock native modules with \`jest.mock\` in \`jest.setup.js\` — native modules are unavailable in tests
- Test platform-specific rendering by mocking \`Platform.OS\`

### Navigation Testing
- Mock \`@react-navigation/native\` hooks (\`useNavigation\`, \`useRoute\`, \`useFocusEffect\`)
- Test screen transitions by verifying \`navigation.navigate\` calls with correct params
- Test deep link resolution by verifying the linking config maps URLs to screens

### Native Module Testing
- Mock TurboModule specs completely — test the JS interface, not the native implementation
- Test error handling for native bridge failures (network errors, permission denials)
- Test platform-specific behavior by toggling \`Platform.OS\` in tests

### E2E Testing (Detox / Maestro)
- Write E2E tests for critical user flows (onboarding, auth, core features)
- Use \`testID\` props on all interactive elements for reliable selectors
- Test on both iOS and Android — platform-specific bugs are common
- Test deep linking and push notification flows end-to-end
- Test app lifecycle: background, foreground, kill, and restore

### Available Skills
- \`rn-screen-generator\`: Generate a complete React Native screen with navigation, styling, and testing`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## React Native Security Review

### Sensitive Data
- Verify NO credentials, tokens, or secrets are stored in AsyncStorage (unencrypted)
- Check that react-native-keychain or encrypted-storage is used for sensitive data
- Verify API keys are not hardcoded in JS/TS files — they are extractable from the bundle
- Check that sensitive data is not logged via console.log or crash reporting

### Network Security
- Verify all API calls use HTTPS — flag any HTTP URLs
- Check for disabled ATS (App Transport Security) in Info.plist
- Verify certificate pinning is implemented for sensitive APIs (auth, payments)
- Check that error responses from APIs do not expose internal details

### App Security
- Verify ProGuard/R8 is enabled for Android release builds
- Check that \`android:allowBackup="false"\` is set in AndroidManifest.xml
- Verify deep link URL schemes are validated — malicious apps can send crafted URLs
- Check for jailbreak/root detection in sensitive apps`,
      },
      {
        name: 'mobile-tester',
        type: 'define',
        description: 'Mobile E2E testing specialist for React Native applications',
        prompt: `You are a mobile E2E testing specialist for React Native applications. You write and review E2E tests that validate critical user flows across both iOS and Android platforms.

## Testing Approach
- Write Detox or Maestro tests for critical user flows (onboarding, authentication, core features, payments)
- Verify tests work on both iOS and Android — test platform-specific behavior explicitly
- Use \`testID\` props for all interactive elements — these are the most reliable selectors
- Use \`accessibilityLabel\` as fallback selectors for elements without testID
- Handle platform-specific test behavior with conditional assertions

## Test Structure
- Organize tests by user flow, not by screen
- Use beforeEach/afterEach for app state reset and cleanup
- Test network error states with mocked API responses
- Test offline behavior and connectivity restoration
- Test push notification interactions end-to-end
- Test deep linking with \`device.openURL()\`

## App Lifecycle Testing
- Test background/foreground transitions (state persistence, token refresh)
- Test app termination and cold start (data restoration)
- Test permission dialogs (camera, location, notifications) — grant and deny paths
- Test orientation changes for responsive layouts

## Performance Validation
- Verify startup time stays within acceptable thresholds
- Check that list scrolling maintains 60 FPS
- Monitor memory usage during extended test sessions
- Flag animation jank visible during test execution`,
      },
    ],
    skills: [
      {
        name: 'rn-turbomodule-generator',
        description: 'Generate a complete TurboModule with TypeScript spec, Codegen config, and platform implementations',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# React Native TurboModule Generator

Generate a complete TurboModule following the New Architecture patterns:

## Files to Generate

### 1. TypeScript Spec (\`specs/Native<Name>.ts\`)
\`\`\`tsx
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Define methods with strict types
  // Use Promise<T> for async methods
  // Use string | null for optional returns
}

export default TurboModuleRegistry.getEnforcing<Spec>('Native<Name>');
\`\`\`

### 2. Codegen Config (add to \`package.json\`)
\`\`\`json
{
  "codegenConfig": {
    "name": "Native<Name>Spec",
    "type": "modules",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.<projectname>"
    }
  }
}
\`\`\`

### 3. Android Implementation (\`android/.../<Name>Module.kt\`)
- Extend generated \`Native<Name>Spec\` class
- Implement all methods from the spec
- Create a \`<Name>Package\` extending \`BaseReactPackage\`
- Register in \`MainApplication.kt\` \`getPackages()\`

### 4. iOS Implementation (\`ios/RCT<Name>.mm\` + \`RCT<Name>.h\`)
- Implement the \`@protocol\` generated by Codegen
- Return the TurboModule shared pointer in \`getTurboModule:\`
- Register via \`modulesProvider\` in Codegen config

### 5. JS Wrapper (\`src/modules/<name>.ts\`)
- Import the spec and wrap with error handling
- Export typed functions for the rest of the app
- Handle null returns and bridge errors gracefully
`,
      },
      {
        name: 'rn-screen-generator',
        description: 'Generate a complete React Native screen with navigation, styling, and testing',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# React Native Screen Generator

Generate a complete screen following React Native conventions:

## Files to Generate

### 1. Screen Component (\`screens/<Name>Screen.tsx\`)
- Import typed navigation props from navigation types
- Use \`SafeAreaView\` or safe-area-context for root container
- Handle keyboard with \`KeyboardAvoidingView\` if the screen has inputs
- Use \`StyleSheet.create()\` at the bottom of the file
- Handle loading, error, and empty states
- Use \`useFocusEffect\` for data that refreshes on screen focus
- Add \`testID\` to all interactive elements

### 2. Navigation Type (\`navigation/types.ts\`)
- Add the screen to \`RootStackParamList\` with proper param types
- Use \`undefined\` for screens with no params

### 3. Test File (\`__tests__/<Name>Screen.test.tsx\`)
- Mock navigation hooks and native modules
- Test initial render (loading state)
- Test data display (happy path)
- Test error state
- Test user interactions
- Test platform-specific behavior

### Conventions
- Screen files end with \`Screen\` suffix: \`ProfileScreen.tsx\`
- One screen per file
- Extract sub-components when the screen exceeds 150 lines
- Use custom hooks for data fetching logic: \`use<Name>Data.ts\`
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for inline style objects in React Native code',
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.(tsx|jsx)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/style=\\{\\{/.test(c)&&!/StyleSheet/.test(c)){const count=(c.match(/style=\\{\\{/g)||[]).length;if(count>=2){console.error(\'WARNING: \'+count+\' inline style objects detected. Use StyleSheet.create() for better performance and memory efficiency.\');process.exit(2)}}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for sensitive data in AsyncStorage',
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.(tsx|jsx|ts|js)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/AsyncStorage\\.setItem/.test(c)&&/(token|password|secret|credential|apiKey|api_key)/i.test(c)){console.error(\'SECURITY: Storing sensitive data in AsyncStorage (unencrypted). Use react-native-keychain or react-native-encrypted-storage instead.\');process.exit(2)}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for ScrollView with .map() in React Native code',
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.(tsx|jsx)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/<ScrollView[^>]*>[\\s\\S]*\\.map\\s*\\(/m.test(c)){console.error(\'WARNING: ScrollView with .map() detected. Use FlatList or SectionList for lists to enable view recycling and better memory usage.\');process.exit(2)}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          statusMessage: 'Checking for deprecated Touchable* components in React Native code',
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.(tsx|jsx)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|TouchableNativeFeedback/.test(c)&&!/Pressable/.test(c)){console.error(\'WARNING: Deprecated Touchable* component detected. Migrate to Pressable for better customization and future compatibility.\');process.exit(2)}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
