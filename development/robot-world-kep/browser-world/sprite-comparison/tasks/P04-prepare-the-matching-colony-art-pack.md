# P04 — Prepare the matching colony art pack

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: G01. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/P04-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `ART-DIRECTION.md#colony-arrangement`
- `ART-DIRECTION.md#colony-asset-deliverables`
- `checkpoints/G01/<revision>/decision-<id>.json`
- `checkpoints/G01/<revision>/manifest.json`
- `app/public/assets/bench/v1/building.png`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `app/public/assets/colony/v1/tiles.png`
- `app/public/assets/colony/v1/props.png`
- `app/public/assets/colony/v1/atlas.json`
- `app/public/assets/colony/v1/provenance.json`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Verify the chosen G01 scale/style and snapshot hash. Carry its character/building relationship into the new art.

2. Using the imagegen skill, author the workshop, parts store, research shelter, pad, cargo props and limited vegetation in one consistent fixed perspective and palette.

3. Prepare tiles.png and props.png as separate new assets. Inspect actual dimensions/alpha/frame positions; derive metadata from the output rather than assumed generated layout.

4. Create the simple colony atlas contract described below in ART-DIRECTION.md. Keep names stable and include foot anchors for props.

5. Record prompts, actual tool outputs, source/reference hashes and sizes. Keep required assets within the proposed 8 MiB asset budget without silently degrading selected art.

6. Reject incompatible perspective, illegible small details, clipped props or baked-in text. Return a bounded limit if the tool cannot produce the selected style.

## Decisive checks

- All required prop names and tiles have real pixels and valid metadata.
- Perspective, outlines and palette are coherent with G01 at actual scale.
- Source lineage distinguishes generated scenery from the user-provided robot.
- G01 frozen assets/decision are unchanged.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

The approved small-robot scale has a usable matching colony art candidate.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **P05**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
