import path from 'path';
import os from 'os';
import type { MemoryStore } from '../core/types.js';
import {
  MEMORY_FILE,
  GLOBAL_MEMORY_DIR,
  GLOBAL_MEMORY_FILE,
} from '../core/constants.js';
import { readJsonOrNull, writeFileAtomic } from '../utils/fs.js';

/** Create a default empty memory store */
export function createDefaultMemoryStore(): MemoryStore {
  return {
    schemaVersion: 1,
    errorPatterns: [],
    repairLog: [],
    evolutionLog: [],
    antiPatterns: [],
    bestPractices: [],
    stats: {
      totalSessions: 0,
      totalRepairs: 0,
      successfulRepairs: 0,
      totalErrorPatterns: 0,
      rulesGenerated: 0,
    },
  };
}

/** Migrate older schema versions to current */
export function migrateMemoryStore(raw: Record<string, unknown>): MemoryStore {
  const defaults = createDefaultMemoryStore();

  // Currently only schemaVersion 1 exists.
  // Future migrations go here: if (raw.schemaVersion === 0) { ... }

  return {
    schemaVersion: 1,
    errorPatterns: Array.isArray(raw.errorPatterns) ? raw.errorPatterns : defaults.errorPatterns,
    repairLog: Array.isArray(raw.repairLog) ? raw.repairLog : defaults.repairLog,
    evolutionLog: Array.isArray(raw.evolutionLog) ? raw.evolutionLog : defaults.evolutionLog,
    antiPatterns: Array.isArray(raw.antiPatterns) ? raw.antiPatterns : defaults.antiPatterns,
    bestPractices: Array.isArray(raw.bestPractices) ? raw.bestPractices : defaults.bestPractices,
    stats: typeof raw.stats === 'object' && raw.stats !== null
      ? { ...defaults.stats, ...(raw.stats as Record<string, unknown>) }
      : defaults.stats,
  } as MemoryStore;
}

/** Load memory store from a project directory */
export async function loadProjectMemory(projectRoot: string): Promise<MemoryStore> {
  const filePath = path.join(projectRoot, MEMORY_FILE);
  const raw = await readJsonOrNull<Record<string, unknown>>(filePath);
  if (!raw) return createDefaultMemoryStore();
  return migrateMemoryStore(raw);
}

/** Save memory store to a project directory */
export async function saveProjectMemory(projectRoot: string, store: MemoryStore): Promise<void> {
  const filePath = path.join(projectRoot, MEMORY_FILE);
  await writeFileAtomic(filePath, JSON.stringify(store, null, 2) + '\n');
}

/** Get global memory file path */
export function globalMemoryPath(): string {
  return path.join(os.homedir(), GLOBAL_MEMORY_DIR, GLOBAL_MEMORY_FILE);
}

/** Load global memory store (cross-project learnings) */
export async function loadGlobalMemory(): Promise<MemoryStore> {
  const raw = await readJsonOrNull<Record<string, unknown>>(globalMemoryPath());
  if (!raw) return createDefaultMemoryStore();
  return migrateMemoryStore(raw);
}

/** Save global memory store */
export async function saveGlobalMemory(store: MemoryStore): Promise<void> {
  await writeFileAtomic(globalMemoryPath(), JSON.stringify(store, null, 2) + '\n');
}
