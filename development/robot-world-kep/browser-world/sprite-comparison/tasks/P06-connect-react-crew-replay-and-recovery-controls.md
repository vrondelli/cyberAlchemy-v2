# P06 — Connect React crew, replay and recovery controls

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: G01, P03. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/P06-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `CONTRACTS.md#c3--renderer-interface`
- `CONTRACTS.md#c7--ui-boundary`
- `../app/src/main.tsx`
- `../app/src/style.css`
- `app/src/world/types.ts`
- `app/src/App.tsx`
- `app/src/session.ts`
- `app/src/playback.ts`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `app/src/App.tsx`
- `app/src/style.css`
- `app/src/ui/CrewPanel.tsx`
- `app/src/ui/ReplayBar.tsx`
- `app/src/ui/WorldPanel.tsx`
- `app/src/ui/SpritePortrait.tsx`
- `app/README.md`
- `app/dist/**`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Replace the minimal App bridge with focused UI components. Reuse the original design pattern and source values, adapting canvas/3D/orbit wording and camera calls to Phaser pan/zoom.

2. Own one Playback and one selected source ID in React. Mount the renderer in WorldPanel, await disposal before replacement, and keep ready/error/cursor state coherent on retry.

3. Implement crew selection, exact inspection values, native timeline with both final revisions, speed controls and sprite portraits. Do not copy Babylon portrait rendering or add WebMCP.

4. Route keyboard shortcuts only where appropriate. Keep editing/select controls native; respect reduced motion. Keep a visible no-selection state and error/retry path.

5. Show world labels only for selected/hovered robots and keep DOM crew selection fully usable. Make all three desktop viewports fit with readable controls.

6. Update the new app's actual launch and usage documentation. If P05 is not yet ready, validate against the minimal contracted scene without claiming the colony is complete.

## Decisive checks

- Selecting via UI does not reset camera/cursor or cause a callback loop.
- Space/1/2/R/Escape do not hijack editing controls; timeline can reach both final revisions.
- One game survives resize/retry correctly; errors do not leave active ghost loops.
- No fake marketplace/live-agent actions or unreachable controls.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

The original inspection/replay journey works against the new renderer through one stable interface.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **T02**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
