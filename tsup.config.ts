import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig([
  // CLI entry point (existing)
  {
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
      '@anthropic-ai/sdk',
      '@modelcontextprotocol/sdk',
      'zod',
    ],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // MCP server entry point
  {
    entry: ['src/mcp/server.ts'],
    format: ['esm'],
    outDir: 'dist/mcp',
    dts: false,
    sourcemap: true,
    clean: false,
    target: 'node20',
    define: {
      'process.env.DIVERGER_VERSION': JSON.stringify(pkg.version),
    },
    noExternal: [],
    external: [
      'fast-glob',
      'js-yaml',
      'smol-toml',
      'fast-xml-parser',
      'deepmerge-ts',
      'diff',
      '@anthropic-ai/sdk',
      '@modelcontextprotocol/sdk',
      'zod',
    ],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Self-contained MCP server for plugin distribution (all deps bundled, single file)
  {
    entry: ['src/mcp/server.ts'],
    format: ['esm'],
    outDir: 'dist/mcp-bundled',
    dts: false,
    sourcemap: false,
    clean: false,
    splitting: false,
    target: 'node20',
    define: {
      'process.env.DIVERGER_VERSION': JSON.stringify(pkg.version),
    },
    noExternal: [/.*/],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
