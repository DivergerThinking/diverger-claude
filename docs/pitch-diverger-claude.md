# diverger-claude — Tu Equipo de Desarrollo con IA, Configurado en Segundos

## El Problema

Imagina que tu equipo empieza a usar Claude Code. Cada desarrollador lo instala, abre su proyecto, y empieza a trabajar. El problema es que cada uno lo usa diferente:

- **Dev A** le pidio a Claude que use ESLint, pero nunca le dijo las reglas del proyecto.
- **Dev B** confio en Claude para hacer un deploy y Claude ejecuto un `git push --force` que borro commits del equipo.
- **Dev C** paso 20 minutos explicandole a Claude la estructura del proyecto, las convenciones de testing, y el flujo de Git. Al dia siguiente tuvo que repetirlo todo porque empezo una sesion nueva.
- **Dev D** lleva una semana commiteando con errores de TypeScript que solo se descubren cuando CI falla.

El resultado: Claude es una herramienta poderosa pero **sin configuracion**, cada sesion empieza desde cero. Los mismos errores se repiten. No hay estandares. No hay proteccion. No hay memoria.

---

## La Solucion

**diverger-claude** resuelve esto con un solo comando.

Detecta automaticamente el stack de tu proyecto (TypeScript, React, Docker, GitHub Actions... lo que sea), y genera una configuracion `.claude/` completa y optimizada. No es una plantilla generica. Es una configuracion **adaptada exactamente a tu proyecto**.

Y eso es solo el comienzo. El sistema aprende, se protege, se repara, y evoluciona con tu proyecto.

---

## Como Funciona

### Paso 1: Instalar (1 minuto)

```bash
npm install -g @divergerthinking/diverger-claude \
  --@divergerthinking:registry=https://npm.pkg.github.com

diverger plugin install
```

Eso es todo. Tienes el CLI y el plugin instalados. El plugin se registra automáticamente en Claude Code — reinicia Claude Code si ya tenías una sesión abierta para que lo detecte.

### Paso 2: Inicializar tu proyecto (30 segundos)

```bash
cd tu-proyecto
diverger init
```

diverger escanea tu proyecto y detecta todo:

```
Tecnologias detectadas:
  TypeScript 5.7    ██████████ 100%
  React 18          ██████████  98%
  Next.js 14        █████████   95%
  Vitest            █████████   93%
  Docker            ████████    88%
  GitHub Actions    █████████   95%

Aplicando profiles:
  base/universal
  lang/typescript
  framework/react, framework/nextjs
  testing/vitest
  infra/docker, infra/github-actions

Archivos generados:
  .claude/CLAUDE.md          (instrucciones adaptadas a tu stack)
  .claude/settings.json      (permisos y configuracion)
  .claude/rules/security.md  (reglas de seguridad OWASP 2025)
  .claude/rules/architecture-and-style.md
  .claude/rules/git-workflow.md
  ...
```

Tu proyecto ahora tiene una configuracion `.claude/` que Claude Code lee automaticamente al inicio de cada sesion.

### Paso 3: Trabajar con Claude (inmediato)

Desde este momento, cuando abres Claude Code en tu proyecto:

- Claude **sabe** que usas TypeScript strict mode, React con hooks, Next.js App Router, y vitest
- Claude **sigue** las reglas de seguridad OWASP, convenciones de naming, y flujo de Git del equipo
- Claude **no puede** ejecutar `git push --force`, escribir secretos en archivos, ni commitear con errores de TypeScript (los hooks lo bloquean)
- Claude tiene acceso a **8 agentes especializados** (code-reviewer, test-writer, security-checker...) y **18 skills** que puedes invocar con `/`

Ejemplo de skills en accion:

```
/diverger-pr-review          ← Review exhaustivo del PR actual
/diverger-test-suite          ← Analiza cobertura y genera tests faltantes
/diverger-audit               ← Auditoria completa de seguridad y calidad
/diverger-release             ← Checklist de release con validaciones
```

