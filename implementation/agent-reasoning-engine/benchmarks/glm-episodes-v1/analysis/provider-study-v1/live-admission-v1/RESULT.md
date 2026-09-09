# H21 live result: admission before masking

The isolated H21 candidate produced correct first proposals in **12/12 live trials**, including all six delayed-evidence cases, with the exact decisive original file body present at every submission. The baseline produced correct proposals in 6/12: all six visible controls, zero delayed successes. Both arms used 66 model and 66 tokenizer attempts. All 24 frozen rows completed; independent final source, receipt, fixture, sandbox and exposure verification passed. Reviewed pipeline session 3279 exited 0.

| Measure | Baseline | Admission first |
| --- | --- | --- |
| Visible correct first proposals | 6/6 | 6/6 |
| Delayed correct first proposals | 0/6 | 6/6 |
| Model attempts | 66 | 66 |
| Tokenizer attempts | 66 | 66 |
| Sum of measured input tokens across tokenizer attempts | 95,694 | 100,548 |
| Minimum remaining soft-window margin including output reserve | 3,110 | 2,886 |
| Actual recycles | 0 | 0 |

Retaining history increased measured input tokens by about 5.1%; equal call counts do not imply equal billed cost. Token sums are tokenizer measurements, not invoices. Latency sums and per-row prompt-size/headroom measurements are retained in [the physical report](physical-final-77.json).

## Interpretation and the retained failure

The candidate changes only the initial history projection: try complete inspected history through existing admission before falling back. It does not add a recovery tool, model call, schema exception or source-specific hint. Exact candidate source identity is frozen in [the manifest](prepared/manifest.json).

All numerical quality, evidence and model-call acceptance floors were met. The frozen evaluator nevertheless remains **inconclusive**, because one baseline final request timed out and has no attributable final source. That row remains failed in scheduled success counts and unknown in semantic outcome; it was neither retried nor replaced. The five other delayed baseline proposals are independently verified incorrect. Thus there are five fully observed delayed semantic wins, plus one successful candidate paired with a baseline transport failure. The failure does not support attributing a code defect to the baseline for that sixth pair.

This is a concrete positive result for the candidate on this ordinary-masking task family, not whole-cohort acceptance under the frozen all-known predicate. It neither changes that predicate nor grants product adoption. Do not run another identical cohort merely to remove the timeout from the report.

The evidence explains a useful engine change: when inspected source still fits, preserve it instead of requiring the model to recover information that was prematurely masked. H20's optional recovery used more calls and regressed visible controls; H21 kept the source available with equal call counts and no observed visible regressions in this separate fresh-fact pilot. The two experiments are not one pooled randomized comparison.

## Research evidence and next construction

- [Frozen final report](review-final/report.json) and [canonical observation/decision](review-final/research.json).
- [Complete research DAG](../research/dag-admission-live-75-final.json): 96 records and 156 edges; hypothesis, experiment, observation and learning-decision dependencies validated.
- [Local readiness](readiness.json): three passing negative/oracle test groups and twelve scripted transport cases before live dispatch.
- [Reviewed resumption](resume-audit-77.json): 16 retained rows, exact eight-row remainder, preserved timeout, no replacement.
- [Completion marker](reviewed-completed-77.json).
- [Physical analyzer](analyze.mjs): reusable per-row token, latency, headroom and captured-prompt accounting, separate from frozen semantic scoring.

The next bounded construction should test this candidate against multiple relevant facts and actual admission pressure before product integration. Existing local H21 pressured cases fail in both arms because the unchanged fallback still drops evidence; this live cohort has zero recycles and cannot resolve that gap. Preserve the positive ordinary-masking result while making pressure a separate hypothesis and experiment. Serving policy and core source remain unchanged; the broader GLM finish plan is still open.

## Open Questions

How should a bounded working-evidence representation survive genuine capacity pressure? Do multiple facts, larger bodies and repository questions preserve this benefit? What product integration and regression evidence will justify an explicit profile? The larger milestones remain in [the GLM finish plan](../../../../../GLM-FINISH-PLAN.md).
