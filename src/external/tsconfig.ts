import type { ExternalToolConfig } from '../core/types.js';

/** Generate tsconfig.json configuration aligned with Claude rules */
export function createTsconfigConfig(
  options: { nextjs?: boolean; react?: boolean },
): ExternalToolConfig {
  const compilerOptions: Record<string, unknown> = {
    target: 'es2022',
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
    compilerOptions.lib = ['dom', 'dom.iterable', 'esnext'];
  } else {
    compilerOptions.lib = ['esnext'];
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
