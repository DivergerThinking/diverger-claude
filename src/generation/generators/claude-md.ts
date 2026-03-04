import type { ComposedConfig, DetectionResult, GeneratedFile } from '../../core/types.js';
import { CLAUDE_MD } from '../../core/constants.js';
import path from 'path';
import { existsSync, readFileSync } from 'node:fs';

/** Extract project context from package.json, README, and directory structure */
function extractProjectContext(projectRoot: string, detection?: DetectionResult): string | null {
  const lines: string[] = [];

  // 1. Read package.json for name + description
  const pkgPath = path.join(projectRoot, 'package.json');
  let pkgName: string | undefined;
  let pkgDescription: string | undefined;
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      pkgName = pkg.name;
      pkgDescription = pkg.description;
    } catch {
      // ignore malformed package.json
    }
  }

  // 2. Try other manifest files for description if no package.json
  if (!pkgDescription) {
    const pyprojectPath = path.join(projectRoot, 'pyproject.toml');
    if (existsSync(pyprojectPath)) {
      try {
        const content = readFileSync(pyprojectPath, 'utf-8');
        const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
        if (descMatch) pkgDescription = descMatch[1];
        if (!pkgName) {
          const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
          if (nameMatch) pkgName = nameMatch[1];
        }
      } catch {
        // ignore
      }
    }
  }

  if (!pkgDescription) {
    const cargoPath = path.join(projectRoot, 'Cargo.toml');
    if (existsSync(cargoPath)) {
      try {
        const content = readFileSync(cargoPath, 'utf-8');
        const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
        if (descMatch) pkgDescription = descMatch[1];
        if (!pkgName) {
          const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
          if (nameMatch) pkgName = nameMatch[1];
        }
      } catch {
        // ignore
      }
    }
  }

  // 3. Read README first paragraph for project summary
  let readmeSummary: string | undefined;
  const readmeNames = ['README.md', 'readme.md', 'Readme.md', 'README.rst', 'README.txt', 'README'];
  for (const name of readmeNames) {
    const readmePath = path.join(projectRoot, name);
    if (existsSync(readmePath)) {
      try {
        const content = readFileSync(readmePath, 'utf-8');
        readmeSummary = extractReadmeSummary(content);
      } catch {
        // ignore
      }
      break;
    }
  }

  // 4. Detect key directories
  const keyDirs = detectKeyDirectories(projectRoot);

  // Build the section only if we have something useful
  if (!pkgName && !pkgDescription && !readmeSummary && keyDirs.length === 0) {
    return null;
  }

  lines.push('## About This Project');
  lines.push('');

  if (pkgName) {
    lines.push(`**${pkgName}**${pkgDescription ? ` — ${pkgDescription}` : ''}`);
    lines.push('');
  } else if (pkgDescription) {
    lines.push(pkgDescription);
    lines.push('');
  }

  if (readmeSummary && readmeSummary !== pkgDescription) {
    lines.push(readmeSummary);
    lines.push('');
  }

  if (detection?.architecture) {
    lines.push(`**Architecture:** ${detection.architecture}`);
    lines.push('');
  }

  if (keyDirs.length > 0) {
    lines.push('**Key directories:**');
    for (const dir of keyDirs) {
      lines.push(`- \`${dir}/\``);
    }
    lines.push('');
  }

  lines.push('<!-- Add more project-specific context: architecture decisions, dev workflow, deployment, etc. -->');

  return lines.join('\n');
}

/** Extract the first meaningful paragraph from a README */
function extractReadmeSummary(content: string): string | undefined {
  const lines = content.split('\n');
  let foundHeading = false;
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip badges, images, and empty lines at the start
    if (!foundHeading && (trimmed === '' || /^[!\[<]/.test(trimmed))) continue;

    // Skip headings but note we've passed one
    if (/^#{1,3}\s/.test(trimmed)) {
      if (foundHeading && paragraphLines.length > 0) break; // hit next heading, stop
      foundHeading = true;
      continue;
    }

    // Collect paragraph text after first heading
    if (foundHeading) {
      if (trimmed === '') {
        if (paragraphLines.length > 0) break; // end of first paragraph
        continue;
      }
      paragraphLines.push(trimmed);
    }
  }

  if (paragraphLines.length === 0) return undefined;

  const summary = paragraphLines.join(' ');
  // Cap at ~300 chars to keep CLAUDE.md concise
  if (summary.length > 300) {
    return summary.slice(0, 297) + '...';
  }
  return summary;
}

/** Detect common project directories that exist */
function detectKeyDirectories(projectRoot: string): string[] {
  const candidates = [
    'src', 'lib', 'app', 'apps', 'packages',
    'components', 'pages', 'routes', 'api',
    'server', 'client', 'shared', 'common', 'core',
    'tests', 'test', '__tests__', 'spec',
    'scripts', 'tools', 'config',
    'docs', 'public', 'static', 'assets',
    'migrations', 'prisma', 'db',
    'cmd', 'pkg', 'internal',
  ];

  return candidates.filter((dir) => {
    const fullPath = path.join(projectRoot, dir);
    return existsSync(fullPath);
  });
}

/** Generate the CLAUDE.md file at the project root */
export function generateClaudeMd(
  config: ComposedConfig,
  projectRoot: string,
  detection?: DetectionResult,
): GeneratedFile {
  const sections = [...config.claudeMdSections].sort((a, b) => a.order - b.order);

  const parts: string[] = [
    '# Project Configuration',
    '',
    `> Generated by diverger-claude. Applied profiles: ${config.appliedProfiles.join(', ')}`,
    `> For personal overrides, create \`CLAUDE.local.md\` (gitignored).`,
    '',
  ];

  // Project context section (from README, package.json, directory structure)
  const projectContext = extractProjectContext(projectRoot, detection);
  if (projectContext) {
    parts.push(projectContext);
    parts.push('');
  }

  for (const section of sections) {
    // Section content already includes its own ## heading, so don't duplicate it
    parts.push(section.content);
    parts.push('');
  }

  // Only add placeholder if we couldn't extract project context
  if (!projectContext) {
    parts.push('## Project-Specific Notes');
    parts.push('');
    parts.push('<!-- Add project-specific context here: architecture decisions, key directories, dev workflow, etc. -->');
    parts.push('');
  }

  return {
    path: path.join(projectRoot, CLAUDE_MD),
    content: parts.join('\n'),
  };
}
