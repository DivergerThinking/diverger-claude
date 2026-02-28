import { describe, it, expect } from 'vitest';
import { JavaAnalyzer } from '../../../../src/detection/analyzers/java.js';

const POM_BASIC = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>myapp</artifactId>
  <version>1.0.0</version>
</project>`;

const POM_SPRING_BOOT = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>
  <groupId>com.example</groupId>
  <artifactId>myapp</artifactId>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`;

const GRADLE_BASIC = `plugins {
    id 'java'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}
`;

const GRADLE_KTS = `plugins {
    kotlin("jvm") version "1.9.0"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:3.2.0")
}
`;

describe('JavaAnalyzer', () => {
  const analyzer = new JavaAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('java');
    expect(analyzer.name).toBe('Java / JVM');
    expect(analyzer.filePatterns).toContain('pom.xml');
    expect(analyzer.filePatterns).toContain('build.gradle');
    expect(analyzer.filePatterns).toContain('build.gradle.kts');
  });

  it('should return empty result when no manifest found', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect Java from bare pom.xml', async () => {
    const files = new Map<string, string>();
    files.set('pom.xml', POM_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const java = result.technologies.find((t) => t.id === 'java');
    expect(java).toBeDefined();
    expect(java!.name).toBe('Java');
    expect(java!.category).toBe('language');
    expect(java!.confidence).toBe(95);
    expect(java!.profileIds).toContain('languages/java');
    expect(result.analyzedFiles).toContain('pom.xml');
  });

  it('should detect Spring Boot from pom.xml parent', async () => {
    const files = new Map<string, string>();
    files.set('pom.xml', POM_SPRING_BOOT);
    const result = await analyzer.analyze(files, '/project');

    const springBoot = result.technologies.find((t) => t.id === 'spring-boot');
    expect(springBoot).toBeDefined();
    expect(springBoot!.name).toBe('Spring Boot');
    expect(springBoot!.category).toBe('framework');
    expect(springBoot!.confidence).toBe(90);
    expect(springBoot!.profileIds).toContain('frameworks/spring-boot');
  });

  it('should detect JUnit from pom.xml dependencies', async () => {
    const files = new Map<string, string>();
    files.set('pom.xml', POM_SPRING_BOOT);
    const result = await analyzer.analyze(files, '/project');

    const junit = result.technologies.find((t) => t.id === 'junit');
    expect(junit).toBeDefined();
    expect(junit!.name).toBe('JUnit');
    expect(junit!.category).toBe('testing');
    expect(junit!.profileIds).toContain('testing/junit');
  });

  it('should detect Java from build.gradle', async () => {
    const files = new Map<string, string>();
    files.set('build.gradle', GRADLE_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const java = result.technologies.find((t) => t.id === 'java');
    expect(java).toBeDefined();
    expect(java!.confidence).toBe(95);
    expect(result.analyzedFiles).toContain('build.gradle');
  });

  it('should detect Spring Boot from build.gradle', async () => {
    const files = new Map<string, string>();
    files.set('build.gradle', GRADLE_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const springBoot = result.technologies.find((t) => t.id === 'spring-boot');
    expect(springBoot).toBeDefined();
  });

  it('should detect JUnit from build.gradle testImplementation', async () => {
    const files = new Map<string, string>();
    files.set('build.gradle', GRADLE_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const junit = result.technologies.find((t) => t.id === 'junit');
    expect(junit).toBeDefined();
  });

  it('should detect Java from build.gradle.kts', async () => {
    const files = new Map<string, string>();
    files.set('build.gradle.kts', GRADLE_KTS);
    const result = await analyzer.analyze(files, '/project');

    const java = result.technologies.find((t) => t.id === 'java');
    expect(java).toBeDefined();
    expect(result.analyzedFiles).toContain('build.gradle.kts');
  });

  it('should not duplicate Java when both pom.xml and build.gradle exist', async () => {
    const files = new Map<string, string>();
    files.set('pom.xml', POM_BASIC);
    files.set('build.gradle', GRADLE_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const javaEntries = result.technologies.filter((t) => t.id === 'java');
    expect(javaEntries).toHaveLength(1);
  });

  it('should handle malformed pom.xml gracefully', async () => {
    const files = new Map<string, string>();
    files.set('pom.xml', '<not-valid-xml>');
    const result = await analyzer.analyze(files, '/project');

    // Should still detect Java from file presence
    const java = result.technologies.find((t) => t.id === 'java');
    expect(java).toBeDefined();
    // But no framework detection from malformed XML
    const springBoot = result.technologies.find((t) => t.id === 'spring-boot');
    expect(springBoot).toBeUndefined();
  });

  it('should include proper evidence', async () => {
    const files = new Map<string, string>();
    files.set('pom.xml', POM_SPRING_BOOT);
    const result = await analyzer.analyze(files, '/project');

    const springBoot = result.technologies.find((t) => t.id === 'spring-boot');
    expect(springBoot!.evidence).toHaveLength(1);
    expect(springBoot!.evidence[0]!.source).toBe('pom.xml');
    expect(springBoot!.evidence[0]!.type).toBe('manifest');
    expect(springBoot!.evidence[0]!.description).toContain('spring-boot');
  });
});
