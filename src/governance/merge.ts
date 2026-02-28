import type { DivergentMeta, GeneratedFile, GovernanceLevel, MergeResult } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { hashMatches } from '../utils/hash.js';
import { deepmerge } from 'deepmerge-ts';

/**
 * Three-way merge engine.
 * Compares BASE (original generated) vs THEIRS (current on disk) vs OURS (new generated).
 */
export class ThreeWayMerge {
  /**
   * Perform three-way merge for a single file.
   * @param file - The new generated file (OURS)
   * @param meta - Previous generation metadata (contains base hashes)
   * @param base - The original generated content from meta hash lookup (optional)
   * @param governance - Governance level for this file (optional)
   */
  async mergeFile(
    file: GeneratedFile,
    meta: DivergentMeta | null,
    base?: string | null,
    governance?: GovernanceLevel,
  ): Promise<MergeResult> {
    const storedHash = meta?.fileHashes[file.path];
    const currentContent = await readFileOrNull(file.path);

    // Case 1: File doesn't exist on disk -> create
    if (currentContent === null) {
      return {
        path: file.path,
        outcome: 'auto-apply',
        content: file.content,
      };
    }

    // Case 2: No previous hash (first run or meta lost) -> treat as conflict
    if (!storedHash) {
      if (currentContent === file.content) {
        return { path: file.path, outcome: 'skip' };
      }
      return {
        path: file.path,
        outcome: 'conflict',
        content: file.content,
        conflictDetails: 'No hay historial previo. El archivo existe en disco con contenido diferente.',
      };
    }

    const baseMatchesCurrent = hashMatches(currentContent, storedHash);
    const baseMatchesNew = hashMatches(file.content, storedHash);

    // Case 3: Nobody changed anything -> skip
    if (baseMatchesCurrent && baseMatchesNew) {
      return { path: file.path, outcome: 'skip' };
    }

    // Case 4: Only library changed (team didn't touch it) -> auto-apply
    if (baseMatchesCurrent && !baseMatchesNew) {
      return {
        path: file.path,
        outcome: 'auto-apply',
        content: file.content,
      };
    }

    // Case 5: Only team changed -> keep their version
    // BUT: if governance is 'mandatory', force library version (auto-apply)
    if (!baseMatchesCurrent && baseMatchesNew) {
      if (governance === 'mandatory') {
        return {
          path: file.path,
          outcome: 'auto-apply',
          content: file.content,
          conflictDetails: 'Regla mandatory: se fuerza la version de la libreria sobre cambios del equipo.',
        };
      }
      return { path: file.path, outcome: 'keep' };
    }

    // Case 6: Both changed -> attempt smart merge
    return this.attemptSmartMerge(file, currentContent, base ?? null);
  }

