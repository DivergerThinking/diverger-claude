# /diverger-check

Valida la configuración `.claude/` existente contra las reglas de gobernanza.

## Uso
```
/diverger-check
```

## Comportamiento
1. Verifica que `.claude/CLAUDE.md` y `settings.json` existen
2. Valida que las reglas obligatorias (mandatory) no han sido modificadas
3. Verifica la integridad de archivos vs hashes en `.diverger-meta.json`
4. Reporta warnings y errores
