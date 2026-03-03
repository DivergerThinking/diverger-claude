import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const jetpackComposeProfile: Profile = {
  id: 'frameworks/jetpack-compose',
  name: 'Jetpack Compose',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['jetpack-compose'],
  dependsOn: ['languages/kotlin'],
  contributions: {
    claudeMd: [
      {
        heading: 'Jetpack Compose Conventions',
        order: 2000,
        content: `## Jetpack Compose Conventions

Declarative Android UI. Composable functions, unidirectional data flow, Material 3.

**Detailed rules:** see \`.claude/rules/jetpack-compose/\` directory.

**Key rules:**
- Stateless composables with state hoisting — pass state down, events up
- \`remember\`/\`rememberSaveable\` for local state, ViewModel for screen state
- \`LazyColumn\`/\`LazyRow\` with stable keys for lists
- Compose previews (\`@Preview\`) for all reusable components`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(gradle:*)',
          'Bash(gradlew:*)',
          'Bash(./gradlew:*)',
          'Bash(adb:*)',
        ],
      },
    },
    rules: [
      {
        path: 'jetpack-compose/compose-patterns.md',
        paths: ['**/*.kt'],
        governance: 'mandatory',
        description: 'Compose composable design, state management, side effects, and stability rules',
        content: `# Jetpack Compose Patterns

## Composable API Design

### Naming Conventions
- Composables that emit UI (return Unit) use PascalCase: \`UserCard()\`, \`ProfileHeader()\`
- Composables that return a value use camelCase: \`rememberScrollState()\`, \`derivedStateOf()\`
- State holder classes use \`*State\` suffix: \`ScrollState\`, \`DrawerState\`, \`PagerState\`
- Callbacks use \`on*\` prefix: \`onClick\`, \`onValueChange\`, \`onDismissRequest\`

### Parameter Ordering (Official API Guidelines)
Every composable that emits UI must follow this parameter order:
1. Required parameters (no default value)
2. \`modifier: Modifier = Modifier\` — always present, always first optional parameter
3. Optional parameters with defaults
4. Trailing \`content: @Composable () -> Unit\` lambda (slot)

### Correct
\`\`\`kotlin
@Composable
fun UserCard(
    user: User,                              // 1. Required
    modifier: Modifier = Modifier,           // 2. Modifier
    isHighlighted: Boolean = false,          // 3. Optional
    onClick: () -> Unit = {},                // 3. Optional callback
    content: @Composable () -> Unit = {},    // 4. Trailing slot
) {
    Surface(modifier = modifier, onClick = onClick) {
        Column {
            Text(user.name)
            content()
        }
    }
}
\`\`\`

### Anti-Pattern
\`\`\`kotlin
// WRONG: Modifier not first optional, required after optional
@Composable
fun UserCard(
    isHighlighted: Boolean = false,
    user: User,
    modifier: Modifier = Modifier,
) { /* ... */ }
\`\`\`

---

## State Management

### State Hoisting Pattern
Separate stateful composables from stateless composables:

\`\`\`kotlin
// Stateless — receives state, emits events via callbacks
@Composable
fun Counter(
    count: Int,
    onIncrement: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier) {
        Text("Count: $count")
        Button(onClick = onIncrement) { Text("Increment") }
    }
}

// Stateful — wraps stateless with state management
@Composable
fun CounterScreen(modifier: Modifier = Modifier) {
    var count by remember { mutableIntStateOf(0) }
    Counter(
        count = count,
        onIncrement = { count++ },
        modifier = modifier,
    )
}
\`\`\`

### remember vs rememberSaveable
- \`remember {}\`: survives recomposition but NOT configuration changes (rotation, locale change)
- \`rememberSaveable {}\`: survives configuration changes and process death via Bundle
- Use \`rememberSaveable\` for user input, scroll positions, and UI toggle states
- Use \`remember\` for derived/computed values and non-persistent caches

### ViewModel + StateFlow
- Use ViewModel for screen-level state that survives configuration changes
- Expose state as \`StateFlow\` and collect with \`collectAsStateWithLifecycle()\`
- Never pass ViewModel to child composables — pass individual state values and callbacks

\`\`\`kotlin
@Composable
fun ProfileScreen(viewModel: ProfileViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    ProfileContent(
        user = uiState.user,
        isLoading = uiState.isLoading,
        onRefresh = viewModel::refresh,
    )
}
\`\`\`

---

## Side Effects

### LaunchedEffect
Runs a suspend function when entering composition and re-launches when keys change:

\`\`\`kotlin
@Composable
fun UserProfile(userId: String) {
    var user by remember { mutableStateOf<User?>(null) }

    LaunchedEffect(userId) {
        user = userRepository.getUser(userId)
    }

    user?.let { ProfileContent(it) }
}
\`\`\`

### DisposableEffect
Registers listeners or callbacks and cleans them up on key change or disposal:

\`\`\`kotlin
@Composable
fun LifecycleObserver(lifecycle: Lifecycle) {
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            // Handle lifecycle event
        }
        lifecycle.addObserver(observer)
        onDispose {
            lifecycle.removeObserver(observer)
        }
    }
}
\`\`\`

### Anti-Pattern: Coroutines in Composable Body
\`\`\`kotlin
// WRONG: launches a new coroutine on every recomposition
@Composable
fun BadExample(userId: String) {
    val scope = rememberCoroutineScope()
    scope.launch { fetchUser(userId) }  // Runs every recomposition!
}

// CORRECT: use LaunchedEffect
@Composable
fun GoodExample(userId: String) {
    LaunchedEffect(userId) {
        fetchUser(userId)
    }
}
\`\`\`

---

## Stability and Recomposition

### Stable Types
- Use \`data class\` with immutable properties (\`val\`, not \`var\`) for state objects
- Annotate classes with \`@Stable\` when they have a mutable property that is observable (e.g., \`MutableState\`)
- Annotate classes with \`@Immutable\` when all properties are truly immutable
- Avoid \`List\`, \`Map\`, \`Set\` in composable parameters — they are not stable. Use \`kotlinx.collections.immutable\` (\`ImmutableList\`, \`PersistentList\`)
- Use \`key()\` composable to help Compose identify items in loops

### Correct
\`\`\`kotlin
@Immutable
data class UserUiState(
    val name: String,
    val email: String,
    val items: ImmutableList<Item>,
)
\`\`\`

### Anti-Pattern
\`\`\`kotlin
// WRONG: List is unstable — causes recomposition even when content is the same
data class UserUiState(
    val name: String,
    val email: String,
    val items: List<Item>,  // Unstable!
)
\`\`\`
`,
      },
      {
        path: 'jetpack-compose/compose-performance.md',
        paths: ['**/*.kt'],
        governance: 'recommended',
        description: 'Compose recomposition optimization, lazy layouts, phase deferral, and profiling',
        content: `# Jetpack Compose Performance

## Composition Phases
Compose renders in three phases — optimize by deferring state reads to the latest possible phase:
1. **Composition**: execute composables, build the tree — avoid side effects here
2. **Layout**: measure and position elements
3. **Drawing**: render pixels to canvas

**Key principle**: reading state in a later phase (layout or draw) skips earlier phases during recomposition.

---

## Use remember for Expensive Calculations

\`\`\`kotlin
// WRONG: sorts on every recomposition
@Composable
fun ContactList(contacts: List<Contact>, comparator: Comparator<Contact>) {
    LazyColumn {
        items(contacts.sortedWith(comparator)) { contact -> ContactRow(contact) }
    }
}

// CORRECT: cache the sorted result
@Composable
fun ContactList(contacts: List<Contact>, comparator: Comparator<Contact>) {
    val sortedContacts = remember(contacts, comparator) {
        contacts.sortedWith(comparator)
    }
    LazyColumn {
        items(sortedContacts) { contact -> ContactRow(contact) }
    }
}
\`\`\`

**Best practice**: move heavy computation to ViewModel when possible — keep composables lean.

---

## Use derivedStateOf to Limit Recompositions

\`\`\`kotlin
// WRONG: recomposes on every scroll pixel
val listState = rememberLazyListState()
val showButton = listState.firstVisibleItemIndex > 0

// CORRECT: recomposes only when the boolean changes
val listState = rememberLazyListState()
val showButton by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 0 }
}
\`\`\`

---

## Defer State Reads (Phase Optimization)

Use lambda-based modifier variants to skip the composition phase entirely:

\`\`\`kotlin
// WRONG: reads scroll value in composition — triggers full recomposition
@Composable
fun Title(scrollValue: Int) {
    Column(modifier = Modifier.offset(y = scrollValue.dp)) { /* ... */ }
}

// CORRECT: reads scroll value in layout phase — skips composition
@Composable
fun Title(scrollProvider: () -> Int) {
    Column(
        modifier = Modifier.offset { IntOffset(x = 0, y = scrollProvider()) }
    ) { /* ... */ }
}
\`\`\`

Lambda-based modifier equivalents:
- \`Modifier.offset(x, y)\` -> \`Modifier.offset { IntOffset(...) }\`
- \`Modifier.background(color)\` -> \`Modifier.drawBehind { drawRect(color) }\`
- \`Modifier.alpha(alpha)\` -> \`Modifier.graphicsLayer { this.alpha = alpha }\`

---

## Avoid Backwards Writes

Never write to state that has already been read in the current composition:

\`\`\`kotlin
// WRONG: backwards write causes infinite recomposition loop
@Composable
fun BadExample() {
    var count by remember { mutableIntStateOf(0) }
    Text("$count")
    count++  // Writing AFTER reading = infinite loop!
}

// CORRECT: write state only in event handlers
@Composable
fun GoodExample() {
    var count by remember { mutableIntStateOf(0) }
    Text("$count")
    Button(onClick = { count++ }) { Text("Increment") }
}
\`\`\`

---

## Lazy Layouts

- Use \`LazyColumn\` / \`LazyRow\` for scrollable lists — they only compose visible items
- Always provide a stable, unique \`key\` in \`items {}\` for item identity
- Use \`contentType\` parameter for heterogeneous lists to optimize view recycling
- Avoid nesting \`LazyColumn\` inside another scrollable container — use a single LazyColumn with mixed item types
- Set \`itemExtent\` (or \`stickyHeader\`) when item heights are uniform for layout optimization

\`\`\`kotlin
LazyColumn {
    items(
        items = notes,
        key = { note -> note.id },
        contentType = { note -> note.type },
    ) { note ->
        NoteRow(note)
    }
}
\`\`\`

---

## Profiling and Measurement

- Use **Layout Inspector** to visualize recomposition counts and identify hot composables
- Enable **composition tracing** for timeline performance profiling
- Run the **Compose compiler metrics** (\`-P compose.compiler.metrics=true\`) to identify unstable parameters
- Use **Baseline Profiles** to pre-compile critical UI paths for faster startup and smoother scrolling
- Use **Macrobenchmark** for end-to-end performance testing of scroll, startup, and animation performance
- Profile BEFORE optimizing — premature optimization harms readability
`,
      },
      {
        path: 'jetpack-compose/compose-security.md',
        paths: ['**/*.kt'],
        governance: 'mandatory',
        description: 'Android-specific security considerations for Compose apps',
        content: `# Jetpack Compose Security

## Input Validation
- Validate all user input from TextFields before processing — never trust raw input
- Use \`KeyboardOptions\` and \`KeyboardType\` to constrain input (e.g., number-only, email)
- Sanitize input before passing to SQL queries, intents, or network requests
- Apply input length limits to prevent buffer abuse and denial-of-service

## Intent and Navigation Security
- Validate all incoming deep link parameters before using them in navigation
- Never pass sensitive data (tokens, passwords) via Intent extras or navigation arguments
- Use encrypted SharedPreferences (\`EncryptedSharedPreferences\`) for sensitive local data
- Validate URI schemes in deep links — restrict to known schemes only

## Data Exposure
- Never log sensitive user data (passwords, tokens, PII) in composable state or debug output
- Use \`rememberSaveable\` with care — saved state is stored in the Bundle and may be accessible
- Clear sensitive state when navigating away from secure screens
- Use BiometricPrompt for sensitive operations, not custom PIN dialogs

## WebView in Compose
- When using \`AndroidView\` with WebView, disable JavaScript unless required
- Validate all URLs loaded in WebView — whitelist allowed domains
- Never load untrusted HTML content with JavaScript enabled
- Use \`@JavascriptInterface\` only for well-defined, validated callbacks
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Jetpack Compose-Specific Review

### Composable API Compliance
- Verify Modifier is the first optional parameter in every UI-emitting composable
- Check parameter ordering: required first, then modifier, then optional, then trailing content lambda
- Verify PascalCase for composables returning Unit, camelCase for composables returning values
- Check composable size — flag functions exceeding 80 lines for extraction

### State Management
- Verify state hoisting pattern: stateless composables receive state and emit events via callbacks
- Check that ViewModel is not passed to child composables — only individual values and callbacks
- Verify \`collectAsStateWithLifecycle()\` is used instead of \`collectAsState()\` for StateFlow in UI
- Check for mutable collections (List, Map, Set) in composable parameters — should use immutable alternatives
- Flag unnecessary state: values that can be derived should use \`derivedStateOf\` or inline computation

### Side Effects
- Verify side effects use correct APIs: LaunchedEffect for suspend functions, DisposableEffect for listener registration
- Check that DisposableEffect always has an onDispose block with proper cleanup
- Flag coroutine launches directly in composable body (must use LaunchedEffect or rememberCoroutineScope)
- Flag I/O operations (network, database, file) in composition phase — must use LaunchedEffect or ViewModel
- Check for backwards writes — state written after being read in the same composition

### Recomposition and Stability
- Check for unstable parameters that cause unnecessary recompositions (mutable collections, non-data classes)
- Verify @Stable or @Immutable annotations on state objects with unstable inferred stability
- Flag expensive computations not wrapped in remember {} — sorts, filters, mappings
- Check for inline object/lambda creation in modifier chains that could be hoisted

### Accessibility
- Verify contentDescription is provided for images and icons
- Check that custom interactive elements have proper semantics (role, state description)
- Verify semantic tree merging for logically related elements

### Previews
- Check that @Preview annotations exist for UI composables
- Verify previews use representative data, not empty or placeholder values

### Available Skills
- \`compose-screen-generator\`: Generate Compose screens with architecture, state hoisting, and preview setup
- \`compose-preview-generator\`: Generate comprehensive @Preview annotations for composables`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Jetpack Compose Testing

### Test Setup
- Use \`createComposeRule()\` for tests that do not need an Activity
- Use \`createAndroidComposeRule<Activity>()\` when Activity context is required (navigation, permissions)
- Use \`TestDispatcher\` for coroutine-based state — inject \`Dispatchers.Main\` via DI and replace in tests

### Finding Nodes
- Prefer semantic matchers for accessibility: \`onNodeWithText()\`, \`onNodeWithContentDescription()\`
- Use \`onNodeWithTag()\` only when no semantic matcher is available — add \`Modifier.testTag()\`
- Use \`onAllNodesWithText()\` + \`assertCountEquals()\` for list verification
- Use \`onNode(hasScrollAction())\` for scrollable containers

### Testing Patterns
- Test state changes: set up initial state, perform action, assert new UI state
- Test user interactions: \`performClick()\`, \`performTextInput()\`, \`performScrollTo()\`
- Test navigation: verify correct destination after navigation action
- Test loading/error states: provide different ViewModel states and verify UI reflects them
- Test accessibility: assert \`hasContentDescription()\`, \`hasRole()\`, \`isEnabled()\`

### Example Structure
\`\`\`kotlin
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun counterIncrements_whenButtonClicked() {
    composeTestRule.setContent {
        CounterScreen()
    }

    composeTestRule.onNodeWithText("Count: 0").assertIsDisplayed()
    composeTestRule.onNodeWithText("Increment").performClick()
    composeTestRule.onNodeWithText("Count: 1").assertIsDisplayed()
}

@Test
fun userList_displaysAllItems() {
    val users = listOf(User("Alice"), User("Bob"))
    composeTestRule.setContent {
        UserList(users = users)
    }

    composeTestRule.onAllNodesWithTag("user-item").assertCountEquals(2)
    composeTestRule.onNodeWithText("Alice").assertIsDisplayed()
    composeTestRule.onNodeWithText("Bob").assertIsDisplayed()
}
\`\`\`

### Screenshot Testing
- Use Paparazzi for JVM-based screenshot comparison tests (no emulator needed)
- Use \`composeTestRule.onRoot().captureToImage()\` for on-device screenshot tests
- Compare screenshots across light/dark theme and multiple font scales

### Available Skills
- \`compose-screen-generator\`: Generate Compose screens with architecture, state hoisting, and preview setup`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Jetpack Compose Security Review

### Input Validation
- Verify all TextField inputs are validated before being used in queries, intents, or API calls
- Check for SQL injection via Room queries — ensure all parameters use parameterized queries
- Verify intent data from deep links is validated before navigation

### Data Exposure
- Check for sensitive data in remember/rememberSaveable — Bundle storage is not encrypted
- Verify no PII or tokens are logged in composable state debug output
- Check that WebView usage (via AndroidView) has JavaScript disabled unless explicitly required
- Verify sensitive screens clear state on navigation away (onDispose or DisposableEffect)

### Android-Specific Security
- Verify network calls use HTTPS only (check for cleartext traffic allowance)
- Check for exported Activities/Services that could be invoked by untrusted apps
- Verify EncryptedSharedPreferences is used for sensitive local storage, not plain SharedPreferences
- Check for proper certificate pinning in network layer`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Jetpack Compose Documentation

### Composable Documentation
- Document every public composable with KDoc including: purpose, parameter descriptions, and usage example
- Include @param tags for all non-obvious parameters (especially callbacks and slots)
- Document state hoisting contract: which state the composable expects to receive, which events it emits
- Document any side effects the composable performs (network calls via LaunchedEffect, etc.)

### Preview as Documentation
- Treat @Preview annotations as living documentation — keep them up to date
- Name previews descriptively: \`@Preview(name = "Dark theme, loading state")\`
- Group related previews using @PreviewParameter with a PreviewParameterProvider

### Architecture Documentation
- Document the screen → ViewModel → repository data flow for each feature
- Document navigation graph structure and deep link handling
- Document custom design system tokens (colors, typography, shapes) if deviating from Material 3 defaults

### Available Skills
- \`compose-preview-generator\`: Generate comprehensive @Preview annotations for composables`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Jetpack Compose Refactoring Patterns

### Composable Extraction
- Extract when a composable exceeds 80 lines or has more than one visual responsibility
- Extract repeated UI patterns into shared composables with Modifier and slot parameters
- Extract complex state logic into a state holder class (e.g., \`rememberFooState()\`)

### State Hoisting Refactoring
- Move state from child to parent when siblings need to share it
- Convert stateful composables to stateless by hoisting state to the caller
- Replace ViewModel-coupled composables with state-parameter-based composables for better testability and preview support

### Side Effect Cleanup
- Convert inline coroutine launches to LaunchedEffect with proper keys
- Replace multiple related LaunchedEffects with a single one when they share the same lifecycle key
- Extract complex side effect logic into a ViewModel or use case class

### Performance Refactoring
- Wrap expensive computations in \`remember(key) {}\`
- Replace unstable List/Map/Set parameters with immutable collection equivalents
- Convert state reads in parent composables to lambda parameters for phase deferral
- Extract frequently-recomposing sections into separate composables to limit recomposition scope

### Available Skills
- \`compose-screen-generator\`: Generate Compose screens with architecture, state hoisting, and preview setup
- \`compose-preview-generator\`: Generate comprehensive @Preview annotations for composables`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Jetpack Compose Migration

### View System to Compose
- Migrate incrementally: add ComposeView inside existing XML layouts as a starting point
- Use AndroidView composable to embed legacy Views inside Compose when full migration is not yet feasible
- Migrate bottom-up: start with leaf views (buttons, text, images), then screens, then navigation
- Map common View equivalents: RecyclerView -> LazyColumn, CoordinatorLayout -> Scaffold, ViewPager -> HorizontalPager

### Navigation Migration
- Replace Fragment navigation with Compose Navigation (NavHost + NavController)
- Map Fragment arguments to navigation route parameters
- Convert Fragment lifecycle observers to LaunchedEffect and DisposableEffect

### Theme Migration
- Map XML theme attributes to MaterialTheme parameters (colorScheme, typography, shapes)
- Replace XML drawable selectors with Compose state-driven styling
- Convert custom View styles to Modifier extension functions or custom composables

### Testing Migration
- Replace Espresso UI tests with Compose testing APIs (ComposeTestRule)
- Map Espresso matchers to Compose finders: onView(withText(...)) -> onNodeWithText(...)
- Map Espresso actions to Compose actions: perform(click()) -> performClick()

### Available Skills
- \`compose-screen-generator\`: Generate Compose screens with architecture, state hoisting, and preview setup`,
      },
    ],
    skills: [
      {
        name: 'compose-screen-generator',
        description: 'Generate Jetpack Compose screens with proper architecture, state hoisting, and preview setup',
        content: `# Compose Screen Generator

When generating a Compose screen, produce the following files:

## Screen Composable (\`FeatureScreen.kt\`)
1. Stateful composable at the top that collects ViewModel state
2. Stateless composable that receives state and callbacks as parameters
3. All parameters follow the official ordering: required, modifier, optional, trailing content
4. Modifier is the first optional parameter
5. Material 3 components (Scaffold, TopAppBar, Surface) for layout structure
6. Loading, error, and empty state handling
7. Semantic annotations for accessibility

## ViewModel (\`FeatureViewModel.kt\`)
1. UI state as a data class with @Immutable annotation
2. State exposed via StateFlow
3. Event handling methods for user actions
4. Error state handling with sealed class for error types

## Preview (\`FeatureScreenPreview.kt\` or in same file)
1. @Preview for default state
2. @Preview for loading state
3. @Preview for error state
4. @Preview for dark theme using \`uiMode = Configuration.UI_MODE_NIGHT_YES\`
5. Use @PreviewParameter for data-driven previews when applicable

## Test File (\`FeatureScreenTest.kt\`)
1. ComposeTestRule setup
2. Test initial rendering with happy-path data
3. Test user interactions (clicks, input, scroll)
4. Test loading and error state rendering
5. Test accessibility: content descriptions, roles, enabled state

## Conventions
- Use collectAsStateWithLifecycle() for StateFlow collection
- Never pass ViewModel to child composables
- Use kotlinx.collections.immutable for list parameters in UI state
- Include testTag modifiers for elements not discoverable by semantic matchers
`,
      },
      {
        name: 'compose-preview-generator',
        description: 'Generate comprehensive @Preview annotations for Jetpack Compose composables',
        content: `# Compose Preview Generator

Generate @Preview annotations for composables following these patterns:

## Preview Setup
- Create a @Preview for each meaningful state: default, loading, error, empty
- Include light and dark theme previews: \`@Preview(uiMode = Configuration.UI_MODE_NIGHT_YES)\`
- Include different font scale previews: \`@Preview(fontScale = 1.5f)\` for accessibility validation
- Include device-specific previews: phone, tablet (\`@Preview(device = Devices.TABLET)\`), foldable

## Data-Driven Previews
- Use @PreviewParameter with PreviewParameterProvider for state variations:

\`\`\`kotlin
class UserPreviewProvider : PreviewParameterProvider<User> {
    override val values = sequenceOf(
        User(name = "Alice", email = "alice@example.com"),
        User(name = "Bob with a very long name that might overflow", email = "bob@example.com"),
    )
}

@Preview
@Composable
private fun UserCardPreview(@PreviewParameter(UserPreviewProvider::class) user: User) {
    MaterialTheme {
        UserCard(user = user)
    }
}
\`\`\`

## Preview Best Practices
- Always wrap preview content in MaterialTheme for accurate rendering
- Use Surface as a background container for proper content color resolution
- Provide representative data — never use empty strings or zeros
- Include edge cases: long text, missing optional fields, maximum content
- Name previews descriptively when multiple exist: \`@Preview(name = "Loading state")\`
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
            command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.kt\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/@Composable/.test(lines[i])&&/fun\\s+[A-Z]/.test(lines[i+1]||\'\')){let j=i+1;let braceCount=0;let started=false;let hasModifier=false;for(;j<lines.length;j++){if(lines[j].includes(\'{\'))braceCount++;if(lines[j].includes(\'}\'))braceCount--;if(braceCount>0)started=true;if(started&&braceCount===0)break;if(/modifier\\s*:\\s*Modifier/.test(lines[j]))hasModifier=true}if(!hasModifier&&(j-i)>5)console.log(\'WARNING: Composable at line \'+(i+2)+\' emits UI but has no Modifier parameter — add modifier: Modifier = Modifier as the first optional parameter\')}}" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.kt\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/@Composable/.test(c)){const m=c.match(/\\.collectAsState\\s*\\(/g);if(m&&m.length>0&&!c.includes(\'collectAsStateWithLifecycle\'))console.log(\'WARNING: Found collectAsState() — prefer collectAsStateWithLifecycle() for lifecycle-aware state collection in UI\')}" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.kt\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/@Composable/.test(c)){const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/rememberCoroutineScope/.test(lines[i])){for(let j=i+1;j<Math.min(i+5,lines.length);j++){if(/\\.launch\\s*\\{/.test(lines[j])&&!/onClick|onPress|on[A-Z]/.test(lines[j-1]||\'\')){console.log(\'WARNING: coroutine launched at line \'+(j+1)+\' may run on every recomposition — use LaunchedEffect for composition-scoped coroutines or ensure launch is inside a callback\');break}}}}}" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'gradle-config',
        filePath: 'app/build.gradle.kts',
        config: {
          composeOptions: {
            kotlinCompilerExtensionVersion: 'use-bom',
          },
          buildFeatures: {
            compose: true,
          },
          kotlinOptions: {
            freeCompilerArgs: [
              '-opt-in=androidx.compose.material3.ExperimentalMaterial3Api',
              '-opt-in=androidx.compose.foundation.ExperimentalFoundationApi',
            ],
          },
          dependencies: {
            'platform-bom': 'androidx.compose:compose-bom',
            'material3': 'androidx.compose.material3:material3',
            'ui-tooling': 'androidx.compose.ui:ui-tooling',
            'ui-tooling-preview': 'androidx.compose.ui:ui-tooling-preview',
            'lifecycle-runtime-compose': 'androidx.lifecycle:lifecycle-runtime-compose',
            'navigation-compose': 'androidx.navigation:navigation-compose',
            'ui-test-junit4': 'androidx.compose.ui:ui-test-junit4',
            'ui-test-manifest': 'androidx.compose.ui:ui-test-manifest',
          },
        },
        mergeStrategy: 'create-only',
      },
      {
        type: 'ktlint',
        filePath: '.editorconfig',
        config: {
          'ktlint_function_naming_ignore_when_annotated_with': 'Composable',
          'ktlint_standard_function-naming': 'disabled',
          description: 'Disable function naming rule for @Composable functions which use PascalCase by convention',
        },
        mergeStrategy: 'align',
      },
    ],
  },
};
