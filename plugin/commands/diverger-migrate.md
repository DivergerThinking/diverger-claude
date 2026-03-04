---
description: "Plan and execute technology migration with step-by-step guidance adapted to your stack"
---

# Migracion Tecnologica Guiada

Planifica y ejecuta una migracion tecnologica: $ARGUMENTS

## Pasos

1. **Detectar estado actual**:
   - Llama a `detect_stack` MCP tool
   - Identifica versiones actuales de todas las tecnologias
   - Lee archivos de configuracion relevantes

2. **Identificar migracion**:
   - Si $ARGUMENTS especifica el target (ej: "React 19", "Next.js 15", "Python 3.12"):
     - Investiga los breaking changes entre version actual y target
     - Usa web search si necesitas documentacion actualizada de la migracion
   - Si $ARGUMENTS es generico (ej: "actualizar todo"):
     - Lista todas las dependencias con versiones outdated
     - Prioriza por impacto y riesgo

3. **Crear plan de migracion**:
   - Lista todos los cambios necesarios en orden de ejecucion
   - Para cada cambio: archivo, que cambiar, por que, riesgo (high/medium/low)
   - Identifica dependencias entre cambios (que debe ir primero)
   - Estima scope (cuantos archivos, cuantos patterns a cambiar)

4. **Presentar plan al usuario**:
   - Muestra el plan completo y pide confirmacion antes de ejecutar
   - Ofrece opciones: ejecutar todo, ejecutar por fases, solo dry-run

5. **Ejecutar migracion** (si confirmado):
   - Para cada paso del plan:
     - Aplica los cambios
     - Ejecuta tests para verificar que no se rompio nada
     - Si falla, diagnostica y corrige antes de continuar
   - Usa git commits incrementales (un commit por paso logico)

6. **Verificacion final**:
   - Ejecuta el test suite completo
   - Ejecuta type check (si aplica)
   - Ejecuta linter
   - Compara comportamiento antes/despues

7. **Registrar en memoria**:
   - Usa `record_learning` MCP tool para registrar:
     - Anti-patterns de la version anterior
     - Best practices de la version nueva
   - Sugiere ejecutar `/diverger-sync` para actualizar la configuracion .claude/
