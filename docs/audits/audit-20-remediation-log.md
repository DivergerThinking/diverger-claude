# Auditoría #20 — Remediation Log

**Inicio:** 2026-03-04
**Versión base:** v3.4.0 (commit c31f314)
**Final:** 1417 tests passing, 0 TypeScript errors, 0 lint warnings

## Resumen

| ID | Prioridad | Decisión | Commit |
|----|-----------|----------|--------|
| C-01 | P0 | DONE | 7e04d5a |
| A-01 | P0 | DONE | 81bbbd4 |
| S-01 | P1 | DONE | 38b70d4 |
| R-01 | P1 | DONE | b39db79 |
| R-03 | P1 | DONE | 1aafb65 |
| R-04 | P1 | SKIPPED | — |
| C-03 | P2 | SKIPPED | — |
| C-04 | P2 | SKIPPED | — |
| C-05 | P2 | DONE | bc7c01c |
| R-02 | P2 | SKIPPED | — |
| A-02 | P2 | SKIPPED | — |
| C-02 | P3 | SKIPPED | — |
| C-06 | P3 | SKIPPED | — |
| C-07 | P3 | SKIPPED | — |
| R-05 | P3 | SKIPPED | — |
| R-06 | P3 | DONE | bc7c01c |
| R-07 | P3 | DONE | bc7c01c |
| R-08 | P3 | SKIPPED | — |
| A-03 | P3 | SKIPPED | — |
| A-04 | P3 | SKIPPED | — |
| S-02 | P3 | SKIPPED | — |
| S-03 | P3 | SKIPPED | — |

**Resultado: 9 DONE, 13 SKIPPED (con razonamiento)**

---

## Detalle por Tarea

### C-01 — catch blocks sin : unknown (P0/HIGH)
**Decisión**: DONE
**Razonamiento**: Cambio mecánico 100% seguro. TypeScript strict mode ya trata catch params como unknown implícitamente; esto solo añade la anotación explícita para consistencia con las convenciones del proyecto. 0 riesgo de regresión.
**Archivos modificados**: 32 archivos en src/ (utils, core, detection, governance, adaptation, knowledge, cli, mcp)
**Hallazgos reales**: 45 catch blocks (no 47 — 6 estaban en string content de profiles)
**Commit**: 7e04d5a

### A-01 — error classes tipadas (P0/HIGH)
**Decisión**: DONE (selectivo)
**Razonamiento**: Creadas 3 nuevas clases: ParseError (parsers), ValidationError (path traversal + name validation), PluginError (download). Aplicadas a 10 throw sites donde el manejo programático aporta valor. Skipped greenfield/wizard.ts (error interno, nunca capturado programáticamente) y vue.profile.ts (string content).
**Archivos modificados**: 8 archivos (errors.ts, parsers.ts, paths.ts, fs.ts, agents.ts, skills.ts, hook-scripts.ts, plugin.ts)
**Commit**: 81bbbd4

### S-01 — escapeShell() incompleto (P1/MEDIUM)
**Decisión**: DONE (solución superior)
**Razonamiento**: En lugar de parchear escapeShell(), se eliminó por completo reemplazando execSync con execFileSync + args array. Esto pasa argumentos directamente a gh CLI sin interpretación shell, eliminando toda superficie de inyección. Solución más robusta que cualquier escaping.
**Archivos modificados**: 1 (unknown-tech-tracker.ts)
**Commit**: 38b70d4

### R-01 — paralelizar FileScanner reads (P1/MEDIUM)
**Decisión**: DONE
**Razonamiento**: Reemplazar loop secuencial de readFile por Promise.all(). Reduce latencia I/O de O(n*syscall_time) a O(max_syscall_time). Cambio simple sin riesgo — Map insertion order no es relevante (fg no garantiza orden, analyzers buscan por key).
**Archivos modificados**: 1 (scanner.ts — ambos métodos scan() y scanPatterns())
**Commit**: b39db79

### R-03 — combinar forks de node en pre-commit hook (P1/MEDIUM)
**Decisión**: DONE
**Razonamiento**: Combinar 2 invocaciones de node -e en 1 para leer versiones de package.json y plugin.json. Ahorro de ~100-150ms por commit.
**Archivos modificados**: 1 (.claude/hooks/pre-commit-validator.sh)
**Commit**: 1aafb65

### R-04 — convertir project-metadata.ts a async (P1/MEDIUM)
**Decisión**: SKIPPED
**Razonamiento**: La función se llama UNA vez durante init/sync (no es hot path). Lee ~10 archivos pequeños locales. Total bloqueante: ~10-30ms en SSD. Convertir 400 líneas a async + actualizar todos los callers tiene un ratio esfuerzo/beneficio terrible. El impacto es imperceptible para el usuario.

