# Code Pattern Inventory — The Must in the Ticket

Status: candidate inventory  
Authority effect: none  
Scope: reusable implementation patterns only. This inventory does not define
business meaning, accept policy, admit a UI profile, or authorize release.

## Reuse posture

`internal-reuse` means the pattern is already present in this package and can
be extracted behind a stable interface. `port-pattern` means the external
source is useful as a structural witness, but its implementation language or
runtime does not fit the browser directly. `direct-dependency` means a package
may be installed after the normal dependency and license review. `study-only`
means do not copy code, assets, prose, or interface material.

## Package-owned patterns

| ID | Pattern | Current source | Stable boundary | Reuse posture |
|---|---|---|---|---|
| `CP-CORE-IMMUTABLE-STATE` | Pure state transition functions return a new game state | `web/game-logic.mjs` (`createGameState`, `moveToRoom`, `solve`, `update`) | `state -> action -> state` | `internal-reuse` |
| `CP-CORE-CONTENT-DATA` | Rooms, stations, items, puzzles, and endings are data-driven | `content/game-content.json`, `runtime-model.js` | content model consumed by reducer and renderers | `internal-reuse` |
| `CP-CORE-PREREQUISITE-GUARD` | Shared prerequisite checks prevent invalid transitions and soft locks | `web/game-logic.mjs` (`stationBlock`, `assertPlaying`) | guard returns feedback without mutation of authority | `internal-reuse` |
| `CP-CORE-INVENTORY-ARTIFACT` | Inventory selection, drag/drop, item use, reward grant, and mismatch feedback | `web/game-logic.mjs`, `web/game.js` | item IDs are the only cross-surface payload | `internal-reuse` |
| `CP-CORE-PUZZLE-DRAFT` | In-progress puzzle edits remain separate from committed solution state | `web/game-logic.mjs` (`defaultDraft`, `setPuzzleDraft`) | draft is serializable and puzzle-kind-specific | `internal-reuse` |
| `CP-CORE-PUZZLE-ADAPTER` | One submit boundary dispatches sequence, circuit, slot, combination, and word-rain validators | `web/game-logic.mjs` (`submitPuzzle`) | `submitPuzzle(model, state, puzzleId, answer)` | `internal-reuse` |
| `CP-CORE-FAILURE-INTEGRITY` | Wrong attempts reduce integrity and append an inspectable log entry | `web/game-logic.mjs` (`failedAttempt`, `appendLog`) | failure is non-terminal unless an explicit ending is selected | `internal-reuse` |
| `CP-CORE-ENDING-BRANCH` | Honest completion and unsafe override are distinct state branches | `web/game-logic.mjs` (`solve`, `pullOverride`, `ending`) | `ending_id` selects a bounded presentation | `internal-reuse` |
| `CP-CORE-RELOAD-CHECKPOINT` | Namespaced local persistence restores a controlled reboot checkpoint | `web/game.js`, `web/game-logic.mjs` (`resumeWordRainAfterReload`) | persistence adapter stores versioned JSON only | `internal-reuse` |
| `CP-CORE-EVIDENCE-LOG` | Short append-only UI log records discovery, movement, replay, solve, and unsafe actions | `web/game-logic.mjs` (`appendLog`), `web/game.js` (`renderLog`) | log entries have `kind` and `text` | `internal-reuse` |
| `CP-RUNTIME-DIGEST-BINDING` | Build script binds generated graph/content digests into a runtime read model | `scripts/build-runtime.mjs`, `web/runtime-model.js` | build fails on graph digest or required-node mismatch | `internal-reuse` |
| `CP-RUNTIME-CONTENT-COMPILER` | Authored content is compiled into a deterministic browser module | `scripts/build-runtime.mjs` | generated file is replaceable and never hand-edited | `internal-reuse` |
| `CP-SPATIAL-ROOM-GRAPH` | Rooms expose adjacent exits and explicit portal state | `web/three-room.js`, `runtime-model.js` | `room.spatial` plus `room.exits` | `internal-reuse` |
| `CP-SPATIAL-TARGET-REGISTRY` | Every station/exit has one interactive root and a target descriptor | `web/three-room.js` (`interactiveRoots`, `stationRoots`) | target has kind, ID, anchor, look-at height, and range | `internal-reuse` |
| `CP-SPATIAL-GUIDED-AUTOWALK` | Click-to-walk resolves an authored approach anchor before inspection | `web/three-room.js` | target selection is independent of puzzle semantics | `internal-reuse` |
| `CP-SPATIAL-RAYCAST-SELECTION` | Bounded raycasts select only registered targets and floor surfaces | `web/three-room.js` (`Raycaster`, `castFromClient`) | renderer emits target IDs, never business conclusions | `internal-reuse` |
| `CP-SPATIAL-COLLISION-STANDOFF` | Footprints and interaction anchors keep the player outside props | `web/three-room.js` (`blockers`, movement checks) | collision geometry is separate from authored pixels | `internal-reuse` |
| `CP-SPATIAL-MODE-SWITCH` | Guided controls are default; pointer-lock immersive controls are optional | `web/three-room.js` (`controlMode`) | mode changes input mapping, not logical actions | `internal-reuse` |
| `CP-SPATIAL-RENDERER-FALLBACK` | Three.js creation failure swaps to a Phaser fixed-camera renderer | `web/three-room.js` (`createSpatialRoom`), `web/phaser-room.js` | both renderers call the same station/exit callbacks | `internal-reuse` |
| `CP-VISUAL-STATION-SKIN` | One transparent authored image is attached to one procedural station root | `web/three-room.js` (`buildStationSkin`) | art owns appearance; content owns interaction and state | `internal-reuse` |
| `CP-VISUAL-STATE-BEACON` | Locked/ready/solved presentation is applied to a station root | `web/three-room.js` (`beacon`, `halo`, `applyState`) | state visuals cannot create new authority | `internal-reuse` |
| `CP-META-SEEDED-WORD-RAIN` | A seed produces repeatable token positions, speed, trails, and lanes | `web/word-rain.js` (`createWordRainSchedule`) | `tokens + seed -> schedule` | `internal-reuse` |
| `CP-META-REDUCED-MOTION-EQUIVALENT` | Reduced motion uses the same token set and capture intent in a static layout | `web/word-rain.js` | animation changes, logical evidence does not | `internal-reuse` |
| `CP-META-INPUT-EQUIVALENCE` | Pointer, keyboard, touch, and optional gamepad reach the same logical verb | `web/game.js`, `web/three-room.js`, `web/word-rain.js` | input adapters emit domain-neutral actions | `internal-reuse` |
| `CP-UI-DOM-CANVAS-BRIDGE` | Canvas owns spatial spectacle while semantic DOM owns text entry, logs, inventory, and help | `web/game.js`, `web/index.html`, `web/styles.css` | renderer callbacks update accessible DOM | `internal-reuse` |
| `CP-UI-MODAL-WORKBENCH` | A station opens a focused puzzle dialog without losing the world checkpoint | `web/game.js` (`renderDialog`, `bindPuzzle`) | dialog is a presentation adapter over state drafts | `internal-reuse` |
| `CP-QUALITY-LOGICAL-TEST-FIXTURES` | Tests exercise pure transitions, complete spatial layout, replay determinism, and reload boundaries | `tests/game-logic.test.mjs` | fixtures assert observable state, not visual pixels | `internal-reuse` |

