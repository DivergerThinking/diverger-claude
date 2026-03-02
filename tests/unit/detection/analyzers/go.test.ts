import { describe, it, expect } from 'vitest';
import { GoAnalyzer } from '../../../../src/detection/analyzers/go.js';

const GO_MOD_BASIC = `module github.com/myapp

go 1.22

require (
	github.com/gin-gonic/gin v1.9.1
)
`;

const GO_MOD_MULTI = `module github.com/myapp

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/labstack/echo/v4 v4.11.4
	github.com/gofiber/fiber/v2 v2.52.0
	github.com/gorilla/mux v1.8.1
)
`;

const GO_MOD_BARE = `module github.com/mylib

go 1.20
`;

describe('GoAnalyzer', () => {
  const analyzer = new GoAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('go');
    expect(analyzer.name).toBe('Go');
    expect(analyzer.filePatterns).toContain('go.mod');
  });

  it('should return empty result when go.mod is missing', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect Go from bare go.mod', async () => {
    const files = new Map<string, string>();
    files.set('go.mod', GO_MOD_BARE);
    const result = await analyzer.analyze(files, '/project');

    const go = result.technologies.find((t) => t.id === 'go');
    expect(go).toBeDefined();
    expect(go!.name).toBe('Go');
    expect(go!.category).toBe('language');
    expect(go!.confidence).toBe(95);
    expect(go!.version).toBe('1.20');
    expect(go!.profileIds).toContain('languages/go');
    expect(result.analyzedFiles).toContain('go.mod');
  });

  it('should extract Go version from go directive', async () => {
    const files = new Map<string, string>();
    files.set('go.mod', GO_MOD_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const go = result.technologies.find((t) => t.id === 'go');
    expect(go!.version).toBe('1.22');
    expect(go!.majorVersion).toBe(1);
  });

  it('should detect Gin framework', async () => {
    const files = new Map<string, string>();
    files.set('go.mod', GO_MOD_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const gin = result.technologies.find((t) => t.id === 'gin');
    expect(gin).toBeDefined();
    expect(gin!.name).toBe('Gin');
    expect(gin!.category).toBe('framework');
    expect(gin!.confidence).toBe(90);
    expect(gin!.parentId).toBe('go');
  });

  it('should detect multiple frameworks', async () => {
    const files = new Map<string, string>();
    files.set('go.mod', GO_MOD_MULTI);
    const result = await analyzer.analyze(files, '/project');

    const ids = result.technologies.map((t) => t.id);
    expect(ids).toContain('go');
    expect(ids).toContain('gin');
    expect(ids).toContain('echo');
    expect(ids).toContain('fiber');
    expect(ids).toContain('gorilla-mux');
  });

  it('should not detect frameworks when go.mod has no deps', async () => {
    const files = new Map<string, string>();
    files.set('go.mod', GO_MOD_BARE);
    const result = await analyzer.analyze(files, '/project');

    // Only Go itself
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0]!.id).toBe('go');
  });

  it('should include proper evidence', async () => {
    const files = new Map<string, string>();
    files.set('go.mod', GO_MOD_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const gin = result.technologies.find((t) => t.id === 'gin');
    expect(gin!.evidence).toHaveLength(1);
    expect(gin!.evidence[0]!.source).toBe('go.mod');
    expect(gin!.evidence[0]!.type).toBe('manifest');
    expect(gin!.evidence[0]!.description).toContain('github.com/gin-gonic/gin');
  });

  it('should handle go.mod without version', async () => {
    const files = new Map<string, string>();
    files.set('go.mod', 'module github.com/myapp\n');
    const result = await analyzer.analyze(files, '/project');

    const go = result.technologies.find((t) => t.id === 'go');
    expect(go).toBeDefined();
    expect(go!.version).toBeUndefined();
    expect(go!.majorVersion).toBeUndefined();
  });

  it('should NOT detect gin from commented-out dependency', async () => {
    const goMod = `module github.com/myapp

go 1.22

// github.com/gin-gonic/gin was removed in favor of echo
require (
	github.com/labstack/echo/v4 v4.11.4
)
`;
    const files = new Map<string, string>();
    files.set('go.mod', goMod);
    const result = await analyzer.analyze(files, '/project');

    const gin = result.technologies.find((t) => t.id === 'gin');
    expect(gin).toBeUndefined();
    const echo = result.technologies.find((t) => t.id === 'echo');
    expect(echo).toBeDefined();
  });

  it('should NOT detect gin from replace directive', async () => {
    const goMod = `module github.com/myapp

go 1.22

replace (
	github.com/gin-gonic/gin => ./local-gin
)

require (
	github.com/labstack/echo/v4 v4.11.4
)
`;
    const files = new Map<string, string>();
    files.set('go.mod', goMod);
    const result = await analyzer.analyze(files, '/project');

    const gin = result.technologies.find((t) => t.id === 'gin');
    expect(gin).toBeUndefined();
    const echo = result.technologies.find((t) => t.id === 'echo');
    expect(echo).toBeDefined();
  });

  it('should detect gin from single-line require', async () => {
    const goMod = `module github.com/myapp

go 1.22

require github.com/gin-gonic/gin v1.9.1
`;
    const files = new Map<string, string>();
    files.set('go.mod', goMod);
    const result = await analyzer.analyze(files, '/project');

    const gin = result.technologies.find((t) => t.id === 'gin');
    expect(gin).toBeDefined();
  });

  // ── Subdirectory detection ──────────────────────────────────────────

  describe('subdirectory detection', () => {
    it('should detect Go from go.mod in subdirectory', async () => {
      const files = new Map<string, string>();
      files.set('backend/go.mod', GO_MOD_BASIC);
      const result = await analyzer.analyze(files, '/project');

      const go = result.technologies.find((t) => t.id === 'go');
      expect(go).toBeDefined();
      expect(go!.evidence[0]!.source).toBe('backend/go.mod');
      expect(result.analyzedFiles).toContain('backend/go.mod');
    });

    it('should detect Gin from go.mod in subdirectory', async () => {
      const files = new Map<string, string>();
      files.set('api/go.mod', GO_MOD_BASIC);
      const result = await analyzer.analyze(files, '/project');

      const gin = result.technologies.find((t) => t.id === 'gin');
      expect(gin).toBeDefined();
      expect(gin!.evidence[0]!.source).toBe('api/go.mod');
    });

    it('should extract version from subdirectory go.mod', async () => {
      const files = new Map<string, string>();
      files.set('services/api/go.mod', GO_MOD_BASIC);
      const result = await analyzer.analyze(files, '/project');

      const go = result.technologies.find((t) => t.id === 'go');
      expect(go!.version).toBe('1.22');
    });
  });
});
