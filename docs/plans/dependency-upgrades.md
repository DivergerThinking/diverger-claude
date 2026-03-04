# Plan: Actualización Incremental de Dependencias

> Generado tras cerrar PRs #3 y #4 de Dependabot (7 major + 4 dev bumps simultáneos).
> Estrategia: una dependencia por paso, con typecheck + test + build entre cada una.

## Contexto

- **PRs cerradas**: #3 (production), #4 (dev-dependencies)
- **Motivo**: Demasiados breaking changes simultáneos. CI fallaba por TS7052 en `@anthropic-ai/sdk` y coverage threshold.
- **Versiones actuales**: Ver `package.json` en v3.3.0

## Orden de Prioridad

Ordenado por riesgo (menor a mayor) y por impacto en el proyecto:

---

### Paso 1: Dev dependencies de bajo riesgo

**`@types/node`**: 22.x → 25.x
- **Riesgo**: Bajo. Solo tipos, no runtime.
- **Archivos afectados**: Ninguno directamente (tipado global)
- **Comando**: `npm install @types/node@latest --save-dev`
- **Verificación**: `npm run typecheck` — si compila, OK.

**`vitest` + `@vitest/coverage-v8`**: 3.0.x → latest 3.x
- **Riesgo**: Bajo. Minor/patch dentro de v3.
- **Archivos afectados**: Ninguno (config en `vitest.config.ts`)
- **Comando**: `npm install vitest@latest @vitest/coverage-v8@latest --save-dev`
- **Verificación**: `npm run test` — todos los tests deben pasar.

---

### Paso 2: ESLint 9 → 10

**`eslint`**: 9.x → 10.x
- **Riesgo**: Medio. Major version con cambios en config API.
- **Archivos afectados**: `.eslintrc.json` o `eslint.config.*`, `package.json` scripts
- **Breaking changes probables**:
  - Flat config puede ser el único modo soportado
  - `@typescript-eslint/eslint-plugin` y `@typescript-eslint/parser` v8 podrían ser incompatibles
  - Posible necesidad de migrar a `typescript-eslint` v9+
- **Pasos**:
  1. Leer changelog de ESLint 10: https://eslint.org/blog/
  2. Actualizar: `npm install eslint@latest --save-dev`
  3. Si falla, verificar compatibilidad con `@typescript-eslint/*`
  4. Migrar config si es necesario (flat config)
- **Verificación**: `npm run lint` — 0 errores nuevos.

---

### Paso 3: Production dependencies de bajo riesgo

**`chalk`**: 5.4.1 → latest 5.x (ya en ^5, debería resolver automáticamente)
- **Riesgo**: Mínimo. Ya en v5, solo patch.
- **Verificación**: `npm run build`

**`deepmerge-ts`**: 7.1.3 → latest 7.x
- **Riesgo**: Mínimo. Minor dentro de v7.
- **Verificación**: `npm run test`

**`fast-glob`**: 3.3.3 → latest 3.x
- **Riesgo**: Mínimo. Minor dentro de v3.
- **Verificación**: `npm run test`

**`js-yaml`**: 4.1.0 → latest 4.x
- **Riesgo**: Mínimo. Patch dentro de v4.
- **Verificación**: `npm run test`

**`smol-toml`**: 1.3.1 → latest 1.x
- **Riesgo**: Mínimo. Minor dentro de v1.
- **Verificación**: `npm run test`

**`@modelcontextprotocol/sdk`**: 1.12.0 → latest 1.x
- **Riesgo**: Bajo. Minor dentro de v1.
- **Verificación**: `npm run build && npm run test`

Comando combinado para todo el paso 3:
```bash
npm install chalk@latest deepmerge-ts@latest fast-glob@latest js-yaml@latest smol-toml@latest @modelcontextprotocol/sdk@latest
```

---

### Paso 4: `ora` 8 → 9

- **Riesgo**: Medio. Major version.
- **Archivos afectados**: `src/cli/ui/spinner.ts` (1 archivo)
- **Breaking changes probables**: Cambio de API de `ora()`, posible cambio a named exports
- **Pasos**:
  1. Leer changelog: https://github.com/sindresorhus/ora/releases
  2. `npm install ora@latest`
  3. Actualizar `spinner.ts` si la API cambió
- **Verificación**: `npm run build && npm run test`

---

### Paso 5: `@inquirer/prompts` 7 → 8

- **Riesgo**: Medio. Major version.
- **Archivos afectados**: `src/cli/ui/prompts.ts`, `src/greenfield/wizard.ts` (2 archivos)
- **Breaking changes probables**: Cambio en signatures de `select()`, `input()`, `confirm()`
- **Pasos**:
  1. Leer changelog: https://github.com/SBoudrias/Inquirer.js/releases
  2. `npm install @inquirer/prompts@latest`
  3. Actualizar archivos afectados
- **Verificación**: `npm run build && npm run typecheck`

---

### Paso 6: `diff` 7 → 8

- **Riesgo**: Medio. Major version.
- **Archivos afectados**: `src/generation/diff-engine.ts` (1 archivo)
- **Breaking changes probables**: Cambio en `createTwoFilesPatch()` o `diffLines()` API
- **Pasos**:
  1. Leer changelog: https://github.com/kpdecker/jsdiff/releases
  2. `npm install diff@latest && npm install @types/diff@latest --save-dev`
  3. Actualizar `diff-engine.ts` si la API cambió
- **Verificación**: `npm run typecheck && npm run test`

---

