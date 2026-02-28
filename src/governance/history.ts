import type { DivergentMeta, GeneratedFile, GovernanceLevel } from '../core/types.js';
import { META_FILE } from '../core/constants.js';
import { readFileOrNull, writeFileAtomic } from '../utils/fs.js';
import { hashForMeta } from '../utils/hash.js';
import path from 'path';

/** Package version injected at build time via tsup define */
const PACKAGE_VERSION = process.env.DIVERGER_VERSION ?? '0.0.0';

/** Load the .diverger-meta.json from a project.
 *  Returns null if file doesn't exist. Throws if file is corrupt (parse error). */
export async function loadMeta(projectRoot: string): Promise<DivergentMeta | null> {
  const content = await readFileOrNull(path.join(projectRoot, META_FILE));
  if (content === null) return null;
  try {
    return JSON.parse(content) as DivergentMeta;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${META_FILE} esta corrupto: ${msg}. Elimina el archivo y ejecuta 'diverger init --force' para regenerar.`,
    );
  }
}

/** Save the .diverger-meta.json to a project */
export async function saveMeta(
  projectRoot: string,
  meta: DivergentMeta,
): Promise<void> {
  await writeFileAtomic(
    path.join(projectRoot, META_FILE),
    JSON.stringify(meta, null, 2) + '\n',
  );
}

/** Create metadata from a set of generated files */
export function createMeta(
  files: GeneratedFile[],
  detectedStack: string[],
  appliedProfiles: string[],
  ruleGovernance: Record<string, GovernanceLevel>,
  trackedDependencies?: string[],
): DivergentMeta {
  const fileHashes: Record<string, string> = {};
  const fileContents: Record<string, string> = {};

  for (const file of files) {
    fileHashes[file.path] = hashForMeta(file.content);
    fileContents[file.path] = file.content;
  }

  return {
    version: PACKAGE_VERSION,
    generatedAt: new Date().toISOString(),
    detectedStack,
    appliedProfiles,
    fileHashes,
    ruleGovernance,
    fileContents,
    trackedDependencies,
  };
}

/**
 * Update meta hashes and contents to reflect what was actually written to disk (C3).
 * Call this AFTER writing files so the meta matches the on-disk state.
 *
 * For files that were NOT written (keep, conflict-theirs, conflict-manual, error),
 * we preserve the OLD meta's hash/content so the three-way merge base stays correct.
 * Only files in writtenFiles get updated to reflect the new on-disk state.
 */
export function finalizeMetaAfterWrite(
  meta: DivergentMeta,
  writtenFiles: Array<{ path: string; content: string }>,
  oldMeta?: DivergentMeta | null,
): DivergentMeta {
  // Start from old meta's hashes/contents (what was on disk before this sync).
  // This preserves correct base values for files we did NOT write.
  const baseHashes = oldMeta?.fileHashes ?? {};
  const baseContents = oldMeta?.fileContents ?? {};

  const updatedHashes: Record<string, string> = { ...baseHashes };
  const updatedContents: Record<string, string> = { ...baseContents };

  // Include entries from pendingMeta for NEW files not in oldMeta and not in writtenFiles.
  // This covers files with 'skip' outcome (content matches disk) that are new to diverger.
  for (const [filePath, hash] of Object.entries(meta.fileHashes)) {
    if (!(filePath in updatedHashes)) {
      updatedHashes[filePath] = hash;
    }
  }
  for (const [filePath, content] of Object.entries(meta.fileContents ?? {})) {
    if (!(filePath in updatedContents)) {
      updatedContents[filePath] = content;
    }
  }

  // Override with actually written content — this is the source of truth
  for (const file of writtenFiles) {
    updatedHashes[file.path] = hashForMeta(file.content);
    updatedContents[file.path] = file.content;
  }

  return {
    ...meta,
    fileHashes: updatedHashes,
    fileContents: updatedContents,
  };
}
