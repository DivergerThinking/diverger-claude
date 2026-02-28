import { createHash } from 'crypto';

/** Compute SHA256 hash of a string (normalizes CRLF to LF for cross-platform consistency) */
export function sha256(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalized, 'utf-8').digest('hex');
}

/** Create a hash prefixed with "sha256:" for storage */
export function hashForMeta(content: string): string {
  return `sha256:${sha256(content)}`;
}

/** Check if content matches a stored hash */
export function hashMatches(content: string, storedHash: string): boolean {
  if (storedHash.startsWith('sha256:')) {
    return sha256(content) === storedHash.slice(7);
  }
  return sha256(content) === storedHash;
}
