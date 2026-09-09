# P03 — Implement renderer lifecycle, atlas registration and scale bench

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: P01, P02. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/P03-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `CONTRACTS.md#c3--renderer-interface`
- `CONTRACTS.md#c4--coordinates-camera-and-selection`
- `CONTRACTS.md#c5--timing-and-animation`
- `ART-DIRECTION.md`
- `design/implementation-contract.md`
- `app/src/session.ts`
- `app/src/playback.ts`
- `app/public/assets/robots/v1/atlas.json`
- `app/public/assets/robots/v1/provenance.json`
- `app/node_modules/phaser/types/phaser.d.ts`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `app/src/world/types.ts`
- `app/src/world/createSpriteWorld.ts`
- `app/src/world/SpriteBenchScene.ts`
- `app/src/world/ColonyScene.ts`
- `app/src/world/projection.ts`
- `app/src/world/camera.ts`
- `app/src/world/animation.ts`
- `app/src/world/diagnostics.ts`
- `app/src/sprites/atlas.ts`
- `app/src/App.tsx`
- `app/src/env.d.ts`
- `app/tests/projection.test.ts`
- `app/tests/animation.test.ts`
- `app/tests/atlas.test.ts`
- `app/dist/**`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Implement C3's typed factory and handle, backed by exactly one Phaser.Game. Verify the actual Phaser 3.90 types. Keep minimal React bridging in App.tsx; this sequential ownership passes to P06 later.

2. Load and bound-check atlas JSON and PNG, compare actual image hash/dimensions, register named texture frames and apply each pose's foot origin. Scale all poses with the shared referenceHeightPx factor.

3. Implement pure projection and animation selection helpers. The recorded scene clock must follow C5. Do not add a second update loop or independent world animation timer.

4. Create ?view=bench with 48/64/80 samples, idle/walk controls, light/dark backgrounds and the sample building. Bench animation is labeled art preview and does not change Playback.

5. Implement pan/zoom/reset/resize and a minimal actor-only ColonyScene behind ?view=colony to verify exact two-robot mapping. Final scenery is P05; do not claim that placeholder is the finished colony.

6. Implement abort/readiness/error/disposal and read-only diagnostics. Add targeted atlas, projection and deterministic phase tests; run build/tests and return the actual results.

## Decisive checks

- Factory resolves only after required assets/scene are usable; load rejection cleans up.
- Bench has no background boxes/caption frames and measures real screen sizes.
- Same source cursor/time produces same positions, pose and facing after seek.
- Raw elapsed time advances Playback once; pause/hidden-page rules hold.
- One live game after remount and zero after teardown; counters are observed, not hard-coded.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

A running scale bench and reusable renderer contract exist with current tests.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **O02**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