## External pattern witnesses

These are patterns found during the game research dispatch. The commit pins and
rights notes are preserved in [`findings.md`](../../research/game-ontology-examples/findings.md).

| ID | Source and pinned revision | Reusable pattern | Rights/action |
|---|---|---|---|
| `EXT-PHASER-RENDERER` | Phaser, `02d8931b626d9764c133cbb3fbf99966c03c757c` | Canvas scene loop and browser input bridge | MIT; already a package dependency |
| `EXT-THREE-CONTROLS-RAYCAST` | Three.js, `20bd26f2d1f2797602c084975b793591b3472558` | Pointer-lock state and bounded ray selection | MIT; already used, prefer current package API |
| `EXT-XTERM-FRONTEND` | xterm.js, `c58ea3637f3968e0e6e79cd92cf9aace7ef89ee2` | Accessible terminal presentation | MIT; optional direct dependency, fictional parser only |
| `EXT-DETECTIVE-BOARD` | detective-board, `79ebc84796c7b984023c96c51982742fd3ce3d53` | Movable evidence cards, typed links, local backup | MIT code; audit dependencies and imported material |
| `EXT-CAESAR-ACCESSIBLE-DECODE` | Caesar Escape Room, `cd68dbd0ca5f6592e169cd2a06968417f9418393` | Progressive decoding and high-contrast keyboard interaction | MIT; small interaction patterns only after audit |
| `EXT-MADRONA-ACTUATOR` | Madrona Escape Room, `21f674951c68888045c824b5b981e158975f9e90` | Explicit actuator/door state and persistent versus sustained conditions | MIT; port structure, not C++ runtime |
| `EXT-EVSCAPEROOM-TRANSITION` | EvscapeRoom, `f50d911c97d2b828da256269327900d3197f3687` | Inspect-to-reveal verbs and validate-before-persist transitions | BSD-3-Clause; port structure |
| `EXT-MINIWORLD-TOPOLOGY` | MiniWorld, `c660156dd73994e55ad81a4e2925582399446aba` | Room/portal topology and small action vocabulary | Apache-2.0; topology witness |
| `EXT-EVOLUTION-TRUST-MEMORY` | The Evolution of Trust, `6ec45d73befdb922bd40654dd1c1c903a953562f` | Compact remembered choices and delayed consequences | CC0 core; audit third-party assets |
| `EXT-COMING-OUT-MEMORY` | Coming Out Simulator 2014, `69918f33e749117586ebd0fb57d9ec6ab047e7a3` | Retained statements and later contradiction checks | Unlicense-style repository posture; audit assets/content |
| `EXT-GEMATRO-RAIN-REFERENCE` | gematro-hyperdope, `1de29ccf9c24df8c4376ec7c91a48c1ef35175a5` | Canvas code-rain density, trails, and leading glyph treatment | GPL-2.0; study-only; current module is independent |
| `EXT-UNTRUSTED-MACHINE` | Untrusted, `ab4a8ed28058a3f4b53cc48972b756ef9c97e862` | Bounded fictional machine interface changing world state | CC-BY-NC-SA plus separate terms; study-only unless cleared |
| `EXT-UNTRUSTED-DESKTOP` | Decrypted, `99e0e7888053d1098f8f674185b4c1d82c1b3319` | Persisted fictional desktop/filesystem presentation | GPL-3.0-or-later; study-only |
| `EXT-CYBERQUEST-BROWSER-ROOM` | CyberQuest, `b7630650b0910267bbac09d57ee9b13a1a507ba9` | Browser rooms, board, autosave, narration, touch | CC-BY-SA-4.0; study-only for this package |
| `EXT-ENABLE3D-BRIDGE` | Enable3D, `17cc02f9f79936a0b60c339650a8705970cd50a6` | Three.js/physics/Phaser bridge | LGPL-3.0; not selected; requires separate compatibility review |

