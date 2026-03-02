# Super Prompt — Auditoría y mejora de profiles con agentes

## Estrategia de ejecución

Se lanzan **N agentes en paralelo** (máximo ~5 simultáneos por limitaciones de contexto), cada uno especializado en **un único profile**. Cada agente:

1. Lee su profile actual desde `src/profiles/registry/`
2. Lee las URLs oficiales desde `docs/official-docs-reference.md`
3. Hace `WebFetch` a las páginas de documentación oficial relevantes
4. Compara el contenido del profile contra las best practices oficiales actuales
5. Reescribe el profile para alcanzar el nivel máximo de calidad

---

## Prompt-plantilla por agente

> **Variables a sustituir antes de lanzar cada agente:**
> - `{PROFILE_PATH}` — Ruta al archivo del profile (ej: `src/profiles/registry/frameworks/nextjs.profile.ts`)
> - `{PROFILE_ID}` — ID del profile (ej: `frameworks/nextjs`)
> - `{TECHNOLOGY_NAME}` — Nombre legible (ej: `Next.js`)
> - `{LAYER_NAME}` — Capa (ej: `FRAMEWORK`)
> - `{DOCS_SECTION_ANCHOR}` — Anchor en official-docs-reference.md (ej: `#nextjs`)

```
Eres un ingeniero de software senior especializado en {TECHNOLOGY_NAME} y en la configuración
de agentes IA para desarrollo asistido. Tu misión es auditar y mejorar el profile
"{PROFILE_ID}" de diverger-claude hasta convertirlo en una referencia de ingeniería de
software moderna con IA.

## Contexto del proyecto

diverger-claude es una herramienta que detecta el stack tecnológico de un proyecto y genera
configuración `.claude/` adaptada. Cada "profile" contribuye secciones de CLAUDE.md, reglas,
enrichments de agentes, skills, hooks y herramientas externas. Los profiles se componen en
5 capas (Base:0 → Language:10 → Framework:20 → Testing:30 → Infra:40).

## Tu profile: {PROFILE_ID} (capa {LAYER_NAME})

## Paso 1 — Lectura del estado actual

1. Lee el profile actual: `{PROFILE_PATH}`
2. Lee la referencia de documentación oficial: `docs/official-docs-reference.md`,
   sección {DOCS_SECTION_ANCHOR}
3. Lee el profile base para entender qué agentes existen:
   `src/profiles/registry/base/universal.profile.ts`
4. Lee los tipos del sistema: `src/core/types.ts` (interfaces Profile, ProfileContributions, etc.)

## Paso 2 — Investigación de documentación oficial

Usa WebFetch para consultar las páginas más relevantes de documentación oficial de
{TECHNOLOGY_NAME}. Prioriza:

- **Best practices / Style guide oficial** — Para validar que las reglas del profile
  reflejan las recomendaciones actuales del equipo oficial
- **API reference / Docs principales** — Para verificar que los patrones recomendados
  en claudeMd y rules usan APIs actuales (no deprecadas)
- **Migration guides / What's new** — Para asegurar que el profile cubre las versiones
  más recientes y sus cambios

Extrae de cada página:
- Convenciones de código que deberían ser reglas
- Patrones recomendados vs anti-patterns
- APIs nuevas o deprecadas que el profile debería mencionar
- Configuraciones de herramientas recomendadas oficialmente

## Paso 3 — Auditoría del profile actual

Evalúa cada sección del profile contra estos criterios de excelencia:

### A. claudeMd sections
- [ ] ¿Cubre todas las convenciones oficiales actuales de {TECHNOLOGY_NAME}?
- [ ] ¿Menciona patrones Y anti-patterns?
- [ ] ¿Las APIs/funciones referenciadas están actualizadas (no deprecadas)?
- [ ] ¿Es conciso pero completo? (No más de lo necesario, no menos de lo importante)
- [ ] ¿Incluye las convenciones de estructura de proyecto oficiales?
- [ ] ¿El orden (`order`) es coherente con la capa?

### B. rules (archivos de reglas)
- [ ] ¿Tiene al menos 2 rules (architecture + conventions)?
- [ ] ¿Las reglas reflejan las best practices oficiales más recientes?
- [ ] ¿Distingue correctamente governance "mandatory" vs "recommended"?
- [ ] ¿Incluye sección de anti-patterns con ejemplos de código?
- [ ] ¿Cubre: estructura de proyecto, naming, error handling, security, performance?
- [ ] ¿Los ejemplos de código son correctos y siguen la versión actual?

### C. agents (enrichments)
- [ ] ¿Enriquece al menos `code-reviewer` Y `test-writer`?
- [ ] ¿El enrichment del code-reviewer incluye criterios específicos de {TECHNOLOGY_NAME}?
- [ ] ¿El enrichment del test-writer conoce las herramientas y patrones de testing del ecosistema?
- [ ] ¿Considera enriquecer `security-checker` con vulnerabilidades específicas del ecosistema?
- [ ] ¿Considera enriquecer `refactor-assistant` con patrones de migración?
- [ ] ¿Los prompts son específicos y accionables (no genéricos)?

### D. skills
- [ ] ¿Tiene al menos 1 skill relevante? (generador, scaffolder, migrador, etc.)
- [ ] ¿El skill resuelve una tarea repetitiva real del ecosistema?
- [ ] ¿El contenido del SKILL.md es claro y completo?

### E. hooks
- [ ] ¿Tiene hooks de validación post-escritura relevantes para {TECHNOLOGY_NAME}?
- [ ] ¿Los hooks detectan errores comunes específicos del ecosistema?
- [ ] ¿Los comandos de los hooks son robustos (no fallan en edge cases)?
- [ ] ¿Usan las variables de entorno correctas ($CLAUDE_FILE_PATH, $CLAUDE_TOOL_INPUT)?

### F. externalTools
- [ ] ¿Incluye configuraciones de herramientas del ecosistema?
  (linter, formatter, config principal del framework, etc.)
- [ ] ¿Los valores de configuración siguen las recomendaciones oficiales?
- [ ] ¿El mergeStrategy es apropiado? (create-only para nuevos, align para existentes)

### G. settings
- [ ] ¿Los permisos allow/deny son específicos y siguen el principio de mínimo privilegio?
- [ ] ¿Los comandos permitidos cubren el workflow habitual del framework?

## Paso 4 — Reescritura del profile

Reescribe el archivo `{PROFILE_PATH}` completo aplicando todas las mejoras.
Respeta estas restricciones:

### Restricciones técnicas
- Mantén el `id`, `name`, `layer` y `technologyIds` originales
- Respeta la interfaz `Profile` de `src/core/types.ts` — no inventes campos
- Los agents DEBEN usar `type: 'enrich'` (solo el base usa 'define')
- Los imports deben ser de `../../core/types.js` (ESM con extensión .js)
- No uses `any` sin justificación
- El archivo debe exportar `const <name>Profile: Profile = { ... }`

### Estándares de contenido
- Reglas y claudeMd en **inglés** (código interno), strings user-facing en **español**
- Las rules deben tener ejemplos de código reales (```typescript, ```python, etc.)
- Los ejemplos deben reflejar las versiones actuales de {TECHNOLOGY_NAME}
- Anti-patterns siempre con la alternativa correcta al lado
- Prompts de agentes: específicos, con checklist concreto, no frases vagas
- Hooks: comandos de una línea, compatibles con bash, timeout razonable (5-15s)
- Skills: instrucciones paso a paso, no descripciones vagas

### Niveles de excelencia por sección

**claudeMd — Nivel excelencia:**
Debe leer como una guía rápida que un desarrollador senior consultaría.
Estructura: Convenciones principales → Estructura de proyecto → Patrones clave →
Performance tips → Errores comunes a evitar.

**rules — Nivel excelencia:**
Cada regla debe tener: Contexto (por qué), Regla (qué), Ejemplo correcto,
Anti-pattern con explicación. La rule de architecture debe cubrir: estructura de
carpetas, separación de responsabilidades, patrones de estado, manejo de errores.

**agents — Nivel excelencia:**
Los enrichments deben dar al agente un "segundo cerebro" especializado.
El code-reviewer debe saber qué buscar específicamente en código {TECHNOLOGY_NAME}.
El test-writer debe conocer las herramientas de testing del ecosistema y sus patrones.
Incluir enrichments para security-checker y refactor-assistant si aplica.

**skills — Nivel excelencia:**
Al menos 1 skill que automatice una tarea repetitiva real:
- Frameworks: generador de componentes/rutas/endpoints
- Testing: generador de test suites
- Infra: generador de configs/manifests
- Languages: generador de módulos con boilerplate

**hooks — Nivel excelencia:**
Hooks que detecten los 3-5 errores más comunes del ecosistema.
Ejemplos: importaciones incorrectas, patrones deprecados, secretos expuestos,
configuraciones inseguras.

## Paso 5 — Verificación final

Antes de escribir el archivo, verifica:
1. El archivo compila (TypeScript válido, sin errores de tipos)
2. Los imports son correctos
3. No hay duplicación con el profile base (no repitas lo que ya dice universal.profile.ts)
4. No hay duplicación con el profile de lenguaje padre
   (ej: nextjs no debe repetir reglas de typescript)
5. El contenido refleja documentación oficial actual, no información obsoleta
6. Todos los arrays tienen al menos los elementos mínimos requeridos

## Output esperado

Escribe el archivo `{PROFILE_PATH}` completo y mejorado.
Después, muestra un resumen de cambios:
- Secciones añadidas/modificadas
- Reglas nuevas o actualizadas
- Agentes enriquecidos
- Skills añadidos
- Hooks añadidos/mejorados
- Referencias oficiales consultadas
```

