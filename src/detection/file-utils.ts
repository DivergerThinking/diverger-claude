import path from 'path';

/** Entry with the resolved path and file content */
export interface FileEntry {
  path: string;
  content: string;
}

/** Count path depth (number of `/` separators) */
function pathDepth(filePath: string): number {
  return filePath.split('/').length - 1;
}

/**
 * Find all file entries matching a basename, sorted by depth (shallowest first).
 * @param files - Map of relative paths to file contents
 * @param name - The basename to search for (e.g. 'package.json')
 */
export function findAllFileEntries(files: Map<string, string>, name: string): FileEntry[] {
  const matches: FileEntry[] = [];
  for (const [filePath, content] of files) {
    if (path.basename(filePath) === name) {
      matches.push({ path: filePath, content });
    }
  }
  // Sort by depth: root-level first, then shallow subdirs
  matches.sort((a, b) => pathDepth(a.path) - pathDepth(b.path));
  return matches;
}

/**
 * Find the first (shallowest) file entry matching a basename.
 * @param files - Map of relative paths to file contents
 * @param name - The basename to search for
 */
export function findFileEntry(files: Map<string, string>, name: string): FileEntry | undefined {
  const entries = findAllFileEntries(files, name);
  return entries[0];
}

/**
 * Find the content of the first (shallowest) file matching a basename.
 * @param files - Map of relative paths to file contents
 * @param name - The basename to search for
 */
export function findFile(files: Map<string, string>, name: string): string | undefined {
  return findFileEntry(files, name)?.content;
}

/**
 * Check if any file in the map matches the given basename.
 * @param files - Map of relative paths to file contents
 * @param name - The basename to search for
 */
export function hasFile(files: Map<string, string>, name: string): boolean {
  for (const filePath of files.keys()) {
    if (path.basename(filePath) === name) return true;
  }
  return false;
}
