/**
 * Integration tests for v0.5.0 output quality requirements.
 * Verifies the full TS+React+Jest pipeline produces correct output structure.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import { DivergerEngine } from '../../src/core/engine.js';
import type { EngineContext } from '../../src/core/engine.js';
import type { GeneratedFile } from '../../src/core/types.js';

let tempDir: string;
let files: GeneratedFile[];

function makeCtx(projectRoot: string): EngineContext {
  return {
    projectRoot,
    options: { output: 'quiet', force: true, dryRun: false, targetDir: projectRoot },
  };
}

describe('v0.5.0 Output Quality', () => {
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-quality-'));

    // Create a TS + React + Jest project
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify(
        {
          name: 'quality-test-app',
          dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
          devDependencies: {
            typescript: '^5.3.0',
            jest: '^29.7.0',
            '@types/react': '^18.2.0',
          },
        },
        null,
        2,
      ),
    );
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), '{}');

    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);
    files = result.files;

    await engine.writeFiles(files, tempDir, { force: true });
  }, 30_000);

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  // ── Hook Scripts ──────────────────────────────────────────────────────────

  it('should generate .claude/hooks/*.sh files', () => {
    const hookScripts = files.filter((f) => f.path.includes(path.join('.claude', 'hooks')));
    expect(hookScripts.length).toBeGreaterThan(0);

    // All hook scripts must have .sh extension
    for (const script of hookScripts) {
      expect(script.path).toMatch(/\.sh$/);
    }
  });

  it('should generate hook scripts with proper shebang', () => {
    const hookScripts = files.filter(
      (f) => f.path.includes(path.join('.claude', 'hooks')) && f.path.endsWith('.sh'),
    );

    for (const script of hookScripts) {
      expect(script.content).toMatch(/^#!/);
    }
  });

  it('should NOT contain HOOK_EXIT in any generated file', () => {
    for (const file of files) {
      expect(file.content).not.toContain('HOOK_EXIT');
    }
  });

  it('should NOT contain $CLAUDE_FILE_PATH in any generated file', () => {
    for (const file of files) {
      expect(file.content).not.toContain('$CLAUDE_FILE_PATH');
      expect(file.content).not.toContain('$CLAUDE_TOOL_INPUT');
    }
  });

  // ── Settings.json + Hooks ─────────────────────────────────────────────────

  it('should generate valid settings.json with hooks', async () => {
    const settingsPath = path.join(tempDir, '.claude', 'settings.json');
    const raw = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(raw);

    // Should have hooks section
    expect(settings.hooks).toBeDefined();

    // Should have PreToolUse hooks (secret scanner, destructive cmd blocker)
    expect(settings.hooks.PreToolUse).toBeDefined();
    expect(settings.hooks.PreToolUse.length).toBeGreaterThan(0);

    // Should have PostToolUse hooks
    expect(settings.hooks.PostToolUse).toBeDefined();
    expect(settings.hooks.PostToolUse.length).toBeGreaterThan(0);
  });

  it('should include statusMessage in hooks', async () => {
    const settingsPath = path.join(tempDir, '.claude', 'settings.json');
    const raw = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(raw);

    // At least some hooks should have statusMessage
    const allHookEntries = [
      ...(settings.hooks.PreToolUse ?? []),
      ...(settings.hooks.PostToolUse ?? []),
    ];

    const withStatusMessage = allHookEntries.filter((entry: { hooks: Array<{ statusMessage?: string }> }) =>
      entry.hooks?.some((h: { statusMessage?: string }) => h.statusMessage),
    );
    expect(withStatusMessage.length).toBeGreaterThan(0);
  });

  // ── Agents ────────────────────────────────────────────────────────────────

  it('should generate agent files with model field', () => {
    const agentFiles = files.filter((f) =>
      f.path.includes(path.join('.claude', 'agents')),
    );

    expect(agentFiles.length).toBeGreaterThan(0);

    // All define-type agents should have model in frontmatter
    const defineAgents = agentFiles.filter(
      (f) => f.content.includes('model:'),
    );
    expect(defineAgents.length).toBeGreaterThan(0);

    // Verify model is 'sonnet' for reviewer agents
    for (const agent of defineAgents) {
      expect(agent.content).toMatch(/model:\s*(sonnet|opus|haiku)/);
    }
  });

  it('should generate separate reviewer agents for each technology', () => {
    const agentFiles = files.filter((f) =>
      f.path.includes(path.join('.claude', 'agents')),
    );
    const agentNames = agentFiles.map((f) => path.basename(f.path, '.md'));

    // Should have distinct reviewer agents
    expect(agentNames).toContain('code-reviewer');
    expect(agentNames).toContain('security-checker');

    // TS+React+Jest should produce specific reviewers
    const hasTs = agentNames.includes('ts-reviewer');
    const hasReact = agentNames.includes('react-reviewer');
    const hasTest = agentNames.includes('test-reviewer');

    // At least the main code-reviewer + security-reviewer + tech-specific
    expect(hasTs || hasReact || hasTest).toBe(true);
  });

  // ── Skills ────────────────────────────────────────────────────────────────

  it('should generate skill files with YAML frontmatter', () => {
    const skillFiles = files.filter((f) =>
      f.path.includes(path.join('.claude', 'skills')),
    );

    expect(skillFiles.length).toBeGreaterThan(0);

    for (const skill of skillFiles) {
      // Every skill should start with YAML frontmatter
      expect(skill.content).toMatch(/^---\n/);
      expect(skill.content).toContain('name:');
      expect(skill.content).toContain('description:');
    }
  });

  it('should have context:fork on generator/scaffold skills', () => {
    const skillFiles = files.filter((f) =>
      f.path.includes(path.join('.claude', 'skills')),
    );

    const generatorSkills = skillFiles.filter(
      (f) =>
        f.path.includes('generator') || f.path.includes('scaffold'),
    );

    for (const skill of generatorSkills) {
      expect(skill.content).toContain('context: fork');
      expect(skill.content).toContain('allowed-tools:');
    }
  });

  it('should have user-invocable on reference guide skills', () => {
    const skillFiles = files.filter((f) =>
      f.path.includes(path.join('.claude', 'skills')),
    );

    const guideSkills = skillFiles.filter((f) => f.path.includes('-guide'));

    if (guideSkills.length > 0) {
      for (const skill of guideSkills) {
        expect(skill.content).toContain('user-invocable: true');
        expect(skill.content).toContain('disable-model-invocation: true');
      }
    }
  });

  // ── Rules ─────────────────────────────────────────────────────────────────

  it('should generate rule files with content under ~60 lines', () => {
    const ruleFiles = files.filter((f) =>
      f.path.includes(path.join('.claude', 'rules')),
    );

    expect(ruleFiles.length).toBeGreaterThan(0);

    for (const rule of ruleFiles) {
      const lineCount = rule.content.split('\n').length;
      // Allow some margin (60 lines) since the rule content gets wrapped with frontmatter
      expect(lineCount).toBeLessThanOrEqual(60);
    }
  });

  // ── Hook Script Content Protocol ──────────────────────────────────────────

  it('should use stdin JSON protocol in hook scripts (node extraction)', () => {
    const hookScripts = files.filter(
      (f) => f.path.includes(path.join('.claude', 'hooks')) && f.path.endsWith('.sh'),
    );

    for (const script of hookScripts) {
      // All scripts should read from stdin using node (cross-platform, no jq dependency)
      expect(script.content).toContain('node -e');
      // Should NOT use jq (not available on Windows by default)
      expect(script.content).not.toMatch(/\bjq\s+-r\b/);
    }
  });

  it('should use hookSpecificOutput JSON in PreToolUse hook scripts', () => {
    const hookScripts = files.filter(
      (f) => f.path.includes(path.join('.claude', 'hooks')) && f.path.endsWith('.sh'),
    );

    // Find PreToolUse scripts (contain permissionDecision)
    const preToolUseScripts = hookScripts.filter((s) =>
      s.content.includes('permissionDecision'),
    );

    for (const script of preToolUseScripts) {
      expect(script.content).toContain('hookSpecificOutput');
      expect(script.content).toContain('deny');
      // Should NOT use old format
      expect(script.content).not.toContain('"decision":"block"');
    }
  });

  it('should use exit code 2 for blocking in PostToolUse hook scripts', () => {
    const hookScripts = files.filter(
      (f) => f.path.includes(path.join('.claude', 'hooks')) && f.path.endsWith('.sh'),
    );

    // PostToolUse scripts (don't have permissionDecision)
    const postToolUseScripts = hookScripts.filter(
      (s) => !s.content.includes('permissionDecision'),
    );

    for (const script of postToolUseScripts) {
      // Should use exit 2 for blocking (not exit 1)
      if (script.content.includes('exit 2')) {
        expect(script.content).not.toMatch(/exit 1[^0-9]/);
      }
    }
  });

  // ── CLAUDE.md ─────────────────────────────────────────────────────────────

  it('should generate CLAUDE.md with expected technology sections', async () => {
    const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');

    expect(content).toContain('TypeScript');
    expect(content).toContain('React');
    expect(content).toContain('Jest');
  });

  it('should keep CLAUDE.md under 100 lines', async () => {
    const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(100);
  });
}, 60_000);

// ── v3.0 Multi-stack scenarios ──────────────────────────────────────────────

describe('v3.0 Python + FastAPI output', () => {
  const engine = new DivergerEngine();
  let pyDir: string;
  let pyFiles: GeneratedFile[];

  beforeAll(async () => {
    pyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-py-'));

    // Python + FastAPI project
    await fs.writeFile(
      path.join(pyDir, 'requirements.txt'),
      'fastapi==0.109.0\nuvicorn==0.27.0\npydantic==2.5.0\n',
    );
    await fs.writeFile(
      path.join(pyDir, 'pyproject.toml'),
      '[project]\nname = "myapp"\nrequires-python = ">=3.11"\n',
    );

    const ctx = makeCtx(pyDir);
    const result = await engine.init(ctx);
    pyFiles = result.files;
    await engine.writeFiles(pyFiles, pyDir, { force: true });
  }, 30_000);

  afterAll(async () => {
    try {
      await fs.rm(pyDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should detect Python and FastAPI', async () => {
    const claudeMd = await fs.readFile(path.join(pyDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Python');
    expect(claudeMd).toContain('FastAPI');
  });

  it('should generate reference guide skills for FastAPI', () => {
    const guideSkills = pyFiles.filter(
      (f) => f.path.includes('-guide') && f.path.includes('skills'),
    );
    const names = guideSkills.map((f) => path.basename(path.dirname(f.path)));
    expect(names).toContain('fastapi-di-guide');
    expect(names).toContain('fastapi-testing-guide');
    expect(names).toContain('python-typing-guide');
    expect(names).toContain('python-async-guide');
  });

  it('should generate security rules for Python + FastAPI', () => {
    const ruleFiles = pyFiles.filter((f) => f.path.includes('rules'));
    const ruleNames = ruleFiles.map((f) => path.basename(f.path, '.md'));
    const hasSecurityRule = ruleNames.some((n) => n.includes('security'));
    expect(hasSecurityRule).toBe(true);
  });
}, 60_000);

describe('v3.0 Go project output', () => {
  const engine = new DivergerEngine();
  let goDir: string;
  let goFiles: GeneratedFile[];

  beforeAll(async () => {
    goDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-go-'));

    // Go project
    await fs.writeFile(
      path.join(goDir, 'go.mod'),
      'module github.com/example/myapp\n\ngo 1.22\n',
    );
    await fs.writeFile(path.join(goDir, 'main.go'), 'package main\n\nfunc main() {}\n');

    const ctx = makeCtx(goDir);
    const result = await engine.init(ctx);
    goFiles = result.files;
    await engine.writeFiles(goFiles, goDir, { force: true });
  }, 30_000);

  afterAll(async () => {
    try {
      await fs.rm(goDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should detect Go', async () => {
    const claudeMd = await fs.readFile(path.join(goDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Go');
  });

  it('should generate Go reference guide skills', () => {
    const guideSkills = goFiles.filter(
      (f) => f.path.includes('-guide') && f.path.includes('skills'),
    );
    const names = guideSkills.map((f) => path.basename(path.dirname(f.path)));
    expect(names).toContain('go-concurrency-guide');
    expect(names).toContain('go-error-handling-guide');
  });

  it('should generate Go-specific rules', () => {
    const ruleFiles = goFiles.filter((f) => f.path.includes('rules'));
    expect(ruleFiles.length).toBeGreaterThanOrEqual(3);
  });
}, 60_000);

describe('v3.0 Java + Spring Boot output', () => {
  const engine = new DivergerEngine();
  let javaDir: string;
  let javaFiles: GeneratedFile[];

  beforeAll(async () => {
    javaDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-java-'));

    // Java + Spring Boot project
    await fs.writeFile(
      path.join(javaDir, 'pom.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>1.0.0</version>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
  </dependencies>
</project>`,
    );

    const ctx = makeCtx(javaDir);
    const result = await engine.init(ctx);
    javaFiles = result.files;
    await engine.writeFiles(javaFiles, javaDir, { force: true });
  }, 30_000);

  afterAll(async () => {
    try {
      await fs.rm(javaDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should detect Java and Spring Boot', async () => {
    const claudeMd = await fs.readFile(path.join(javaDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Java');
    expect(claudeMd).toContain('Spring Boot');
  });

  it('should generate Spring Boot reference guide skills', () => {
    const guideSkills = javaFiles.filter(
      (f) => f.path.includes('-guide') && f.path.includes('skills'),
    );
    const names = guideSkills.map((f) => path.basename(path.dirname(f.path)));
    expect(names).toContain('spring-di-guide');
    expect(names).toContain('spring-testing-guide');
    expect(names).toContain('java-patterns-guide');
    expect(names).toContain('java-concurrency-guide');
  });

  it('should generate security rules for Java + Spring Boot', () => {
    const ruleFiles = javaFiles.filter((f) => f.path.includes('rules'));
    const ruleNames = ruleFiles.map((f) => path.basename(f.path, '.md'));
    const hasSecurityRule = ruleNames.some((n) => n.includes('security'));
    expect(hasSecurityRule).toBe(true);
  });
}, 60_000);

// ── D.4 — Doctor Skill structure test ──────────────────────────────────────

describe('diverger-doctor skill structure', () => {
  it('should exist in plugin/skills/', async () => {
    const skillPath = path.join(
      path.resolve(__dirname, '../../plugin'),
      'skills',
      'diverger-doctor',
      'SKILL.md',
    );
    await expect(fs.access(skillPath).then(() => true).catch(() => false)).resolves.toBe(true);
  });

  it('should have correct frontmatter fields', async () => {
    const skillPath = path.join(
      path.resolve(__dirname, '../../plugin'),
      'skills',
      'diverger-doctor',
      'SKILL.md',
    );
    const content = await fs.readFile(skillPath, 'utf-8');

    expect(content).toContain('name: diverger-doctor');
    expect(content).toContain('user-invocable: true');
    // Doctor uses allowedTools (not disableModelInvocation) because it runs MCP tools
    expect(content).toContain('allowed-tools:');
  });

  it('should reference expected MCP tools', async () => {
    const skillPath = path.join(
      path.resolve(__dirname, '../../plugin'),
      'skills',
      'diverger-doctor',
      'SKILL.md',
    );
    const content = await fs.readFile(skillPath, 'utf-8');

    // Doctor should reference these MCP tools for health checks
    expect(content).toContain('check_config');
    expect(content).toContain('check_plugin_health');
  });

  it('should define weighted scoring categories', async () => {
    const skillPath = path.join(
      path.resolve(__dirname, '../../plugin'),
      'skills',
      'diverger-doctor',
      'SKILL.md',
    );
    const content = await fs.readFile(skillPath, 'utf-8');

    // Should contain scoring categories
    expect(content).toMatch(/config.*health|health.*config/i);
    expect(content).toMatch(/security/i);
    expect(content).toMatch(/test.*coverage|coverage/i);
    expect(content).toMatch(/score|0-100|semáforo/i);
  });

  it('should have substantial content (>50 lines)', async () => {
    const skillPath = path.join(
      path.resolve(__dirname, '../../plugin'),
      'skills',
      'diverger-doctor',
      'SKILL.md',
    );
    const content = await fs.readFile(skillPath, 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeGreaterThan(50);
  });
});
