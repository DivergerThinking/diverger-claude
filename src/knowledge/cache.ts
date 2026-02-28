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
    const now = new Date();
    const daysDiff = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > (cached.ttlDays ?? KNOWLEDGE_CACHE_TTL_DAYS)) {
      return null; // Expired
    }

    return cached;
  }

  /** Store a result in cache */
  async set(result: KnowledgeResult): Promise<void> {
    const key = this.cacheKey(result.technology, 'best-practices');
    const filePath = path.join(this.cacheDir, `${key}.json`);
    await ensureDir(this.cacheDir);
    await writeFileAtomic(filePath, JSON.stringify(result, null, 2));
  }

  private cacheKey(technology: string, aspect: string): string {
    return sha256(`${technology}:${aspect}`).slice(0, 16);
  }
}
