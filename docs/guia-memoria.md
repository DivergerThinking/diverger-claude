# Guía del Sistema de Memoria y Aprendizaje

## Visión general

diverger-claude incluye un sistema de memoria conductual que aprende de los errores que ocurren durante las sesiones de Claude Code. El objetivo es evitar que los mismos errores se repitan: los patrones detectados se convierten automáticamente en reglas que Claude lee al inicio de cada sesión.

El sistema opera en tres niveles:
- **Proyecto** — memoria específica del proyecto actual
- **Global** — aprendizajes compartidos entre todos los proyectos de la máquina
- **Claude nativo** — sincronización con la auto-memoria de Claude Code

## Archivos del sistema

| Archivo | Propósito | En git |
|---------|-----------|--------|
| `.diverger-memory.json` | Memoria del proyecto (patterns, repairs, stats) | No (.gitignore) |
| `~/.diverger/memory.json` | Aprendizajes globales cross-project | No |
| `~/.claude/projects/<project>/memory/MEMORY.md` | Sync con Claude Code nativo | No |
| `.claude/session-errors.local.json` | Errores de sesión actual (temporal) | No (.gitignore) |
| `.claude/rules/learned/*.md` | Reglas auto-generadas desde patrones | Sí |

## Ciclo de vida completo

### 1. Captura de errores (durante la sesión)

El hook `error-tracker.sh` se ejecuta automáticamente después de cada uso de Bash, Write y Edit. Cuando detecta un error en la salida de la tool, lo añade a `.claude/session-errors.local.json`:

```json
[
  {
    "message": "EACCES: permission denied, open /dist/bundle.js",
    "tool": "Write",
    "timestamp": "2026-03-03T14:22:01Z"
  }
]
```

Los errores se acumulan durante toda la sesión sin procesarse — el procesamiento ocurre al inicio de la siguiente sesión.

### 2. Procesamiento (inicio de siguiente sesión)

Al iniciar una nueva sesión de Claude Code, `onSessionStart()` ejecuta estos pasos:

1. Lee `.claude/session-errors.local.json` (si existe)
2. Clasifica cada error usando 11 clasificadores regex + fallback "unclassified"
3. Actualiza o crea patrones en la memoria del proyecto
4. Si un patrón alcanza **3 ocurrencias** → genera una regla `.md` en `.claude/rules/learned/`
5. Elimina el archivo de errores de sesión

Las reglas generadas siguen este formato:

```markdown
---
description: "Prevenir: Permission denied (EACCES)"
---

# Error recurrente: Permission denied (EACCES)

Este patrón se ha detectado 3 veces. Categoría: tool-error.

## Prevención
- Verificar permisos de archivos antes de escribir
- Evitar escribir en directorios de solo lectura
```

Claude Code lee automáticamente todas las reglas en `.claude/rules/` al inicio de sesión.

### 3. Auto-reparación (inicio de sesión)

El health check se ejecuta en cada `onSessionStart()` y detecta problemas en `.claude/`:

| Diagnóstico | Qué detecta |
|-------------|-------------|
| D1 | CLAUDE.md faltante |
| D2 | JSON inválido en settings/configs |
| D3 | Reglas mandatory borradas |
| D4 | Reglas mandatory modificadas |
| D5 | Hooks con scripts inexistentes |
| D6 | Paths inválidos en configs |
| D7 | Meta file corrupto |
| D8 | Rules directory faltante |
| D9 | Settings.json faltante |

El modelo de confianza decide la acción:

| Confianza | Acción |
|-----------|--------|
| >= 90 | Auto-fix silencioso |
| >= 70 | Auto-fix + notificación |
| >= 50 | Sugerencia al usuario |
| < 50 | Solo reportar |

Las reparaciones se registran en la memoria para tracking.

### 4. Consolidación (cada 7 días)

La consolidación se ejecuta automáticamente cuando han pasado 7+ días desde la última. Incluye:

- **Pruning**: Elimina patterns antiguos (>90 días con <3 ocurrencias)
- **Merge**: Combina anti-patterns similares
- **Caps máximos**: 200 error patterns, 500 repair logs, 100 anti-patterns, 50 best practices

### 5. Sincronización con Claude Code

Al inicio de cada sesión, los top aprendizajes se sincronizan a la auto-memoria nativa de Claude Code:

- Top 5 anti-patterns → `MEMORY.md` del proyecto
- Top 3 error patterns → `MEMORY.md` del proyecto
- Stats generales (sesiones, repairs, tasa de éxito)

