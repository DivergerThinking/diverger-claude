import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import type { TelemetryEvent, TelemetryStore } from './types.js';

/** Maximum number of events stored in the rolling window */
const MAX_EVENTS = 1000;

/** Directory where the telemetry store lives (computed lazily to allow test mocking) */
function getTelemetryDir(): string {
  return path.join(os.homedir(), '.diverger');
}

/** Path to the telemetry JSON file (computed lazily to allow test mocking) */
function getTelemetryPath(): string {
  return path.join(getTelemetryDir(), 'telemetry.json');
}

/** Default empty store */
function defaultStore(): TelemetryStore {
  return { enabled: false, events: [] };
}

/**
 * Read the store synchronously.
 * Returns a default (disabled, empty) store on any failure.
 */
function readStoreSync(): TelemetryStore {
  try {
    const raw = fs.readFileSync(getTelemetryPath(), 'utf-8');
    const parsed = JSON.parse(raw) as TelemetryStore;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStore();
  }
}

/**
 * Read the store asynchronously.
 * Returns a default (disabled, empty) store on any failure.
 */
async function readStoreAsync(): Promise<TelemetryStore> {
  try {
    const raw = await fsPromises.readFile(getTelemetryPath(), 'utf-8');
    const parsed = JSON.parse(raw) as TelemetryStore;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStore();
  }
}

/**
 * Write the store to disk, creating the directory if needed.
 */
async function writeStore(store: TelemetryStore): Promise<void> {
  await fsPromises.mkdir(getTelemetryDir(), { recursive: true });
  await fsPromises.writeFile(getTelemetryPath(), JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * Check whether telemetry is enabled.
 * Opt-in only: requires DIVERGER_TELEMETRY=1 env var OR enabled: true in store.
 * Synchronous for easy use in hot paths.
 */
export function isTelemetryEnabled(): boolean {
  if (process.env.DIVERGER_TELEMETRY === '1') {
    return true;
  }
  const store = readStoreSync();
  return store.enabled;
}

/**
 * Record a telemetry event.
 * No-op when telemetry is disabled. Fire-and-forget — never throws.
 */
export async function recordEvent(event: Omit<TelemetryEvent, 'ts'>): Promise<void> {
  try {
    if (!isTelemetryEnabled()) return;

    const store = await readStoreAsync();
    const fullEvent: TelemetryEvent = {
      ...event,
      ts: new Date().toISOString(),
    };

    store.events.push(fullEvent);

    // Rolling window: keep only the last MAX_EVENTS
    if (store.events.length > MAX_EVENTS) {
      store.events = store.events.slice(store.events.length - MAX_EVENTS);
    }

    await writeStore(store);
  } catch {
    // Telemetry failures must NEVER crash the CLI
  }
}

/**
 * Enable telemetry and persist the setting.
 */
export async function enableTelemetry(): Promise<void> {
  const store = await readStoreAsync();
  store.enabled = true;
  await writeStore(store);
}

/**
 * Disable telemetry and persist the setting.
 */
export async function disableTelemetry(): Promise<void> {
  const store = await readStoreAsync();
  store.enabled = false;
  await writeStore(store);
}

/**
 * Return the full telemetry store (for display).
 */
export async function getTelemetryStore(): Promise<TelemetryStore> {
  return readStoreAsync();
}

/**
 * Clear all recorded events but preserve the enabled/disabled setting.
 */
export async function clearTelemetry(): Promise<void> {
  const store = await readStoreAsync();
  store.events = [];
  await writeStore(store);
}
