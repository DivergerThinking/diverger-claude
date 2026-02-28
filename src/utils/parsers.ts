import yaml from 'js-yaml';
import { parse as parseToml } from 'smol-toml';
import { XMLParser } from 'fast-xml-parser';

/** Strip UTF-8 BOM (U+FEFF) if present at the start of a string */
function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

/** Parse JSON with better error messages */
export function parseJson<T = unknown>(content: string, source?: string): T {
  try {
    return JSON.parse(stripBom(content)) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Error parsing JSON${source ? ` from ${source}` : ''}: ${msg}`);
  }
}

/** Parse YAML content */
export function parseYaml<T = unknown>(content: string, source?: string): T {
  try {
    return yaml.load(stripBom(content), { schema: yaml.JSON_SCHEMA }) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Error parsing YAML${source ? ` from ${source}` : ''}: ${msg}`);
  }
}

/** Parse TOML content */
export function parseTOML<T = Record<string, unknown>>(content: string, source?: string): T {
  try {
    return parseToml(stripBom(content)) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Error parsing TOML${source ? ` from ${source}` : ''}: ${msg}`);
  }
}

/** Parse XML content */
export function parseXml<T = Record<string, unknown>>(content: string, source?: string): T {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    return parser.parse(stripBom(content)) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Error parsing XML${source ? ` from ${source}` : ''}: ${msg}`);
  }
}
