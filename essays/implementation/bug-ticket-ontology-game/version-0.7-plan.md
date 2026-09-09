# Version 0.7 Plan — Reusable Case Runtime

Status: planning candidate  
Authority effect: none  
Implementation authorization: not granted  
Target: `bug-ticket-ontology-game` browser escape-game vertical

This plan uses the package-local [code-pattern ontology](code-pattern-ontology.json)
to turn the current BUG-4821 game into a reusable case runtime. Version 0.7
keeps BUG-4821 as the reference case while extracting stable seams for future
cases. It does not promote the ontology, add a dependency, generate art, or
authorize implementation.

## Frozen planning inputs

| Input | Digest | Purpose |
|---|---|---|
| `code-pattern-ontology.json` | `sha256:d69c76948c4e14fd08b19ae39ee2c0f3add2cdab121769824b31336cf41fa4d2` | pattern IDs, relationships, reuse and license posture |
| `code-pattern-inventory.md` | `sha256:dcfe8847482f0211ef7d15fd31fbb28e72f21de9d8b8a392259b9e33a35a80fa` | human-readable pattern inventory |
| `content/game-content.json` | `sha256:054bb6618200cf60c83a0ebd2fd6de29810589a9cbb749de7298286f6a1faadf` | current case fixture and room/puzzle data |
| `package.json` | `sha256:21b271b9ad1e8b93f6f4bea5874d105d9b4d1e137b49b480bdd0d39807090880` | current Phaser/Three/Vite dependency baseline |

If any frozen input changes, stop and create a new plan candidate. Do not
silently refresh a digest.

## Version 0.7 outcome

The version is complete only when the same runtime can load the current
BUG-4821 case through a case adapter and preserve its observable behavior while
making the following replaceable:

```text
case content -> runtime model -> core reducer -> renderer/input adapters
                                      |             |
                                      |             +-> Three.js guided scene
                                      |             +-> optional immersive scene
                                      |             +-> Phaser fallback
                                      |             +-> semantic DOM workbench
                                      |             +-> deterministic word rain
                                      v
                              persistence + evidence log
```

The reusable seam is a renderer-neutral action/state contract. A renderer may
choose how to display a station, but it may not decide a policy, invent an
evidence relation, or convert a visual state into authority.

## Scope

### Included

- Extract the current reducer and puzzle lifecycle behind a stable action/state
  interface.
- Make case content load through an explicit adapter and checked runtime model.
- Keep one spatial target registry usable by Three.js and Phaser.
- Preserve guided controls, optional immersive controls, touch/keyboard parity,
  and safe collision standoff.
- Preserve deterministic word-rain replay, reduced-motion equivalence, and
  reload checkpoint behavior.
- Preserve the honest-construction and false-green branches.
- Add pattern-level tests and a browser smoke matrix.
- Record third-party dependency and asset provenance before any new import.

### Excluded

- New business ontology or policy meaning.
- Multiplayer, backend persistence, accounts, telemetry, or real-world effects.
- Physics or an Enable3D bridge.
- Copying GPL/LGPL/CC-BY-SA/CC-BY-NC-SA code, art, fonts, audio, or prose.
- New external dependencies before a separate compatibility/license decision.
- Release, deployment, publication, or product-outcome claims.

## Execution phases

### Phase 0 — Freeze and technology gate

**Patterns:** `CP-RUNTIME-DIGEST-BINDING`, `CP-CORE-CONTENT-DATA`  
**Work:** Verify the ontology and baseline digests; select the current
Three.js-plus-Phaser path as the provisional renderer boundary; record whether
xterm.js or an evidence-board dependency is actually needed. Do not add either
dependency in this phase.

**Exit evidence:** a decision record names the renderer path, dependency
posture, browser support target, and accessibility equivalence requirements.

**Stop conditions:** ontology drift, unresolved licensing, or a requirement for
physics/free-camera behavior that is not represented in the current spatial
contract.

### Phase 1 — Extract the core reducer

