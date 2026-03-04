import { mapDependencyToTechnology } from '../evolution/dependency-mapper.js';
import { shouldReport } from './unknown-tech-filters.js';
import { extractErrorMessage } from '../core/errors.js';

export interface UnknownTechnology {
  /** The dependency name */
  dependency: string;
  /** Where it was found (e.g., "package.json", "go.mod") */
  source: string;
  /** Package manager ecosystem */
  category: 'npm' | 'pip' | 'cargo' | 'go' | 'maven' | 'nuget' | 'other';
  /** Project root where detected */
  projectRoot: string;
  /** ISO timestamp */
  detectedAt: string;
}

export interface GitHubIssueResult {
  issueNumber: number;
  issueUrl: string;
}

/**
 * Find dependencies that don't map to any known technology and look like frameworks.
 */
export function findUnknownTechnologies(
  allDependencies: string[],
  source: string,
  category: UnknownTechnology['category'],
  projectRoot: string,
): UnknownTechnology[] {
  const now = new Date().toISOString();
  return allDependencies
    .filter((dep) => !mapDependencyToTechnology(dep) && shouldReport(dep))
    .map((dep) => ({
      dependency: dep,
      source,
      category,
      projectRoot,
      detectedAt: now,
    }));
}

/**
 * File a GitHub Issue requesting technology support for unknown dependencies.
 * Uses the `gh` CLI. Returns null if `gh` is not available.
 */
export async function fileGitHubIssue(
  unknowns: UnknownTechnology[],
  repoSlug: string,
): Promise<GitHubIssueResult | null> {
  if (unknowns.length === 0) return null;

  try {
    const { execFileSync } = await import('child_process');

    // Check for existing open issues
    const depNames = unknowns.map((u) => u.dependency);
    const searchQuery = `New technology detected: ${depNames[0]}`;
    const existingResult = execFileSync('gh', [
      'issue', 'list', '--repo', repoSlug,
      '--search', searchQuery, '--state', 'open',
      '--json', 'number', '--limit', '1',
    ], { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] });
    const existing = JSON.parse(existingResult) as Array<{ number: number }>;
    if (existing.length > 0) {
      return null; // Issue already exists
    }

    // Create the issue
    const title = `New technology detected: ${depNames.join(', ')}`;
    const body = buildIssueBody(unknowns);

    const createResult = execFileSync('gh', [
      'issue', 'create', '--repo', repoSlug,
      '--title', title, '--label', 'technology-request,auto-detected',
      '--body', body, '--json', 'number,url',
    ], { encoding: 'utf-8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] });
    const created = JSON.parse(createResult) as { number: number; url: string };
    return { issueNumber: created.number, issueUrl: created.url };
  } catch (err: unknown) {
    // gh CLI not available or no auth — return null
    const msg = extractErrorMessage(err);
    if (msg.includes('command not found') || msg.includes('not recognized')) {
      return null;
    }
    return null;
  }
}

function buildIssueBody(unknowns: UnknownTechnology[]): string {
  const rows = unknowns
    .map((u) => `- **${u.dependency}** (${u.category}) — found in \`${u.source}\``)
    .join('\n');

  return `## Detected Technologies

The following dependencies were detected in a project but don't have corresponding profiles in diverger-claude:

${rows}

## Context
- Auto-detected by diverger-claude evolution advisor
- Detected at: ${unknowns[0]!.detectedAt}
- Project: ${unknowns[0]!.projectRoot}

## Requested Action
Please evaluate whether these technologies should have dedicated profiles with:
- CLAUDE.md sections with best practices
- Rules for common anti-patterns
- Agent/skill configurations

---
*This issue was automatically created by diverger-claude.*`;
}
