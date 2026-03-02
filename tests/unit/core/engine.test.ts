import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  ComposedConfig,
  DetectedTechnology,
  DetectionResult,
  DiffEntry,
  GenerationResult,
  KnowledgeResult,
  MergeAllResult,
} from '../../../src/core/types.js';

// ── Mock all dependencies ────────────────────────────────────────────────

vi.mock('../../../src/detection/index.js', () => ({
  DetectionEngine: vi.fn().mockImplementation(() => ({
    detect: vi.fn(),
  })),
}));

vi.mock('../../../src/profiles/index.js', () => ({
  ProfileEngine: vi.fn().mockImplementation(() => ({
    compose: vi.fn(),
  })),
}));

vi.mock('../../../src/generation/index.js', () => ({
  GenerationEngine: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
    computeDiff: vi.fn(),
    writeFiles: vi.fn(),
  })),
}));

vi.mock('../../../src/governance/index.js', () => ({
  GovernanceEngine: vi.fn().mockImplementation(() => ({
    mergeAll: vi.fn(),
    validate: vi.fn(),
  })),
}));

vi.mock('../../../src/knowledge/index.js', () => ({
  KnowledgeEngine: vi.fn().mockImplementation(() => ({
    initCache: vi.fn(),
    fetchBestPractices: vi.fn(),
  })),
}));

vi.mock('../../../src/governance/history.js', () => ({
  loadMeta: vi.fn(),
}));

// Import after mocks are set up
import { DivergerEngine, type EngineContext } from '../../../src/core/engine.js';
import { DetectionEngine } from '../../../src/detection/index.js';
import { ProfileEngine } from '../../../src/profiles/index.js';
import { GenerationEngine } from '../../../src/generation/index.js';
import { GovernanceEngine } from '../../../src/governance/index.js';
import { KnowledgeEngine } from '../../../src/knowledge/index.js';
import { loadMeta } from '../../../src/governance/history.js';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeTech(overrides: Partial<DetectedTechnology> = {}): DetectedTechnology {
  return {
    id: 'typescript',
    name: 'TypeScript',
    category: 'language',
    confidence: 95,
    evidence: [{ source: 'tsconfig.json', type: 'config-file', description: 'Found tsconfig.json', weight: 95 }],
    profileIds: ['languages/typescript'],
    ...overrides,
  };
}

function makeDetection(techs: DetectedTechnology[] = []): DetectionResult {
  return {
    technologies: techs,
    rootDir: '/project',
    detectedAt: new Date().toISOString(),
  };
}

function makeComposedConfig(overrides: Partial<ComposedConfig> = {}): ComposedConfig {
  return {
    claudeMdSections: [],
    settings: { permissions: {} },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
    mcp: [],
    externalTools: [],
    appliedProfiles: ['base/universal'],
    ...overrides,
  };
}

function makeCtx(overrides: Partial<EngineContext> = {}): EngineContext {
  return {
    projectRoot: '/project',
    options: { output: 'rich', force: false, dryRun: false, targetDir: '/project' },
    ...overrides,
  };
}

function makeKnowledgeResult(tech: string): KnowledgeResult {
  return {
    technology: tech,
    content: `Best practices for ${tech}`,
    sources: [`https://example.com/${tech}`],
    fetchedAt: new Date().toISOString(),
    ttlDays: 30,
  };
}

function makeGenerationResult(detection: DetectionResult, config: ComposedConfig): GenerationResult {
  return {
    files: [{ path: '/project/.claude/CLAUDE.md', content: '# Config' }],
    detection,
    config,
  };
}

// ── Test suite ───────────────────────────────────────────────────────────

