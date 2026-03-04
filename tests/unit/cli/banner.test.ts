import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock loadMeta so banner always sees "no meta" regardless of cwd
vi.mock('../../../src/governance/history.js', () => ({
  loadMeta: vi.fn().mockResolvedValue(null),
}));

import { getGreeting, showBanner } from '../../../src/cli/ui/banner.js';
import * as logger from '../../../src/cli/ui/logger.js';

// Strip ANSI escape codes for assertions
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const strip = (s: string): string => s.replace(ANSI_RE, '');

describe('getGreeting', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "Buenos dias" in the morning (0-11)', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(8);
    expect(getGreeting()).toBe('Buenos dias');
  });

  it('returns "Buenos dias" at midnight', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(0);
    expect(getGreeting()).toBe('Buenos dias');
  });

  it('returns "Buenas tardes" in the afternoon (12-19)', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(15);
    expect(getGreeting()).toBe('Buenas tardes');
  });

  it('returns "Buenas tardes" at noon exactly', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(12);
    expect(getGreeting()).toBe('Buenas tardes');
  });

  it('returns "Buenas noches" at night (20-23)', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(22);
    expect(getGreeting()).toBe('Buenas noches');
  });

  it('returns "Buenas noches" at 20:00 exactly', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
    expect(getGreeting()).toBe('Buenas noches');
  });
});

describe('showBanner', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.stdout.isTTY = originalIsTTY;
    logger.setOutputMode('rich');
  });

  it('suppresses output in quiet mode', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('quiet');
    await showBanner();
    // Only blank() calls from logger might pass through, but showBanner returns early
    // before any console.log
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('suppresses output in json mode', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('json');
    await showBanner();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('suppresses output when not TTY', async () => {
    process.stdout.isTTY = false;
    logger.setOutputMode('rich');
    await showBanner();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('renders banner in rich TTY mode', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('rich');
    await showBanner();
    // Should have called console.log at least once (blank + banner + blank)
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
    // Find the main banner call (the one with the box)
    const bannerCall = consoleSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && strip(call[0]).includes('Diverger v'),
    );
    expect(bannerCall).toBeDefined();
  });

  it('banner contains wireframe globe logo (● character)', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('rich');
    await showBanner();
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(allOutput).toContain('\u25CF'); // ● filled circle
  });

  it('banner shows "Powered by Claude Code"', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('rich');
    await showBanner();
    const allOutput = consoleSpy.mock.calls.map((c) => strip(String(c[0]))).join('\n');
    expect(allOutput).toContain('Powered by Claude Code');
  });

  it('banner shows commands list', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('rich');
    await showBanner();
    const allOutput = consoleSpy.mock.calls.map((c) => strip(String(c[0]))).join('\n');
    expect(allOutput).toContain('init');
    expect(allOutput).toContain('sync');
    expect(allOutput).toContain('status');
    expect(allOutput).toContain('check');
    expect(allOutput).toContain('diff');
    expect(allOutput).toContain('eject');
  });

  it('banner shows time-appropriate greeting', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('rich');
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    await showBanner();
    const allOutput = consoleSpy.mock.calls.map((c) => strip(String(c[0]))).join('\n');
    expect(allOutput).toContain('Buenos dias');
    vi.restoreAllMocks();
  });

  it('banner renders box borders (╭ ╮ ╰ ╯)', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('rich');
    await showBanner();
    const allOutput = consoleSpy.mock.calls.map((c) => strip(String(c[0]))).join('\n');
    expect(allOutput).toContain('\u256D'); // ╭
    expect(allOutput).toContain('\u256E'); // ╮
    expect(allOutput).toContain('\u2570'); // ╰
    expect(allOutput).toContain('\u256F'); // ╯
  });

  it('shows tip when no meta is found (default)', async () => {
    process.stdout.isTTY = true;
    logger.setOutputMode('rich');
    await showBanner();
    const allOutput = consoleSpy.mock.calls.map((c) => strip(String(c[0]))).join('\n');
    expect(allOutput).toContain('Consejo');
    expect(allOutput).toContain('diverger init');
  });
});
