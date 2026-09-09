# H20 live selective-recovery result

All 24 frozen trials completed. The independent final review verified source, selected-request, fixture, receipt, semantic-validator and exposure evidence. The execution pipeline exited successfully; both earlier transport failures remain counted without retries or replacement.

| Measure | Baseline | Optional recovery |
| --- | --- | --- |
| Visible correct first proposals | 6/6 | 4/6 |
| Delayed correct first proposals | 0/6 | 3/6 |
| Model attempts | 66 | 140 |
| Tokenizer attempts | 66 | 140 |
| Trials with unattributable final source | 1 | 5 |
| Actual recycles | 0 | 0 |

Recovery does not meet the frozen acceptance criteria: visible success required 6/6, delayed success at least 5/6, and decisive archive evidence at the final selected request at least 5/6 (observed 4/6). Delayed net wins reached the required three. Recovery used 2.12 times the baseline model attempts across the same number of scheduled trials; failures and their call costs remain included.

The frozen evaluator classifies the study **inconclusive**, because its known-evidence predicate also requires attributable final source, known semantics and successful receipts in every row. Six rows lack attributable final source, including the two retained transport failures. This classification does not erase the missed acceptance thresholds or the two visible-control regressions. No candidate adoption is supported.

Observed failures include absent/invalid final proposals after repeated recovery, an archive request referencing a derived archive call rather than its original file-read call, unchanged baseline proposals, two schema-valid but semantically incorrect baseline proposals, and two transport failures. Successful tool/schema completion alone is not repair correctness. Captured requests establish delivered evidence and chosen tool actions; they do not establish an internal reason for the model's choices.

This experiment studies ordinary masking, not recycling continuity. None of the 24 trials recycled. Results concern one task family, three small windows and two repetitions, not GLM product qualification or a population-level effect.

## Evidence and next hypothesis

- [Frozen final report](review-final/report.json): 206 model and 206 tokenizer attempts, exact evidence hashes and paired results.
- [Canonical observation and learning decision](review-final/research.json): preserve the inconclusive classification and review actual failure stages before another intervention.
- [Successful pipeline marker](reviewed-completed-74.json).
- [Joined research DAG](../research/dag-research-72-final.json): 92 records, 148 edges, canonical record and dependency validation passed.
- [H21 local result](../admission-before-masking-v1/RESULT.md): retain complete inspected history when actual admission permits it. Scripted delayed success is 9/9 versus 0/9 without additional model calls; pressured fallback remains unsuccessful. This is not yet a live GLM result.

The next experiment should test H21 against the unchanged baseline with fresh frozen facts, matched windows, actual tokenizer accounting, independent semantics and visible controls. Keep actual capacity pressure separate from ordinary masking and measure cost alongside correctness. Do not promote optional recovery or change H20's evaluator to obtain a passing screen.

## Open Questions

Does H21's local benefit transfer to live GLM without visible-control regressions or greater dispatch cost? What bounded evidence policy preserves facts under genuine pressure? How do multiple facts and larger request bodies affect admission? Product milestones remain in [the GLM finish plan](../../../../../GLM-FINISH-PLAN.md).
