# Stack de OpenCode Desktop

> Investigación de fuentes primarias, consultada el 2026-11-16 sobre el commit
> [`7745079`](https://github.com/anomalyco/opencode/tree/7745079647b65036fe142e09ccd8623b25be1878)
> de `anomalyco/opencode` (antes `sst/opencode`).

## Conclusión

OpenCode Desktop es una app **Electron**. Bun aparece en el proyecto como **toolchain** —instalación, scripts de
build, tests— pero **no se embarca como runtime**: el código de la aplicación se ejecuta en el Node integrado de
Electron. La migración desde Tauri está documentada por el propio equipo y responde a dos problemas concretos:
inconsistencias del WebView del sistema y la dificultad de mantener el CLI/servidor como proceso aparte.

Para Pocket Forge la referencia útil es la forma —`electron-vite` + `electron-builder` + frontera `preload`—, no las
librerías internas ni el framework de UI. La decisión está registrada en
[ADR-0012](../adr/0012-build-studio-on-electron.md).

## Stack observado

Fuente: [`packages/desktop/package.json`](https://github.com/anomalyco/opencode/blob/7745079647b65036fe142e09ccd8623b25be1878/packages/desktop/package.json).

| Pieza | Tecnología |
| --- | --- |
| Shell nativo | Electron `44.9.1` |
| Bundling | `electron-vite` `6.0.0-beta.1` sobre Vite `8.2.4` (Rolldown) |
| Empaquetado | `electron-builder` `26.15.7` (DMG, NSIS, AppImage, deb, rpm) |
| Renderer | SolidJS + `@solidjs/router`, compartido con `@opencode/app` y `@opencode/ui` |
| IPC renderer↔main | `effect/rpc` sobre canales de Electron, expuesto con `contextBridge` |
| Persistencia | `drizzle-orm` + `drizzle-kit` (SQLite) |
| Terminal | `@lydell/node-pty` (paquetes opcionales por plataforma) |
| Diagnóstico | `@sentry/solid` |
| Actualizaciones | `electron-updater` |

Los scripts se ejecutan con Bun directamente:

```json
{
  "dev": "bun run script/dev.ts",
  "build": "bun run script/build.ts",
  "pack": "bun run script/pack.ts",
  "test": "bun test --timeout 30000",
  "typecheck": "bun check --no-script -b"
}
```

El README se instalaba con `bun install` y arrancaba con `bun dev`
([`README.md`](https://github.com/anomalyco/opencode/blob/7745079647b65036fe142e09ccd8623b25be1878/packages/desktop/README.md)).

## Qué hace Bun y qué no

- **Sí**: gestor de paquetes, ejecutor de scripts TypeScript (`bun run script/*.ts`), test runner (`bun test`) y
  typecheck (`bun check`).
- **No**: runtime de la app. No hay `bun:sqlite`, `Bun.file` ni `Bun.serve` en el binario distribuido. El servidor
  corre en el proceso Node de Electron.
- El CLI se sigue empaquetando **fuera de `app.asar`**, en el directorio de recursos de la aplicación, y el
  empaquetado falla si falta. Es un binario auxiliar, no el runtime del renderer.

## Por qué abandonaron Tauri

El equipo publicó el razonamiento en
[Moving OpenCode Desktop to Electron](https://dev.to/brendonovich/moving-opencode-desktop-to-electron-4hip):

1. **WebView del sistema.** Tauri usa WebKit en macOS y Linux, con peor rendimiento y diferencias de estilos frente a
   Chromium. En una UI densa eso se traduce en una experiencia distinta por plataforma.
2. **Ejecutar el CLI aparte.** El sidecar penalizaba el arranque y fallaba ocasionalmente en Windows. Al eliminar las
   APIs específicas de Bun del servidor, pudieron ejecutarlo dentro del proceso Node de Electron y dejar de gestionar
   un proceso externo.

La migración no fue un juicio sobre Tauri en general: el propio autor lo recomienda para apps con UI sencilla o
cómputo nativo en Rust. OpenCode es TypeScript de punta a punta, así que Rust no movía ninguna lógica de dominio.

## Límites observados

- **Plugins con APIs de Bun**: dejan de funcionar en las versiones nuevas de Desktop. Está declarado como consecuencia
  de mover el servidor a Node.
- **Módulos nativos**: `@lydell/node-pty` se publica por plataforma y arquitectura, y se externaliza del bundle. Es
  coste real aunque se instale con Bun.
- **Tamaño**: Electron arrastra Chromium y Node; el equipo lo acepta explícitamente como trade-off.

## Implicación para Pocket Forge

Adoptar el empaquetado y la frontera `preload`/`contextBridge`, y descartar `effect/rpc`, Drizzle y el servidor
embebido en el proceso main: el dominio de Pocket Forge ya vive en paquetes TypeScript reutilizables y no necesita un
RPC intermedio. Bun queda como herramienta de desarrollo y, si hiciera falta, como origen de binarios compilados para
el CLI de validación.
