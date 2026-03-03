# Guía de Contribución — diverger-claude

## Prerrequisitos

- **Node.js 20+** (`node --version`)
- **npm** (viene con Node.js)
- **Git** con acceso al repositorio
- **GitHub CLI** (`gh auth login`) para autenticación con GitHub Packages

## Setup de entorno de desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/DivergerThinking/diverger-claude.git
cd diverger-claude

# Instalar dependencias
npm ci

# Verificar que todo funciona
npm run build        # Compila TypeScript → dist/
npm test             # Ejecuta todos los tests
npm run typecheck    # Verifica tipos sin compilar
npm run lint         # Ejecuta ESLint
```

## Arquitectura del proyecto

```
src/
├── core/           # Tipos, constantes, errores, motor principal
├── detection/      # Scanner de filesystem + analizadores por tecnología
├── profiles/       # Sistema de perfiles por capas (5 capas)
├── generation/     # Generadores de archivos de configuración
├── governance/     # Three-way merge y gobernanza de reglas
├── knowledge/      # Cliente Claude API para best practices
├── adaptation/     # Adaptación continua (hooks de sesión)
├── telemetry/      # Telemetría opt-in local
├── mcp/            # Servidor MCP con tools programáticos
├── cli/            # Interfaz de línea de comandos
└── utils/          # Utilidades compartidas (fs, parsers, hash)
```

### Sistema de 5 capas de profiles

| Capa | Layer | Orden | Ejemplo |
|------|-------|-------|---------|
| Base | 0 | Primero | `universal` |
| Lenguaje | 10 | Segundo | `typescript`, `python`, `go` |
| Framework | 20 | Tercero | `nextjs`, `fastapi`, `remix` |
| Testing | 30 | Cuarto | `vitest`, `pytest`, `playwright` |
| Infra | 40 | Último | `docker`, `github-actions`, `bun` |

La composición concatena secciones de CLAUDE.md, deep-merge de settings, enriquecimiento de agentes por nombre, y acumulación de skills/hooks/MCP.

---

## Cómo añadir un profile

### 1. Crear el archivo

Ubicación según capa:
- Lenguaje: `src/profiles/registry/languages/{name}.profile.ts`
- Framework: `src/profiles/registry/frameworks/{name}.profile.ts`
- Testing: `src/profiles/registry/testing/{name}.profile.ts`
- Infra: `src/profiles/registry/infra/{name}.profile.ts`

### 2. Estructura del profile

```typescript
import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const myProfile: Profile = {
  id: 'frameworks/my-framework',  // {capa}/{nombre}
  name: 'My Framework',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['my-framework'],  // debe coincidir con el ID del analyzer
  dependsOn: ['languages/typescript'],  // opcional
  contributions: {
    // Sección en CLAUDE.md (breve, referencia a rules/)
    claudeMd: [{
      heading: 'My Framework Conventions',
      order: 20,  // 10=lang, 20=framework, 30=testing, 40=infra
      content: `## My Framework Conventions\n\n...`,
    }],

    // Permisos de comandos CLI
    settings: {
      permissions: {
        allow: ['Bash(npx my-cli:*)'],
        deny: [],  // opcional: comandos peligrosos
      },
    },

    // Reglas detalladas (2-3 por profile)
    rules: [
      {
        path: 'my-framework/conventions.md',
        governance: 'mandatory',  // o 'recommended'
        paths: ['app/**/*'],  // archivos donde aplica la regla
        description: 'Convenciones de My Framework',
        content: `# My Framework Conventions\n\n...`,  // 30-60 líneas
      },
    ],

    // Enriquecimiento de agentes existentes
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## My Framework Review Checklist\n\n...`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## My Framework Security Audit\n\n...`,
      },
    ],

    // Skill generador
    skills: [{
      name: 'my-framework-generator',
      description: 'Scaffold My Framework component',
      content: `# My Framework Generator\n\n...`,
    }],

    // Hooks de validación (inline scripts)
    hooks: [{
      event: 'PostToolUse',
      matcher: 'Write',
      hooks: [{
        type: 'command',
        command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && ...',
        timeout: 10,
        statusMessage: 'Checking My Framework patterns',
      }],
    }],
  },
};
```

### 3. Registrar en el índice

En `src/profiles/index.ts`:
```typescript
import { myProfile } from './registry/frameworks/my-framework.profile.js';
// ... añadir al array ALL_PROFILES en la sección correcta
```

### 4. Conectar con el analyzer

Si la tecnología se detecta por dependencias npm, añadir a `DEP_PATTERNS` en `src/detection/analyzers/node.ts`:
```typescript
{
  packages: ['my-framework'],
  techId: 'my-framework',
  techName: 'My Framework',
  category: 'framework',
  weight: 90,
  profileIds: ['frameworks/my-framework'],
},
```

Si es un archivo de configuración (CI, runtime), modificar el analyzer correspondiente en `src/detection/analyzers/`.

### 5. Crear tests

En `tests/unit/profiles/frameworks/my-framework.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { myProfile } from '../../../../src/profiles/registry/frameworks/my-framework.profile.js';

