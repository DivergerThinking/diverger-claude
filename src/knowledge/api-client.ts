import Anthropic from '@anthropic-ai/sdk';
import { ApiKeyError, KnowledgeError } from '../core/errors.js';
import { bestPracticesPrompt, securityPrompt, performancePrompt } from './prompts.js';

/** Default model for knowledge queries; override via DIVERGER_MODEL env var */
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

interface SearchResult {
  content: string;
  sources: string[];
}

/** Web search tool definition for the Anthropic API (not yet typed in SDK v0.39) */
interface WebSearchTool {
  type: 'web_search_20250305';
  name: 'web_search';
  max_uses: number;
}

/** Resolve the prompt template based on the aspect */
function resolvePrompt(technology: string, version?: string, aspect: string = 'best-practices'): string {
  switch (aspect) {
    case 'security':
      return securityPrompt(technology, version);
    case 'performance':
      return performancePrompt(technology, version);
    case 'best-practices':
    default:
      return bestPracticesPrompt(technology, version);
  }
}

/** Client for Claude API with web search capability */
export class ClaudeApiClient {
  private client: Anthropic | null = null;
  private model: string;

  constructor() {
    this.model = process.env.DIVERGER_MODEL ?? DEFAULT_MODEL;
  }

  /** Get or create the Anthropic client */
  private getClient(): Anthropic {
    if (this.client) return this.client;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ApiKeyError();
    }

    this.client = new Anthropic({ apiKey });
    return this.client;
  }

  /** Search for best practices of a technology using Claude with web search */
  async searchBestPractices(
    technology: string,
    version?: string,
    aspect: string = 'best-practices',
  ): Promise<SearchResult> {
    const client = this.getClient();

    const prompt = resolvePrompt(technology, version, aspect);

    // Web search tool is not yet typed in the SDK, so we cast
    const webSearchTool: WebSearchTool = {
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
    };

    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 4096,
        tools: [webSearchTool as unknown as Anthropic.Messages.Tool],
        messages: [{ role: 'user', content: prompt }],
      });

      // Collect all text from text blocks and extract URLs from web search results
      const textParts: string[] = [];
      const sources: string[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        }
        // Extract URLs from web_search_tool_result blocks (untyped in this SDK version)
        const anyBlock = block as unknown as { type: string; content?: Array<{ type: string; url?: string }> };
        if (anyBlock.type === 'web_search_tool_result' && Array.isArray(anyBlock.content)) {
          for (const entry of anyBlock.content) {
            if (entry.url) {
              sources.push(entry.url);
            }
          }
        }
      }

      const fullText = textParts.join('\n\n');
      if (!fullText) {
        throw new KnowledgeError('No se recibió respuesta de texto de la API');
      }

      // Deduplicate sources
      const uniqueSources = [...new Set(sources)];

      return {
        content: fullText,
        sources: uniqueSources,
      };
    } catch (err) {
      if (err instanceof ApiKeyError || err instanceof KnowledgeError) throw err;

      // Handle specific Anthropic SDK errors
      if (err instanceof Anthropic.AuthenticationError) {
        throw new ApiKeyError();
      }

      if (err instanceof Anthropic.RateLimitError) {
        const retryAfter = err.headers?.['retry-after'];
        const waitSecs = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new KnowledgeError(
          `Rate limit alcanzado. Reintentar después de ${waitSecs} segundos.`,
        );
      }

      if (err instanceof Anthropic.APIConnectionError) {
        throw new KnowledgeError(
          `Error de conexión a Claude API. Verificar red e intentar de nuevo.`,
        );
      }

      const msg = err instanceof Error ? err.message : String(err);
      throw new KnowledgeError(`Error al consultar Claude API: ${msg}`);
    }
  }
}
