/**
 * Static table mapping common npm/pip/cargo/go packages to diverger technology IDs.
 * Used by the evolution advisor to suggest profile additions when new dependencies appear.
 */
const DEPENDENCY_MAP: Record<string, string> = {
  // JavaScript Frameworks
  'next': 'nextjs',
  'nuxt': 'nuxtjs',
  'express': 'express',
  '@nestjs/core': 'nestjs',
  '@angular/core': 'angular',
  'vue': 'vue',
  'svelte': 'svelte',
  'solid-js': 'solidjs',
  'remix': 'remix',
  'astro': 'astro',
  'gatsby': 'gatsby',
  'fastify': 'fastify',
  'hono': 'hono',
  'koa': 'koa',

  // React/Mobile
  'react': 'react',
  'react-native': 'react-native',
  'expo': 'expo',

  // Testing
  'vitest': 'vitest',
  'jest': 'jest',
  'mocha': 'mocha',
  'playwright': 'playwright',
  'cypress': 'cypress',
  '@testing-library/react': 'testing-library',
  'pytest': 'pytest',

  // Build/Runtime
  'typescript': 'typescript',
  'bun': 'bun',
  'deno': 'deno',
  'esbuild': 'esbuild',
  'vite': 'vite',
  'webpack': 'webpack',

  // Infrastructure
  'prisma': 'prisma',
  'drizzle-orm': 'drizzle',
  'typeorm': 'typeorm',
  '@aws-sdk/client-s3': 'aws',
  'firebase': 'firebase',
  'supabase': 'supabase',

  // Python packages
  'fastapi': 'fastapi',
  'django': 'django',
  'flask': 'flask',
  'sqlalchemy': 'sqlalchemy',

  // Go modules
  'github.com/gin-gonic/gin': 'gin',
  'github.com/gofiber/fiber': 'fiber',

  // Rust crates
  'actix-web': 'actix',
  'tokio': 'tokio',
  'axum': 'axum',
};

/**
 * Map a dependency name to a known technology ID.
 * Returns null if the dependency is not in the map.
 */
export function mapDependencyToTechnology(dependency: string): string | null {
  return DEPENDENCY_MAP[dependency] ?? null;
}

/**
 * Map multiple dependencies to technology IDs.
 * Returns only those that have a mapping.
 */
export function mapDependencies(dependencies: string[]): Array<{ dependency: string; technologyId: string }> {
  const results: Array<{ dependency: string; technologyId: string }> = [];
  for (const dep of dependencies) {
    const techId = mapDependencyToTechnology(dep);
    if (techId) {
      results.push({ dependency: dep, technologyId: techId });
    }
  }
  return results;
}
