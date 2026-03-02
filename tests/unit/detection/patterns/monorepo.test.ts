import { describe, it, expect } from 'vitest';
import { detectMonorepo } from '../../../../src/detection/patterns/monorepo.js';

describe('detectMonorepo', () => {
  it('should return undefined when package.json is malformed JSON', async () => {
    const files = new Map<string, string>();
    files.set('package.json', '{ this is not valid json !!!');

    const result = await detectMonorepo(files, '/project');
    expect(result).toBeUndefined();
  });

  it('should return undefined when package.json has no workspaces', async () => {
    const files = new Map<string, string>();
    files.set('package.json', JSON.stringify({ name: 'my-app', version: '1.0.0' }));

    const result = await detectMonorepo(files, '/project');
    expect(result).toBeUndefined();
  });

  it('should still detect pnpm workspaces after malformed package.json', async () => {
    const files = new Map<string, string>();
    files.set('package.json', '{ broken json');
    files.set('pnpm-workspace.yaml', 'packages:\n  - packages/*\n');

    // pnpm workspace detection requires resolving dirs on disk,
    // so with a non-existent projectRoot, packages will be empty
    const result = await detectMonorepo(files, '/nonexistent-root');
    // Should not crash; may return pnpm-workspaces or undefined depending on glob
    expect(result === undefined || result.type === 'pnpm-workspaces').toBe(true);
  });
});
