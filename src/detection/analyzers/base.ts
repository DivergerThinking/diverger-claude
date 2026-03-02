import type { AnalyzerResult } from '../../core/types.js';

/** Abstract base class for technology analyzers */
export abstract class BaseAnalyzer {
  /** Unique ID for this analyzer */
  abstract readonly id: string;

  /** Human-readable name */
  abstract readonly name: string;

  /** File patterns this analyzer needs (glob patterns) */
  abstract readonly filePatterns: string[];

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
    // The matched segment (replacing *) must not contain path separators
    if (filePath.startsWith(prefix) && filePath.endsWith(suffix)) {
      const endIdx = suffix.length > 0 ? filePath.length - suffix.length : filePath.length;
      const middle = filePath.slice(prefix.length, endIdx);
      return !middle.includes('/');
    }
    return false;
  }
}
