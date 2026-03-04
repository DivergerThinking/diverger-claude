---
name: diverger-triage
description: "Triage open GitHub issues: classify, evaluate, and generate implementation plans"
disable-model-invocation: true
user-invocable: true
---

# Triage de Issues de GitHub

Evalua todas las issues abiertas del proyecto y genera planes de implementacion: $ARGUMENTS

## Pasos

1. **Listar issues abiertas**:
   - Ejecuta: \`gh issue list --state open --json number,title,body,author,labels,createdAt,comments\`
   - Si no hay issues abiertas, informa al usuario y termina
   - Muestra resumen: N issues abiertas con numero y titulo

2. **Para cada issue, clasificar**:
   - Lee titulo y body completo con \`gh issue view {number}\`
   - Clasifica en una de estas categorias:
     - **feature-request**: Nueva funcionalidad solicitada
     - **bug**: Error o comportamiento inesperado reportado
     - **profile-request**: Soporte para nueva tecnologia/framework/CI
     - **question**: Pregunta sobre uso o documentacion
     - **already-implemented**: La funcionalidad ya existe en el sistema
     - **duplicate**: Duplicado de otra issue abierta
   - Para clasificar \`already-implemented\`: busca en el codebase si la funcionalidad
     descrita ya existe (busca en src/profiles/registry/, src/generation/, CHANGELOG.md)
   - Para clasificar \`duplicate\`: compara contra otras issues abiertas

3. **Issues ya implementadas** (\`already-implemented\`):
   - Anade comment con \`gh issue comment {number}\` explicando que existe,
     con referencias a archivos, profiles o versiones relevantes
   - Anade label \`already-implemented\`
   - Sugiere cerrar la issue

4. **Issues de tipo question**:
   - Responde con referencia a documentacion existente (docs/guia-*.md, README.md)
   - Anade label \`question\` si no la tiene

5. **Issues accionables** (\`feature-request\`, \`bug\`, \`profile-request\`):
   - Llama a \`detect_stack\` MCP tool para conocer el stack del proyecto
   - Llama a \`get_memory\` MCP tool con section "all" para contexto
   - Analiza el codebase para entender el estado actual relevante a la issue
   - Genera un plan detallado en \`docs/plans/issue-{number}-{slug}.md\` con esta estructura:
     * **Contexto**: issue link, autor, fecha, labels, descripcion resumida
     * **Analisis del estado actual**: que existe hoy relacionado con la peticion
     * **Plan de implementacion**: pasos numerados con archivos concretos a crear/modificar
     * **Archivos a modificar**: tabla con archivo, accion (NUEVO/MODIFICAR), descripcion
     * **Tests**: que tests unitarios/integracion crear
     * **Verificacion**: pasos para validar (typecheck, test, build)
     * **Complejidad estimada**: Baja/Media/Alta con justificacion
   - El plan debe ser lo suficientemente detallado para que otra sesion de Claude
     pueda ejecutarlo sin ambiguedad
   - Anade comment en la issue con link al plan generado
   - Anade label \`planned\`

6. **Resumen final**:
   - Muestra tabla con cada issue procesada: numero, titulo, clasificacion, accion tomada
   - Destaca issues con plan generado

7. **Registrar en memoria**:
   - Llama a \`record_learning\` MCP tool con tipo \`best-practice\`
     documentando el triage realizado (fecha, issues procesadas, planes generados)

## Notas importantes
- Usa \`gh\` CLI para toda interaccion con GitHub (issues, labels, comments)
- No cierres issues automaticamente — solo sugiere cerrar con comment
- Los planes en docs/plans/ deben usar el formato: \`issue-{number}-{slug}.md\`
  donde slug es el titulo en kebab-case (max 40 chars)
- Si \`gh\` no esta disponible o no esta autenticado, informa al usuario y termina
