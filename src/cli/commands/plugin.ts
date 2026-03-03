import type { Command } from 'commander';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';
import { confirmAction } from '../ui/prompts.js';
import { DivergerError, extractErrorMessage } from '../../core/errors.js';
import { detectPluginInstalled } from '../plugin-detect.js';
import { getVersion } from '../version.js';
import * as log from '../ui/logger.js';

const GITHUB_REPO = 'DivergerThinking/diverger-claude';
const PLUGIN_NAME = 'diverger-claude';
const PLUGIN_DIR = path.join(os.homedir(), '.claude', 'plugins', PLUGIN_NAME);

/**
 * Get a GitHub token for API authentication.
 * Tries `gh auth token` first, then GITHUB_TOKEN env var.
 * Returns null if neither is available (public repo fallback).
 */
function getGitHubToken(): string | null {
  // 1. Try gh CLI (most common for developers)
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (token) return token;
  } catch {
    // gh not installed or not logged in
  }
  // 2. Try env var
  return process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null;
}

/** Build standard GitHub API headers, with auth if available. */
function githubHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'diverger-claude-cli',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

interface ReleaseInfo {
  tag: string;
  assetUrl: string | null;
  assetName: string;
}

/** Get the latest release info from GitHub API (tag + asset download URL). */
export async function getLatestReleaseTag(): Promise<{ tag: string | null; error?: string; assetUrl?: string }> {
  try {
    const token = getGitHubToken();
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const res = await fetch(url, { headers: githubHeaders(token) });
    if (!res.ok) {
      if (res.status === 404 && !token) {
        return { tag: null, error: 'Repo privado: necesitas `gh auth login` o definir GITHUB_TOKEN.' };
      }
      if (res.status === 404) return { tag: null, error: 'No se encontraron releases en el repositorio.' };
      if (res.status === 403) return { tag: null, error: 'Rate limit de GitHub excedido. Intenta en unos minutos.' };
      return { tag: null, error: `GitHub API respondió con status ${res.status}` };
    }
    const data = (await res.json()) as { tag_name?: string; assets?: Array<{ name: string; url: string }> };
    const tag = data.tag_name ?? null;
    // Find the plugin tarball asset URL for direct API download (needed for private repos)
    const assetName = `${PLUGIN_NAME}-plugin-${tag}.tar.gz`;
    const asset = data.assets?.find((a) => a.name === assetName);
    return { tag, assetUrl: asset?.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN') || msg.includes('fetch failed')) {
      return { tag: null, error: 'No se pudo conectar a GitHub. Verifica tu conexión a internet.' };
    }
    return { tag: null, error: msg.split('\n')[0] };
  }
}

/** Get release info for a specific tag (asset URL for download). */
async function getReleaseByTag(tag: string): Promise<ReleaseInfo | null> {
  const token = getGitHubToken();
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${tag}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (!res.ok) return null;
  const data = (await res.json()) as { tag_name: string; assets?: Array<{ name: string; url: string }> };
  const assetName = `${PLUGIN_NAME}-plugin-${tag}.tar.gz`;
  const asset = data.assets?.find((a) => a.name === assetName);
  return { tag: data.tag_name, assetUrl: asset?.url ?? null, assetName };
}

/** Build the tarball download URL for a given tag (public repos fallback). */
export function buildTarballUrl(tag: string): string {
  return `https://github.com/${GITHUB_REPO}/releases/download/${tag}/${PLUGIN_NAME}-plugin-${tag}.tar.gz`;
}

/**
 * Download a release asset from GitHub to a local path.
 * For private repos, uses the GitHub API asset endpoint with octet-stream accept.
 * For public repos, uses the direct download URL.
 */
async function downloadFile(url: string, dest: string): Promise<void> {
  const token = getGitHubToken();
  const isApiUrl = url.startsWith('https://api.github.com/');

  const headers: Record<string, string> = { 'User-Agent': 'diverger-claude-cli' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isApiUrl) headers.Accept = 'application/octet-stream';

  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Descarga fallida: HTTP ${res.status} — ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buffer);
}

/**
 * Convert a Windows path to MSYS-style for GNU tar compatibility.
 * GNU tar interprets C: as a remote host specifier, so C:/Users/...
 * must become /c/Users/... on Windows.
 */
