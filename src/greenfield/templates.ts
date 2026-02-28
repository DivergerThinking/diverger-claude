/** Predefined project templates for greenfield wizard */

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  profiles: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'nextjs-full',
    name: 'Next.js Full Stack',
    description: 'Next.js con TypeScript, Tailwind, Prisma, y testing',
    technologies: ['typescript', 'react', 'nextjs', 'vitest', 'playwright'],
    profiles: [
      'base/universal',
      'languages/typescript',
      'frameworks/react',
      'frameworks/nextjs',
      'testing/vitest',
      'testing/playwright',
    ],
  },
  {
    id: 'express-api',
    name: 'Express API',
    description: 'API REST con Express, TypeScript, y Jest',
    technologies: ['typescript', 'express', 'jest'],
    profiles: [
      'base/universal',
      'languages/typescript',
      'frameworks/express',
      'testing/jest',
    ],
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    description: 'API con FastAPI, Python, y Pytest',
    technologies: ['python', 'fastapi', 'pytest'],
    profiles: [
      'base/universal',
      'languages/python',
      'frameworks/fastapi',
      'testing/pytest',
    ],
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    description: 'API con Spring Boot, Java, y JUnit',
    technologies: ['java', 'spring-boot', 'junit'],
    profiles: [
      'base/universal',
      'languages/java',
      'frameworks/spring-boot',
      'testing/junit',
    ],
  },
  {
    id: 'react-spa',
    name: 'React SPA',
    description: 'Single Page Application con React, TypeScript, y Vitest',
    technologies: ['typescript', 'react', 'vitest'],
    profiles: [
      'base/universal',
      'languages/typescript',
      'frameworks/react',
      'testing/vitest',
    ],
  },
  {
    id: 'angular-app',
    name: 'Angular Application',
    description: 'Angular con TypeScript y Cypress',
    technologies: ['typescript', 'angular', 'cypress'],
    profiles: [
      'base/universal',
      'languages/typescript',
      'frameworks/angular',
      'testing/cypress',
    ],
  },
  {
    id: 'go-api',
    name: 'Go API',
    description: 'API con Go y testing estándar',
    technologies: ['go'],
    profiles: [
      'base/universal',
      'languages/go',
    ],
  },
  {
    id: 'rust-cli',
    name: 'Rust CLI',
    description: 'Herramienta CLI con Rust',
    technologies: ['rust'],
    profiles: [
      'base/universal',
      'languages/rust',
    ],
  },
];

/** Get template by ID */
export function getTemplate(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}
