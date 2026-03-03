# LSP - Language Server Protocol
> Referencia oficial: https://code.claude.com/docs/en/lsp
> Ultima actualizacion: 2026-03-03

## Vision General

La integracion LSP proporciona inteligencia de codigo en tiempo real a Claude Code. A traves del protocolo Language Server Protocol, Claude obtiene diagnosticos automaticos, navegacion a definiciones, busqueda de referencias e informacion de hover, mejorando significativamente la precision de las ediciones de codigo.

## Configuracion

Los servidores LSP se configuran a traves de plugins de Claude Code, usando uno de dos formatos:

### Archivo `.lsp.json` en la raiz del plugin

```json
{
  "command": "gopls",
  "args": ["serve"],
  "transport": "stdio",
  "extensionToLanguage": {
    ".go": "go"
  }
}
```

### Definicion inline en `plugin.json`

```json
{
  "name": "my-lsp-plugin",
  "lsp": {
    "command": "typescript-language-server",
    "args": ["--stdio"],
    "transport": "stdio",
    "extensionToLanguage": {
      ".ts": "typescript",
      ".tsx": "typescriptreact"
    }
  }
}
```

## Schema de Configuracion

| Campo | Requerido | Tipo | Default | Descripcion |
|---|---|---|---|---|
| `command` | Si | string | - | Ejecutable del servidor LSP |
| `extensionToLanguage` | Si | objeto | - | Mapa de extension de archivo a ID de lenguaje |
| `args` | No | lista | `[]` | Argumentos para el comando |
| `transport` | No | enum | `"stdio"` | `"stdio"` o `"socket"` |
| `env` | No | objeto | `{}` | Variables de entorno adicionales |
| `initializationOptions` | No | objeto | `{}` | Opciones enviadas al servidor durante `initialize` |
| `settings` | No | objeto | `{}` | Configuracion del workspace enviada al servidor |
| `workspaceFolder` | No | string | cwd | Directorio raiz del workspace |
| `startupTimeout` | No | number | 30000 | Timeout de inicio en milisegundos |
| `shutdownTimeout` | No | number | 5000 | Timeout de apagado en milisegundos |
| `restartOnCrash` | No | boolean | `true` | Reiniciar automaticamente si el servidor crashea |
| `maxRestarts` | No | number | 3 | Maximo de reinicios antes de desistir |

## Ejemplos de Configuracion

### Go (gopls)

```json
{
  "command": "gopls",
  "args": ["serve"],
  "transport": "stdio",
  "extensionToLanguage": {
    ".go": "go"
  },
  "settings": {
    "gopls": {
      "analyses": { "unusedparams": true },
      "staticcheck": true
    }
  }
}
```

### TypeScript (typescript-language-server)

```json
{
  "command": "typescript-language-server",
  "args": ["--stdio"],
  "transport": "stdio",
  "extensionToLanguage": {
    ".ts": "typescript",
    ".tsx": "typescriptreact",
    ".js": "javascript",
    ".jsx": "javascriptreact"
  }
}
```

### Python (pyright)

```json
{
  "command": "pyright-langserver",
  "args": ["--stdio"],
  "transport": "stdio",
  "extensionToLanguage": {
    ".py": "python"
  },
  "settings": {
    "python": {
      "analysis": {
        "typeCheckingMode": "basic"
      }
    }
  }
}
```

## Plugins LSP Oficiales

Claude Code proporciona plugins oficiales para 11 lenguajes:

| Plugin | Lenguaje | Servidor LSP |
|---|---|---|
| `clangd-lsp` | C/C++ | clangd |
| `csharp-lsp` | C# | OmniSharp |
| `gopls-lsp` | Go | gopls |
| `jdtls-lsp` | Java | Eclipse JDT.LS |
| `kotlin-lsp` | Kotlin | kotlin-language-server |
| `lua-lsp` | Lua | lua-language-server |
| `php-lsp` | PHP | phpactor |
| `pyright-lsp` | Python | pyright |
| `rust-analyzer-lsp` | Rust | rust-analyzer |
| `swift-lsp` | Swift | sourcekit-lsp |
| `typescript-lsp` | TypeScript/JavaScript | typescript-language-server |

## Que Gana Claude con LSP

Cuando un servidor LSP esta activo, Claude obtiene automaticamente:

- **Diagnosticos automaticos**: Despues de cada edicion de archivo, Claude recibe errores y warnings del compilador/linter sin necesidad de ejecutar comandos.
- **Navegacion de codigo**: Go-to-definition y find-references permiten a Claude entender relaciones entre simbolos en el codebase.
- **Informacion de hover**: Tipos, firmas y documentacion inline de funciones y variables.

## Ciclo de Vida

1. **Inicio**: El servidor LSP se inicia junto con el plugin que lo define.
2. **Transporte**: La comunicacion se realiza via `stdio` (stdin/stdout) o `socket` (TCP).
3. **Recuperacion de crashes**: Si `restartOnCrash` esta habilitado (default), el servidor se reinicia automaticamente hasta `maxRestarts` veces.
4. **Apagado**: Al terminar la sesion de Claude Code, se envia una solicitud de shutdown al servidor con el timeout configurado.

## Restricciones

- El **binario del servidor LSP debe estar instalado** por separado en el sistema. Los plugins solo configuran la conexion, no instalan el servidor.
- Los plugins **solo configuran** la conexion al servidor LSP; no modifican su comportamiento interno.
- Cada plugin LSP maneja **un servidor** por instancia.

## Resolucion de Problemas

### Ejecutable no encontrado en $PATH

```
Error: spawn <command> ENOENT
```

El binario del servidor LSP no esta instalado o no esta en el PATH. Instalar el servidor correspondiente:
- Go: `go install golang.org/x/tools/gopls@latest`
- TypeScript: `npm install -g typescript-language-server typescript`
- Python: `pip install pyright` o `npm install -g pyright`
- Rust: Instalado con `rustup component add rust-analyzer`

### Alto consumo de memoria

Algunos servidores LSP pueden consumir memoria significativa en proyectos grandes. Opciones:
- Configurar `settings` para deshabilitar analisis costosos.
- Reducir el alcance del workspace con `workspaceFolder`.
- Ajustar `maxRestarts` a un valor menor para evitar reinicios continuos.
