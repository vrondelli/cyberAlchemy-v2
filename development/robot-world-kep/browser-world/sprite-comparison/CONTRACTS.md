# Implementation contracts for Luna

These are planning contracts for the separate comparison app. P00 materializes the local prototype definitions and records any necessary clarification before P01. Open questions: [register](OPEN-QUESTIONS.md).

## C1 — Directory and source ownership

```text
sprite-comparison/
  [this planning package]
  design/
    definitions.md
    source-map.json
    prototype-mapping.md
    implementation-contract.md
  app/
    package.json, package-lock.json, tsconfig.json, vite.config.ts, index.html
    README.md, .gitignore
    src/
      main.tsx, App.tsx, style.css, env.d.ts
      session.ts, playback.ts
      world/
        types.ts, createSpriteWorld.ts, ColonyScene.ts, SpriteBenchScene.ts, LoadScene.ts
        projection.ts, camera.ts, animation.ts, diagnostics.ts
      sprites/
        atlas.ts
      art/
        layout.ts, colonyAtlas.ts
      ui/
        CrewPanel.tsx, ReplayBar.tsx, WorldPanel.tsx, SpritePortrait.tsx
    public/
      session/session.json, session/session-manifest.json
      assets/robots/v1/source.png, atlas.png, atlas.json, provenance.json
      assets/colony/v1/tiles.png, props.png, atlas.json, provenance.json
    tests/
      session.test.ts, projection.test.ts, animation.test.ts, atlas.test.ts
  runs/<run-id>/
    receipts/, checks/, environment.json, status.json
  checkpoints/G01/<revision>/
  checkpoints/G02/<revision>/
```

Only the selected packet can create its named future paths. Plans are not empty implementation placeholders. No new scripts or general frameworks are needed unless a packet explicitly identifies their purpose.

The new app's dependency tree and dist output are shared resources. The coordinator serializes installs/builds even if a future approved fan-out lets scene and UI source work run together. No concurrent worker may rebuild or clean the same output directory.

Copy these five files byte-for-byte into the new app: `../app/src/session.ts`, `../app/src/playback.ts`, `../app/public/session/session.json`, `../app/public/session/session-manifest.json`, and `../app/tests/session.test.ts` (two modules, two inputs and one test). Keep their same relative layout. Do not loosen validation or rewrite the fixture to fit the scene.

The copied modules import only each other; they do not need Babylon or React. The original React app is an interaction reference, not a file to copy unchanged: it creates a Babylon canvas, exports different camera semantics and contains Babylon-specific error text.

The parent app, B1 manifest, Unity assets, user PNG and canonical/private runtime definitions are read-only inputs. Do not use symlinks or shared output directories that allow writes to leak back into them.

## C2 — Package contract

P01 creates a new private ESM package, named `robot-world-sprite-comparison`, version `0.1.0`.

Runtime pins: `phaser@3.90.0`, `react@19.2.8`, `react-dom@19.2.8`.
Development pins: `@types/react@19.2.18`, `@types/react-dom@19.2.7`, `tsx@4.23.13`, `typescript@7.0.2`, `vite@8.2.2`.

Use the current app's TypeScript/Vite settings as a bounded starting point, changing only the new app's paths and port. Keep strict TypeScript. Phaser supplies its types; do not install an unrelated `@types/phaser` package.

Required scripts:

```json
{
  "dev": "vite --host 127.0.0.1 --port 16341 --strictPort",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview --host 127.0.0.1 --port 16341 --strictPort",
  "test": "tsx --test tests/*.test.ts"
}
```

16341 is a proposed port, not a verified currently free port. O01/O02 may select 16342 if necessary, record it once, and update only the new app/config/run instructions. Never stop an unrelated listener.

Generate a real lockfile through package installation. Keep the new app free of Babylon dependencies and GLB imports. Use the installed Phaser 3.90.0 type declarations to verify APIs before coding; current web examples may target Phaser 4.

## C3 — Renderer interface

The UI owns one Playback instance and the selected robot ID. The renderer owns one Phaser.Game, scene objects, asset loads, camera and input listeners.

```ts
type RobotId = 'explorer' | 'builder';
type ViewMode = 'bench' | 'colony' | 'load';
type Point = Readonly<{ x: number; y: number }>;

interface SpriteWorldOptions {
  host: HTMLElement;
  playback: Playback;
  mode: ViewMode;
  signal: AbortSignal;
  onSelect: (id: RobotId | null) => void;
  onProgress: (message: string) => void;
  onError: (message: string) => void;
}
interface SpriteWorldHandle {
  select(id: RobotId | null): void;
  focus(id: RobotId): void;
  reset(): void;
  zoom(step: -1 | 1): void; // +1 zooms in, -1 zooms out
  resize(width: number, height: number): void;
  diagnostics(): Readonly<SpriteDiagnostics>;
  dispose(): Promise<void>;
}
declare function createSpriteWorld(
  options: SpriteWorldOptions
): Promise<SpriteWorldHandle>;
```

P00 writes the exact diagnostics shape into `design/implementation-contract.md`; P03 implements it in `world/types.ts`. Required fields: build/session identity; backend/version; mode; actual canvas/CSS/DPR sizes; camera center/zoom; selected ID; cursor/index/tick/revision; source/visual robot positions and chosen atlas frames; texture/object/active-game counts; visible real-agent count and separate synthetic count; frame samples including long-stall counts; load/disposal state.

Expose a read-only `window.__robotWorldSprites` getter for QA. Do not expose mutating simulation commands or add another WebMCP integration in this comparison.

