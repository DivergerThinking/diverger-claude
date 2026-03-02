import type { Command } from 'commander';
import { execSync } from 'child_process';
import * as log from '../ui/logger.js';
import { getVersion } from '../version.js';

const PKG_NAME = '@divergerthinking/diverger-claude';

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
function getLatestVersion(): string | null {
  try {
    return execSync(`npm view ${PKG_NAME} version`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

export function registerUpdateCommand(program: Command): void {
  program
    .command('update')
    .description('Actualizar diverger-claude a la última versión')
    .option('--check', 'Solo verificar si hay actualización disponible', false)
    .action(async (opts) => {
      const currentVersion = getVersion();

      log.header('diverger-claude update');
      log.info(`Versión actual: v${currentVersion}`);

      const latest = getLatestVersion();

      if (!latest) {
        log.warn('No se pudo consultar la última versión del registry.');
        log.info('Verifica tu conexión y que ~/.npmrc tenga el token configurado.');
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
      const isGlobal = isGlobalInstall();
      const flag = isGlobal ? '-g' : '--save-dev';
      const cmd = `npm install ${flag} ${PKG_NAME}@latest`;

      log.info(`Actualizando${isGlobal ? ' (global)' : ' (local)'}...`);
      log.dim(`  $ ${cmd}`);

      try {
        execSync(cmd, { stdio: 'inherit' });
        log.blank();
        log.success(`Actualizado a v${latest}`);
        log.info('Ejecuta `diverger sync` en tus proyectos para aplicar los nuevos profiles.');
      } catch {
        log.error('Error al actualizar. Verifica permisos y conexión.');
        process.exit(1);
      }
    });
}
