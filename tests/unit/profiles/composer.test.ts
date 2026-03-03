import { describe, it, expect } from 'vitest';
import { ProfileComposer } from '../../../src/profiles/composer.js';
import { CompositionError } from '../../../src/core/errors.js';
import type {
  Profile,
  DetectionResult,
  DetectedTechnology,
  ProfileLayer,
} from '../../../src/core/types.js';

function makeTech(
  id: string,
  profileIds: string[] = [],
  majorVersion?: number,
  version?: string,
): DetectedTechnology {
  return {
    id,
    name: id,
    category: 'framework',
    confidence: 90,
    evidence: [],
    profileIds,
    majorVersion,
    version,
  };
}

function makeDetection(technologies: DetectedTechnology[]): DetectionResult {
  return {
    technologies,
    rootDir: '/project',
    detectedAt: new Date().toISOString(),
  };
}

function makeProfile(overrides: Partial<Profile> & { id: string }): Profile {
  return {
    name: overrides.id,
    layer: 10 as ProfileLayer,
    technologyIds: [],
    contributions: {},
    ...overrides,
  };
}

describe('ProfileComposer', () => {
  const composer = new ProfileComposer();

  // ── compose: basic profile resolution ─────────────────────────────────

  describe('compose - profile resolution', () => {
    it('should always include base layer (layer 0) profiles', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          technologyIds: [],
          contributions: {
            claudeMd: [{ heading: 'Base', content: '## Base\nBase rules', order: 0 }],
          },
        }),
      ];

      const detection = makeDetection([]);
      const result = composer.compose(profiles, detection);

      expect(result.appliedProfiles).toContain('base/common');
      expect(result.claudeMdSections).toHaveLength(1);
    });

    it('should include profiles matched by technologyIds', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            claudeMd: [{ heading: 'React', content: '## React\nReact rules', order: 10 }],
          },
        }),
      ];

      const detection = makeDetection([makeTech('react', ['frameworks/react'])]);
      const result = composer.compose(profiles, detection);

      expect(result.appliedProfiles).toContain('frameworks/react');
    });

    it('should exclude profiles when version is outside constraints', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'frameworks/react-18',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          versionConstraints: { min: 18, max: 18 },
          contributions: {
            claudeMd: [{ heading: 'React 18', content: '## React 18\nRules for v18', order: 10 }],
          },
        }),
      ];

      const detection = makeDetection([
        makeTech('react', ['frameworks/react-18'], 17),
      ]);
      const result = composer.compose(profiles, detection);

      expect(result.appliedProfiles).not.toContain('frameworks/react-18');
    });

    it('should include profiles when version is within constraints', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'frameworks/react-18',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          versionConstraints: { min: 18, max: 19 },
          contributions: {
            claudeMd: [{ heading: 'React 18', content: '## React 18\nRules', order: 10 }],
          },
        }),
      ];

      const detection = makeDetection([
        makeTech('react', ['frameworks/react-18'], 18),
      ]);
      const result = composer.compose(profiles, detection);

      expect(result.appliedProfiles).toContain('frameworks/react-18');
    });

    it('should exclude profiles when version is "workspace:*" (B43 fix)', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'frameworks/react-18',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          versionConstraints: { min: 18, max: 19 },
          contributions: {},
        }),
      ];

      // workspace:* has version string but no parseable majorVersion
      const detection = makeDetection([
        makeTech('react', ['frameworks/react-18'], undefined, 'workspace:*'),
      ]);
      const result = composer.compose(profiles, detection);

      expect(result.appliedProfiles).not.toContain('frameworks/react-18');
    });

    it('should exclude profiles when version is "latest" (B43 fix)', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'frameworks/react-18',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          versionConstraints: { min: 18, max: 19 },
          contributions: {},
        }),
      ];

      const detection = makeDetection([
        makeTech('react', ['frameworks/react-18'], undefined, 'latest'),
      ]);
      const result = composer.compose(profiles, detection);

      expect(result.appliedProfiles).not.toContain('frameworks/react-18');
    });

    it('should exclude profiles when version is a git URL (B43 fix)', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'frameworks/react-18',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          versionConstraints: { min: 18, max: 19 },
          contributions: {},
        }),
      ];

      const detection = makeDetection([
        makeTech('react', ['frameworks/react-18'], undefined, 'github:user/react#main'),
      ]);
      const result = composer.compose(profiles, detection);

      expect(result.appliedProfiles).not.toContain('frameworks/react-18');
    });

    it('should include profiles when tech has no version at all and has constraints', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'frameworks/react-18',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          versionConstraints: { min: 18, max: 19 },
          contributions: {},
        }),
      ];

      // No version at all (neither version nor majorVersion)
      const detection = makeDetection([
        makeTech('react', ['frameworks/react-18']),
      ]);
      const result = composer.compose(profiles, detection);

      // When no version info at all, include the profile (can't verify constraint)
      expect(result.appliedProfiles).toContain('frameworks/react-18');
    });
  });

  // ── compose: CLAUDE.md sections ────────────────────────────────────────

  describe('compose - claudeMd sections', () => {
    it('should aggregate claudeMd sections from multiple profiles', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            claudeMd: [{ heading: 'Base', content: '## Base\nContent', order: 0 }],
          },
        }),
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            claudeMd: [{ heading: 'TypeScript', content: '## TypeScript\nContent', order: 10 }],
          },
        }),
      ];

      const detection = makeDetection([makeTech('typescript', ['languages/typescript'])]);
      const result = composer.compose(profiles, detection);

      expect(result.claudeMdSections).toHaveLength(2);
    });
  });

  // ── compose: settings deep merge ──────────────────────────────────────

  describe('compose - settings deep merge', () => {
    it('should deep merge settings from multiple profiles', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            settings: {
              permissions: { allow: ['Read'] },
            },
          },
        }),
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            settings: {
              permissions: { allow: ['Write'], deny: ['Bash'] },
            },
          },
        }),
      ];

      const detection = makeDetection([makeTech('react', ['frameworks/react'])]);
      const result = composer.compose(profiles, detection);

      // allow arrays should be concatenated and deduplicated
      expect(result.settings.permissions.allow).toContain('Read');
      expect(result.settings.permissions.allow).toContain('Write');
      expect(result.settings.permissions.deny).toContain('Bash');
    });

    it('should deduplicate allow entries', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            settings: {
              permissions: { allow: ['Read', 'Write'] },
            },
          },
        }),
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            settings: {
              permissions: { allow: ['Read', 'Execute'] },
            },
          },
        }),
      ];

      const detection = makeDetection([makeTech('react', ['frameworks/react'])]);
      const result = composer.compose(profiles, detection);

      const allow = result.settings.permissions.allow!;
      expect(allow.filter((p) => p === 'Read')).toHaveLength(1);
      expect(allow).toContain('Execute');
    });

    it('should merge sandbox settings', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            settings: {
              permissions: {},
              sandbox: {
                filesystem: { denyRead: ['/etc/secrets'] },
              },
            },
          },
        }),
      ];

      const detection = makeDetection([]);
      const result = composer.compose(profiles, detection);

      expect(result.settings.sandbox?.filesystem?.denyRead).toContain('/etc/secrets');
    });
  });

  // ── compose: rules ────────────────────────────────────────────────────

  describe('compose - rules', () => {
    it('should aggregate rules from multiple profiles', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            rules: [
              { path: 'base.md', content: 'Base rule', governance: 'mandatory', description: 'Base' },
            ],
          },
        }),
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            rules: [
              { path: 'typescript.md', content: 'TS rule', governance: 'recommended', description: 'TS' },
            ],
          },
        }),
      ];

      const detection = makeDetection([makeTech('typescript', ['languages/typescript'])]);
      const result = composer.compose(profiles, detection);

      expect(result.rules).toHaveLength(2);
      expect(result.rules.map((r) => r.path)).toContain('base.md');
      expect(result.rules.map((r) => r.path)).toContain('typescript.md');
    });
  });

  // ── compose: agent enrichment ─────────────────────────────────────────

  describe('compose - agent enrichment', () => {
    it('should define an agent from a single profile', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            agents: [
              {
                name: 'code-reviewer',
                type: 'define',
                prompt: 'Review code carefully.',
                skills: ['review'],
                model: 'claude-sonnet',
                description: 'Code Reviewer',
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([]);
      const result = composer.compose(profiles, detection);

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0]!.name).toBe('code-reviewer');
      expect(result.agents[0]!.prompt).toBe('Review code carefully.');
      expect(result.agents[0]!.skills).toContain('review');
      expect(result.agents[0]!.model).toBe('claude-sonnet');
      expect(result.agents[0]!.description).toBe('Code Reviewer');
    });

    it('should enrich an existing agent with additional prompt and skills', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            agents: [
              {
                name: 'code-reviewer',
                type: 'define',
                prompt: 'Review code carefully.',
                skills: ['review'],
                model: 'claude-sonnet',
                description: 'Code Reviewer',
              },
            ],
          },
        }),
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            agents: [
              {
                name: 'code-reviewer',
                type: 'enrich',
                prompt: 'Pay attention to TypeScript types.',
                skills: ['ts-analysis'],
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([makeTech('typescript', ['languages/typescript'])]);
      const result = composer.compose(profiles, detection);

      expect(result.agents).toHaveLength(1);
      const reviewer = result.agents[0]!;
      expect(reviewer.prompt).toContain('Review code carefully.');
      expect(reviewer.prompt).toContain('Pay attention to TypeScript types.');
      expect(reviewer.skills).toContain('review');
      expect(reviewer.skills).toContain('ts-analysis');
      // Model should stay from define (enrichment didn't set model)
      expect(reviewer.model).toBe('claude-sonnet');
    });

    it('should allow enrichment to override model', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            agents: [
              {
                name: 'reviewer',
                type: 'define',
                prompt: 'Base prompt.',
                model: 'claude-sonnet',
              },
            ],
          },
        }),
        makeProfile({
          id: 'testing/jest',
          layer: 30 as ProfileLayer,
          technologyIds: ['jest'],
          contributions: {
            agents: [
              {
                name: 'reviewer',
                type: 'enrich',
                model: 'claude-opus',
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([makeTech('jest', ['testing/jest'])]);
      const result = composer.compose(profiles, detection);

      expect(result.agents[0]!.model).toBe('claude-opus');
    });

    it('should create agent when enriching a non-existent agent', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            agents: [
              {
                name: 'new-agent',
                type: 'enrich',
                prompt: 'Created via enrich.',
                skills: ['skill-a'],
                description: 'New Agent',
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([makeTech('typescript', ['languages/typescript'])]);
      const result = composer.compose(profiles, detection);

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0]!.name).toBe('new-agent');
      expect(result.agents[0]!.prompt).toBe('Created via enrich.');
    });

    it('should merge duplicate define agents', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            agents: [
              {
                name: 'code-reviewer',
                type: 'define',
                prompt: 'First define prompt.',
                skills: ['skill-a'],
              },
            ],
          },
        }),
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            agents: [
              {
                name: 'code-reviewer',
                type: 'define',
                prompt: 'Second define prompt.',
                skills: ['skill-b'],
                description: 'Updated description',
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([makeTech('react', ['frameworks/react'])]);
      const result = composer.compose(profiles, detection);

      expect(result.agents).toHaveLength(1);
      const reviewer = result.agents[0]!;
      expect(reviewer.prompt).toContain('First define prompt.');
      expect(reviewer.prompt).toContain('Second define prompt.');
      expect(reviewer.skills).toContain('skill-a');
      expect(reviewer.skills).toContain('skill-b');
      expect(reviewer.description).toBe('Updated description');
    });
  });

  // ── compose: skills, hooks, mcp, externalTools ────────────────────────

  describe('compose - other contributions', () => {
    it('should aggregate skills from multiple profiles', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            skills: [{ name: 'commit', content: 'Commit skill', description: 'Auto commit' }],
          },
        }),
        makeProfile({
          id: 'testing/jest',
          layer: 30 as ProfileLayer,
          technologyIds: ['jest'],
          contributions: {
            skills: [{ name: 'test-gen', content: 'Test gen', description: 'Generate tests' }],
          },
        }),
      ];

      const detection = makeDetection([makeTech('jest', ['testing/jest'])]);
      const result = composer.compose(profiles, detection);

      expect(result.skills).toHaveLength(2);
    });

    it('should aggregate hooks from multiple profiles', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            hooks: [
              { event: 'PreToolUse', matcher: 'Bash', hooks: [{ type: 'command', command: 'echo pre' }] },
            ],
          },
        }),
      ];

      const detection = makeDetection([]);
      const result = composer.compose(profiles, detection);

      expect(result.hooks).toHaveLength(1);
      expect(result.hooks[0]!.event).toBe('PreToolUse');
      // C7: verify internal hooks structure matches HookDefinition
      expect(result.hooks[0]!.hooks).toHaveLength(1);
      expect(result.hooks[0]!.hooks[0]!.type).toBe('command');
      expect(result.hooks[0]!.hooks[0]!.command).toBe('echo pre');
    });

    it('should aggregate mcp configs from multiple profiles', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            mcp: [{ name: 'server-a', command: 'node server-a.js' }],
          },
        }),
      ];

      const detection = makeDetection([]);
      const result = composer.compose(profiles, detection);

      expect(result.mcp).toHaveLength(1);
    });
  });

  // ── validation: permission conflicts ──────────────────────────────────

  describe('validation - permission conflicts', () => {
    it('should throw CompositionError when same pattern in allow and deny', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            settings: {
              permissions: { allow: ['Bash'] },
            },
          },
        }),
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            settings: {
              permissions: { deny: ['Bash'] },
            },
          },
        }),
      ];

      const detection = makeDetection([makeTech('react', ['frameworks/react'])]);

      expect(() => composer.compose(profiles, detection)).toThrow(CompositionError);
      expect(() => composer.compose(profiles, detection)).toThrow(/Bash/);
    });

    it('should not throw when allow and deny have different patterns', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            settings: {
              permissions: { allow: ['Read'], deny: ['Execute'] },
            },
          },
        }),
      ];

      const detection = makeDetection([]);
      expect(() => composer.compose(profiles, detection)).not.toThrow();
    });
  });

  // ── validation: duplicate rules ───────────────────────────────────────

  describe('validation - duplicate rules', () => {
    it('should throw CompositionError on duplicate rule paths', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            rules: [
              { path: 'common.md', content: 'Rule A', governance: 'mandatory', description: 'A' },
            ],
          },
        }),
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            rules: [
              { path: 'common.md', content: 'Rule B', governance: 'recommended', description: 'B' },
            ],
          },
        }),
      ];

      const detection = makeDetection([makeTech('react', ['frameworks/react'])]);

      expect(() => composer.compose(profiles, detection)).toThrow(CompositionError);
      expect(() => composer.compose(profiles, detection)).toThrow(/common\.md/);
    });

    it('should not throw when all rule paths are unique', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            rules: [
              { path: 'base.md', content: 'Rule A', governance: 'mandatory', description: 'A' },
              { path: 'react.md', content: 'Rule B', governance: 'recommended', description: 'B' },
            ],
          },
        }),
      ];

      const detection = makeDetection([]);
      expect(() => composer.compose(profiles, detection)).not.toThrow();
    });
  });

  // ── compose: ESLint config merging ──────────────────────────────────

  describe('compose - ESLint config merging', () => {
    it('should merge multiple ESLint configs into a single .eslintrc.json', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            externalTools: [
              {
                type: 'eslint',
                filePath: '.eslintrc.json',
                mergeStrategy: 'create-only',
                config: {
                  extends: ['eslint:recommended', 'plugin:@typescript-eslint/strict'],
                  rules: { 'no-explicit-any': 'error' },
                },
              },
            ],
          },
        }),
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            externalTools: [
              {
                type: 'eslint',
                filePath: '.eslintrc.json',
                mergeStrategy: 'create-only',
                config: {
                  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
                  plugins: ['react', 'react-hooks'],
                  rules: { 'react/prop-types': 'off' },
                  settings: { react: { version: 'detect' } },
                },
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([
        makeTech('typescript', ['languages/typescript']),
        makeTech('react', ['frameworks/react']),
      ]);
      const result = composer.compose(profiles, detection);

      // Should produce a single ESLint config
      const eslintConfigs = result.externalTools.filter((t) => t.type === 'eslint');
      expect(eslintConfigs).toHaveLength(1);

      const merged = eslintConfigs[0]!;
      expect(merged.filePath).toBe('.eslintrc.json');
      expect(merged.config.extends).toContain('eslint:recommended');
      expect(merged.config.extends).toContain('plugin:react/recommended');
      expect(merged.config.plugins).toContain('react');
      expect((merged.config.rules as Record<string, unknown>)['no-explicit-any']).toBe('error');
      expect((merged.config.rules as Record<string, unknown>)['react/prop-types']).toBe('off');
      expect((merged.config.settings as Record<string, unknown>).react).toBeDefined();
    });

    it('should pass through single ESLint config unchanged', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            externalTools: [
              {
                type: 'eslint',
                filePath: '.eslintrc.json',
                mergeStrategy: 'create-only',
                config: { extends: ['eslint:recommended'] },
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([makeTech('typescript', ['languages/typescript'])]);
      const result = composer.compose(profiles, detection);

      const eslintConfigs = result.externalTools.filter((t) => t.type === 'eslint');
      expect(eslintConfigs).toHaveLength(1);
      expect(eslintConfigs[0]!.config.extends).toEqual(['eslint:recommended']);
    });

    it('should not affect non-ESLint external tools', () => {
      const profiles: Profile[] = [
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            externalTools: [
              {
                type: 'tsconfig',
                filePath: 'tsconfig.json',
                mergeStrategy: 'align',
                config: { compilerOptions: { strict: true } },
              },
              {
                type: 'eslint',
                filePath: '.eslintrc.json',
                mergeStrategy: 'create-only',
                config: { extends: ['eslint:recommended'] },
              },
            ],
          },
        }),
        makeProfile({
          id: 'frameworks/react',
          layer: 20 as ProfileLayer,
          technologyIds: ['react'],
          contributions: {
            externalTools: [
              {
                type: 'eslint',
                filePath: '.eslintrc.json',
                mergeStrategy: 'create-only',
                config: { extends: ['plugin:react/recommended'] },
              },
            ],
          },
        }),
      ];

      const detection = makeDetection([
        makeTech('typescript', ['languages/typescript']),
        makeTech('react', ['frameworks/react']),
      ]);
      const result = composer.compose(profiles, detection);

      const tsconfigs = result.externalTools.filter((t) => t.type === 'tsconfig');
      const eslintConfigs = result.externalTools.filter((t) => t.type === 'eslint');
      expect(tsconfigs).toHaveLength(1);
      expect(eslintConfigs).toHaveLength(1);
    });
  });

  // ── compose: layer ordering ───────────────────────────────────────────

  describe('compose - layer ordering', () => {
    it('should apply profiles in layer order (lower layers first)', () => {
      const applied: string[] = [];

      const profiles: Profile[] = [
        makeProfile({
          id: 'testing/jest',
          layer: 30 as ProfileLayer,
          technologyIds: ['jest'],
          contributions: {
            claudeMd: [{
              heading: 'Jest',
              content: '## Jest\nJest rules',
              order: 30,
            }],
          },
        }),
        makeProfile({
          id: 'base/common',
          layer: 0 as ProfileLayer,
          contributions: {
            claudeMd: [{
              heading: 'Base',
              content: '## Base\nBase rules',
              order: 0,
            }],
          },
        }),
        makeProfile({
          id: 'languages/typescript',
          layer: 10 as ProfileLayer,
          technologyIds: ['typescript'],
          contributions: {
            claudeMd: [{
              heading: 'TypeScript',
              content: '## TypeScript\nTS rules',
              order: 10,
            }],
          },
        }),
      ];

      const detection = makeDetection([
        makeTech('jest', ['testing/jest']),
        makeTech('typescript', ['languages/typescript']),
      ]);
      const result = composer.compose(profiles, detection);

      // appliedProfiles should reflect the order profiles were applied
      expect(result.appliedProfiles[0]).toBe('base/common');
      expect(result.appliedProfiles[1]).toBe('languages/typescript');
      expect(result.appliedProfiles[2]).toBe('testing/jest');
    });
  });
});