**Patterns:** `CP-CORE-IMMUTABLE-STATE`, `CP-CORE-PREREQUISITE-GUARD`,
`CP-CORE-INVENTORY-ARTIFACT`, `CP-CORE-PUZZLE-DRAFT`,
`CP-CORE-PUZZLE-ADAPTER`, `CP-CORE-FAILURE-INTEGRITY`,
`CP-CORE-ENDING-BRANCH`, `CP-CORE-EVIDENCE-LOG`

**Planned seam:**

```text
dispatch(state, action, caseModel) -> nextState
```

Actions include `MOVE_TO_ROOM`, `INSPECT_STATION`, `SELECT_ITEM`, `USE_ITEM`,
`SET_PUZZLE_DRAFT`, `SUBMIT_PUZZLE`, `REQUEST_HINT`, `RELOAD_OBSERVED`, and
`PULL_OVERRIDE`. Existing exported functions may remain compatibility wrappers
while callers migrate.

**Exit evidence:** the BUG-4821 tests pass through the action interface; no DOM,
Three.js, Phaser, or canvas object is imported by the core; invalid actions
produce bounded feedback rather than authority changes.

### Phase 2 — Extract the case/content adapter

**Patterns:** `CP-CORE-CONTENT-DATA`, `CP-RUNTIME-CONTENT-COMPILER`,
`CP-RUNTIME-DIGEST-BINDING`, `CP-QUALITY-LOGICAL-TEST-FIXTURES`

**Planned seam:**

```text
loadCase(contentBytes, generatedGraph) -> CaseModel
```

The adapter validates room adjacency, station IDs, puzzle kinds, reward IDs,
required nodes, and graph/content digests before exposing a model to the core.
The existing `scripts/build-runtime.mjs` remains the source of generated
runtime material; generated files are never hand-edited.

**Exit evidence:** two builds from identical inputs are byte-identical; a
missing node, unknown item, invalid exit, or digest mismatch fails closed.

### Phase 3 — Unify spatial renderers

**Patterns:** `CP-SPATIAL-ROOM-GRAPH`, `CP-SPATIAL-TARGET-REGISTRY`,
`CP-SPATIAL-GUIDED-AUTOWALK`, `CP-SPATIAL-RAYCAST-SELECTION`,
`CP-SPATIAL-COLLISION-STANDOFF`, `CP-SPATIAL-MODE-SWITCH`,
`CP-SPATIAL-RENDERER-FALLBACK`, `CP-VISUAL-STATION-SKIN`,
`CP-VISUAL-STATE-BEACON`

**Planned seam:**

```text
SpatialRenderer {
  mount(caseModel, callbacks)
  update(state)
  destroy()
}
```

Three.js and Phaser receive the same target IDs and callbacks. The target
registry owns anchors, range, footprint, and look-at height. Art remains a
visual child of a station root; collision and raycast surfaces remain
procedural. Guided mode stays default; immersive pointer lock stays optional.

**Exit evidence:** the same room graph is traversable with both renderers;
click-to-walk never requires pointer lock; every interactive station has one
target root, one safe anchor, and one logical callback.

### Phase 4 — Separate interface adapters

**Patterns:** `CP-UI-DOM-CANVAS-BRIDGE`, `CP-UI-MODAL-WORKBENCH`,
`CP-META-INPUT-EQUIVALENCE`, `CP-META-SEEDED-WORD-RAIN`,
`CP-META-REDUCED-MOTION-EQUIVALENT`, `CP-CORE-RELOAD-CHECKPOINT`

**Planned seams:**

```text
InputAdapter -> domain-neutral action
PuzzleView(state, dispatch) -> semantic DOM dialog
WordRainView(tokens, seed, capture) -> visual/equivalent capture surface
PersistenceAdapter -> versioned namespaced snapshot
```

Keep the existing semantic DOM terminal first. Evaluate xterm.js only if a
real terminal interaction requirement remains after extraction. If adopted,
connect it only to a deterministic fictional parser.