### Paso 7: `commander` 13 → 14

- **Riesgo**: Medio-Alto. Major version. Usado en 12 archivos CLI.
- **Archivos afectados**: `src/cli/index.ts`, `src/cli/commands/*.ts` (12 archivos)
- **Breaking changes probables**: Cambio en `Command` API, `program.parse()`, option parsing
- **Pasos**:
  1. Leer changelog: https://github.com/tj/commander.js/releases
  2. `npm install commander@latest`
  3. Actualizar CLI si hay breaking changes
  4. Probar todos los comandos manualmente: `diverger --version`, `diverger init --dry-run`, `diverger status`
- **Verificación**: `npm run build && npm run typecheck && npm run test && npm run test:e2e`

---

### Paso 8: `fast-xml-parser` 4 → 5

- **Riesgo**: Medio. Major version.
- **Archivos afectados**: `src/utils/parsers.ts` (1 archivo)
- **Breaking changes probables**: Cambio en constructor options, `parse()` API
- **Pasos**:
  1. Leer changelog: https://github.com/NaturalIntelligence/fast-xml-parser/releases
  2. `npm install fast-xml-parser@latest`
  3. Actualizar `parsers.ts` si la API cambió
- **Verificación**: `npm run typecheck && npm run test` (especialmente tests de detección Java/dotnet que usan XML parsing)

---

### Paso 9: `zod` 3 → 4

- **Riesgo**: Alto. Reescritura completa del API.
- **Archivos afectados**: 19 archivos (14 MCP tools + 5 framework profiles)
- **Breaking changes conocidos**:
  - `z.object()` → posible nueva API
  - `z.string()`, `z.boolean()`, `z.enum()` → pueden tener cambios
  - Validación y parsing pueden tener nueva semántica
  - `@modelcontextprotocol/sdk` podría depender de zod 3 internamente
- **Pasos**:
  1. **Verificar compatibilidad** de `@modelcontextprotocol/sdk` con zod 4
  2. Si MCP SDK no soporta zod 4, ESPERAR a que lo soporten
  3. Leer guía de migración: https://zod.dev/v4
  4. `npm install zod@latest`
  5. Actualizar los 19 archivos (schemas MCP + validaciones en profiles)
  6. Verificar que MCP server funciona correctamente
- **Verificación**: `npm run typecheck && npm run test && npm run build:plugin` + test manual de MCP tools

---

### Paso 10: `@anthropic-ai/sdk` 0.39 → 0.78

- **Riesgo**: Alto. Salto de 39 minor versions (pre-1.0 = cada minor es potencialmente breaking).
- **Archivos afectados**: `src/knowledge/api-client.ts` (1 archivo, pero API crítica)
- **Breaking change conocido**: `err.headers['retry-after']` ya no funciona — `Headers` pierde index signature. Hay que usar `err.headers.get('retry-after')`.
- **Otros breaking changes probables**:
  - Cambio en tipos de `Message`, `ContentBlock`
  - Cambio en `client.messages.create()` options
  - Nuevos campos requeridos o removidos
- **Pasos**:
  1. Leer changelogs acumulados: https://github.com/anthropics/anthropic-sdk-typescript/releases
  2. `npm install @anthropic-ai/sdk@latest`
  3. Fix conocido en `api-client.ts:142`: `err.headers?.['retry-after']` → `err.headers?.get?.('retry-after')`
  4. Verificar tipos de `Message`, `ContentBlock`, `TextBlock`
  5. Verificar que `client.messages.create()` sigue funcionando
- **Verificación**: `npm run typecheck && npm run test` + test manual con `ANTHROPIC_API_KEY` si es posible

---

## Resumen

| Paso | Dependencia | Versión actual → Target | Riesgo | Archivos |
|------|------------|------------------------|--------|----------|
| 1 | @types/node, vitest, coverage-v8 | 22→25, 3.0→3.x | Bajo | 0 |
| 2 | eslint | 9→10 | Medio | config |
| 3 | chalk, deepmerge-ts, fast-glob, js-yaml, smol-toml, MCP SDK | minor/patch | Mínimo | 0 |
| 4 | ora | 8→9 | Medio | 1 |
| 5 | @inquirer/prompts | 7→8 | Medio | 2 |
| 6 | diff | 7→8 | Medio | 1 |
| 7 | commander | 13→14 | Medio-Alto | 12 |
| 8 | fast-xml-parser | 4→5 | Medio | 1 |
| 9 | zod | 3→4 | Alto | 19 |
| 10 | @anthropic-ai/sdk | 0.39→0.78 | Alto | 1 |

## Protocolo por paso

1. Crear rama `chore/upgrade-{dep}`
2. `npm install {dep}@latest`
3. `npm run typecheck` — fix errores de tipos
4. `npm run test` — fix tests rotos
5. `npm run build && npm run build:plugin`
6. Commit: `chore(deps): upgrade {dep} from X to Y`
7. Merge a main

## Verificación final

Tras completar todos los pasos:
1. `npm run typecheck` — 0 errores
2. `npm run test` — todos pasando
3. `npm run build && npm run build:plugin`
4. `diverger init --dry-run` en proyecto de prueba
5. Dogfood en diverger, enjambre, iMBx
6. Release v3.4.0 si todo OK

## Complejidad Estimada

**Media-Alta** — Los pasos 1-6 son sencillos (~1h cada uno). Los pasos 7-10 requieren migración cuidadosa (~2-4h cada uno). El paso 9 (zod 4) depende de compatibilidad con MCP SDK.
