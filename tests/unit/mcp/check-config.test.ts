import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCheckConfigTool } from '../../../src/mcp/tools/check-config.js';

vi.mock('../../../src/core/engine.js', () => ({
  DivergerEngine: vi.fn().mockImplementation(() => ({
    check: vi.fn(),
  })),
}));

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

describe('check_config MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    registerCheckConfigTool(mockServer as never);
  });

  it('returns error for non-existent directory', async () => {
    vi.mocked(fileExists).mockResolvedValue(false);
    const handler = mockServer.getHandler('check_config')!;
    const result = await handler({ projectDir: '/nonexistent' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('DIRECTORY_NOT_FOUND');
  });

  it('returns valid=true for healthy config', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockCheck = vi.fn().mockResolvedValue({ valid: true, issues: [] });
    vi.mocked(DivergerEngine).mockImplementation(() => ({ check: mockCheck }) as never);

    const handler = mockServer.getHandler('check_config')!;
    const result = await handler({ projectDir: '/project' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.issues).toHaveLength(0);
  });

  it('returns issues for invalid config', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockCheck = vi.fn().mockResolvedValue({
      valid: false,
      issues: [{ severity: 'error', file: 'CLAUDE.md', message: 'Missing' }],
    });
    vi.mocked(DivergerEngine).mockImplementation(() => ({ check: mockCheck }) as never);

    const handler = mockServer.getHandler('check_config')!;
    const result = await handler({ projectDir: '/project' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.issues).toHaveLength(1);
    expect(parsed.issues[0].severity).toBe('error');
  });

  it('catches errors and returns structured error', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(DivergerEngine).mockImplementation(() => ({
      check: vi.fn().mockRejectedValue(new Error('Validation crashed')),
    }) as never);

    const handler = mockServer.getHandler('check_config')!;
    const result = await handler({ projectDir: '/project' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('VALIDATION_ERROR');
  });
});
