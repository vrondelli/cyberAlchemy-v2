# P05 — Assemble the colony and optional sprite-load view

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: P03, P04. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/P05-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `CONTRACTS.md#c4--coordinates-camera-and-selection`
- `CONTRACTS.md#c5--timing-and-animation`
- `CONTRACTS.md#c6--scene-facts-and-visual-load`
- `ART-DIRECTION.md#colony-arrangement`
- `app/src/world/types.ts`
- `app/src/world/ColonyScene.ts`
- `app/public/assets/colony/v1/atlas.json`
- `app/src/session.ts`
- `app/src/playback.ts`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `app/src/world/ColonyScene.ts`
- `app/src/world/LoadScene.ts`
- `app/src/world/createSpriteWorld.ts`
- `app/src/art/layout.ts`
- `app/src/art/colonyAtlas.ts`
- `app/src/world/diagnostics.ts`
- `app/dist/**`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Implement explicit prop/tile placement from the art spec in layout.ts. Load shared textures once; keep static art static and avoid per-frame texture creation.

2. Render only the two source robots in colony mode, preserving exact projection and time-derived poses. Move scenery if it covers the source route; do not introduce physics or pathfinding.

3. Map the first three recorded construction units to the three visual stand-in slots; retain exact source counters. Keep ancillary decorations separate from counted structures.

4. Sort by foot depth with deterministic tie-breaking and maintain accessible pointer hit areas. Use selection/hover labels without permanent clutter.

5. Implement the separate load scene for allowed counts 50/200/500 with a prominent synthetic-rendering banner. Its deterministic display actors do not enter Session or crew state.

6. Preserve the factory interface and lifecycle tests from P03; run only newly relevant tests/build, then hand P06/T02 the exact scene and diagnostics contract.

## Decisive checks

- Final frame shows Explorer/Alice, Builder/Bob, original energies/cargo/counts and visible colony art.
- No scenery forces a changed source path; depth sorting is stable.
- Load-mode counts remain separate from real agents and have closed bounds.
- No extra game/update loop, per-frame atlas upload or unbounded actor creation.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

The fixed-camera colony and separately labeled graphics-load view run through the shared renderer handle.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **P06 or T02**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
