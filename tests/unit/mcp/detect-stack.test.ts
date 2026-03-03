import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerDetectStackTool } from '../../../src/mcp/tools/detect-stack.js';

// Mock the engine
vi.mock('../../../src/core/engine.js', () => ({
  DivergerEngine: vi.fn().mockImplementation(() => ({
    detect: vi.fn(),
  })),
}));

// Mock fileExists
vi.mock('../../../src/utils/fs.js', () => ({
  fileExists: vi.fn(),
}));

import { DivergerEngine } from '../../../src/core/engine.js';
import { fileExists } from '../../../src/utils/fs.js';

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

describe('detect_stack MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    registerDetectStackTool(mockServer as never);
  });

  it('registers the detect_stack tool', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'detect_stack',
      expect.any(String),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it('returns error for non-existent directory', async () => {
    vi.mocked(fileExists).mockResolvedValue(false);
    const handler = mockServer.getHandler('detect_stack')!;
    const result = await handler({ projectDir: '/nonexistent' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('DIRECTORY_NOT_FOUND');
  });

  it('returns detected technologies stripped of evidence/profileIds', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockDetect = vi.fn().mockResolvedValue({
      technologies: [{
        id: 'typescript',
        name: 'TypeScript',
        category: 'language',
        version: '5.7.3',
        confidence: 100,
        evidence: [{ source: 'package.json', type: 'manifest', description: 'Found', weight: 100 }],
        profileIds: ['languages/typescript'],
      }],
      rootDir: '/project',
      detectedAt: '2026-01-01T00:00:00Z',
    });
    vi.mocked(DivergerEngine).mockImplementation(() => ({ detect: mockDetect }) as never);

    const handler = mockServer.getHandler('detect_stack')!;
    const result = await handler({ projectDir: '/project' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.technologies).toHaveLength(1);
    expect(parsed.technologies[0]).toEqual({
      id: 'typescript',
      name: 'TypeScript',
      category: 'language',
      version: '5.7.3',
      confidence: 100,
    });
    // No evidence or profileIds in output
    expect(parsed.technologies[0].evidence).toBeUndefined();
    expect(parsed.technologies[0].profileIds).toBeUndefined();
  });

  it('includes monorepo info when detected', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockDetect = vi.fn().mockResolvedValue({
      technologies: [],
      monorepo: { type: 'npm-workspaces', rootDir: '/project', packages: [] },
      rootDir: '/project',
      detectedAt: '2026-01-01T00:00:00Z',
    });
    vi.mocked(DivergerEngine).mockImplementation(() => ({ detect: mockDetect }) as never);

    const handler = mockServer.getHandler('detect_stack')!;
    const result = await handler({ projectDir: '/project' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.monorepo).toEqual({ type: 'npm-workspaces', rootDir: '/project', packages: [] });
  });

  it('catches engine errors and returns structured error', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockDetect = vi.fn().mockRejectedValue(new Error('Scan failed'));
    vi.mocked(DivergerEngine).mockImplementation(() => ({ detect: mockDetect }) as never);

    const handler = mockServer.getHandler('detect_stack')!;
    const result = await handler({ projectDir: '/project' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('DETECTION_ERROR');
    expect(parsed.message).toBe('Scan failed');
  });
});
