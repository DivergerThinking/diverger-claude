/** Escape a string for safe inclusion in YAML frontmatter */
export function yamlEscape(value: string): string {
  if (/[:\n\r#"'{}[\],&*?|><!%@`]/.test(value) || value.trim() !== value) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`;
  }
  return value;
}