### C-03 — refactorizar detectReactNativeAndExpo() (P2/MEDIUM)
**Decisión**: SKIPPED
**Razonamiento**: La auditoría reportó "200 líneas" pero la función real tiene 104 líneas (64-168). La lógica de boost ya está extraída en boostReactNativeFromConfigs(). La función restante tiene estructura interna clara. Fragmentar más no mejora la legibilidad.

### C-04 — refactorizar composeAgents/mergeExternalToolConfigs (P2/MEDIUM)
**Decisión**: SKIPPED
**Razonamiento**: composeAgents() tiene 65 líneas con 4 branches claros de define/enrich. mergeExternalToolConfigs() tiene ~54 líneas. Ambas son legibles como están. La regla <30 líneas es una guía, no un hard limit — extraer helpers fragmentaría lógica relacionada.

### C-05 — debug logging en empty catch de fs.ts (P2/MEDIUM)
**Decisión**: DONE
**Razonamiento**: Quick fix de 1 línea. Añade log condicional en process.env.DEBUG para diagnosticar fallos silenciosos de cleanup en writeFileAtomic.
**Commit**: bc7c01c

### R-02 — batch merge de profile settings (P2/MEDIUM)
**Decisión**: SKIPPED
**Razonamiento**: Con ~10 profiles activos, deepmerge se llama ~10 veces sobre objetos pequeños (<1KB). El overhead es imperceptible (<1ms total). Batch merge complicaría la lógica de applyProfile() sin beneficio medible.

### A-02 — dependency injection en DivergerEngine (P2/MEDIUM)
**Decisión**: SKIPPED
**Razonamiento**: No hay tests que necesiten inyectar mocks de sub-engines. El engine se instancia una vez. DI añade complejidad de constructor sin caso de uso concreto. Si surje la necesidad, se puede añadir entonces.

### C-02 — as any en mocks de NestJS profile (P3)
**Decisión**: SKIPPED
**Razonamiento**: Los 5 as any están en mock objects dentro de ejemplo de código en el profile (string content). No es código ejecutable del proyecto — son ejemplos para el usuario final. Tiparlos no aporta valor.

### C-06/C-07 — funciones >30 líneas en engine.ts y merge.ts (P3)
**Decisión**: SKIPPED
**Razonamiento**: fetchKnowledge() (47 líneas) y mergeFile() (72 líneas) tienen lógica secuencial clara. Extraer sub-helpers fragmentaría flujos que se leen mejor como bloque continuo. No hay complejidad ciclomática alta.

### R-05 — readFileSync en telemetry (P3)
**Decisión**: SKIPPED
**Razonamiento**: El telemetry store lee 1 archivo JSON de <1KB. 1-5ms de bloqueo en un CLI que ya hace I/O sync en project-metadata.ts no es un bottleneck real.

### R-06 — deep limit en scan() principal (P3)
**Decisión**: DONE
**Razonamiento**: Añadir deep:3 como medida defensiva. Quick fix de 1 línea que previene escaneos accidentales en repositorios profundamente anidados.
**Commit**: bc7c01c

### R-07 — indexOf → Set para dedup en composer (P3)
**Decisión**: DONE
**Razonamiento**: Cambio algorítmico correcto de O(n²) a O(n). Quick fix de 3 líneas. Aunque el impacto es bajo con arrays pequeños, la corrección algorítmica es libre.
**Commit**: bc7c01c

### R-08 — JSON.stringify incremental en memory store (P3)
**Decisión**: SKIPPED
**Razonamiento**: El store actual es <5KB. El problema hipotético (>50KB) no existe hoy. Premature optimization. Si crece, se abordará entonces.

### A-03/A-04 — documentación en types.ts y conflict resolution (P3)
**Decisión**: SKIPPED
**Razonamiento**: types.ts ya tiene 18 secciones con headers claros (la auditoría lo reconoce: "bien organizado"). Un JSDoc header añade poco valor. La documentación de conflict resolution es útil pero no es un bug — se puede añadir en un PR de docs separado.

### S-02/S-03 — monitoreo de deps y logging de MCP (P3)
**Decisión**: SKIPPED
**Razonamiento**: S-02: diff@^8.0.3 no tiene CVE activo, npm audit lo monitorea automáticamente. S-03: MCP server usa stdio transport single-user — rate limiting y audit logging serían overengineering para el caso de uso actual.
