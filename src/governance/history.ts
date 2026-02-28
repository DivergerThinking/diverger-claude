import type { DivergentMeta, GeneratedFile, GovernanceLevel } from '../core/types.js';
import { META_FILE } from '../core/constants.js';
import { readJsonOrNull, writeFileAtomic } from '../utils/fs.js';
import { hashForMeta } from '../utils/hash.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

/** Read the package version dynamically from package.json */
function getPackageVersion(): string {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const pkgPath = path.join(thisDir, '..', '..', 'package.json');
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

const PACKAGE_VERSION = getPackageVersion();

/** Load the .diverger-meta.json from a project */
export async function loadMeta(projectRoot: string): Promise<DivergentMeta | null> {
  return readJsonOrNull<DivergentMeta>(path.join(projectRoot, META_FILE));
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
): DivergentMeta {
  const fileHashes: Record<string, string> = {};

  for (const file of files) {
    fileHashes[file.path] = hashForMeta(file.content);
  }

  return {
    version: PACKAGE_VERSION,
    generatedAt: new Date().toISOString(),
    detectedStack,
    appliedProfiles,
    fileHashes,
    ruleGovernance,
  };
}