  /**
   * Perform three-way merge for all files.
   * @param files - New generated files
   * @param meta - Previous generation metadata
   * @param governanceMap - Map of file path to governance level
   */
  async mergeAll(
    files: GeneratedFile[],
    meta: DivergentMeta | null,
    governanceMap?: Record<string, GovernanceLevel>,
  ): Promise<MergeResult[]> {
    const results: MergeResult[] = [];
    for (const file of files) {
      try {
        const governance = governanceMap?.[file.path] ?? file.governance;
        // base content is not available from meta (meta only stores hashes, not content),
        // so we pass null. The caller could provide it if they have it.
        const base: string | null = null;
        results.push(await this.mergeFile(file, meta, base, governance));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          path: file.path,
          outcome: 'error',
          conflictDetails: `Error durante merge: ${msg}`,
        });
      }
    }
    return results;
  }

  /** Attempt a smart merge when both sides changed */
  private attemptSmartMerge(
    file: GeneratedFile,
    currentContent: string,
    base: string | null,
  ): MergeResult {
    // For markdown files: try section-based merge
    if (file.path.endsWith('.md')) {
      return this.mergeMarkdown(file, currentContent, base);
    }

    // For JSON files: try deep merge
    if (file.path.endsWith('.json')) {
      return this.mergeJson(file, currentContent, base);
    }

    // For other files: report conflict
    return {
      path: file.path,
      outcome: 'conflict',
      content: file.content,
      conflictDetails: 'Ambos (libreria y equipo) modificaron este archivo. Se requiere revision manual.',
    };
  }

  /** Merge markdown files by sections (## headers) with three-way base support */
  private mergeMarkdown(file: GeneratedFile, currentContent: string, base: string | null): MergeResult {
    const ourSections = this.parseMdSections(file.content);
    const theirSections = this.parseMdSections(currentContent);
    const baseSections = base ? this.parseMdSections(base) : null;

    const mergedSections = new Map<string, string>();

    // Gather all headings from all three versions
    const allHeadings = new Set<string>([
      ...ourSections.keys(),
      ...theirSections.keys(),
      ...(baseSections ? baseSections.keys() : []),
    ]);

    for (const heading of allHeadings) {
      const inOurs = ourSections.has(heading);
      const inTheirs = theirSections.has(heading);
      const inBase = baseSections?.has(heading) ?? false;

      const ourContent = ourSections.get(heading);
      const theirContent = theirSections.get(heading);
      const baseContent = baseSections?.get(heading);

      if (inTheirs && inOurs) {
        // Both have it: if base is available, do true three-way
        if (baseSections && inBase) {
          const theyChanged = theirContent !== baseContent;
          const weChanged = ourContent !== baseContent;

          if (theyChanged && !weChanged) {
            // Only team changed this section - keep theirs
            mergedSections.set(heading, theirContent!);
          } else if (!theyChanged && weChanged) {
            // Only library changed this section - use ours
            mergedSections.set(heading, ourContent!);
          } else {
            // Both changed or neither: prefer team's version
            mergedSections.set(heading, theirContent!);
          }
        } else {
          // No base available: prefer team's version
          mergedSections.set(heading, theirContent!);
        }
      } else if (inTheirs && !inOurs) {
        // Only in theirs: team added it or library removed it
        if (baseSections && inBase) {
          // Was in base and library removed it - skip (library intentionally removed)
        } else {
          // Team added it - keep
          mergedSections.set(heading, theirContent!);
        }
      } else if (!inTheirs && inOurs) {
        // Only in ours: library added it or team removed it
        if (baseSections && inBase) {
          // Was in base and team removed it - skip (team intentionally removed)
        } else {
          // Library added new section
          mergedSections.set(heading, ourContent!);
        }
      }
    }

    const mergedContent = [...mergedSections.values()].join('\n\n');
    return {
      path: file.path,
      outcome: 'merged',
      content: mergedContent,
    };
  }

  /** Merge JSON files using deep merge with three-way base support */
  private mergeJson(file: GeneratedFile, currentContent: string, base: string | null): MergeResult {
    try {
      const ours = JSON.parse(file.content) as Record<string, unknown>;
      const theirs = JSON.parse(currentContent) as Record<string, unknown>;

      let merged: Record<string, unknown>;

      if (base) {
        try {
          const baseObj = JSON.parse(base) as Record<string, unknown>;
          // True three-way deep merge:
          // 1. Start with base
          // 2. Apply library changes (ours) on top of base
          // 3. Apply team changes (theirs) on top — team wins conflicts
          const withOurs = deepmerge(baseObj, ours) as Record<string, unknown>;
          merged = deepmerge(withOurs, theirs) as Record<string, unknown>;
        } catch {
          // If base parse fails, fall back to two-way
          merged = deepmerge(ours, theirs) as Record<string, unknown>;
        }
      } else {
        // No base: deep merge ours + theirs (team wins for shared keys)
        merged = deepmerge(ours, theirs) as Record<string, unknown>;
      }

      return {
        path: file.path,
        outcome: 'merged',
        content: JSON.stringify(merged, null, 2) + '\n',
      };
    } catch {
      return {
        path: file.path,
        outcome: 'conflict',
        content: file.content,
        conflictDetails: 'No se pudo hacer merge de JSON. Se requiere revision manual.',
      };
    }
  }

  /** Parse markdown into sections by ## headings */
  private parseMdSections(content: string): Map<string, string> {
    const sections = new Map<string, string>();
    const lines = content.split('\n');
    let currentHeading = '__preamble__';
    let currentLines: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^##\s+(.+)/);
      if (headingMatch) {
        // Save previous section
        if (currentLines.length > 0) {
          sections.set(currentHeading, currentLines.join('\n'));
        }
        currentHeading = headingMatch[1]!;
        currentLines = [line];
      } else {
        currentLines.push(line);
      }
    }

    // Save last section
    if (currentLines.length > 0) {
      sections.set(currentHeading, currentLines.join('\n'));
    }

    return sections;
  }
}
