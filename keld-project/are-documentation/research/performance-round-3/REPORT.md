# ARE documentation performance research — round 3

Date: 2026-09-18  
Route: `CA2-ROUTE-RESEARCH`  
Authority effect: none  
Result status: complete diagnostic research; performance release gate remains failed

## Objective and method

This round used the research ontology and DAG method to separate loading, motion scheduling,
interaction, phase accuracy and visual fidelity. The pass-2 result was frozen at
`evidence/performance/page-before-round-3.json`; `page-performance-budget.json` was not changed.

The valid run used a 390×844 viewport, 100 ms network latency, 4 Mbps download and 4× CPU
throttling. Load tests compared five alternating-order pairs. Motion tests compared four
alternating-order rounds across control, no CSS filters/shadows, and suppressed background
paint. The latter interventions are causal probes and are not product designs.

An earlier run is retained as `evidence/performance/round-3/invalid-fixture-run.json`. It was
invalid because its server returned 404 for the expected ARE status request. The repaired run
fulfilled that endpoint and recorded no HTTP or browser errors.

## Results

| Question | Control | Intervention | Paired direction | Decision |
| --- | ---: | ---: | --- | --- |
| Mobile readiness, median | blocked preload 5.441 s | all-five preload 6.478 s | preload slower 5/5 | blanket preload falsified |
| Mobile LCP, median | blocked preload 3.748 s | all-five preload 4.240 s | preload slower 5/5 | consistent counterevidence |
| Assembly frame p95, p75 | control 166.7 ms | no filters 150.0 ms | mixed | filters rejected as primary |
| Assembly frame p95, p75 | control 166.7 ms | no background paint 100.0 ms | better 3/4, tied 1/4 | background paint supported as candidate |
| Final-loop frame p95, p75 | control 83.3 ms | no background paint 50.1 ms | better or tied 4/4 | same candidate survives second scene |

No intervention met the absolute 25 ms frame-p95 target. WSL host load reached 11.24 and swap
was saturated. This lowers confidence in absolute values and cross-device generalization. It
does not explain why all-five preload lost every within-round comparison or why suppressed
background paint had a consistent paired direction.

## Decisions

1. Remove “preload all five hero images” from the preferred mechanism set. The next loading
   experiment should compare no explicit preload with assembled-image-only preload.
2. Do not spend the next implementation round broadly deleting CSS filters. The experiment
   did not identify them as the primary cause.
3. Investigate a visually equivalent background with lower painted area, lower pixel density,
   fewer opacity layers, or a composited static/degraded mode during active assembly. Preserve
   the moving cyber-engine composition and motion controls.
4. Do not run another full acceptance benchmark until one product treatment is implemented.
   This research route produced evidence and a selected next hypothesis, not implementation.

## Claim boundary

The evidence supports mechanism selection inside this synthetic fixture. It does not prove
field Core Web Vitals, physical-laptop GPU smoothness, release readiness, or that hiding the
background is an acceptable product change. The unchanged performance gate remains failed.

## Open Questions

Unresolved questions and challenge residue are owned by [open-questions.md](open-questions.md).
