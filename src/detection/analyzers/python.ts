import type { AnalyzerResult, DetectedTechnology, DetectionEvidence } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseTOML } from '../../utils/parsers.js';

interface PyProjectToml {
  project?: {
    dependencies?: string[];
    'optional-dependencies'?: Record<string, string[]>;
  };
  tool?: {
    poetry?: {
      dependencies?: Record<string, unknown>;
      'dev-dependencies'?: Record<string, unknown>;
    };
  };
}

interface DepPattern {
  packages: string[];
  techId: string;
  techName: string;
  category: 'framework' | 'testing' | 'tooling';
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
    profileIds: [],
  },
  {
    packages: ['sqlalchemy'],
    techId: 'sqlalchemy',
    techName: 'SQLAlchemy',
    category: 'tooling',
    weight: 80,
    profileIds: [],
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

    // Parse pyproject.toml
    const pyproject = files.get('pyproject.toml');
    if (pyproject) {
      analyzedFiles.push('pyproject.toml');
      try {
        const parsed = parseTOML<PyProjectToml>(pyproject, 'pyproject.toml');
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
      } catch {
        // Malformed TOML, continue with other sources
      }
    }

    // Parse requirements.txt
    const requirements = files.get('requirements.txt');
    if (requirements) {
      analyzedFiles.push('requirements.txt');
      const lines = requirements.split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && !l.startsWith('-'));
      allDeps.push(...lines);
    }

    if (analyzedFiles.length === 0) return { technologies, analyzedFiles };

    // Detect Python itself
    const pythonEvidence: DetectionEvidence[] = analyzedFiles.map((f) => ({
      source: f,
      type: 'manifest' as const,
      description: `Python manifest found: ${f}`,
      weight: 90,
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
          }],
          parentId: pattern.parentId,
          profileIds: pattern.profileIds,
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
