---
description: "Comprehensive pull request review with stack-adapted checklist"
---

# Review Exhaustivo de Pull Request

Revisa el PR indicado con una checklist adaptada al stack del proyecto: $ARGUMENTS

## Pasos

1. **Obtener contexto del PR**:
   - Si $ARGUMENTS es un numero, ejecuta `gh pr view $ARGUMENTS --json title,body,files,additions,deletions,commits`
   - Si $ARGUMENTS esta vacio, ejecuta `gh pr view --json ...` para el PR de la branch actual
   - Lee el diff completo: `gh pr diff`

2. **Detectar stack**: Llama a `detect_stack` MCP tool para adaptar los criterios de review.

3. **Consultar memoria**:
   - Llama a `get_memory` MCP tool para obtener anti-patterns del proyecto
   - Incluye estos anti-patterns como criterios adicionales de review

4. **Review de calidad**:
   - El codigo sigue las convenciones del proyecto? (naming, estructura, patterns)
   - Hay duplicacion con codigo existente?
   - Se han anadido o actualizado tests para los cambios?
   - El commit message es descriptivo?
   - Se han actualizado types/interfaces si hay cambios de API?

5. **Review de seguridad**:
   - Hay secretos o credenciales hardcodeados?
   - Los inputs del usuario se validan/sanitizan?
   - Hay SQL injection, XSS, path traversal, o SSRF posibles?
   - Se usan las APIs de auth correctamente?

6. **Review especifico del stack**:
   - **TypeScript**: Hay `any` innecesarios? Types correctos?
   - **React/Next.js**: Hooks con deps correctas? Server vs client correcto?
   - **Python**: Type hints? Manejo de excepciones?
   - **Go**: Error handling idiomatic? Context propagation?
   - (Claude adapta segun lo que detecto detect_stack)

7. **Generar review**:
   - Presenta hallazgos organizados por categoria: Critical, Major, Minor, Nit
   - Para cada hallazgo: archivo, linea, descripcion, sugerencia de fix
   - Veredicto final: Approve / Request Changes / Comment
   - Si el usuario lo pide, postea el review como comentario: `gh pr review --body "..."`
