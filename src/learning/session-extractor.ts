import type { MemoryStore } from '../core/types.js';
import { ERROR_PATTERN_RULE_THRESHOLD } from '../core/constants.js';
import { classifyErrors } from './error-analyzer.js';
import { matchAndUpdatePatterns, findPatternsForRuleGeneration } from './pattern-matcher.js';
import { generateRuleFromPattern } from './rule-generator.js';

export interface SessionError {
  message: string;
  tool?: string;
  timestamp?: string;
}

export interface ExtractionResult {
  errorsProcessed: number;
  patternsUpdated: number;
  rulesGenerated: number;
  generatedRulePaths: string[];
}

/**
 * Extract learnings from a session's errors.
 * Classifies errors, updates patterns, and generates rules when thresholds are met.
 */
export async function extractSessionLearnings(
  projectRoot: string,
  store: MemoryStore,
  errors: SessionError[],
): Promise<ExtractionResult> {
  if (errors.length === 0) {
    return { errorsProcessed: 0, patternsUpdated: 0, rulesGenerated: 0, generatedRulePaths: [] };
  }

  // Classify errors
  const classifications = classifyErrors(
    errors.map((e) => ({ message: e.message, tool: e.tool })),
  );

  // Update patterns in the store
  const updatedPatterns = matchAndUpdatePatterns(store, classifications);

  // Check for patterns that need rule generation
  const rulePatterns = findPatternsForRuleGeneration(store, ERROR_PATTERN_RULE_THRESHOLD);
  const generatedRulePaths: string[] = [];

  for (const pattern of rulePatterns) {
    try {
      const rulePath = await generateRuleFromPattern(projectRoot, pattern);
      pattern.ruleGenerated = true;
      store.stats.rulesGenerated = (store.stats.rulesGenerated ?? 0) + 1;
      generatedRulePaths.push(rulePath);
    } catch {
      // Rule generation failure is non-critical
    }
  }

  return {
    errorsProcessed: errors.length,
    patternsUpdated: updatedPatterns.length,
    rulesGenerated: generatedRulePaths.length,
    generatedRulePaths,
  };
}
