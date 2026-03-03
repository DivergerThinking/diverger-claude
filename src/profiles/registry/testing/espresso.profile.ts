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
Every Espresso interaction follows three steps:
\`\`\`kotlin
onView(withId(R.id.button))    // 1. Find: locate the view with a ViewMatcher
    .perform(click())           // 2. Perform: execute a ViewAction
    .check(matches(isDisplayed())) // 3. Check: verify with a ViewAssertion
\`\`\`

- ALWAYS use the find -> perform -> check pattern — avoid bypassing it with direct view access
- Use \`onView()\` for standard views; use \`onData()\` only for AdapterView-backed content (ListView, Spinner)
- Chain related actions in a single \`perform()\` call for atomic operations

---

## ViewMatcher Rules

### Priority Order
1. \`withId(R.id.view_id)\` — resource ID (most stable, preferred)
2. \`withText("text")\` — displayed text (combine with \`withId()\` using \`allOf()\` to disambiguate)
3. \`withContentDescription("description")\` — accessibility label (preferred for image buttons)
4. \`withHint("hint")\` — placeholder text (for EditText fields)
5. Hierarchical matchers (\`withParent()\`, \`hasSibling()\`) — structural matching (last resort)

### Rules
- Use \`allOf()\` to combine matchers when a single matcher matches multiple views — Espresso throws \`AmbiguousViewMatcherException\` on ambiguous matches
- Use the simplest matcher that uniquely identifies the view — avoid over-specifying
- NEVER use \`isDisplayed()\` as a standalone onView matcher — use it as a filter within \`allOf()\` or as a check in assertions
- Use \`not(matcher)\` to exclude views from matching — useful for filtering out hidden or disabled views

### Correct
\`\`\`kotlin
// Simple: single matcher uniquely identifies view
onView(withId(R.id.email_input)).perform(typeText("user@test.com"))

// Combined: disambiguate when multiple views share an ID
onView(allOf(withId(R.id.title), withText("Settings")))
    .check(matches(isDisplayed()))

// Accessibility-based: for icon buttons without visible text
onView(withContentDescription("Navigate up")).perform(click())
\`\`\`

### Anti-Pattern
\`\`\`kotlin
// BAD: isDisplayed() as the sole matcher — matches too many views
onView(isDisplayed()).perform(click())

// BAD: checking property in the matcher instead of the assertion
onView(allOf(withId(R.id.status), withText("Done")))
    .check(matches(isDisplayed()))
// GOOD: check the text in the assertion
onView(withId(R.id.status))
    .check(matches(withText("Done")))

// BAD: deep hierarchical matchers — brittle and coupled to layout structure
onView(allOf(
    isDescendantOfA(withId(R.id.container)),
    isDescendantOfA(withChild(withText("Header"))),
    instanceOf(Button::class.java)
)).perform(click())
\`\`\`

---

## ViewAction Rules
- Call \`closeSoftKeyboard()\` after \`typeText()\` — the keyboard may obscure views needed for subsequent actions
- Use \`clearText()\` before \`typeText()\` when replacing existing content — \`typeText()\` appends to existing text
- Call \`scrollTo()\` before actions on off-screen views within a ScrollView — Espresso does not auto-scroll for all view types
- Use \`replaceText()\` when keyboard simulation is not needed — it is faster but skips IME callbacks
- Use \`pressBack()\` from \`Espresso.pressBack()\` for system navigation — do not simulate hardware button events

### Correct
\`\`\`kotlin
// Complete text input pattern: clear + type + close keyboard
onView(withId(R.id.search_input))
    .perform(clearText(), typeText("espresso testing"), closeSoftKeyboard())

// Scroll before interacting with off-screen view
onView(withId(R.id.terms_checkbox))
    .perform(scrollTo(), click())

// Chain multiple actions on the same view
onView(withId(R.id.text_field))
    .perform(click(), clearText(), typeText("new value"), closeSoftKeyboard())
\`\`\`

### Anti-Pattern
\`\`\`kotlin
// BAD: forgetting closeSoftKeyboard() — next view may be hidden
onView(withId(R.id.email_input)).perform(typeText("user@test.com"))
onView(withId(R.id.password_input)).perform(typeText("pass123"))
// password_input may be obscured by the keyboard

// BAD: typeText without clearText — appends to existing text
onView(withId(R.id.name_input)).perform(typeText("new name"))
// If field already contains text, result is "old textnew name"
\`\`\`

---

## Assertion Rules
- Use \`check(matches(...))\` for positive assertions about view properties
- Use \`check(doesNotExist())\` to assert a view is not in the hierarchy — different from \`not(isDisplayed())\` which asserts the view exists but is not visible
- Use Hamcrest matchers inside \`matches()\` for flexible assertions: \`containsString()\`, \`startsWith()\`, \`endsWith()\`
- Use \`matches(hasErrorText("message"))\` for EditText validation error assertions
- Separate matching from asserting — put the property under test in \`check()\`, not in \`onView()\`

### Correct
\`\`\`kotlin
// Assert text content
onView(withId(R.id.greeting)).check(matches(withText("Hello Steve!")))

// Assert view does not exist in hierarchy
onView(withId(R.id.loading_spinner)).check(doesNotExist())

// Assert view exists but is not visible
onView(withId(R.id.hidden_tip)).check(matches(not(isDisplayed())))

// Assert partial text match
onView(withId(R.id.description))
    .check(matches(withText(containsString("Espresso"))))

// Assert input validation error
onView(withId(R.id.email_input))
    .check(matches(hasErrorText("Invalid email format")))
\`\`\`

---

## Synchronization Rules
- NEVER use \`Thread.sleep()\`, \`SystemClock.sleep()\`, or manual polling in Espresso tests — Espresso handles synchronization automatically
- Register \`IdlingResource\` for background operations: network requests, database queries, custom thread pools
- Use \`CountingIdlingResource\` for tracking simple async operations: call \`increment()\` before and \`decrement()\` after
- Register idling resources in \`@Before\` and unregister in \`@After\` — ALWAYS clean up to prevent cross-test pollution
- Use \`IdlingRegistry.getInstance().register()\` — do not use deprecated \`Espresso.registerIdlingResources()\`
- Call \`onTransitionToIdle()\` callback outside of \`isIdleNow()\` — calling it inside causes Espresso to make unnecessary rechecks

### Correct
\`\`\`kotlin
@Before
fun setUp() {
    idlingResource = CountingIdlingResource("NetworkCall")
    IdlingRegistry.getInstance().register(idlingResource)
}

@After
fun tearDown() {
    IdlingRegistry.getInstance().unregister(idlingResource)
}

@Test
fun dataLoadsAfterNetworkCall() {
    // Espresso waits for idlingResource to become idle
    onView(withId(R.id.data_list))
        .check(matches(isDisplayed()))
}
\`\`\`

### Anti-Pattern
\`\`\`kotlin
// BAD: Thread.sleep — unreliable, slow, flaky
Thread.sleep(3000)
onView(withId(R.id.data_list)).check(matches(isDisplayed()))

// BAD: never unregistering idling resources — leaks across tests
@Before fun setUp() {
    IdlingRegistry.getInstance().register(resource)
}
// Missing @After with unregister!

// BAD: calling callback inside isIdleNow
override fun isIdleNow(): Boolean {
    val idle = taskCount == 0
    if (idle) callback?.onTransitionToIdle() // WRONG
    return idle
}
\`\`\`

---

## Test Structure Rules
- Annotate every test class with \`@RunWith(AndroidJUnit4::class)\`
- Use \`ActivityScenarioRule\` to manage activity lifecycle — it replaces deprecated \`ActivityTestRule\`
- Keep tests independent — each test must work without relying on state from previous tests
- Follow Arrange-Act-Assert pattern within each test method
- Use meaningful test method names: \`clickSubmit_withEmptyEmail_showsValidationError()\`
- Use Test Orchestrator with \`clearPackageData\` for full state isolation between tests in CI
- Use \`@HiltAndroidTest\` with \`HiltAndroidRule\` for Hilt-based apps to inject test dependencies
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

### Setup
Use \`IntentsRule\` to automatically initialize and release intent recording:
\`\`\`kotlin
@get:Rule
val intentsRule = IntentsRule()

@get:Rule
val activityRule = ActivityScenarioRule(MainActivity::class.java)
\`\`\`

### Intent Validation with \`intended()\`
Verify that your app sends the correct intents to other apps or system components:
\`\`\`kotlin
@Test
fun clickDial_sendsCallIntent() {
    onView(withId(R.id.dial_button)).perform(click())
    intended(allOf(
        hasAction(Intent.ACTION_DIAL),
        hasData(Uri.parse("tel:+1234567890"))
    ))
}
\`\`\`

### Intent Stubbing with \`intending()\`
Stub responses for \`startActivityForResult()\` to avoid launching external apps:
\`\`\`kotlin
@Test
fun pickContact_displaysSelectedPhoneNumber() {
    val resultData = Intent().apply {
        putExtra("phone", "555-123-4567")
    }
    val result = Instrumentation.ActivityResult(Activity.RESULT_OK, resultData)

    intending(toPackage("com.android.contacts")).respondWith(result)

    onView(withId(R.id.pick_contact_button)).perform(click())
    onView(withId(R.id.phone_number))
        .check(matches(withText("555-123-4567")))
}
\`\`\`

### Best Practices
- Always stub external intents — never let tests launch real camera, contacts, or browser apps
- Test both success (\`RESULT_OK\`) and cancellation (\`RESULT_CANCELED\`) paths
- Use intent matchers from \`IntentMatchers\`: \`hasAction()\`, \`hasData()\`, \`toPackage()\`, \`hasExtra()\`, \`hasComponent()\`
- Validate intents AFTER the action that triggers them — \`intended()\` checks the recorded history

---

## Espresso-Contrib — Extended Component Interactions

### RecyclerView
\`\`\`kotlin
// Click item at position
onView(withId(R.id.recycler_view))
    .perform(RecyclerViewActions.actionOnItemAtPosition<ViewHolder>(3, click()))

// Scroll to position
onView(withId(R.id.recycler_view))
    .perform(RecyclerViewActions.scrollToPosition<ViewHolder>(42))

// Action on item matching a condition
onView(withId(R.id.recycler_view))
    .perform(RecyclerViewActions.actionOnItem<ViewHolder>(
        hasDescendant(withText("Target Item")), click()))
\`\`\`

### NavigationDrawer
\`\`\`kotlin
onView(withId(R.id.drawer_layout)).perform(DrawerActions.open())
onView(withId(R.id.nav_settings)).perform(click())
onView(withId(R.id.drawer_layout)).perform(DrawerActions.close())
\`\`\`

### DatePicker / TimePicker
\`\`\`kotlin
onView(withId(R.id.date_picker))
    .perform(PickerActions.setDate(2025, 6, 15))

onView(withId(R.id.time_picker))
    .perform(PickerActions.setTime(14, 30))
\`\`\`

### Accessibility Checks
\`\`\`kotlin
@Before
fun setUp() {
    AccessibilityChecks.enable()
        .setRunChecksFromRootView(true)
}
\`\`\`
This automatically validates accessibility on every Espresso assertion — fails tests for violations like missing content descriptions, insufficient contrast, or small touch targets.
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "androidTest/.*\\.kt$" && grep -cE "\\bThread\\.sleep\\(|SystemClock\\.sleep\\(" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:1:Thread.sleep() or SystemClock.sleep() detected in Espresso test — use IdlingResource for async synchronization instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "androidTest/.*\\.kt$" && grep -cE "ActivityTestRule\\b" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:0:Warning: ActivityTestRule is deprecated — use ActivityScenarioRule from androidx.test.ext.junit.rules instead" || true',
            timeout: 10,
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
