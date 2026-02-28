import { describe, it, expect } from 'vitest';
import { generateMcp } from '../../../src/generation/generators/mcp.js';
import type { ComposedConfig } from '../../../src/core/types.js';

function makeConfig(overrides: Partial<ComposedConfig> = {}): ComposedConfig {
  return {
    claudeMdSections: [],
    settings: { permissions: {} },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
    mcp: [],
    externalTools: [],
    appliedProfiles: [],
    ...overrides,
  };
}

describe('generateMcp', () => {
  it('should return null when no MCP servers defined', () => {
    const config = makeConfig();
    const result = generateMcp(config, '/project');
    expect(result).toBeNull();
  });

  it('should generate .mcp.json at project root', () => {
    const config = makeConfig({
      mcp: [
        { name: 'test-server', command: 'node', args: ['server.js'] },
      ],
    });
    const result = generateMcp(config, '/project');

    expect(result).not.toBeNull();
    expect(result!.path).toContain('.mcp.json');
  });

  it('should include server with command and args', () => {
    const config = makeConfig({
      mcp: [
        { name: 'my-server', command: 'npx', args: ['-y', 'my-mcp-server'] },
      ],
    });
    const result = generateMcp(config, '/project');
    const parsed = JSON.parse(result!.content);

    expect(parsed.mcpServers['my-server']).toBeDefined();
    expect(parsed.mcpServers['my-server'].command).toBe('npx');
    expect(parsed.mcpServers['my-server'].args).toEqual(['-y', 'my-mcp-server']);
  });

  it('should include env when specified', () => {
    const config = makeConfig({
      mcp: [
        { name: 'api-server', command: 'node', env: { API_KEY: '${ANTHROPIC_API_KEY}' } },
      ],
    });
    const result = generateMcp(config, '/project');
    const parsed = JSON.parse(result!.content);

    expect(parsed.mcpServers['api-server'].env).toEqual({ API_KEY: '${ANTHROPIC_API_KEY}' });
  });

  it('should omit args and env when not specified', () => {
    const config = makeConfig({
      mcp: [
        { name: 'simple-server', command: 'my-server' },
      ],
    });
    const result = generateMcp(config, '/project');
    const parsed = JSON.parse(result!.content);

    expect(parsed.mcpServers['simple-server'].command).toBe('my-server');
    expect(parsed.mcpServers['simple-server'].args).toBeUndefined();
    expect(parsed.mcpServers['simple-server'].env).toBeUndefined();
  });

  it('should handle multiple servers', () => {
    const config = makeConfig({
      mcp: [
        { name: 'server-a', command: 'node', args: ['a.js'] },
        { name: 'server-b', command: 'python', args: ['b.py'] },
      ],
    });
    const result = generateMcp(config, '/project');
    const parsed = JSON.parse(result!.content);

    expect(Object.keys(parsed.mcpServers)).toHaveLength(2);
    expect(parsed.mcpServers['server-a'].command).toBe('node');
    expect(parsed.mcpServers['server-b'].command).toBe('python');
  });

  it('should produce valid JSON with trailing newline', () => {
    const config = makeConfig({
      mcp: [{ name: 'test', command: 'test' }],
    });
    const result = generateMcp(config, '/project');

    expect(result!.content.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(result!.content)).not.toThrow();
  });
});