## Composition map

```text
authored content
    -> deterministic runtime model
    -> pure game-state reducer
    -> input adapters
       -> guided spatial renderer (Three.js)
       -> optional immersive controls
       -> Phaser fallback
       -> semantic DOM workbench
       -> seeded word-rain presentation
    -> versioned persistence
    -> logical test fixtures
```

The reusable seam is the reducer. Renderers, terminals, controls, and effects
must emit or consume domain-neutral IDs and actions; they must not infer policy
acceptance from pixels, graph edges, or a successful animation.

## License handling rules

1. Preserve each dependency's license and notices in the package when code is
   copied or installed.
2. Do not copy GPL, LGPL, CC-BY-SA, or CC-BY-NC-SA code/assets into this
   candidate without a separate compatibility and owner decision.
3. Treat generated art, fonts, audio, imported examples, and third-party
   dependencies as separate rights objects.
4. A source being listed here proves discoverability, not permission, adoption,
   or product fit.

## Open decisions before extraction

- Whether the next vertical should keep Three.js or prove a Phaser-only mode.
- Whether a terminal needs xterm.js or the existing semantic DOM input is enough.
- Whether an evidence board is large enough to justify adapting detective-board.
- Whether remembered social consequences need a new reducer module or fit the
  existing `CP-CORE-ENDING-BRANCH` pattern.
- Which package owner will approve any external dependency beyond current MIT
  dependencies.
