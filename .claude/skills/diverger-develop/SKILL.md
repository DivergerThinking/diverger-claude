---
name: diverger-develop
description: "Evaluate and implement triaged contribution plans from partners, with honest feasibility assessment"
disable-model-invocation: true
user-invocable: true
---

# Develop Triaged Contributions

Evalua planes de contribucion triageados, implementa los viables, y notifica a los autores: $ARGUMENTS

## Objetivo

Obtener issues con label `planned` (excluyendo `needs-manual-dev`, `implemented`, `wontfix`, `already-implemented`), evaluar honestamente si tienen sentido dado el proyecto, e implementar los viables via branch + PR. Cada contribucion implementada genera su propia version.

## Pasos

### 1. Verificar prerrequisitos

- `gh auth status` — si falla, informa y termina
- Verificar que estamos en la branch principal y sin cambios pendientes

### 2. Obtener issues elegibles

Si se paso un numero de issue como argumento ($ARGUMENTS), procesar solo esa issue (verificando que tenga label `planned` y no tenga labels excluidos).

Si no hay argumento, obtener issues elegibles de GitHub:
```
gh issue list --label planned --state open --json number,title,labels
```

**Filtrar** excluyendo issues que tengan cualquiera de estos labels:
- `needs-manual-dev`
- `implemented`
- `wontfix`
- `already-implemented`

Para cada issue elegible, verificar que existe su plan en `docs/plans/partners_contributions/issue-{N}-*.md`.
Si una issue tiene label `planned` pero no tiene plan, saltarla con warning.

Si no hay issues elegibles, informar y terminar.

### 3. Procesar issues en bucle

Para cada issue elegible (en orden de numero ascendente), ejecutar los pasos 4-8.
**Tras cada implementacion exitosa**, volver a `main` (`git checkout main && git pull`) antes de continuar con la siguiente.
Si una implementacion falla y no se puede arreglar, descartar la branch, comentar en la issue, y **continuar con la siguiente** issue.

### 4. Para cada plan, evaluar honestamente

**4a. Leer el plan completo**:
- Extraer: numero de issue, autor, clasificacion, complejidad estimada, fases

**4b. Evaluacion de viabilidad** (SER BRUTALMENTE HONESTO):

Responde estas preguntas antes de decidir:
- ¿El plan resuelve un problema real para los usuarios del proyecto?
- ¿Es coherente con la arquitectura existente o la contradice?
- ¿La complejidad estimada es realista?
- ¿Los archivos que propone crear/modificar existen y tienen la estructura esperada?
- ¿Introduce deuda tecnica innecesaria?
- ¿Hay dependencias externas no contempladas?

**4c. Decidir accion**:

| Complejidad | Viable? | Accion |
|-------------|---------|--------|
| Baja/Media | Si | Implementar via branch + PR |
| Baja/Media | No | Rechazar con explicacion honesta en la issue |
| Alta | - | Marcar como `too complex for auto-implementation` |

Si el plan NO tiene sentido, explica POR QUE en un comment en la issue:
- Que parte no cuadra con la arquitectura
- Que alternativa seria mejor
- O por que no es prioritario ahora

### 5. Implementar planes viables

Para cada plan viable (Baja/Media complejidad):

**5a. Crear branch**:
```
git checkout -b feat/issue-{number}-{slug}
```

**5b. Implementar siguiendo el plan**:
- Seguir las fases y pasos del plan al pie de la letra
- Crear los archivos indicados como NUEVO
- Modificar los indicados como MODIFICAR
- Crear los tests especificados
- NO inventar funcionalidad extra que el plan no pide

**5c. Verificar calidad**:
```
npm run typecheck   # 0 errores
npm run test        # todos pasando
npm run build       # build exitoso
npm run build:plugin # plugin actualizado
npm run lint        # 0 errores nuevos
```

Si alguna verificacion falla, arreglar antes de continuar.
Si no se puede arreglar, descartar la branch y explicar en la issue por que no fue posible. Luego **continuar con la siguiente issue**.

**5d. Bump de version**:
- Incrementar minor en `package.json` (ej: 3.4.0 -> 3.5.0)
- Rebuild: `npm run build && npm run build:plugin`
- Leer la version nueva para usarla en el commit y PR

**5e. Commit y push**:
```
git add [archivos relevantes]
git commit -m "feat(scope): descripcion de la feature (closes #N)"
git push origin feat/issue-{number}-{slug}
```

