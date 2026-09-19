# Independent scientific closeout review

Disposition: the reviewed scientific findings support continued candidate development, not live admission or campaign completion. No candidate provider calls were made by this review. No frozen v1 artifacts were edited. This is an independent review of the coordinator's research interpretation and ContextBench orchestration; the reviewer authored the LongMemEval runner and does not claim independent review of that implementation.

## Scientific claims

The [plan](PLAN.md), [research generator](research.mjs), hypotheses and continuity retain the original small-window reasoning objective, separate benchmark metrics, per-request 8,000 admission, cumulative input/output costs and the 15% target. Every assigned outcome remains in its denominator. Perfect scores are explicitly scoped to evaluated outcomes; development success cannot establish full-benchmark perfection or independent semantic truth from a judge label. Untouched confirmation remains required. The stored continuity validator reports eight checked hypotheses, `ok:true`, and no authority effect; this is structural continuity verification, not experiment authorization.

The [offline observations](offline-observations.json) correctly classify all three mechanism observations as `inconclusive`, with zero supporting counts and zero executed planned live experiments. Receipt replay supports structural provenance/export compatibility; it does not demonstrate a model's choices. The proposed discovery ledger and input policy are research candidates, not empirically supported improvements. Selecting them for study is distinguished from confirming them. No hidden perfect-score or successor-quality claim was found in these artifacts.

The [token analysis](contextbench/TOKEN-ANALYSIS.md) arithmetic checks: floor(626,119 × 0.85) is 532,201, leaving 35,001 tokens to remove from observed treatment cost. All terminal calls total only 28,811. That bound applies to changing those calls on the fixed trajectories; it cannot rule out broader downstream effects from an earlier intervention. The document states this limitation and does not call deleting predictions a successful treatment. Input is 95.946% of observed treatment cost; the receipts do not support attributing that input to individual prompt components without further analysis.

The [representation ceiling](contextbench/REPRESENTATION-CEILING.md) is appropriately restricted to five outcome-selected failed archives across three task identities, provenance-valid whole reads and native byte-span scoring. The upper bound and gold-pure union witness distinguish reachable evidence from model selection. It is neither a future-trajectory bound nor proof that representation granularity is universally harmless. Gold is confined to the evaluator subprocess, with no source locations or witness identifiers exported to candidates. The offline result motivates testing discovery; it does not establish the proposed discovery mechanism. Generalization, complete-request admission and token costs remain outside that mathematical ceiling.

## Implementation review and remaining findings

The two [orchestration tests](contextbench/orchestrate.test.mjs) exercise real isolated fixture clones, four-source export, receipt-bound terminal review and reconstruction from persisted snapshots. This is stronger evidence than a schema-only probe, but remains a simulated-client integration test. [Episode instrumentation](contextbench/episode.mjs) distinguishes admitted attempts from dispatched receipt-bound attempts and correlates request hashes to the matching model receipt, including the generation-error path. An admitted attempt without a receipt must remain unknown, not be counted as a completed selection.

Two findings remain gates as of this review:

1. **ContextBench persistence errors can still discard in-memory accounting.** In [orchestration](contextbench/orchestrate.mjs), journal append in the error handler, recycler/journal closure and final result writes may throw after provider work. The thrown error does not consistently attach the episode result and client receipt ledger. Before live dispatch, preserve the in-memory ledger/result on these exceptions and independently test persistence failure after known model usage. Parent failure capture must retain unknown usage explicitly rather than reporting partial known sums as exact. This is the same class of issue already addressed in the v2 LongMemEval adapter.
2. **The generated work DAG lags the updated scientific order.** [research.mjs](research.mjs) still generates `R → I → F → P → T` without the plan's archive/token-audit and concrete discovery/input-selection gates. Update the native DAG and continuity task references so a full ContextBench freeze depends on those decisions. Keep the independently reviewable LongMemEval scope diagnostic separate. The continuity text also still lists terminal episode integration as pending; distinguish implemented offline integration from outstanding live admission.

These findings do not invalidate the retrospective mathematical or receipt analyses. They prevent interpreting a passing implementation suite or structural continuity check as authorization for the next full live cohort. The coordinator reported 102 passing offline tests; this review inspected the relevant test logic and arithmetic and did not rerun the full suite without a new testable concern.

## Actionable next order

1. Align the generated research DAG with the reviewed plan and preserve accounting through ContextBench persistence failures.
2. Attribute earlier repeated-input cost without gold, choose one concrete discovery or input/stop intervention, and specify competing explanations and failure conditions. Do not combine untested mechanisms and attribute the outcome to one of them.
3. Independently freeze the bounded LongMemEval scope-policy diagnostic if desired: four source-bound paired tasks, generation ceiling 64,000, a separately frozen native-judge budget and blind answer mapping. Its costs and conclusions remain diagnostic, not whole-trajectory efficiency evidence.
4. Freeze exact full-task manifests, treatment policies, model/prompt/source/scorer hashes, measured complete-request admission, all-call and judge budgets, failure-ledger handling, host-disk reservations and cleanup evidence before a ContextBench canary. Begin with two workers per benchmark; consider four only after measured health and known usage.
5. Score every planned slot and all known/unknown costs. Advance to untouched long-task confirmation only after scoped quality, completion and efficiency gates pass. Retain negative results and the active unmet campaign objective.

## Open questions

Which earlier input component can be reduced without inducing compensating calls? Which public-evidence discovery policy increases delivered relevant source under 8K? Does generic preference scope guidance improve replicated correctness without damaging other answers? Can the parent durably preserve accounting when the primary result journal fails? These remain unresolved and are not replaced by the offline tests or archive ceilings.

## Coordinator resolution after review

Both implementation findings are resolved. The ContextBench orchestrator now
preserves the original error, in-memory result and native receipts through
append, result-write and cleanup failures; it attaches an exact usage aggregate
only when usage is known. Unknown usage remains explicit. Export errors clear
the export and completion disposition. Six targeted orchestration tests pass.

The generated DAG now includes U (archive/token ceiling audit) and E (selection
and implementation of a bounded discovery/input ablation) before the dual-run
freeze. It also represents the independent LongMemEval review, execution,
judging and successor path. Continuity text distinguishes completed offline
integration from the remaining live work. Native continuity verification passes.

The complete offline suite passes 106 tests. Eight real LongMemEval tokenizer
checks also passed; the maximum complete input plus output reserve is 3,748.
No successor answer-generation or judge calls have occurred. Exact live
manifests, source freezes, judge budgets, parent failure-journal integration and
review of the selected discovery/input treatment remain gates. This closeout
accepts candidate engineering and diagnosis, not benchmark clearance.
