import { describe, it, expect } from 'vitest';
import { generateReactNativeTemplate } from '../../../../src/generation/templates/react-native-template.js';
import { generateExpoTemplate } from '../../../../src/generation/templates/expo-template.js';
import { generateFlutterTemplate } from '../../../../src/generation/templates/flutter-template.js';
import { generateSwiftUITemplate } from '../../../../src/generation/templates/swiftui-template.js';

const PROJECT_ROOT = '/tmp/test-project';

describe('React Native template', () => {
  const files = generateReactNativeTemplate(PROJECT_ROOT);

  it('should return exactly 2 files', () => {
    expect(files).toHaveLength(2);
  });

  it('should generate metro.config.js with correct path', () => {
    const metro = files.find((f) => f.path.endsWith('metro.config.js'));
    expect(metro).toBeDefined();
    expect(metro!.path).toBe(`${PROJECT_ROOT}/metro.config.js`);
  });

  it('should generate metro.config.js with Metro configuration content', () => {
    const metro = files.find((f) => f.path.endsWith('metro.config.js'));
    expect(metro!.content).toContain('@react-native/metro-config');
    expect(metro!.content).toContain('mergeConfig');
    expect(metro!.content.length).toBeGreaterThan(0);
  });

  it('should generate .watchmanconfig with correct path', () => {
    const watchman = files.find((f) => f.path.endsWith('.watchmanconfig'));
    expect(watchman).toBeDefined();
    expect(watchman!.path).toBe(`${PROJECT_ROOT}/.watchmanconfig`);
  });

  it('should generate .watchmanconfig with non-empty content', () => {
    const watchman = files.find((f) => f.path.endsWith('.watchmanconfig'));
    expect(watchman!.content).toContain('{}');
    expect(watchman!.content.length).toBeGreaterThan(0);
  });
});

describe('Expo template', () => {
  const files = generateExpoTemplate(PROJECT_ROOT);

  it('should return exactly 3 files', () => {
    expect(files).toHaveLength(3);
  });

  it('should generate app.config.ts with correct path', () => {
    const appConfig = files.find((f) => f.path.endsWith('app.config.ts'));
    expect(appConfig).toBeDefined();
    expect(appConfig!.path).toBe(`${PROJECT_ROOT}/app.config.ts`);
  });

  it('should generate app.config.ts with Expo configuration content', () => {
    const appConfig = files.find((f) => f.path.endsWith('app.config.ts'));
    expect(appConfig!.content).toContain('ExpoConfig');
    expect(appConfig!.content).toContain('expo/config');
    expect(appConfig!.content).toContain('bundleIdentifier');
    expect(appConfig!.content.length).toBeGreaterThan(0);
  });

  it('should generate eas.json with correct path', () => {
    const eas = files.find((f) => f.path.endsWith('eas.json'));
    expect(eas).toBeDefined();
    expect(eas!.path).toBe(`${PROJECT_ROOT}/eas.json`);
  });

  it('should generate eas.json with valid JSON containing build profiles', () => {
    const eas = files.find((f) => f.path.endsWith('eas.json'));
    const parsed = JSON.parse(eas!.content);
    expect(parsed.build).toBeDefined();
    expect(parsed.build.development).toBeDefined();
    expect(parsed.build.preview).toBeDefined();
    expect(parsed.build.production).toBeDefined();
    expect(parsed.cli.version).toBeDefined();
  });

  it('should generate babel.config.js with correct path', () => {
    const babel = files.find((f) => f.path.endsWith('babel.config.js'));
    expect(babel).toBeDefined();
    expect(babel!.path).toBe(`${PROJECT_ROOT}/babel.config.js`);
  });

  it('should generate babel.config.js with babel-preset-expo', () => {
    const babel = files.find((f) => f.path.endsWith('babel.config.js'));
    expect(babel!.content).toContain('babel-preset-expo');
    expect(babel!.content).toContain('api.cache(true)');
    expect(babel!.content.length).toBeGreaterThan(0);
  });
});

describe('Flutter template', () => {
  const files = generateFlutterTemplate(PROJECT_ROOT);

  it('should return exactly 1 file', () => {
    expect(files).toHaveLength(1);
  });

  it('should generate analysis_options.yaml with correct path', () => {
    const analysis = files.find((f) => f.path.endsWith('analysis_options.yaml'));
    expect(analysis).toBeDefined();
    expect(analysis!.path).toBe(`${PROJECT_ROOT}/analysis_options.yaml`);
  });

  it('should generate analysis_options.yaml with Flutter lints', () => {
    const analysis = files.find((f) => f.path.endsWith('analysis_options.yaml'));
    expect(analysis!.content).toContain('flutter_lints/flutter.yaml');
    expect(analysis!.content).toContain('prefer_const_constructors');
    expect(analysis!.content).toContain('linter:');
    expect(analysis!.content.length).toBeGreaterThan(0);
  });
});

describe('SwiftUI template', () => {
  const files = generateSwiftUITemplate(PROJECT_ROOT);

  it('should return exactly 1 file', () => {
    expect(files).toHaveLength(1);
  });

  it('should generate .swiftlint.yml with correct path', () => {
    const swiftlint = files.find((f) => f.path.endsWith('.swiftlint.yml'));
    expect(swiftlint).toBeDefined();
    expect(swiftlint!.path).toBe(`${PROJECT_ROOT}/.swiftlint.yml`);
  });

  it('should generate .swiftlint.yml with disabled_rules section', () => {
    const swiftlint = files.find((f) => f.path.endsWith('.swiftlint.yml'));
    expect(swiftlint!.content).toContain('disabled_rules:');
    expect(swiftlint!.content).toContain('trailing_whitespace');
  });

  it('should generate .swiftlint.yml with opt_in_rules section', () => {
    const swiftlint = files.find((f) => f.path.endsWith('.swiftlint.yml'));
    expect(swiftlint!.content).toContain('opt_in_rules:');
    expect(swiftlint!.content).toContain('empty_count');
    expect(swiftlint!.content).toContain('missing_docs');
  });

  it('should generate .swiftlint.yml with line_length configuration', () => {
    const swiftlint = files.find((f) => f.path.endsWith('.swiftlint.yml'));
    expect(swiftlint!.content).toContain('line_length:');
    expect(swiftlint!.content).toContain('warning: 120');
    expect(swiftlint!.content).toContain('error: 200');
    expect(swiftlint!.content.length).toBeGreaterThan(0);
  });
});
