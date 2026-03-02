import { describe, it, expect } from 'vitest';
import { parseYaml, parseJson, parseTOML, parseXml } from '../../../src/utils/parsers.js';

describe('parseYaml', () => {
  it('should parse basic YAML', () => {
    const result = parseYaml<{ name: string }>('name: test');
    expect(result.name).toBe('test');
  });

  it('should parse YAML with timestamps (CORE_SCHEMA)', () => {
    // JSON_SCHEMA would reject or misinterpret timestamps
    const yaml = 'date: 2024-01-15';
    const result = parseYaml<{ date: string }>(yaml);
    // CORE_SCHEMA treats unquoted dates as strings, not Date objects
    expect(typeof result.date).toBe('string');
  });

  it('should parse YAML with boolean-like strings correctly', () => {
    const yaml = 'enabled: true\nversion: "1.0"';
    const result = parseYaml<{ enabled: boolean; version: string }>(yaml);
    expect(result.enabled).toBe(true);
    expect(result.version).toBe('1.0');
  });

  it('should parse YAML with null values', () => {
    const yaml = 'value: null\nother: ~';
    const result = parseYaml<{ value: null; other: null }>(yaml);
    expect(result.value).toBeNull();
    expect(result.other).toBeNull();
  });

  it('should throw on malformed YAML with source context', () => {
    expect(() => parseYaml('key: [unclosed', 'config.yaml')).toThrow('config.yaml');
  });

  it('should return empty object for empty string', () => {
    const result = parseYaml<Record<string, unknown>>('');
    expect(result).toEqual({});
  });

  it('should return empty object for whitespace-only', () => {
    const result = parseYaml<Record<string, unknown>>('   \n  ');
    expect(result).toEqual({});
  });

  it('should return empty object for empty document marker', () => {
    const result = parseYaml<Record<string, unknown>>('---');
    expect(result).toEqual({});
  });

  it('should parse nested YAML', () => {
    const yaml = 'parent:\n  child: value\n  list:\n    - a\n    - b';
    const result = parseYaml<any>(yaml);
    expect(result.parent.child).toBe('value');
    expect(result.parent.list).toEqual(['a', 'b']);
  });
});

describe('parseTOML', () => {
  it('should parse basic TOML', () => {
    const result = parseTOML<{ package: { name: string } }>('[package]\nname = "test"');
    expect(result.package.name).toBe('test');
  });

  it('should strip BOM before parsing', () => {
    const bom = '\uFEFF[package]\nname = "test"';
    const result = parseTOML<any>(bom);
    expect(result.package.name).toBe('test');
  });

  it('should throw on malformed TOML with source', () => {
    expect(() => parseTOML('[[invalid', 'Cargo.toml')).toThrow('Cargo.toml');
  });

  it('should parse empty TOML document', () => {
    const result = parseTOML<Record<string, unknown>>('');
    expect(result).toEqual({});
  });
});

describe('parseXml', () => {
  it('should parse basic XML', () => {
    const result = parseXml<any>('<root><name>test</name></root>');
    expect(result.root.name).toBe('test');
  });

  it('should parse XML with attributes', () => {
    const result = parseXml<any>('<root id="1"><child/></root>');
    expect(result.root['@_id']).toBe('1');
  });

  it('should strip BOM before parsing', () => {
    const bom = '\uFEFF<root><name>test</name></root>';
    const result = parseXml<any>(bom);
    expect(result.root.name).toBe('test');
  });

  it('should handle empty XML gracefully', () => {
    const result = parseXml<Record<string, unknown>>('');
    expect(result).toBeDefined();
  });
});

describe('parseJson', () => {
  it('should parse valid JSON', () => {
    const result = parseJson<{ key: string }>('{"key": "value"}');
    expect(result.key).toBe('value');
  });

  it('should strip BOM before parsing', () => {
    const bom = '\uFEFF{"key": "value"}';
    const result = parseJson<{ key: string }>(bom);
    expect(result.key).toBe('value');
  });

  it('should throw on invalid JSON with source context', () => {
    expect(() => parseJson('not json', 'test.json')).toThrow('test.json');
  });
});
