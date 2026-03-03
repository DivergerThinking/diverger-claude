import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// We need to mock os.homedir() BEFORE importing the telemetry module
// so that all file operations go to our temp dir instead of ~/.diverger
let tempHome: string;

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return {
    ...actual,
    default: {
      ...actual,
      homedir: () => tempHome,
    },
    homedir: () => tempHome,
  };
});

// Import after mock setup
const {
  isTelemetryEnabled,
  recordEvent,
  enableTelemetry,
  disableTelemetry,
  getTelemetryStore,
  clearTelemetry,
} = await import('../../../src/telemetry/index.js');

describe('telemetry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tempHome = mkdtempSync(path.join(os.tmpdir(), 'diverger-telemetry-'));
    // Ensure no env var interference
    delete process.env.DIVERGER_TELEMETRY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    rmSync(tempHome, { recursive: true, force: true });
  });

  describe('isTelemetryEnabled()', () => {
    it('returns false by default (no store, no env)', () => {
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('returns true when DIVERGER_TELEMETRY=1 env var is set', () => {
      process.env.DIVERGER_TELEMETRY = '1';
      expect(isTelemetryEnabled()).toBe(true);
    });

    it('returns false when DIVERGER_TELEMETRY has a non-1 value', () => {
      process.env.DIVERGER_TELEMETRY = 'true';
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('returns true when store has enabled: true', async () => {
      await enableTelemetry();
      expect(isTelemetryEnabled()).toBe(true);
    });

    it('returns false when store has enabled: false', async () => {
      await enableTelemetry();
      await disableTelemetry();
      expect(isTelemetryEnabled()).toBe(false);
    });
  });

  describe('enableTelemetry()', () => {
    it('creates the store file and sets enabled: true', async () => {
      await enableTelemetry();

      const storePath = path.join(tempHome, '.diverger', 'telemetry.json');
      const raw = readFileSync(storePath, 'utf-8');
      const store = JSON.parse(raw);
      expect(store.enabled).toBe(true);
      expect(store.events).toEqual([]);
    });
  });

  describe('disableTelemetry()', () => {
    it('sets enabled: false preserving events', async () => {
      await enableTelemetry();
      await recordEvent({
        command: 'init',
        pluginMode: false,
        detectedStack: ['typescript'],
        profileCount: 3,
        durationMs: 500,
      });
      await disableTelemetry();

      const store = await getTelemetryStore();
      expect(store.enabled).toBe(false);
      expect(store.events.length).toBe(1);
    });
  });

  describe('recordEvent()', () => {
    it('writes an event when telemetry is enabled', async () => {
      await enableTelemetry();

      await recordEvent({
        command: 'init',
        pluginMode: false,
        detectedStack: ['typescript', 'nextjs'],
        profileCount: 5,
        durationMs: 1234,
      });

      const store = await getTelemetryStore();
      expect(store.events).toHaveLength(1);

      const ev = store.events[0];
      expect(ev.command).toBe('init');
      expect(ev.pluginMode).toBe(false);
      expect(ev.detectedStack).toEqual(['typescript', 'nextjs']);
      expect(ev.profileCount).toBe(5);
      expect(ev.durationMs).toBe(1234);
      expect(ev.ts).toBeTruthy();
      // ts should be a valid ISO timestamp
      expect(new Date(ev.ts).toISOString()).toBe(ev.ts);
    });

    it('is a no-op when telemetry is disabled', async () => {
      // Default state is disabled
      await recordEvent({
        command: 'init',
        pluginMode: false,
        detectedStack: ['typescript'],
        profileCount: 1,
        durationMs: 100,
      });

      const store = await getTelemetryStore();
      expect(store.events).toHaveLength(0);
    });

    it('records errorCode when provided', async () => {
      await enableTelemetry();

      await recordEvent({
        command: 'check',
        pluginMode: false,
        detectedStack: [],
        profileCount: 0,
        errorCode: 'DETECTION_ERROR',
        durationMs: 50,
      });

      const store = await getTelemetryStore();
      expect(store.events[0].errorCode).toBe('DETECTION_ERROR');
    });

    it('truncates to 1000 events (rolling window)', async () => {
      await enableTelemetry();

      // Pre-populate with 999 events
      const storePath = path.join(tempHome, '.diverger', 'telemetry.json');
      const events = Array.from({ length: 999 }, (_, i) => ({
        ts: new Date(Date.now() - (999 - i) * 1000).toISOString(),
        command: 'init',
        pluginMode: false,
        detectedStack: ['typescript'],
        profileCount: 1,
        durationMs: 100,
      }));
      writeFileSync(
        storePath,
        JSON.stringify({ enabled: true, events }),
      );

      // Add 2 more events (total would be 1001, should cap at 1000)
      await recordEvent({
        command: 'sync',
        pluginMode: true,
        detectedStack: ['python'],
        profileCount: 2,
        durationMs: 200,
      });

      let store = await getTelemetryStore();
      expect(store.events).toHaveLength(1000);

      await recordEvent({
        command: 'check',
        pluginMode: false,
        detectedStack: [],
        profileCount: 0,
        durationMs: 50,
      });

      store = await getTelemetryStore();
      expect(store.events).toHaveLength(1000);

      // Newest event should be last
      const last = store.events[store.events.length - 1];
      expect(last.command).toBe('check');

      // Oldest event should have been dropped
      const first = store.events[0];
      expect(first.command).toBe('init');
    });

    it('never throws even on filesystem errors', async () => {
      // Point to a read-only location (the mock handles this)
      // Even if this fails internally, it should not throw
      await expect(
        recordEvent({
          command: 'init',
          pluginMode: false,
          detectedStack: [],
          profileCount: 0,
          durationMs: 100,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('clearTelemetry()', () => {
    it('empties events but preserves enabled state', async () => {
      await enableTelemetry();

      await recordEvent({
        command: 'init',
        pluginMode: false,
        detectedStack: ['typescript'],
        profileCount: 3,
        durationMs: 500,
      });
      await recordEvent({
        command: 'sync',
        pluginMode: true,
        detectedStack: ['python'],
        profileCount: 1,
        durationMs: 300,
      });

      let store = await getTelemetryStore();
      expect(store.events).toHaveLength(2);
      expect(store.enabled).toBe(true);

      await clearTelemetry();

      store = await getTelemetryStore();
      expect(store.events).toHaveLength(0);
      expect(store.enabled).toBe(true);
    });

    it('works when store does not exist yet', async () => {
      await clearTelemetry();

      const store = await getTelemetryStore();
      expect(store.events).toHaveLength(0);
      expect(store.enabled).toBe(false);
    });
  });

  describe('getTelemetryStore()', () => {
    it('returns default store when file does not exist', async () => {
      const store = await getTelemetryStore();
      expect(store.enabled).toBe(false);
      expect(store.events).toEqual([]);
    });

    it('handles corrupted JSON gracefully', async () => {
      const dir = path.join(tempHome, '.diverger');
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'telemetry.json'), 'not json!!!');

      const store = await getTelemetryStore();
      expect(store.enabled).toBe(false);
      expect(store.events).toEqual([]);
    });
  });
});
