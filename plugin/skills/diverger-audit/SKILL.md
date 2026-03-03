---
name: diverger-audit
description: Full project audit — code quality, security, testing coverage, and configuration health
user-invocable: true
disable-model-invocation: true
---

# Auditoria Completa del Proyecto

Ejecuta una auditoria exhaustiva del proyecto actual: $ARGUMENTS

## Pasos

1. **Detectar stack**: Llama a `detect_stack` MCP tool. Guarda las tecnologias detectadas.

2. **Auditoria de seguridad**:
   - Ejecuta el audit de dependencias del proyecto (npm audit / pip-audit / cargo audit / go vuln check segun stack)
   - Usa el subagente `security-checker` para revisar el codigo fuente buscando: inyecciones, secretos hardcodeados, permisos inseguros, dependencias vulnerables
   - Documenta cada hallazgo con severidad (critical/high/medium/low)

3. **Auditoria de calidad de codigo**:
   - Ejecuta el linter del proyecto si existe (eslint / ruff / golangci-lint / clippy segun stack)
   - Usa el subagente `code-reviewer` para revisar: complejidad ciclomatica, duplicacion, naming, errores de tipo, dead code
   - Si hay TypeScript, ejecuta `tsc --noEmit` para verificar tipos

4. **Auditoria de testing**:
   - Ejecuta los tests con cobertura (--coverage flag segun test runner)
   - Identifica archivos/funciones sin cobertura
   - Evalua calidad de tests: Prueban edge cases? Hay tests fragiles? Usan mocks excesivos?

5. **Auditoria de configuracion**:
   - Llama a `check_config` MCP tool para validar .claude/
   - Llama a `check_plugin_health` MCP tool para validar el plugin
   - Revisa .gitignore, .env.example, CI pipeline

6. **Consultar memoria del proyecto**:
   - Llama a `get_memory` MCP tool con section "all"
   - Incluye patrones de error recurrentes en el reporte
   - Incluye anti-patterns conocidos como advertencias

7. **Generar reporte**:
   - Crea `.claude/audit-report.md` con:
     - Resumen ejecutivo (score global, issues por severidad)
     - Tabla de hallazgos (severidad, archivo, linea, descripcion, remediacion)
     - Metricas de cobertura
     - Patrones de error recurrentes del proyecto
     - Recomendaciones priorizadas
   - Presenta el resumen al usuario

8. **Registrar aprendizajes**:
   - Si la auditoria descubrio anti-patterns nuevos, usa `record_learning` MCP tool para registrarlos
