import type { GeneratedFile } from '../../core/types.js';

/** Generate React Native boilerplate config files */
export function generateReactNativeTemplate(projectRoot: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push({
    path: `${projectRoot}/metro.config.js`,
    content: `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
`,
  });

  files.push({
    path: `${projectRoot}/.watchmanconfig`,
    content: `{}\n`,
  });

  return files;
}
