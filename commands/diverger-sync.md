# /diverger-sync

Re-analiza el proyecto y actualiza la configuración `.claude/` existente usando three-way merge.

## Uso
```
/diverger-sync [--force]
```

## Comportamiento
1. Re-detecta el stack tecnológico
2. Genera nueva configuración basada en el stack actual
3. Aplica three-way merge:
   - Si solo la librería cambió → auto-apply
   - Si solo el equipo cambió → keep
   - Si ambos cambiaron → merge inteligente o conflicto
4. Actualiza `.diverger-meta.json` con nuevos hashes
