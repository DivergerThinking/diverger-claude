import type { DivergentMeta, GeneratedFile, GovernanceLevel, MergeResult } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { hashMatches } from '../utils/hash.js';
import { toRelativeMetaKey } from '../utils/paths.js';
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
    projectRoot?: string,
  ): Promise<MergeResult> {
    // Lookup with relative key first, then fallback to absolute path (backward-compat)
    const relKey = projectRoot ? toRelativeMetaKey(file.path, projectRoot) : undefined;
    const storedHash = (relKey ? meta?.fileHashes[relKey] : undefined) ?? meta?.fileHashes[file.path];
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
      if (currentContent.replace(/\r\n/g, '\n') === file.content.replace(/\r\n/g, '\n')) {
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
          conflictDetails: 'Regla mandatory: se fuerza la versión de la librería sobre cambios del equipo.',
        };
      }
      return { path: file.path, outcome: 'keep' };
    }

    // Case 6: Both changed
    // A4: if governance is mandatory, force library version (no merge attempt)
    if (governance === 'mandatory') {
      return {
        path: file.path,
        outcome: 'auto-apply',
        content: file.content,
        conflictDetails: 'Regla mandatory: se fuerza la versión de la librería (ambos cambiaron).',
      };
    }
    // -> attempt smart merge
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
    projectRoot?: string,
  ): Promise<MergeResult[]> {
    const results: MergeResult[] = [];
    for (const file of files) {
      try {
        // Compute relative key first so governance map lookup works with relative keys
        const relKey = projectRoot ? toRelativeMetaKey(file.path, projectRoot) : undefined;
        const governance = (relKey ? governanceMap?.[relKey] : undefined) ?? governanceMap?.[file.path] ?? file.governance;
        // C1: retrieve original base content from meta for true three-way merge
        // Use relative key with fallback to absolute path for backward-compat
        const base = (relKey ? meta?.fileContents?.[relKey] : undefined) ?? meta?.fileContents?.[file.path] ?? null;
        results.push(await this.mergeFile(file, meta, base, governance, projectRoot));
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
      conflictDetails: 'Ambos (librería y equipo) modificaron este archivo. Se requiere revisión manual.',
    };
  }

  /** Merge markdown files by sections (## headers) with three-way base support */
  private mergeMarkdown(file: GeneratedFile, currentContent: string, base: string | null): MergeResult {
    const ourSections = this.parseMdSections(file.content);
    const theirSections = this.parseMdSections(currentContent);
    const baseSections = base ? this.parseMdSections(base) : null;

    const mergedSections = new Map<string, string>();

    // Gather all headings preserving order: team's file first (their edits matter),
    // then library additions, then base-only (for deletion detection)
    const allHeadings = new Set<string>([
      ...theirSections.keys(),
      ...ourSections.keys(),
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

    // Trim trailing whitespace from each section to avoid accumulating blank lines
    // (parseMdSections captures trailing blank lines as part of each section)
    const mergedContent = [...mergedSections.values()].map((s) => s.trimEnd()).join('\n\n');

    // If merge eliminated all content but both sides had content, flag as conflict
    if (!mergedContent.trim() && file.content.trim() && currentContent.trim()) {
      return {
        path: file.path,
        outcome: 'conflict',
        content: file.content,
        conflictDetails: 'El merge de secciones produjo contenido vacío. Se requiere revisión manual.',
      };
    }

    return {
      path: file.path,
      outcome: 'merged',
      content: mergedContent,
    };
  }

  /** Merge JSON files using three-way key-by-key comparison with base support */
  private mergeJson(file: GeneratedFile, currentContent: string, base: string | null): MergeResult {
    try {
      const normalizedCurrent = currentContent.replace(/\r\n/g, '\n');
      const ours = JSON.parse(file.content) as Record<string, unknown>;
      const theirs = JSON.parse(normalizedCurrent) as Record<string, unknown>;

      let merged: Record<string, unknown>;

      if (base) {
        try {
          const baseObj = JSON.parse(base) as Record<string, unknown>;
          merged = this.threeWayJsonMerge(baseObj, ours, theirs);
        } catch {
          // If base parse fails, fall back to two-way
          merged = deepmerge(ours, theirs) as Record<string, unknown>;
        }
      } else {
        // No base: deep merge ours + theirs (team wins for shared keys)
        merged = deepmerge(ours, theirs) as Record<string, unknown>;
      }

      // Deduplicate arrays in the merged result (deepmerge concatenates arrays)
      this.deduplicateArrays(merged);

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
        conflictDetails: 'No se pudo hacer merge de JSON. Se requiere revisión manual.',
      };
    }
  }

  /** True 3-way JSON merge: compare each key against base to determine who changed */
  private threeWayJsonMerge(
    base: Record<string, unknown>,
    ours: Record<string, unknown>,
    theirs: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const allKeys = new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)]);

    for (const key of allKeys) {
      const baseVal = base[key];
      const ourVal = ours[key];
      const theirVal = theirs[key];

      const baseJson = JSON.stringify(baseVal);
      const ourJson = JSON.stringify(ourVal);
      const theirJson = JSON.stringify(theirVal);

      const weChanged = ourJson !== baseJson;
      const theyChanged = theirJson !== baseJson;

      if (!weChanged && !theyChanged) {
        // Nobody changed - use base (or ours, they're the same)
        if (baseVal !== undefined) result[key] = baseVal;
      } else if (weChanged && !theyChanged) {
        // Only library changed - use ours
        if (ourVal !== undefined) result[key] = ourVal;
        // If ourVal is undefined, library deleted the key
      } else if (!weChanged && theyChanged) {
        // Only team changed - use theirs
        if (theirVal !== undefined) result[key] = theirVal;
        // If theirVal is undefined, team deleted the key
      } else {
        // Both changed - for nested objects, recurse; otherwise team wins
        if (
          baseVal && ourVal && theirVal &&
          typeof baseVal === 'object' && !Array.isArray(baseVal) &&
          typeof ourVal === 'object' && !Array.isArray(ourVal) &&
          typeof theirVal === 'object' && !Array.isArray(theirVal)
        ) {
          result[key] = this.threeWayJsonMerge(
            baseVal as Record<string, unknown>,
            ourVal as Record<string, unknown>,
            theirVal as Record<string, unknown>,
          );
        } else if (Array.isArray(ourVal) && Array.isArray(theirVal)) {
          // For arrays: union and deduplicate
          // Use JSON.stringify for value-based deduplication (works for both primitives and objects)
          const seen = new Set<string>();
          const combined: unknown[] = [];
          for (const item of [...ourVal, ...theirVal]) {
            const key2 = this.serializeForDedup(item);
            if (!seen.has(key2)) {
              seen.add(key2);
              combined.push(item);
            }
          }
          result[key] = combined;
        } else {
          // Scalar conflict: team wins (even if their value is null)
          result[key] = theirVal;
        }
      }
    }

    return result;
  }

  /** Serialize a value for dedup. Objects get sorted keys for order-independent comparison. */
  private serializeForDedup(item: unknown): string {
    if (typeof item !== 'object' || item === null) return String(item);
    const replacer = !Array.isArray(item)
      ? Object.keys(item as Record<string, unknown>).sort()
      : undefined;
    return JSON.stringify(item, replacer);
  }

  /** Recursively deduplicate arrays in a JSON object */
  private deduplicateArrays(obj: Record<string, unknown>): void {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (Array.isArray(val)) {
        if (val.every(item => typeof item !== 'object' || item === null)) {
          // Deduplicate arrays of primitives
          obj[key] = [...new Set(val)];
        } else {
          // Deduplicate arrays of objects using JSON.stringify with sorted keys
          const seen = new Set<string>();
          const deduped: unknown[] = [];
          for (const item of val) {
            const serialized = typeof item === 'object' && item !== null && !Array.isArray(item)
              ? JSON.stringify(item, Object.keys(item as Record<string, unknown>).sort())
              : JSON.stringify(item);
            if (!seen.has(serialized)) {
              seen.add(serialized);
              deduped.push(item);
            }
          }
          obj[key] = deduped;
        }
      } else if (val && typeof val === 'object') {
        this.deduplicateArrays(val as Record<string, unknown>);
      }
    }
  }

  /** Parse markdown into sections by ## headings.
   *  Duplicate headings get a suffix (__dup2, __dup3, ...) to preserve all sections. */
  private parseMdSections(content: string): Map<string, string> {
    const normalized = content.replace(/\r\n/g, '\n');
    const sections = new Map<string, string>();
    const headingCounts = new Map<string, number>();
    const lines = normalized.split('\n');
    let currentHeading = '__preamble__';
    let currentLines: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^##\s+(.+)/);
      if (headingMatch) {
        // Save previous section
        if (currentLines.length > 0) {
          sections.set(currentHeading, currentLines.join('\n'));
        }
        const rawHeading = headingMatch[1]!;
        const count = (headingCounts.get(rawHeading) ?? 0) + 1;
        headingCounts.set(rawHeading, count);
        currentHeading = count > 1 ? `${rawHeading}__dup${count}` : rawHeading;
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
