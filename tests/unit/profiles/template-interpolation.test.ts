import { describe, it, expect } from 'vitest';
import { interpolateTemplate } from '../../../src/profiles/template-interpolation.js';
import type { TemplateContext } from '../../../src/profiles/template-context.js';

function makeCtx(overrides?: Partial<TemplateContext>): TemplateContext {
  return {
    lang: {
      id: 'python',
      name: 'Python',
      installCmd: 'pip install -r requirements.txt',
      testCmd: 'pytest',
      buildCmd: 'python -m build',
      lintCmd: 'ruff check .',
      packageManager: 'pip',
      lockFile: 'requirements.txt',
      depsDir: '.venv',
      manifestFile: 'pyproject.toml',
      sourceExtensions: 'py',
      versionMatrix: "['3.11', '3.12', '3.13']",
    },
    ci: {
      setupAction: 'actions/setup-python',
      versionInput: 'python-version',
      cacheInput: 'pip',
      versionFile: '.python-version',
      publishCmd: 'twine upload dist/*',
      publishTokenName: 'PYPI_TOKEN',
      pathTriggers: "['src/**', 'pyproject.toml']",
    },
    docker: {
      buildImage: 'python:3.12-slim',
      runtimeImage: 'python:3.12-slim',
      copyManifest: 'COPY requirements*.txt ./',
      installDeps: 'RUN pip install --no-cache-dir -r requirements.txt',
      buildStep: 'RUN python -m build',
      entrypoint: '["python", "-m", "app"]',
      port: '8000',
      cacheMountTarget: '/root/.cache/pip',
    },
    ...overrides,
  };
}

describe('interpolateTemplate', () => {
  const ctx = makeCtx();

  it('should replace {{lang.installCmd}} with context value', () => {
    const result = interpolateTemplate('Run: {{lang.installCmd}}', ctx);
    expect(result).toBe('Run: pip install -r requirements.txt');
  });

  it('should replace {{ci.setupAction}} with context value', () => {
    const result = interpolateTemplate('- uses: {{ci.setupAction}}@sha', ctx);
    expect(result).toBe('- uses: actions/setup-python@sha');
  });

  it('should replace {{docker.buildImage}} with context value', () => {
    const result = interpolateTemplate('FROM {{docker.buildImage}}', ctx);
    expect(result).toBe('FROM python:3.12-slim');
  });

  it('should handle multiple tokens in one string', () => {
    const content = '{{lang.installCmd}} && {{lang.testCmd}} && {{lang.buildCmd}}';
    const result = interpolateTemplate(content, ctx);
    expect(result).toBe('pip install -r requirements.txt && pytest && python -m build');
  });

  it('should leave unrecognized tokens unchanged', () => {
    const content = '{{unknown.key}} stays as is';
    const result = interpolateTemplate(content, ctx);
    expect(result).toBe('{{unknown.key}} stays as is');
  });

  it('should leave unrecognized keys in known namespaces unchanged', () => {
    const content = '{{lang.nonExistentKey}} stays';
    const result = interpolateTemplate(content, ctx);
    expect(result).toBe('{{lang.nonExistentKey}} stays');
  });

  it('should NOT modify GitHub Actions ${{ }} expressions', () => {
    const content = '${{ secrets.NPM_TOKEN }}';
    const result = interpolateTemplate(content, ctx);
    expect(result).toBe('${{ secrets.NPM_TOKEN }}');
  });

  it('should NOT modify existing {{BUILD_COMMANDS}} tokens (no namespace)', () => {
    const content = '{{BUILD_COMMANDS}}';
    const result = interpolateTemplate(content, ctx);
    expect(result).toBe('{{BUILD_COMMANDS}}');
  });

  it('should handle content with no template tokens', () => {
    const content = 'No tokens here, just plain text.';
    const result = interpolateTemplate(content, ctx);
    expect(result).toBe(content);
  });

  it('should handle empty string', () => {
    expect(interpolateTemplate('', ctx)).toBe('');
  });

  it('should handle mixed content with tokens and prose', () => {
    const content = `# CI Setup
Install deps: \`{{lang.installCmd}}\`
Run tests: \`{{lang.testCmd}}\`
Use $\{\{ secrets.TOKEN \}\} for auth.`;
    const result = interpolateTemplate(content, ctx);
    expect(result).toContain('pip install -r requirements.txt');
    expect(result).toContain('pytest');
    expect(result).toContain('${{ secrets.TOKEN }}');
  });

  it('should replace tokens from all three namespaces', () => {
    const content = '{{lang.name}} + {{ci.setupAction}} + {{docker.port}}';
    const result = interpolateTemplate(content, ctx);
    expect(result).toBe('Python + actions/setup-python + 8000');
  });
});
