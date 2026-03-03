import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PLUGIN_DIR = path.resolve(__dirname, '../../../plugin');
const SKILLS_DIR = path.join(PLUGIN_DIR, 'skills');
const AGENTS_DIR = path.join(PLUGIN_DIR, 'agents');

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns an object with the extracted fields.
 */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields: Record<string, string> = {};
  for (const line of match[1]!.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    fields[key] = value;
  }
  return fields;
}

describe('Skill Validation', () => {
  const skillDirs = fs.readdirSync(SKILLS_DIR).filter((d) =>
    fs.statSync(path.join(SKILLS_DIR, d)).isDirectory(),
  );

  it('should have at least 15 skills', () => {
    expect(skillDirs.length).toBeGreaterThanOrEqual(15);
  });

  describe('All skills have valid frontmatter', () => {
    for (const skillDir of skillDirs) {
      it(`${skillDir} has name and description in SKILL.md`, () => {
        const skillPath = path.join(SKILLS_DIR, skillDir, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);

        const content = fs.readFileSync(skillPath, 'utf-8');
        const fm = parseFrontmatter(content);

        expect(fm.name).toBeDefined();
        expect(fm.name!.length).toBeGreaterThan(0);
        expect(fm.description).toBeDefined();
        expect(fm.description!.length).toBeGreaterThan(0);
      });
    }
  });

  describe('No skill name conflicts', () => {
    it('should have unique skill names across all skills', () => {
      const names: string[] = [];
      for (const skillDir of skillDirs) {
        const skillPath = path.join(SKILLS_DIR, skillDir, 'SKILL.md');
        const content = fs.readFileSync(skillPath, 'utf-8');
        const fm = parseFrontmatter(content);
        if (fm.name) names.push(fm.name);
      }

      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });

  describe('Skill directory names match frontmatter names', () => {
    for (const skillDir of skillDirs) {
      it(`${skillDir} directory matches frontmatter name`, () => {
        const skillPath = path.join(SKILLS_DIR, skillDir, 'SKILL.md');
        const content = fs.readFileSync(skillPath, 'utf-8');
        const fm = parseFrontmatter(content);

        expect(fm.name).toBe(skillDir);
      });
    }
  });
});

describe('Agent Validation', () => {
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));

  it('should have at least 7 agents', () => {
    expect(agentFiles.length).toBeGreaterThanOrEqual(7);
  });

  describe('All agents have valid frontmatter', () => {
    for (const agentFile of agentFiles) {
      it(`${agentFile} has name and description`, () => {
        const agentPath = path.join(AGENTS_DIR, agentFile);
        const content = fs.readFileSync(agentPath, 'utf-8');
        const fm = parseFrontmatter(content);

        expect(fm.name).toBeDefined();
        expect(fm.name!.length).toBeGreaterThan(0);
        expect(fm.description).toBeDefined();
        expect(fm.description!.length).toBeGreaterThan(0);
        // model is optional but if present must be valid
        if (fm.model) {
          expect(['opus', 'sonnet', 'haiku']).toContain(fm.model);
        }
      });
    }
  });

  describe('No agent name conflicts', () => {
    it('should have unique agent names', () => {
      const names: string[] = [];
      for (const agentFile of agentFiles) {
        const agentPath = path.join(AGENTS_DIR, agentFile);
        const content = fs.readFileSync(agentPath, 'utf-8');
        const fm = parseFrontmatter(content);
        if (fm.name) names.push(fm.name);
      }

      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });

  describe('Agent file names match frontmatter names', () => {
    for (const agentFile of agentFiles) {
      it(`${agentFile} filename matches frontmatter name`, () => {
        const agentPath = path.join(AGENTS_DIR, agentFile);
        const content = fs.readFileSync(agentPath, 'utf-8');
        const fm = parseFrontmatter(content);

        const expectedName = agentFile.replace('.md', '');
        expect(fm.name).toBe(expectedName);
      });
    }
  });
});
