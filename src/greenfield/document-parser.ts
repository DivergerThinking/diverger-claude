import { readFileOrNull } from '../utils/fs.js';
import path from 'path';

export interface ParsedArchitecture {
  projectName?: string;
  description?: string;
  technologies: string[];
  features: string[];
  sections: Map<string, string>;
}

/** Parse an ARCHITECTURE.md or similar document for project information */
export async function parseArchitectureDoc(
  projectRoot: string,
): Promise<ParsedArchitecture | null> {
  const possibleFiles = [
    'ARCHITECTURE.md',
    'architecture.md',
    'DESIGN.md',
    'design.md',
    'TECH_STACK.md',
    'tech-stack.md',
  ];

  let content: string | null = null;
  for (const file of possibleFiles) {
    content = await readFileOrNull(path.join(projectRoot, file));
    if (content) break;
  }

  if (!content) return null;

  return parseMarkdownDoc(content);
}

function parseMarkdownDoc(content: string): ParsedArchitecture {
  const sections = new Map<string, string>();
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  let currentHeading = '';
  let currentLines: string[] = [];
  let projectName: string | undefined;
  let description: string | undefined;
  const technologies: string[] = [];
  const features: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);

    if (h1Match && !projectName) {
      projectName = h1Match[1]!.trim();
      // Capture preamble content between H1 and first H2
      currentHeading = '__intro__';
      currentLines = [];
      continue;
    }

    if (h2Match) {
      if (currentHeading && currentLines.length > 0) {
        sections.set(currentHeading, currentLines.join('\n').trim());
      }
      currentHeading = h2Match[1]!.trim();
      currentLines = [];
      continue;
    }

    currentLines.push(line);

    // Extract tech mentions from bullet points
    const bulletMatch = line.match(/^[-*]\s+\*?\*?(\w[\w.]+\s*[\w.]*)\*?\*?/);
    if (bulletMatch) {
      const mention = bulletMatch[1]!.trim();
      const heading = currentHeading.toLowerCase();
      if (heading.includes('tech') || heading.includes('stack') || heading.includes('dependencies')) {
        technologies.push(mention);
      }
      if (heading.includes('feature') || heading.includes('funcionalidad')) {
        features.push(mention);
      }
    }
  }

  // Save last section
  if (currentHeading && currentLines.length > 0) {
    sections.set(currentHeading, currentLines.join('\n').trim());
  }

  // Extract description from first non-heading content
  if (!description && sections.size > 0) {
    const firstSection = sections.values().next().value;
    if (firstSection) {
      description = firstSection.split('\n').slice(0, 3).join(' ').trim();
    }
  }

  return { projectName, description, technologies, features, sections };
}