**Exit evidence:** pointer, keyboard, touch, reduced-motion, and Phaser paths
complete the same logical puzzle; reload restores the word-rain checkpoint; the
word-rain token sequence is identical for the same seed.

### Phase 5 — Optional pattern pilots

**Patterns:** `EXT-XTERM-FRONTEND`, `EXT-DETECTIVE-BOARD`,
`EXT-EVOLUTION-TRUST-MEMORY`, `EXT-COMING-OUT-MEMORY`

These are separate experiments, not dependencies of the core migration.

1. Build a throwaway xterm.js terminal shell against the fictional parser.
2. Compare a small owned evidence board with detective-board’s MIT interaction
   model; do not import player material or unrelated dependencies.
3. Prototype delayed social consequence as a reducer extension only if the
   current false-green branch cannot express it.

Each pilot needs its own license, accessibility, bundle-cost, and playtest
decision. A failed pilot leaves the core plan unchanged.

### Phase 6 — Conformance-oriented local evidence

**Patterns:** `CP-QUALITY-LOGICAL-TEST-FIXTURES`, `CP-CORE-RELOAD-CHECKPOINT`,
`CP-SPATIAL-RENDERER-FALLBACK`

Add evidence for:

- state-machine equivalence between old and extracted callers;
- complete three-place navigation and station reachability;
- renderer parity and fallback behavior;
- seeded replay on both sides of reload;
- honest versus false-green ending separation;
- keyboard, touch, and reduced-motion parity;
- dependency/license/asset manifest closure.

Local tests and browser observations remain evidence only. They do not establish
independent conformance, ontology admission, product adoption, or release.

## Planned file boundary for a later authorized implementation

```text
src/core/                 # extracted reducer and persistence contracts
src/case/                 # content adapter and model checks
src/render/three/         # Three.js implementation
src/render/phaser/        # Phaser fallback implementation
src/ui/                   # DOM workbench and input adapters
src/effects/              # seeded word-rain presentation
content/                  # case data, unchanged in meaning
tests/                    # logical, parity, and browser-facing fixtures
```

This is a target boundary, not an authorization to create or move these files.

## Required decisions before implementation

1. Owner accepts the current code-pattern ontology as the planning basis.
2. Owner chooses whether Version 0.7 is an extraction-only release or also adds
   a second playable case.
3. Owner resolves the dimensionality gate: retain current guided 3D, prove a
   Phaser-only 2.5D alternative, or authorize another renderer investigation.
4. Owner decides whether xterm.js and/or detective-board deserves a pilot.
5. Implementation owner authorizes an exact file/effect envelope under D65.

## Current planning selection

The user-requested three options are recorded as a candidate selection in
[`version-0.7-decision-candidate.json`](version-0.7-decision-candidate.json):

1. **Extraction-only:** Version 0.7 will migrate the existing BUG-4821 case
   into reusable seams; it will not add a second playable case.
2. **Guided 3D default:** retain the current Three.js guided renderer and the
   Phaser fallback. Immersive pointer-lock remains optional; no new renderer or
   physics bridge is selected.
3. **Two isolated pilots:** evaluate xterm.js and detective-board separately,
   without adding either as a production dependency until its pilot has a
   compatibility, accessibility, bundle, and license result.

Decision posture: `candidate-selected`, based on the user's request. This does
not record a product-owner acceptance, dependency adoption, or implementation
authorization.

## Residue and stop rules

- `Goals` validation is currently blocked; this plan cannot be registered as
  admitted execution state.
- The code-pattern ontology is candidate-only and its digest is frozen above.
- External source licenses and third-party asset provenance remain separate
  decisions.
- No new art generation, dependency installation, implementation, publication,
  release, or deployment follows implicitly from this plan.
- Stop at the first changed source binding, missing predecessor, failed parity
  test, unresolved license, or request for authority outside this envelope.

## Claim ceiling

This document proposes an ordered extraction and pilot plan for Version 0.7. It
does not claim that the plan is approved, that the ontology is canonical, that
the runtime is conformant, or that the game is released or deployable.
