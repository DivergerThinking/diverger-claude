---
name: diverger-triage
description: "Triage open GitHub issues: analyze codebase, respond intelligently, generate local implementation plans"
disable-model-invocation: true
user-invocable: true
---

# Triage de Issues de GitHub

Analiza issues abiertas, responde con conocimiento del codebase y genera planes locales accionables: $ARGUMENTS

## Objetivo

Convertir cada issue abierta en una **respuesta inteligente** (comment en GitHub) + un **plan local accionable** (archivo en \`docs/plans/partners_contributions/\`). El plan debe ser lo suficientemente detallado para que otra sesion de Claude lo ejecute sin ambiguedad.

## Pasos

### 1. Verificar prerrequisitos

- Ejecuta: \`gh auth status\` — si falla, informa al usuario y termina
- Verifica que existe directorio \`docs/plans/partners_contributions/\` — si no, crealo

### 2. Listar issues abiertas

- Ejecuta: \`gh issue list --state open --json number,title,body,author,labels,createdAt,comments\`
- Si se paso un numero de issue como argumento ($ARGUMENTS), filtra solo esa issue
- Si no hay issues abiertas, informa al usuario y termina
- Muestra resumen: N issues abiertas con numero y titulo

### 3. Para cada issue, analizar en profundidad

**3a. Leer la issue completa:**
- \`gh issue view {number} --json number,title,body,author,labels,comments\`
- Identifica: que pide exactamente, que contexto da, que preguntas hace

**3b. Clasificar:**
- **feature-request**: Nueva funcionalidad o extension de arquitectura
- **bug**: Error o comportamiento inesperado
- **profile-request**: Soporte para nueva tecnologia/framework
- **question**: Pregunta sobre uso o documentacion
- **already-implemented**: La funcionalidad ya existe (verificar buscando en el codebase)
- **duplicate**: Duplicado de otra issue abierta (comparar con las demas)

**3c. Investigar el codebase:**
- Busca archivos, modulos y tests relevantes a lo que pide la issue
- Entiende la arquitectura actual relacionada con la peticion
- Identifica que existe hoy, que falta, y que habria que cambiar
- Si es \`already-implemented\`: localiza exactamente donde esta implementado

### 4. Responder en la issue (comment inteligente)

El comment debe demostrar que **entendemos el codebase y la peticion**:

- NUNCA uses respuestas genericas tipo "un mantenedor lo revisara"
- Siempre referencia archivos reales del codebase (paths relativos)
- Si la issue hace preguntas, responde CADA una
- Si clasificas como \`already-implemented\`, da instrucciones exactas de uso
- Incluye: saludo contextual, respuesta a preguntas, estado actual de la arquitectura,
  propuesta o siguiente paso
- Ejecuta: \`gh issue comment {number} --body "..."\`

### 5. Generar plan local (para issues accionables)

Solo para issues clasificadas como \`feature-request\`, \`bug\`, o \`profile-request\`.

Crea archivo: \`docs/plans/partners_contributions/issue-{number}-{slug}.md\`
donde slug = titulo en kebab-case (max 40 chars)

El plan debe incluir:
- **Tabla de contexto**: issue link, autor, fecha, labels, clasificacion
- **Resumen de la peticion**: 2-3 frases
- **Analisis del estado actual**: archivos, modulos, tipos relevantes con paths concretos
- **Plan de implementacion**: fases con tabla de archivos a crear/modificar
- **Tests**: que tests crear y que validan
- **Verificacion**: pasos para validar (typecheck, test, build)
- **Complejidad estimada**: Baja/Media/Alta con justificacion

### 6. Actualizar labels

- Si clasificaste como \`already-implemented\`: anade label, sugiere cerrar con comment
- Si generaste plan: anade label \`planned\`
- Ejecuta: \`gh issue edit {number} --add-label {label}\`

### 7. Resumen final

Muestra tabla con cada issue procesada: numero, titulo, clasificacion, plan generado, accion tomada

## Notas importantes
- Usa \`gh\` CLI para toda interaccion con GitHub
- **No cierres issues automaticamente** — solo sugiere cerrar con comment
- Los planes van en \`docs/plans/partners_contributions/\` (NO en docs/plans/ raiz)
- Invierte tiempo en investigar el codebase ANTES de responder
- Si no puedes acceder al repo con \`gh\`, informa y termina
