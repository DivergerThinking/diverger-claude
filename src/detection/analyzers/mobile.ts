import path from 'path';
import type { AnalyzerResult, DetectedTechnology, DetectionEvidence } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseJson, parseYaml } from '../../utils/parsers.js';
import { findAllFileEntries, findFileEntry, hasFile } from '../file-utils.js';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PubspecYaml {
  name?: string;
  dependencies?: Record<string, unknown>;
  dev_dependencies?: Record<string, unknown>;
  environment?: {
    sdk?: string;
    flutter?: string;
  };
}

interface AppJson {
  expo?: Record<string, unknown>;
  name?: string;
  displayName?: string;
}

export class MobileAnalyzer extends BaseAnalyzer {
  readonly id = 'mobile';
  readonly name = 'Mobile Frameworks';
  readonly filePatterns = [
    'package.json',
    'pubspec.yaml',
    '*.xcodeproj',
    'Package.swift',
    'build.gradle.kts',
    'build.gradle',
    'AndroidManifest.xml',
    'app.json',
    'metro.config.*',
    '*.swift',
    '*.kt',
    '*.dart',
  ];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    this.detectReactNativeAndExpo(files, technologies, analyzedFiles);
    this.detectFlutter(files, technologies, analyzedFiles);
    this.detectSwiftUI(files, technologies, analyzedFiles);
    this.detectJetpackCompose(files, technologies, analyzedFiles);

