import type { DivergentMeta, GeneratedFile, MergeResult } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { hashMatches } from '../utils/hash.js';

/**
 * Three-way merge engine.
 * Compares BASE (original generated) vs THEIRS (current on disk) vs OURS (new generated).
 */
export class ThreeWayMerge {
  /** Perform three-way merge for a single file */
  async mergeFile(
    file: GeneratedFile,
    meta: DivergentMeta | null,
  ): Promise<MergeResult> {
    const storedHash = meta?.fileHashes[file.path];
    const currentContent = await readFileOrNull(file.path);

    // Case 1: File doesn't exist on disk → create
    if (currentContent === null) {
      return {
        path: file.path,
        outcome: 'auto-apply',
        content: file.content,
      };
    }

    // Case 2: No previous hash (first run or meta lost) → treat as conflict
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

    // Case 3: Nobody changed anything → skip
    if (baseMatchesCurrent && baseMatchesNew) {
      return { path: file.path, outcome: 'skip' };
    }

    // Case 4: Only library changed (team didn't touch it) → auto-apply
    if (baseMatchesCurrent && !baseMatchesNew) {
      return {
        path: file.path,
        outcome: 'auto-apply',
        content: file.content,
      };
    }

    // Case 5: Only team changed → keep their version
    if (!baseMatchesCurrent && baseMatchesNew) {
      return { path: file.path, outcome: 'keep' };
    }

    // Case 6: Both changed → attempt smart merge
    return this.attemptSmartMerge(file, currentContent);
  }

  /** Perform three-way merge for all files */
  async mergeAll(
    files: GeneratedFile[],
    meta: DivergentMeta | null,
  ): Promise<MergeResult[]> {
    const results: MergeResult[] = [];
    for (const file of files) {
      results.push(await this.mergeFile(file, meta));
    }
    return results;
  }

  /** Attempt a smart merge when both sides changed */
  private attemptSmartMerge(
    file: GeneratedFile,
    currentContent: string,
  ): MergeResult {
    // For markdown files: try section-based merge
    if (file.path.endsWith('.md')) {
      return this.mergeMarkdown(file, currentContent);
    }

    // For JSON files: try key-based merge
    if (file.path.endsWith('.json')) {
      return this.mergeJson(file, currentContent);
    }

    // For other files: report conflict
    return {
      path: file.path,
      outcome: 'conflict',
      content: file.content,
      conflictDetails: 'Ambos (librería y equipo) modificaron este archivo. Se requiere revisión manual.',
    };
  }

  /** Merge markdown files by sections (## headers) */
  private mergeMarkdown(file: GeneratedFile, currentContent: string): MergeResult {
    const ourSections = this.parseMdSections(file.content);
    const theirSections = this.parseMdSections(currentContent);

    // Merge: keep team's sections, add new library sections
    const mergedSections = new Map<string, string>();

    // Start with team's sections
    for (const [heading, content] of theirSections) {
      mergedSections.set(heading, content);
    }

    // Add new sections from library (don't overwrite team's)
    for (const [heading, content] of ourSections) {
      if (!mergedSections.has(heading)) {
        mergedSections.set(heading, content);
      }
    }

    const mergedContent = [...mergedSections.values()].join('\n\n');
    return {
      path: file.path,
      outcome: 'merged',
      content: mergedContent,
    };
  }

  /** Merge JSON files by top-level keys */
  private mergeJson(file: GeneratedFile, currentContent: string): MergeResult {
    try {
      const ours = JSON.parse(file.content) as Record<string, unknown>;
      const theirs = JSON.parse(currentContent) as Record<string, unknown>;

      // Simple merge: theirs on top of ours (team wins for shared keys)
      const merged = { ...ours, ...theirs };

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
