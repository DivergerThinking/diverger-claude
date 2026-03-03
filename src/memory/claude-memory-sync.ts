import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import type { MemoryStore } from '../core/types.js';
import { getTopAntiPatterns, getTopErrorPatterns } from './project-memory.js';

const DIVERGER_START = '<!-- diverger:start -->';
const DIVERGER_END = '<!-- diverger:end -->';

/** Maximum lines the diverger section should occupy */
const MAX_SECTION_LINES = 30;

/**
 * Sync top learnings to Claude Code auto-memory (MEMORY.md).
 * Only modifies the section delimited by diverger markers.
 */
export async function syncToClaudeMemory(
  projectRoot: string,
  memory: MemoryStore,
): Promise<void> {
  const memoryDir = resolveClaudeMemoryDir(projectRoot);
  if (!memoryDir) return;

  const memoryMdPath = path.join(memoryDir, 'MEMORY.md');
  let content: string;
  try {
    content = await fs.readFile(memoryMdPath, 'utf-8');
  } catch {
    // No MEMORY.md yet — start fresh
    content = '';
  }

  const section = buildDivergerSection(memory);
  const updated = replaceDivergerSection(content, section);

  await fs.mkdir(memoryDir, { recursive: true });
  await fs.writeFile(memoryMdPath, updated, 'utf-8');
}

/** Build the diverger learnings section content */
export function buildDivergerSection(memory: MemoryStore): string {
  const lines: string[] = [];

  lines.push(DIVERGER_START);
  lines.push('## Diverger Learnings (auto-generated)');

  // Anti-patterns (top 5)
  const topAntiPatterns = getTopAntiPatterns(memory, 5);
  if (topAntiPatterns.length > 0) {
    lines.push('### Anti-patterns aprendidos');
    for (const ap of topAntiPatterns) {
      lines.push(`- ${ap.pattern} — ${ap.alternative} (confianza: ${ap.confidence})`);
    }
  }

  // Error patterns (top 3 by occurrences)
  const topErrors = getTopErrorPatterns(memory, 3);
  if (topErrors.length > 0) {
    lines.push('### Errores recurrentes');
    for (const ep of topErrors) {
      const resolution = ep.resolution ? ` — ${ep.resolution}` : '';
      lines.push(`- ${ep.description}${resolution} (${ep.occurrences} ocurrencias)`);
    }
  }

  // Health stats
  const { totalRepairs, successfulRepairs, totalSessions } = memory.stats;
  if (totalRepairs > 0 || totalSessions > 0) {
    const rate = totalRepairs > 0 ? Math.round((successfulRepairs / totalRepairs) * 100) : 0;
    lines.push('### Estado del plugin');
    lines.push(
      `- Sesiones: ${totalSessions} | Reparaciones: ${successfulRepairs}/${totalRepairs} (${rate}%)`,
    );
  }

  lines.push(DIVERGER_END);

  // Enforce max section lines
  if (lines.length > MAX_SECTION_LINES) {
    return lines.slice(0, MAX_SECTION_LINES - 1).join('\n') + '\n' + DIVERGER_END;
  }

  return lines.join('\n');
}

/** Replace the diverger section in existing content, or append it */
export function replaceDivergerSection(content: string, section: string): string {
  const startIdx = content.indexOf(DIVERGER_START);
  const endIdx = content.indexOf(DIVERGER_END);

  if (startIdx !== -1 && endIdx !== -1) {
    const afterEnd = endIdx + DIVERGER_END.length;
    return content.slice(0, startIdx) + section + content.slice(afterEnd);
  }

  // Append at end, with a blank line separator if content exists
  if (content.length > 0 && !content.endsWith('\n')) {
    return content + '\n\n' + section + '\n';
  }
  if (content.length > 0) {
    return content + '\n' + section + '\n';
  }
  return section + '\n';
}

/**
 * Resolve the Claude Code auto-memory directory for a project.
 * Claude Code stores per-project memory at:
 *   ~/.claude/projects/<sanitized-path>/memory/
 */
export function resolveClaudeMemoryDir(projectRoot: string): string | null {
  try {
    // Get git root (if in a git repo) for consistent project identification
    let root: string;
    try {
      root = execSync('git rev-parse --show-toplevel', {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      root = projectRoot;
    }

    // Claude Code sanitizes the path: replace path separators and colons
    const normalized = path.resolve(root);
    const sanitized = normalized
      .replace(/\\/g, '-')
      .replace(/\//g, '-')
      .replace(/:/g, '-')
      .replace(/^-+/, '');

    return path.join(os.homedir(), '.claude', 'projects', sanitized, 'memory');
  } catch {
    return null;
  }
}
