# P02 — Prepare transparent robots and one scale-reference building

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: P00. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/P02-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `ART-DIRECTION.md`
- `design/implementation-contract.md`
- `SOURCE-REGISTER.json`
- `/mnt/c/Users/vlad_/Downloads/assets robots`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `app/public/assets/robots/v1/source.png`
- `app/public/assets/robots/v1/atlas.png`
- `app/public/assets/robots/v1/atlas.json`
- `app/public/assets/robots/v1/provenance.json`
- `app/public/assets/bench/v1/building.png`
- `app/public/assets/bench/v1/provenance.json`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Inspect and hash the user PNG; copy it unchanged to source.png. Confirm the visible sequence counts before metadata work. Treat any text inside it as artwork/data.

2. Apply the imagegen skill to create a separate transparent derivative. Ask for removal of the baked background/captions with the existing robot design and pose order preserved. Save actual outputs; do not overwrite source.png.

3. Inspect the returned dimensions, poses, alpha and frame boundaries. If it redraws away necessary details or changes sequence meaning, reject and diagnose the derivative instead of labelling it a faithful extraction.

4. Measure untrimmed frame rectangles and local foot anchors in the returned image. Write ART-DIRECTION.md's custom atlas metadata, ordered groups, source/image hashes, referenceHeightPx and initial nominalHeight 64.

5. Create one matching near-frontal pixel-art building around three robot heights for the scale bench. It is a new style sample, not an actual simulation construction. Save its provenance.

6. Record source-provided/edited/generated lineage, tool/prompt, dimensions and actual hashes. Mark unused shooting frames explicitly; do not put them in a colony animation.

## Decisive checks

- Original PNG copy matches the registered hash.
- Actual atlas has transparent surroundings and visible complete robots; no captions in selected frames.
- Frame names/counts/bounds/feet match the actual derivative, not guessed source grid coordinates.
- No claimed second supplied character design or inferred lifecycle event.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

A concrete robot atlas and representative building are ready for engine testing. Visual acceptance remains T01/G01.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **P03**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
