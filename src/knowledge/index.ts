import type { DetectedTechnology, KnowledgeResult } from '../core/types.js';
import { ClaudeApiClient } from './api-client.js';
import { KnowledgeCache } from './cache.js';
import { KNOWLEDGE_CACHE_TTL_DAYS } from '../core/constants.js';

/**
 * Knowledge engine facade.
 * Fetches best practices from Claude API with caching.
 */
export class KnowledgeEngine {
  private apiClient: ClaudeApiClient;
  private cache: KnowledgeCache | null = null;

  constructor() {
    this.apiClient = new ClaudeApiClient();
  }

  /** Initialize cache for a project */
  initCache(projectRoot: string): void {
    this.cache = new KnowledgeCache(projectRoot);
  }

  /** Fetch best practices for a detected technology */
  async fetchBestPractices(tech: DetectedTechnology): Promise<KnowledgeResult> {
    // Check cache first
    if (this.cache) {
      const cached = await this.cache.get(tech.name, 'best-practices');
      if (cached) return cached;
    }

    // Fetch from API
    const searchResult = await this.apiClient.searchBestPractices(
      tech.name,
      tech.version,
      'best-practices',
    );

    const result: KnowledgeResult = {
      technology: tech.name,
      content: searchResult.content,
      sources: searchResult.sources,
      fetchedAt: new Date().toISOString(),
      ttlDays: KNOWLEDGE_CACHE_TTL_DAYS,
    };

    // Store in cache
    if (this.cache) {
      await this.cache.set(result);
    }

    return result;
  }
}
