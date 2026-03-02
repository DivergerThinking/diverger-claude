import type { GeneratedFile } from '../../core/types.js';

/** Generate Expo boilerplate config files */
export function generateExpoTemplate(projectRoot: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push({
    path: `${projectRoot}/app.config.ts`,
    content: `import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'my-app',
  slug: 'my-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.myapp',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.example.myapp',
  },
  plugins: [],
});
`,
  });

  files.push({
    path: `${projectRoot}/eas.json`,
    content: JSON.stringify({
      cli: { version: '>= 5.0.0' },
      build: {
        development: {
          developmentClient: true,
          distribution: 'internal',
        },
        preview: {
          distribution: 'internal',
        },
        production: {},
      },
      submit: {
        production: {},
      },
    }, null, 2) + '\n',
  });

  files.push({
    path: `${projectRoot}/babel.config.js`,
    content: `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
`,
  });

  return files;
}
