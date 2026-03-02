import { describe, it, expect, vi } from 'vitest';
import { generateExternalTools } from '../../../src/generation/generators/external-tools.js';
import type { ComposedConfig, ExternalToolConfig } from '../../../src/core/types.js';

// Mock the fs utility
vi.mock('../../../src/utils/fs.js', () => ({
  readFileOrNull: vi.fn(),
  readJsonOrNull: vi.fn(),
  assertPathWithin: vi.fn(),
}));

import { readFileOrNull } from '../../../src/utils/fs.js';
const mockReadFileOrNull = vi.mocked(readFileOrNull);

function makeConfig(externalTools: ExternalToolConfig[]): ComposedConfig {
  return {
    claudeMdSections: [],
    settings: { permissions: {} },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
    mcp: [],
    externalTools,
    appliedProfiles: [],
  };
}

describe('generateExternalTools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should not overwrite existing YAML file with create-only strategy', async () => {
    // Existing file is YAML (not valid JSON) — readFileOrNull returns content
    mockReadFileOrNull.mockResolvedValue('key: value\nother: true');

    const tools: ExternalToolConfig[] = [{
      type: 'eslint',
      filePath: '.eslintrc.yml',
      config: { extends: ['recommended'] },
      mergeStrategy: 'create-only',
    }];

    const result = await generateExternalTools(makeConfig(tools), '/project');
    expect(result).toHaveLength(0);
  });

  it('should create file when it does not exist with create-only strategy', async () => {
    mockReadFileOrNull.mockResolvedValue(null);

    const tools: ExternalToolConfig[] = [{
      type: 'prettier',
      filePath: '.prettierrc.json',
      config: { semi: true },
      mergeStrategy: 'create-only',
    }];

    const result = await generateExternalTools(makeConfig(tools), '/project');
    expect(result).toHaveLength(1);
    expect(result[0]!.content).toContain('"semi": true');
  });

  it('should skip non-JSON file with align strategy', async () => {
    // Existing file is YAML (not valid JSON)
    mockReadFileOrNull.mockResolvedValue('extends:\n  - recommended\n');

    const tools: ExternalToolConfig[] = [{
      type: 'eslint',
      filePath: '.eslintrc.yml',
      config: { extends: ['recommended'] },
      mergeStrategy: 'align',
    }];

    const result = await generateExternalTools(makeConfig(tools), '/project');
    expect(result).toHaveLength(0);
  });

  it('should merge valid JSON with align strategy', async () => {
    mockReadFileOrNull.mockResolvedValue(JSON.stringify({ semi: false, tabWidth: 4 }));

    const tools: ExternalToolConfig[] = [{
      type: 'prettier',
      filePath: '.prettierrc.json',
      config: { semi: true, singleQuote: true },
      mergeStrategy: 'align',
    }];

    const result = await generateExternalTools(makeConfig(tools), '/project');
    expect(result).toHaveLength(1);
    const parsed = JSON.parse(result[0]!.content);
    // Existing values win over tool defaults
    expect(parsed.semi).toBe(false);
    expect(parsed.tabWidth).toBe(4);
    // Tool default added
    expect(parsed.singleQuote).toBe(true);
  });

  it('should create file when it does not exist with align strategy', async () => {
    mockReadFileOrNull.mockResolvedValue(null);

    const tools: ExternalToolConfig[] = [{
      type: 'prettier',
      filePath: '.prettierrc.json',
      config: { semi: true },
      mergeStrategy: 'align',
    }];

    const result = await generateExternalTools(makeConfig(tools), '/project');
    expect(result).toHaveLength(1);
  });
});
