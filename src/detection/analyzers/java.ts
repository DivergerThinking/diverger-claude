import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseXml } from '../../utils/parsers.js';

export class JavaAnalyzer extends BaseAnalyzer {
  readonly id = 'java';
  readonly name = 'Java / JVM';
  readonly filePatterns = ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    // Maven (pom.xml)
    const pomContent = files.get('pom.xml');
    if (pomContent) {
      analyzedFiles.push('pom.xml');
      technologies.push({
        id: 'java',
        name: 'Java',
        category: 'language',
        confidence: 95,
        evidence: [{ source: 'pom.xml', type: 'manifest', description: 'Maven pom.xml found', weight: 95 }],
        profileIds: ['languages/java'],
      });

      try {
        const pom = parseXml<Record<string, unknown>>(pomContent, 'pom.xml');
        this.detectMavenDeps(pom, technologies);
      } catch {
        // Continue without deep analysis
      }
    }

    // Gradle
    const gradleContent = files.get('build.gradle') ?? files.get('build.gradle.kts');
    const gradleFile = files.has('build.gradle') ? 'build.gradle' : 'build.gradle.kts';
    if (gradleContent) {
      analyzedFiles.push(gradleFile);
      if (!technologies.some((t) => t.id === 'java')) {
        technologies.push({
          id: 'java',
          name: 'Java',
          category: 'language',
          confidence: 95,
          evidence: [{ source: gradleFile, type: 'manifest', description: `Gradle ${gradleFile} found`, weight: 95 }],
          profileIds: ['languages/java'],
        });
      }

      this.detectGradleDeps(gradleContent, gradleFile, technologies);
    }

    return { technologies, analyzedFiles };
  }

  private detectMavenDeps(pom: Record<string, unknown>, technologies: DetectedTechnology[]): void {
    const pomStr = JSON.stringify(pom);

    if (pomStr.includes('spring-boot')) {
      technologies.push({
        id: 'spring-boot',
        name: 'Spring Boot',
        category: 'framework',
        confidence: 90,
        evidence: [{ source: 'pom.xml', type: 'manifest', description: 'Spring Boot dependency found in pom.xml', weight: 90 }],
        profileIds: ['frameworks/spring-boot'],
      });
    }

    if (pomStr.includes('junit-jupiter') || pomStr.includes('junit-vintage')) {
      technologies.push({
        id: 'junit',
        name: 'JUnit',
        category: 'testing',
        confidence: 90,
        evidence: [{ source: 'pom.xml', type: 'manifest', description: 'JUnit dependency found', weight: 90 }],
        profileIds: ['testing/junit'],
      });
    }
  }

  private detectGradleDeps(
    content: string,
    file: string,
    technologies: DetectedTechnology[],
  ): void {
    if (content.includes('spring-boot') || content.includes('org.springframework.boot')) {
      technologies.push({
        id: 'spring-boot',
        name: 'Spring Boot',
        category: 'framework',
        confidence: 90,
        evidence: [{ source: file, type: 'manifest', description: 'Spring Boot found in Gradle build', weight: 90 }],
        profileIds: ['frameworks/spring-boot'],
      });
    }

    if (content.includes('junit') || content.includes('org.junit')) {
      technologies.push({
        id: 'junit',
        name: 'JUnit',
        category: 'testing',
        confidence: 90,
        evidence: [{ source: file, type: 'manifest', description: 'JUnit found in Gradle build', weight: 90 }],
        profileIds: ['testing/junit'],
      });
    }
  }
}
