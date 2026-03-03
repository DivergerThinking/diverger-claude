import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  createDefaultMemoryStore,
  migrateMemoryStore,
  loadProjectMemory,
  saveProjectMemory,
} from '../../../src/memory/store.js';
import { MEMORY_FILE } from '../../../src/core/constants.js';

describe('Memory Store', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-memory-store-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('createDefaultMemoryStore', () => {
    it('should return a valid default store', () => {
      const store = createDefaultMemoryStore();
      expect(store.schemaVersion).toBe(1);
      expect(store.errorPatterns).toEqual([]);
      expect(store.repairLog).toEqual([]);
      expect(store.evolutionLog).toEqual([]);
      expect(store.antiPatterns).toEqual([]);
      expect(store.bestPractices).toEqual([]);
      expect(store.stats.totalSessions).toBe(0);
      expect(store.stats.totalRepairs).toBe(0);
      expect(store.stats.successfulRepairs).toBe(0);
      expect(store.stats.totalErrorPatterns).toBe(0);
      expect(store.stats.rulesGenerated).toBe(0);
    });
  });

  describe('migrateMemoryStore', () => {
    it('should fill missing fields with defaults', () => {
      const raw = { schemaVersion: 1 };
      const store = migrateMemoryStore(raw);
      expect(store.errorPatterns).toEqual([]);
      expect(store.stats.totalSessions).toBe(0);
    });

    it('should preserve existing arrays', () => {
      const raw = {
        schemaVersion: 1,
        errorPatterns: [{ id: 'test', occurrences: 3 }],
        repairLog: [],
        evolutionLog: [],
        antiPatterns: [],
        bestPractices: [],
        stats: { totalSessions: 5 },
      };
      const store = migrateMemoryStore(raw);
      expect(store.errorPatterns).toHaveLength(1);
      expect(store.stats.totalSessions).toBe(5);
    });

    it('should handle completely empty object', () => {
      const store = migrateMemoryStore({});
      expect(store.schemaVersion).toBe(1);
      expect(store.errorPatterns).toEqual([]);
    });

    it('should handle non-array fields gracefully', () => {
      const raw = {
        schemaVersion: 1,
        errorPatterns: 'not an array',
        stats: 'not an object',
      };
      const store = migrateMemoryStore(raw as unknown as Record<string, unknown>);
      expect(store.errorPatterns).toEqual([]);
      expect(store.stats.totalSessions).toBe(0);
    });
  });

  describe('loadProjectMemory', () => {
    it('should return defaults when file does not exist', async () => {
      const store = await loadProjectMemory(tempDir);
      expect(store.schemaVersion).toBe(1);
      expect(store.errorPatterns).toEqual([]);
    });

    it('should load existing store', async () => {
      const data = createDefaultMemoryStore();
      data.stats.totalSessions = 42;
      await fs.writeFile(
        path.join(tempDir, MEMORY_FILE),
        JSON.stringify(data),
        'utf-8',
      );

      const store = await loadProjectMemory(tempDir);
      expect(store.stats.totalSessions).toBe(42);
    });

    it('should return defaults for invalid JSON', async () => {
      await fs.writeFile(
        path.join(tempDir, MEMORY_FILE),
        'not valid json {{{',
        'utf-8',
      );

      const store = await loadProjectMemory(tempDir);
      expect(store.schemaVersion).toBe(1);
      expect(store.errorPatterns).toEqual([]);
    });
  });

  describe('saveProjectMemory', () => {
    it('should write valid JSON to disk', async () => {
      const store = createDefaultMemoryStore();
      store.stats.totalSessions = 10;

      await saveProjectMemory(tempDir, store);

      const raw = await fs.readFile(path.join(tempDir, MEMORY_FILE), 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.stats.totalSessions).toBe(10);
      expect(parsed.schemaVersion).toBe(1);
    });

    it('should roundtrip correctly', async () => {
      const store = createDefaultMemoryStore();
      store.stats.totalSessions = 7;
      store.antiPatterns.push({
        id: 'test-ap',
        pattern: 'test',
        reason: 'test',
        alternative: 'test',
        source: 'manual',
        confidence: 80,
        learnedAt: new Date().toISOString(),
      });

      await saveProjectMemory(tempDir, store);
      const loaded = await loadProjectMemory(tempDir);

      expect(loaded.stats.totalSessions).toBe(7);
      expect(loaded.antiPatterns).toHaveLength(1);
      expect(loaded.antiPatterns[0].id).toBe('test-ap');
    });
  });
});
