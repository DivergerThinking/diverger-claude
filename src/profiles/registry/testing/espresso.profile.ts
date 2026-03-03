import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const espressoProfile: Profile = {
  id: 'testing/espresso',
  name: 'Espresso',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['espresso'],
  dependsOn: ['languages/kotlin'],
  contributions: {
    claudeMd: [
      {
        heading: 'Espresso Conventions',
        order: 30,
        content: `## Espresso Conventions

Android UI testing. ViewMatchers -> ViewActions -> ViewAssertions pattern.

**Detailed rules:** see \`.claude/rules/espresso/\` directory.

**Key rules:**
- \`onView(withId(...))\` -> \`.perform(click())\` -> \`.check(matches(isDisplayed()))\`
- Use \`IdlingResource\` for async operations — never \`Thread.sleep()\`
- Test IDs via \`android:contentDescription\` or resource IDs
- Keep tests focused on user-visible behavior, not internal state`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(./gradlew connectedAndroidTest:*)',
          'Bash(./gradlew app:connectedAndroidTest:*)',
          'Bash(./gradlew test:*)',
          'Bash(adb shell am instrument:*)',
          'Bash(adb logcat:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/espresso-conventions.md',
        paths: ['**/*Test.java', '**/*Test.kt', 'src/androidTest/**/*'],
        governance: 'mandatory',
        description:
          'Espresso testing conventions — view matchers, actions, assertions, synchronization, and test structure',
        content: `# Espresso Testing Conventions

## Core Pattern: Find -> Perform -> Check
- ALWAYS follow: \`onView(matcher).perform(action).check(assertion)\`
- Use \`onView()\` for standard views; \`onData()\` only for AdapterView content (ListView, Spinner)
- Chain related actions in a single \`perform()\` call for atomic operations

## ViewMatcher Priority
1. \`withId(R.id.x)\` — resource ID (most stable, preferred)
2. \`withText("text")\` — combine with \`allOf()\` to disambiguate
3. \`withContentDescription("desc")\` — accessibility label (image buttons)
4. \`withHint("hint")\` — placeholder text (EditText fields)
5. Hierarchical matchers — last resort only
- Use \`allOf()\` to combine matchers when a single matcher is ambiguous
- NEVER use \`isDisplayed()\` as standalone matcher — use in assertions only

## ViewAction Rules
- Call \`closeSoftKeyboard()\` after \`typeText()\` — keyboard may obscure subsequent views
- Use \`clearText()\` before \`typeText()\` when replacing existing content
- Call \`scrollTo()\` before actions on off-screen views within ScrollView
- Use \`replaceText()\` for speed when IME callbacks are not needed

## Assertion Rules
- Use \`check(matches(...))\` for positive assertions on view properties
- Use \`check(doesNotExist())\` for hierarchy absence vs \`not(isDisplayed())\` for hidden views
- Separate matching from asserting — put property under test in \`check()\`, not \`onView()\`
- Use \`hasErrorText()\` for EditText validation errors

## Synchronization Rules
- NEVER use \`Thread.sleep()\` or \`SystemClock.sleep()\` — Espresso auto-synchronizes
- Register \`IdlingResource\` for async operations (network, DB, thread pools)
- Use \`CountingIdlingResource\` — \`increment()\` before, \`decrement()\` after
- Register in \`@Before\`, unregister in \`@After\` — ALWAYS clean up
- Use \`IdlingRegistry.getInstance().register()\` (not deprecated API)

## Test Structure
- Annotate with \`@RunWith(AndroidJUnit4::class)\`, use \`ActivityScenarioRule\`
- Follow Arrange-Act-Assert pattern, keep tests independent
- Name methods descriptively: \`clickSubmit_withEmptyEmail_showsValidationError()\`
- Use Test Orchestrator with \`clearPackageData\` for full isolation in CI
- Use \`@HiltAndroidTest\` with \`HiltAndroidRule\` for Hilt-based apps
`,
      },
      {
        path: 'testing/espresso-intents-and-contrib.md',
        paths: ['**/*Test.java', '**/*Test.kt', 'src/androidTest/**/*'],
        governance: 'recommended',
        description:
          'Espresso-Intents for hermetic testing and espresso-contrib for RecyclerView, Drawer, and Picker interactions',
        content: `# Espresso-Intents & Contrib Best Practices

## Espresso-Intents — Hermetic Intent Testing
- Use \`IntentsRule\` to automatically initialize and release intent recording
- Use \`intended()\` to verify your app sends correct intents after an action
- Use \`intending().respondWith()\` to stub \`startActivityForResult()\` responses
- Always stub external intents — never let tests launch real camera, contacts, or browser
- Test both success (\`RESULT_OK\`) and cancellation (\`RESULT_CANCELED\`) paths
- Use matchers: \`hasAction()\`, \`hasData()\`, \`toPackage()\`, \`hasExtra()\`, \`hasComponent()\`
- Validate intents AFTER the triggering action — \`intended()\` checks recorded history

## Espresso-Contrib — Extended Components

### RecyclerView
- Use \`RecyclerViewActions.actionOnItemAtPosition()\` to interact by position
- Use \`RecyclerViewActions.scrollToPosition()\` to scroll to specific items
- Use \`RecyclerViewActions.actionOnItem(hasDescendant(withText("...")), click())\` for matching

### NavigationDrawer
- Use \`DrawerActions.open()\` / \`DrawerActions.close()\` for drawer interactions

### DatePicker / TimePicker
- Use \`PickerActions.setDate(year, month, day)\` and \`PickerActions.setTime(hour, minute)\`

### Accessibility Checks
- Enable \`AccessibilityChecks.enable().setRunChecksFromRootView(true)\` in \`@Before\`
- Auto-validates accessibility on every assertion — fails for missing content descriptions, contrast, touch targets
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Espresso Test Review Checklist
Available skills: espresso-test-generator
- Verify tests follow the find -> perform -> check pattern: \`onView(matcher).perform(action).check(assertion)\`
- Check that \`withId(R.id.x)\` is the primary matcher — flag use of hierarchical matchers (\`withParent\`, \`isDescendantOfA\`) when simpler alternatives exist
- Verify no \`Thread.sleep()\` or \`SystemClock.sleep()\` — Espresso handles synchronization; flag these as mandatory fixes
- Check that \`IdlingResource\` is registered in \`@Before\` and unregistered in \`@After\` — missing cleanup causes cross-test pollution
- Verify \`closeSoftKeyboard()\` is called after \`typeText()\` — the keyboard may obscure views for subsequent actions
- Check that \`onData()\` is used instead of \`onView()\` for AdapterView content (ListView, Spinner)
- Verify properties are asserted in \`check(matches(...))\`, not pre-filtered in \`onView(allOf(...))\` — separate matching from asserting
- Check that \`doesNotExist()\` vs \`not(isDisplayed())\` is used correctly — the former checks hierarchy absence, the latter checks visibility
- Verify tests are annotated with \`@RunWith(AndroidJUnit4::class)\` and use \`ActivityScenarioRule\` (not deprecated \`ActivityTestRule\`)
- Check that intent testing uses \`intending().respondWith()\` to stub external intents — tests must never launch real external apps
- Verify \`clearText()\` is called before \`typeText()\` when replacing existing input content
- Check that tests use meaningful method names describing the scenario: \`actionName_precondition_expectedResult()\``,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Espresso Test Writing Guidelines
Available skills: espresso-test-generator
- Follow the find -> perform -> check pattern for every interaction: \`onView(withId(R.id.x)).perform(click()).check(matches(isDisplayed()))\`
- Use \`withId(R.id.x)\` as the primary matcher; combine with \`allOf()\` only when the ID alone is ambiguous
- Use \`clearText()\` before \`typeText()\` for clean input state; always call \`closeSoftKeyboard()\` after \`typeText()\`
- Use \`scrollTo()\` before actions on off-screen views within ScrollView
- Use \`ActivityScenarioRule\` with \`@get:Rule\` for activity lifecycle management
- Use \`doesNotExist()\` to verify a view is not in the hierarchy; use \`matches(not(isDisplayed()))\` for views that exist but are hidden
- Register \`CountingIdlingResource\` in \`@Before\` for async operations; call \`increment()\`/\`decrement()\` around background work
- Use \`IntentsRule\` + \`intending().respondWith()\` to stub external intents (camera, contacts, file picker)
- Use \`RecyclerViewActions.actionOnItemAtPosition()\` for RecyclerView interactions — do not use \`onView()\` with index-based matchers
- Use \`@HiltAndroidTest\` with \`HiltAndroidRule\` for dependency injection in instrumentation tests
- Follow Arrange-Act-Assert pattern; name tests descriptively: \`loginButton_withValidCredentials_navigatesToHome()\`
- Test both success and error paths: valid input, empty fields, invalid format, network errors (via stubbed IdlingResource)
- Use Test Orchestrator with \`clearPackageData\` for full test isolation when tests modify persistent state`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Espresso Security Review
- Verify test data does not contain real credentials, API keys, or PII — use mock/dummy values for all authentication flows
- Check that intent stubbing with \`intending()\` does not use real production URLs, phone numbers, or user data
- Verify IdlingResource implementations do not leak sensitive state or hold references to views containing user data
- Check that test screenshots and logcat output do not capture sensitive data visible on screen
- Verify Test Orchestrator \`clearPackageData\` is enabled in CI to prevent credential leakage between test methods
- Check that test fixtures do not bypass authentication in a way that masks real security vulnerabilities in the app
- Verify \`adb shell\` commands in test scripts do not expose device credentials or production API endpoints`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Espresso Test Refactoring Guidance
Available skills: espresso-test-generator
- Extract repeated view interactions into Robot pattern or Screen Object classes — one class per screen encapsulating matchers and common actions
- Replace hardcoded \`R.id.x\` references with constants in a central test IDs helper when the same ID is used across multiple test files
- Consolidate repeated authentication flows into a shared \`login(email, password)\` helper method used in \`@Before\`
- Extract common IdlingResource setup/teardown into a reusable JUnit TestRule
- Replace \`Thread.sleep()\` with proper \`IdlingResource\` registration — identify the async operation being waited on
- Move \`intending().respondWith()\` stub setups into shared fixture methods when multiple tests stub the same external intents
- Extract complex matcher combinations (\`allOf(...)\`) into named helper functions for readability: \`fun settingsTitle() = allOf(withId(R.id.title), withText("Settings"))\`
- Consolidate test data creation into factory functions or builders instead of inline construction in each test`,
      },
    ],
    skills: [
      {
        name: 'espresso-test-generator',
        description:
          'Generate comprehensive Espresso instrumentation test suites for Android activities and user flows',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Espresso Test Generator

## Purpose
Generate well-structured Espresso instrumentation test suites for Android activities following the find -> perform -> check pattern, proper synchronization, and hermetic testing practices.

## Process

### 1. Analyze the Activity Under Test
- Identify all interactive views: buttons, text fields, checkboxes, spinners, lists
- Map user flows: form submission, navigation, data loading, error states
- Identify async operations that need IdlingResource: network calls, database queries
- Identify external intents that need stubbing: camera, contacts, browser, file picker

### 2. Set Up Test Class
\`\`\`kotlin
@RunWith(AndroidJUnit4::class)
@HiltAndroidTest // If using Hilt
class LoginActivityTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this) // If using Hilt

    @get:Rule(order = 1)
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

    @get:Rule(order = 2)
    val intentsRule = IntentsRule() // If testing intents

    private lateinit var idlingResource: CountingIdlingResource

    @Before
    fun setUp() {
        hiltRule.inject() // If using Hilt
        idlingResource = CountingIdlingResource("LoginNetwork")
        IdlingRegistry.getInstance().register(idlingResource)
    }

    @After
    fun tearDown() {
        IdlingRegistry.getInstance().unregister(idlingResource)
    }
}
\`\`\`

### 3. Write Tests in This Order
1. **Happy path**: complete the flow successfully end-to-end
2. **Validation errors**: empty fields, invalid format, boundary values
3. **Error states**: network failure, server error (via IdlingResource control)
4. **Navigation**: verify correct activity/fragment transitions
5. **External intents**: camera, contacts, file picker with stubbed responses

### 4. Test Templates

#### Form Input and Submit
\`\`\`kotlin
@Test
fun loginButton_withValidCredentials_navigatesToHome() {
    // Arrange & Act
    onView(withId(R.id.email_input))
        .perform(clearText(), typeText("user@test.com"), closeSoftKeyboard())
    onView(withId(R.id.password_input))
        .perform(clearText(), typeText("validPassword123"), closeSoftKeyboard())
    onView(withId(R.id.login_button))
        .perform(click())

    // Assert — Espresso waits for IdlingResource before checking
    onView(withId(R.id.home_screen))
        .check(matches(isDisplayed()))
}
\`\`\`

#### Validation Error
\`\`\`kotlin
@Test
fun loginButton_withEmptyEmail_showsEmailRequired() {
    onView(withId(R.id.password_input))
        .perform(typeText("password123"), closeSoftKeyboard())
    onView(withId(R.id.login_button))
        .perform(click())

    onView(withId(R.id.email_input))
        .check(matches(hasErrorText("Email is required")))
}
\`\`\`

#### AdapterView (Spinner) Selection
\`\`\`kotlin
@Test
fun spinner_selectCountry_displaysSelectedCountry() {
    onView(withId(R.id.country_spinner)).perform(click())

    onData(allOf(\`is\`(instanceOf(String::class.java)), \`is\`("Spain")))
        .perform(click())

    onView(withId(R.id.selected_country))
        .check(matches(withText(containsString("Spain"))))
}
\`\`\`

#### RecyclerView Interaction
\`\`\`kotlin
@Test
fun recyclerView_clickItem_opensDetail() {
    onView(withId(R.id.item_list))
        .perform(RecyclerViewActions.actionOnItemAtPosition<ViewHolder>(0, click()))

    onView(withId(R.id.detail_screen))
        .check(matches(isDisplayed()))
}
\`\`\`

#### External Intent Stubbing
\`\`\`kotlin
@Test
fun cameraButton_stubsCamera_displaysPhoto() {
    val resultData = Intent().apply {
        putExtra("data", createTestBitmap())
    }
    val result = Instrumentation.ActivityResult(Activity.RESULT_OK, resultData)

    intending(hasAction(MediaStore.ACTION_IMAGE_CAPTURE)).respondWith(result)

    onView(withId(R.id.camera_button)).perform(click())
    onView(withId(R.id.photo_preview))
        .check(matches(isDisplayed()))
}
\`\`\`

#### View Does Not Exist
\`\`\`kotlin
@Test
fun logout_removesUserProfileView() {
    onView(withId(R.id.logout_button)).perform(click())
    onView(withId(R.id.user_profile)).check(doesNotExist())
}
\`\`\`

## Quality Checklist
- [ ] Every test follows find -> perform -> check pattern
- [ ] \`withId(R.id.x)\` is the primary matcher
- [ ] \`closeSoftKeyboard()\` called after every \`typeText()\`
- [ ] \`clearText()\` called before \`typeText()\` when replacing content
- [ ] No \`Thread.sleep()\` — IdlingResource used for async operations
- [ ] IdlingResource registered in \`@Before\`, unregistered in \`@After\`
- [ ] External intents stubbed with \`intending().respondWith()\`
- [ ] \`onData()\` used for AdapterView content, not \`onView()\`
- [ ] Tests are independent — no shared mutable state
- [ ] Test names describe scenario: \`action_precondition_expectedResult()\`
- [ ] \`ActivityScenarioRule\` used (not deprecated \`ActivityTestRule\`)
- [ ] \`@RunWith(AndroidJUnit4::class)\` on every test class
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "androidTest/.*\\.kt$" && grep -cE "\\bThread\\.sleep\\(|SystemClock\\.sleep\\(" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Thread.sleep() or SystemClock.sleep() detected in Espresso test — use IdlingResource for async synchronization instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for Thread.sleep() in Espresso tests',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "androidTest/.*\\.kt$" && grep -cE "ActivityTestRule\\b" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Warning: ActivityTestRule is deprecated — use ActivityScenarioRule from androidx.test.ext.junit.rules instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for deprecated ActivityTestRule',
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'gradle-config',
        filePath: 'app/build.gradle.kts',
        config: {
          android: {
            defaultConfig: {
              testInstrumentationRunner: 'androidx.test.runner.AndroidJUnitRunner',
            },
            testOptions: {
              animationsDisabled: true,
            },
          },
          dependencies: {
            androidTestImplementation: [
              'androidx.test.espresso:espresso-core:3.6.1',
              'androidx.test.espresso:espresso-contrib:3.6.1',
              'androidx.test.espresso:espresso-intents:3.6.1',
              'androidx.test.espresso:espresso-idling-resource:3.6.1',
              'androidx.test:runner:1.6.1',
              'androidx.test:rules:1.6.1',
              'androidx.test.ext:junit:1.2.1',
            ],
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
