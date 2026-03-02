import path from 'path';
import { assertPathWithin } from './fs.js';

/**
 * Convert an absolute file path to a relative meta key (forward slashes).
 * If already relative, normalizes to forward slashes.
 * Throws if the resulting path escapes the projectRoot.
 */
export function toRelativeMetaKey(filePath: string, projectRoot: string): string {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
  const rel = path.relative(projectRoot, resolved).replace(/\\/g, '/');
  if (rel.startsWith('..')) {
    throw new Error(`Path escapes projectRoot: "${filePath}" is outside "${projectRoot}"`);
  }
  return rel;
}

/**
 * Resolve a meta key (relative or absolute) to an absolute path.
 * Handles backward-compat where old meta stored absolute paths.
 * Validates that relative paths don't escape the projectRoot.
 */
export function resolveMetaKey(metaKey: string, projectRoot: string): string {
  if (path.isAbsolute(metaKey)) {
    return metaKey;
  }
  const resolved = path.join(projectRoot, metaKey);
  assertPathWithin(resolved, projectRoot);
  return resolved;
}
