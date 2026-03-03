import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { performCleanup } from '../../../src/cli/commands/cleanup.js';

const CLI_PATH = path.resolve(import.meta.dirname, '../../../dist/index.js');

describe('diverger cleanup', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'diverger-cleanup-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  /** Creates universal agent/skill/hook files inside .claude/ (identical to plugin) */
  function createUniversalFiles(): void {
    const agentsPath = path.join(tempDir, '.claude', 'agents');
    const skillsPath = path.join(tempDir, '.claude', 'skills');
    const hooksPath = path.join(tempDir, '.claude', 'hooks');

    mkdirSync(agentsPath, { recursive: true });
    mkdirSync(hooksPath, { recursive: true });

    // Universal agents
    for (const name of ['code-reviewer', 'test-writer', 'security-reviewer', 'doc-writer', 'refactor-assistant', 'migration-helper']) {
      writeFileSync(path.join(agentsPath, `${name}.md`), `# ${name}`);
    }

    // Universal skills (directories with SKILL.md)
    for (const name of ['architecture-style-guide', 'security-guide', 'git-workflow-guide']) {
      const dir = path.join(skillsPath, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'SKILL.md'), `# ${name}`);
    }

    // Universal hook scripts
    for (const name of ['secret-scanner.sh', 'destructive-cmd-blocker.sh', 'check-long-lines.sh', 'check-trailing-newline.sh']) {
      writeFileSync(path.join(hooksPath, name), `#!/bin/bash\n# ${name}`);
    }
  }

  /** Creates tech-specific files that should NOT be removed */
  function createTechSpecificFiles(): void {
    const agentsPath = path.join(tempDir, '.claude', 'agents');
    const skillsPath = path.join(tempDir, '.claude', 'skills');
    const hooksPath = path.join(tempDir, '.claude', 'hooks');
    const rulesPath = path.join(tempDir, '.claude', 'rules');

    mkdirSync(agentsPath, { recursive: true });
    mkdirSync(hooksPath, { recursive: true });
    mkdirSync(rulesPath, { recursive: true });

    // Tech-specific agent
    writeFileSync(path.join(agentsPath, 'ts-reviewer.md'), '# ts-reviewer');

    // Tech-specific skill
    const skillDir = path.join(skillsPath, 'typescript-module-scaffold');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(path.join(skillDir, 'SKILL.md'), '# TS scaffold');

    // Tech-specific hook
    writeFileSync(path.join(hooksPath, 'check-strict-mode.sh'), '#!/bin/bash');

    // Rules (should never be touched)
    writeFileSync(path.join(rulesPath, 'typescript.md'), '# TS rules');

    // Settings and CLAUDE.md
    writeFileSync(path.join(tempDir, '.claude', 'settings.json'), '{}');
    writeFileSync(path.join(tempDir, 'CLAUDE.md'), '# Project');
  }

  /** Creates settings.json with universal hook commands */
  function createSettingsWithUniversalHooks(): void {
    const settingsPath = path.join(tempDir, '.claude', 'settings.json');
    mkdirSync(path.dirname(settingsPath), { recursive: true });
    const settings = {
      permissions: { deny: ['rm -rf /'] },
      hooks: {
        PreToolUse: [
          {
            matcher: 'Write',
            hooks: [
              { type: 'command', command: 'bash .claude/hooks/secret-scanner.sh', timeout: 10 },
            ],
          },
          {
            matcher: 'Bash',
            hooks: [
              { type: 'command', command: 'bash .claude/hooks/destructive-cmd-blocker.sh', timeout: 10 },
            ],
          },
        ],
        PostToolUse: [
          {
            matcher: 'Write',
            hooks: [
              { type: 'command', command: 'bash .claude/hooks/check-long-lines.sh', timeout: 5 },
              { type: 'command', command: 'bash .claude/hooks/check-strict-mode.sh', timeout: 5 },
            ],
          },
        ],
      },
    };
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }

  function runCleanup(args = ''): string {
    try {
      return execSync(`node "${CLI_PATH}" cleanup --dir "${tempDir}" --force ${args}`, {
        encoding: 'utf-8',
        timeout: 15000,
        env: { ...process.env, FORCE_COLOR: '0' },
      });
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string };
      if (execErr.stdout) return execErr.stdout;
      throw err;
    }
  }

  it('removes universal agents, skills, and hook scripts', () => {
    createUniversalFiles();
    createTechSpecificFiles();

    runCleanup();

    // Universal files should be gone
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'code-reviewer.md'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'test-writer.md'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'security-reviewer.md'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'skills', 'architecture-style-guide'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'skills', 'security-guide'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'hooks', 'secret-scanner.sh'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'hooks', 'destructive-cmd-blocker.sh'))).toBe(false);
  });

  it('preserves tech-specific files', () => {
    createUniversalFiles();
    createTechSpecificFiles();

    runCleanup();

    // Tech-specific files should remain
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'ts-reviewer.md'))).toBe(true);
    expect(existsSync(path.join(tempDir, '.claude', 'skills', 'typescript-module-scaffold', 'SKILL.md'))).toBe(true);
    expect(existsSync(path.join(tempDir, '.claude', 'hooks', 'check-strict-mode.sh'))).toBe(true);
    expect(existsSync(path.join(tempDir, '.claude', 'rules', 'typescript.md'))).toBe(true);
    expect(existsSync(path.join(tempDir, '.claude', 'settings.json'))).toBe(true);
    expect(existsSync(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
  });

  it('reports nothing to clean when no universal files exist', () => {
    createTechSpecificFiles();

    const output = runCleanup();
    expect(output).toContain('No se encontraron componentes universales');
  });

  it('dry-run does not delete anything', () => {
    createUniversalFiles();

    runCleanup('--dry-run');

    // All files should still exist
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'code-reviewer.md'))).toBe(true);
    expect(existsSync(path.join(tempDir, '.claude', 'skills', 'architecture-style-guide'))).toBe(true);
    expect(existsSync(path.join(tempDir, '.claude', 'hooks', 'secret-scanner.sh'))).toBe(true);
  });

  it('handles partial cleanup (only some universal files present)', () => {
    // Only create some universal files
    const agentsPath = path.join(tempDir, '.claude', 'agents');
    mkdirSync(agentsPath, { recursive: true });
    writeFileSync(path.join(agentsPath, 'code-reviewer.md'), '# code-reviewer');
    writeFileSync(path.join(agentsPath, 'test-writer.md'), '# test-writer');

    runCleanup();

    expect(existsSync(path.join(agentsPath, 'code-reviewer.md'))).toBe(false);
    expect(existsSync(path.join(agentsPath, 'test-writer.md'))).toBe(false);
  });

  it('cleans universal hook entries from settings.json', () => {
    createUniversalFiles();
    createSettingsWithUniversalHooks();

    runCleanup();

    const settings = JSON.parse(readFileSync(path.join(tempDir, '.claude', 'settings.json'), 'utf-8'));
    // permissions should be preserved
    expect(settings.permissions).toBeDefined();
    expect(settings.permissions.deny).toContain('rm -rf /');

    // Universal hook commands should be removed
    // PreToolUse entries (all universal) should be gone
    if (settings.hooks?.PreToolUse) {
      for (const entry of settings.hooks.PreToolUse) {
        if (entry.hooks) {
          for (const h of entry.hooks) {
            expect(h.command).not.toContain('secret-scanner.sh');
            expect(h.command).not.toContain('destructive-cmd-blocker.sh');
          }
        }
      }
    }

    // PostToolUse: check-strict-mode.sh (tech-specific) should remain
    expect(settings.hooks?.PostToolUse).toBeDefined();
    const postEntries = settings.hooks.PostToolUse;
    const writeEntry = postEntries.find((e: Record<string, unknown>) => e.matcher === 'Write');
    expect(writeEntry).toBeDefined();
    const remainingCommands = writeEntry.hooks.map((h: Record<string, string>) => h.command);
    expect(remainingCommands).toContain('bash .claude/hooks/check-strict-mode.sh');
    expect(remainingCommands).not.toContain('bash .claude/hooks/check-long-lines.sh');
  });
});