La sincronización usa una sección delimitada para no interferir con otros contenidos:

```markdown
<!-- diverger:start -->
## Aprendizajes de diverger-claude
- Anti-pattern: No usar `any` en interfaces públicas (confianza: 85)
- Error frecuente: ENOENT al leer archivos sin verificar existencia (5 ocurrencias)
<!-- diverger:end -->
```

## MCP Tools disponibles

| Tool | Propósito |
|------|-----------|
| `get_memory` | Consultar la memoria del proyecto (secciones: errors, repairs, antiPatterns, bestPractices, stats, all) |
| `record_learning` | Registrar un aprendizaje manual (anti-pattern, best-practice, error-pattern) |
| `extract_learnings` | Procesar errores de sesión bajo demanda (sin esperar a next session) |
| `repair_config` | Diagnóstico y reparación de .claude/ (modos: auto, report-only) |
| `check_plugin_health` | Diagnóstico de salud del plugin |

## Skills disponibles

| Skill | Propósito |
|-------|-----------|
| `/diverger-learn` | Revisar patrones aprendidos, anti-patterns y best practices |
| `/diverger-repair` | Diagnosticar y reparar configuración .claude/ |
| `/diverger-health` | Verificar salud completa del plugin |
| `/diverger-evolve` | Analizar evolución del proyecto y recomendar actualizaciones |

## Esquema de datos

### MemoryStore

```typescript
interface MemoryStore {
  schemaVersion: 1;
  errorPatterns: ErrorPattern[];
  repairLog: RepairLogEntry[];
  evolutionLog: EvolutionEntry[];
  antiPatterns: AntiPattern[];
  bestPractices: BestPractice[];
  stats: MemoryStats;
}
```

### ErrorPattern

```typescript
interface ErrorPattern {
  id: string;                           // Hash único del patrón
  category: 'tool-error' | 'config-issue' | 'code-pattern' | 'hook-failure';
  tool?: string;                        // Tool que originó el error (Bash, Write, Edit, etc.)
  matchPattern: string;                 // Regex para matching
  description: string;                  // Descripción legible
  occurrences: number;                  // Veces detectado
  firstSeen: string;                    // ISO timestamp
  lastSeen: string;                     // ISO timestamp
  resolution?: string;                  // Solución conocida
  ruleGenerated: boolean;               // Si ya se generó regla en .claude/rules/learned/
}
```

### AntiPattern

```typescript
interface AntiPattern {
  id: string;
  pattern: string;                      // Qué evitar
  reason: string;                       // Por qué es malo
  alternative: string;                  // Qué hacer en su lugar
  source: 'error-analysis' | 'session-observation' | 'manual';
  confidence: number;                   // 0-100
  learnedAt: string;                    // ISO timestamp
}
```

### MemoryStats

```typescript
interface MemoryStats {
  totalSessions: number;
  totalRepairs: number;
  successfulRepairs: number;
  totalErrorPatterns: number;
  rulesGenerated: number;
  firstSession?: string;
  lastSession?: string;
  lastConsolidation?: string;
}
```

## Preguntas frecuentes

**¿Se comparte la memoria entre desarrolladores?**
No. `.diverger-memory.json` es local por máquina y está en `.gitignore`. Cada desarrollador tiene su propia memoria. Sin embargo, las reglas generadas en `.claude/rules/learned/` sí se commitean y comparten con el equipo.

**¿Se sube a git?**
Solo las reglas auto-generadas (`.claude/rules/learned/*.md`). La memoria, errores de sesión y sync con Claude Code son locales.

**¿Cuánto espacio ocupa?**
Menos de 500KB con los caps máximos aplicados (200 patterns + 500 repairs + 100 anti-patterns + 50 best practices).

**¿Puedo ver los aprendizajes?**
Sí. Usa `/diverger-learn` en una sesión de Claude Code, o la tool MCP `get_memory` con `section: "all"`.

**¿Puedo enseñarle manualmente?**
Sí. Usa la tool MCP `record_learning` con tipo `anti-pattern`, `best-practice` o `error-pattern`.

**¿Puedo borrar la memoria?**
Sí. Elimina `.diverger-memory.json` del proyecto. Se recreará vacía en la siguiente sesión.

**¿Qué pasa si un patrón es un falso positivo?**
Los patrones con pocas ocurrencias (<3) y antiguos (>90 días) se eliminan automáticamente durante la consolidación. También puedes editar manualmente `.diverger-memory.json`.
