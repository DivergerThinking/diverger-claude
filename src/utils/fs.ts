import fs from 'fs/promises';
import path from 'path';
import { ValidationError } from '../core/errors.js';

/** Type guard for Node.js filesystem errors */
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}

/** Check if a file exists */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') return false;
    throw err;
  }
}

/** Strip UTF-8 BOM (U+FEFF) if present at the start of a string */
export function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

/** Read file as UTF-8 string, returns null if not found */
export async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return stripBom(raw);
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') return null;
    throw err;
  }
}

/** Read and parse JSON file, returns null if not found or invalid */
export async function readJsonOrNull<T = unknown>(filePath: string): Promise<T | null> {
  const content = await readFileOrNull(filePath);
  if (content === null) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/** Ensure directory exists, creating it recursively if needed */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/** Write file atomically: write to temp, then rename */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tempPath = `${filePath}.tmp.${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await fs.writeFile(tempPath, content, 'utf-8');
    try {
      await fs.rename(tempPath, filePath);
    } catch (renameErr: unknown) {
      if (isNodeError(renameErr) && renameErr.code === 'EXDEV') {
        // Cross-device rename not supported — fallback to copy + unlink
        await fs.copyFile(tempPath, filePath);
        try { await fs.unlink(tempPath); } catch { /* best-effort cleanup after successful copy */ }
      } else {
        throw renameErr;
      }
    }
  } catch (err: unknown) {
    // Cleanup temp file on failure (may already be removed in EXDEV path)
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}

/** Ensure a resolved path stays within the expected base directory.
 *  Throws if the path escapes via '..' or absolute segments. */
export function assertPathWithin(resolvedPath: string, baseDir: string): void {
  const normalizedResolved = path.resolve(resolvedPath);
  const normalizedBase = path.resolve(baseDir);
  if (!normalizedResolved.startsWith(normalizedBase + path.sep) && normalizedResolved !== normalizedBase) {
    throw new ValidationError(`Path traversal detectado: "${resolvedPath}" escapa de "${baseDir}"`);
  }
}

/** Copy a file, creating destination directory if needed */
export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

/** List files in a directory (non-recursive) */
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => path.join(dirPath, e.name));
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') return [];
    throw err;
  }
}
