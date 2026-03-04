// ============================================================================
// Template Interpolation — Replaces {{namespace.key}} tokens in profile content
// ============================================================================

import type { TemplateContext } from './template-context.js';

/**
 * Replace `{{lang.key}}`, `{{ci.key}}`, `{{docker.key}}` tokens in content
 * with values from the template context.
 *
 * Design choices:
 * - Namespace-prefixed to avoid collisions with GitHub Actions `${{ }}` expressions
 * - Does NOT match existing `{{BUILD_COMMANDS}}` tokens (no namespace prefix)
 * - Unresolved tokens are left unchanged (safe for content without templates)
 */
export function interpolateTemplate(content: string, ctx: TemplateContext): string {
  return content.replace(
    /\{\{(lang|ci|docker)\.([a-zA-Z]+)\}\}/g,
    (_match, namespace: string, key: string) => {
      const section = ctx[namespace as keyof TemplateContext];
      if (section && typeof section === 'object' && key in section) {
        return (section as unknown as Record<string, string>)[key] ?? _match;
      }
      return _match;
    },
  );
}
