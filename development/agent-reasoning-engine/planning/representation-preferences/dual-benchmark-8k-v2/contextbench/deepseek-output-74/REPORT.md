# Round 74: larger output allowance at 1M context

All eight assigned runs settled. Both harnesses used GLM-5.3-flash with a configured 1,000,000-token context capacity and an 8,192-token output allowance. This was a four-task exposed ContextBench pilot, not a full benchmark or a near-limit context-retention test.

ARE produced 2/4 valid scored selections; DSH produced 2/4. Round 73 had ARE 2/4 and DSH 1/4 with a 2,048-token output allowance. These single-run historical differences do not isolate causality.

## Per-task results

F1 measures overlap with reference files or source spans; higher is better. It does not establish that a code repair passes tests. Failed outcomes remain in the assigned cohort.

| Task | Harness | Valid scored selection | Span F1 | File F1 | Known model tokens | Unknown-usage calls |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ARE | Yes | 0.00% | 0.00% | 208,741 | 0 |
| 1 | DSH | No | — | — | 380,058 | 0 |
| 2 | ARE | No | — | — | 54,183 | 1 |
| 2 | DSH | No | — | — | 37,280 | 1 |
| 3 | ARE | Yes | 53.67% | 80.00% | 240,586 | 0 |
| 3 | DSH | Yes | 51.25% | 80.00% | 307,103 | 0 |
| 4 | ARE | No | — | — | 371,084 | 0 |
| 4 | DSH | Yes | 4.67% | 16.67% | 441,105 | 0 |

## What the evidence supports

Known token lower bounds are **874,594 for ARE** and **1,165,546 for DSH**. Unknown-usage paid calls: ARE 1, DSH 1. Exact aggregate totals and the savings percentage are unavailable. The 15% quality-preserving savings target is not established.

Both task-two arms failed without complete usage. ARE explicitly records a 120,000 ms deadline, reached after 120,007 ms. DSH recorded a generic transport failure approximately 120 seconds after the request; this is consistent with its configured deadline, but does not prove the provider-side cause. See [deadline audit](DEADLINE-AUDIT.json).

DSH task three progressed from an output-cap failure in round 73 to a completed run in round 74. This is consistent with output headroom helping completion on this exposed sample; a single historical comparison does not isolate that cause. Completion must be interpreted alongside quality scores and costs. Comparing different valid-only cohorts would be misleading.

On task three, the only paired valid result, ARE used 240,586 tokens versus DSH 307,103: **21.66% fewer**. ARE Span F1 was **53.67% versus 51.25%**, and both File F1 scores were **80%**. This exceeds the savings target on one exposed task only; it is not a cohort or generalization result.

DSH task one exited successfully but its source selection failed `dsh-wire.selected-source-not-delivered-or-invalid`. ARE task four ended in `history-projection.pending-content-conflict` after 87 calls. Process exit success alone is not benchmark success. These failures require evidence and state-handling audits before broader paid confirmation.

## Verification and limits

Eight offline tests passed before paid dispatch. All eight ledgers reconcile, including unknown-usage calls. The generation freeze was verified before export. The unchanged native evaluator scored only valid exports with complete per-arm accounting. Postprocessing was adjusted to preserve unknown totals rather than treating incomplete usage as zero; synthetic complete/incomplete summary checks passed. No generation policy was changed during the run.

Maximum observed input tokens: ARE 8,629; DSH 34,760. Configured 1M capacity does not demonstrate retention or provider behavior near 1M.

New tool-call-array diagnostics captured 0 failure shapes. Absence of a captured failure does not prove the older malformed-response issue is fixed. Historical evidence and acceptance policy are preserved in [tool-call audit](TOOL-CALL-AUDIT.md).

Full source clones and sessions remain on the VPS. Only bounded review evidence is copied locally. No new paid successor, production promotion, commit, or publication was performed.

## Decision and next DAG

Keep this result as a completed diagnostic pilot. Do not declare the context benchmark cleared or either harness generally superior. The next candidate hypothesis is whether a matched longer response deadline restores complete outcomes at the same output allowance. Audit timeout semantics, register competing hypotheses, test, freeze, run the failed pair once per harness, reconcile usage, score, and review before broader confirmation. See [candidate successor DAG](NEXT-HYPOTHESIS.md).

The enduring objective remains reusable reasoning quality and continuity with at least 15% fewer cumulative input plus output tokens without quality loss. The original GLM and 8K qualification remains a separate research milestone; this full-window comparison does not replace it.

## Evidence

[Results](RESULTS.json), [historical and paired comparison](COMPARISON.json), [accounting verification](evidence/ACCOUNTING-VERIFICATION.json), [prospective native research records](NATIVE-RESEARCH.json), [completed research records and DAG](RESEARCH-RESULT.json), [postprocessing review](POSTPROCESSING-REVIEW.json), and [prospective plan](PLAN.md).

## Open questions

- Does a longer matched deadline restore responses, or merely postpone stalls?
- Can authoritative provider records recover missing paid usage?
- Does better completion also improve useful quality per token on untouched tasks?
- What explains the historically malformed tool responses?
- How do these mechanisms behave under actual 8K context pressure?
