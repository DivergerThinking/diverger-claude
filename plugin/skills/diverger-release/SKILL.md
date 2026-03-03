---
name: diverger-release
description: Execute a complete release checklist — tests, changelog, version bump, tag, and publish
user-invocable: true
disable-model-invocation: true
---

# Release Checklist Completo

Ejecuta el proceso de release del proyecto: $ARGUMENTS

## Pasos

1. **Detectar stack y CI**:
   - Llama a `detect_stack` MCP tool
   - Identifica: gestor de paquetes, CI/CD pipeline, strategy de versionado
   - Lee package.json / pyproject.toml / Cargo.toml para version actual

2. **Pre-flight checks**:
   - Verifica que estas en la branch correcta (main/master)
   - Verifica que no hay cambios sin commitear (`git status`)
   - Ejecuta type check (tsc --noEmit / mypy / etc. segun stack)
   - Ejecuta linter
   - Ejecuta test suite completo con cobertura

3. **Validacion de consistencia** (OBLIGATORIO — no continuar si falla):
   - Ejecuta `npm run build` (incluye build:plugin)
   - Verifica que `plugin/.claude-plugin/plugin.json` version == `package.json` version
   - Ejecuta `npm run typecheck` — 0 errores
   - Ejecuta `npm test` con cobertura
   - Si ALGUNO falla → DETENER release y reportar errores
   - **No continuar al paso 4 hasta que todas las validaciones pasen**

4. **Determinar nueva version**:
   - Si $ARGUMENTS incluye version (ej: "v2.0.0"), usa esa
   - Si no, analiza los commits desde el ultimo tag para sugerir:
     - MAJOR: breaking changes (commits con "BREAKING" o "!")
     - MINOR: features (commits con "feat:")
     - PATCH: fixes (commits con "fix:")
   - Presenta sugerencia y pide confirmacion

5. **Actualizar changelog**:
   - Lee commits desde el ultimo tag: `git log $(git describe --tags --abbrev=0)..HEAD --oneline`
   - Agrupa por tipo (Anadido, Cambiado, Corregido, Eliminado)
   - Genera entrada en CHANGELOG.md siguiendo el formato existente
   - Presenta al usuario para revision/edits

6. **Bump de version**:
   - Actualiza version en el archivo de manifiesto (package.json / pyproject.toml / Cargo.toml)
   - Si hay otros archivos con version hardcodeada, actualiza tambien
   - Commit: "release: vX.Y.Z -- <descripcion breve>"

7. **Tag y push**:
   - Crea tag: `git tag vX.Y.Z`
   - Presenta al usuario el resumen de lo que se va a pushear
   - Si confirma: `git push origin <branch> --tags`

8. **Post-release**:
   - Verifica que el CI pipeline se ejecuto correctamente (si hay GitHub Actions: `gh run list --limit 1`)
   - Si hay publish automatico, verifica que el paquete se publico
   - Sugiere crear GitHub Release con `gh release create` si no es automatico
