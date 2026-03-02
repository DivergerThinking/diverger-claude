import { describe, it, expect } from 'vitest';
import { MobileAnalyzer } from '../../../../src/detection/analyzers/mobile.js';

const PKG_REACT_NATIVE = JSON.stringify({
  name: 'my-rn-app',
  dependencies: {
    'react': '^18.2.0',
    'react-native': '0.73.2',
  },
});

const PKG_EXPO = JSON.stringify({
  name: 'my-expo-app',
  dependencies: {
    'react': '^18.2.0',
    'react-native': '0.73.2',
    'expo': '~50.0.0',
  },
});

const PKG_EXPO_ONLY = JSON.stringify({
  name: 'my-expo-app',
  dependencies: {
    'expo': '~50.0.0',
  },
});

const PKG_UNRELATED = JSON.stringify({
  name: 'my-web-app',
  dependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
  },
});

const PUBSPEC_FLUTTER = `name: my_flutter_app
environment:
  sdk: ">=3.2.0 <4.0.0"
  flutter: ">=3.16.0"
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
dev_dependencies:
  flutter_test:
    sdk: flutter
`;

const PUBSPEC_NO_FLUTTER = `name: my_dart_lib
environment:
  sdk: ">=3.2.0 <4.0.0"
dependencies:
  http: ^1.1.0
`;

const GRADLE_KTS_COMPOSE = `plugins {
    id("com.android.application")
    kotlin("android") version "1.9.22"
}

android {
    compileSdk = 34

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    implementation("androidx.compose.ui:ui:1.5.4")
    implementation("androidx.compose.material3:material3:1.1.2")
}
`;

const GRADLE_KTS_KOTLIN_ANDROID = `plugins {
    id("com.android.application")
    kotlin("android") version "1.9.22"
}

android {
    compileSdk = 34
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
}
`;

const GRADLE_NO_COMPOSE = `plugins {
    id("com.android.application")
}

android {
    compileSdk = 34
}

dependencies {
    implementation("com.google.android.material:material:1.11.0")
}
`;

const SWIFT_FILE_WITH_SWIFTUI = `import SwiftUI

struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack {
            Text("Hello, World!")
            Button("Tap me") { count += 1 }
        }
    }
}
`;

const SWIFT_FILE_UIKIT = `import UIKit

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
    }
}
`;

const KOTLIN_FILE_COMPOSE = `package com.example.myapp

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}
`;

const KOTLIN_FILE_PLAIN = `package com.example.myapp

fun main() {
    println("Hello, Kotlin!")
}
`;

const APP_JSON_EXPO = JSON.stringify({
  expo: {
    name: 'my-app',
    slug: 'my-app',
    version: '1.0.0',
  },
});

const APP_JSON_RN = JSON.stringify({
  name: 'MyApp',
  displayName: 'My App',
});