### Paso 4: El sistema aprende solo (automatico)

Aqui es donde diverger-claude se diferencia de cualquier plantilla de configuracion.

**Escenario real**: Un desarrollador intenta escribir en un directorio de solo lectura. Claude falla con `EACCES: permission denied`. Esto pasa una vez, dos veces, tres veces en diferentes sesiones.

Lo que sucede automaticamente:
1. El hook `error-tracker` captura cada error silenciosamente
2. Al iniciar la siguiente sesion, el sistema clasifica el error
3. Cuando detecta que el mismo patron ocurrio 3 veces, genera una regla automatica:

```markdown
# Error recurrente: Permission denied (EACCES)

Este patron se ha detectado 3 veces. Categoria: tool-error.

## Prevencion
- Verificar permisos de archivos antes de escribir
- Evitar escribir en directorios de solo lectura
```

4. Claude Code lee esta regla al inicio de cada sesion y **ya no comete ese error**

El equipo no tuvo que hacer nada. El sistema aprendio solo.

---

## Lo que Incluye

### 59 Profiles Tecnologicos

La base del sistema. Cada profile contiene reglas, convenciones, agentes y configuracion especifica para una tecnologia. Se componen en 5 capas:

| Capa | Que contiene | Ejemplos |
|------|-------------|----------|
| Base | Reglas universales (seguridad, arquitectura, Git) | 1 profile |
| Language | Convenciones del lenguaje | TypeScript, Python, Java, Go, Rust, C#... |
| Framework | Patrones del framework | React, Next.js, Express, Django, Spring, Vue... |
| Testing | Configuracion de testing | Vitest, Jest, Pytest, JUnit... |
| Infra | CI/CD y deployment | Docker, GitHub Actions, GitLab CI, Terraform... |

Las capas se componen automaticamente. Si tu proyecto tiene TypeScript + React + Vitest + Docker, las 4 capas se combinan en una configuracion coherente y sin conflictos.

### 18 Skills de Productividad

Comandos que invocas con `/` durante una sesion de Claude Code:

**Configuracion** (4): Detectar stack, verificar estado, sincronizar config, validar gobernanza

**Inteligencia** (5): Ver aprendizajes, reparar config, verificar salud del plugin, analizar evolucion del proyecto, aprender de fallos de CI

**Workflows** (6): Auditoria completa, generar test suite, review de PR, onboarding de nuevos devs, migraciones tecnologicas, release completo

**Referencia** (3): Guias de arquitectura, Git, y seguridad OWASP

### 8 Agentes Especializados

Claude Code delega automaticamente a estos agentes cuando la tarea lo requiere:

| Agente | Que hace |
|--------|----------|
| code-reviewer | Revision con estandares del stack detectado |
| test-writer | Tests con framework correcto (vitest, jest, pytest...) |
| security-checker | Auditoria OWASP adaptada |
| doc-writer | Documentacion tecnica |
| refactor-assistant | Refactoring seguro paso a paso |
| migration-helper | Migraciones de version/framework |
| evolution-advisor | Recomienda actualizaciones de config |
| audit-reviewer | Revision exhaustiva de calidad |

### 7 Hooks de Proteccion

Se ejecutan automaticamente. No requieren configuracion. Protegen al equipo de errores costosos:

| Hook | Que previene |
|------|-------------|
| Secret scanner | Escritura de API keys, tokens, passwords en archivos |
| Destructive command blocker | `git push --force`, `rm -rf /`, `git reset --hard` |
| Pre-commit validator | Commits con plugin desactualizado o errores de TypeScript |
| Error tracker | (Captura errores silenciosamente para aprendizaje) |
| Session learner | (Prepara errores para procesamiento en proxima sesion) |
| Long lines checker | Lineas excesivamente largas (>300 chars) |
| Trailing newline checker | Archivos sin newline final |

