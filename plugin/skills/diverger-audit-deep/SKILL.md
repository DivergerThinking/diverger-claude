---
name: diverger-audit-deep
description: "Deep multi-perspective code audit — security, quality, performance, architecture — with stack-adapted patterns"
user-invocable: true
disable-model-invocation: true
---

# Auditoria Profunda Multi-Perspectiva

Ejecuta una auditoria exhaustiva desde 4 angulos de ingenieria de software: $ARGUMENTS

## Objetivo

Analisis manual profundo del codigo fuente usando Grep y Read. NO ejecuta herramientas automaticas (eso es `/diverger-audit`). Este skill lee y analiza el codigo directamente para encontrar problemas que los linters no detectan.

Las 4 perspectivas son: **Seguridad (S)**, **Calidad de Codigo (C)**, **Rendimiento (R)**, **Arquitectura (A)**.

## Paso 1: Detectar stack y contexto

1. Llama a `detect_stack` MCP tool. Guarda las tecnologias detectadas (lenguajes, frameworks, test runners).
2. Lee `CLAUDE.md` y archivos en `.claude/rules/` para entender las convenciones del proyecto.
3. Ejecuta `git log --oneline -10` para contexto de cambios recientes.
4. Si `$ARGUMENTS` filtra perspectivas (ej: "security", "quality,perf", "architecture"), limitarse a esas. Si dice "fix", ejecutar modo fix al final (implementar correcciones P0).
5. Identifica los directorios de codigo fuente principales (src/, lib/, app/, pkg/, cmd/, internal/, etc.).

## Paso 2: SEGURIDAD

Busca vulnerabilidades de seguridad con patrones Grep adaptados al stack detectado.

### Patrones generales (todos los stacks)

Busca en archivos de codigo fuente (excluir tests, node_modules, vendor, dist):

- **Ejecucion de codigo**: `eval(`, `new Function(`, `setTimeout(string`, `setInterval(string`
- **Inyeccion de comandos**: `exec(`, `execSync(`, `spawn(.*shell.*true`, `child_process`
- **XSS**: `innerHTML`, `dangerouslySetInnerHTML`, `document.write`
- **Secrets hardcoded**: strings que contienen `password`, `secret`, `token`, `apiKey`, `api_key` seguidos de `=` o `:` con un valor literal
- **Path traversal**: concatenacion de paths con `+` sin sanitizacion, `../` en strings de usuario
- **Env leaks**: `process.env` o `os.environ` que se loguea o retorna al usuario

### Patrones por stack

**TypeScript/Node**:
- `require(` con variable (no literal) — posible LFI
- `JSON.parse` sin try/catch en datos externos
- `child_process` sin escaping de argumentos
- `http.createServer` sin HTTPS en produccion
- SQL: template literals o concat con variables de usuario

**Python**:
- `pickle.loads`, `yaml.load` (sin SafeLoader), `eval(`, `exec(`
- `os.system(`, `subprocess.call(shell=True)`, `__import__(`
- SQL concat: `f"SELECT ... {variable}"` o `"SELECT ... " + variable`
- `open(user_input)` sin sanitizar path

**Go**:
- `fmt.Sprintf` en queries SQL (usa parameterized queries)
- Error no chequeado: `_, _ = ` o omitir `err`
- `http.ListenAndServe` sin TLS
- `os/exec.Command` con input de usuario

**Rust**:
- `unsafe` blocks (verificar justificacion)
- `std::process::Command` con input sin sanitizar
- `.unwrap()` en paths que manejan input externo

### Verificaciones adicionales
- Ejecuta dependency audit segun stack: `npm audit --json` / `pip-audit` / `cargo audit` / `govulncheck`
- Lee archivos de input validation (middleware, validators, schemas)
- Verifica que hooks no filtran env vars

Para cada hallazgo documenta: **S-{N} | Archivo:Linea | Severidad | Descripcion | Remediacion**

## Paso 3: CALIDAD DE CODIGO

Busca violaciones de calidad contra las convenciones del proyecto.

### Patrones generales

- **Funciones largas**: Lee los archivos principales del proyecto. Identifica funciones >30 lineas. Prioriza las mas largas.
- **Empty catch/except**: bloques catch/except vacios que silencian errores
- **Dead code**: `TODO`, `FIXME`, `HACK`, `XXX` en comments. Exports nunca importados.
- **Naming generico**: variables llamadas `data`, `result`, `temp`, `item`, `x`, `val`, `ret` en codigo de produccion (no en tests)
- **Nesting profundo**: 3+ niveles de if/for/try anidados

### Patrones por stack

**TypeScript**:
- `: any`, `as any`, `<any>` — prohibido en la mayoria de proyectos strict
- `catch (err)` sin `: unknown` — viola TypeScript conventions
- `@ts-ignore`, `@ts-expect-error` — suppressions que merecen revision
- `// eslint-disable` — suppressions sin justificacion
- Barrel exports innecesarios (index.ts que re-exporta todo)

**Python**:
- `except:` bare (sin tipo), `except Exception:` demasiado amplio
- `# type: ignore` sin justificacion
- `pass` en except blocks, `global` keyword
- Falta type hints en funciones publicas

**Go**:
- `_` para ignorar errores: `_, _ =` o `_ = someFunc()`
- Funciones exportadas sin doc comment
- `init()` functions con side effects complejos

**Rust**:
- `.unwrap()` en codigo de produccion (no tests)
- `.clone()` innecesario cuando se puede tomar referencia
- `panic!()` fuera de tests o main

### Verificar contra reglas del proyecto
- Lee cada archivo en `.claude/rules/` y verifica que el codigo cumple las convenciones listadas
- Nota discrepancias entre las reglas declaradas y la realidad del codigo