---

## Tabla de ejecución — Todos los profiles

### Capa 0 — Base

| # | PROFILE_ID | PROFILE_PATH | TECHNOLOGY_NAME | DOCS_ANCHOR |
|---|-----------|--------------|-----------------|-------------|
| 1 | `base/universal` | `src/profiles/registry/base/universal.profile.ts` | Universal (Git, SOLID, OWASP, Clean Code) | `#capa-0--base--universal` |

### Capa 10 — Lenguajes

| # | PROFILE_ID | PROFILE_PATH | TECHNOLOGY_NAME | DOCS_ANCHOR |
|---|-----------|--------------|-----------------|-------------|
| 2 | `languages/typescript` | `src/profiles/registry/languages/typescript.profile.ts` | TypeScript | `#typescript` |
| 3 | `languages/python` | `src/profiles/registry/languages/python.profile.ts` | Python | `#python` |
| 4 | `languages/java` | `src/profiles/registry/languages/java.profile.ts` | Java | `#java` |
| 5 | `languages/go` | `src/profiles/registry/languages/go.profile.ts` | Go | `#go` |
| 6 | `languages/rust` | `src/profiles/registry/languages/rust.profile.ts` | Rust | `#rust` |
| 7 | `languages/csharp` | `src/profiles/registry/languages/csharp.profile.ts` | C# / .NET | `#c--net` |
| 8 | `languages/kotlin` | `src/profiles/registry/languages/kotlin.profile.ts` | Kotlin | `#kotlin` |
| 9 | `languages/swift` | `src/profiles/registry/languages/swift.profile.ts` | Swift | `#swift` |
| 10 | `languages/dart` | `src/profiles/registry/languages/dart.profile.ts` | Dart | `#dart` |

