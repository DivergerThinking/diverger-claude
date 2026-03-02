import { describe, it, expect } from 'vitest';
import { PythonAnalyzer } from '../../../../src/detection/analyzers/python.js';

const PYPROJECT_PEP621 = `[project]
name = "my-app"
version = "0.1.0"

dependencies = [
    "fastapi>=0.100.0",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
]
`;

const PYPROJECT_POETRY = `[tool.poetry]
name = "my-app"
version = "0.1.0"

[tool.poetry.dependencies]
python = "^3.11"
django = "^4.2"
sqlalchemy = "^2.0"

[tool.poetry.dev-dependencies]
pytest = "^7.4"
`;

const REQUIREMENTS_TXT = `flask>=2.3.0
sqlalchemy>=2.0
# This is a comment
pytest>=7.4.0
-r requirements-base.txt
`;

describe('PythonAnalyzer', () => {
  const analyzer = new PythonAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('python');
    expect(analyzer.name).toBe('Python');
    expect(analyzer.filePatterns).toContain('pyproject.toml');
    expect(analyzer.filePatterns).toContain('requirements.txt');
    expect(analyzer.filePatterns).toContain('setup.py');
  });

  it('should return empty result when no Python files found', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect Python from pyproject.toml (PEP 621)', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_PEP621);
    const result = await analyzer.analyze(files, '/project');

    const python = result.technologies.find((t) => t.id === 'python');
    expect(python).toBeDefined();
    expect(python!.name).toBe('Python');
    expect(python!.category).toBe('language');
    expect(python!.confidence).toBe(95);
    expect(python!.profileIds).toContain('languages/python');
    expect(result.analyzedFiles).toContain('pyproject.toml');
  });

  it('should detect FastAPI from PEP 621 dependencies', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_PEP621);
    const result = await analyzer.analyze(files, '/project');

    const fastapi = result.technologies.find((t) => t.id === 'fastapi');
    expect(fastapi).toBeDefined();
    expect(fastapi!.name).toBe('FastAPI');
    expect(fastapi!.category).toBe('framework');
    expect(fastapi!.confidence).toBe(90);
    expect(fastapi!.profileIds).toContain('frameworks/fastapi');
  });

  it('should detect pytest from optional-dependencies', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_PEP621);
    const result = await analyzer.analyze(files, '/project');

    const pytest = result.technologies.find((t) => t.id === 'pytest');
    expect(pytest).toBeDefined();
    expect(pytest!.name).toBe('Pytest');
    expect(pytest!.category).toBe('testing');
    expect(pytest!.profileIds).toContain('testing/pytest');
  });

  it('should detect Django from Poetry dependencies', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_POETRY);
    const result = await analyzer.analyze(files, '/project');

    const django = result.technologies.find((t) => t.id === 'django');
    expect(django).toBeDefined();
    expect(django!.name).toBe('Django');
    expect(django!.profileIds).toContain('frameworks/django');
  });

  it('should detect pytest from Poetry dev-dependencies', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_POETRY);
    const result = await analyzer.analyze(files, '/project');

    const pytest = result.technologies.find((t) => t.id === 'pytest');
    expect(pytest).toBeDefined();
  });

  it('should detect SQLAlchemy from Poetry dependencies', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_POETRY);
    const result = await analyzer.analyze(files, '/project');

    const sqlalchemy = result.technologies.find((t) => t.id === 'sqlalchemy');
    expect(sqlalchemy).toBeDefined();
    expect(sqlalchemy!.name).toBe('SQLAlchemy');
  });

  it('should detect Flask from requirements.txt', async () => {
    const files = new Map<string, string>();
    files.set('requirements.txt', REQUIREMENTS_TXT);
    const result = await analyzer.analyze(files, '/project');

    const flask = result.technologies.find((t) => t.id === 'flask');
    expect(flask).toBeDefined();
    expect(flask!.name).toBe('Flask');
    expect(flask!.profileIds).toContain('frameworks/flask');
    expect(result.analyzedFiles).toContain('requirements.txt');
  });

  it('should ignore comments and flag lines in requirements.txt', async () => {
    const files = new Map<string, string>();
    files.set('requirements.txt', REQUIREMENTS_TXT);
    const result = await analyzer.analyze(files, '/project');

    // Should not have any technology from "# This is a comment" or "-r ..." lines
    const ids = result.technologies.map((t) => t.id);
    expect(ids).not.toContain('#');
    expect(ids).not.toContain('-r');
  });

  it('should extract version from PEP 440 specifier', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_PEP621);
    const result = await analyzer.analyze(files, '/project');

    const fastapi = result.technologies.find((t) => t.id === 'fastapi');
    expect(fastapi!.version).toBe('0.100.0');
    expect(fastapi!.majorVersion).toBe(0);
  });

  it('should detect Pydantic as tooling', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_PEP621);
    const result = await analyzer.analyze(files, '/project');

    const pydantic = result.technologies.find((t) => t.id === 'pydantic');
    expect(pydantic).toBeDefined();
    expect(pydantic!.category).toBe('tooling');
  });

  it('should handle both pyproject.toml and requirements.txt', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_PEP621);
    files.set('requirements.txt', REQUIREMENTS_TXT);
    const result = await analyzer.analyze(files, '/project');

    expect(result.analyzedFiles).toContain('pyproject.toml');
    expect(result.analyzedFiles).toContain('requirements.txt');
    // Python should appear once
    const pythonEntries = result.technologies.filter((t) => t.id === 'python');
    expect(pythonEntries).toHaveLength(1);
  });

  it('should detect pytest from Poetry 1.2+ dependency groups', async () => {
    const pyproject = `[tool.poetry]
name = "my-app"
version = "0.1.0"

[tool.poetry.dependencies]
python = "^3.11"
django = "^4.2"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4"

[tool.poetry.group.test.dependencies]
pytest-cov = "^4.0"
`;
    const files = new Map<string, string>();
    files.set('pyproject.toml', pyproject);
    const result = await analyzer.analyze(files, '/project');

    const pytest = result.technologies.find((t) => t.id === 'pytest');
    expect(pytest).toBeDefined();
    expect(pytest!.name).toBe('Pytest');
    expect(pytest!.profileIds).toContain('testing/pytest');
  });

  it('should have consistent confidence and evidence weight for Python', async () => {
    const files = new Map<string, string>();
    files.set('pyproject.toml', PYPROJECT_PEP621);
    const result = await analyzer.analyze(files, '/project');

    const python = result.technologies.find((t) => t.id === 'python');
    expect(python).toBeDefined();
    expect(python!.confidence).toBe(95);
    expect(python!.evidence[0]!.weight).toBe(95);
  });

  it('should include proper evidence', async () => {
    const files = new Map<string, string>();
    files.set('requirements.txt', REQUIREMENTS_TXT);
    const result = await analyzer.analyze(files, '/project');

    const flask = result.technologies.find((t) => t.id === 'flask');
    expect(flask!.evidence).toHaveLength(1);
    expect(flask!.evidence[0]!.source).toBe('requirements.txt');
    expect(flask!.evidence[0]!.type).toBe('manifest');
    expect(flask!.evidence[0]!.description).toContain('flask');
  });

  // ── Subdirectory detection ──────────────────────────────────────────

  describe('subdirectory detection', () => {
    it('should detect Python from pyproject.toml in subdirectory', async () => {
      const files = new Map<string, string>();
      files.set('backend/pyproject.toml', PYPROJECT_PEP621);
      const result = await analyzer.analyze(files, '/project');

      const python = result.technologies.find((t) => t.id === 'python');
      expect(python).toBeDefined();
      expect(result.analyzedFiles).toContain('backend/pyproject.toml');
    });

    it('should detect FastAPI from subdirectory pyproject.toml', async () => {
      const files = new Map<string, string>();
      files.set('backend/pyproject.toml', PYPROJECT_PEP621);
      const result = await analyzer.analyze(files, '/project');

      const fastapi = result.technologies.find((t) => t.id === 'fastapi');
      expect(fastapi).toBeDefined();
      expect(fastapi!.profileIds).toContain('frameworks/fastapi');
    });

    it('should detect Flask from subdirectory requirements.txt', async () => {
      const files = new Map<string, string>();
      files.set('backend/requirements.txt', REQUIREMENTS_TXT);
      const result = await analyzer.analyze(files, '/project');

      const flask = result.technologies.find((t) => t.id === 'flask');
      expect(flask).toBeDefined();
      expect(result.analyzedFiles).toContain('backend/requirements.txt');
    });

    it('should process multiple pyproject.toml files', async () => {
      const files = new Map<string, string>();
      files.set('service-a/pyproject.toml', PYPROJECT_PEP621);  // has FastAPI
      files.set('service-b/pyproject.toml', PYPROJECT_POETRY);  // has Django
      const result = await analyzer.analyze(files, '/project');

      const fastapi = result.technologies.find((t) => t.id === 'fastapi');
      expect(fastapi).toBeDefined();
      const django = result.technologies.find((t) => t.id === 'django');
      expect(django).toBeDefined();
    });

    it('should detect setup.py in subdirectory', async () => {
      const files = new Map<string, string>();
      files.set('lib/setup.py', 'from setuptools import setup\nsetup()');
      const result = await analyzer.analyze(files, '/project');

      const python = result.technologies.find((t) => t.id === 'python');
      expect(python).toBeDefined();
      expect(result.analyzedFiles).toContain('lib/setup.py');
    });
  });
});
