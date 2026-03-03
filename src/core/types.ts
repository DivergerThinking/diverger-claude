// ============================================================================
// Core Types for diverger-claude
// ============================================================================

// --- Detection Types ---

export type TechnologyCategory =
  | 'language'
  | 'framework'
  | 'testing'
  | 'infra'
  | 'tooling'
  | 'monorepo'
  | 'mobile';

export interface DetectedTechnology {
  /** Unique identifier, e.g. "typescript", "nextjs", "jest" */
  id: string;
  /** Human-readable name, e.g. "TypeScript", "Next.js" */
  name: string;
  /** Category for profile layer mapping */
  category: TechnologyCategory;
  /** Detected version string, e.g. "15.1.0" */
  version?: string;
  /** Major version number for profile overrides */
  majorVersion?: number;
  /** Confidence score 0-100 */
  confidence: number;
  /** Evidence that led to this detection */
  evidence: DetectionEvidence[];
  /** Parent technology (e.g. React is parent of Next.js) */
  parentId?: string;
  /** Associated profile IDs to activate */
  profileIds: string[];
}

export interface DetectionEvidence {
  /** Source file where evidence was found */
  source: string;
  /** Type of evidence */
  type: 'manifest' | 'config-file' | 'directory' | 'file-pattern' | 'content';
  /** Human-readable description */
  description: string;
  /** Confidence contribution (0-100) */
  weight: number;
  /** Package name for dependency tracking (avoids parsing description) */
  trackedPackage?: string;
}

export interface DetectionResult {
  /** All detected technologies sorted by confidence */
  technologies: DetectedTechnology[];
  /** Detected monorepo structure, if any */
  monorepo?: MonorepoInfo;
  /** Detected architecture pattern */
  architecture?: ArchitecturePattern;
  /** Root directory that was scanned */
  rootDir: string;
  /** Timestamp of detection */
  detectedAt: string;
}

export type ArchitecturePattern =
  | 'monolith'
  | 'microservices'
  | 'serverless'
  | 'jamstack'
  | 'modular-monolith';

export interface MonorepoInfo {
  /** Type of monorepo tool */
  type: 'npm-workspaces' | 'yarn-workspaces' | 'pnpm-workspaces' | 'lerna' | 'nx' | 'turborepo';
  /** Root directory of the monorepo */
  rootDir: string;
  /** Resolved workspace packages */
  packages: WorkspacePackage[];
}

export interface WorkspacePackage {
  /** Package name from manifest */
  name: string;
  /** Relative path from monorepo root */
  path: string;
  /** Technologies detected in this package */
  technologies: DetectedTechnology[];
}

// --- Profile Types ---

export type ProfileLayer = 0 | 10 | 20 | 30 | 40;

export const PROFILE_LAYERS = {
  BASE: 0 as ProfileLayer,
  LANGUAGE: 10 as ProfileLayer,
  FRAMEWORK: 20 as ProfileLayer,
  TESTING: 30 as ProfileLayer,
  INFRA: 40 as ProfileLayer,
} as const;

export type GovernanceLevel = 'mandatory' | 'recommended';

export interface Profile {
  /** Unique identifier, e.g. "languages/typescript" */
  id: string;
  /** Human-readable name */
  name: string;
  /** Layer this profile belongs to */
  layer: ProfileLayer;
  /** Technology IDs this profile applies to */
  technologyIds: string[];
  /** Version constraints (e.g. { min: 14, max: 15 }) */
  versionConstraints?: VersionConstraint;
  /** Profile IDs that must be active for this one */
  dependsOn?: string[];
  /** Contributions to the composed config */
  contributions: ProfileContributions;
}

export interface VersionConstraint {
  /** Minimum major version (inclusive) */
  min?: number;
  /** Maximum major version (inclusive) */
  max?: number;
}

export interface ProfileContributions {
  /** Content sections for CLAUDE.md */
  claudeMd?: ClaudeMdSection[];
  /** Deep-merged into settings.json */
  settings?: Partial<ClaudeSettings>;
  /** Rule files to generate */
  rules?: RuleDefinition[];
  /** Agent definitions or enrichments */
  agents?: AgentContribution[];
  /** Skill definitions */
  skills?: SkillDefinition[];
  /** Hook definitions */
  hooks?: HookDefinition[];
  /** External hook scripts to generate as .claude/hooks/*.sh */
  hookScripts?: HookScriptDefinition[];
  /** MCP server configs */
  mcp?: McpServerConfig[];
  /** External tool configs */
  externalTools?: ExternalToolConfig[];
}

// --- CLAUDE.md Types ---