### Capa 20 — Frameworks Frontend

| # | PROFILE_ID | PROFILE_PATH | TECHNOLOGY_NAME | DOCS_ANCHOR |
|---|-----------|--------------|-----------------|-------------|
| 11 | `frameworks/react` | `src/profiles/registry/frameworks/react.profile.ts` | React | `#react` |
| 12 | `frameworks/nextjs` | `src/profiles/registry/frameworks/nextjs.profile.ts` | Next.js | `#nextjs` |
| 13 | `frameworks/nuxt` | `src/profiles/registry/frameworks/nuxt.profile.ts` | Nuxt | `#nuxt` |
| 14 | `frameworks/svelte` | `src/profiles/registry/frameworks/svelte.profile.ts` | Svelte / SvelteKit | `#svelte--sveltekit` |
| 15 | `frameworks/angular` | `src/profiles/registry/frameworks/angular.profile.ts` | Angular | `#angular` |
| 16 | `frameworks/vue` | `src/profiles/registry/frameworks/vue.profile.ts` | Vue.js | `#vuejs` |

### Capa 20 — Frameworks Backend

| # | PROFILE_ID | PROFILE_PATH | TECHNOLOGY_NAME | DOCS_ANCHOR |
|---|-----------|--------------|-----------------|-------------|
| 17 | `frameworks/express` | `src/profiles/registry/frameworks/express.profile.ts` | Express.js | `#expressjs` |
| 18 | `frameworks/nestjs` | `src/profiles/registry/frameworks/nestjs.profile.ts` | NestJS | `#nestjs` |
| 19 | `frameworks/fastapi` | `src/profiles/registry/frameworks/fastapi.profile.ts` | FastAPI | `#fastapi` |
| 20 | `frameworks/flask` | `src/profiles/registry/frameworks/flask.profile.ts` | Flask | `#flask` |
| 21 | `frameworks/django` | `src/profiles/registry/frameworks/django.profile.ts` | Django | `#django` |
| 22 | `frameworks/spring-boot` | `src/profiles/registry/frameworks/spring-boot.profile.ts` | Spring Boot | `#spring-boot` |
| 23 | `frameworks/gin` | `src/profiles/registry/frameworks/gin.profile.ts` | Gin (Go) | `#gin-go` |
| 24 | `frameworks/echo` | `src/profiles/registry/frameworks/echo.profile.ts` | Echo (Go) | `#echo-go` |
| 25 | `frameworks/fiber` | `src/profiles/registry/frameworks/fiber.profile.ts` | Fiber (Go) | `#fiber-go` |
| 26 | `frameworks/actix-web` | `src/profiles/registry/frameworks/actix-web.profile.ts` | Actix-web (Rust) | `#actix-web-rust` |
| 27 | `frameworks/axum` | `src/profiles/registry/frameworks/axum.profile.ts` | Axum (Rust) | `#axum-rust` |
| 28 | `frameworks/rocket` | `src/profiles/registry/frameworks/rocket.profile.ts` | Rocket (Rust) | `#rocket-rust` |

