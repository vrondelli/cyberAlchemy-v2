# Frozen task/window matrix result

The twelve-condition evaluation completed with **11/12 first-pass repairs and 11/12 final verified repairs**. All three recycled trials passed continuity. The strict 12/12 target failed because the 12K retention-pair proposal omitted its required `authority_effect` field. That failed submission remains in the denominator; nothing was filled in or retried.

| Task | 8K | 10K | 12K |
| --- | --- | --- | --- |
| Archive boundaries, recent-v2 | Pass | Pass | Pass |
| Exact JSON scoring, clear | Pass | Pass | Pass |
| Retention tool pairs, recent-v2 | Pass | Pass | Missing required submission field |
| Long retention, recent-v2 | Pass | Pass | Pass |

The eleven accepted proposals passed container public validation unchanged and then passed all **88 separate final oracle checks**. Feedback made zero corrective model/tokenizer calls. The unsubmitted trial received `NO_SUBMISSION`; the semantic repair stage does not accept malformed native proposals. This is an observed protocol gap, not evidence that the rejected source would pass or fail semantic tests.

## Cost and continuity

| Initial window block | Repairs | Model attempts | Tokenizer attempts | Minimum admission headroom |
| --- | --- | --- | --- | --- |
| 8K | 4/4 | 42 | 49 | 269 |
| 10K | 4/4 | 33 | 34 | 304 |
| 12K | 3/4 | 32 | 32 | 639 |

Total initial use was **107 model and 115 tokenizer attempts**, below caps160/320. Correction used0/12 model and0/24 tokenizer attempts. Initial evaluation took773.216 seconds. Scoring8K recycled twice, long8K five times, and scoring10K once; all three passed continuity. Other trials did not recycle. All recorded admission headroom was positive. No transport failure was recorded in this batch. All eleven validation workers completed without execution failures and were verified absent after cleanup.

The failed submission's diagnostic is `patch-set.authority-effect-invalid`; its visible JSON field list confirms `authority_effect` was absent. See [failure evidence](submission-failure.json). This field is required by the native tool contract; hosted tool submission did not enforce its presence. No normalization or hidden repair was performed.

## Implementation and evidence

The evaluator now accepts explicit `--fresh-matrix` mode only for a completed twelve-trial run containing every four-task/three-window combination exactly once. Missing or duplicate conditions reject. All failures stay visible, the correction cap is twelve, and blocked or unsubmitted stages cannot count as final verified success. Seven schedule/scoring tests passed, plus CLI syntax checking. Prompts, candidate policy and validation semantics were frozen for the batch.

Evidence: [plan](PLAN.md), [schedule](schedule.json), [first-pass result](initial/result.json), [feedback/final result](feedback/result.json), [tests](tests.tap), [orchestration freeze](orchestration-freeze.json). Initial, feedback and orchestration snapshots all matched after completion. Private original traces remain under `/tmp/are-matrix-feedback-36`; private corrective state is under `/tmp/are-matrix-correction-36`. No provider reasoning was exported. Earlier successes and failures remain separate evidence. CAV2-D65 candidate construction, authority effect none; no patches or default policies were applied.

## Open Questions

The next bounded change is format-repair handling for rejected native submissions, using the existing strict parser and one explicit corrective budget while retaining the original failure. It must not silently insert authority fields or bypass source/scope validation. Can that recover this case without weakening acceptance or adding semantic regressions?

This run has one observation per task/window condition, fixed task-specific retention and existing fixtures. It is not replicated sampling within each condition or held-out task evidence. The eleven already-correct submissions leave semantic feedback benefit unmeasured here. Larger windows did not guarantee schema compliance. Further replicated/held-out evaluation and provider-internal compaction uncertainty remain unresolved; activation stays separate.
