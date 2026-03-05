import path from 'path';
import type { AnalyzerResult, DetectedTechnology, DetectionEvidence } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseTOML } from '../../utils/parsers.js';
import { findAllFileEntries, hasFile } from '../file-utils.js';

interface PyProjectToml {
  project?: {
    dependencies?: string[];
    'optional-dependencies'?: Record<string, string[]>;
  };
  tool?: {
    poetry?: {
      dependencies?: Record<string, unknown>;
      'dev-dependencies'?: Record<string, unknown>;
      /** Poetry 1.2+ dependency groups: [tool.poetry.group.<name>.dependencies] */
      group?: Record<string, { dependencies?: Record<string, unknown> }>;
    };
  };
}

interface DepPattern {
  packages: string[];
  techId: string;
  techName: string;
  category: 'framework' | 'testing' | 'tooling' | 'infra';
  weight: number;
  profileIds: string[];
  parentId?: string;
}

const PY_DEP_PATTERNS: DepPattern[] = [
  {
    packages: ['fastapi'],
    techId: 'fastapi',
    techName: 'FastAPI',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/fastapi'],
  },
  {
    packages: ['django'],
    techId: 'django',
    techName: 'Django',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/django'],
  },
  {
    packages: ['flask'],
    techId: 'flask',
    techName: 'Flask',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/flask'],
  },
  {
    packages: ['pytest'],
    techId: 'pytest',
    techName: 'Pytest',
    category: 'testing',
    weight: 90,
    profileIds: ['testing/pytest'],
  },
  // unittest is a stdlib module - it never appears in dependency files
  {
    packages: ['pydantic'],
    techId: 'pydantic',
    techName: 'Pydantic',
    category: 'tooling',
    weight: 80,
    profileIds: ['frameworks/pydantic'],
  },
  {
    packages: ['sqlalchemy'],
    techId: 'sqlalchemy',
    techName: 'SQLAlchemy',
    category: 'tooling',
    weight: 80,
    profileIds: [],
  },
  {
    packages: ['langchain', 'langchain-core', 'langchain-community', 'langchain-openai', 'langchain-google-genai', 'langchain-anthropic'],
    techId: 'langchain',
    techName: 'LangChain',
    category: 'framework',
    weight: 90,
    profileIds: ['frameworks/langchain'],
  },
  {
    packages: ['google-cloud-storage', 'google-cloud-aiplatform', 'google-cloud-bigquery', 'google-cloud-firestore', 'google-cloud-pubsub', 'google-cloud-run', 'google-cloud-secret-manager', 'google-api-core', 'google-auth'],
    techId: 'google-cloud',
    techName: 'Google Cloud',
    category: 'infra',
    weight: 85,
    profileIds: ['infra/google-cloud'],
  },
];

export class PythonAnalyzer extends BaseAnalyzer {
  readonly id = 'python';
  readonly name = 'Python';
  readonly filePatterns = [
    'pyproject.toml',
    'requirements.txt',
    'requirements*.txt',
    'setup.py',
    'setup.cfg',
    'Pipfile',
    '.python-version',
  ];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];
    const allDeps: string[] = [];

    // Parse all pyproject.toml files (root + subdirectories)
    const pyprojectEntries = findAllFileEntries(files, 'pyproject.toml');
    for (const entry of pyprojectEntries) {
      analyzedFiles.push(entry.path);
      try {
        const parsed = parseTOML<PyProjectToml>(entry.content, entry.path);
        // PEP 621 dependencies
        if (parsed.project?.dependencies) {
          allDeps.push(...parsed.project.dependencies);
        }
        if (parsed.project?.['optional-dependencies']) {
          for (const deps of Object.values(parsed.project['optional-dependencies'])) {
            allDeps.push(...deps);
          }
        }
        // Poetry dependencies
        if (parsed.tool?.poetry?.dependencies) {
          allDeps.push(...Object.keys(parsed.tool.poetry.dependencies));
        }
        if (parsed.tool?.poetry?.['dev-dependencies']) {
          allDeps.push(...Object.keys(parsed.tool.poetry['dev-dependencies']));
        }
        // Poetry 1.2+ dependency groups: [tool.poetry.group.<name>.dependencies]
        if (parsed.tool?.poetry?.group) {
          for (const group of Object.values(parsed.tool.poetry.group)) {
            if (group.dependencies) {
              allDeps.push(...Object.keys(group.dependencies));
            }
          }
        }
      } catch {
        // Malformed TOML, continue with other sources
      }
    }

    // Parse all requirements.txt files (root + subdirectories)
    const reqEntries = findAllFileEntries(files, 'requirements.txt');
    for (const entry of reqEntries) {
      analyzedFiles.push(entry.path);
      const lines = entry.content.split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && !l.startsWith('-'));
      allDeps.push(...lines);
    }

    // Detect other Python indicators (even without parseable dependency data)
    for (const marker of ['setup.py', 'setup.cfg', 'Pipfile', '.python-version'] as const) {
      if (hasFile(files, marker)) {
        // Find the actual path for this marker
        for (const filePath of files.keys()) {
          if (path.basename(filePath) === marker) {
            analyzedFiles.push(filePath);
          }
        }
      }
    }

    if (analyzedFiles.length === 0) return { technologies, analyzedFiles };

    // Detect Python itself
    const pythonEvidence: DetectionEvidence[] = analyzedFiles.map((f) => ({
      source: f,
      type: 'manifest' as const,
      description: `Python manifest found: ${f}`,
      weight: 95,
    }));

    technologies.push({
      id: 'python',
      name: 'Python',
      category: 'language',
      confidence: 95,
      evidence: pythonEvidence,
      profileIds: ['languages/python'],
    });

    // Normalize dependency names for matching
    const normalizedDeps = allDeps.map((d) => {
      // Extract package name from "package>=1.0.0" or "package[extras]"
      const match = d.match(/^([a-zA-Z0-9_-]+)/);
      return match ? match[1]!.toLowerCase() : d.toLowerCase();
    });

    // Check patterns
    for (const pattern of PY_DEP_PATTERNS) {
      const found = pattern.packages.find((pkg) =>
        normalizedDeps.includes(pkg.toLowerCase()),
      );
      if (found) {
        // Try to extract version
        const depLine = allDeps.find((d) =>
          d.toLowerCase().startsWith(found.toLowerCase()),
        );
        const versionMatch = depLine?.match(/[><=~!]=?\s*([\d.]+)/);

        technologies.push({
          id: pattern.techId,
          name: pattern.techName,
          category: pattern.category,
          version: versionMatch?.[1],
          majorVersion: versionMatch ? parseInt(versionMatch[1]!, 10) : undefined,
          confidence: pattern.weight,
          evidence: [{
            source: analyzedFiles[0]!,
            type: 'manifest',
            description: `Found "${found}" in dependencies`,
            weight: pattern.weight,
            trackedPackage: found,
          }],
          parentId: pattern.parentId,
          profileIds: pattern.profileIds,
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
