# diverger-sync

Re-analiza el proyecto y sincroniza la configuración `.claude/` con los cambios detectados.

## Instrucciones

Ejecuta `npx diverger-claude sync` en el directorio del proyecto para:
1. Re-detectar el stack tecnológico
2. Comparar con la configuración actual
3. Aplicar cambios usando three-way merge
4. Actualizar `.diverger-meta.json`

Si hay conflictos, muestra las diferencias al desarrollador para que decida.