Create Phaser in a host div using its own canvas. Do not mount Phaser over the old Babylon canvas. Return the handle only when assets, frame registration, scene and input are ready. Reject on load failure. Abort before readiness must clean up and must never publish a late successful handle.

Dispose idempotently. Wait for actual engine destruction before replacement; Phaser destruction may be deferred to its loop. Remove ResizeObserver, visibility/keyboard listeners, pointer handlers, event subscriptions, callbacks and diagnostics getter. Context loss or a failed required texture produces a visible React error and a retry that preserves playback cursor and selection. Ensure one active game after retry, zero after final unmount.

## C4 — Coordinates, camera and selection

World bounds are 1280×768 world pixels. Nominal tiles are 32×32. Active colony framing rectangle is (128,64) to (1152,704). The world has a fixed near-frontal camera and no orbit or rotation.

Map source coordinates using:

```ts
worldX = 640 + 80 * sourceX;
worldY = 384 - 48 * sourceY;
```

The loader permits [-5,5] on each axis, which maps inside world bounds. The observed fixture uses x in [-3,3], y in [0,1]. Do not clamp or alter the source to clear scenery; move scenery instead. Anchor each robot at its feet.

A default camera centers on (640,384) and fits the active rectangle with zoom capped at 1 and a provisional lower bound of 0.75 at the required desktop viewports. Report actual on-screen robot height; do not claim a minimum if the measured host requires a smaller fit. Zoom bounds are 0.75–2 initially, with defined steps. G01 may select revised values on evidence.

Project input through the actual camera inverse. Pan begins after at least six CSS pixels of pointer travel; dragging pans the camera and never commands robots. Release after a pan must not select a robot. Handle pointercancel. Wheel zoom is scoped to the world; UI controls and sidebar scrolling must retain normal behavior.

Use foot y plus a stable ID tie-breaker for actor depth. Keep body hit areas practical and crew buttons available for keyboard selection. When hit areas overlap, resolve to the visually topmost valid sprite with a deterministic tie-breaker. Focus/zoom/selection do not alter the fixture or cursor.

React's selected ID is authoritative for selection. Renderer pointer input calls onSelect; UI state updates the renderer once. Selection must not create a callback loop. Hidden labels cannot intercept input.

## C5 — Timing and animation

Only the active world scene advances Playback, once per render update. Use a raw elapsed-time source consistently; do not feed both React requestAnimationFrame and Phaser updates into the same controller. Do not silently use a clamped/smoothed engine delta as if it were the old controller's timing behavior.

Playback time is `(cursor.index + playback.fraction) * playback.frameSeconds`. The inherited frameSeconds is 0.65. Speed is already included by Playback.update; do not multiply it a second time.

For the recorded world, derive visual atlas frame from this presentation time and motion state. A pure helper chooses idle/walk frame, facing and nominal size. Avoid independent animation timers that continue while scrubbing or paused. The bench can have a separately labeled animation-preview clock, without advancing the recording.

- Moving: choose the walk loop and horizontal facing from the current segment.
- No horizontal movement: use a deterministic facing derived from source segments, not prior UI interaction history.
- Paused, final or just scrubbed: draw a stable pose and exact source position.
- Scrub/backward seek: reset phase deterministically.
- Hidden page: pause playback; on return do not catch up hidden elapsed time or auto-resume.
- Reduced motion: keep recorded positions truthful, disable decorative/idle cycles and animated focus effects.

The supplied sheet lacks a complete walking direction set. Use front/side approximation for depth movement and state that limitation; do not fabricate a back view or 8-direction support.

Idle/walk are presentation states. Activation/shutdown are bench previews only until actual source semantics exist. Energy thresholds must not invent shutdown events. Shooting frames are unused; this colony does not need combat.

## C6 — Scene facts and visual load

The exact recorded world renders only Explorer/Alice and Builder/Bob. Crew and counters derive from the selected frame, never hard-coded placeholders. Both tick-80 revisions remain independently selectable.

Three architectural stand-ins may visualize construction count by appearing at three predefined slots: show `min(frame.built, 3)` completed structures and unbuilt plots for the rest. These are display proxies, not inferred source construction IDs or capability types. Show the original recorded count even if a future count exceeds the three visible slots. Ancillary paths/docks/plants are decorative.

The optional `?view=load&count=200` route uses a separate visual workload with deterministic movement, no inference, no session mutation, and a prominent “Rendering test — synthetic sprites” banner. Allow only 50, 200 and 500 via a closed enum. Do not expose them as real agents in the crew or record their motion into the fixture. The two real-agent journey stays on `?view=colony`.

No pathfinding, physics bodies, boids or collision response are required to replay the existing source. Those systems would change scope and can conceal an incorrect mapping.

## C7 — UI boundary

Keep React for top bar, crew list, inspector, replay controls, errors and accessibility. Use sprite portraits from the prepared atlas. Reuse the original labels/interaction semantics where still accurate, replacing orbit/3D hints with pan/2D hints.

Required behavior: native timeline, speed 0.5/1/2, replay/restart, stable source values, selection from crew and world, focus/reset/zoom, loading/progress/error/retry, no selection, keyboard 1/2/Space/R/Escape without hijacking editing controls.

Only selection/hover needs a world label. The crew remains always accessible. Do not add marketplace controls, inference forms, account panels or nonfunctional navigation.

References for implementation mechanisms, not proof of this app: [Phaser sprites](https://docs.phaser.io/phaser/concepts/gameobjects/sprite), [game lifecycle](https://docs.phaser.io/phaser/concepts/game), [scene lifecycle](https://docs.phaser.io/phaser/concepts/scenes).
