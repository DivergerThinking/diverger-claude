import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock @anthropic-ai/sdk ──────────────────────────────────────────────────
// vi.mock factories are hoisted, so we must define everything inline.
// Use vi.hoisted to create shared references accessible inside the factory.

const { mockCreate, MockAuthenticationError, MockRateLimitError, MockAPIConnectionError, MockAPIConnectionTimeoutError, MockBadRequestError } =
  vi.hoisted(() => {
    const mockCreate = vi.fn();

    class MockAuthenticationError extends Error {
      constructor() {
        super('Authentication failed');
        this.name = 'AuthenticationError';
      }
    }

    class MockRateLimitError extends Error {
      headers: Record<string, string>;
      constructor(headers: Record<string, string> = {}) {
        super('Rate limit exceeded');
        this.name = 'RateLimitError';
        this.headers = headers;
      }
    }

    class MockAPIConnectionError extends Error {
      constructor() {
        super('Connection failed');
        this.name = 'APIConnectionError';
      }
    }

    class MockAPIConnectionTimeoutError extends Error {
      constructor() {
        super('Connection timed out');
        this.name = 'APIConnectionTimeoutError';
      }
    }

    class MockBadRequestError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
      }
    }

    return { mockCreate, MockAuthenticationError, MockRateLimitError, MockAPIConnectionError, MockAPIConnectionTimeoutError, MockBadRequestError };
  });

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));

  // Attach static error classes to the constructor (matches real SDK shape)
  Object.assign(MockAnthropic, {
    AuthenticationError: MockAuthenticationError,
    RateLimitError: MockRateLimitError,
    APIConnectionError: MockAPIConnectionError,
    APIConnectionTimeoutError: MockAPIConnectionTimeoutError,
    BadRequestError: MockBadRequestError,
  });

  return { default: MockAnthropic };
});

