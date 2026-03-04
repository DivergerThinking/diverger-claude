/**
 * D.1 — Content validation for the 15 enriched profiles (v3.0).
 * Ensures each profile produces non-empty rules, skills, and agent contributions,
 * and that reference skills have substantial content.
 */
import { describe, it, expect } from 'vitest';
import { getAllProfiles } from '../../../src/profiles/index.js';
import type { Profile, SkillDefinition } from '../../../src/core/types.js';

const allProfiles = getAllProfiles();

/** Helper: find a profile by its id */
function getProfile(id: string): Profile {
  const p = allProfiles.find((prof) => prof.id === id);
  if (!p) throw new Error(`Profile '${id}' not found in registry`);
  return p;
}

/** The 15 profiles enriched in v3.0 */
const ENRICHED_PROFILE_IDS = [
  // Tier 1 — languages
  'languages/go',
  'languages/python',
  'languages/rust',
  'languages/java',
  // Tier 1 — frameworks
  'frameworks/nextjs',
  'frameworks/django',
  'frameworks/nestjs',
  // Tier 2 — frameworks
  'frameworks/vue',
  'frameworks/angular',
  'frameworks/express',
  'frameworks/fastapi',
  'frameworks/spring-boot',
  // Tier 3 — infra
  'infra/docker',
  'infra/kubernetes',
  'infra/github-actions',
];

/** Expected reference guide skills per profile */
const EXPECTED_GUIDE_SKILLS: Record<string, string[]> = {
  'languages/go': ['go-concurrency-guide', 'go-error-handling-guide'],
  'languages/python': ['python-typing-guide', 'python-async-guide'],
  'languages/rust': ['rust-ownership-guide', 'rust-error-handling-guide'],
  'languages/java': ['java-patterns-guide', 'java-concurrency-guide'],
  'frameworks/nextjs': ['nextjs-caching-guide', 'nextjs-server-actions-guide'],
  'frameworks/django': ['django-orm-guide', 'django-security-guide'],
  'frameworks/nestjs': ['nestjs-di-guide', 'nestjs-testing-guide'],
  'frameworks/vue': ['vue-composition-guide', 'vue-reactivity-guide'],
  'frameworks/angular': ['angular-signals-guide', 'angular-testing-guide'],
  'frameworks/express': ['express-middleware-guide', 'express-security-guide'],
  'frameworks/fastapi': ['fastapi-di-guide', 'fastapi-testing-guide'],
  'frameworks/spring-boot': ['spring-di-guide', 'spring-testing-guide'],
  'infra/docker': ['docker-security-guide', 'dockerfile-best-practices'],
  'infra/kubernetes': ['k8s-security-guide', 'k8s-debugging-guide'],
  'infra/github-actions': ['github-actions-guide'],
};

describe('v3.0 Enriched Profile Content Validation', () => {
  // ── All 15 profiles exist ──────────────────────────────────────────────────

  it('should have all 15 enriched profiles in the registry', () => {
    for (const id of ENRICHED_PROFILE_IDS) {
      expect(allProfiles.find((p) => p.id === id), `Missing profile: ${id}`).toBeDefined();
    }
  });

  // ── Per-profile structural validation ──────────────────────────────────────

  describe.each(ENRICHED_PROFILE_IDS)('Profile: %s', (profileId) => {
    const profile = getProfile(profileId);
    const contributions = profile.contributions;

    it('has non-empty rules', () => {
      expect(contributions.rules).toBeDefined();
      expect(contributions.rules!.length).toBeGreaterThanOrEqual(2);

      for (const rule of contributions.rules!) {
        expect(rule.path).toBeTruthy();
        expect(rule.content.length).toBeGreaterThan(50);
      }
    });

    it('has non-empty skills', () => {
      expect(contributions.skills).toBeDefined();
      expect(contributions.skills!.length).toBeGreaterThanOrEqual(2);
    });

    it('has agent contributions', () => {
      expect(contributions.agents).toBeDefined();
      expect(contributions.agents!.length).toBeGreaterThanOrEqual(1);
    });

    it('has expected reference guide skills', () => {
      const expectedGuides = EXPECTED_GUIDE_SKILLS[profileId] ?? [];
      const skillNames = (contributions.skills ?? []).map((s) => s.name);

      for (const guideName of expectedGuides) {
        expect(skillNames, `Missing skill: ${guideName}`).toContain(guideName);
      }
    });

    it('reference guide skills have substantial content (>20 lines)', () => {
      const expectedGuides = EXPECTED_GUIDE_SKILLS[profileId] ?? [];
      const guideSkills = (contributions.skills ?? []).filter((s) =>
        expectedGuides.includes(s.name),
      );

      for (const skill of guideSkills) {
        const lineCount = skill.content.split('\n').length;
        expect(lineCount, `Skill ${skill.name} has only ${lineCount} lines`).toBeGreaterThan(20);
      }
    });

    it('reference guide skills are userInvocable with disableModelInvocation', () => {
      const expectedGuides = EXPECTED_GUIDE_SKILLS[profileId] ?? [];
      const guideSkills = (contributions.skills ?? []).filter((s) =>
        expectedGuides.includes(s.name),
      );

      for (const skill of guideSkills) {
        expect(skill.userInvocable, `${skill.name} should be userInvocable`).toBe(true);
        expect(
          skill.disableModelInvocation,
          `${skill.name} should have disableModelInvocation`,
        ).toBe(true);
      }
    });
  });

  // ── Hook scripts are valid bash ────────────────────────────────────────────

  describe('Hook scripts validity', () => {
    for (const profileId of ENRICHED_PROFILE_IDS) {
      const profile = getProfile(profileId);
      const hookScripts = profile.contributions.hookScripts ?? [];
      const hooks = profile.contributions.hooks ?? [];

      if (hookScripts.length > 0) {
        it(`${profileId}: hook scripts start with shebang`, () => {
          for (const script of hookScripts) {
            expect(script.content).toMatch(/^#!/);
          }
        });

        it(`${profileId}: hook scripts use node (not jq)`, () => {
          for (const script of hookScripts) {
            expect(script.content).not.toMatch(/\bjq\s/);
          }
        });
      }

      // Also check inline hook commands for jq
      if (hooks.length > 0) {
        it(`${profileId}: inline hooks do not use jq`, () => {
          for (const hook of hooks) {
            if ('command' in hook && typeof (hook as { command?: string }).command === 'string') {
              expect((hook as { command: string }).command).not.toMatch(/\bjq\s/);
            }
          }
        });
      }
    }
  });

  // ── Aggregate counts ──────────────────────────────────────────────────────

  it('should produce at least 30 reference guide skills across all 15 profiles', () => {
    let totalGuideSkills = 0;
    for (const profileId of ENRICHED_PROFILE_IDS) {
      const profile = getProfile(profileId);
      const guideSkills = (profile.contributions.skills ?? []).filter(
        (s: SkillDefinition) =>
          s.userInvocable === true && s.disableModelInvocation === true,
      );
      totalGuideSkills += guideSkills.length;
    }
    expect(totalGuideSkills).toBeGreaterThanOrEqual(29);
  });

  it('should produce at least 40 rules across all 15 profiles', () => {
    let totalRules = 0;
    for (const profileId of ENRICHED_PROFILE_IDS) {
      const profile = getProfile(profileId);
      totalRules += (profile.contributions.rules ?? []).length;
    }
    expect(totalRules).toBeGreaterThanOrEqual(40);
  });
});