### Capa 20 — Frameworks Mobile

| # | PROFILE_ID | PROFILE_PATH | TECHNOLOGY_NAME | DOCS_ANCHOR |
|---|-----------|--------------|-----------------|-------------|
| 29 | `frameworks/react-native` | `src/profiles/registry/frameworks/react-native.profile.ts` | React Native | `#react-native` |
| 30 | `frameworks/expo` | `src/profiles/registry/frameworks/expo.profile.ts` | Expo | `#expo` |
| 31 | `frameworks/flutter` | `src/profiles/registry/frameworks/flutter.profile.ts` | Flutter | `#flutter` |
| 32 | `frameworks/swiftui` | `src/profiles/registry/frameworks/swiftui.profile.ts` | SwiftUI | `#swiftui` |
| 33 | `frameworks/jetpack-compose` | `src/profiles/registry/frameworks/jetpack-compose.profile.ts` | Jetpack Compose | `#jetpack-compose` |

### Capa 30 — Testing

| # | PROFILE_ID | PROFILE_PATH | TECHNOLOGY_NAME | DOCS_ANCHOR |
|---|-----------|--------------|-----------------|-------------|
| 34 | `testing/jest` | `src/profiles/registry/testing/jest.profile.ts` | Jest | `#jest` |
| 35 | `testing/vitest` | `src/profiles/registry/testing/vitest.profile.ts` | Vitest | `#vitest` |
| 36 | `testing/pytest` | `src/profiles/registry/testing/pytest.profile.ts` | Pytest | `#pytest` |
| 37 | `testing/junit` | `src/profiles/registry/testing/junit.profile.ts` | JUnit | `#junit` |
| 38 | `testing/cypress` | `src/profiles/registry/testing/cypress.profile.ts` | Cypress | `#cypress` |
| 39 | `testing/playwright` | `src/profiles/registry/testing/playwright.profile.ts` | Playwright | `#playwright` |
| 40 | `testing/detox` | `src/profiles/registry/testing/detox.profile.ts` | Detox | `#detox` |
| 41 | `testing/xctest` | `src/profiles/registry/testing/xctest.profile.ts` | XCTest | `#xctest` |
| 42 | `testing/espresso` | `src/profiles/registry/testing/espresso.profile.ts` | Espresso | `#espresso` |

### Capa 40 — Infraestructura

| # | PROFILE_ID | PROFILE_PATH | TECHNOLOGY_NAME | DOCS_ANCHOR |
|---|-----------|--------------|-----------------|-------------|
| 43 | `infra/docker` | `src/profiles/registry/infra/docker.profile.ts` | Docker | `#docker` |
| 44 | `infra/kubernetes` | `src/profiles/registry/infra/kubernetes.profile.ts` | Kubernetes | `#kubernetes` |
| 45 | `infra/github-actions` | `src/profiles/registry/infra/github-actions.profile.ts` | GitHub Actions | `#github-actions` |
| 46 | `infra/aws` | `src/profiles/registry/infra/aws.profile.ts` | AWS | `#aws` |
| 47 | `infra/terraform` | `src/profiles/registry/infra/terraform.profile.ts` | Terraform | `#terraform` |
| 48 | `infra/vercel` | `src/profiles/registry/infra/vercel.profile.ts` | Vercel | `#vercel` |
| 49 | `infra/fastlane` | `src/profiles/registry/infra/fastlane.profile.ts` | Fastlane | `#fastlane` |