### 14 Herramientas MCP

API programatica para que Claude (u otras herramientas) interactuen con diverger-claude. Incluye deteccion, generacion, sync, memoria, reparacion, salud, y mas.

---

## El Diferencial: Inteligencia Adaptativa

Lo que hace a diverger-claude unico no es la configuracion inicial — es que el sistema **aprende, se repara, y evoluciona**.

### Aprende de tus errores

Cada error que ocurre durante una sesion de Claude Code se captura, clasifica, y almacena. Cuando un patron se repite 3 veces, el sistema genera automaticamente una regla preventiva. El equipo no tiene que hacer nada.

Las reglas generadas se guardan en `.claude/rules/learned/` y se commitean con el proyecto, asi que todo el equipo se beneficia del aprendizaje.

### Se repara solo

Si alguien borra el `CLAUDE.md`, rompe el `settings.json`, o elimina una regla de seguridad obligatoria, el sistema lo detecta al inicio de la siguiente sesion y lo repara automaticamente segun un modelo de confianza:

- Confianza alta (>= 90): repara sin preguntar
- Confianza media (>= 70): repara y notifica
- Confianza baja (>= 50): sugiere la reparacion
- Confianza minima (< 50): solo reporta

### Evoluciona contigo

Cuando agregas una nueva dependencia (por ejemplo, instalas Prisma), el sistema lo detecta en la siguiente sesion y sugiere agregar el profile correspondiente. Si una dependencia se remueve, sugiere eliminar el profile.

Si aparece una dependencia que no tiene profile (una tecnologia nueva o poco comun), el sistema puede abrir automaticamente un GitHub Issue en el repositorio de diverger-claude solicitando soporte.

### Protege tu CI

El hook pre-commit validator verifica antes de cada commit que:
- El build esta actualizado (version del plugin == version del package)
- No hay errores de TypeScript

Si algo falla, el commit se bloquea con un mensaje claro de que corregir. Esto previene que errores predecibles lleguen a CI.

Ademas, el skill `/diverger-ci-learn` puede analizar logs de CI (GitHub Actions o GitLab CI) y extraer aprendizajes de los fallos, alimentando el mismo pipeline de reglas automaticas.

---

## Roadmap de Adopcion

### Semana 1: Instalacion y exploracion

1. **Instalar** el CLI y el plugin (ver seccion "Como Empezar Hoy")
2. **Inicializar** tu proyecto con `diverger init`
3. **Explorar** la configuracion generada en `.claude/`
4. **Probar** algunos skills: `/diverger-status`, `/diverger-check`
5. **Verificar** que los hooks funcionan: intenta commitear con un error de TypeScript

**Resultado**: Tu proyecto tiene configuracion adaptada y proteccion basica activa.

### Semana 2: Workflows diarios

1. **Usar** `/diverger-pr-review` para revisar PRs
2. **Usar** `/diverger-test-suite` para mejorar cobertura de tests
3. **Ejecutar** `/diverger-audit` en areas criticas del codigo
4. **Sincronizar** con `diverger sync` si cambias dependencias

**Resultado**: Productividad mejorada con workflows estandarizados.

### Semana 3: Skills avanzados y customizacion

1. **Personalizar** reglas en `.claude/rules/` (las `recommended` se pueden adaptar)
2. **Usar** `/diverger-release` para el proximo release
3. **Generar** onboarding docs con `/diverger-onboard` para nuevos devs
4. **Planificar** migraciones con `/diverger-migrate`

**Resultado**: El equipo tiene procesos estandarizados y documentados.

### Mes 2+: Sistema inteligente en accion

1. **Revisar** aprendizajes con `/diverger-learn` — el sistema ya tiene patrones
2. **Verificar** salud con `/diverger-health`
3. **Analizar** evolucion con `/diverger-evolve`
4. **Ingestar** CI errors con `/diverger-ci-learn`
5. Las reglas automaticas en `.claude/rules/learned/` comienzan a prevenir errores recurrentes