describe('MobileAnalyzer', () => {
  const analyzer = new MobileAnalyzer();

  function makeFiles(entries: Record<string, string>): Map<string, string> {
    return new Map(Object.entries(entries));
  }

  // ── Basic properties ──────────────────────────────────────────────

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('mobile');
    expect(analyzer.name).toBe('Mobile Frameworks');
    expect(analyzer.filePatterns).toContain('package.json');
    expect(analyzer.filePatterns).toContain('pubspec.yaml');
    expect(analyzer.filePatterns).toContain('*.xcodeproj');
    expect(analyzer.filePatterns).toContain('Package.swift');
    expect(analyzer.filePatterns).toContain('build.gradle.kts');
    expect(analyzer.filePatterns).toContain('build.gradle');
    expect(analyzer.filePatterns).toContain('AndroidManifest.xml');
  });

  it('should return empty result when no relevant files found', async () => {
    const files = makeFiles({});
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should return empty result for unrelated package.json', async () => {
    const files = makeFiles({ 'package.json': PKG_UNRELATED });
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
  });

  // ── React Native detection ────────────────────────────────────────

  describe('React Native detection', () => {
    it('should detect React Native from package.json', async () => {
      const files = makeFiles({ 'package.json': PKG_REACT_NATIVE });
      const result = await analyzer.analyze(files, '/project');

      const rn = result.technologies.find((t) => t.id === 'react-native');
      expect(rn).toBeDefined();
      expect(rn!.name).toBe('React Native');
      expect(rn!.category).toBe('mobile');
      expect(rn!.confidence).toBe(90);
      expect(rn!.version).toBe('0.73.2');
      expect(rn!.majorVersion).toBe(0);
      expect(rn!.profileIds).toContain('frameworks/react-native');
      expect(rn!.evidence[0]!.trackedPackage).toBe('react-native');
      expect(result.analyzedFiles).toContain('package.json');
    });

    it('should boost React Native confidence from metro.config.js', async () => {
      const files = makeFiles({
        'package.json': PKG_REACT_NATIVE,
        'metro.config.js': 'module.exports = {};',
      });
      const result = await analyzer.analyze(files, '/project');

      const rn = result.technologies.find((t) => t.id === 'react-native');
      expect(rn).toBeDefined();
      expect(rn!.confidence).toBe(95); // 90 + 5
      expect(rn!.evidence.some((e) => e.description.includes('Metro config'))).toBe(true);
      expect(result.analyzedFiles).toContain('metro.config.js');
    });

    it('should boost React Native confidence from app.json without expo key', async () => {
      const files = makeFiles({
        'package.json': PKG_REACT_NATIVE,
        'app.json': APP_JSON_RN,
      });
      const result = await analyzer.analyze(files, '/project');

      const rn = result.technologies.find((t) => t.id === 'react-native');
      expect(rn).toBeDefined();
      expect(rn!.confidence).toBe(95); // 90 + 5
      expect(result.analyzedFiles).toContain('app.json');
    });

    it('should detect React Native from subdirectory package.json', async () => {
      const files = makeFiles({ 'mobile/package.json': PKG_REACT_NATIVE });
      const result = await analyzer.analyze(files, '/project');

      const rn = result.technologies.find((t) => t.id === 'react-native');
      expect(rn).toBeDefined();
      expect(rn!.evidence[0]!.source).toBe('mobile/package.json');
      expect(result.analyzedFiles).toContain('mobile/package.json');
    });
  });

  // ── Expo detection ────────────────────────────────────────────────

  describe('Expo detection', () => {
    it('should detect Expo from package.json', async () => {
      const files = makeFiles({ 'package.json': PKG_EXPO });
      const result = await analyzer.analyze(files, '/project');

      const expo = result.technologies.find((t) => t.id === 'expo');
      expect(expo).toBeDefined();
      expect(expo!.name).toBe('Expo');
      expect(expo!.category).toBe('mobile');
      expect(expo!.confidence).toBe(90);
      expect(expo!.version).toBe('50.0.0');
      expect(expo!.parentId).toBe('react-native');
      expect(expo!.profileIds).toContain('frameworks/expo');
      expect(expo!.evidence[0]!.trackedPackage).toBe('expo');
    });

    it('should detect both React Native and Expo from same package.json', async () => {
      const files = makeFiles({ 'package.json': PKG_EXPO });
      const result = await analyzer.analyze(files, '/project');

      expect(result.technologies.find((t) => t.id === 'react-native')).toBeDefined();
      expect(result.technologies.find((t) => t.id === 'expo')).toBeDefined();
    });

    it('should detect Expo even without explicit react-native dep', async () => {
      const files = makeFiles({ 'package.json': PKG_EXPO_ONLY });
      const result = await analyzer.analyze(files, '/project');

      const expo = result.technologies.find((t) => t.id === 'expo');
      expect(expo).toBeDefined();
      expect(expo!.confidence).toBe(90);
    });

    it('should boost Expo confidence from app.json with expo key', async () => {
      const files = makeFiles({
        'package.json': PKG_EXPO,
        'app.json': APP_JSON_EXPO,
      });
      const result = await analyzer.analyze(files, '/project');

      const expo = result.technologies.find((t) => t.id === 'expo');
      expect(expo).toBeDefined();
      expect(expo!.confidence).toBe(95); // 90 + 5
      expect(expo!.evidence.some((e) => e.description.includes('expo'))).toBe(true);
    });

    it('should boost Expo confidence from app.config.js', async () => {
      const files = makeFiles({
        'package.json': PKG_EXPO,
        'app.config.js': 'export default {};',
      });
      const result = await analyzer.analyze(files, '/project');

      const expo = result.technologies.find((t) => t.id === 'expo');
      expect(expo).toBeDefined();
      expect(expo!.confidence).toBe(95); // 90 + 5
      expect(result.analyzedFiles).toContain('app.config.js');
    });
  });

  // ── Flutter detection ─────────────────────────────────────────────

  describe('Flutter detection', () => {
    it('should detect Flutter from pubspec.yaml', async () => {
      const files = makeFiles({ 'pubspec.yaml': PUBSPEC_FLUTTER });
      const result = await analyzer.analyze(files, '/project');

      const flutter = result.technologies.find((t) => t.id === 'flutter');
      expect(flutter).toBeDefined();
      expect(flutter!.name).toBe('Flutter');
      expect(flutter!.category).toBe('mobile');
      expect(flutter!.confidence).toBe(90);
      expect(flutter!.parentId).toBe('dart');
      expect(flutter!.profileIds).toContain('frameworks/flutter');
      expect(flutter!.evidence[0]!.trackedPackage).toBe('flutter');
    });

    it('should detect Dart language alongside Flutter', async () => {
      const files = makeFiles({ 'pubspec.yaml': PUBSPEC_FLUTTER });
      const result = await analyzer.analyze(files, '/project');

      const dart = result.technologies.find((t) => t.id === 'dart');
      expect(dart).toBeDefined();
      expect(dart!.name).toBe('Dart');
      expect(dart!.category).toBe('language');
      expect(dart!.confidence).toBe(90);
      expect(dart!.profileIds).toContain('languages/dart');
    });

    it('should not detect Flutter from pubspec.yaml without flutter dependency', async () => {
      const files = makeFiles({ 'pubspec.yaml': PUBSPEC_NO_FLUTTER });
      const result = await analyzer.analyze(files, '/project');

      expect(result.technologies.find((t) => t.id === 'flutter')).toBeUndefined();
      expect(result.technologies.find((t) => t.id === 'dart')).toBeUndefined();
    });

    it('should boost Flutter confidence from lib/main.dart', async () => {
      const files = makeFiles({
        'pubspec.yaml': PUBSPEC_FLUTTER,
        'lib/main.dart': 'void main() => runApp(MyApp());',
      });
      const result = await analyzer.analyze(files, '/project');

      const flutter = result.technologies.find((t) => t.id === 'flutter');
      expect(flutter).toBeDefined();
      expect(flutter!.confidence).toBe(95); // 90 + 5
      expect(flutter!.evidence.some((e) => e.description.includes('entry point'))).toBe(true);
    });

    it('should boost Flutter confidence from .metadata file', async () => {
      const files = makeFiles({
        'pubspec.yaml': PUBSPEC_FLUTTER,
        '.metadata': '# Flutter metadata',
      });
      const result = await analyzer.analyze(files, '/project');

      const flutter = result.technologies.find((t) => t.id === 'flutter');
      expect(flutter).toBeDefined();
      expect(flutter!.confidence).toBe(95); // 90 + 5
    });

    it('should detect Flutter from subdirectory pubspec.yaml', async () => {
      const files = makeFiles({ 'apps/mobile/pubspec.yaml': PUBSPEC_FLUTTER });
      const result = await analyzer.analyze(files, '/project');

      const flutter = result.technologies.find((t) => t.id === 'flutter');
      expect(flutter).toBeDefined();
      expect(flutter!.evidence[0]!.source).toBe('apps/mobile/pubspec.yaml');
    });
  });

  // ── Swift / SwiftUI detection ─────────────────────────────────────

  describe('Swift / SwiftUI detection', () => {
    it('should detect Swift from .xcodeproj', async () => {
      const files = makeFiles({ 'MyApp.xcodeproj': '' });
      const result = await analyzer.analyze(files, '/project');

      const swift = result.technologies.find((t) => t.id === 'swift');
      expect(swift).toBeDefined();
      expect(swift!.name).toBe('Swift');
      expect(swift!.category).toBe('language');
      expect(swift!.profileIds).toContain('languages/swift');
    });

    it('should detect Swift from Package.swift', async () => {
      const files = makeFiles({ 'Package.swift': '// swift-tools-version:5.9' });
      const result = await analyzer.analyze(files, '/project');

      const swift = result.technologies.find((t) => t.id === 'swift');
      expect(swift).toBeDefined();
      expect(swift!.evidence.some((e) => e.description.includes('Swift Package Manager'))).toBe(true);
    });

    it('should detect Swift from .swift files', async () => {
      const files = makeFiles({ 'Sources/App.swift': SWIFT_FILE_UIKIT });
      const result = await analyzer.analyze(files, '/project');

      const swift = result.technologies.find((t) => t.id === 'swift');
      expect(swift).toBeDefined();
    });

    it('should detect SwiftUI from import SwiftUI', async () => {
      const files = makeFiles({
        'MyApp.xcodeproj': '',
        'Sources/ContentView.swift': SWIFT_FILE_WITH_SWIFTUI,
      });
      const result = await analyzer.analyze(files, '/project');

      const swiftui = result.technologies.find((t) => t.id === 'swiftui');
      expect(swiftui).toBeDefined();
      expect(swiftui!.name).toBe('SwiftUI');
      expect(swiftui!.category).toBe('mobile');
      expect(swiftui!.confidence).toBe(90);
      expect(swiftui!.parentId).toBe('swift');
      expect(swiftui!.profileIds).toContain('frameworks/swiftui');
    });

    it('should detect SwiftUI from @State and View pattern without import', async () => {
      const swiftWithPatterns = `struct MyView: View {
    @State var name = "World"
    var body: some View { Text("Hello") }
}`;
      const files = makeFiles({
        'MyApp.xcodeproj': '',
        'Sources/MyView.swift': swiftWithPatterns,
      });
      const result = await analyzer.analyze(files, '/project');

      const swiftui = result.technologies.find((t) => t.id === 'swiftui');
      expect(swiftui).toBeDefined();
      expect(swiftui!.confidence).toBe(80); // pattern-based, lower confidence
    });

    it('should not detect SwiftUI from UIKit-only swift files', async () => {
      const files = makeFiles({
        'MyApp.xcodeproj': '',
        'Sources/ViewController.swift': SWIFT_FILE_UIKIT,
      });
      const result = await analyzer.analyze(files, '/project');

      const swift = result.technologies.find((t) => t.id === 'swift');
      expect(swift).toBeDefined();
      const swiftui = result.technologies.find((t) => t.id === 'swiftui');
      expect(swiftui).toBeUndefined();
    });
  });

  // ── Kotlin / Jetpack Compose detection ────────────────────────────

  describe('Kotlin / Jetpack Compose detection', () => {
    it('should detect Kotlin and Jetpack Compose from build.gradle.kts', async () => {
      const files = makeFiles({ 'build.gradle.kts': GRADLE_KTS_COMPOSE });
      const result = await analyzer.analyze(files, '/project');

      const kotlin = result.technologies.find((t) => t.id === 'kotlin');
      expect(kotlin).toBeDefined();
      expect(kotlin!.name).toBe('Kotlin');
      expect(kotlin!.category).toBe('language');
      expect(kotlin!.version).toBe('1.9.22');
      expect(kotlin!.profileIds).toContain('languages/kotlin');

      const compose = result.technologies.find((t) => t.id === 'jetpack-compose');
      expect(compose).toBeDefined();
      expect(compose!.name).toBe('Jetpack Compose');
      expect(compose!.category).toBe('mobile');
      expect(compose!.confidence).toBe(90);
      expect(compose!.parentId).toBe('kotlin');
      expect(compose!.profileIds).toContain('frameworks/jetpack-compose');
    });

    it('should detect Kotlin Android without Compose', async () => {
      const files = makeFiles({ 'build.gradle.kts': GRADLE_KTS_KOTLIN_ANDROID });
      const result = await analyzer.analyze(files, '/project');

      const kotlin = result.technologies.find((t) => t.id === 'kotlin');
      expect(kotlin).toBeDefined();

      const compose = result.technologies.find((t) => t.id === 'jetpack-compose');
      expect(compose).toBeUndefined();
    });

    it('should not detect Kotlin from gradle without Android/Compose patterns', async () => {
      const files = makeFiles({ 'build.gradle.kts': GRADLE_NO_COMPOSE });
      const result = await analyzer.analyze(files, '/project');

      // No Kotlin Android patterns, so mobile analyzer should not detect kotlin
      // (JavaAnalyzer handles plain JVM Kotlin)
      const kotlin = result.technologies.find((t) => t.id === 'kotlin');
      expect(kotlin).toBeUndefined();
    });

    it('should detect Kotlin from .kt files when no gradle', async () => {
      const files = makeFiles({ 'src/Main.kt': KOTLIN_FILE_PLAIN });
      const result = await analyzer.analyze(files, '/project');

      const kotlin = result.technologies.find((t) => t.id === 'kotlin');
      expect(kotlin).toBeDefined();
      expect(kotlin!.confidence).toBe(80);
      expect(kotlin!.evidence[0]!.type).toBe('file-pattern');
    });

    it('should detect Jetpack Compose from @Composable in .kt files', async () => {
      const files = makeFiles({
        'src/Main.kt': KOTLIN_FILE_COMPOSE,
      });
      const result = await analyzer.analyze(files, '/project');

      const compose = result.technologies.find((t) => t.id === 'jetpack-compose');
      expect(compose).toBeDefined();
      expect(compose!.confidence).toBe(85); // content-based detection
      expect(compose!.parentId).toBe('kotlin');
    });

    it('should boost Kotlin and Compose confidence from AndroidManifest.xml', async () => {
      const files = makeFiles({
        'build.gradle.kts': GRADLE_KTS_COMPOSE,
        'app/src/main/AndroidManifest.xml': '<manifest package="com.example" />',
      });
      const result = await analyzer.analyze(files, '/project');

      const kotlin = result.technologies.find((t) => t.id === 'kotlin');
      expect(kotlin).toBeDefined();
      expect(kotlin!.confidence).toBe(95); // 90 + 5

      const compose = result.technologies.find((t) => t.id === 'jetpack-compose');
      expect(compose).toBeDefined();
      expect(compose!.confidence).toBe(95); // 90 + 5
    });
  });

  // ── Multiple frameworks ───────────────────────────────────────────

  describe('multiple mobile frameworks', () => {
    it('should detect React Native and Flutter in same project', async () => {
      const files = makeFiles({
        'package.json': PKG_REACT_NATIVE,
        'flutter_module/pubspec.yaml': PUBSPEC_FLUTTER,
      });
      const result = await analyzer.analyze(files, '/project');

      expect(result.technologies.find((t) => t.id === 'react-native')).toBeDefined();
      expect(result.technologies.find((t) => t.id === 'flutter')).toBeDefined();
      expect(result.technologies.find((t) => t.id === 'dart')).toBeDefined();
    });

    it('should detect Swift and Kotlin in same project', async () => {
      const files = makeFiles({
        'ios/MyApp.xcodeproj': '',
        'ios/Sources/App.swift': SWIFT_FILE_WITH_SWIFTUI,
        'android/build.gradle.kts': GRADLE_KTS_COMPOSE,
      });
      const result = await analyzer.analyze(files, '/project');

      expect(result.technologies.find((t) => t.id === 'swift')).toBeDefined();
      expect(result.technologies.find((t) => t.id === 'swiftui')).toBeDefined();
      expect(result.technologies.find((t) => t.id === 'kotlin')).toBeDefined();
      expect(result.technologies.find((t) => t.id === 'jetpack-compose')).toBeDefined();
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle malformed package.json gracefully', async () => {
      const files = makeFiles({ 'package.json': 'not valid json{{{' });
      const result = await analyzer.analyze(files, '/project');
      expect(result.technologies).toHaveLength(0);
    });

    it('should handle malformed pubspec.yaml gracefully', async () => {
      const files = makeFiles({ 'pubspec.yaml': ':\n  invalid: [yaml' });
      const result = await analyzer.analyze(files, '/project');
      expect(result.technologies).toHaveLength(0);
    });

    it('should not duplicate technologies from multiple package.json files', async () => {
      const files = makeFiles({
        'package.json': PKG_REACT_NATIVE,
        'apps/mobile/package.json': PKG_REACT_NATIVE,
      });
      const result = await analyzer.analyze(files, '/project');

      const rnEntries = result.technologies.filter((t) => t.id === 'react-native');
      expect(rnEntries).toHaveLength(1);
      // But should have evidence from both
      expect(rnEntries[0]!.evidence.length).toBeGreaterThan(1);
    });
  });
});