export interface ClaudeMdSection {
  /** Section heading (## level) */
  heading: string;
  /** Content as markdown */
  content: string;
  /** Order within the document (lower = earlier) */
  order: number;
}

// --- Settings Types ---

export interface ClaudeSettings {
  permissions: {
    allow?: string[];
    deny?: string[];
    additionalDirectories?: string[];
  };
  sandbox?: {
    filesystem?: {
      denyRead?: string[];
      denyWrite?: string[];
    };
  };
  env?: Record<string, string>;
}

// --- Rules Types ---

export interface RuleDefinition {
  /** File path relative to .claude/rules/ */
  path: string;
  /** Content of the rule file (markdown) */
  content: string;
  /** Governance level */
  governance: GovernanceLevel;
  /** Description for tracking */
  description: string;
  /** Glob patterns to scope when this rule loads (YAML frontmatter paths:) */
  paths?: string[];
}

// --- Agent Types ---

export interface AgentContribution {
  /** Agent name (used as filename, e.g. "code-reviewer") */
  name: string;
  /** Whether this is a base definition or enrichment */
  type: 'define' | 'enrich';
  /** Prompt content to add (concatenated with existing for 'enrich') */
  prompt?: string;
  /** Skills this agent should reference */
  skills?: string[];
  /** Model preference (most specific layer wins) */
  model?: string;
  /** Agent description */
  description?: string;
  /** Explicit tool list (overrides DEFAULT_TOOLS when provided) */
  tools?: string[];
  /** Memory mode for the agent */
  memory?: 'project';
}

export interface AgentDefinition {
  /** Agent name */
  name: string;
  /** Full composed prompt */
  prompt: string;
  /** All skills from all contributing layers */
  skills: string[];
  /** Model to use */
  model?: string;
  /** Description */
  description: string;
  /** Explicit tool list (when set, used instead of DEFAULT_TOOLS) */
  tools?: string[];
  /** Memory mode for the agent */
  memory?: 'project';
}

// --- Skill Types ---

export interface SkillDefinition {
  /** Skill name (directory name) */
  name: string;
  /** SKILL.md content */
  content: string;
  /** Description */
  description: string;
  /** If true, skill body is static and the model is not invoked to process it */
  disableModelInvocation?: boolean;
  /** Tools the skill is allowed to use */
  allowedTools?: string[];
  /** Whether the user can invoke this skill directly (e.g. /skill-name) */
  userInvocable?: boolean;
  /** Hint text shown for the slash-command argument (e.g. "component name") */
  argumentHint?: string;
  /** Fork context so the skill gets its own conversation branch */
  context?: 'fork';
}

// --- Hook Types ---

export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PermissionRequest'
  | 'PostToolUseFailure'
  | 'SubagentStart'
  | 'TeammateIdle'
  | 'TaskCompleted'
  | 'ConfigChange'
  | 'WorktreeCreate'
  | 'WorktreeRemove'
  | 'PreCompact'
  | 'SessionEnd';

export interface HookDefinition {
  /** When to trigger */
  event: HookEvent;
  /** Matcher pattern (tool name or glob) */
  matcher?: string;
  /** Hook command entries to run */
  hooks: HookCommandEntry[];
}

export interface HookCommandEntry {
  /** Entry type — always 'command' */
  type: 'command';
  /** Shell command */
  command: string;
  /** Timeout in seconds */
  timeout?: number;
  /** Status message shown while this hook runs */
  statusMessage?: string;
}

// --- Hook Script Types ---

export interface HookScriptDefinition {
  /** Filename for the script, e.g. 'secret-scanner.sh' */
  filename: string;
  /** Bash script content */
  content: string;
  /** Whether this is a PreToolUse script (outputs JSON) or PostToolUse (exit codes) */
  isPreToolUse: boolean;
}

// --- MCP Types ---

export interface McpServerConfig {
  /** Server name */
  name: string;
  /** Command to start the server */
  command: string;
  /** Arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
}

// --- External Tool Types ---

export type ExternalToolType =
  | 'eslint' | 'prettier' | 'tsconfig' | 'editorconfig'
  | 'swiftlint' | 'ktlint' | 'dart-analysis' | 'detox-config'
  | 'fastlane' | 'xcode-build-settings' | 'gradle-config'
  | 'ruff' | 'checkstyle' | 'golangci' | 'clippy' | 'dockerignore';

export interface ExternalToolConfig {
  /** Tool type */
  type: ExternalToolType;
  /** Config file path relative to project root */
  filePath: string;
  /** Config content (JSON stringifiable) */
  config: Record<string, unknown>;
  /** Strategy when file exists */
  mergeStrategy: 'create-only' | 'align' | 'overwrite';
}

