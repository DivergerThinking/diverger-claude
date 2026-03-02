import path from 'path';
import type { AnalyzerResult } from '../../core/types.js';

/** Abstract base class for technology analyzers */
export abstract class BaseAnalyzer {
  /** Unique ID for this analyzer */
  abstract readonly id: string;

  /** Human-readable name */
  abstract readonly name: string;

  /** File patterns this analyzer needs (glob patterns) */
  abstract readonly filePatterns: string[];

  /** Patterns that should only be searched at the project root (not expanded to subdirs) */
  readonly rootOnlyPatterns?: string[];

  /**
   * Analyze the given files and return detected technologies.
   * @param files - Map of file paths to their contents
   * @param projectRoot - The project root directory
   */
  abstract analyze(
    files: Map<string, string>,
    projectRoot: string,
  ): Promise<AnalyzerResult>;

  /** Check if this analyzer has relevant files to analyze */
  hasRelevantFiles(files: Map<string, string>): boolean {
    for (const filePath of files.keys()) {
      for (const pattern of this.filePatterns) {
        if (this.matchesPattern(filePath, pattern)) return true;
      }
    }
    return false;
  }

  /** Simple glob pattern matching (supports * at one position) */
  private matchesPattern(filePath: string, pattern: string): boolean {
    if (!pattern.includes('*')) {
      // Exact match (basename or full relative path)
      return filePath === pattern || filePath.endsWith('/' + pattern);
    }
    // Split on '*' to get prefix and suffix parts
    const starIdx = pattern.indexOf('*');
    const prefix = pattern.slice(0, starIdx);
    const suffix = pattern.slice(starIdx + 1);

    // Try matching against the full path first
    if (this.matchWildcard(filePath, prefix, suffix)) return true;

    // Also try matching against just the basename (for subdirectory files)
    const basename = path.basename(filePath);
    if (basename !== filePath && this.matchWildcard(basename, prefix, suffix)) return true;

    return false;
  }

  /** Check if value matches a wildcard pattern split into prefix and suffix */
  private matchWildcard(value: string, prefix: string, suffix: string): boolean {
    if (value.startsWith(prefix) && value.endsWith(suffix)) {
      const endIdx = suffix.length > 0 ? value.length - suffix.length : value.length;
      const middle = value.slice(prefix.length, endIdx);
      return !middle.includes('/');
    }
    return false;
  }
}