describe('my-framework profile', () => {
  it('has correct id and layer', () => {
    expect(myProfile.id).toBe('frameworks/my-framework');
    expect(myProfile.layer).toBe(20);
  });

  it('has rules with governance', () => {
    expect(myProfile.contributions.rules?.length).toBeGreaterThanOrEqual(2);
    myProfile.contributions.rules?.forEach(rule => {
      expect(['mandatory', 'recommended']).toContain(rule.governance);
    });
  });

  it('has agent enrichments', () => {
    const agents = myProfile.contributions.agents ?? [];
    expect(agents.some(a => a.name === 'code-reviewer')).toBe(true);
  });
});
```

---

## Cómo añadir un analyzer

Los analyzers detectan tecnologías en el filesystem del proyecto.

### 1. Crear el archivo

En `src/detection/analyzers/{name}.ts`:

```typescript
import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';

export class MyAnalyzer extends BaseAnalyzer {
  readonly id = 'my-analyzer';
  readonly name = 'My Technology';
  readonly filePatterns = ['my-config.json', 'my-config.yml'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    for (const [filePath, content] of files) {
      if (filePath === 'my-config.json') {
        analyzedFiles.push(filePath);
        technologies.push({
          id: 'my-tech',
          name: 'My Technology',
          category: 'infra',
          confidence: 95,
          evidence: [{
            source: filePath,
            type: 'config-file',
            description: 'My config found',
            weight: 95,
          }],
          profileIds: ['infra/my-tech'],
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
```

### 2. Registrar

En `src/detection/analyzers/index.ts`:
```typescript
import { MyAnalyzer } from './my-analyzer.js';

export function getAllAnalyzers(): BaseAnalyzer[] {
  return [
    // ... existentes
    new MyAnalyzer(),
  ];
}

export { MyAnalyzer } from './my-analyzer.js';
```

### 3. Tests

En `tests/unit/detection/my-analyzer.test.ts`, testear detección positiva, negativa, y deduplicación.

---

## Cómo añadir una herramienta MCP

### 1. Crear el handler

En `src/mcp/tools/{name}.ts`:

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';

export function registerMyTool(server: McpServer): void {
  server.tool(
    'my_tool',
    'Description of what this tool does',
    {
      projectDir: z.string().describe('Absolute path to the project root'),
      // ... otros parámetros
    },
    async ({ projectDir }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            error: 'DIRECTORY_NOT_FOUND',
            message: `Directory not found: ${projectDir}`,
          })}],
          isError: true,
        };
      }

      try {
        // ... lógica
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            error: 'MY_TOOL_ERROR',
            message: extractErrorMessage(err),
          })}],
          isError: true,
        };
      }
    },
  );
}
```

### 2. Registrar

En `src/mcp/server.ts`:
```typescript
import { registerMyTool } from './tools/my-tool.js';
// ...
registerMyTool(server);
```

### 3. Tests

En `tests/unit/mcp/my-tool.test.ts`, mockear dependencias y testear success + error paths.

---

## Convenciones de testing

| Tipo | Ubicación | Qué testea |
|------|-----------|------------|
| Unit | `tests/unit/` | Funciones y clases aisladas |
| Integration | `tests/integration/` | Flujos completos con filesystem real |
| E2E | `tests/e2e/` | CLI como proceso externo |
| Chaos | `tests/unit/chaos/` | Edge cases, inputs extremos |

### Ejecutar tests

```bash
npm test              # Todos los tests
npm run test:e2e      # Solo E2E
npm run test:coverage # Con cobertura (requiere build previo)
npm run test:watch    # Modo watch
```

### Cobertura mínima

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

El CI rechaza PRs que bajen la cobertura por debajo de estos umbrales.

---

## Proceso de release

**IMPORTANTE:** Nunca usar `npm publish` localmente. El CI lo hace automáticamente.

### Pasos

1. Bump versión en `package.json`
2. Sync versión en `plugin/.claude-plugin/plugin.json`
3. Actualizar `CHANGELOG.md` con la nueva entrada
4. Commit:
   ```bash
   git add package.json plugin/.claude-plugin/plugin.json CHANGELOG.md
   git commit -m "release: vX.Y.Z — descripción"
   ```
5. Tag:
   ```bash
   git tag vX.Y.Z
   ```
6. Push:
   ```bash
   git push origin main --tags
   ```
7. GitHub Actions se encarga de: build → test → publish → release con tarball

### Versionado

- **Patch** (1.2.x): bug fixes, correcciones menores
- **Minor** (1.x.0): nuevas features, profiles, herramientas
- **Major** (x.0.0): breaking changes (cambios en tipos, eliminación de features)

---

## Convenciones de código

Referencia completa en `.claude/CLAUDE.md`. Resumen:

- **ESM modules**: `import`/`export`, nunca `require`
- **TypeScript strict**: sin `any` salvo justificado con comentario
- **Tipos**: todos en `src/core/types.ts`
- **Errores**: usar clases de `src/core/errors.ts`
- **Paths**: siempre `path.join()` o `path.resolve()`, nunca concatenación
- **Async/await**: preferido sobre `.then()` chains
- **Idioma**: código y reglas internas en inglés, strings user-facing en español
- **Tests obligatorios**: toda lógica de negocio debe tener tests
