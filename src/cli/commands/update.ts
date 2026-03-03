import type { Command } from 'commander';
import { execSync } from 'child_process';
import * as log from '../ui/logger.js';
import { getVersion } from '../version.js';
import { performCleanup } from './cleanup.js';
import { detectPluginInstalled } from '../plugin-detect.js';
import { doPluginInstall } from './plugin.js';

const PKG_NAME = '@divergerthinking/diverger-claude';
const REGISTRY = 'https://npm.pkg.github.com';

/** Check if the package is installed globally */
function isGlobalInstall(): boolean {
  try {
    const globalList = execSync(`npm ls -g ${PKG_NAME} --depth=0 --json`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(globalList);
    return !!parsed.dependencies?.[PKG_NAME];
  } catch {
    return false;
  }
}

/** Get the latest published version from the registry */
function getLatestVersion(): { version: string | null; error?: string } {
  try {
    const version = execSync(`npm view ${PKG_NAME} version --registry=${REGISTRY}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return { version };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Extract useful hint from npm error output
    if (msg.includes('401') || msg.includes('ENEEDAUTH')) {
      return { version: null, error: 'Token de autenticación no configurado o expirado. Verifica ~/.npmrc' };
    }
    if (msg.includes('404') || msg.includes('E404')) {
      return { version: null, error: 'Paquete no encontrado en el registry. Verifica que se haya publicado.' };
    }
    if (msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN')) {
      return { version: null, error: 'No se pudo conectar al registry. Verifica tu conexión a internet.' };
    }
    return { version: null, error: msg.split('\n')[0] };
  }
}

export function registerUpdateCommand(program: Command): void {
  program
    .command('update')
    .description('Actualizar diverger-claude a la última versión')
    .option('--check', 'Solo verificar si hay actualización disponible', false)
    .option('--all', 'Actualizar CLI y plugin', false)
    .option('--no-cleanup', 'No ejecutar cleanup automático tras la actualización')
    .action(async (opts) => {
      const currentVersion = getVersion();

      log.header('diverger-claude update');
      log.info(`Versión actual: v${currentVersion}`);

      const { version: latest, error: registryError } = getLatestVersion();

      if (!latest) {
        log.warn('No se pudo consultar la última versión del registry.');
        if (registryError) log.dim(`  ${registryError}`);
        process.exit(1);
      }

      log.info(`Última versión disponible: v${latest}`);

      if (currentVersion === latest) {
        log.success('Ya tienes la última versión.');
        return;
      }

      if (opts.check) {
        log.warn(`Actualización disponible: v${currentVersion} → v${latest}`);
        log.info('Ejecuta `diverger update` para actualizar.');
        return;
      }

      // Determine install type and run update
      // Use --@divergerthinking:registry instead of --registry to scope only
      // our package to GitHub Packages. --registry applies globally and causes
      // E404 for transitive deps like @anthropic-ai/sdk on the public registry.
      const isGlobal = isGlobalInstall();
      const flag = isGlobal ? '-g' : '--save-dev';
      const scopedRegistry = `--@divergerthinking:registry=${REGISTRY}`;
      const cmd = `npm install ${flag} ${PKG_NAME}@latest ${scopedRegistry}`;

      log.info(`Actualizando${isGlobal ? ' (global)' : ' (local)'}...`);
      log.dim(`  $ ${cmd}`);

      try {
        execSync(cmd, { stdio: 'inherit' });
        log.blank();
        log.success(`Actualizado a v${latest}`);
      } catch {
        log.error('Error al actualizar. Verifica permisos y conexión.');
        process.exit(1);
      }

      // Auto-cleanup: remove universal duplicates if plugin is present
      if (opts.cleanup !== false) {
        const targetDir = process.cwd();
        const pluginPath = detectPluginInstalled(targetDir);
        if (pluginPath) {
          log.blank();
          log.info('Plugin detectado — ejecutando cleanup automático...');
          try {
            const result = await performCleanup({ targetDir, force: false });
            if (result.cleaned) {
              log.success(`Cleanup: ${result.removed.length} componente(s) duplicado(s) eliminado(s).`);
              if (result.settingsClean) {
                log.success('Hooks universales eliminados de settings.json.');
              }
              if (result.skipped.length > 0) {
                log.dim(`${result.skipped.length} archivo(s) modificado(s) preservado(s).`);
              }
            } else {
              log.dim('No se encontraron componentes universales duplicados.');
            }
          } catch {
            log.warn('No se pudo completar el cleanup automático. Ejecuta `diverger cleanup` manualmente.');
          }
        }
      }

      // --all: also update the plugin
      if (opts.all) {
        const pluginPath = detectPluginInstalled(process.cwd());
        if (pluginPath) {
          log.blank();
          log.info('Actualizando plugin...');
          const pluginResult = await doPluginInstall({ quiet: true });
          if (pluginResult) {
            log.success(`Plugin actualizado a ${pluginResult.tag}`);
          } else {
            log.warn('No se pudo actualizar el plugin. Ejecuta `diverger plugin install` manualmente.');
          }
        } else {
          log.blank();
          log.dim('Plugin no instalado — usa `diverger plugin install` para instalarlo.');
        }
      }

      log.blank();
      log.info('Ejecuta `diverger sync` en tus proyectos para aplicar los nuevos profiles.');
    });
}
