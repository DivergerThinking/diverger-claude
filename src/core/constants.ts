import path from 'path';

/** Directory name for Claude Code config */
export const CLAUDE_DIR = '.claude';

/** Main Claude config file */
export const CLAUDE_MD = 'CLAUDE.md';

/** Settings file */
export const SETTINGS_FILE = 'settings.json';

/** Rules subdirectory */
export const RULES_DIR = 'rules';

/** Agents subdirectory */
export const AGENTS_DIR = 'agents';

/** Skills subdirectory */
export const SKILLS_DIR = 'skills';

/** Hooks scripts subdirectory */
export const HOOKS_DIR = 'hooks';

/** MCP config file (project root) */
export const MCP_FILE = '.mcp.json';

/** Diverger metadata file (project root) */
export const META_FILE = '.diverger-meta.json';

/** Confidence threshold for auto-apply in strict mode */
export const CONFIDENCE_THRESHOLD = 90;

/** Mobile framework technology IDs for use in analyzer/profiles */
export const MOBILE_TECH_IDS = new Set([
  'react-native', 'expo', 'flutter', 'swiftui', 'jetpack-compose',
]);

/** Manifest files that trigger detection */
export const MANIFEST_FILES = [
  'package.json',
  'tsconfig.json',
  'pyproject.toml',
  'requirements.txt',
  'setup.py',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'go.mod',
  'Cargo.toml',
  '*.csproj',
  '*.sln',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.github/workflows/*.yml',
  '.github/workflows/*.yaml',
  'nx.json',
  'turbo.json',
  'lerna.json',
  'pnpm-workspace.yaml',
] as const;

/** Sensitive file patterns to always deny */
export const SENSITIVE_PATTERNS = [
  '.env*',
  '**/*.pem',
  '**/*.key',
  '**/secrets/**',
  '**/.aws/**',
  '**/.ssh/**',
  '**/credentials*',
  '**/*.pfx',
  '**/*.p12',
] as const;

// --- Plugin: Universal Component Names ---

export const UNIVERSAL_AGENT_NAMES: ReadonlySet<string> = new Set([
  'code-reviewer', 'test-writer', 'security-checker',
  'doc-writer', 'refactor-assistant', 'migration-helper',
]);

export const UNIVERSAL_SKILL_NAMES: ReadonlySet<string> = new Set([
  'architecture-style-guide', 'security-guide', 'git-workflow-guide',
]);

export const UNIVERSAL_HOOK_SCRIPT_FILENAMES: ReadonlySet<string> = new Set([
  'secret-scanner.sh', 'destructive-cmd-blocker.sh',
  'check-long-lines.sh', 'check-trailing-newline.sh',
  'pre-commit-validator.sh',
]);

/** Memory file (project-level behavioral memory) */
export const MEMORY_FILE = '.diverger-memory.json';

/** Maximum error patterns stored per project */
export const MAX_ERROR_PATTERNS = 200;

/** Maximum repair log entries stored per project */
export const MAX_REPAIR_LOG = 500;

/** Maximum anti-patterns stored per project */
export const MAX_ANTI_PATTERNS = 100;

/** Maximum best practices stored per project */
export const MAX_BEST_PRACTICES = 50;

/** Maximum evolution log entries stored per project */
export const MAX_EVOLUTION_LOG = 200;

/** Error pattern occurrences needed to auto-generate a rule */
export const ERROR_PATTERN_RULE_THRESHOLD = 3;

/** Days before pruning old error patterns */
export const ERROR_PATTERN_TTL_DAYS = 90;

/** Days between memory consolidations */
export const MEMORY_CONSOLIDATION_INTERVAL_DAYS = 7;

/** Global memory directory under user home */
export const GLOBAL_MEMORY_DIR = '.diverger';

/** Global memory filename */
export const GLOBAL_MEMORY_FILE = 'memory.json';

/** Build memory file path from project root */
export function memoryFilePath(projectRoot: string): string {
  return path.join(projectRoot, MEMORY_FILE);
}

/** Backup directory for pre-merge backups */
export const BACKUP_DIR = '.diverger-backup';

/** Knowledge cache directory */
export const KNOWLEDGE_CACHE_DIR = '.diverger-cache';

/** Default knowledge cache TTL in days */
export const KNOWLEDGE_CACHE_TTL_DAYS = 30;

/** Build claude dir path from project root */
export function claudeDir(projectRoot: string): string {
  return path.join(projectRoot, CLAUDE_DIR);
}

/** Build rules dir path from project root */
export function rulesDir(projectRoot: string): string {
  return path.join(projectRoot, CLAUDE_DIR, RULES_DIR);
}

/** Build agents dir path from project root */
export function agentsDir(projectRoot: string): string {
  return path.join(projectRoot, CLAUDE_DIR, AGENTS_DIR);
}

/** Build skills dir path from project root */
export function skillsDir(projectRoot: string): string {
  return path.join(projectRoot, CLAUDE_DIR, SKILLS_DIR);
}

/** Build hooks dir path from project root */
export function hooksDir(projectRoot: string): string {
  return path.join(projectRoot, CLAUDE_DIR, HOOKS_DIR);
}

/** Build meta file path from project root */
export function metaFilePath(projectRoot: string): string {
  return path.join(projectRoot, META_FILE);
}