    return { technologies, analyzedFiles };
  }

  // ── React Native & Expo ─────────────────────────────────────────────

  private detectReactNativeAndExpo(
    files: Map<string, string>,
    technologies: DetectedTechnology[],
    analyzedFiles: string[],
  ): void {
    const pkgEntries = findAllFileEntries(files, 'package.json');

    for (const entry of pkgEntries) {
      let pkg: PackageJson;
      try {
        pkg = parseJson<PackageJson>(entry.content, entry.path);
      } catch {
        continue;
      }

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // React Native detection
      if ('react-native' in allDeps) {
        if (!analyzedFiles.includes(entry.path)) {
          analyzedFiles.push(entry.path);
        }
        const version = allDeps['react-native'];
        const isGitUrl = version && /^(git[+:]|github:|https?:\/\/|file:)/.test(version);
        const cleanVersion = isGitUrl ? undefined : version?.replace(/^[\^~>=<]*/g, '');
        const majorVersion = isGitUrl ? undefined : this.extractMajorVersion(version);

        if (!technologies.some((t) => t.id === 'react-native')) {
          technologies.push({
            id: 'react-native',
            name: 'React Native',
            category: 'mobile',
            version: cleanVersion,
            majorVersion,
            confidence: 90,
            evidence: [{
              source: entry.path,
              type: 'manifest',
              description: `Found "react-native" in dependencies${version ? ` (${version})` : ''}`,
              weight: 90,
              trackedPackage: 'react-native',
            }],
            profileIds: ['frameworks/react-native'],
          });
        } else {
          const existing = technologies.find((t) => t.id === 'react-native');
          if (existing) {
            existing.evidence.push({
              source: entry.path,
              type: 'manifest',
              description: `Additional package.json with react-native: ${entry.path}`,
              weight: 10,
            });
          }
        }
      }

      // Expo detection
      if ('expo' in allDeps) {
        if (!analyzedFiles.includes(entry.path)) {
          analyzedFiles.push(entry.path);
        }
        const version = allDeps['expo'];
        const isGitUrl = version && /^(git[+:]|github:|https?:\/\/|file:)/.test(version);
        const cleanVersion = isGitUrl ? undefined : version?.replace(/^[\^~>=<]*/g, '');
        const majorVersion = isGitUrl ? undefined : this.extractMajorVersion(version);

        if (!technologies.some((t) => t.id === 'expo')) {
          technologies.push({
            id: 'expo',
            name: 'Expo',
            category: 'mobile',
            version: cleanVersion,
            majorVersion,
            confidence: 90,
            evidence: [{
              source: entry.path,
              type: 'manifest',
              description: `Found "expo" in dependencies${version ? ` (${version})` : ''}`,
              weight: 90,
              trackedPackage: 'expo',
            }],
            parentId: 'react-native',
            profileIds: ['frameworks/expo'],
          });
        } else {
          const existing = technologies.find((t) => t.id === 'expo');
          if (existing) {
            existing.evidence.push({
              source: entry.path,
              type: 'manifest',
              description: `Additional package.json with expo: ${entry.path}`,
              weight: 10,
            });
          }
        }
      }
    }

    // Boost React Native confidence from config files
    this.boostReactNativeFromConfigs(files, technologies, analyzedFiles);
  }

  private boostReactNativeFromConfigs(
    files: Map<string, string>,
    technologies: DetectedTechnology[],
    analyzedFiles: string[],
  ): void {
    // metro.config.* boosts React Native
    for (const [filePath] of files) {
      const basename = path.basename(filePath);
      if (basename.startsWith('metro.config.')) {
        const rnTech = technologies.find((t) => t.id === 'react-native');
        if (rnTech) {
          if (!analyzedFiles.includes(filePath)) {
            analyzedFiles.push(filePath);
          }
          rnTech.evidence.push({
            source: filePath,
            type: 'config-file',
            description: `Metro config found: ${filePath}`,
            weight: 5,
          });
          rnTech.confidence = Math.min(100, rnTech.confidence + 5);
        }
        break; // Only boost once
      }
    }

    // app.json with "expo" key boosts Expo, without it boosts React Native
    const appJsonEntry = findFileEntry(files, 'app.json');
    if (appJsonEntry) {
      if (!analyzedFiles.includes(appJsonEntry.path)) {
        analyzedFiles.push(appJsonEntry.path);
      }

      try {
        const appJson = parseJson<AppJson>(appJsonEntry.content, appJsonEntry.path);

        if (appJson.expo) {
          const expoTech = technologies.find((t) => t.id === 'expo');
          if (expoTech) {
            expoTech.evidence.push({
              source: appJsonEntry.path,
              type: 'config-file',
              description: 'app.json contains "expo" configuration',
              weight: 5,
            });
            expoTech.confidence = Math.min(100, expoTech.confidence + 5);
          }
        } else {
          // app.json without expo key still boosts RN
          const rnTech = technologies.find((t) => t.id === 'react-native');
          if (rnTech) {
            rnTech.evidence.push({
              source: appJsonEntry.path,
              type: 'config-file',
              description: 'app.json found (React Native project config)',
              weight: 5,
            });
            rnTech.confidence = Math.min(100, rnTech.confidence + 5);
          }
        }
      } catch {
        // Malformed app.json — still boost RN if present
        const rnTech = technologies.find((t) => t.id === 'react-native');
        if (rnTech) {
          rnTech.evidence.push({
            source: appJsonEntry.path,
            type: 'config-file',
            description: 'app.json found (unparseable)',
            weight: 2,
          });
          rnTech.confidence = Math.min(100, rnTech.confidence + 2);
        }
      }
    }

    // app.config.js / app.config.ts boosts Expo
    for (const configName of ['app.config.js', 'app.config.ts']) {
      if (hasFile(files, configName)) {
        const expoTech = technologies.find((t) => t.id === 'expo');
        if (expoTech) {
          for (const filePath of files.keys()) {
            if (path.basename(filePath) === configName) {
              if (!analyzedFiles.includes(filePath)) {
                analyzedFiles.push(filePath);
              }
              expoTech.evidence.push({
                source: filePath,
                type: 'config-file',
                description: `Expo config found: ${filePath}`,
                weight: 5,
              });
              expoTech.confidence = Math.min(100, expoTech.confidence + 5);
              break;
            }
          }
        }
      }
    }
  }

  // ── Flutter ─────────────────────────────────────────────────────────

  private detectFlutter(
    files: Map<string, string>,
    technologies: DetectedTechnology[],
    analyzedFiles: string[],
  ): void {
    const pubspecEntries = findAllFileEntries(files, 'pubspec.yaml');

    for (const entry of pubspecEntries) {
      let pubspec: PubspecYaml;
      try {
        pubspec = parseYaml<PubspecYaml>(entry.content, entry.path);
      } catch {
        continue;
      }

      const allDeps = {
        ...pubspec.dependencies,
        ...pubspec.dev_dependencies,
      };

      if ('flutter' in allDeps || pubspec.environment?.flutter) {
        if (!analyzedFiles.includes(entry.path)) {
          analyzedFiles.push(entry.path);
        }

        const flutterVersion = typeof pubspec.environment?.flutter === 'string'
          ? pubspec.environment.flutter.replace(/^[\^~>=<]*/g, '')
          : undefined;

        // Detect Dart language
        if (!technologies.some((t) => t.id === 'dart')) {
          const dartVersion = typeof pubspec.environment?.sdk === 'string'
            ? pubspec.environment.sdk.replace(/^[\^~>=<]*/g, '')
            : undefined;

          technologies.push({
            id: 'dart',
            name: 'Dart',
            category: 'language',
            version: dartVersion,
            majorVersion: dartVersion ? this.extractMajorVersion(dartVersion) : undefined,
            confidence: 90,
            evidence: [{
              source: entry.path,
              type: 'manifest',
              description: 'pubspec.yaml found with Flutter dependency',
              weight: 90,
            }],
            profileIds: ['languages/dart'],
          });
        }

        // Detect Flutter framework
        if (!technologies.some((t) => t.id === 'flutter')) {
          technologies.push({
            id: 'flutter',
            name: 'Flutter',
            category: 'mobile',
            version: flutterVersion,
            majorVersion: flutterVersion ? this.extractMajorVersion(flutterVersion) : undefined,
            confidence: 90,
            evidence: [{
              source: entry.path,
              type: 'manifest',
              description: 'Found "flutter" in pubspec.yaml dependencies',
              weight: 90,
              trackedPackage: 'flutter',
            }],
            parentId: 'dart',
            profileIds: ['frameworks/flutter'],
          });
        } else {
          const existing = technologies.find((t) => t.id === 'flutter');
          if (existing) {
            existing.evidence.push({
              source: entry.path,
              type: 'manifest',
              description: `Additional pubspec.yaml with flutter: ${entry.path}`,
              weight: 10,
            });
          }
        }
      }
    }

    // Boost from evidence files
    this.boostFlutterFromConfigs(files, technologies, analyzedFiles);
  }

  private boostFlutterFromConfigs(
    files: Map<string, string>,
    technologies: DetectedTechnology[],
    analyzedFiles: string[],
  ): void {
    const flutterTech = technologies.find((t) => t.id === 'flutter');
    if (!flutterTech) return;

    // lib/main.dart boosts Flutter
    for (const [filePath] of files) {
      const basename = path.basename(filePath);
      if (basename === 'main.dart' && filePath.includes('lib/')) {
        if (!analyzedFiles.includes(filePath)) {
          analyzedFiles.push(filePath);
        }
        flutterTech.evidence.push({
          source: filePath,
          type: 'file-pattern',
          description: `Flutter entry point found: ${filePath}`,
          weight: 5,
        });
        flutterTech.confidence = Math.min(100, flutterTech.confidence + 5);
        break;
      }
    }

    // .metadata file boosts Flutter
    if (hasFile(files, '.metadata')) {
      for (const filePath of files.keys()) {
        if (path.basename(filePath) === '.metadata') {
          if (!analyzedFiles.includes(filePath)) {
            analyzedFiles.push(filePath);
          }
          flutterTech.evidence.push({
            source: filePath,
            type: 'config-file',
            description: 'Flutter .metadata file found',
            weight: 5,
          });
          flutterTech.confidence = Math.min(100, flutterTech.confidence + 5);
          break;
        }
      }
    }
  }

  // ── Swift / SwiftUI ─────────────────────────────────────────────────

  private detectSwiftUI(
    files: Map<string, string>,
    technologies: DetectedTechnology[],
    analyzedFiles: string[],
  ): void {
    let swiftDetected = false;
    const swiftEvidence: DetectionEvidence[] = [];

    // Check for *.xcodeproj
    for (const [filePath] of files) {
      const basename = path.basename(filePath);
      if (basename.endsWith('.xcodeproj')) {
        if (!analyzedFiles.includes(filePath)) {
          analyzedFiles.push(filePath);
        }
        swiftEvidence.push({
          source: filePath,
          type: 'file-pattern',
          description: `Xcode project found: ${filePath}`,
          weight: 85,
        });
        swiftDetected = true;
        break;
      }
    }

    // Check for Package.swift (Swift Package Manager)
    const packageSwift = findFileEntry(files, 'Package.swift');
    if (packageSwift) {
      if (!analyzedFiles.includes(packageSwift.path)) {
        analyzedFiles.push(packageSwift.path);
      }
      swiftEvidence.push({
        source: packageSwift.path,
        type: 'manifest',
        description: 'Swift Package Manager manifest found',
        weight: 90,
      });
      swiftDetected = true;
    }

    // Check for *.swift files
    let hasSwiftFiles = false;
    for (const [filePath] of files) {
      const basename = path.basename(filePath);
      if (basename.endsWith('.swift') && basename !== 'Package.swift') {
        hasSwiftFiles = true;
        if (!swiftDetected) {
          if (!analyzedFiles.includes(filePath)) {
            analyzedFiles.push(filePath);
          }
          swiftEvidence.push({
            source: filePath,
            type: 'file-pattern',
            description: `Swift source file found: ${filePath}`,
            weight: 80,
          });
          swiftDetected = true;
        }
        break;
      }
    }

    if (!swiftDetected) return;

    // Detect Swift language
    const maxWeight = Math.max(...swiftEvidence.map((e) => e.weight));
    technologies.push({
      id: 'swift',
      name: 'Swift',
      category: 'language',
      confidence: maxWeight,
      evidence: swiftEvidence,
      profileIds: ['languages/swift'],
    });

    // Detect SwiftUI from file content
    let swiftuiDetected = false;
    for (const [filePath, content] of files) {
      const basename = path.basename(filePath);
      if (basename.endsWith('.swift') && basename !== 'Package.swift') {
        if (content.includes('import SwiftUI') || content.includes('SwiftUI.App')) {
          if (!analyzedFiles.includes(filePath)) {
            analyzedFiles.push(filePath);
          }
          swiftuiDetected = true;
          technologies.push({
            id: 'swiftui',
            name: 'SwiftUI',
            category: 'mobile',
            confidence: 90,
            evidence: [{
              source: filePath,
              type: 'content',
              description: `SwiftUI import found in ${filePath}`,
              weight: 90,
            }],
            parentId: 'swift',
            profileIds: ['frameworks/swiftui'],
          });
          break;
        }
      }
    }

    // If we have xcodeproj but no explicit SwiftUI import, still check for SwiftUI indicators
    if (!swiftuiDetected && hasSwiftFiles) {
      for (const [filePath, content] of files) {
        const basename = path.basename(filePath);
        if (basename.endsWith('.swift')) {
          // Check for SwiftUI patterns: View protocol, @State, @Binding, etc.
          if (
            /struct\s+\w+\s*:\s*.*\bView\b/.test(content) ||
            /@(State|Binding|ObservedObject|StateObject|EnvironmentObject)\b/.test(content)
          ) {
            if (!analyzedFiles.includes(filePath)) {
              analyzedFiles.push(filePath);
            }
            technologies.push({
              id: 'swiftui',
              name: 'SwiftUI',
              category: 'mobile',
              confidence: 80,
              evidence: [{
                source: filePath,
                type: 'content',
                description: `SwiftUI patterns detected in ${filePath}`,
                weight: 80,
              }],
              parentId: 'swift',
              profileIds: ['frameworks/swiftui'],
            });
            break;
          }
        }
      }
    }
  }

  // ── Kotlin / Jetpack Compose ────────────────────────────────────────

  private detectJetpackCompose(
    files: Map<string, string>,
    technologies: DetectedTechnology[],
    analyzedFiles: string[],
  ): void {
    // Check build.gradle.kts or build.gradle for Compose
    const hasBuildGradleKts = hasFile(files, 'build.gradle.kts');
    const hasBuildGradle = hasFile(files, 'build.gradle');
    const gradleEntry = hasBuildGradleKts
      ? findFileEntry(files, 'build.gradle.kts')
      : hasBuildGradle
        ? findFileEntry(files, 'build.gradle')
        : undefined;

    let kotlinDetected = false;
    let composeDetected = false;

    if (gradleEntry) {
      const content = gradleEntry.content;

      // Check for Kotlin Android patterns (requires explicit Kotlin plugin, not just Android app plugin)
      const hasKotlinAndroid =
        content.includes('kotlin("android")') ||
        content.includes("id 'org.jetbrains.kotlin.android'") ||
        content.includes('id("org.jetbrains.kotlin.android")') ||
        content.includes("apply plugin: 'kotlin-android'");

      // Check for Compose
      const hasCompose =
        content.includes('compose') &&
        (content.includes('androidx.compose') ||
          content.includes('buildFeatures') ||
          content.includes('composeOptions') ||
          /compose\s*[=(]\s*true/.test(content));

      if (hasKotlinAndroid || hasCompose) {
        if (!analyzedFiles.includes(gradleEntry.path)) {
          analyzedFiles.push(gradleEntry.path);
        }

        // Detect Kotlin language
        if (!technologies.some((t) => t.id === 'kotlin')) {
          const versionMatch = content.match(/kotlin\(["'](?:android|jvm)["']\)\s+version\s+["'](\d+\.\d+[\d.]*)/);
          const kotlinVersion = versionMatch?.[1];

          technologies.push({
            id: 'kotlin',
            name: 'Kotlin',
            category: 'language',
            version: kotlinVersion,
            majorVersion: kotlinVersion ? this.extractMajorVersion(kotlinVersion) : undefined,
            confidence: 90,
            evidence: [{
              source: gradleEntry.path,
              type: 'manifest',
              description: `Kotlin Android project detected in ${gradleEntry.path}`,
              weight: 90,
            }],
            profileIds: ['languages/kotlin'],
          });
          kotlinDetected = true;
        }

        // Detect Jetpack Compose
        if (hasCompose && !technologies.some((t) => t.id === 'jetpack-compose')) {
          technologies.push({
            id: 'jetpack-compose',
            name: 'Jetpack Compose',
            category: 'mobile',
            confidence: 90,
            evidence: [{
              source: gradleEntry.path,
              type: 'manifest',
              description: `Found Jetpack Compose configuration in ${gradleEntry.path}`,
              weight: 90,
            }],
            parentId: 'kotlin',
            profileIds: ['frameworks/jetpack-compose'],
          });
          composeDetected = true;
        }
      }
    }

    // Check for *.kt files as additional evidence
    if (!kotlinDetected) {
      for (const [filePath] of files) {
        const basename = path.basename(filePath);
        if (basename.endsWith('.kt')) {
          if (!analyzedFiles.includes(filePath)) {
            analyzedFiles.push(filePath);
          }

          if (!technologies.some((t) => t.id === 'kotlin')) {
            technologies.push({
              id: 'kotlin',
              name: 'Kotlin',
              category: 'language',
              confidence: 80,
              evidence: [{
                source: filePath,
                type: 'file-pattern',
                description: `Kotlin source file found: ${filePath}`,
                weight: 80,
              }],
              profileIds: ['languages/kotlin'],
            });
            kotlinDetected = true;
          }
          break;
        }
      }
    }

    // Check AndroidManifest.xml for additional evidence
    if (hasFile(files, 'AndroidManifest.xml')) {
      const manifestEntry = findFileEntry(files, 'AndroidManifest.xml');
      if (manifestEntry) {
        if (!analyzedFiles.includes(manifestEntry.path)) {
          analyzedFiles.push(manifestEntry.path);
        }

        // Boost Kotlin confidence if detected
        const kotlinTech = technologies.find((t) => t.id === 'kotlin');
        if (kotlinTech) {
          kotlinTech.evidence.push({
            source: manifestEntry.path,
            type: 'config-file',
            description: 'AndroidManifest.xml found',
            weight: 5,
          });
          kotlinTech.confidence = Math.min(100, kotlinTech.confidence + 5);
        }

        // Boost Jetpack Compose confidence if detected
        const composeTech = technologies.find((t) => t.id === 'jetpack-compose');
        if (composeTech) {
          composeTech.evidence.push({
            source: manifestEntry.path,
            type: 'config-file',
            description: 'AndroidManifest.xml found',
            weight: 5,
          });
          composeTech.confidence = Math.min(100, composeTech.confidence + 5);
        }
      }
    }

    // Check *.kt files for @Composable patterns if Compose not yet detected
    if (kotlinDetected && !composeDetected) {
      for (const [filePath, content] of files) {
        const basename = path.basename(filePath);
        if (basename.endsWith('.kt')) {
          if (
            content.includes('import androidx.compose') ||
            content.includes('@Composable')
          ) {
            if (!analyzedFiles.includes(filePath)) {
              analyzedFiles.push(filePath);
            }
            if (!technologies.some((t) => t.id === 'jetpack-compose')) {
              technologies.push({
                id: 'jetpack-compose',
                name: 'Jetpack Compose',
                category: 'mobile',
                confidence: 85,
                evidence: [{
                  source: filePath,
                  type: 'content',
                  description: `Jetpack Compose usage detected in ${filePath}`,
                  weight: 85,
                }],
                parentId: 'kotlin',
                profileIds: ['frameworks/jetpack-compose'],
              });
            }
            break;
          }
        }
      }
    }
  }

  // ── Utilities ───────────────────────────────────────────────────────

  private extractMajorVersion(versionStr?: string): number | undefined {
    if (!versionStr) return undefined;
    const match = versionStr.replace(/^[\^~>=<]*/g, '').match(/^(\d+)/);
    return match ? parseInt(match[1]!, 10) : undefined;
  }
}
