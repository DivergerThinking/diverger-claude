# Agent Teams - Equipos de Agentes (Experimental)
> Referencia oficial: https://code.claude.com/docs/en/agent-teams
> Ultima actualizacion: 2026-03-03

## Estado

**Experimental** - Deshabilitado por defecto. Esta funcionalidad esta en desarrollo activo y puede cambiar sin previo aviso.

## Habilitacion

Para habilitar Agent Teams, configurar la variable de entorno o la opcion en settings:

```bash
# Variable de entorno
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

```json
// En settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## Arquitectura

Agent Teams permite coordinar multiples instancias de Claude trabajando en paralelo sobre un mismo proyecto.

| Componente | Descripcion |
|---|---|
| **Team Lead** | La sesion principal que coordina el equipo |
| **Teammates** | Instancias de Claude spawneadas que trabajan en paralelo |
| **Shared Task List** | Lista compartida de tareas con estado y dependencias |
| **Mailbox** | Sistema de mensajeria entre lead y teammates |

### Almacenamiento

| Recurso | Ubicacion |
|---|---|
| Configuracion del equipo | `~/.claude/teams/{team-name}/config.json` |
| Tareas | `~/.claude/tasks/{team-name}/` |

## Sub-Agentes vs Agent Teams

| Caracteristica | Sub-Agentes | Agent Teams |
|---|---|---|
| Contexto | Ventana propia, sin historial del padre | Ventana propia, sin historial del lead |
| Modelo | Configurable por agente | Hereda del lead |
| Herramientas | Configurable por agente | Hereda del lead |
| Comunicacion | Sin comunicacion entre si | Mailbox + broadcast |
| Tareas | Una tarea por sub-agente | Lista de tareas compartida |
| Archivos | Mismo arbol de trabajo | Mismo arbol de trabajo |
| Permisos | Configurables individualmente | Heredan del lead |
| Persistencia | Transcript por agente | Transcript por teammate |

## Modos de Visualizacion

| Modo | Descripcion | Requisitos |
|---|---|---|
| **in-process** | Ver output de teammates con Shift+Down | Ninguno |
| **split panes** | Paneles separados por teammate | tmux o iTerm2 |
| **auto** | Detecta automaticamente el mejor modo | - |

## Gestion de Tareas

Cada tarea tiene un ciclo de vida definido:

| Estado | Descripcion |
|---|---|
| `pending` | Tarea creada, esperando asignacion |
| `in_progress` | Teammate trabajando en la tarea |
| `completed` | Tarea finalizada exitosamente |

Las tareas soportan:
- **Dependencias**: Una tarea puede depender de la completitud de otras.
- **File locking**: Los teammates pueden bloquear archivos para evitar conflictos de escritura concurrente.

## Comunicacion

| Metodo | Destinatario | Descripcion |
|---|---|---|
| `message` | Un teammate | Envia un mensaje a un teammate especifico |
| `broadcast` | Todos | Envia un mensaje a todos los teammates |

- Los mensajes se entregan **automaticamente** cuando el teammate esta disponible.
- Cuando un teammate esta **idle** (sin tareas pendientes), recibe una notificacion.

## Permisos

- Los teammates **heredan** los permisos del lead.
- **No es posible** configurar permisos individuales por teammate al momento del spawn.
- El modo de permisos del lead aplica a todo el equipo.

## Contexto de los Teammates

Al iniciar, cada teammate carga:
- Archivos `CLAUDE.md` del proyecto (misma jerarquia que el lead).
- Servidores MCP configurados.
- Skills disponibles.
- El **prompt de spawn** especifico de la tarea asignada.

**Importante**: Los teammates **NO** reciben el historial de conversacion del lead.

## Hooks para Agent Teams

| Evento | Descripcion | Bloqueable |
|---|---|---|
| `TeammateIdle` | Un teammate termino sus tareas y esta idle | Si |
| `TaskCompleted` | Una tarea fue marcada como completada | Si (exit 2 bloquea) |

Cuando un hook de `TaskCompleted` retorna exit code 2, la tarea se bloquea y no se marca como completada.

## Aprobacion de Plan

- Antes de ejecutar, el lead genera un plan en **modo solo lectura**.
- El usuario debe **aprobar** el plan antes de que el equipo comience a trabajar.
- Esto permite revisar la distribucion de tareas y la estrategia antes de la ejecucion.

## Shutdown y Limpieza

1. El lead envia una senal de **shutdown** a todos los teammates.
2. Un teammate puede **rechazar** el shutdown si tiene trabajo critico en progreso.
3. La limpieza de recursos siempre se realiza **a traves del lead**.
4. Los transcripts de cada teammate se persisten para auditoria.

## Mejores Practicas

- **Tamano del equipo**: 3-5 teammates es el rango optimo. Mas teammates incrementan la complejidad de coordinacion.
- **Tareas por teammate**: Apuntar a 5-6 tareas por teammate para mantener foco.
- **Evitar conflictos de archivo**: Distribuir el trabajo para que los teammates no editen los mismos archivos simultaneamente.
- **Empezar con investigacion**: Asignar tareas de investigacion (lectura) primero, luego tareas de modificacion.
- **Usar dependencias**: Definir dependencias entre tareas para garantizar el orden correcto de ejecucion.

## Limitaciones Conocidas

- **Sin reanudacion de sesion**: Si la sesion del lead se cierra, el equipo no puede reanudarse.
- **Lag en estado de tareas**: El estado de las tareas puede tener un retraso breve en la actualizacion.
- **Un equipo por sesion**: Solo se puede tener un equipo activo por sesion de Claude Code.
- **Sin equipos anidados**: Un teammate no puede crear su propio equipo.
- **Split panes requieren tmux**: La visualizacion en paneles separados necesita tmux o iTerm2 instalado.
