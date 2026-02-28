import Anthropic from '@anthropic-ai/sdk';
import { ApiKeyError, KnowledgeError } from '../core/errors.js';

interface SearchResult {
  content: string;
  sources: string[];
}

/** Client for Claude API with web search capability */
export class ClaudeApiClient {
  private client: Anthropic | null = null;

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

    const versionStr = version ? ` version ${version}` : '';
    const prompt = `Search the web for the latest ${aspect} for ${technology}${versionStr}.
Focus on:
- Official documentation recommendations
- Community-accepted best practices
- Security considerations
- Performance optimization patterns
- Common pitfalls to avoid

Synthesize the findings into a concise, actionable set of rules and guidelines.
Format as markdown with clear sections.
Include the source URLs you found.`;

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new KnowledgeError('No se recibió respuesta de texto de la API');
      }

      // Extract sources from the response (URLs mentioned)
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const sources = [...new Set(textContent.text.match(urlRegex) ?? [])];

      return {
        content: textContent.text,
        sources,
      };
    } catch (err) {
      if (err instanceof ApiKeyError || err instanceof KnowledgeError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new KnowledgeError(`Error al consultar Claude API: ${msg}`);
    }
  }
}