import { ClaudeApiClient } from '../../../src/knowledge/api-client.js';
import { ApiKeyError, BillingError, KnowledgeError } from '../../../src/core/errors.js';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClaudeApiClient', () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
    // Always start clean: set a valid API key by default
    process.env.ANTHROPIC_API_KEY = 'test-key-123';
    delete process.env.DIVERGER_MODEL;
    mockCreate.mockReset();
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Build a mock API response with text blocks and optional web search result blocks */
  function makeResponse(
    textBlocks: string[],
    webSearchResults: Array<{ url: string }>[] = [],
  ) {
    const content: unknown[] = textBlocks.map((text) => ({ type: 'text', text }));
    for (const entries of webSearchResults) {
      content.push({
        type: 'web_search_tool_result',
        content: entries.map((e) => ({ type: 'web_search_result', url: e.url })),
      });
    }
    return { content };
  }

  // ── 1. Throws ApiKeyError when ANTHROPIC_API_KEY not set ────────────────

  describe('API key validation', () => {
    it('should throw ApiKeyError when ANTHROPIC_API_KEY is not set', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const client = new ClaudeApiClient();

      await expect(client.searchBestPractices('React')).rejects.toThrow(ApiKeyError);
    });
  });

  // ── 2 & 3. Model selection ──────────────────────────────────────────────

  describe('model selection', () => {
    it('should use DIVERGER_MODEL env var when set', async () => {
      process.env.DIVERGER_MODEL = 'claude-opus-4-20250514';
      mockCreate.mockResolvedValue(makeResponse(['Best practices']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('React');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-opus-4-20250514' }),
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
    });

    it('should use default model when DIVERGER_MODEL is not set', async () => {
      mockCreate.mockResolvedValue(makeResponse(['Best practices']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('React');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-sonnet-4-20250514' }),
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
    });
  });

  // ── 4, 5, 6. Successful response handling ──────────────────────────────

  describe('successful response handling', () => {
    it('should extract and join text from multiple text blocks', async () => {
      mockCreate.mockResolvedValue(makeResponse(['Part 1', 'Part 2']));

      const client = new ClaudeApiClient();
      const result = await client.searchBestPractices('React');

      expect(result.content).toBe('Part 1\n\nPart 2');
    });

    it('should extract URLs from web_search_tool_result blocks', async () => {
      mockCreate.mockResolvedValue(
        makeResponse(
          ['Best practices for React'],
          [[{ url: 'https://react.dev' }, { url: 'https://example.com/react' }]],
        ),
      );

      const client = new ClaudeApiClient();
      const result = await client.searchBestPractices('React');

      expect(result.sources).toEqual(['https://react.dev', 'https://example.com/react']);
    });

    it('should deduplicate sources from multiple web search result blocks', async () => {
      mockCreate.mockResolvedValue(
        makeResponse(
          ['Content here'],
          [
            [{ url: 'https://react.dev' }, { url: 'https://example.com' }],
            [{ url: 'https://react.dev' }, { url: 'https://other.com' }],
          ],
        ),
      );

      const client = new ClaudeApiClient();
      const result = await client.searchBestPractices('React');

      expect(result.sources).toEqual([
        'https://react.dev',
        'https://example.com',
        'https://other.com',
      ]);
    });
  });

  // ── 7–11. Error handling ───────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw KnowledgeError when no text blocks in response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'web_search_tool_result',
            content: [{ type: 'web_search_result', url: 'https://example.com' }],
          },
        ],
      });

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(KnowledgeError);
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'No se recibió respuesta de texto de la API',
      );
    });

    it('should throw ApiKeyError on Anthropic AuthenticationError', async () => {
      mockCreate.mockRejectedValue(new MockAuthenticationError());

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(ApiKeyError);
    });

    it('should throw KnowledgeError with retry-after on RateLimitError', async () => {
      mockCreate.mockRejectedValue(
        new MockRateLimitError({ 'retry-after': '30' }),
      );

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(KnowledgeError);
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'Rate limit alcanzado. Reintentar después de 30 segundos.',
      );
    });

    it('should default to 60 seconds when retry-after header is missing', async () => {
      mockCreate.mockRejectedValue(new MockRateLimitError({}));

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'Rate limit alcanzado. Reintentar después de 60 segundos.',
      );
    });

    it('should throw KnowledgeError on Anthropic APIConnectionError', async () => {
      mockCreate.mockRejectedValue(new MockAPIConnectionError());

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(KnowledgeError);
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'Error de conexión a Claude API. Verificar red e intentar de nuevo.',
      );
    });

    it('should throw BillingError when credit balance is too low', async () => {
      mockCreate.mockRejectedValue(
        new MockBadRequestError('400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API."}}'),
      );

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(BillingError);
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'Sin créditos en la cuenta de Anthropic API',
      );
    });

    it('should throw KnowledgeError for non-billing BadRequestError', async () => {
      mockCreate.mockRejectedValue(
        new MockBadRequestError('400 some other bad request error'),
      );

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(KnowledgeError);
    });

    it('should throw KnowledgeError on API timeout', async () => {
      mockCreate.mockRejectedValue(new MockAPIConnectionTimeoutError());

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(KnowledgeError);
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'Timeout al consultar Claude API',
      );
    });

    it('should wrap generic Error as KnowledgeError', async () => {
      mockCreate.mockRejectedValue(new Error('network timeout'));

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(KnowledgeError);
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'Error al consultar Claude API: network timeout',
      );
    });

    it('should wrap non-Error thrown values as KnowledgeError', async () => {
      mockCreate.mockRejectedValue('raw string error');

      const client = new ClaudeApiClient();
      await expect(client.searchBestPractices('React')).rejects.toThrow(KnowledgeError);
      await expect(client.searchBestPractices('React')).rejects.toThrow(
        'Error al consultar Claude API: raw string error',
      );
    });

    it('should re-throw ApiKeyError from getClient without wrapping', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const client = new ClaudeApiClient();

      await expect(client.searchBestPractices('React')).rejects.toThrow(ApiKeyError);
      // Ensure it is NOT wrapped in KnowledgeError
      try {
        await client.searchBestPractices('React');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiKeyError);
        expect(err).not.toBeInstanceOf(KnowledgeError);
      }
    });
  });

  // ── 12. Prompt resolution: best-practices, security, performance ────────

  describe('prompt resolution by aspect', () => {
    it('should use best-practices prompt by default', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('React', '18');

      const call = mockCreate.mock.calls[0]![0];
      const userMessage = call.messages[0].content as string;
      expect(userMessage).toContain('best practices and coding conventions');
      expect(userMessage).toContain('React');
      expect(userMessage).toContain('18');
    });

    it('should use security prompt when aspect is "security"', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('Node.js', '20', 'security');

      const call = mockCreate.mock.calls[0]![0];
      const userMessage = call.messages[0].content as string;
      expect(userMessage).toContain('security best practices');
      expect(userMessage).toContain('Node.js');
      expect(userMessage).toContain('20');
    });

    it('should use performance prompt when aspect is "performance"', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('Python', '3.12', 'performance');

      const call = mockCreate.mock.calls[0]![0];
      const userMessage = call.messages[0].content as string;
      expect(userMessage).toContain('performance optimization best practices');
      expect(userMessage).toContain('Python');
      expect(userMessage).toContain('3.12');
    });

    it('should fall back to best-practices for unknown aspect', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('Go', undefined, 'unknown-aspect');

      const call = mockCreate.mock.calls[0]![0];
      const userMessage = call.messages[0].content as string;
      expect(userMessage).toContain('best practices and coding conventions');
      expect(userMessage).toContain('Go');
    });

    it('should omit version from prompt when version is undefined', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('Rust');

      const call = mockCreate.mock.calls[0]![0];
      const userMessage = call.messages[0].content as string;
      expect(userMessage).toContain('Rust');
      // The prompt should end with "Rust?" (no trailing version string)
      expect(userMessage).toContain('for Rust?');
    });
  });

  // ── API call shape ──────────────────────────────────────────────────────

  describe('API call configuration', () => {
    it('should pass web_search tool and correct max_tokens', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('React');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4096,
          tools: [
            expect.objectContaining({
              type: 'web_search_20250305',
              name: 'web_search',
              max_uses: 5,
            }),
          ],
        }),
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
    });

    it('should send user message with the resolved prompt', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('React');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: expect.any(String) }],
        }),
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
    });

    it('should set a timeout on API calls', async () => {
      mockCreate.mockResolvedValue(makeResponse(['content']));

      const client = new ClaudeApiClient();
      await client.searchBestPractices('React');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ timeout: 90000 }),
      );
    });
  });
});