describe('performCleanup()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'diverger-perform-cleanup-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function createUniversalFiles(): void {
    const agentsPath = path.join(tempDir, '.claude', 'agents');
    const skillsPath = path.join(tempDir, '.claude', 'skills');
    const hooksPath = path.join(tempDir, '.claude', 'hooks');

    mkdirSync(agentsPath, { recursive: true });
    mkdirSync(hooksPath, { recursive: true });

    for (const name of ['code-reviewer', 'test-writer', 'security-reviewer']) {
      writeFileSync(path.join(agentsPath, `${name}.md`), `# ${name}`);
    }

    for (const name of ['architecture-style-guide', 'security-guide']) {
      const dir = path.join(skillsPath, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'SKILL.md'), `# ${name}`);
    }

    for (const name of ['secret-scanner.sh', 'destructive-cmd-blocker.sh']) {
      writeFileSync(path.join(hooksPath, name), `#!/bin/bash\n# ${name}`);
    }
  }

  it('returns cleaned=false when no plugin and no force', async () => {
    createUniversalFiles();

    const result = await performCleanup({ targetDir: tempDir, force: false });

    expect(result.cleaned).toBe(false);
    expect(result.removed).toEqual([]);
    // Files should still exist
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'code-reviewer.md'))).toBe(true);
  });

  it('removes universal files with force=true (no plugin needed)', async () => {
    createUniversalFiles();

    const result = await performCleanup({ targetDir: tempDir, force: true });

    expect(result.cleaned).toBe(true);
    expect(result.removed.length).toBeGreaterThan(0);

    // Universal files should be gone
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'code-reviewer.md'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'test-writer.md'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'skills', 'architecture-style-guide'))).toBe(false);
    expect(existsSync(path.join(tempDir, '.claude', 'hooks', 'secret-scanner.sh'))).toBe(false);
  });

  it('preserves tech-specific files', async () => {
    createUniversalFiles();
    // Add a tech-specific agent
    writeFileSync(path.join(tempDir, '.claude', 'agents', 'ts-reviewer.md'), '# ts');

    await performCleanup({ targetDir: tempDir, force: true });

    expect(existsSync(path.join(tempDir, '.claude', 'agents', 'ts-reviewer.md'))).toBe(true);
  });

  it('returns cleaned=false when nothing to clean', async () => {
    mkdirSync(path.join(tempDir, '.claude'), { recursive: true });

    const result = await performCleanup({ targetDir: tempDir, force: true });

    expect(result.cleaned).toBe(false);
    expect(result.removed).toEqual([]);
  });

  it('cleans universal hooks from settings.json', async () => {
    createUniversalFiles();
    const settingsPath = path.join(tempDir, '.claude', 'settings.json');
    const settings = {
      permissions: { deny: ['rm -rf /'] },
      hooks: {
        PreToolUse: [
          { matcher: 'Write', hooks: [{ type: 'command', command: 'bash .claude/hooks/secret-scanner.sh' }] },
        ],
        PostToolUse: [
          {
            matcher: 'Write',
            hooks: [
              { type: 'command', command: 'bash .claude/hooks/check-long-lines.sh' },
              { type: 'command', command: 'bash .claude/hooks/check-strict-mode.sh' },
            ],
          },
        ],
      },
    };
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    const result = await performCleanup({ targetDir: tempDir, force: true });

    expect(result.settingsClean).toBe(true);

    const updated = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    expect(updated.permissions.deny).toContain('rm -rf /');
    // Tech-specific hook should remain
    const postHooks = updated.hooks?.PostToolUse;
    expect(postHooks).toBeDefined();
    const cmds = postHooks.flatMap((e: Record<string, unknown>) =>
      Array.isArray(e.hooks) ? (e.hooks as Array<Record<string, string>>).map((h) => h.command) : [],
    );
    expect(cmds).toContain('bash .claude/hooks/check-strict-mode.sh');
    expect(cmds).not.toContain('bash .claude/hooks/secret-scanner.sh');
  });
});
