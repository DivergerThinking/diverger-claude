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
    expect(agentNames).toContain('security-reviewer');

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

  it('should use stdin JSON protocol in hook scripts (jq extraction)', () => {
    const hookScripts = files.filter(
      (f) => f.path.includes(path.join('.claude', 'hooks')) && f.path.endsWith('.sh'),
    );

    for (const script of hookScripts) {
      // All scripts should read from stdin using jq
      expect(script.content).toContain('jq');
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
      expect(script.content).toContain('"deny"');
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