function toTarPath(p: string): string {
  // Replace backslashes with forward slashes
  let result = p.replace(/\\/g, '/');
  // Convert drive letter: C:/... → /c/...
  result = result.replace(/^([A-Za-z]):\//, (_match, drive: string) => `/${drive.toLowerCase()}/`);
  return result;
}

/** Extract the plugin tarball to the target directory. */
export async function extractPlugin(tarball: string, targetDir: string): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });
  const tarballPath = toTarPath(tarball);
  const target = toTarPath(targetDir);
  // --strip-components=1 removes the top-level plugin/ directory from the tarball
  execSync(`tar -xzf "${tarballPath}" --strip-components=1 -C "${target}"`, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

/** Read the version from an installed plugin's plugin.json. */
export function readPluginVersion(pluginPath: string): string | null {
  try {
    const manifestPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
    const data = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

export function registerPluginCommand(program: Command): void {
  const pluginCmd = program
    .command('plugin')
    .description('Gestionar el plugin diverger-claude para Claude Code');

  // --- plugin install ---
  pluginCmd
    .command('install')
    .description('Descargar e instalar el plugin desde GitHub Releases')
    .option('--tag <tag>', 'Versión/tag a instalar (por defecto: latest)')
    .action(async (opts) => {
      try {
        log.header('diverger-claude plugin install');
        log.blank();

        // Check if already installed
        const existingPath = detectPluginInstalled();
        if (existingPath) {
          const existingVersion = readPluginVersion(existingPath);
          log.warn(`Plugin ya instalado${existingVersion ? ` (v${existingVersion})` : ''} en:`);
          log.dim(`  ${existingPath}`);
          log.blank();

          const outputMode = log.getOutputMode();
          if (outputMode === 'rich') {
            const confirmed = await confirmAction('¿Reinstalar/actualizar el plugin?');
            if (!confirmed) {
              log.dim('Operación cancelada.');
              return;
            }
          }
        }

        // Resolve tag and asset download URL
        let tag: string;
        let downloadUrl: string;
        if (opts.tag) {
          tag = opts.tag.startsWith('v') ? opts.tag : `v${opts.tag}`;
          log.info(`Versión solicitada: ${tag}`);
          // Fetch release by tag to get the API asset URL (needed for private repos)
          const releaseInfo = await getReleaseByTag(tag);
          downloadUrl = releaseInfo?.assetUrl ?? buildTarballUrl(tag);
        } else {
          log.info('Consultando última versión...');
          const { tag: latestTag, error, assetUrl } = await getLatestReleaseTag();
          if (!latestTag) {
            log.error('No se pudo obtener la última versión.');
            if (error) log.dim(`  ${error}`);
            process.exit(1);
          }
          tag = latestTag;
          log.info(`Última versión: ${tag}`);
          downloadUrl = assetUrl ?? buildTarballUrl(tag);
        }

        // Download
        const tarballUrl = downloadUrl;
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-plugin-'));
        const tarballPath = path.join(tempDir, `${PLUGIN_NAME}-plugin-${tag}.tar.gz`);

        log.info('Descargando plugin...');
        log.dim(`  ${tarballUrl}`);

        try {
          await downloadFile(tarballUrl, tarballPath);
        } catch (err) {
          log.error('Error al descargar el plugin.');
          log.dim(`  ${extractErrorMessage(err)}`);
          log.dim('  Verifica que la versión existe y tienes conexión a internet.');
          await fs.rm(tempDir, { recursive: true, force: true });
          process.exit(1);
        }

        // Extract
        log.info(`Instalando en ${PLUGIN_DIR}...`);

        try {
          // Remove existing installation if present (for clean upgrade)
          if (existsSync(PLUGIN_DIR)) {
            await fs.rm(PLUGIN_DIR, { recursive: true });
          }
          await extractPlugin(tarballPath, PLUGIN_DIR);
        } catch (err) {
          log.error('Error al extraer el plugin.');
          log.dim(`  ${extractErrorMessage(err)}`);
          await fs.rm(tempDir, { recursive: true, force: true });
          process.exit(1);
        }

        // Cleanup temp
        await fs.rm(tempDir, { recursive: true, force: true });

        // Verify
        const verifyPath = path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json');
        if (!existsSync(verifyPath)) {
          log.error('La instalación no se completó correctamente (plugin.json no encontrado).');
          process.exit(1);
        }

        const installedVersion = readPluginVersion(PLUGIN_DIR);
        log.blank();
        log.success(`Plugin diverger-claude ${installedVersion ? `v${installedVersion}` : tag} instalado correctamente.`);
        log.blank();
        log.info('Siguientes pasos:');
        log.dim('  1. diverger init --force   (regenerar config en modo plugin)');
        log.dim('  2. diverger cleanup        (eliminar componentes duplicados de .claude/)');

        if (log.getOutputMode() === 'json') {
          log.jsonOutput({ installed: true, version: installedVersion, path: PLUGIN_DIR, tag });
        }
      } catch (err) {
        if (err instanceof DivergerError) {
          log.error(`[${err.code}] ${err.message}`);
        } else {
          log.error(extractErrorMessage(err));
        }
        process.exit(1);
      }
    });

  // --- plugin status ---
  pluginCmd
    .command('status')
    .description('Verificar el estado de instalación del plugin')
    .action(() => {
      try {
        log.header('diverger-claude plugin status');
        log.blank();

        const pluginPath = detectPluginInstalled();
        const cliVersion = getVersion();

        if (!pluginPath) {
          log.warn('Plugin no instalado.');
          log.blank();
          log.info('Instala con: diverger plugin install');

          if (log.getOutputMode() === 'json') {
            log.jsonOutput({ installed: false, cliVersion });
          }
          return;
        }

        const pluginVersion = readPluginVersion(pluginPath);

        log.success('Plugin instalado.');
        log.keyValue('Ubicación', pluginPath);
        log.keyValue('Versión plugin', pluginVersion ?? 'desconocida');
        log.keyValue('Versión CLI', cliVersion);

        if (pluginVersion && pluginVersion !== cliVersion) {
          log.blank();
          log.warn(`Versiones desincronizadas: CLI v${cliVersion} vs Plugin v${pluginVersion}`);
          log.dim('  Ejecuta `diverger update` y `diverger plugin install` para sincronizar.');
        }

        if (log.getOutputMode() === 'json') {
          log.jsonOutput({
            installed: true,
            path: pluginPath,
            pluginVersion,
            cliVersion,
            synced: pluginVersion === cliVersion,
          });
        }
      } catch (err) {
        if (err instanceof DivergerError) {
          log.error(`[${err.code}] ${err.message}`);
        } else {
          log.error(extractErrorMessage(err));
        }
        process.exit(1);
      }
    });

  // --- plugin uninstall ---
  pluginCmd
    .command('uninstall')
    .description('Desinstalar el plugin diverger-claude')
    .option('-f, --force', 'Omitir confirmación', false)
    .action(async (opts) => {
      try {
        log.header('diverger-claude plugin uninstall');
        log.blank();

        const pluginPath = detectPluginInstalled();

        if (!pluginPath) {
          log.warn('Plugin no instalado. Nada que hacer.');
          return;
        }

        const pluginVersion = readPluginVersion(pluginPath);
        log.info(`Plugin encontrado${pluginVersion ? ` (v${pluginVersion})` : ''} en:`);
        log.dim(`  ${pluginPath}`);
        log.blank();

        const outputMode = log.getOutputMode();
        if (!opts.force && outputMode === 'rich') {
          const confirmed = await confirmAction('¿Desinstalar el plugin?');
          if (!confirmed) {
            log.dim('Operación cancelada.');
            return;
          }
        }

        await fs.rm(pluginPath, { recursive: true });

        log.blank();
        log.success('Plugin desinstalado.');
        log.blank();
        log.info('Para regenerar la configuración completa (sin plugin):');
        log.dim('  diverger init --force');

        if (outputMode === 'json') {
          log.jsonOutput({ uninstalled: true, path: pluginPath });
        }
      } catch (err) {
        if (err instanceof DivergerError) {
          log.error(`[${err.code}] ${err.message}`);
        } else {
          log.error(extractErrorMessage(err));
        }
        process.exit(1);
      }
    });
}
