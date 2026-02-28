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

/** MCP config file (project root) */
export const MCP_FILE = '.mcp.json';

/** Diverger metadata file (project root) */
export const META_FILE = '.diverger-meta.json';

/** Confidence threshold for auto-apply in strict mode */
export const CONFIDENCE_THRESHOLD = 90;

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

/** Build meta file path from project root */
export function metaFilePath(projectRoot: string): string {
  return path.join(projectRoot, META_FILE);
}
