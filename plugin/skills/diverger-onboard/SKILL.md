---
name: diverger-onboard
description: Generate comprehensive onboarding documentation for new developers joining the project
user-invocable: true
disable-model-invocation: true
---

# Onboarding para Nuevos Desarrolladores

Genera documentacion de onboarding completa para este proyecto: $ARGUMENTS

## Pasos

1. **Detectar stack y arquitectura**:
   - Llama a `detect_stack` MCP tool
   - Identifica: lenguajes, frameworks, test runners, CI/CD, infra
   - Detecta patron arquitectonico (monolith, microservices, serverless, etc.)

2. **Mapear la estructura del proyecto**:
   - Lista los directorios principales y su proposito
   - Identifica los entry points (main, index, server, app)
   - Encuentra los archivos de configuracion clave
   - Detecta monorepo structure si existe

3. **Documentar flujos clave**:
   - Traza 3-5 flujos de negocio principales leyendo el codigo
   - Para cada flujo: entry point -> procesamiento -> output/side-effects
   - Incluye diagrama de secuencia en texto (mermaid o ASCII)

4. **Documentar setup local**:
   - Requisitos: versiones de runtime, herramientas externas
   - Pasos de instalacion (lee package.json scripts, Makefile, docker-compose)
   - Variables de entorno necesarias (busca .env.example, dotenv usage)
   - Como ejecutar tests, lint, build

5. **Documentar convenciones**:
   - Lee CLAUDE.md y .claude/rules/ para extraer convenciones del equipo
   - Naming conventions, branching strategy, commit format
   - Patrones de codigo preferidos (functional vs OOP, error handling, etc.)

6. **Consultar memoria del proyecto**:
   - Llama a `get_memory` MCP tool
   - Incluye errores comunes y anti-patterns conocidos como "Gotchas"

7. **Generar documentacion**:
   - Crea `ONBOARDING.md` en la raiz del proyecto con:
     - Vision general del proyecto (1 parrafo)
     - Stack tecnologico (tabla)
     - Arquitectura (diagrama + explicacion)
     - Setup local (paso a paso)
     - Flujos de negocio principales
     - Convenciones del equipo
     - Gotchas y errores comunes (de la memoria)
     - Recursos utiles (links a docs, skills disponibles)
