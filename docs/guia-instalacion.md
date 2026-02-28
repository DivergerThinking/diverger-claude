# Guía de Instalación

## Requisitos

- Node.js >= 20
- npm >= 9
- Claude Code instalado (para usar la configuración generada)

## Instalación como dependencia de desarrollo

```bash
npm install @anthropic-internal/diverger-claude --save-dev
```

## Uso con npx (sin instalar)

```bash
npx @anthropic-internal/diverger-claude init
```

## Configuración de API Key

Para la funcionalidad de búsqueda de best practices actualizadas, configura tu API key corporativa:

```bash
# Via variable de entorno (recomendado)
export ANTHROPIC_API_KEY="tu-key-corporativa"

# O via configuración
npx diverger-claude config set api-key tu-key-corporativa
```

## Primer uso

1. Navega al directorio de tu proyecto
2. Ejecuta `npx diverger-claude diff` para ver qué se generaría
3. Revisa los cambios propuestos
4. Ejecuta `npx diverger-claude init` para aplicar

## Plugin de Claude Code

diverger-claude también funciona como plugin de Claude Code. Al instalarlo como dependencia, los comandos `/diverger-init`, `/diverger-sync`, `/diverger-check` y `/diverger-status` estarán disponibles dentro de Claude Code.

## Actualización

```bash
npm update @anthropic-internal/diverger-claude
npx diverger-claude sync
```

El comando `sync` aplica three-way merge para actualizar tu configuración respetando los cambios que tu equipo haya hecho.
