---
name: diverger-ci-learn
description: Analyze recent CI failures and learn from error patterns
user-invocable: true
disable-model-invocation: true
---

# Aprender de Errores de CI

Analiza los ultimos fallos de CI y extrae aprendizajes: $ARGUMENTS

## Pasos

1. **Detectar CI provider**:
   - Busca `.github/workflows/` -> GitHub Actions
   - Busca `.gitlab-ci.yml` -> GitLab CI

2. **Obtener fallos recientes**:
   - GitHub Actions: `gh run list --status=failure --limit=5 --json databaseId,displayTitle,conclusion,createdAt`
   - Para cada run fallido: `gh run view {id} --log-failed`

3. **Procesar con MCP tool**:
   - Llama a `ingest_ci_errors` con el log de cada run
   - Acumula resultados

4. **Analizar patrones**:
   - Hay errores recurrentes? (mismo patron en multiples runs)
   - Son prevenibles? (build stale, lint, types)
   - Requieren nueva regla? (>= 3 ocurrencias)

5. **Reportar**:
   - Resumen de errores procesados
   - Patrones descubiertos con frecuencia
   - Reglas auto-generadas (si threshold alcanzado)
   - Recomendaciones para prevencion
