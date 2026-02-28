import type { DetectionResult, ExternalToolConfig } from '../core/types.js';
import { createEslintConfig } from './eslint.js';
import { createPrettierConfig } from './prettier.js';
import { createTsconfigConfig } from './tsconfig.js';

/**
 * External tools engine facade.
 * Generates configs for ESLint, Prettier, tsconfig, etc.
 */
export class ExternalToolsEngine {
  /** Generate external tool configs based on detected stack */
  generate(detection: DetectionResult): ExternalToolConfig[] {
    const configs: ExternalToolConfig[] = [];
    const techIds = new Set(detection.technologies.map((t) => t.id));

    // TypeScript-based projects
    if (techIds.has('typescript')) {
      configs.push(createEslintConfig({
        typescript: true,
        react: techIds.has('react'),
        nextjs: techIds.has('nextjs'),
      }));

      configs.push(createPrettierConfig());

      configs.push(createTsconfigConfig({
        react: techIds.has('react'),
        nextjs: techIds.has('nextjs'),
      }));
    }

    return configs;
  }
}
