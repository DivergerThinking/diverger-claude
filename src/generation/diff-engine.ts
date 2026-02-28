import type { DiffEntry, GeneratedFile } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { createTwoFilesPatch } from 'diff';

/**
 * Computes diffs between generated files and existing files on disk.
 * Used for dry-run mode.
 */
export class DiffEngine {
  /** Compute diffs for all generated files */
  async computeDiffs(files: GeneratedFile[]): Promise<DiffEntry[]> {
    const diffs: DiffEntry[] = [];

    for (const file of files) {
      const diff = await this.computeFileDiff(file);
      if (diff) diffs.push(diff);
    }

    return diffs;
  }

  private async computeFileDiff(file: GeneratedFile): Promise<DiffEntry | null> {
    const existing = await readFileOrNull(file.path);

    if (existing === null) {
      // New file
      const patch = createTwoFilesPatch(
        file.path,
        file.path,
        '',
        file.content,
        'no existe',
        'nuevo',
      );
      return {
        path: file.path,
        type: 'create',
        diff: patch,
      };
    }

    if (existing === file.content) {
      // No changes
      return null;
    }

    // Modified file
    const patch = createTwoFilesPatch(
      file.path,
      file.path,
      existing,
      file.content,
      'actual',
      'propuesto',
    );
    return {
      path: file.path,
      type: 'modify',
      diff: patch,
    };
  }
}
