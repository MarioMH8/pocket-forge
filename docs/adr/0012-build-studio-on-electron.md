# Build Pocket Forge Studio on Electron with Bun as the toolchain

Pocket Forge Studio is the desktop authoring app for maps, events, and encounters. It lives in `apps/studio` as
`@pocket-forge/studio`, uses Electron as its native shell, and is bundled with `electron-vite` and packaged with
`electron-builder` for macOS and Windows on a single stable release channel. The renderer is React 19 with Radix UI
and Tailwind CSS 4, and reaches privileged APIs only through a `contextBridge` preload boundary. Electron's bundled
Node runtime executes the app; Bun stays a toolchain (package manager, script runner, test runner) and no Bun-specific
API is allowed in shipped code. The Studio consumes domain packages as workspace dependencies through the
`development` export condition, so authoring always runs against the same domain code as the tests.

## Considered Options

- **Tauri v2** — rejected. Its system WebView renders differently per OS and performs worse than Chromium for dense
  editor UI, and a Rust shell adds a second language to a TypeScript codebase without removing domain logic from
  TypeScript. OpenCode Desktop reached the same conclusion after migrating from Tauri to Electron; see
  [the OpenCode Desktop research note](../research/opencode-desktop-stack.md).
- **Browser-only editor** — rejected. Editing a project directory needs unrestricted filesystem access, native
  dialogs, and asset watching. A browser build would require a local daemon or the File System Access API, adding
  deployment and platform variance for no authoring benefit.
- **Bun as shipped runtime** — rejected for now. Running the engine in a Bun sidecar process reintroduces process
  lifecycle, IPC, and packaging complexity. It remains the escape hatch if the Studio ever needs Bun-only APIs such
  as `bun:sqlite`; adopting one would require a new ADR.

## Consequences

- Installers carry Chromium and Node, so they are large (~100 MB) and memory-hungry compared with a system-WebView app.
- Distribution requires macOS notarization, Windows code signing, and auto-update infrastructure.
- Native dependencies must be rebuilt against Electron's ABI even though Bun installs them.
- Linux support and additional release channels are deferred to a later release ADR.
- OpenCode Desktop is the reference for packaging and process layout, not for libraries: no `effect/rpc` and no
  embedded HTTP server in the main process.
