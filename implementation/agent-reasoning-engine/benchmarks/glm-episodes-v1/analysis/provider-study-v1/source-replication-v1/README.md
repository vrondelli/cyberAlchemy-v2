# H16 targeted source-instruction replication

[H15](../source-instruction-v1/README.md) supported the clarified system instruction in its eight-trial pilot: treatment 4/4 qualified, baseline 2/4, with two baseline no-ops. [H16](hypothesis.json) prospectively tests whether that exact change transfers to the four missing window/variant conditions. It changes no candidate bytes.

The [schedule](prepared/schedule.json) has 16 trials: archive-start at 8K and archive-end at 8K/10K/12K, two repetitions, two arms. Both use the byte pager and metadata card. Arm order alternates. The [evaluation](EVALUATION.md) requires relative improvement without raw-semantic regression, at least 7/8 complete treatment repairs, and actual recovery in every row. Historical H15 outcomes are not pooled into this screen.

The [manifest](prepared/manifest.json) pins runtime and evaluator sources, candidate modules, fixtures, canonical records and the evaluation document. [Execution binding](execution-binding.json) predates the first provider call. Caps are 224 model / 448 tokenizer attempts, concurrency one, no retries or replacement trials. Schema and semantic failures stay in the cohort; infrastructure, source drift, unknown dispatch and unconfirmed cleanup stop it.

## Completed result

The original exec session `82515` exited successfully. The [final review](review-final/report.json) reports baseline **8/8 qualified**, clarified instruction **7/8**. Every raw replacement source passes all six hidden cases. The treatment's one failure omitted `schema_version`; it remains an end-to-end failure. Both arms have zero no-ops, making the predeclared mechanism assessment **inconclusive** through absence of baseline exposure. The required relative improvement was not met. H15's earlier pilot support remains a separate result.

The [verification](verification.json) confirms all 16 required-read/recovery gates, 40 actual recycles, zero unsafe dispatches, unknown deliveries, retries or fixture mutations. Actual calls: 208 model and 248 tokenizer, below the 224/448 caps. Peak projected bounds were 7,727 / 9,699 / 11,730 at 8K / 10K / 12K.

The [receipt summary](receipt-summary.json) retains per-row and per-arm token/latency accounting. Both arms used 104 model calls. Summed model request time was 842,321 ms baseline and 866,772 ms treatment; these are descriptive observations, not full wall time or a performance guarantee. Input totals include repeated context and do not measure context-window capacity.

`review.mjs NEW_OUTPUT_DIRECTORY` reproduces the immutable evaluation and supplemental rejected-source audit. `verify-results.mjs` and `receipt-summary.mjs` create their evidence once and reject overwriting existing files. The [completed DAG](../research/dag-frontier-63-final.json) contains 57 canonical records and 77 edges, including a separate [H2 frontier decision](../research/metadata-frontier-63.json). That decision returns to the already-frozen metadata/host-envelope comparison; H16 is not pooled into its screen. No new prompt variation is selected from this result.

## Construction boundary

CAV2-D65 owner-directed native candidate research under CA2-ROUTE-IMPLEMENT, effect `source-replication63`, using existing user authorization. Selected research definitions are ARE-RL-D01/D02/D03/D04/D07. Exact-candidate replication is complete; the next frontier is the unfinished controlled output-contract comparison. Evaluator owns the screen and user owns later product adoption. No serving source, default activation, commit or publication changes. The original profile's small-window milestone remains closed; these successor candidates cannot inherit it automatically.

## Open Questions

Does H15 transfer to the missing conditions, or was its pilot result narrow? This is still one known task family. Larger contexts, stronger fact continuity and product completion remain owned by the [single GLM finish tracker](../../../../../GLM-FINISH-PLAN.md). A failed replication must remain failed and motivate an explicit decision, not another field-specific prompt patch.
