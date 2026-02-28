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

  /** Check if a version string is a valid semver-like version (not a URL, path, or alias) */
  private isUsableVersion(version?: string): boolean {
    if (!version) return false;
    // Reject non-version strings: URLs, paths, workspace protocols, aliases
    return /^\d/.test(version) && !version.includes('://');
  }

  /** Fetch best practices for a detected technology */
  async fetchBestPractices(tech: DetectedTechnology): Promise<KnowledgeResult> {
    // Check cache first
    if (this.cache) {
      const cached = await this.cache.get(tech.name, 'best-practices');
      if (cached) return cached;
    }

    // Only pass version to API if it's a valid semver-like string
    const version = this.isUsableVersion(tech.version) ? tech.version : undefined;

    // Fetch from API
    const searchResult = await this.apiClient.searchBestPractices(
      tech.name,
      version,
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