describe('DivergerEngine', () => {
  let engine: DivergerEngine;
  let mockDetect: ReturnType<typeof vi.fn>;
  let mockCompose: ReturnType<typeof vi.fn>;
  let mockGenerate: ReturnType<typeof vi.fn>;
  let mockComputeDiff: ReturnType<typeof vi.fn>;
  let mockMergeAll: ReturnType<typeof vi.fn>;
  let mockInitCache: ReturnType<typeof vi.fn>;
  let mockFetchBestPractices: ReturnType<typeof vi.fn>;
  let mockLoadMeta: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    engine = new DivergerEngine();

    // Reach into the mocked constructors to grab the mock instances
    const detectionInstance = (DetectionEngine as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value;
    const profileInstance = (ProfileEngine as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value;
    const generationInstance = (GenerationEngine as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value;
    const governanceInstance = (GovernanceEngine as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value;
    const knowledgeInstance = (KnowledgeEngine as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value;

    mockDetect = detectionInstance.detect;
    mockCompose = profileInstance.compose;
    mockGenerate = generationInstance.generate;
    mockComputeDiff = generationInstance.computeDiff;
    mockMergeAll = governanceInstance.mergeAll;
    mockInitCache = knowledgeInstance.initCache;
    mockFetchBestPractices = knowledgeInstance.fetchBestPractices;
    mockLoadMeta = vi.mocked(loadMeta);
  });

  // ── 1. confirmDetection with force=true ──────────────────────────────

  describe('confirmDetection with force=true', () => {
    it('should return all technologies regardless of confidence', async () => {
      const lowConfTech = makeTech({ id: 'flask', name: 'Flask', confidence: 50, category: 'framework' });
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([highConfTech, lowConfTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      const ctx = makeCtx({ options: { output: 'rich', force: true, dryRun: false, targetDir: '/project' } });
      const result = await engine.init(ctx);

      // With force=true, both techs survive confirmDetection and reach compose
      // Verify compose was called with both technologies (not filtered)
      expect(mockCompose).toHaveBeenCalledTimes(1);
      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      expect(composeArg.technologies).toHaveLength(2);
      expect(composeArg.technologies.map((t: DetectedTechnology) => t.id)).toContain('flask');
      expect(composeArg.technologies.map((t: DetectedTechnology) => t.id)).toContain('python');
      expect(result).toBe(genResult);
    });
  });

  // ── 2. confirmDetection with onConfirm returning false ───────────────

  describe('confirmDetection with low-confidence techs and onConfirm=false', () => {
    it('should filter out low-confidence technologies', async () => {
      const lowConfTech = makeTech({ id: 'flask', name: 'Flask', confidence: 60, category: 'framework' });
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([highConfTech, lowConfTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      const onConfirm = vi.fn().mockResolvedValue(false);
      const ctx = makeCtx({ onConfirm });

      await engine.init(ctx);

      // onConfirm should have been called with the low-confidence tech names
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith(
        'Se detectaron tecnologías con baja confianza. ¿Incluirlas?',
        ['Flask (60%)'],
      );

      // compose should have been called with only the high-confidence tech
      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      expect(composeArg.technologies).toHaveLength(1);
      expect(composeArg.technologies[0]!.id).toBe('python');
    });
  });

  // ── 3. confirmDetection with onConfirm returning true ────────────────

  describe('confirmDetection with low-confidence techs and onConfirm=true', () => {
    it('should keep all technologies when user confirms', async () => {
      const lowConfTech = makeTech({ id: 'flask', name: 'Flask', confidence: 70, category: 'framework' });
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([highConfTech, lowConfTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      const onConfirm = vi.fn().mockResolvedValue(true);
      const ctx = makeCtx({ onConfirm });

      await engine.init(ctx);

      expect(onConfirm).toHaveBeenCalledTimes(1);

      // All technologies should pass through to compose
      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      expect(composeArg.technologies).toHaveLength(2);
      expect(composeArg.technologies.map((t: DetectedTechnology) => t.id)).toContain('flask');
      expect(composeArg.technologies.map((t: DetectedTechnology) => t.id)).toContain('python');
    });
  });

  // ── 4. confirmDetection with no onConfirm → auto-filter ─────────────

  describe('confirmDetection with no onConfirm callback', () => {
    it('should auto-filter low-confidence technologies below threshold', async () => {
      const lowConfTech = makeTech({ id: 'flask', name: 'Flask', confidence: 50, category: 'framework' });
      const borderlineTech = makeTech({ id: 'django', name: 'Django', confidence: 89, category: 'framework' });
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 90, category: 'language' });
      const detection = makeDetection([highConfTech, borderlineTech, lowConfTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      // No onConfirm, no _preservedTechIds
      const ctx = makeCtx();

      await engine.init(ctx);

      // Only techs with confidence >= 90 should pass through
      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      expect(composeArg.technologies).toHaveLength(1);
      expect(composeArg.technologies[0]!.id).toBe('python');
      expect(composeArg.technologies[0]!.confidence).toBe(90);
    });
  });

  // ── 5. confirmDetection with _preservedTechIds ──────────────────────

  describe('confirmDetection with _preservedTechIds', () => {
    it('should preserve technologies that are in _preservedTechIds even below threshold', async () => {
      const lowConfPreserved = makeTech({ id: 'flask', name: 'Flask', confidence: 50, category: 'framework' });
      const lowConfNotPreserved = makeTech({ id: 'django', name: 'Django', confidence: 60, category: 'framework' });
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([highConfTech, lowConfPreserved, lowConfNotPreserved]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      // No onConfirm, but with _preservedTechIds
      const ctx = makeCtx({ _preservedTechIds: ['flask'] });

      await engine.init(ctx);

      // python (>=90) and flask (preserved) should pass, django should not
      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      expect(composeArg.technologies).toHaveLength(2);
      const ids = composeArg.technologies.map((t: DetectedTechnology) => t.id);
      expect(ids).toContain('python');
      expect(ids).toContain('flask');
      expect(ids).not.toContain('django');
    });

    it('should not invoke onConfirm when no low-confidence techs exist', async () => {
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([highConfTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      const onConfirm = vi.fn().mockResolvedValue(false);
      const ctx = makeCtx({ onConfirm });

      await engine.init(ctx);

      // No low-confidence techs, so onConfirm should never be called
      expect(onConfirm).not.toHaveBeenCalled();

      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      expect(composeArg.technologies).toHaveLength(1);
    });
  });

  // ── 6. fetchKnowledge skips in dryRun ────────────────────────────────

  describe('fetchKnowledge in dryRun mode', () => {
    it('should skip knowledge fetch entirely when dryRun is true', async () => {
      const tech = makeTech({ id: 'react', name: 'React', confidence: 95, category: 'framework' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const ctx = makeCtx({
        options: { output: 'rich', force: true, dryRun: true, targetDir: '/project' },
        onKnowledgePermission,
      });

      // Use initWithDetection to test fetchKnowledge directly
      await engine.initWithDetection(detection, ctx);

      // Knowledge should be skipped entirely in dryRun
      expect(onKnowledgePermission).not.toHaveBeenCalled();
      expect(mockInitCache).not.toHaveBeenCalled();
      expect(mockFetchBestPractices).not.toHaveBeenCalled();
    });
  });

  // ── 7. fetchKnowledge skips when no permission callback ──────────────

  describe('fetchKnowledge without onKnowledgePermission', () => {
    it('should skip knowledge fetch when onKnowledgePermission is not provided', async () => {
      const tech = makeTech({ id: 'react', name: 'React', confidence: 95, category: 'framework' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      // No onKnowledgePermission
      const ctx = makeCtx();

      await engine.initWithDetection(detection, ctx);

      expect(mockInitCache).not.toHaveBeenCalled();
      expect(mockFetchBestPractices).not.toHaveBeenCalled();
    });
  });

  // ── 8. fetchKnowledge skips non-language/non-framework techs ─────────

  describe('fetchKnowledge filters by category', () => {
    it('should skip techs that are not language or framework', async () => {
      const testingTech = makeTech({ id: 'jest', name: 'Jest', confidence: 95, category: 'testing' });
      const infraTech = makeTech({ id: 'docker', name: 'Docker', confidence: 95, category: 'infra' });
      const toolingTech = makeTech({ id: 'eslint', name: 'ESLint', confidence: 95, category: 'tooling' });
      const detection = makeDetection([testingTech, infraTech, toolingTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const ctx = makeCtx({ onKnowledgePermission });

      await engine.initWithDetection(detection, ctx);

      // None of these categories should trigger knowledge fetch
      expect(onKnowledgePermission).not.toHaveBeenCalled();
      expect(mockFetchBestPractices).not.toHaveBeenCalled();
    });

    it('should fetch knowledge only for language and framework techs', async () => {
      const langTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const fwTech = makeTech({ id: 'fastapi', name: 'FastAPI', confidence: 95, category: 'framework' });
      const testingTech = makeTech({ id: 'pytest', name: 'Pytest', confidence: 95, category: 'testing' });
      const detection = makeDetection([langTech, fwTech, testingTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockFetchBestPractices
        .mockResolvedValueOnce(makeKnowledgeResult('Python'))
        .mockResolvedValueOnce(makeKnowledgeResult('FastAPI'));

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const ctx = makeCtx({ onKnowledgePermission });

      await engine.initWithDetection(detection, ctx);

      // Only Python and FastAPI should be asked, not Pytest
      expect(onKnowledgePermission).toHaveBeenCalledTimes(2);
      expect(onKnowledgePermission).toHaveBeenCalledWith('Python');
      expect(onKnowledgePermission).toHaveBeenCalledWith('FastAPI');
      expect(mockFetchBestPractices).toHaveBeenCalledTimes(2);
    });
  });

  // ── 9. fetchKnowledge catches API errors and calls onWarning ─────────

  describe('fetchKnowledge error handling', () => {
    it('should catch API errors and call onWarning without aborting pipeline', async () => {
      const tech = makeTech({ id: 'react', name: 'React', confidence: 95, category: 'framework' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockFetchBestPractices.mockRejectedValue(new Error('API rate limit exceeded'));

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const onWarning = vi.fn();
      const ctx = makeCtx({ onKnowledgePermission, onWarning });

      // Should not throw
      const result = await engine.initWithDetection(detection, ctx);

      expect(onWarning).toHaveBeenCalledTimes(1);
      expect(onWarning).toHaveBeenCalledWith(
        '[diverger] Warning: knowledge fetch failed for React: API rate limit exceeded',
      );
      // Pipeline should still complete
      expect(result).toBe(genResult);
    });

    it('should handle non-Error thrown values', async () => {
      const tech = makeTech({ id: 'vue', name: 'Vue', confidence: 95, category: 'framework' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockFetchBestPractices.mockRejectedValue('string error');

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const onWarning = vi.fn();
      const ctx = makeCtx({ onKnowledgePermission, onWarning });

      await engine.initWithDetection(detection, ctx);

      expect(onWarning).toHaveBeenCalledWith(
        '[diverger] Warning: knowledge fetch failed for Vue: string error',
      );
    });

    it('should not call onWarning if onWarning is not provided', async () => {
      const tech = makeTech({ id: 'react', name: 'React', confidence: 95, category: 'framework' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockFetchBestPractices.mockRejectedValue(new Error('Network error'));

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      // No onWarning provided
      const ctx = makeCtx({ onKnowledgePermission });

      // Should not throw even without onWarning
      const result = await engine.initWithDetection(detection, ctx);
      expect(result).toBe(genResult);
    });

    it('should continue fetching remaining techs after one fails', async () => {
      const tech1 = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const tech2 = makeTech({ id: 'fastapi', name: 'FastAPI', confidence: 95, category: 'framework' });
      const detection = makeDetection([tech1, tech2]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      // First fetch fails, second succeeds
      mockFetchBestPractices
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce(makeKnowledgeResult('FastAPI'));

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const onWarning = vi.fn();
      const ctx = makeCtx({ onKnowledgePermission, onWarning });

      await engine.initWithDetection(detection, ctx);

      // Both should have been attempted
      expect(mockFetchBestPractices).toHaveBeenCalledTimes(2);
      // Warning only for first
      expect(onWarning).toHaveBeenCalledTimes(1);
      expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('Python'));
    });
  });

  // ── 10. fetchKnowledge adds knowledge sections to composed config ────

  describe('fetchKnowledge injects knowledge into composed config', () => {
    it('should add knowledge results and CLAUDE.md sections when knowledge is fetched', async () => {
      const langTech = makeTech({ id: 'typescript', name: 'TypeScript', confidence: 95, category: 'language' });
      const fwTech = makeTech({ id: 'nextjs', name: 'Next.js', confidence: 95, category: 'framework' });
      const detection = makeDetection([langTech, fwTech]);
      const composed = makeComposedConfig({
        claudeMdSections: [{ heading: 'Existing', content: '## Existing\nContent', order: 10 }],
      });

      const tsKnowledge = makeKnowledgeResult('TypeScript');
      const nextKnowledge = makeKnowledgeResult('Next.js');

      mockCompose.mockReturnValue(composed);
      mockFetchBestPractices
        .mockResolvedValueOnce(tsKnowledge)
        .mockResolvedValueOnce(nextKnowledge);

      // Capture what generate receives
      mockGenerate.mockImplementation((config: ComposedConfig) => {
        return {
          files: [],
          detection,
          config,
        };
      });

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const ctx = makeCtx({ onKnowledgePermission });

      const result = await engine.initWithDetection(detection, ctx);

      // Knowledge should be attached to the config
      expect(result.config.knowledge).toHaveLength(2);
      expect(result.config.knowledge![0]!.technology).toBe('TypeScript');
      expect(result.config.knowledge![1]!.technology).toBe('Next.js');

      // CLAUDE.md sections should include knowledge sections
      const knowledgeSections = result.config.claudeMdSections.filter(
        (s) => s.heading.startsWith('Best Practices:'),
      );
      expect(knowledgeSections).toHaveLength(2);
      expect(knowledgeSections[0]!.heading).toBe('Best Practices: TypeScript');
      expect(knowledgeSections[0]!.content).toContain('Best practices for TypeScript');
      expect(knowledgeSections[0]!.order).toBe(50);
      expect(knowledgeSections[1]!.heading).toBe('Best Practices: Next.js');

      // Original section should still exist
      expect(result.config.claudeMdSections[0]!.heading).toBe('Existing');
    });

    it('should not add knowledge sections when no results are returned', async () => {
      const tech = makeTech({ id: 'react', name: 'React', confidence: 95, category: 'framework' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig({
        claudeMdSections: [{ heading: 'Original', content: '## Original', order: 10 }],
      });

      mockCompose.mockReturnValue(composed);
      // User denies permission
      const onKnowledgePermission = vi.fn().mockResolvedValue(false);

      mockGenerate.mockImplementation((config: ComposedConfig) => ({
        files: [],
        detection,
        config,
      }));

      const ctx = makeCtx({ onKnowledgePermission });
      const result = await engine.initWithDetection(detection, ctx);

      // No knowledge attached
      expect(result.config.knowledge).toBeUndefined();
      // Only original section
      expect(result.config.claudeMdSections).toHaveLength(1);
      expect(result.config.claudeMdSections[0]!.heading).toBe('Original');
    });
  });

  // ── 11. initWithDetection chains compose → generate ──────────────────

  describe('initWithDetection pipeline', () => {
    it('should call compose with detection then generate with composed config', async () => {
      const tech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig({ appliedProfiles: ['base/universal', 'languages/python'] });
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);

      const ctx = makeCtx();
      const result = await engine.initWithDetection(detection, ctx);

      // compose should receive the detection result
      expect(mockCompose).toHaveBeenCalledTimes(1);
      expect(mockCompose).toHaveBeenCalledWith(detection);

      // generate should receive the composed config, project root, and detection
      expect(mockGenerate).toHaveBeenCalledTimes(1);
      expect(mockGenerate).toHaveBeenCalledWith(composed, '/project', detection);

      expect(result).toBe(genResult);
    });

    it('should call initCache when onKnowledgePermission is provided and not dryRun', async () => {
      const tech = makeTech({ id: 'go', name: 'Go', confidence: 95, category: 'language' });
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);

      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockFetchBestPractices.mockResolvedValue(makeKnowledgeResult('Go'));

      const onKnowledgePermission = vi.fn().mockResolvedValue(true);
      const ctx = makeCtx({ onKnowledgePermission });

      await engine.initWithDetection(detection, ctx);

      expect(mockInitCache).toHaveBeenCalledTimes(1);
      expect(mockInitCache).toHaveBeenCalledWith('/project');
    });
  });

  // ── 12. sync loads old meta and preserves tech IDs ───────────────────

  describe('sync', () => {
    it('should load old meta and pass _preservedTechIds from detectedStack', async () => {
      const oldMeta = {
        version: '0.1.0',
        generatedAt: new Date().toISOString(),
        detectedStack: ['flask', 'python'],
        appliedProfiles: ['languages/python', 'frameworks/flask'],
        fileHashes: {},
        ruleGovernance: {},
        fileContents: {},
        trackedDependencies: [],
      };

      mockLoadMeta.mockResolvedValue(oldMeta);

      const lowConfTech = makeTech({ id: 'flask', name: 'Flask', confidence: 50, category: 'framework' });
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([highConfTech, lowConfTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);
      const mergeResult: MergeAllResult = {
        results: [{ path: '/project/.claude/CLAUDE.md', outcome: 'auto-apply', content: '# Config' }],
        pendingMeta: oldMeta,
        oldMeta,
      };

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockMergeAll.mockResolvedValue(mergeResult);

      const ctx = makeCtx();
      const result = await engine.sync(ctx);

      // loadMeta should have been called with the project root
      expect(mockLoadMeta).toHaveBeenCalledWith('/project');

      // flask should be preserved because it's in oldMeta.detectedStack
      // even though confidence is below 90
      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      const ids = composeArg.technologies.map((t: DetectedTechnology) => t.id);
      expect(ids).toContain('flask');
      expect(ids).toContain('python');

      // mergeAll should be called with the generation result and project root
      expect(mockMergeAll).toHaveBeenCalledWith(genResult, '/project');
      expect(result).toBe(mergeResult);
    });

    it('should proceed without _preservedTechIds when no old meta exists', async () => {
      mockLoadMeta.mockResolvedValue(null);

      const lowConfTech = makeTech({ id: 'flask', name: 'Flask', confidence: 50, category: 'framework' });
      const highConfTech = makeTech({ id: 'python', name: 'Python', confidence: 95, category: 'language' });
      const detection = makeDetection([highConfTech, lowConfTech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);
      const mergeResult: MergeAllResult = {
        results: [],
        pendingMeta: {
          version: '0.1.0',
          generatedAt: new Date().toISOString(),
          detectedStack: [],
          appliedProfiles: [],
          fileHashes: {},
          ruleGovernance: {},
          fileContents: {},
          trackedDependencies: [],
        },
        oldMeta: null,
      };

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockMergeAll.mockResolvedValue(mergeResult);

      const ctx = makeCtx();
      await engine.sync(ctx);

      // Without old meta, flask (low conf) should be filtered out (no onConfirm, no _preservedTechIds)
      const composeArg = mockCompose.mock.calls[0]![0] as DetectionResult;
      expect(composeArg.technologies).toHaveLength(1);
      expect(composeArg.technologies[0]!.id).toBe('python');
    });
  });

  // ── diff delegates to init(dryRun) + computeDiff ─────────────────────

  describe('diff', () => {
    it('should call init with dryRun=true and then computeDiff', async () => {
      const tech = makeTech();
      const detection = makeDetection([tech]);
      const composed = makeComposedConfig();
      const genResult = makeGenerationResult(detection, composed);
      const diffEntries: DiffEntry[] = [
        { path: '/project/.claude/CLAUDE.md', type: 'create', diff: '+ # Config' },
      ];

      mockDetect.mockResolvedValue(detection);
      mockCompose.mockReturnValue(composed);
      mockGenerate.mockResolvedValue(genResult);
      mockComputeDiff.mockResolvedValue(diffEntries);

      const ctx = makeCtx({ options: { output: 'rich', force: false, dryRun: false, targetDir: '/project' } });
      const result = await engine.diff(ctx);

      // computeDiff should be called with the generation result and project root
      expect(mockComputeDiff).toHaveBeenCalledWith(genResult, '/project');
      expect(result).toBe(diffEntries);
    });
  });

  // ── detect delegates to detection engine ─────────────────────────────

  describe('detect', () => {
    it('should delegate to DetectionEngine.detect with projectRoot and onWarning', async () => {
      const detection = makeDetection([]);
      mockDetect.mockResolvedValue(detection);

      const onWarning = vi.fn();
      const ctx = makeCtx({ onWarning });
      const result = await engine.detect(ctx);

      expect(mockDetect).toHaveBeenCalledWith('/project', { onWarning });
      expect(result).toBe(detection);
    });
  });
});
