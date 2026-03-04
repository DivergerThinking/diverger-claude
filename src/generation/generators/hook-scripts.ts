import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, HOOKS_DIR } from '../../core/constants.js';
import { assertPathWithin } from '../../utils/fs.js';
import { ValidationError } from '../../core/errors.js';
import path from 'path';

/** Validate a hook script filename is safe */
function validateFilename(filename: string): void {
  if (!/^[a-zA-Z0-9_-]+\.sh$/.test(filename)) {
    throw new ValidationError(
      `Nombre de hook script inválido "${filename}": solo se permiten alfanuméricos, guiones, guiones bajos, y debe terminar en .sh`,
    );
  }
}

/** Generate all .claude/hooks/*.sh files from composed config */
export function generateHookScripts(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile[] {
  if (config.hookScripts.length === 0) return [];

  const hooksBase = path.join(projectRoot, CLAUDE_DIR, HOOKS_DIR);

  return config.hookScripts.map((script) => {
    validateFilename(script.filename);
    const fullPath = path.join(hooksBase, script.filename);
    assertPathWithin(fullPath, hooksBase);
    return {
      path: fullPath,
      content: script.content,
    };
  });
}
