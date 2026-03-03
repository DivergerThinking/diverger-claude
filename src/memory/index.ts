import type {
  MemoryStore,
  ErrorPatternCategory,
  AntiPatternSource,
} from '../core/types.js';
import { MEMORY_CONSOLIDATION_INTERVAL_DAYS } from '../core/constants.js';
import { loadProjectMemory, saveProjectMemory } from './store.js';
import {
  addErrorPattern,
  addRepairLog,
  addEvolutionEntry,
  addAntiPattern,
  addBestPractice,
  incrementSessions,
  getTopAntiPatterns,
  getTopErrorPatterns,
  queryErrorPatterns,
} from './project-memory.js';
import { importGlobalLearnings } from './global-memory.js';
import { pruneMemory, isConsolidationDue } from './pruner.js';
import { syncToClaudeMemory } from './claude-memory-sync.js';

/**
 * MemoryEngine — Facade for the memory intelligence layer.
 *
 * Manages project-level behavioral memory: error patterns,
 * repair logs, anti-patterns, best practices, and stats.
 */
export class MemoryEngine {
  private store: MemoryStore | null = null;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /** Load memory from disk (or return cached) */
  async load(): Promise<MemoryStore> {
    if (!this.store) {
      this.store = await loadProjectMemory(this.projectRoot);
    }
    return this.store;
  }

  /** Save memory to disk */
  async save(): Promise<void> {
    if (this.store) {
      await saveProjectMemory(this.projectRoot, this.store);
    }
  }

  /** Record a new session start */
  async onSessionStart(): Promise<void> {
    const store = await this.load();
    incrementSessions(store);

    // Import global learnings if this is a fresh store
    if (store.stats.totalSessions <= 1) {
      await importGlobalLearnings(store);
    }

    // Run consolidation if due
    if (isConsolidationDue(store, MEMORY_CONSOLIDATION_INTERVAL_DAYS)) {
      pruneMemory(store);
    }

    await this.save();
  }

  /** Record an error pattern */
  async recordError(input: {
    category: ErrorPatternCategory;
    tool?: string;
    matchPattern: string;
    description: string;
    resolution?: string;
  }): Promise<void> {
    const store = await this.load();
    addErrorPattern(store, input);
    await this.save();
  }

  /** Record a repair action */
  async recordRepair(input: {
    diagnosisId: string;
    description: string;
    success: boolean;
    confidence: number;
  }): Promise<void> {
    const store = await this.load();
    addRepairLog(store, input);
    await this.save();
  }

  /** Record a project evolution event */
  async recordEvolution(input: {
    type: 'dependency-added' | 'dependency-removed' | 'architecture-change' | 'profile-added' | 'profile-removed';
    description: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const store = await this.load();
    addEvolutionEntry(store, input);
    await this.save();
  }

  /** Record an anti-pattern */
  async recordAntiPattern(input: {
    pattern: string;
    reason: string;
    alternative: string;
    source: AntiPatternSource;
    confidence: number;
  }): Promise<void> {
    const store = await this.load();
    addAntiPattern(store, input);
    await this.save();
  }

  /** Record a best practice */
  async recordBestPractice(input: {
    practice: string;
    reason: string;
    source: AntiPatternSource;
    confidence: number;
  }): Promise<void> {
    const store = await this.load();
    addBestPractice(store, input);
    await this.save();
  }

  /** Get top anti-patterns for context injection */
  async getAntiPatterns(limit = 5): Promise<ReturnType<typeof getTopAntiPatterns>> {
    const store = await this.load();
    return getTopAntiPatterns(store, limit);
  }

  /** Get top error patterns */
  async getErrorPatterns(limit = 10): Promise<ReturnType<typeof getTopErrorPatterns>> {
    const store = await this.load();
    return getTopErrorPatterns(store, limit);
  }

  /** Query error patterns by category */
  async queryErrors(category?: ErrorPatternCategory): Promise<ReturnType<typeof queryErrorPatterns>> {
    const store = await this.load();
    return queryErrorPatterns(store, category);
  }

  /** Get the full memory store (for MCP tool) */
  async getStore(): Promise<MemoryStore> {
    return this.load();
  }

  /** Sync learnings to Claude Code auto-memory */
  async syncToClaudeMemory(): Promise<void> {
    const store = await this.load();
    await syncToClaudeMemory(this.projectRoot, store);
  }

  /** Force a consolidation/prune */
  async consolidate(): Promise<void> {
    const store = await this.load();
    pruneMemory(store);
    await this.save();
  }
}

// Re-exports for direct use
export { loadProjectMemory, saveProjectMemory, loadGlobalMemory, saveGlobalMemory } from './store.js';
export { syncToClaudeMemory } from './claude-memory-sync.js';
export { pruneMemory, isConsolidationDue } from './pruner.js';
