/**
 * Filters for distinguishing framework/tool dependencies from utility libraries.
 * Used to decide which unknown dependencies should be reported for profile creation.
 */

/** Well-known utility packages that don't need profiles */
const UTILITY_EXCLUSIONS = new Set([
  // General utilities
  'lodash', 'underscore', 'ramda', 'immer', 'rxjs',
  // HTTP clients
  'axios', 'node-fetch', 'got', 'ky', 'superagent', 'undici',
  // Date/time
  'moment', 'dayjs', 'date-fns', 'luxon',
  // IDs
  'uuid', 'nanoid', 'cuid', 'ulid',
  // Logging
  'debug', 'winston', 'pino', 'bunyan', 'log4js',
  // Environment
  'dotenv', 'cross-env', 'env-cmd',
  // File system
  'rimraf', 'mkdirp', 'glob', 'minimatch', 'chokidar', 'fs-extra', 'fast-glob',
  // CLI
  'chalk', 'ora', 'inquirer', 'commander', 'yargs', 'meow', 'prompts', 'cac',
  // String/text
  'slugify', 'pluralize', 'change-case', 'camelcase',
  // Validation
  'zod', 'joi', 'yup', 'ajv', 'class-validator',
  // Crypto/hash
  'bcrypt', 'argon2', 'jsonwebtoken', 'jose',
  // Process
  'execa', 'cross-spawn', 'concurrently', 'npm-run-all',
  // Markdown/parsing
  'marked', 'remark', 'rehype', 'gray-matter', 'front-matter',
  // Config
  'cosmiconfig', 'rc', 'convict',
  // Data structures
  'deepmerge', 'deepmerge-ts', 'deep-equal', 'fast-deep-equal', 'diff',
  // Misc common
  'semver', 'p-limit', 'p-queue', 'retry', 'bottleneck',
  'sharp', 'jimp', 'multer', 'formidable',
  'cors', 'helmet', 'morgan', 'compression',
  'socket.io', 'ws',
  // Python utilities
  'requests', 'httpx', 'aiohttp', 'click', 'typer', 'rich',
  'pydantic', 'attrs', 'dataclasses-json',
  'pathlib', 'os', 'sys', 'json', 'csv', 're',
  // TypeScript/JS tools
  'tsup', 'tsx', 'ts-node', 'nodemon',
  'prettier', 'eslint', 'biome',
]);

/** Patterns that suggest a dependency is a framework/tool needing a profile */
const FRAMEWORK_PATTERNS: RegExp[] = [
  /^@\w+\/core$/,           // @nestjs/core, @angular/core
  /^@\w+\/cli$/,            // @angular/cli
  /^(vite|rollup|webpack)-plugin-/,  // Build tool plugins
  /-framework$/,            // *-framework
  /-cli$/,                  // *-cli (CLI frameworks)
  /^(create|init)-/,        // create-react-app, init-*
  /^@(aws-sdk|google-cloud|azure)\//,  // Cloud SDKs
];

/**
 * Check if a dependency name looks like a framework or tool that should have a profile.
 */
export function isLikelyFramework(dep: string): boolean {
  if (UTILITY_EXCLUSIONS.has(dep)) return false;
  if (FRAMEWORK_PATTERNS.some((p) => p.test(dep))) return true;

  // Scoped packages with "core" or "framework" are likely frameworks
  if (dep.startsWith('@') && (dep.includes('/core') || dep.includes('/framework'))) {
    return true;
  }

  return false;
}

/**
 * Determine if an unknown dependency should be reported for potential profile creation.
 * More conservative than isLikelyFramework — requires stronger signals.
 */
export function shouldReport(dep: string): boolean {
  if (!dep || dep.length < 2) return false;
  if (UTILITY_EXCLUSIONS.has(dep)) return false;
  if (dep.startsWith('.') || dep.startsWith('/')) return false;

  return isLikelyFramework(dep);
}
