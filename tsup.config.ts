import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  noExternal: [],
  external: [
    'commander',
    'inquirer',
    '@inquirer/prompts',
    'ora',
    'chalk',
    'fast-glob',
    'js-yaml',
    'smol-toml',
    'fast-xml-parser',
    'handlebars',
    'deep-diff',
    'deepmerge-ts',
    'diff',
    'zod',
    '@anthropic-ai/sdk',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
