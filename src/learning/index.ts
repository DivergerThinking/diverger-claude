import type { MemoryStore } from '../core/types.js';
import { loadProjectMemory, saveProjectMemory } from '../memory/store.js';
import { extractSessionLearnings } from './session-extractor.js';
import type { SessionError, ExtractionResult } from './session-extractor.js';

/**
 * LearningEngine — Facade for the error learning loop.
 *
 * Processes session errors, classifies them into patterns,
 * and generates preventive rules when thresholds are met.
 */
export class LearningEngine {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Process errors from a session and extract learnings.
   */
  async processSessionErrors(errors: SessionError[]): Promise<ExtractionResult> {
    const store = await loadProjectMemory(this.projectRoot);
    const result = await extractSessionLearnings(this.projectRoot, store, errors);
    await saveProjectMemory(this.projectRoot, store);
    return result;
  }

  /**
   * Get the memory store (for inspection).
   */
  async getStore(): Promise<MemoryStore> {
    return loadProjectMemory(this.projectRoot);
  }
}

// Re-exports
export { classifyError, classifyErrors } from './error-analyzer.js';
export { matchAndUpdatePatterns, findPatternsForRuleGeneration } from './pattern-matcher.js';
export { generateRuleFromPattern, formatRuleContent } from './rule-generator.js';
export { extractSessionLearnings } from './session-extractor.js';
export type { SessionError, ExtractionResult } from './session-extractor.js';
