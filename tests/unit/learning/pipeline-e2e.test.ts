import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDefaultMemoryStore } from '../../../src/memory/store.js';
import { classifyErrors } from '../../../src/learning/error-analyzer.js';
import { matchAndUpdatePatterns, findPatternsForRuleGeneration } from '../../../src/learning/pattern-matcher.js';
import { formatRuleContent } from '../../../src/learning/rule-generator.js';
import { extractSessionLearnings, type SessionError } from '../../../src/learning/session-extractor.js';
import { parseGitHubActionsLog, ciErrorsToSessionErrors } from '../../../src/learning/ci-error-parser.js';
import { ERROR_PATTERN_RULE_THRESHOLD } from '../../../src/core/constants.js';
import type { MemoryStore } from '../../../src/core/types.js';

// Mock file write for rule generation
vi.mock('../../../src/utils/fs.js', () => ({
  writeFileAtomic: vi.fn().mockResolvedValue(undefined),
  readJsonOrNull: vi.fn().mockResolvedValue(null),
}));

describe('Learning Pipeline E2E', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = createDefaultMemoryStore();
  });

  it('should flow: error → classify → pattern → rule', async () => {
    const errors: SessionError[] = [
      { message: 'Error: EACCES: permission denied, open /dist/bundle.js', tool: 'Write' },
      { message: 'Error: EACCES: permission denied, open /dist/index.js', tool: 'Write' },
      { message: 'Error: EACCES: permission denied, open /dist/types.js', tool: 'Write' },
    ];

    // Step 1: Classify
    const classifications = classifyErrors(
      errors.map((e) => ({ message: e.message, tool: e.tool })),
    );
    expect(classifications.length).toBe(3);
    expect(classifications[0]!.category).toBe('tool-error');

    // Step 2: Update patterns (3 errors with same pattern → 1 pattern with 3 occurrences)
    const updated = matchAndUpdatePatterns(store, classifications);
    expect(updated.length).toBe(3);
    expect(store.errorPatterns.length).toBe(1); // Deduplicated by ID
    expect(store.errorPatterns[0]!.occurrences).toBe(3);

    // Step 3: Find patterns for rule generation
    const rulePatterns = findPatternsForRuleGeneration(store, ERROR_PATTERN_RULE_THRESHOLD);
    expect(rulePatterns.length).toBe(1);
    expect(rulePatterns[0]!.ruleGenerated).toBe(false);

    // Step 4: Format rule content
    const content = formatRuleContent(rulePatterns[0]!);
    expect(content).toContain('Auto-generated');
    expect(content).toContain('3 occurrences');
    expect(content).toContain('tool-error');
  });

  it('should NOT generate rule below threshold', () => {
    const errors: SessionError[] = [
      { message: 'Error: ENOENT: no such file or directory', tool: 'Bash' },
      { message: 'Error: ENOENT: no such file or directory', tool: 'Bash' },
    ];

    const classifications = classifyErrors(
      errors.map((e) => ({ message: e.message, tool: e.tool })),
    );
    matchAndUpdatePatterns(store, classifications);

    // 2 occurrences < threshold of 3
    const rulePatterns = findPatternsForRuleGeneration(store, ERROR_PATTERN_RULE_THRESHOLD);
    expect(rulePatterns.length).toBe(0);
  });

  it('should accumulate across multiple sessions to reach threshold', () => {
    const errorBatch = [
      { message: 'error TS2345: Argument of type string is not assignable', tool: 'Bash' },
    ];

    // Session 1: 1 occurrence
    const c1 = classifyErrors(errorBatch);
    matchAndUpdatePatterns(store, c1);
    expect(store.errorPatterns[0]!.occurrences).toBe(1);
    expect(findPatternsForRuleGeneration(store, ERROR_PATTERN_RULE_THRESHOLD).length).toBe(0);

    // Session 2: 2 occurrences total
    const c2 = classifyErrors(errorBatch);
    matchAndUpdatePatterns(store, c2);
    expect(store.errorPatterns[0]!.occurrences).toBe(2);
    expect(findPatternsForRuleGeneration(store, ERROR_PATTERN_RULE_THRESHOLD).length).toBe(0);

    // Session 3: 3 occurrences total → threshold reached
    const c3 = classifyErrors(errorBatch);
    matchAndUpdatePatterns(store, c3);
    expect(store.errorPatterns[0]!.occurrences).toBe(3);
    expect(findPatternsForRuleGeneration(store, ERROR_PATTERN_RULE_THRESHOLD).length).toBe(1);
  });

  it('should run full extractSessionLearnings pipeline', async () => {
    // Pre-populate store with 2 occurrences so the 3rd triggers rule gen
    const errors1: SessionError[] = [
      { message: 'Module not found: react-query', tool: 'Bash' },
      { message: 'Module not found: react-query', tool: 'Bash' },
    ];
    await extractSessionLearnings('/test-project', store, errors1);
    expect(store.errorPatterns.length).toBe(1);
    expect(store.errorPatterns[0]!.occurrences).toBe(2);
    expect(store.stats.rulesGenerated).toBe(0);

    // 3rd occurrence triggers rule generation
    const errors2: SessionError[] = [
      { message: 'Module not found: react-query', tool: 'Bash' },
    ];
    const result = await extractSessionLearnings('/test-project', store, errors2);
    expect(result.errorsProcessed).toBe(1);
    expect(result.patternsUpdated).toBe(1);
    expect(result.rulesGenerated).toBe(1);
    expect(result.generatedRulePaths.length).toBe(1);
    expect(store.errorPatterns[0]!.ruleGenerated).toBe(true);
    expect(store.stats.rulesGenerated).toBe(1);
  });

  it('should not regenerate rule for already-generated patterns', async () => {
    // Populate with 3 occurrences
    const errors: SessionError[] = [
      { message: 'Error: EACCES: permission denied', tool: 'Write' },
      { message: 'Error: EACCES: permission denied', tool: 'Write' },
      { message: 'Error: EACCES: permission denied', tool: 'Write' },
    ];
    const result1 = await extractSessionLearnings('/test', store, errors);
    expect(result1.rulesGenerated).toBe(1);

    // 4th occurrence should not generate another rule
    const errors2: SessionError[] = [
      { message: 'Error: EACCES: permission denied', tool: 'Write' },
    ];
    const result2 = await extractSessionLearnings('/test', store, errors2);
    expect(result2.rulesGenerated).toBe(0);
    expect(store.stats.rulesGenerated).toBe(1);
  });

  it('should process CI errors through the same pipeline', async () => {
    const log = [
      'build\tSetup Node\t2025-03-01T10:00:00Z Node.js setup complete',
      'build\tInstall deps\t2025-03-01T10:01:00Z npm ci complete',
      'build\tTypecheck\t2025-03-01T10:02:00Z error TS2345: Argument of type string not assignable to number',
      'build\tTypecheck\t2025-03-01T10:02:01Z error TS2322: Type string is not assignable to type number',
    ].join('\n');

    // Parse CI log
    const parseResult = parseGitHubActionsLog(log);
    expect(parseResult.errors.length).toBeGreaterThan(0);

    // Convert to SessionErrors
    const sessionErrors = ciErrorsToSessionErrors(parseResult.errors);
    expect(sessionErrors.length).toBeGreaterThan(0);

    // Process through learning pipeline
    const result = await extractSessionLearnings('/test-project', store, sessionErrors);
    expect(result.errorsProcessed).toBeGreaterThan(0);
    expect(result.patternsUpdated).toBeGreaterThan(0);
    expect(store.errorPatterns.length).toBeGreaterThan(0);
  });

  it('should return zero results for empty errors', async () => {
    const result = await extractSessionLearnings('/test', store, []);
    expect(result.errorsProcessed).toBe(0);
    expect(result.patternsUpdated).toBe(0);
    expect(result.rulesGenerated).toBe(0);
    expect(result.generatedRulePaths).toEqual([]);
  });
});
