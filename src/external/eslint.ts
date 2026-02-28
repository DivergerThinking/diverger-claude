import type { ExternalToolConfig } from '../core/types.js';

/** Generate ESLint configuration aligned with Claude rules */
export function createEslintConfig(
  options: { typescript?: boolean; react?: boolean; nextjs?: boolean },
): ExternalToolConfig {
  const config: Record<string, unknown> = {};

  if (options.typescript) {
    // ESLint flat config format
    config.extends = ['eslint:recommended'];
    config.parser = '@typescript-eslint/parser';
    config.plugins = ['@typescript-eslint'];
    config.rules = {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    };
  }

  if (options.react) {
    (config.plugins as string[]).push('react', 'react-hooks');
    const rules = config.rules as Record<string, unknown>;
    rules['react-hooks/rules-of-hooks'] = 'error';
    rules['react-hooks/exhaustive-deps'] = 'warn';
    rules['react/jsx-no-target-blank'] = 'error';
  }

  return {
    type: 'eslint',
    filePath: 'eslint.config.js',
    config,
    mergeStrategy: 'align',
  };
}
