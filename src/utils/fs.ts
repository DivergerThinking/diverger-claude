import fs from 'fs/promises';
import path from 'path';

/** Check if a file exists */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Read file as UTF-8 string, returns null if not found */
export async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
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
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (err) {
    // Cleanup temp file on failure
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
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
  } catch {
    return [];
  }
}
