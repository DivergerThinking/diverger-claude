import type { KnowledgeResult } from '../core/types.js';
import { KNOWLEDGE_CACHE_DIR, KNOWLEDGE_CACHE_TTL_DAYS } from '../core/constants.js';
import { ensureDir, readJsonOrNull, writeFileAtomic } from '../utils/fs.js';
import { sha256 } from '../utils/hash.js';
import path from 'path';

/** File-based cache for knowledge search results */
export class KnowledgeCache {
  private cacheDir: string;

  constructor(projectRoot: string) {
    this.cacheDir = path.join(projectRoot, KNOWLEDGE_CACHE_DIR);
  }

  /** Get a cached result, or null if not found/expired */
  async get(technology: string, aspect: string): Promise<KnowledgeResult | null> {
    const key = this.cacheKey(technology, aspect);
    const filePath = path.join(this.cacheDir, `${key}.json`);

    const cached = await readJsonOrNull<KnowledgeResult>(filePath);
    if (!cached) return null;

    // Check TTL
    const fetchedAt = new Date(cached.fetchedAt);
    // A9: Validate that fetchedAt produces a valid date
    if (isNaN(fetchedAt.getTime())) {
      return null; // Invalid date string
    }
    const now = new Date();
    const daysDiff = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);

    // A9: Reject future dates (negative daysDiff)
    if (daysDiff < 0) {
      return null;
    }

    if (daysDiff > (cached.ttlDays ?? KNOWLEDGE_CACHE_TTL_DAYS)) {
      return null; // Expired
    }

    return cached;
  }

  /** Store a result in cache */
  async set(result: KnowledgeResult, aspect: string = 'best-practices'): Promise<void> {
    const key = this.cacheKey(result.technology, aspect);
    const filePath = path.join(this.cacheDir, `${key}.json`);
    await ensureDir(this.cacheDir);
    await writeFileAtomic(filePath, JSON.stringify(result, null, 2));
  }

  private cacheKey(technology: string, aspect: string): string {
    return sha256(`${technology}:${aspect}`).slice(0, 16);
  }
}
