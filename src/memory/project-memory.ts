import { sha256 } from '../utils/hash.js';
import type {
  MemoryStore,
  ErrorPattern,
  ErrorPatternCategory,
  RepairLogEntry,
  EvolutionEntry,
  AntiPattern,
  AntiPatternSource,
  BestPractice,
} from '../core/types.js';

// --- Error Patterns ---

/** Add or update an error pattern, deduplicating by ID */
export function addErrorPattern(
  store: MemoryStore,
  input: {
    category: ErrorPatternCategory;
    tool?: string;
    matchPattern: string;
    description: string;
    resolution?: string;
  },
): ErrorPattern {
  const id = sha256(`${input.category}:${input.matchPattern}`).slice(0, 16);
  const now = new Date().toISOString();

  const existing = store.errorPatterns.find((p) => p.id === id);
  if (existing) {
    existing.occurrences += 1;
    existing.lastSeen = now;
    if (input.resolution) existing.resolution = input.resolution;
    return existing;
  }

  const pattern: ErrorPattern = {
    id,
    category: input.category,
    tool: input.tool,
    matchPattern: input.matchPattern,
    description: input.description,
    occurrences: 1,
    firstSeen: now,
    lastSeen: now,
    resolution: input.resolution,
    ruleGenerated: false,
  };
  store.errorPatterns.push(pattern);
  store.stats.totalErrorPatterns = store.errorPatterns.length;
  return pattern;
}

/** Query error patterns by category */
export function queryErrorPatterns(
  store: MemoryStore,
  category?: ErrorPatternCategory,
): ErrorPattern[] {
  if (!category) return [...store.errorPatterns];
  return store.errorPatterns.filter((p) => p.category === category);
}

/** Get the most frequent error patterns (sorted by occurrences desc) */
export function getTopErrorPatterns(store: MemoryStore, limit: number): ErrorPattern[] {
  return [...store.errorPatterns]
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, limit);
}

// --- Repair Log ---

/** Add a repair log entry */
export function addRepairLog(
  store: MemoryStore,
  entry: Omit<RepairLogEntry, 'timestamp'>,
): RepairLogEntry {
  const full: RepairLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  store.repairLog.push(full);
  store.stats.totalRepairs += 1;
  if (entry.success) store.stats.successfulRepairs += 1;
  return full;
}

// --- Evolution Log ---

/** Add an evolution log entry */
export function addEvolutionEntry(
  store: MemoryStore,
  entry: Omit<EvolutionEntry, 'timestamp'>,
): EvolutionEntry {
  const full: EvolutionEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  store.evolutionLog.push(full);
  return full;
}

// --- Anti-Patterns ---

/** Add or update an anti-pattern, deduplicating by ID */
export function addAntiPattern(
  store: MemoryStore,
  input: {
    pattern: string;
    reason: string;
    alternative: string;
    source: AntiPatternSource;
    confidence: number;
  },
): AntiPattern {
  const id = sha256(input.pattern).slice(0, 16);

  const existing = store.antiPatterns.find((a) => a.id === id);
  if (existing) {
    // Update with higher confidence if applicable
    if (input.confidence > existing.confidence) {
      existing.confidence = input.confidence;
      existing.reason = input.reason;
      existing.alternative = input.alternative;
    }
    existing.learnedAt = new Date().toISOString();
    return existing;
  }

  const antiPattern: AntiPattern = {
    id,
    pattern: input.pattern,
    reason: input.reason,
    alternative: input.alternative,
    source: input.source,
    confidence: input.confidence,
    learnedAt: new Date().toISOString(),
  };
  store.antiPatterns.push(antiPattern);
  return antiPattern;
}

/** Get anti-patterns sorted by confidence desc */
export function getTopAntiPatterns(store: MemoryStore, limit: number): AntiPattern[] {
  return [...store.antiPatterns]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

// --- Best Practices ---

/** Add or update a best practice, deduplicating by ID */
export function addBestPractice(
  store: MemoryStore,
  input: {
    practice: string;
    reason: string;
    source: AntiPatternSource;
    confidence: number;
  },
): BestPractice {
  const id = sha256(input.practice).slice(0, 16);

  const existing = store.bestPractices.find((b) => b.id === id);
  if (existing) {
    if (input.confidence > existing.confidence) {
      existing.confidence = input.confidence;
      existing.reason = input.reason;
    }
    existing.learnedAt = new Date().toISOString();
    return existing;
  }

  const bestPractice: BestPractice = {
    id,
    practice: input.practice,
    reason: input.reason,
    source: input.source,
    confidence: input.confidence,
    learnedAt: new Date().toISOString(),
  };
  store.bestPractices.push(bestPractice);
  return bestPractice;
}

// --- Stats ---

/** Increment session counter */
export function incrementSessions(store: MemoryStore): void {
  store.stats.totalSessions += 1;
  const now = new Date().toISOString();
  if (!store.stats.firstSession) store.stats.firstSession = now;
  store.stats.lastSession = now;
}
