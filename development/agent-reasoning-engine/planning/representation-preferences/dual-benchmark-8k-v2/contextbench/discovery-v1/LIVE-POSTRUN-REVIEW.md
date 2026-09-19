# Independent live post-run review

**Result integrity approved. Experiment target failed. Campaign goal remains unmet.** These are separate conclusions. [LIVE-POSTRUN-REVIEW.json](LIVE-POSTRUN-REVIEW.json) records `result_integrity_approved:true`, the exact freeze hash,290 source-artifact bindings and per-arm checks. No provider or scorer was invoked by this audit; no gold was read and no source checkout was removed.

The approved freeze is `f39d81fda6322960a1520ecdda00c32c08f755097ff4499bdb42a49467c4f7ca`. All804 frozen bindings, native continuity and approved review association were reverified before and after analysis. The original44-test review and later approved59-test source state remain distinct historical artifacts.

## Independent reconciliation

All four assigned pairs and eight arms are terminal, recorded and generation-sealed. Scheduler checkpoint and generation-complete accounting agree, the scheduler lock is absent, and evaluation-complete binds the final report hash. Each accounted arm result equals its original native result; completed-result hashes, transport ledger digests and pair seals reconcile. All ledgers are idle, with no missing completion receipt, unknown reservation, running reservation or unallocated known usage.

Every one of **218 dispatched model requests** matched its actual captured wire hash through native `bodyForReceipt`. Each request's native admission matches its output reservation, model profile and actual tokenizer evidence. Retained-reasoning reservations were independently recomputed from prior receipts and matched tokenizer records; input upper bounds equal measured input plus512 margin plus retained reasoning. Output reservation is2,048. Maximum admitted input-plus-output bound across the study is **6,990**, below8,000. Actual usage remains inside every96,000-token arm budget and the768,000-token study budget. All eight trajectories have multiple calls and exceed8,000 cumulative tokens; that is a trajectory measurement, not a source-history token measurement.

There are **605,550 known model input/output tokens and zero unknown calls**. Raw receipt sums match arm summaries, both pair records, scheduler usage and the final report. Deterministic native scoring adds zero model calls. Timing files have exactly218 matching receipt intervals with verified duration arithmetic; measured overlap belongs to the separately produced capacity analysis, not a new calculation here.

For all eight arms, `exportTerminalEvidenceSelection` was independently replayed from the exact successful terminal response, private packet, receipt-bound captures, source snapshots and retained pinned base checkout. Rebuilt prediction, selection and export evidence match sealed files. Base revisions are exact and clean. Existing native score outputs match all six reported metrics; their upstream revision matches pinned `1436c28a8eb95496da4ea69ad458b9f8a8eb7d61`. The official scorer was not rerun.

## Observed outcomes

| Task | Arm | Calls | All model tokens | Native SpanF1 | Native file F1 |
|---|---|---:|---:|---:|---:|
| C1 | Control |29|81,619|0|0.285714|
| C1 | Treatment |32|83,788|0|0.222222|
| C2 | Control |33|81,634|0.992827|1|
| C2 | Treatment |30|80,560|0.973966|1|
| C3 | Control |26|79,893|0.466667|1|
| C3 | Treatment |11|37,092|0.515435|0.8|
| C4 | Control |29|80,050|0.071731|0.352941|
| C4 | Treatment |28|80,914|0.271949|0.105263|

Control totals323,196 tokens; treatment totals282,354. Reduction is **12.6369%**, below the required15%. All eight exports are valid, but treatment has **zero of four perfect tasks**. Macro SpanF1 increases from0.382806 to0.440338; macro file F1 decreases from0.659664 to0.531871. Native quality therefore does not show uniform nonregression across metrics/tasks. Valid source selection does not imply relevant, complete or perfect selection, and code-repair success is outside this metric.

The exact frozen gate conjunction was independently recomputed. Pair sealing, all-eight validity, request admission, long cumulative trajectories and complete accounting pass. Treatment perfection and15% savings fail. `development_target_passed:false` and `campaign_goal_achieved:false` are correctly preserved. No failed outcome or assigned task was replaced or excluded.

## Recovery and discovery evidence

Treatment presented97 receipt-bound recovery pages in total, all matched as exact own-user messages with the expected recovery schemas. Recorded snapshot prefixes/fingerprints and page integrity were reconstructed from the immutable archive prefixes; listed handles, when present, were checked through native historical recovery. Discovery attempts match actual receipts and admitted prompt digests. Terminal attempts match their exact successful terminal packets. All delivered source bindings are mapped; withheld or tokenizer-only source is not promoted to terminal evidence.

There were **zero `list_recovery_page` or `recover_archived_read` tool calls** across the study. Thus this run tests the combined retention/discovery presentation but demonstrates no model use of paging or historical recovery. An available tool or a displayed index is not evidence that the model recovered omitted context. Recovery benefit cannot be inferred from aggregate quality or cost changes.

Treatment reminder counts are3,2,0,1; counts and successful-request bindings satisfy the maximum-three rule. This audit verifies reminder presence/count, not an independent full replay of every novelty counter or history-projection decision. Native deferral counts are preserved in the JSON. These bounded mechanism checks support evidence integrity, not a causal explanation of quality differences.

## Limits and Open Questions

This is one repetition of four already exposed development tasks, with matched compact representation and terminal review in both arms. It is not untouched confirmation, a full ContextBench result, benchmark-wide perfection, verified code repair or proof of a general retention benefit. The combined policy changes retention, available recovery and reminders together, so individual effects cannot be isolated. Capacity and cleanup are separate coordinator tasks; evidence remains intact for both.

Why did models never invoke recovery? Did shorter retained histories cause the file-recall losses, or did exploration diverge for other reasons? Can discovery improve source coverage without consuming the remaining efficiency margin? These require a separately frozen successor hypothesis, not task-specific gold hints or changed acceptance thresholds.
