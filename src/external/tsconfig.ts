import type { ExternalToolConfig } from '../core/types.js';

/** Generate tsconfig.json configuration aligned with Claude rules */
export function createTsconfigConfig(
  options: { nextjs?: boolean; react?: boolean },
): ExternalToolConfig {
  const compilerOptions: Record<string, unknown> = {
    strict: true,
    noUncheckedIndexedAccess: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    isolatedModules: true,
  };

  if (options.react || options.nextjs) {
    compilerOptions.jsx = 'react-jsx';
  }

  if (options.nextjs) {
    compilerOptions.module = 'esnext';
    compilerOptions.moduleResolution = 'bundler';
    compilerOptions.plugins = [{ name: 'next' }];
  }

  return {
    type: 'tsconfig',
    filePath: 'tsconfig.json',
    config: { compilerOptions },
    mergeStrategy: 'align',
  };
}
