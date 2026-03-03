# Guía de Instalación

## Requisitos previos

| Requisito | Versión mínima | Verificar con |
|-----------|---------------|---------------|
| Node.js | >= 20 | `node --version` |
| npm | >= 9 | `npm --version` |
| Git | cualquiera | `git --version` |
| Claude Code | última | `claude --version` |

> **Nota:** Claude Code es necesario para utilizar la configuración `.claude/` que genera esta herramienta. Si aún no lo tienes, instálalo siguiendo la [guía oficial de Anthropic](https://docs.anthropic.com/en/docs/claude-code).

---

## Configuración de acceso al paquete privado

Este paquete se distribuye como paquete privado de npm a través de **GitHub Packages**, bajo el scope `@divergerthinking`. Para poder descargarlo necesitas autenticarte con un Personal Access Token (PAT) de GitHub.

### 1. Crear el token en GitHub

1. Accede a [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Haz clic en **"Generate new token"** > **"Generate new token (classic)"**
3. Asigna un nombre descriptivo (ej: `diverger-claude-registry`)
4. Selecciona **únicamente** el permiso `read:packages`
5. Establece una expiración adecuada (recomendado: 90 días)
6. Haz clic en **"Generate token"** y **copia el token inmediatamente** — no podrás verlo de nuevo

### 2. Configurar `.npmrc`

El archivo `.npmrc` le indica a npm dónde buscar paquetes del scope `@divergerthinking` y con qué credenciales autenticarse.

**Localiza tu directorio HOME** y crea (o edita) el archivo `~/.npmrc`:

```bash
# En Linux/macOS:
~/.npmrc

# En Windows:
C:\Users\TU_USUARIO\.npmrc
```

Añade estas dos líneas, reemplazando `TU_TOKEN_AQUI` por el token que copiaste:

```ini
@divergerthinking:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=TU_TOKEN_AQUI
```

| Línea | Qué hace |
|-------|----------|
| `@divergerthinking:registry=...` | Redirige todas las instalaciones de `@divergerthinking/*` a GitHub Packages en lugar de npmjs.com |
| `//npm.pkg.github.com/:_authToken=...` | Autentica las peticiones al registry de GitHub Packages con tu PAT |

**Verifica que la configuración es correcta:**

```bash
npm config get @divergerthinking:registry
# Debe mostrar: https://npm.pkg.github.com
```

> **Importante — Seguridad del token:**
> - Usa **siempre** el `~/.npmrc` global (directorio HOME del usuario), **nunca** el `.npmrc` dentro de un proyecto.
> - Si accidentalmente subes un token a un repositorio, revócalo inmediatamente desde GitHub y genera uno nuevo.
> - Añade `.npmrc` al `.gitignore` de tus proyectos como precaución adicional.

---

## Instalación

### Opción A: Instalación global (recomendado para uso personal)

Instala el paquete de forma global para tener `diverger` disponible como comando en cualquier terminal:

```bash
npm install -g @divergerthinking/diverger-claude
```

Tras la instalación, puedes usar `diverger` o `diverger-claude` desde cualquier directorio:

```bash
cd ~/cualquier-proyecto
diverger init
diverger status
```

Para actualizar a futuras versiones:

```bash
npm update -g @divergerthinking/diverger-claude
```

### Opción B: Como dependencia de desarrollo (recomendado para equipos)

Instala el paquete en tu proyecto para que todo el equipo use la misma versión:

```bash
npm install @divergerthinking/diverger-claude --save-dev
```

Tras la instalación, el CLI estará disponible como `npx diverger-claude` o `npx diverger` dentro del proyecto.

### Opción C: Ejecución directa con npx (sin instalar)

Si prefieres no instalar nada, puedes ejecutarlo directamente:

```bash
npx @divergerthinking/diverger-claude init
```

npm descargará el paquete temporalmente, lo ejecutará y luego lo descartará.

> **¿Cuándo usar cada opción?**
> - **Opción A** para uso personal: `diverger` queda disponible globalmente en tu máquina.
> - **Opción B** para equipos: todos los miembros y CI/CD usan la misma versión fijada en `package.json`.
> - **Opción C** para probar la herramienta rápidamente sin instalar nada.

---

## Configuración de API Key

La funcionalidad de búsqueda de best practices actualizadas utiliza la API de Claude con web search. Para habilitarla, configura la API key corporativa de Anthropic:

```bash
# Linux/macOS — añadir al shell profile (~/.bashrc, ~/.zshrc, etc.)
export ANTHROPIC_API_KEY="tu-key-corporativa"

# Windows PowerShell — variable de entorno persistente
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "tu-key-corporativa", "User")

# Windows CMD — variable de entorno persistente
setx ANTHROPIC_API_KEY "tu-key-corporativa"
```

Verifica que está configurada:

```bash
# Linux/macOS
echo $ANTHROPIC_API_KEY

# Windows PowerShell
$env:ANTHROPIC_API_KEY
```

> **Nota:** Esta API key es **independiente** del token de GitHub Packages. El token de GitHub sirve para descargar el paquete; la API key de Anthropic sirve para consultar best practices en tiempo real.

---

## Primer uso

Una vez instalado y configurado, sigue estos pasos para generar la configuración `.claude/` de tu proyecto:

```bash
# 1. Navega al directorio raíz de tu proyecto
cd /ruta/a/tu/proyecto

# 2. Vista previa: revisa qué archivos se generarían (sin escribir nada)
npx diverger-claude diff

# 3. Revisa la salida y confirma que el stack detectado es correcto

# 4. Genera la configuración
npx diverger-claude init
```

El comando `init` hará lo siguiente:
1. **Detectar** el stack tecnológico escaneando manifiestos (`package.json`, `pyproject.toml`, `go.mod`, etc.)
2. **Componer** los profiles aplicables (base + lenguaje + framework + testing + infra)
3. **Generar** los archivos de configuración dentro de `.claude/`
4. **Consultar** (si hay API key) best practices actualizadas para tu stack

---

## Plugin de Claude Code (recomendado)

diverger-claude funciona como **plugin de Claude Code**, proporcionando agentes, skills, hooks y un servidor MCP universales directamente dentro de Claude Code.

### Requisito: GitHub CLI autenticado

El plugin se distribuye como release en un repo privado de GitHub. Para que `diverger plugin install` pueda descargarlo, necesitas tener el GitHub CLI (`gh`) autenticado:

```bash
# Verificar si ya estás autenticado
gh auth status

# Si no, iniciar sesión
gh auth login
```

Alternativamente, puedes configurar la variable de entorno `GITHUB_TOKEN` con un PAT que tenga permiso `read:packages`.

### Instalar el plugin

```bash
diverger plugin install
```

Esto descarga la última versión del plugin desde GitHub Releases y lo instala en `~/.claude/plugins/diverger-claude/`.

### Post-instalación

Tras instalar el plugin, el CLI ofrece automáticamente inicializar la configuración y limpiar duplicados. También puedes hacerlo manualmente:

```bash
diverger init --force    # Regenera config en modo plugin (solo tech-specific)
diverger cleanup         # Elimina componentes duplicados de .claude/
```

### Gestión del plugin

```bash
diverger plugin status      # Ver estado, versión, sincronización con CLI
diverger plugin install     # Actualizar a la última versión
diverger plugin uninstall   # Desinstalar el plugin
```

### Skills disponibles en Claude Code

Con el plugin instalado, estos comandos están disponibles dentro de una sesión de Claude Code:

| Comando | Descripción |
|---------|-------------|
| `/diverger-init` | Genera la configuración `.claude/` inicial |
| `/diverger-sync` | Sincroniza con actualizaciones de profiles (three-way merge) |
| `/diverger-check` | Valida que la configuración existente es coherente con el stack |
| `/diverger-status` | Muestra el stack detectado y los profiles aplicados |

> Ver [guía del plugin](guia-plugin.md) para documentación completa o [migración CLI a plugin](migracion-cli-a-plugin.md) si ya tenías proyectos configurados.

---

## Versión y actualización

### Ver la versión instalada

```bash
diverger --version
```

### Verificar si hay actualización disponible

```bash
diverger update --check
```

### Actualizar a la última versión

```bash
# Forma recomendada (detecta automáticamente si es global o local):
diverger update

# Alternativamente, con npm directamente:
# Si instalaste globalmente (Opción A):
npm update -g @divergerthinking/diverger-claude

# Si instalaste como dependencia (Opción B):
npm update @divergerthinking/diverger-claude
```

### Después de actualizar

```bash
# Actualizar CLI + plugin en un solo comando
diverger update --all

# O por separado
diverger update            # Solo CLI (ejecuta cleanup auto si plugin instalado)
diverger plugin install    # Solo plugin

# Sincroniza la configuración .claude/ de tus proyectos con los nuevos profiles
diverger sync
```

El comando `sync` aplica un **three-way merge** para actualizar tu configuración respetando los cambios que tu equipo haya hecho manualmente. El `update` ejecuta `cleanup` automáticamente si el plugin está instalado.

---

## Telemetría local (opt-in)

diverger-claude incluye un sistema de telemetría **local** para diagnosticar problemas. Los datos se almacenan solo en tu máquina y nunca se envían a ningún servidor.

```bash
# Activar telemetría (opt-in)
diverger telemetry enable

# O via variable de entorno (persistente)
export DIVERGER_TELEMETRY=1        # Linux/macOS
$env:DIVERGER_TELEMETRY = "1"      # Windows PowerShell

# Ver eventos registrados
diverger telemetry show

# Desactivar
diverger telemetry disable

# Limpiar datos
diverger telemetry clear
```

Los datos se almacenan en `~/.diverger/telemetry.json` con un máximo de 1000 eventos (rolling window).

---

## Solución de problemas

### Error `401 Unauthorized` al instalar

Tu token de GitHub no es válido o ha expirado. Genera uno nuevo y actualiza `~/.npmrc`.

### Error `404 Not Found` al instalar

Verifica que el scope está correctamente configurado en `~/.npmrc`:
```bash
npm config get @divergerthinking:registry
# Debe mostrar: https://npm.pkg.github.com
```

### El comando `diverger-claude` no se encuentra

Si instalaste como dependencia de desarrollo, usa `npx diverger-claude` en lugar de `diverger-claude` directamente. Alternativamente, verifica que `node_modules/.bin` está en tu PATH.

### La búsqueda de best practices no funciona

Verifica que `ANTHROPIC_API_KEY` está configurada y es válida:
```bash
echo $ANTHROPIC_API_KEY  # debe mostrar tu key
```
