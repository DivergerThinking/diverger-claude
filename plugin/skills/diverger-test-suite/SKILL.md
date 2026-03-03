---
name: diverger-test-suite
description: Analyze test coverage gaps and generate comprehensive tests adapted to the project's stack
user-invocable: true
disable-model-invocation: true
---

# Generacion de Test Suite Completa

Analiza la cobertura de tests y genera tests faltantes: $ARGUMENTS

## Pasos

1. **Detectar stack**: Llama a `detect_stack` MCP tool. Identifica el framework de testing (vitest/jest/pytest/junit/go test/cargo test).

2. **Analizar cobertura actual**:
   - Ejecuta los tests con flag de cobertura
   - Identifica archivos y funciones sin cobertura o con cobertura baja (<80%)
   - Lista las funciones/metodos mas criticos sin tests (prioriza por complejidad y uso)

3. **Examinar patrones de testing existentes**:
   - Lee 2-3 archivos de test existentes del proyecto
   - Identifica: estilo de assertions, uso de mocks/stubs, organizacion (describe/it vs flat), fixtures, setup/teardown
   - Sigue exactamente el mismo estilo para tests nuevos

4. **Generar tests priorizados**:
   - Para cada archivo/funcion sin cobertura (ordenado por criticidad):
     - Genera unit tests siguiendo el patron del proyecto
     - Incluye: happy path, edge cases, error handling, boundary values
     - Usa la estrategia de mocking del proyecto (no inventa nuevas)
   - Si $ARGUMENTS especifica archivos concretos, enfocate en esos

5. **Ejecutar y validar**:
   - Ejecuta todos los tests nuevos
   - Si alguno falla, diagnostica y corrige
   - Re-ejecuta hasta que todos pasen
   - Muestra la nueva cobertura comparada con la anterior

6. **Reportar**:
   - Resumen: X tests anadidos, cobertura paso de Y% a Z%
   - Lista de archivos con tests nuevos
   - Gaps de cobertura restantes (si los hay) con explicacion