**5f. Crear PR**:
```
gh pr create --title "feat: {titulo}" --body "..."
```

El body del PR debe incluir:
- Summary: que implementa y por que
- Link a la issue: Closes #{number}
- Link al plan: docs/plans/partners_contributions/issue-{N}-{slug}.md
- Test plan
- Version bump incluido

### 6. Merge PR, tag y release

**6a. Merge del PR** (solo si todas las checks pasaron):
```
gh pr merge {pr_number} --squash --delete-branch
```
Usar `--squash` para mantener historial limpio. Si el merge falla (conflictos, checks fallidos), dejar el PR abierto y comentar en la issue explicando el bloqueo.

**6b. Volver a main y pull**:
```
git checkout main && git pull
```

**6c. Crear tag de version**:
```
git tag v{nueva_version}
git push origin v{nueva_version}
```

**6d. Crear GitHub Release**:
```
gh release create v{nueva_version} --title "v{nueva_version}" --notes "..."
```

Las release notes deben incluir:
- Que feature se implemento (una linea)
- Link a la issue: #{number}
- Link al PR: #{pr_number}
- Autor de la solicitud: @{autor}

Esto dispara automaticamente el workflow `release.yml` que publica a GitHub Packages.

### 7. Notificar al autor y cerrar issue

**7a. Comentar en la issue** mencionando al autor:

```
gh issue comment {number} --body "..."
```

**Si se implemento y desplegado**:
> Hey @{autor}, your request has been implemented and released! 🎉
>
> **PR**: #{pr_number} (merged)
> **Release**: v{nueva_version}
>
> [Breve descripcion de lo que se hizo y como probarlo]
>
> You can update now with:
> \`diverger plugin update\`

**Si se rechazo por complejidad alta**:
> Hey @{autor}, thanks for this proposal.
>
> After evaluating the implementation plan, this feature is classified as
> **high complexity** (requires a new subsystem / significant architecture changes).
> It's beyond what can be auto-implemented and needs dedicated development sessions.
>
> [Explicar que se necesita y por que es complejo]
>
> The plan is available at `docs/plans/partners_contributions/issue-{N}-{slug}.md`
> and will be scheduled for manual implementation.

**Si se rechazo por no viable**:
> Hey @{autor}, thanks for the suggestion.
>
> After careful analysis of the codebase, [explicacion honesta de por que no es viable].
>
> [Alternativa si existe]

**7b. Cerrar la issue** (solo si fue implementada y released):
```
gh issue close {number} --reason completed
```
La issue se cierra SOLO despues de que el PR fue mergeado y la release creada.
Si el PR quedo abierto (merge fallido), NO cerrar la issue.

### 8. Actualizar labels de la issue

- Si implementado y released: `gh issue edit {N} --add-label implemented`
- Si rechazado por complejidad: mantener `planned`, anadir `needs-manual-dev`
- Si rechazado por inviable: anadir `wontfix`, explicar en comment

### 9. Continuar con la siguiente issue

- Verificar que estamos en `main` y limpio (`git status`)
- Si quedan mas issues elegibles, volver al paso 4 con la siguiente
- Si no quedan mas, ir al paso 10

### 10. Resumen final

Muestra tabla con TODAS las issues procesadas:

| Plan | Issue | Autor | Complejidad | Resultado | PR | Release |
|------|-------|-------|-------------|-----------|-----|---------|
| issue-8-... | #8 | @alvarogf93 | Baja | Implementado + Released | PR #12 (merged) | v3.6.0 |
| issue-6-... | #6 | @ssoto | Alta | needs-manual-dev | - | - |

## Notas importantes

- **Honestidad ante todo**: si algo no tiene sentido, dilo. Es mejor un "no" honesto que implementar algo roto
- **Usa `gh` CLI** para toda interaccion con GitHub
- **Branch + PR siempre** — nunca implementar directamente en main
- **Una version por contribucion** — trazabilidad issue -> version
- **Merge + Release + Close** — el ciclo completo: PR merge → tag → release → close issue
- **Si el plan tiene errores** (paths incorrectos, tipos que no existen), adapta inteligentemente pero documenta las desviaciones en el PR
- **Filtrado es obligatorio** — NUNCA procesar issues sin label `planned` o con labels excluidos
- **Resiliencia** — si una issue falla, no abortar todo; continuar con la siguiente
- **No cerrar prematuramente** — solo cerrar issues cuando el PR esta mergeado Y la release creada
