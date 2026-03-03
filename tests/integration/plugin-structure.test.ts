import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { universalProfile } from '../../src/profiles/registry/base/universal.profile.js';
import { ProfileComposer } from '../../src/profiles/composer.js';
import type { DetectionResult } from '../../src/core/types.js';
import {
  UNIVERSAL_AGENT_NAMES,
  UNIVERSAL_SKILL_NAMES,
  UNIVERSAL_HOOK_SCRIPT_FILENAMES,
} from '../../src/core/constants.js';

/** Compose the universal profile alone (no detected technologies → only base layer fires) */
function composeUniversalOnly() {
  const composer = new ProfileComposer();
  const emptyDetection: DetectionResult = {
    technologies: [],
    rootDir: '/tmp/test',
    detectedAt: new Date().toISOString(),
  };
  return composer.compose([universalProfile], emptyDetection);
}

describe('Plugin structure: universal profile ↔ constants sync', () => {
  const composed = composeUniversalOnly();

  it('UNIVERSAL_AGENT_NAMES matches universal profile agents', () => {
    const profileAgentNames = new Set(composed.agents.map((a) => a.name));
    expect(profileAgentNames).toEqual(UNIVERSAL_AGENT_NAMES);
  });

  it('UNIVERSAL_SKILL_NAMES matches universal profile skills', () => {
    const profileSkillNames = new Set(composed.skills.map((s) => s.name));
    expect(profileSkillNames).toEqual(UNIVERSAL_SKILL_NAMES);
  });

  it('UNIVERSAL_HOOK_SCRIPT_FILENAMES matches universal profile hookScripts', () => {
    const profileHookScriptNames = new Set(composed.hookScripts.map((hs) => hs.filename));
    expect(profileHookScriptNames).toEqual(UNIVERSAL_HOOK_SCRIPT_FILENAMES);
  });

  it('universal profile produces expected agent count', () => {
    expect(composed.agents).toHaveLength(UNIVERSAL_AGENT_NAMES.size);
  });

  it('universal profile produces expected skill count', () => {
    expect(composed.skills).toHaveLength(UNIVERSAL_SKILL_NAMES.size);
  });

  it('universal profile produces expected hook script count', () => {
    expect(composed.hookScripts).toHaveLength(UNIVERSAL_HOOK_SCRIPT_FILENAMES.size);
  });

  it('all agent names from profile exist in constant set', () => {
    for (const agent of composed.agents) {
      expect(UNIVERSAL_AGENT_NAMES.has(agent.name)).toBe(true);
    }
  });

  it('all skill names from profile exist in constant set', () => {
    for (const skill of composed.skills) {
      expect(UNIVERSAL_SKILL_NAMES.has(skill.name)).toBe(true);
    }
  });

  it('all hook script filenames from profile exist in constant set', () => {
    for (const hs of composed.hookScripts) {
      expect(UNIVERSAL_HOOK_SCRIPT_FILENAMES.has(hs.filename)).toBe(true);
    }
  });
});

describe('Plugin structure: MCP files (after build:plugin)', () => {
  const pluginDir = path.resolve(import.meta.dirname, '../../plugin');

  // These tests validate files produced by `npm run build:plugin`.
  // They skip gracefully if plugin/ doesn't exist (e.g. in CI before build).
  const skipIfNoPlugin = existsSync(pluginDir) ? it : it.skip;

  skipIfNoPlugin('.mcp.json is generated in plugin/', () => {
    const mcpPath = path.join(pluginDir, '.mcp.json');
    expect(existsSync(mcpPath)).toBe(true);
    const content = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    expect(content.mcpServers).toBeDefined();
    expect(content.mcpServers['diverger-claude']).toBeDefined();
    expect(content.mcpServers['diverger-claude'].command).toBe('node');
  });

  skipIfNoPlugin('MCP skill diverger-init exists with valid frontmatter', () => {
    const skillPath = path.join(pluginDir, 'skills', 'diverger-init', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: diverger-init');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('detect_stack');
  });

  skipIfNoPlugin('MCP skill diverger-status exists with valid frontmatter', () => {
    const skillPath = path.join(pluginDir, 'skills', 'diverger-status', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: diverger-status');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('check_config');
  });

  skipIfNoPlugin('MCP skill diverger-sync exists with valid frontmatter', () => {
    const skillPath = path.join(pluginDir, 'skills', 'diverger-sync', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: diverger-sync');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('sync_config');
  });
});

describe('Plugin structure: marketplace.json', () => {
  const rootDir = path.resolve(import.meta.dirname, '../..');
  const marketplacePath = path.join(rootDir, '.claude-plugin', 'marketplace.json');

  it('marketplace.json exists at .claude-plugin/', () => {
    expect(existsSync(marketplacePath)).toBe(true);
  });

  it('has required fields (name, owner.name, plugins array)', () => {
    const content = JSON.parse(readFileSync(marketplacePath, 'utf-8'));
    expect(content.name).toBe('divergerthinking-tools');
    expect(content.owner).toBeDefined();
    expect(content.owner.name).toBe('DivergerThinking');
    expect(Array.isArray(content.plugins)).toBe(true);
    expect(content.plugins.length).toBeGreaterThanOrEqual(1);
  });

  it('plugin entry points to ./plugin', () => {
    const content = JSON.parse(readFileSync(marketplacePath, 'utf-8'));
    const entry = content.plugins.find((p: { name: string }) => p.name === 'diverger-claude');
    expect(entry).toBeDefined();
    expect(entry.source).toBe('./plugin');
  });
});

describe('Plugin structure: bundled MCP server (after build:plugin)', () => {
  const pluginDir = path.resolve(import.meta.dirname, '../../plugin');
  const skipIfNoPlugin = existsSync(pluginDir) ? it : it.skip;

  skipIfNoPlugin('.mcp.json does NOT contain ../ paths', () => {
    const mcpPath = path.join(pluginDir, '.mcp.json');
    const content = readFileSync(mcpPath, 'utf-8');
    expect(content).not.toContain('../');
  });

  skipIfNoPlugin('plugin/mcp/server.js exists', () => {
    const serverPath = path.join(pluginDir, 'mcp', 'server.js');
    expect(existsSync(serverPath)).toBe(true);
  });

  skipIfNoPlugin('plugin.json has full metadata (author.name, homepage, repository, keywords)', () => {
    const manifestPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
    const content = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(content.author).toBeDefined();
    expect(content.author.name).toBe('DivergerThinking');
    expect(content.homepage).toBeDefined();
    expect(content.repository).toBeDefined();
    expect(Array.isArray(content.keywords)).toBe(true);
    expect(content.keywords.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Plugin structure: version sync (after build:plugin)', () => {
  const pluginDir = path.resolve(import.meta.dirname, '../../plugin');
  const rootDir = path.resolve(import.meta.dirname, '../..');
  const skipIfNoPlugin = existsSync(pluginDir) ? it : it.skip;

  skipIfNoPlugin('plugin.json version matches package.json version', () => {
    const pkgVersion = JSON.parse(
      readFileSync(path.join(rootDir, 'package.json'), 'utf-8'),
    ).version;
    const pluginVersion = JSON.parse(
      readFileSync(path.join(pluginDir, '.claude-plugin', 'plugin.json'), 'utf-8'),
    ).version;
    expect(pluginVersion).toBe(pkgVersion);
  });
});
