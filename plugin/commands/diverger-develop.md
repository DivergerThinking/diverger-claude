---
description: "Evaluate and implement triaged contribution plans from partners, with honest feasibility assessment"
---

# Develop Triaged Contributions

Evalua planes de contribucion triageados, implementa los viables, y notifica a los autores: $ARGUMENTS

## Objetivo

Leer los planes de \`docs/plans/partners_contributions/\`, evaluar honestamente si tienen sentido dado el proyecto, e implementar los viables via branch + PR. Cada contribucion implementada genera su propia version.

## Pasos

### 1. Verificar prerrequisitos

- \`gh auth status\` — si falla, informa y termina
- Verificar que estamos en la branch principal y sin cambios pendientes
- Listar archivos en \`docs/plans/partners_contributions/\`
- Si se paso un nombre de archivo como argumento ($ARGUMENTS), filtrar solo ese plan
- Si no hay planes, informar y terminar

### 2. Para cada plan, evaluar honestamente

**2a. Leer el plan completo**:
- Extraer: numero de issue, autor, clasificacion, complejidad estimada, fases

**2b. Evaluacion de viabilidad** (SER BRUTALMENTE HONESTO):

Responde estas preguntas antes de decidir:
- ¿El plan resuelve un problema real para los usuarios del proyecto?
- ¿Es coherente con la arquitectura existente o la contradice?
- ¿La complejidad estimada es realista?
- ¿Los archivos que propone crear/modificar existen y tienen la estructura esperada?
- ¿Introduce deuda tecnica innecesaria?
- ¿Hay dependencias externas no contempladas?

**2c. Decidir accion**:

| Complejidad | Viable? | Accion |
|-------------|---------|--------|
| Baja/Media | Si | Implementar via branch + PR |
| Baja/Media | No | Rechazar con explicacion honesta en la issue |
| Alta | - | Marcar como \`too complex for auto-implementation\` |

Si el plan NO tiene sentido, explica POR QUE en un comment en la issue:
- Que parte no cuadra con la arquitectura
- Que alternativa seria mejor
- O por que no es prioritario ahora

### 3. Implementar planes viables

Para cada plan viable (Baja/Media complejidad):

**3a. Crear branch**:
\`\`\`
git checkout -b feat/issue-{number}-{slug}
\`\`\`

**3b. Implementar siguiendo el plan**:
- Seguir las fases y pasos del plan al pie de la letra
- Crear los archivos indicados como NUEVO
- Modificar los indicados como MODIFICAR
- Crear los tests especificados
- NO inventar funcionalidad extra que el plan no pide

**3c. Verificar calidad**:
\`\`\`
npm run typecheck   # 0 errores
npm run test        # todos pasando
npm run build       # build exitoso
npm run build:plugin # plugin actualizado
npm run lint        # 0 errores nuevos
\`\`\`

Si alguna verificacion falla, arreglar antes de continuar.
Si no se puede arreglar, descartar la branch y explicar en la issue por que no fue posible.

**3d. Bump de version**:
- Incrementar minor en \`package.json\` (ej: 3.4.0 -> 3.5.0)
- Rebuild: \`npm run build && npm run build:plugin\`
- Leer la version nueva para usarla en el commit y PR

**3e. Commit y push**:
\`\`\`
git add [archivos relevantes]
git commit -m "feat(scope): descripcion de la feature (closes #N)"
git push origin feat/issue-{number}-{slug}
\`\`\`

**3f. Crear PR**:
\`\`\`
gh pr create --title "feat: {titulo}" --body "..."
\`\`\`

El body del PR debe incluir:
- Summary: que implementa y por que
- Link a la issue: Closes #{number}
- Link al plan: docs/plans/partners_contributions/issue-{N}-{slug}.md
- Test plan
- Version bump incluido

### 4. Notificar al autor en la issue

Publica un comment en la issue mencionando al autor:

\`\`\`
gh issue comment {number} --body "..."
\`\`\`

**Si se implemento**:
> Hey @{autor}, we've implemented your request! 🎉
>
> **PR**: #{pr_number}
> **Version**: This will be included in v{nueva_version}
>
> [Breve descripcion de lo que se hizo y como probarlo]
>
> The PR is ready for review. Once merged and released, you can update with:
> \\\`diverger plugin update\\\`

**Si se rechazo por complejidad alta**:
> Hey @{autor}, thanks for this proposal.
>
> After evaluating the implementation plan, this feature is classified as
> **high complexity** (requires a new subsystem / significant architecture changes).
> It's beyond what can be auto-implemented and needs dedicated development sessions.
>
> [Explicar que se necesita y por que es complejo]
>
> The plan is available at \`docs/plans/partners_contributions/issue-{N}-{slug}.md\`
> and will be scheduled for manual implementation.

**Si se rechazo por no viable**:
> Hey @{autor}, thanks for the suggestion.
>
> After careful analysis of the codebase, [explicacion honesta de por que no es viable].
>
> [Alternativa si existe]

### 5. Actualizar labels de la issue

- Si implementado: \`gh issue edit {N} --add-label implemented\`
- Si rechazado por complejidad: mantener \`planned\`, anadir \`needs-manual-dev\`
- Si rechazado por inviable: anadir \`wontfix\`, explicar en comment

### 6. Limpiar

- Volver a la branch principal: \`git checkout main\`
- NO eliminar la branch (se borra al mergear el PR)

### 7. Resumen final

Muestra tabla:

| Plan | Issue | Autor | Complejidad | Resultado | PR/Version |
|------|-------|-------|-------------|-----------|------------|
| issue-6-... | #6 | @ssoto | Alta | Descartado (complejidad) | - |

## Notas importantes

- **Honestidad ante todo**: si algo no tiene sentido, dilo. Es mejor un "no" honesto que implementar algo roto
- **Usa \`gh\` CLI** para toda interaccion con GitHub
- **Branch + PR siempre** — nunca implementar directamente en main
- **Una version por contribucion** — trazabilidad issue -> version
- **No cierres issues** — solo comenta y pon labels. El merge del PR cierra la issue via "Closes #N"
- **Si el plan tiene errores** (paths incorrectos, tipos que no existen), adapta inteligentemente pero documenta las desviaciones en el PR
