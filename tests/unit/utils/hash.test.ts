import { describe, it, expect } from 'vitest';
import { sha256, hashForMeta, hashMatches } from '../../../src/utils/hash.js';

describe('sha256', () => {
  it('should return a 64-character hex string', () => {
    const result = sha256('hello');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce a known hash for "hello"', () => {
    // SHA256 of "hello" is well-known
    const result = sha256('hello');
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should return consistent results for the same input', () => {
    const a = sha256('test content');
    const b = sha256('test content');
    expect(a).toBe(b);
  });

  it('should return different hashes for different inputs', () => {
    const a = sha256('content A');
    const b = sha256('content B');
    expect(a).not.toBe(b);
  });

  it('should handle empty string', () => {
    const result = sha256('');
    expect(result).toHaveLength(64);
    // SHA256 of empty string is well-known
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should handle unicode content', () => {
    const result = sha256('Hola mundo! Configuracion con acentos y tildes');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle multiline content', () => {
    const result = sha256('line 1\nline 2\nline 3');
    expect(result).toHaveLength(64);
  });
});

describe('hashForMeta', () => {
  it('should prefix the hash with "sha256:"', () => {
    const result = hashForMeta('hello');
    expect(result).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('should contain the same hash as sha256()', () => {
    const content = 'test content';
    const hash = sha256(content);
    const metaHash = hashForMeta(content);
    expect(metaHash).toBe(`sha256:${hash}`);
  });

  it('should return consistent results', () => {
    const a = hashForMeta('data');
    const b = hashForMeta('data');
    expect(a).toBe(b);
  });

  it('should return different results for different inputs', () => {
    const a = hashForMeta('content A');
    const b = hashForMeta('content B');
    expect(a).not.toBe(b);
  });
});

describe('hashMatches', () => {
  it('should return true when content matches a "sha256:" prefixed hash', () => {
    const content = 'hello world';
    const storedHash = hashForMeta(content);
    expect(hashMatches(content, storedHash)).toBe(true);
  });

  it('should return false when content does not match a "sha256:" prefixed hash', () => {
    const storedHash = hashForMeta('original content');
    expect(hashMatches('modified content', storedHash)).toBe(false);
  });

  it('should return true when content matches a raw (non-prefixed) hash', () => {
    const content = 'hello world';
    const rawHash = sha256(content);
    expect(hashMatches(content, rawHash)).toBe(true);
  });

  it('should return false when content does not match a raw hash', () => {
    const rawHash = sha256('original');
    expect(hashMatches('modified', rawHash)).toBe(false);
  });

  it('should handle empty string content', () => {
    const storedHash = hashForMeta('');
    expect(hashMatches('', storedHash)).toBe(true);
    expect(hashMatches('not empty', storedHash)).toBe(false);
  });

  it('should distinguish between very similar content', () => {
    const storedHash = hashForMeta('content');
    expect(hashMatches('content', storedHash)).toBe(true);
    expect(hashMatches('content ', storedHash)).toBe(false); // trailing space
    expect(hashMatches('Content', storedHash)).toBe(false); // capitalization
  });

  it('should correctly handle the "sha256:" prefix extraction', () => {
    const content = 'test';
    const hash = sha256(content);
    // Manually construct the prefixed hash
    const prefixed = `sha256:${hash}`;
    expect(hashMatches(content, prefixed)).toBe(true);

    // Verify it strips exactly 7 characters ("sha256:")
    expect(prefixed.slice(7)).toBe(hash);
  });
});
