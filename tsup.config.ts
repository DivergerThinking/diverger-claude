import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  define: {
    'process.env.DIVERGER_VERSION': JSON.stringify(pkg.version),
  },
  noExternal: [],
  external: [
    'commander',
    '@inquirer/prompts',
    'ora',
    'chalk',
    'fast-glob',
    'js-yaml',
    'smol-toml',
    'fast-xml-parser',
    'deepmerge-ts',
    'diff',
    'zod',
    '@anthropic-ai/sdk',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
