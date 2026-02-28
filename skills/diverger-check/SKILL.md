# diverger-check

Valida la integridad de la configuración `.claude/` del proyecto.

## Instrucciones

Ejecuta `npx diverger-claude check` en el directorio del proyecto para:
1. Verificar que los archivos de configuración existen
2. Validar que las reglas obligatorias no han sido modificadas
3. Comprobar la integridad de los hashes en `.diverger-meta.json`
4. Reportar problemas encontrados
