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
    // Check actual dependency structures instead of naive string matching
    // XML parser returns deeply nested unknown structure; as any needed for traversal
    const project = (pom as any)?.project; // eslint-disable-line @typescript-eslint/no-explicit-any
    const deps = project?.dependencies?.dependency;
    const depArray = Array.isArray(deps) ? deps : deps ? [deps] : [];

    // XML dependency objects are untyped; as any needed for property access
    const hasSpringBoot = depArray.some((d: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      d.groupId?.includes('org.springframework.boot') || d.artifactId?.includes('spring-boot')
    ) || project?.parent?.groupId?.includes('org.springframework.boot');

    if (hasSpringBoot && !technologies.some((t) => t.id === 'spring-boot')) {
      technologies.push({
        id: 'spring-boot',
        name: 'Spring Boot',
        category: 'framework',
        confidence: 90,
        evidence: [{ source: 'pom.xml', type: 'manifest', description: 'Found "spring-boot" in dependencies', weight: 90 }],
        profileIds: ['frameworks/spring-boot'],
      });
    }

    const hasJUnit = depArray.some((d: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      d.artifactId?.includes('junit-jupiter') || d.artifactId?.includes('junit-vintage')
    );

    if (hasJUnit && !technologies.some((t) => t.id === 'junit')) {
      technologies.push({
        id: 'junit',
        name: 'JUnit',
        category: 'testing',
        confidence: 90,
        evidence: [{ source: 'pom.xml', type: 'manifest', description: 'Found "junit" in dependencies', weight: 90 }],
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
        evidence: [{ source: file, type: 'manifest', description: 'Found "spring-boot" in dependencies', weight: 90 }],
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
        evidence: [{ source: file, type: 'manifest', description: 'Found "junit" in dependencies', weight: 90 }],
        profileIds: ['testing/junit'],
      });
    }
  }
}
