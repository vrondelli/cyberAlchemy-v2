# T02 — Validate the complete comparison and freeze G02

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-VALIDATE.
Dependencies: P05, P06, O02. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/T02-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `VALIDATION.md`
- `CONTRACTS.md`
- `app/README.md`
- `runs/<run-id>/preview.json`
- `checkpoints/G01/<revision>/decision-<id>.json`
- `../checkpoints/B1/v1/REVIEW.md`
- `../checkpoints/B1/v1/manifest.json`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `runs/<run-id>/checks/T02-*.json`
- `checkpoints/G02/<revision>/**`
- `/home/vrondelli/projects/domainspec-core/output/playwright/robot-world-sprites/<run-id>/G02/**`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Have the preview owner build current P05/P06 output and verify served bytes before QA. Run the inherited and new meaningful tests once for this integrated candidate.

2. Perform V01–V18 using actual browser controls and read-only diagnostics. Test all three viewports, world/crew selection, pan-versus-click, keyboard/scrub, visibility, reduced motion and negative recovery.

3. Measure static/replay/load views with VALIDATION.md's protocol. Include long stalls, all load counts, transfer and decoded estimates. Record target misses without relaxing targets.

4. If making a 3D-vs-2D performance claim, take a new comparable baseline under the same conditions. Otherwise explicitly report the old timings as historical.

5. Capture the full scene, close-ups and real movement video. Check every output exists and visually inspect it. Freeze the exact current source/build/assets/contracts and evidence into G02.

6. Return the user-facing review, current two-lane status, candidate digest and unresolved limits. Failed implementation checks go back to their owner; do not patch source inside this read-only QA packet.

## Decisive checks

- All mandatory functional assertions have explicit PASS/FAIL/not_evaluable results.
- Graphics-load sprites cannot affect session or real-agent counts.
- Candidate/source/build identity and original B1 preservation are verified.
- Evidence is actual, current and sufficient for G02; no user decision fabricated.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

The complete comparison is ready for a user visual decision, with evidence and limitations bound to one candidate.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **G02**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
