import type { GeneratedFile } from '../core/types.js';
import { ensureDir, fileExists, writeFileAtomic } from '../utils/fs.js';
import { BACKUP_DIR } from '../core/constants.js';
import fs from 'fs/promises';
import path from 'path';

export interface WriteResult {
  path: string;
  action: 'created' | 'updated' | 'skipped';
}

/**
 * Writes generated files to disk with atomic writes and backups.
 */
export class FileWriter {
  /** Write all generated files, creating backups of existing files */
  async writeAll(
    files: GeneratedFile[],
    projectRoot: string,
    options: { force?: boolean; dryRun?: boolean } = {},
  ): Promise<WriteResult[]> {
    if (options.dryRun) {
      return files.map((f) => ({
        path: f.path,
        action: 'skipped' as const,
      }));
    }

    const results: WriteResult[] = [];

    for (const file of files) {
      const result = await this.writeFile(file, projectRoot, options.force ?? false);
      results.push(result);
    }

    return results;
  }

  private async writeFile(
    file: GeneratedFile,
    projectRoot: string,
    force: boolean,
  ): Promise<WriteResult> {
    const exists = await fileExists(file.path);

    if (exists && !force) {
      // Read existing content to check if it's the same (normalize CRLF for cross-platform)
      const existingContent = await fs.readFile(file.path, 'utf-8');
      if (existingContent.replace(/\r\n/g, '\n') === file.content.replace(/\r\n/g, '\n')) {
        return { path: file.path, action: 'skipped' };
      }

      // Create backup
      await this.createBackup(file.path, projectRoot);
    }

    await writeFileAtomic(file.path, file.content);
    return { path: file.path, action: exists ? 'updated' : 'created' };
  }

  private async createBackup(filePath: string, projectRoot: string): Promise<void> {
    const backupDir = path.join(projectRoot, BACKUP_DIR);
    await ensureDir(backupDir);

    const relativePath = path.relative(projectRoot, filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${relativePath}.${timestamp}.bak`);

    await ensureDir(path.dirname(backupPath));
    await fs.copyFile(filePath, backupPath);
  }
}
