import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedVersion: string | null = null;

/**
 * Get the package version from package.json at build time,
 * falling back to DIVERGER_VERSION env var, then '0.0.0-dev'.
 */
export function getVersion(): string {
  if (cachedVersion) return cachedVersion;

  // 1. Try env var (set at publish time)
  if (process.env.DIVERGER_VERSION) {
    cachedVersion = process.env.DIVERGER_VERSION;
    return cachedVersion;
  }

  // 2. Try reading package.json via require
  try {
    const require = createRequire(import.meta.url);
    const pkgPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../package.json',
    );
    const pkg = require(pkgPath) as { version?: string };
    if (pkg.version) {
      cachedVersion = pkg.version;
      return cachedVersion;
    }
  } catch {
    // ignore
  }

  cachedVersion = '0.0.0-dev';
  return cachedVersion;
}
