import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseXml } from '../../utils/parsers.js';
import { findFileEntry, findFile, hasFile } from '../file-utils.js';

export class JavaAnalyzer extends BaseAnalyzer {
  readonly id = 'java';
  readonly name = 'Java / JVM';
  readonly filePatterns = ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    // Maven (pom.xml)
    const pomEntry = findFileEntry(files, 'pom.xml');
    if (pomEntry) {
      analyzedFiles.push(pomEntry.path);
      technologies.push({
        id: 'java',
        name: 'Java',
        category: 'language',
        confidence: 95,
        evidence: [{ source: pomEntry.path, type: 'manifest', description: 'Maven pom.xml found', weight: 95 }],
        profileIds: ['languages/java'],
      });

      try {
        const pom = parseXml<Record<string, unknown>>(pomEntry.content, pomEntry.path);
        this.detectMavenDeps(pom, technologies, pomEntry.path);
      } catch {
        // Continue without deep analysis
      }
    }

    // Gradle — determine filename based on which key exists in the map
    const hasBuildGradle = hasFile(files, 'build.gradle');
    const gradleContent = hasBuildGradle ? findFile(files, 'build.gradle') : findFile(files, 'build.gradle.kts');
    const gradleEntry = hasBuildGradle ? findFileEntry(files, 'build.gradle') : findFileEntry(files, 'build.gradle.kts');
    if (gradleContent && gradleEntry) {
      analyzedFiles.push(gradleEntry.path);
      if (!technologies.some((t) => t.id === 'java')) {
        technologies.push({
          id: 'java',
          name: 'Java',
          category: 'language',
          confidence: 95,
          evidence: [{ source: gradleEntry.path, type: 'manifest', description: `Gradle ${gradleEntry.path} found`, weight: 95 }],
          profileIds: ['languages/java'],
        });
      }

      this.detectGradleDeps(gradleContent, gradleEntry.path, technologies);
    }

    return { technologies, analyzedFiles };
  }

  private detectMavenDeps(pom: Record<string, unknown>, technologies: DetectedTechnology[], source: string): void {
    // Check actual dependency structures instead of naive string matching
    // XML parser returns deeply nested unknown structure; as any needed for traversal
    const project = (pom as any)?.project; // eslint-disable-line @typescript-eslint/no-explicit-any
    const deps = project?.dependencies?.dependency;
    const depArray = Array.isArray(deps) ? deps : deps ? [deps] : [];

    // XML dependency objects are untyped; type-guard for safe property access
    const strIncludes = (val: unknown, needle: string): boolean =>
      typeof val === 'string' && val.includes(needle);

    const hasSpringBoot = depArray.some((d: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      strIncludes(d.groupId, 'org.springframework.boot') || strIncludes(d.artifactId, 'spring-boot')
    ) || strIncludes(project?.parent?.groupId, 'org.springframework.boot');

    if (hasSpringBoot && !technologies.some((t) => t.id === 'spring-boot')) {
      technologies.push({
        id: 'spring-boot',
        name: 'Spring Boot',
        category: 'framework',
        confidence: 90,
        evidence: [{ source, type: 'manifest', description: 'Found "spring-boot" in dependencies', weight: 90, trackedPackage: 'spring-boot' }],
        profileIds: ['frameworks/spring-boot'],
      });
    }

    const hasJUnit = depArray.some((d: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      strIncludes(d.artifactId, 'junit-jupiter') || strIncludes(d.artifactId, 'junit-vintage')
    );

    if (hasJUnit && !technologies.some((t) => t.id === 'junit')) {
      technologies.push({
        id: 'junit',
        name: 'JUnit',
        category: 'testing',
        confidence: 90,
        evidence: [{ source, type: 'manifest', description: 'Found "junit" in dependencies', weight: 90, trackedPackage: 'junit' }],
        profileIds: ['testing/junit'],
      });
    }
  }

  private detectGradleDeps(
    content: string,
    file: string,
    technologies: DetectedTechnology[],
  ): void {
    // Use regex for proper dependency declarations to avoid matching comments
    const springBootRegex = /(['"])org\.springframework\.boot[:']/;
    const hasSpringBoot = springBootRegex.test(content);

    if (hasSpringBoot && !technologies.some((t) => t.id === 'spring-boot')) {
      technologies.push({
        id: 'spring-boot',
        name: 'Spring Boot',
        category: 'framework',
        confidence: 90,
        evidence: [{ source: file, type: 'manifest', description: 'Found "spring-boot" in dependencies', weight: 90, trackedPackage: 'spring-boot' }],
        profileIds: ['frameworks/spring-boot'],
      });
    }

    const junitRegex = /(['"])org\.junit\.|testImplementation.*junit/;
    const hasJUnit = junitRegex.test(content);

    if (hasJUnit && !technologies.some((t) => t.id === 'junit')) {
      technologies.push({
        id: 'junit',
        name: 'JUnit',
        category: 'testing',
        confidence: 90,
        evidence: [{ source: file, type: 'manifest', description: 'Found "junit" in dependencies', weight: 90, trackedPackage: 'junit' }],
        profileIds: ['testing/junit'],
      });
    }
  }
}
