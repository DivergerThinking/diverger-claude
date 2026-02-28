# /diverger-init

Detecta el stack tecnológico del proyecto actual y genera una configuración `.claude/` completa y adaptada.

## Uso
```
/diverger-init [--force] [--dry-run]
```

## Opciones
- `--force`: Sobrescribir archivos existentes sin preguntar
- `--dry-run`: Mostrar qué se generaría sin escribir archivos

## Comportamiento
1. Escanea el proyecto buscando archivos de manifiesto (package.json, pyproject.toml, etc.)
2. Analiza dependencias y detecta tecnologías con nivel de confianza
3. Si la confianza es < 90%, pregunta al desarrollador
4. Compone perfiles por capas (base → lenguaje → framework → testing → infra)
5. Genera `.claude/` con CLAUDE.md, settings.json, rules, agents, skills, hooks
6. Opcionalmente genera/alinea configs externas (ESLint, Prettier, tsconfig)
