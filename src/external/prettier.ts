import type { ExternalToolConfig } from '../core/types.js';

/** Generate Prettier configuration aligned with Claude rules */
export function createPrettierConfig(): ExternalToolConfig {
  return {
    type: 'prettier',
    filePath: '.prettierrc',
    config: {
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      bracketSpacing: true,
      arrowParens: 'always',
      endOfLine: 'lf',
    },
    mergeStrategy: 'create-only',
  };
}
