# T01 — Verify and freeze the sprite/scale candidate

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-VALIDATE.
Dependencies: P03, O02. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/T01-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `VALIDATION.md#required-checks`
- `VALIDATION.md#g01-evidence`
- `ART-DIRECTION.md#g01-scale-bench`
- `app/src/world/types.ts`
- `runs/<run-id>/preview.json`
- `app/public/assets/robots/v1/atlas.json`
- `app/public/assets/robots/v1/provenance.json`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `runs/<run-id>/checks/T01-*.json`
- `checkpoints/G01/<revision>/**`
- `/home/vrondelli/projects/domainspec-core/output/playwright/robot-world-sprites/<run-id>/G01/**`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Read and use the Playwright skill. Test the actual headed browser bench on light/dark backgrounds and the three scales. Capture true CSS heights, not only nominal configuration.

2. Watch complete idle/walk loops and inspect feet, proportions, missing pixels, transparent borders and background bleed. Include the sample building for scale.

3. Verify atlas negative cases, abort/remount behavior, source projection/animation tests and clean console/network reload. Record intended failures separately.

4. Capture screenshots and an actual animation video; confirm files, dimensions and duration. Do not substitute a generated mockup for browser evidence.

5. Freeze app source/config/lock/assets/dist and design contracts into the checkpoint's candidate snapshot. Hash the review, receipts and snapshot; save manifest.json.

6. Return a concrete recommendation, limits and manifest digest. Do not edit implementation to make this validation pass; return a failure to P02/P03's owner if necessary.

## Decisive checks

- V01–V08, V15 and V16 have current results appropriate to this bench.
- Artifacts visibly show all proposed scales and the real animation.
- Manifest resolves to immutable snapshot bytes and preserves original sources.
- No visual decision receipt was invented.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

G01 has a reviewable, hash-bound sprite/scale candidate or a precise failure requiring a new attempt.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **G01**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
