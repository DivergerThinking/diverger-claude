import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const fastlaneProfile: Profile = {
  id: 'infra/fastlane',
  name: 'Fastlane',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['fastlane'],
  contributions: {
    claudeMd: [
      {
        heading: 'Fastlane Conventions',
        order: 40,
        content: `## Fastlane Conventions

Mobile CI/CD automation. Lanes for build/test/deploy workflows, match for code signing.

**Detailed rules:** see \`.claude/rules/fastlane/\` directory.

**Key rules:**
- One lane per action: \`build\`, \`test\`, \`beta\`, \`release\` — compose in parent lanes
- \`match\` for code signing (Git-encrypted), never manual provisioning profiles
- Environment variables for secrets, \`.env\` files for non-sensitive lane config
- Error handling with \`error\` blocks, Slack/Teams notifications on failure`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(fastlane:*)',
          'Bash(bundle exec fastlane:*)',
          'Bash(fastlane add_plugin:*)',
          'Bash(fastlane install_plugins:*)',
          'Bash(fastlane match:*)',
          'Bash(fastlane deliver:*)',
          'Bash(fastlane pilot:*)',
          'Bash(fastlane supply:*)',
          'Bash(fastlane snapshot:*)',
          'Bash(fastlane scan:*)',
          'Bash(fastlane gym:*)',
          'Bash(fastlane pem:*)',
          'Bash(bundle install:*)',
          'Bash(bundle exec:*)',
          'Bash(pod install:*)',
          'Bash(pod update:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/fastlane-lane-structure.md',
        governance: 'mandatory',
        paths: ['fastlane/**/*', 'Fastfile', 'Appfile', 'Matchfile'],
        description: 'Fastlane lane architecture, Fastfile organization, and secret management',
        content: `# Fastlane Lane Structure & Security

## Fastfile Organization
- Organize lanes inside platform blocks: \`platform :ios do ... end\`
- Define \`before_all\`, \`after_all\`, and \`error\` blocks for each platform
- One lane per concern: \`test\`, \`beta\`, \`release\`, \`screenshots\`
- Use \`private_lane\` for helper lanes (\`notify_team\`, \`bump_version\`, \`setup_signing\`)
- Add \`desc\` to every public lane for \`fastlane lanes\` documentation
- Prefix CI-specific lanes with \`ci_\`: \`ci_test\`, \`ci_beta\`, \`ci_release\`

## Lane Naming Conventions
- Descriptive names: \`test\`, \`beta\`, \`release\`, \`deploy_staging\`
- CI lanes: \`ci_test\`, \`ci_beta\`, \`ci_release\`
- Use lane options instead of hardcoded values

## Secret & Credential Management (MANDATORY)
- Store ALL credentials in environment variables, NEVER in Fastfile, Appfile, or Matchfile
- Required env vars: \`MATCH_PASSWORD\`, \`FASTLANE_USER\`, \`FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD\`, \`SUPPLY_JSON_KEY_DATA\`, \`SLACK_URL\`
- Use \`.env.default\` for non-secret defaults
- Add all \`.env*\` files (except \`.env.example\`) to \`.gitignore\`
- Appfile and Matchfile MUST reference \`ENV[]\` — never hardcode Apple IDs, team IDs, or bundle IDs

## Code Signing with match
- ALWAYS use \`readonly: true\` (or \`is_ci\`) in CI to prevent accidental certificate regeneration
- Use \`match nuke\` only when absolutely necessary — NEVER in automated pipelines
- Store match passphrase in \`MATCH_PASSWORD\` environment variable
- Use a dedicated shared Git repo for certificates — never the app repository
- Run \`match development\`, \`match adhoc\`, and \`match appstore\` separately
- Use \`force_for_new_devices: true\` for development/adhoc when device list changes
`,
      },
      {
        path: 'infra/fastlane-ci-integration.md',
        governance: 'recommended',
        paths: ['fastlane/**/*', 'Fastfile', 'Appfile', 'Matchfile'],
        description: 'Fastlane CI/CD integration, build automation, and platform distribution',
        content: `# Fastlane CI/CD Integration

## CI Environment Setup
- Create a temporary keychain in CI with \`create_keychain\` or \`setup_ci\` — delete in \`after_all\`
- Pin Xcode version in CI config (not "latest") — use \`xcversion\` action in \`before_all\`
- Use \`bundle exec fastlane\` (not bare \`fastlane\`) to ensure locked gem versions
- Pass all secrets via environment variables in CI (GitHub Secrets, etc.)

## CI-Specific Lane Patterns
- Use \`setup_ci\` at the start of CI lanes for automatic keychain and environment setup
- Use \`sync_code_signing(readonly: true)\` in CI — never allow certificate regeneration
- Use \`clean: true\` in \`build_app\` and \`scan\` for reproducible CI builds
- Use \`skip_waiting_for_build_processing: true\` in \`upload_to_testflight\` for faster CI
- Output test results as JUnit for CI reporting

## Android CI
- Use \`gradle(task: "clean bundleRelease")\` for Play Store builds
- Use \`supply\` with \`json_key_data: ENV["SUPPLY_JSON_KEY_DATA"]\` for Google Play uploads
- Track promotion: \`supply(track_promote_to: "production", rollout: "0.1")\`
- Skip metadata/image/screenshot uploads with flags for faster CI

## Build Number & Versioning
- Use CI build number (\`GITHUB_RUN_NUMBER\`) or timestamp for build numbers
- iOS: \`increment_build_number\`; Android: \`android_set_version_code\`
- Use semantic versioning for app versions
- Tag releases in Git: \`add_git_tag\`, \`push_git_tags\`

## Error Handling & Notifications
- Always define \`error\` block in each platform for failure notifications
- Include branch name, commit author, and error message in notifications
- Use \`clean_build_artifacts\` in \`after_all\` to prevent CI disk space issues
- Implement retry logic for flaky network operations (App Store Connect uploads)
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Fastlane Review

**Available skill:** \`fastlane-setup\` — use when generating new Fastlane configurations.

### Fastfile Quality
- Verify lanes are organized inside platform blocks (\`platform :ios do ... end\`)
- Check that \`before_all\`, \`after_all\`, and \`error\` blocks are defined for each platform
- Verify all public lanes have \`desc\` descriptions
- Check that helper lanes use \`private_lane\` (not callable from CLI directly)
- Verify lane options are used instead of hardcoded values
- Check for code duplication between lanes — extract to private lanes

### Code Signing
- Verify \`match\` is used with \`readonly: true\` in CI environments
- Check that no certificate passphrases or credentials are hardcoded in Fastfile or Matchfile
- Verify \`MATCH_PASSWORD\` is sourced from environment variable, not inline
- Check that separate match types (development, adhoc, appstore) are used correctly per lane

### Secret Management
- Check for hardcoded Apple IDs, team IDs, or API keys in Fastfile, Appfile, or Matchfile
- Verify all credentials reference environment variables
- Check that .env files are in .gitignore
- Verify no App Store Connect passwords are stored in source control
- Check that \`json_key\` for Google Play references a path or env var, not inline content

### Action Usage
- Verify \`build_app\` (gym) uses \`clean: true\` in CI lanes
- Check that \`upload_to_testflight\` uses \`skip_waiting_for_build_processing: true\` in CI
- Verify \`ensure_git_status_clean\` or \`ensure_git_branch\` is used in release lanes
- Check that build numbers are incremented before building
- Verify notification actions (Slack) are in \`after_all\` and \`error\` blocks, not inlined`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Fastlane Security Review

**Available skill:** \`fastlane-setup\` — use when generating secure Fastlane configurations from scratch.

### Credential Exposure
- Check for hardcoded passwords, API keys, or tokens in Fastfile, Appfile, Matchfile, Deliverfile
- Verify \`MATCH_PASSWORD\`, \`FASTLANE_USER\`, \`FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD\` come from env vars
- Check that Google Play \`json_key_data\` is sourced from environment, not committed as a file
- Verify no push notification certificates (.p12, .pem) are committed to the repository
- Check that .env files containing secrets are in .gitignore

### Code Signing Security
- Verify match uses a SEPARATE Git repository for certificates (not the app repo)
- Check that CI lanes use \`readonly: true\` to prevent accidental certificate regeneration
- Verify match passphrase is sufficiently strong and rotated periodically
- Check that \`match nuke\` is never called in automated CI pipelines
- Verify provisioning profiles use the minimum required capabilities

### CI Pipeline Security
- Check that CI keychain is created with a unique password and deleted after use
- Verify build artifacts (IPA, dSYM, AAB) are not persisted in publicly accessible storage
- Check that API keys for third-party services (Slack, Firebase, Sentry) use env vars
- Verify CI workflow secrets are properly scoped (not available to forked PRs)
- Check for \`ensure_git_status_clean\` to prevent deploying uncommitted changes

### Supply Chain
- Verify Fastlane and plugins are pinned to specific versions in Gemfile.lock
- Check that \`bundle exec fastlane\` is used instead of bare \`fastlane\` to ensure locked versions
- Verify third-party plugins are from trusted sources
- Check that Pluginfile dependencies are audited for known vulnerabilities`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Fastlane Migration Assistance

**Available skill:** \`fastlane-setup\` — use when generating Fastlane configs for new or migrated projects.

### Initial Fastlane Setup
- Set up Fastlane for a mobile project: \`fastlane init\` and configure Appfile, Matchfile
- Configure match for team certificate management with a shared Git repo
- Set up CI/CD pipeline (GitHub Actions, Bitrise, CircleCI) with Fastlane
- Handle versioning and changelog automation with \`increment_version_number\` and Git tags
- Configure TestFlight distribution with \`pilot\` and Google Play with \`supply\`

### Manual Signing to match Migration
- Migrate from manual certificate management to Fastlane match
- Set up a shared Git repo for certificates and provisioning profiles
- Run \`match nuke\` to revoke existing profiles (coordinate with team first)
- Run \`match appstore\`, \`match adhoc\`, \`match development\` to generate new profiles
- Update CI pipelines to use \`sync_code_signing\` with \`readonly: true\`
- Distribute \`MATCH_PASSWORD\` to all team members securely

### Legacy Fastlane Modernization
- Migrate deprecated actions: \`gym\` to \`build_app\`, \`pilot\` to \`upload_to_testflight\`, \`sigh\` to \`get_provisioning_profile\`
- Replace \`cert\`/\`sigh\` with \`match\` for centralized code signing
- Migrate from \`Fastfile\` without platform blocks to proper \`platform :ios do ... end\` structure
- Add \`setup_ci\` action for automatic CI environment configuration
- Migrate hardcoded credentials to environment variables and .env files`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Fastlane Documentation Standards

**Available skill:** \`fastlane-setup\` — use when scaffolding documented Fastlane projects.

### README Fastlane Section
- Document all available lanes with their purpose: \`fastlane ios test\`, \`fastlane ios beta\`, etc.
- List required environment variables with descriptions (never include actual values)
- Document the match Git repository URL and setup process for new team members
- Include one-time setup instructions: \`bundle install\`, \`match development\`, CocoaPods install
- Document CI/CD pipeline configuration and required secrets

### Fastfile Documentation
- Add \`desc\` to every public lane describing its purpose and usage
- Document lane options with examples: \`fastlane ios release version:2.0.0\`
- Document expected environment variables at the top of the Fastfile in comments
- Explain private lane purposes and when they are called

### Onboarding Guide
- Step-by-step instructions for new developers to set up code signing
- How to get access to the match certificate repository
- How to configure local .env files
- How to run lanes locally vs CI differences
- Troubleshooting common code signing and provisioning errors`,
      },
    ],
    skills: [
      {
        name: 'fastlane-setup',
        description: 'Generate a complete Fastlane configuration for iOS and/or Android projects',
        content: `# Fastlane Setup

Generate a complete, production-ready Fastlane configuration for a mobile project.

## 1. Gather Information
Ask the user:
- Target platforms: iOS only, Android only, or both?
- Distribution: App Store, TestFlight, Google Play, Firebase App Distribution?
- Code signing: Manual or match? If match, Git repo URL?
- CI provider: GitHub Actions, Bitrise, CircleCI, or other?
- Notifications: Slack webhook, Microsoft Teams, or none?
- CocoaPods or SPM for iOS dependencies?

## 2. Generate Configuration Files

### Appfile
\`\`\`ruby
app_identifier(ENV["APP_IDENTIFIER"])
apple_id(ENV["FASTLANE_USER"])
team_id(ENV["TEAM_ID"])
# For Play Store
json_key_file(ENV["SUPPLY_JSON_KEY_FILE"])
package_name(ENV["ANDROID_PACKAGE_NAME"])
\`\`\`

### Matchfile (if using match)
\`\`\`ruby
git_url(ENV["MATCH_GIT_URL"])
storage_mode("git")
type("appstore")
app_identifier([ENV["APP_IDENTIFIER"]])
username(ENV["FASTLANE_USER"])
readonly(is_ci)
\`\`\`

### Fastfile (iOS platform)
Generate lanes:
- \`test\` — run unit and UI tests with \`scan\`
- \`beta\` — build and upload to TestFlight with \`gym\` + \`pilot\`
- \`release\` — build and submit to App Store with \`gym\` + \`deliver\`
- \`screenshots\` — capture screenshots with \`snapshot\`
- CI-specific variants with \`setup_ci\` and \`readonly\` match

### Fastfile (Android platform)
Generate lanes:
- \`test\` — run tests with \`gradle(task: "test")\`
- \`beta\` — build and upload to internal track with \`gradle\` + \`supply\`
- \`release\` — build and promote to production with \`supply\`

### Gemfile
\`\`\`ruby
source "https://rubygems.org"
gem "fastlane"
# Add plugins as needed
\`\`\`

## 3. Generate CI Configuration
Generate a CI workflow file for the chosen provider with:
- Ruby setup with bundler caching
- Environment variable / secrets configuration
- Lanes for test, beta, and release triggers
- macOS runner for iOS builds
- Proper artifact storage for IPA/AAB files

## 4. Generate .env.example
List all required environment variables with placeholder descriptions.

## 5. Generate .gitignore additions
\`\`\`
# Fastlane
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots/**/*.png
fastlane/test_output
fastlane/README.md
\`\`\`
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
            command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/Fastfile|Appfile|Matchfile|Deliverfile|Gymfile/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];const secrets=c.match(/[\"\\x27](AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[0-9a-zA-Z]{48}|ghp_[0-9a-zA-Z]{36})[\"\\x27]/g);if(secrets)issues.push(\'CRITICAL: Possible API key or token found in Fastlane config\');if(/password\\s*[:=]\\s*[\"\\x27][^\"\\x27]{4,}/i.test(c)&&!/ENV\\[/.test(c.split(/password/i)[1]||\'\')){issues.push(\'WARNING: Possible hardcoded password — use ENV variables\')}if(/Fastfile/.test(f)){if(!/before_all/.test(c)&&/platform/.test(c))issues.push(\'INFO: No before_all block — consider adding shared setup\');if(!/error\\s+do/.test(c))issues.push(\'INFO: No error block — add error handling for failure notifications\');if(/match.*readonly.*false/.test(c)&&/ci_|CI/.test(c))issues.push(\'WARNING: match without readonly in what appears to be a CI lane\')}issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
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
            command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.env/.test(f)||/\\.example/.test(f))process.exit(0);if(!/fastlane/i.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/(MATCH_PASSWORD|FASTLANE_.*PASSWORD|SUPPLY_JSON_KEY)\\s*=\\s*[^\\s$]/.test(c))issues.push(\'CRITICAL: Secret value in Fastlane .env file — use CI secrets manager instead of committing this file\');issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'fastlane',
        filePath: 'fastlane/Fastfile',
        config: {
          default_platform: 'ios',
          lanes: ['test', 'beta', 'release'],
          uses_match: true,
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
