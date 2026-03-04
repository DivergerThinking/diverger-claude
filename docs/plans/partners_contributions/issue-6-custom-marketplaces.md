# Issue #6 — Add Support for Custom Claude Marketplaces

| Campo | Valor |
|-------|-------|
| **Issue** | [#6](https://github.com/DivergerThinking/diverger-claude/issues/6) |
| **Autor** | @ssoto |
| **Fecha** | 2026-03-04 |
| **Labels** | `feature-request` |
| **Clasificación** | feature-request (extensión de arquitectura) |

## Resumen de la petición

@ssoto propone que diverger-claude soporte **marketplaces de terceros** como fuentes de plugins. Referencia concreta: [exp-claude-plugins-marketplace](https://github.com/DivergerThinking/exp-claude-plugins-marketplace).

Plantea dos preguntas clave:
1. ¿diverger-claude está reimplementando plugins?
2. ¿Deberíamos mover los plugins a un Marketplace y dejar que diverger-claude decida cuáles instalar?

Su posición se inclina por la opción 2.

## Análisis del estado actual

### Arquitectura del plugin hoy

diverger-claude es un **plugin monolítico** de Claude Code:
- **59 profiles hardcoded** en `src/profiles/index.ts` (importados directamente en código)
- **Fuente única**: descarga desde GitHub Releases de `DivergerThinking/diverger-claude`
- **Instalación**: `diverger plugin install` → descarga tarball → extrae en `~/.claude/plugins/diverger-claude/`
- **Detección**: `src/cli/plugin-detect.ts` busca en paths fijos (`~/.claude/plugins/diverger-claude/`)
- **No hay concepto de "marketplace"**: ni registro de fuentes, ni resolución dinámica

### Qué incluye el plugin monolítico

- 20 skills universales + 30+ skills de referencia por tecnología
- 8 agentes especializados
- 7 hook scripts
- MCP server con 14 tools
- 5 capas de profiles composables

### ¿Reimplementa plugins? (Q1 de @ssoto)

**Parcialmente sí.** diverger-claude genera configuración `.claude/` (rules, skills, agents, hooks) que es lo que un plugin de Claude Code hace. La diferencia:
- Un plugin de Claude Code = paquete estático de skills/hooks/agents
- diverger-claude = **generador inteligente** que detecta stack y produce configuración adaptada

Lo que diverger-claude añade sobre un plugin simple:
- Detección automática de tecnologías (59 profiles)
- Composición por capas (5 niveles de prioridad)
- Gobernanza (three-way merge)
- MCP server programático
- Memoria persistente y auto-reparación

### ¿Mover a marketplace? (Q2 de @ssoto)

La dirección es correcta, pero requiere separar dos conceptos:
1. **diverger-claude como orquestador** — detecta stack, recomienda e instala plugins apropiados
2. **Marketplace como fuente** — repositorio de plugins disponibles para instalar

## Plan de implementación

### Fase 1: Registro de marketplaces (configuración)

**Archivos a crear/modificar:**

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/core/types.ts` | MODIFICAR | Añadir tipos `MarketplaceSource`, `MarketplaceEntry` |
| `src/marketplace/registry.ts` | NUEVO | Gestión de marketplaces registrados |
| `src/marketplace/resolver.ts` | NUEVO | Resolución de plugins desde marketplaces |
| `src/cli/commands/marketplace.ts` | NUEVO | Comandos `marketplace add/remove/list` |

**Concepto: `MarketplaceSource`**
```typescript
interface MarketplaceSource {
  name: string;           // "diverger-official", "exp-claude-plugins"
  url: string;            // URL del index (GitHub repo, HTTP endpoint)
  type: 'github' | 'http'; // Tipo de fuente
  auth?: 'gh-token' | 'none';
}

interface MarketplaceEntry {
  name: string;
  description: string;
  version: string;
  downloadUrl: string;
  technologies?: string[]; // Tags de tecnología que cubre
  compatibility: string;   // Versión mínima de diverger-claude
}
```

**Almacenamiento:** `~/.claude/diverger/marketplaces.json`

### Fase 2: Resolución e instalación desde marketplace

**Archivos a crear/modificar:**

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/marketplace/installer.ts` | NUEVO | Descarga e instala plugins desde marketplace |
| `src/cli/commands/plugin.ts` | MODIFICAR | Extender `plugin install` para soportar marketplace sources |
| `src/cli/plugin-detect.ts` | MODIFICAR | Detectar plugins de cualquier fuente |

**Flujo:**
1. `diverger marketplace add <repo-url>` → registra fuente
2. `diverger plugin search <query>` → busca en todos los marketplaces
3. `diverger plugin install <name>` → resuelve desde marketplaces registrados
4. `diverger plugin install <name> --marketplace=<name>` → fuente específica

### Fase 3: Recomendación automática

**Archivos a crear/modificar:**

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/marketplace/recommender.ts` | NUEVO | Matchea stack detectado con plugins disponibles |
| `src/cli/commands/init.ts` | MODIFICAR | Sugerir plugins de marketplace durante `init` |

**Flujo:**
1. `diverger init` detecta stack (ej: React + TypeScript + Jest)
2. Consulta marketplaces registrados para plugins que cubran esas tecnologías
3. Sugiere al usuario: "Encontré 3 plugins relevantes en exp-claude-plugins-marketplace..."
4. El usuario elige cuáles instalar

### Fase 4: Formato del marketplace index

Cada marketplace necesita un `marketplace.json` o endpoint que retorne:
```json
{
  "name": "exp-claude-plugins-marketplace",
  "version": "1.0.0",
  "plugins": [
    {
      "name": "plugin-react-patterns",
      "description": "React component patterns and best practices",
      "version": "1.2.0",
      "technologies": ["react", "typescript"],
      "downloadUrl": "https://github.com/.../releases/download/v1.2.0/plugin.tar.gz",
      "minDivergerVersion": "3.3.0"
    }
  ]
}
```

## Tests

- **Unit**: Registry CRUD, resolver logic, marketplace index parsing
- **Unit**: Installer con marketplace source (mock HTTP/GitHub)
- **Unit**: Recommender matching stack → plugins
- **Integration**: `marketplace add` + `plugin install` flujo completo
- **E2E**: `diverger init` con marketplace registrado sugiere plugins

## Verificación

1. `npm run typecheck` — 0 errores
2. `npm run test` — todos pasando
3. `npm run build && npm run build:plugin`
4. Manual: `diverger marketplace add https://github.com/DivergerThinking/exp-claude-plugins-marketplace`
5. Manual: `diverger plugin search react` → muestra resultados del marketplace

## Complejidad estimada

**Alta** — Requiere:
- Nueva subsistema completo (`src/marketplace/`)
- Protocolo de comunicación con marketplaces (GitHub API o HTTP)
- Resolución de versiones y compatibilidad
- UX de recomendación durante `init`
- Formato estándar para `marketplace.json` que terceros implementen

## Dependencias y consideraciones

- Definir el formato de `marketplace.json` ANTES de implementar (contrato API)
- Coordinar con @ssoto para que `exp-claude-plugins-marketplace` siga el formato
- Decidir si el marketplace index vive en el repo (GitHub raw) o requiere un endpoint
- Autenticación: repos privados necesitan token (ya resuelto con `getGitHubToken()`)
- Versionado: ¿semver estricto? ¿compatibilidad con versiones de diverger-claude?
