# Best Practices - Mejores Prácticas Oficiales
> Referencia oficial: https://code.claude.com/docs/en/best-practices
> Última actualización: 2026-02-28

## Principios Clave

1. **Dar a Claude métodos de verificación** -- tests, screenshots, outputs esperados. Es la acción de mayor impacto.
2. **Explorar primero, luego planificar, luego codificar** -- Usar Plan Mode (`Ctrl+G` para toggle). Separar investigación de implementación.
3. **Proporcionar contexto específico** -- Referenciar archivos con `@`, pegar imágenes, dar URLs, pipear datos.
4. **Gestionar contexto agresivamente** -- `/clear` entre tareas no relacionadas. El contexto es el recurso más importante.
5. **Usar subagentes para investigación** -- Se ejecutan en ventanas de contexto separadas y devuelven resúmenes.
6. **Corregir el rumbo temprano** -- `Esc` para parar, `Esc+Esc` o `/rewind` para restaurar, `/clear` para resetear.

## Mejores Prácticas para CLAUDE.md

- Ejecutar `/init` para generar un archivo inicial, luego refinar.
- Mantenerlo conciso. Para cada línea preguntar: "¿Eliminar esto causaría que Claude cometa errores?"
- Incluir: comandos bash que Claude no puede adivinar, estilo de código diferente a defaults, instrucciones de testing, etiqueta del repo.
- Excluir: cosas que Claude puede deducir del código, convenciones estándar del lenguaje, explicaciones largas.
- Usar énfasis ("IMPORTANT", "YOU MUST") para mejorar adherencia.
- Hacer check-in en git para compartir con el equipo.

## Patrones de Escalado

- **Modo no interactivo**: `claude -p "prompt"` para CI, scripts, automatización.
- **Fan-out**: Loop a través de archivos llamando `claude -p` para cada uno. Usar `--allowedTools` para acotar.
- **Patrón Writer/Reviewer**: Una sesión escribe código, otra revisa con contexto limpio.
- **Equipos de agentes**: Coordinar múltiples sesiones con tareas compartidas y mensajería.

## Anti-Patrones Comunes

- **Sesión kitchen sink**: Mezclar tareas no relacionadas. Fix: `/clear` entre tareas.
- **Corregir repetidamente**: Contexto contaminado. Fix: Después de 2 correcciones fallidas, `/clear` + mejor prompt.
- **CLAUDE.md sobre-especificado**: Demasiado largo, instrucciones se pierden. Fix: Podar sin piedad.
- **Brecha trust-then-verify**: Sin verificación. Fix: Siempre proporcionar tests/scripts/screenshots.
- **Exploración infinita**: Investigación sin límite. Fix: Acotar narrowly o usar subagentes.
