import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerGenerateConfigTool } from '../../../src/mcp/tools/generate-config.js';

// Mock the engine
vi.mock('../../../src/core/engine.js', () => ({
  DivergerEngine: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
    computeDiff: vi.fn(),
    writeFiles: vi.fn(),
  })),
}));

vi.mock('../../../src/utils/fs.js', () => ({
  fileExists: vi.fn(),
}));

vi.mock('../../../src/governance/history.js', () => ({
  createMeta: vi.fn().mockReturnValue({ version: '0.5.0', fileHashes: {} }),
  saveMeta: vi.fn(),
}));

vi.mock('../../../src/governance/index.js', () => ({
  extractTrackedDeps: vi.fn().mockReturnValue([]),
}));

vi.mock('../../../src/utils/paths.js', () => ({
  toRelativeMetaKey: vi.fn((p: string) => p),
}));

import { DivergerEngine } from '../../../src/core/engine.js';
import { fileExists } from '../../../src/utils/fs.js';
import { saveMeta } from '../../../src/governance/history.js';

type ToolHandler = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>;

function createMockServer() {
  const tools: Map<string, ToolHandler> = new Map();
  return {
    tool: vi.fn((name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
      tools.set(name, handler);
    }),
    getHandler: (name: string) => tools.get(name),
  };
}

const mockResult = {
  files: [{ path: '/project/CLAUDE.md', content: '# test', governance: undefined }],
  detection: {
    technologies: [{ id: 'typescript', name: 'TypeScript', category: 'language', confidence: 100, evidence: [] }],
    rootDir: '/project',
    detectedAt: '2026-01-01T00:00:00Z',
  },
  config: { appliedProfiles: ['base/universal', 'languages/typescript'] },
};

describe('generate_config MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    registerGenerateConfigTool(mockServer as never);
  });

  it('returns error for non-existent directory', async () => {
    vi.mocked(fileExists).mockResolvedValue(false);
    const handler = mockServer.getHandler('generate_config')!;
    const result = await handler({ projectDir: '/nonexistent', pluginMode: true, dryRun: false });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('DIRECTORY_NOT_FOUND');
  });

  it('dry-run returns diffs without writing', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockInit = vi.fn().mockResolvedValue(mockResult);
    const mockComputeDiff = vi.fn().mockResolvedValue([{ path: 'CLAUDE.md', type: 'create' }]);
    vi.mocked(DivergerEngine).mockImplementation(() => ({
      init: mockInit,
      computeDiff: mockComputeDiff,
      writeFiles: vi.fn(),
    }) as never);

    const handler = mockServer.getHandler('generate_config')!;
    const result = await handler({ projectDir: '/project', pluginMode: true, dryRun: true });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dryRun).toBe(true);
    expect(parsed.diffs).toHaveLength(1);
    expect(parsed.appliedProfiles).toEqual(['base/universal', 'languages/typescript']);
  });

  it('successful generation writes files and saves meta', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockWriteFiles = vi.fn().mockResolvedValue([{ path: '/project/CLAUDE.md', action: 'created' }]);
    vi.mocked(DivergerEngine).mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(mockResult),
      computeDiff: vi.fn(),
      writeFiles: mockWriteFiles,
    }) as never);

    const handler = mockServer.getHandler('generate_config')!;
    const result = await handler({ projectDir: '/project', pluginMode: true, dryRun: false });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.filesGenerated).toHaveLength(1);
    expect(parsed.filesGenerated[0].action).toBe('created');
    expect(vi.mocked(saveMeta)).toHaveBeenCalled();
  });

  it('pluginMode defaults to true when explicitly provided', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockInit = vi.fn().mockResolvedValue(mockResult);
    vi.mocked(DivergerEngine).mockImplementation(() => ({
      init: mockInit,
      computeDiff: vi.fn(),
      writeFiles: vi.fn().mockResolvedValue([]),
    }) as never);

    // In production, Zod parses and applies default(true).
    // Our mock server bypasses Zod, so we pass pluginMode explicitly.
    const handler = mockServer.getHandler('generate_config')!;
    await handler({ projectDir: '/project', pluginMode: true, dryRun: false });
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ pluginMode: true }),
      }),
    );
  });

  it('catches errors and returns structured error', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(DivergerEngine).mockImplementation(() => ({
      init: vi.fn().mockRejectedValue(new Error('Generation failed')),
      computeDiff: vi.fn(),
      writeFiles: vi.fn(),
    }) as never);

    const handler = mockServer.getHandler('generate_config')!;
    const result = await handler({ projectDir: '/project', pluginMode: true, dryRun: false });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('GENERATION_ERROR');
    expect(parsed.message).toBe('Generation failed');
  });
});