Para cada hallazgo documenta: **C-{N} | Archivo:Linea | Severidad | Descripcion | Remediacion**

## Paso 4: RENDIMIENTO

Busca anti-patterns de rendimiento en paths criticos.

### Patrones generales

- **Sync I/O en hot paths**: `readFileSync`, `writeFileSync`, `existsSync` en funciones async
- **I/O secuencial**: loops con `await readFile` que deberian ser `Promise.all` / goroutines / threads
- **Regex en loops**: patrones regex compilados dentro de loops (deberian hoistarse)
- **JSON grande**: `JSON.parse`/`JSON.stringify` de objetos grandes en operaciones frecuentes
- **Glob sin ignore**: patterns de glob que podrian escanear node_modules, vendor, .git
- **O(n²) patterns**: `indexOf` dentro de `filter`, nested loops en arrays que podrian ser Sets/Maps

### Patrones por stack

**TypeScript/Node**:
- Imports eagerly de todo al top-level (vs dynamic import para lazy load)
- `deepmerge` o spread en loops
- Event listeners sin cleanup (memory leak)

**Python**:
- N+1 queries en ORM (loop que hace query individual por item)
- `list()` de generators muy grandes (consume toda la memoria)
- Missing `__slots__` en clases con muchas instancias

**Go**:
- Missing `sync.Pool` para allocations frecuentes
- `defer` dentro de loops (no se ejecuta hasta fin de funcion)
- String concat en loops (usar `strings.Builder`)

**Rust**:
- `.collect()` innecesario seguido de otra iteracion
- Owned strings donde bastarian `&str`
- Missing `#[inline]` en funciones hot tiny

### Foco en hot paths
- Identifica el pipeline principal del proyecto (startup, request handling, main loop)
- Lee esos archivos con atencion especial a I/O y allocations

Para cada hallazgo documenta: **R-{N} | Archivo:Linea | Severidad | Descripcion | Remediacion**

## Paso 5: ARQUITECTURA

Evalua la estructura del proyecto y las relaciones entre modulos.

### Analisis de dependencias
- Mapea imports entre modulos principales del proyecto
- Busca dependencias circulares: modulo A importa de B, B importa de A
- Verifica que la dependencia fluye de fuera hacia dentro (CLI/API → core → utils)

### Layering
- Verifica que los layers externos (CLI, API, controllers) NO importan directamente de modulos internos
- Busca bypasses de facades: imports de archivos internos en lugar del index.ts/`__init__.py`/mod.rs

### Error handling
- Verifica consistencia: ¿usa custom error classes o bare `throw new Error`/`raise Exception`/`panic!`?
- Mapea cuantos modulos usan cada patron

### Single Responsibility
- Identifica el archivo/modulo mas grande del proyecto
- Lee y evalua cuantas responsabilidades distintas tiene
- Si >3 responsabilidades, reportar como hallazgo

### Contracts/Types
- Evalua si los tipos centrales estan en un lugar o dispersos
- Si hay un archivo de tipos central, verificar si es demasiado grande (>500 lineas)
- Verificar si hay tipos duplicados entre modulos

### Testability
- Verificar si modulos criticos usan dependency injection o imports directos
- Verificar si el modulo principal puede testearse unitariamente (¿se pueden mockear dependencias?)

Para cada hallazgo documenta: **A-{N} | Archivo:Linea | Severidad | Descripcion | Remediacion**

## Paso 6: Generar reporte

1. Crea `docs/audits/audit-deep-{YYYY-MM-DD}.md` (usa la fecha actual) con:

### Resumen ejecutivo
Tabla de perspectiva x severidad:

| Perspectiva | Critical | High | Medium | Low | Total |
|-------------|----------|------|--------|-----|-------|
| Seguridad   | X | X | X | X | X |
| Calidad     | X | X | X | X | X |
| Rendimiento | X | X | X | X | X |
| Arquitectura| X | X | X | X | X |

### Tabla consolidada de hallazgos
Todos los hallazgos de las 4 perspectivas, deduplicados, ordenados por severidad:

| ID | Vista | Sev | Archivo:Linea | Descripcion | Remediacion |
|----|-------|-----|---------------|-------------|-------------|

### Priorizacion
- **P0** (Critical/High): Deben resolverse — problemas de seguridad o violations graves
- **P1** (Medium con impacto real): Deberian resolverse — afectan mantenibilidad o performance
- **P2** (Medium): Mejoras recomendadas
- **P3** (Low): Nice-to-have

### Fortalezas confirmadas
Lista de aspectos positivos encontrados durante la auditoria.

2. Si el MCP tool `record_learning` esta disponible, registra los anti-patterns descubiertos.
3. Presenta el resumen al usuario.

## Modo Fix (opcional)

Si `$ARGUMENTS` incluye "fix":
1. Despues de generar el reporte, implementa las correcciones P0 (Critical/High)
2. Para cada fix: modifica el archivo, verifica con typecheck/lint/test
3. Commit cada fix atomicamente: `fix(scope): descripcion del fix`
4. Presenta resumen de fixes aplicados

## Notas importantes

- Esta es una auditoria de **lectura manual de codigo** — complementaria a `/diverger-audit` que ejecuta herramientas automaticas
- Si un archivo tiene >500 lineas, lee las partes mas criticas (funciones exportadas, error handling, hot paths)
- Cada hallazgo DEBE tener archivo:linea real verificable y remediacion accionable concreta
- NO reportar code style en tests — solo en codigo de produccion
- NO reportar hallazgos en archivos generados (dist/, build/, vendor/)
- Si el proyecto no tiene un stack detectado para algun patron, skip esos patterns
- Severity guide: critical = exploitable vuln o data loss, high = security weakness o convention violation sistematica, medium = mejora concreta, low = nice-to-have