// --- Composed Config (output of profile composition) ---

export interface ComposedConfig {
  /** All CLAUDE.md sections in order */
  claudeMdSections: ClaudeMdSection[];
  /** Merged settings */
  settings: ClaudeSettings;
  /** All rule definitions */
  rules: RuleDefinition[];
  /** Composed agent definitions */
  agents: AgentDefinition[];
  /** All skill definitions */
  skills: SkillDefinition[];
  /** All hook definitions */
  hooks: HookDefinition[];
  /** External hook scripts to write as .claude/hooks/*.sh */
  hookScripts: HookScriptDefinition[];
  /** All MCP configs */
  mcp: McpServerConfig[];
  /** External tool configs */
  externalTools: ExternalToolConfig[];
  /** Profiles that contributed */
  appliedProfiles: string[];
  /** Knowledge results fetched from Claude API (C4) */
  knowledge?: KnowledgeResult[];
}

// --- Generation Types ---

export interface GeneratedFile {
  /** Absolute path where the file should be written */
  path: string;
  /** File content */
  content: string;
  /** Governance level (for rules) */
  governance?: GovernanceLevel;
}

export interface GenerationResult {
  /** All files that would be generated */
  files: GeneratedFile[];
  /** Detection result used */
  detection: DetectionResult;
  /** Composed config used */
  config: ComposedConfig;
}

export interface DiffEntry {
  /** File path */
  path: string;
  /** Type of change */
  type: 'create' | 'modify' | 'delete';
  /** Diff content (unified format) */
  diff: string;
}

// --- Governance / Merge Types ---

export interface DivergentMeta {
  /** diverger-claude version that generated this */
  version: string;
  /** When configs were generated */
  generatedAt: string;
  /** Detected stack summary */
  detectedStack: string[];
  /** Applied profile IDs */
  appliedProfiles: string[];
  /** SHA256 hashes of generated files (for three-way merge) */
  fileHashes: Record<string, string>;
  /** Governance level per rule path */
  ruleGovernance: Record<string, GovernanceLevel>;
  /** Original generated file contents for three-way merge base (C1) */
  fileContents: Record<string, string>;
  /** Real npm package names tracked for dependency change detection (C5) */
  trackedDependencies: string[];
}

export interface MergeAllResult {
  /** Individual merge results per file */
  results: MergeResult[];
  /** Pending meta to save AFTER files are written to disk (C3) */
  pendingMeta: DivergentMeta;
  /** Previous meta from before this sync (for preserving non-written file entries) */
  oldMeta: DivergentMeta | null;
}

export type MergeOutcome =
  | 'skip'          // No changes
  | 'auto-apply'    // Only library changed, safe to apply
  | 'keep'          // Only team changed, respect their changes
  | 'merged'        // Both changed, successfully merged
  | 'conflict'      // Both changed, needs manual resolution
  | 'error';        // Merge process encountered an error

export interface MergeResult {
  /** File path */
  path: string;
  /** What happened */
  outcome: MergeOutcome;
  /** Resulting content (null for 'skip' and 'keep') */
  content?: string;
  /** Conflict description if applicable */
  conflictDetails?: string;
}

// --- Knowledge Types ---

/** Query parameters for knowledge client searches */
export interface KnowledgeQuery {
  /** Technology to search for */
  technology: string;
  /** Specific version */
  version?: string;
  /** What aspect to focus on */
  aspect: 'best-practices' | 'security' | 'performance' | 'conventions';
}

export interface KnowledgeResult {
  /** Technology queried */
  technology: string;
  /** Synthesized content */
  content: string;
  /** Sources found */
  sources: string[];
  /** When this was fetched */
  fetchedAt: string;
  /** TTL in days */
  ttlDays: number;
  /** Whether result came from local cache */
  fromCache?: boolean;
}

// --- CLI Types ---

export type OutputMode = 'rich' | 'quiet' | 'json';

export interface CliOptions {
  /** Output mode */
  output: OutputMode;
  /** Force overwrite without prompts */
  force: boolean;
  /** Dry-run mode (show what would happen) */
  dryRun: boolean;
  /** Target directory (defaults to cwd) */
  targetDir: string;
  /** Exclude universal components provided by plugin */
  pluginMode?: boolean;
}

// --- Analyzer Types ---

export interface AnalyzerResult {
  /** Technologies detected by this analyzer */
  technologies: DetectedTechnology[];
  /** Files that were analyzed */
  analyzedFiles: string[];
}

