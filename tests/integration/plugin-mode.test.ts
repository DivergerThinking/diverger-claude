import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { GenerationEngine } from '../../src/generation/index.js';
import { ProfileComposer } from '../../src/profiles/composer.js';
import { DetectionEngine } from '../../src/detection/index.js';
import { getAllProfiles } from '../../src/profiles/index.js';
import {
  UNIVERSAL_AGENT_NAMES,
  UNIVERSAL_SKILL_NAMES,
  UNIVERSAL_HOOK_SCRIPT_FILENAMES,
  AGENTS_DIR,
  SKILLS_DIR,
  HOOKS_DIR,
  CLAUDE_DIR,
  RULES_DIR,
  SETTINGS_FILE,
  CLAUDE_MD,
} from '../../src/core/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const fixtureDir = path.join(FIXTURES_DIR, 'nextjs-app');

async function generateWithPluginMode(pluginMode: boolean) {
  const detectionEngine = new DetectionEngine();
  const detection = await detectionEngine.detect(fixtureDir);
  const composer = new ProfileComposer();
  const composed = composer.compose(getAllProfiles(), detection);
  const generationEngine = new GenerationEngine();
  return generationEngine.generate(composed, fixtureDir, detection, undefined, pluginMode);
}

describe('Plugin mode integration', () => {
  it('pluginMode: true produces fewer files than pluginMode: false', async () => {
    const [withPlugin, withoutPlugin] = await Promise.all([
      generateWithPluginMode(true),
      generateWithPluginMode(false),
    ]);

    expect(withPlugin.files.length).toBeLessThan(withoutPlugin.files.length);
  });

  it('pluginMode: true excludes universal agent files', async () => {
    const result = await generateWithPluginMode(true);
    const agentFiles = result.files.filter((f) =>
      f.path.includes(path.join(CLAUDE_DIR, AGENTS_DIR)),
    );
    const agentNames = agentFiles.map((f) => path.basename(f.path, '.md'));

    for (const name of UNIVERSAL_AGENT_NAMES) {
      expect(agentNames).not.toContain(name);
    }
  });

  it('pluginMode: true excludes universal skill files', async () => {
    const result = await generateWithPluginMode(true);
    const skillFiles = result.files.filter((f) =>
      f.path.includes(path.join(CLAUDE_DIR, SKILLS_DIR)),
    );
    const skillNames = skillFiles.map((f) => {
      // skill path: .../.claude/skills/{name}/SKILL.md
      const parts = f.path.split(path.sep);
      const skillsIdx = parts.indexOf(SKILLS_DIR);
      return parts[skillsIdx + 1];
    });

    for (const name of UNIVERSAL_SKILL_NAMES) {
      expect(skillNames).not.toContain(name);
    }
  });

  it('pluginMode: true excludes universal hook script files', async () => {
    const result = await generateWithPluginMode(true);
    const hookFiles = result.files.filter((f) =>
      f.path.includes(path.join(CLAUDE_DIR, HOOKS_DIR)) && f.path.endsWith('.sh'),
    );
    const hookFilenames = hookFiles.map((f) => path.basename(f.path));

    for (const filename of UNIVERSAL_HOOK_SCRIPT_FILENAMES) {
      expect(hookFilenames).not.toContain(filename);
    }
  });

  it('pluginMode: true still generates rules', async () => {
    const result = await generateWithPluginMode(true);
    const ruleFiles = result.files.filter((f) =>
      f.path.includes(path.join(CLAUDE_DIR, RULES_DIR)),
    );

    expect(ruleFiles.length).toBeGreaterThan(0);
  });

  it('pluginMode: true still generates settings.json', async () => {
    const result = await generateWithPluginMode(true);
    const settingsFile = result.files.find((f) =>
      f.path.endsWith(path.join(CLAUDE_DIR, SETTINGS_FILE)),
    );

    expect(settingsFile).toBeDefined();
  });

  it('pluginMode: true still generates CLAUDE.md', async () => {
    const result = await generateWithPluginMode(true);
    const claudeMdFile = result.files.find((f) =>
      path.basename(f.path) === CLAUDE_MD,
    );

    expect(claudeMdFile).toBeDefined();
  });

  it('pluginMode: false generates all files as before', async () => {
    const result = await generateWithPluginMode(false);
    const agentFiles = result.files.filter((f) =>
      f.path.includes(path.join(CLAUDE_DIR, AGENTS_DIR)),
    );
    const agentNames = agentFiles.map((f) => path.basename(f.path, '.md'));

    // Should contain universal agents
    for (const name of UNIVERSAL_AGENT_NAMES) {
      expect(agentNames).toContain(name);
    }
  });

  it('pluginMode: true preserves unfiltered config in result', async () => {
    const result = await generateWithPluginMode(true);

    // The config in result should be UNFILTERED (for metadata)
    const configAgentNames = result.config.agents.map((a) => a.name);
    for (const name of UNIVERSAL_AGENT_NAMES) {
      expect(configAgentNames).toContain(name);
    }
  });
});