**Resultado**: El sistema se ha adaptado a tu proyecto y previene errores de forma proactiva.

---

## Como Empezar Hoy

### Prerequisitos

- Node.js 20+
- Claude Code CLI
- GitHub CLI autenticado (`gh auth login`)

### 3 Comandos

```bash
# 1. Instalar el CLI
npm install -g @divergerthinking/diverger-claude \
  --@divergerthinking:registry=https://npm.pkg.github.com

# 2. Instalar el plugin
diverger plugin install

# 3. Inicializar tu proyecto
cd tu-proyecto && diverger init
```

Listo. Tu proyecto esta configurado.

### Verificar la instalacion

```bash
diverger plugin status    # Ver version y estado del plugin
diverger status           # Ver stack detectado y config
```

### Actualizaciones

```bash
diverger update --check   # Ver si hay nueva version
diverger update --all     # Actualizar CLI + plugin
```

---

## FAQ

**¿Necesito configurar algo manualmente?**
No. `diverger init` detecta todo automaticamente. Solo necesitas confirmar las tecnologias detectadas.

**¿Que pasa si mi proyecto usa una tecnologia que diverger no conoce?**
diverger tiene 59 profiles que cubren los stacks mas comunes. Si detecta una tecnologia sin profile, te lo notifica y puede abrir un Issue automaticamente para solicitar soporte.

**¿Puedo personalizar las reglas generadas?**
Si. Las reglas marcadas como `recommended` se pueden modificar libremente. Las reglas `mandatory` (seguridad, arquitectura) se mantienen por la libreria para garantizar estandares minimos, pero el equipo puede agregar reglas adicionales.

**¿Que pasa cuando hago `diverger sync` y mi equipo modifico archivos?**
El sistema usa three-way merge inteligente. Tus cambios se preservan. Si la libreria agrego una seccion nueva, se agrega sin borrar tus cambios. Si hay conflicto, se te notifica para resolverlo.

**¿Los hooks pueden bloquear mi trabajo?**
Los hooks de proteccion (secret scanner, destructive command blocker, pre-commit validator) estan disenados para prevenir errores costosos. Si un hook bloquea algo, el mensaje explica exactamente que corregir. Los hooks de calidad (long lines, trailing newline) solo advierten, no bloquean.

**¿Se comparte la memoria entre desarrolladores?**
La memoria de errores es local (`.diverger-memory.json` esta en `.gitignore`). Pero las reglas generadas automaticamente (`.claude/rules/learned/`) se commitean y se comparten con todo el equipo.

**¿Cuanto espacio adicional ocupa?**
La configuracion `.claude/` tipica ocupa ~50KB. La memoria local ocupa <500KB incluso con los caps maximos (200 patterns + 500 repairs).

**¿Funciona con proyectos que ya tienen configuracion `.claude/`?**
Si. `diverger init --force` regenera la configuracion integrando lo existente. `diverger sync` usa three-way merge para no perder customizaciones del equipo.

**¿Que pasa si quiero dejar de usar diverger?**
Puedes eyectar con `diverger eject` (o MCP `eject_project`). Toda la configuracion generada se mantiene como archivos locales, sin dependencia del plugin.

**¿Funciona en monorepos?**
Si. diverger detecta automaticamente monorepos (workspaces de npm/yarn/pnpm, Lerna) y genera configuracion adaptada.

---

## Numeros

| Metrica | Valor |
|---------|-------|
| Profiles tecnologicos | 59 |
| Skills de productividad | 18 |
| Agentes especializados | 8 |
| Hooks de proteccion | 7 |
| Herramientas MCP | 14 |
| Health checks | 9 |
| Clasificadores de error | 15 |
| Analizadores de deteccion | 10 |
| Tests automatizados | 1185 |
| Tecnologias soportadas | 50+ |
