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
    return files.size > 0;
  }
}