---

## Orquestación recomendada

### Oleadas de ejecución

Dado que cada agente necesita hacer WebFetch y lectura de archivos, se recomienda
ejecutar en oleadas de **5 agentes simultáneos**, organizados para que las dependencias
se resuelvan primero:

**Oleada 0 — Base (prerequisito de todo)**
- `base/universal`

**Oleada 1 — Lenguajes (prerequisito de frameworks)**
- `languages/typescript`, `languages/python`, `languages/java`, `languages/go`, `languages/rust`

**Oleada 2 — Lenguajes restantes**
- `languages/csharp`, `languages/kotlin`, `languages/swift`, `languages/dart`

**Oleada 3 — Frameworks Frontend**
- `frameworks/react`, `frameworks/nextjs`, `frameworks/nuxt`, `frameworks/svelte`, `frameworks/angular`

**Oleada 4 — Frameworks Frontend + Backend**
- `frameworks/vue`, `frameworks/express`, `frameworks/nestjs`, `frameworks/fastapi`, `frameworks/flask`

**Oleada 5 — Frameworks Backend**
- `frameworks/django`, `frameworks/spring-boot`, `frameworks/gin`, `frameworks/echo`, `frameworks/fiber`

**Oleada 6 — Frameworks Backend (Rust) + Mobile**
- `frameworks/actix-web`, `frameworks/axum`, `frameworks/rocket`, `frameworks/react-native`, `frameworks/expo`

**Oleada 7 — Frameworks Mobile restantes + Testing**
- `frameworks/flutter`, `frameworks/swiftui`, `frameworks/jetpack-compose`, `testing/jest`, `testing/vitest`

**Oleada 8 — Testing**
- `testing/pytest`, `testing/junit`, `testing/cypress`, `testing/playwright`, `testing/detox`

**Oleada 9 — Testing restante + Infra**
- `testing/xctest`, `testing/espresso`, `infra/docker`, `infra/kubernetes`, `infra/github-actions`

**Oleada 10 — Infra restante**
- `infra/aws`, `infra/terraform`, `infra/vercel`, `infra/fastlane`

### Verificación post-oleada

Después de cada oleada, ejecutar:
```bash
npx tsc --noEmit              # Verificar que TypeScript compila
npx vitest run                # Verificar que los tests pasan
```

---

## Ejemplo de invocación de un agente

```
Agent(
  subagent_type: "general-purpose",
  description: "Audit Next.js profile",
  prompt: <PROMPT_PLANTILLA con variables sustituidas para Next.js>
)
```

### Ejemplo concreto con variables sustituidas para Next.js:

```
Eres un ingeniero de software senior especializado en Next.js y en la configuración
de agentes IA para desarrollo asistido. Tu misión es auditar y mejorar el profile
"frameworks/nextjs" de diverger-claude hasta convertirlo en una referencia de ingeniería
de software moderna con IA.

[... resto del prompt con:]
- {PROFILE_PATH} = src/profiles/registry/frameworks/nextjs.profile.ts
- {PROFILE_ID} = frameworks/nextjs
- {TECHNOLOGY_NAME} = Next.js
- {LAYER_NAME} = FRAMEWORK
- {DOCS_SECTION_ANCHOR} = #nextjs
```

---

## Criterios de "obra de arte"

Un profile es una obra de arte cuando:

1. **Completo**: Cubre todas las secciones (claudeMd, rules x2+, agents x2+, skills x1+, hooks x1+)
2. **Actualizado**: Refleja la documentación oficial más reciente (2025-2026)
3. **Específico**: No tiene contenido genérico — todo es particular de la tecnología
4. **Accionable**: Cada regla tiene ejemplo de código correcto + anti-pattern
5. **Inteligente**: Los enrichments de agentes dan superpoderes específicos al AI
6. **Defensivo**: Los hooks detectan errores reales del ecosistema
7. **Productivo**: Los skills automatizan tareas repetitivas reales
8. **No redundante**: No repite lo que ya dicen capas inferiores (base, language)
9. **Bien escrito**: Técnicamente preciso, conciso, sin ambigüedades
10. **Verificable**: Todo claim es respaldable con documentación oficial
