import { describe, it, expect } from 'vitest';
import { classifyError, classifyErrors } from '../../../src/learning/error-analyzer.js';

describe('Error Analyzer', () => {
  describe('classifyError', () => {
    it('should classify permission denied as tool-error', () => {
      const result = classifyError('Error: permission denied /some/path', 'Bash');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('tool-error');
      expect(result!.confidence).toBe(80);
      expect(result!.tool).toBe('Bash');
    });

    it('should classify EACCES as tool-error', () => {
      const result = classifyError('EACCES: permission denied, open /dist/main.js');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('tool-error');
    });

    it('should classify cannot find module as code-pattern', () => {
      const result = classifyError("Cannot find module '@/utils/helpers'");
      expect(result).not.toBeNull();
      expect(result!.category).toBe('code-pattern');
      expect(result!.description).toContain('@/utils/helpers');
    });

    it('should classify TypeScript errors', () => {
      const result = classifyError('TS2345: Argument of type string is not assignable');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('code-pattern');
      expect(result!.description).toContain('TS2345');
    });

    it('should classify hook failures', () => {
      const result = classifyError('hook pre-commit failed with exit code 1');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('hook-failure');
      expect(result!.confidence).toBe(85);
    });

    it('should classify JSON parse errors as config-issue', () => {
      const result = classifyError('Unexpected token in JSON at position 0');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('config-issue');
    });

    it('should classify ENOENT as tool-error', () => {
      const result = classifyError('ENOENT: no such file or directory');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('tool-error');
    });

    it('should classify timeout errors', () => {
      const result = classifyError('request timeout after 30000ms');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('tool-error');
    });

    it('should return unclassified fallback for unrecognized errors', () => {
      const result = classifyError('Something completely unknown happened');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('tool-error');
      expect(result!.confidence).toBe(30);
      expect(result!.matchPattern).toBe('unclassified');
      expect(result!.description).toContain('Error no clasificado');
    });

    it('should truncate long messages in unclassified description', () => {
      const longMessage = 'A'.repeat(200);
      const result = classifyError(longMessage);
      expect(result).not.toBeNull();
      expect(result!.description.length).toBeLessThan(120);
    });

    it('should classify SyntaxError', () => {
      const result = classifyError('SyntaxError: Unexpected end of input');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('code-pattern');
    });
  });

  describe('classifyErrors', () => {
    it('should classify multiple errors including unclassified fallback', () => {
      const errors = [
        { message: 'permission denied /file', tool: 'Bash' },
        { message: 'TS2345: type error' },
        { message: 'Unknown error xyz' },
      ];
      const results = classifyErrors(errors);
      expect(results).toHaveLength(3); // All classified (third as unclassified fallback)
      expect(results[2].matchPattern).toBe('unclassified');
    });

    it('should classify all errors with at least unclassified', () => {
      const results = classifyErrors([{ message: 'all good' }]);
      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(30);
    });
  });
});
