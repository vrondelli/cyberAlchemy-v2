# G02 fresh Flipt webhook matched pair: narrow four-gate pass

The fixed candidate was run on the next source-only-selected, untouched Flipt
Go task, `SWE-Bench-Pro__go__maintenance__bugfix__43d6d59b`, at base commit
`32864671f44b7bbd9edc8e2bc1d6255906c31f5b`. Unlike the preceding
`ui.enabled` task, this asks for a new webhook audit sink. ARE and DSH settled
cleanly; both predictions were [sealed](PAIR-PRE-SCORE-SEAL.json) before native
scoring. The [sealed-pair decision](verified-pair-r1/PAIR-DECISION.json)
rechecked identities, hashes, settled status, and complete known model cost.

| Arm | Span-F1 | File-F1 | Known model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE GLM treatment | 0.26500 | 0.54545 | 339,633 | 326.39 |
| DSH control | 0.25045 | 0.53333 | 447,753 | 332.99 |

All four strict gates pass. The gains are **narrow**: +0.01455 Span-F1,
+0.01212 File-F1, 24.15% fewer known model tokens, and 1.98% less wall time.
Absolute quality is low. This is a second untouched one-task replication of
the frozen G02 candidate, not a complete ContextBench campaign or proof of
substantial gains across the benchmark objectives.

The fixed selector inferred no active named component, added four confirmed
focused reads, and dropped none. The [raw model prediction](model-prediction.json)
scored Span/File-F1 `0.24346`/`0.63158`; the
[selected prediction](candidate-prediction.json) scored `0.26500`/`0.54545`.
Thus the selector raised span coverage enough for the strict Span-F1 gate but
reduced File-F1 materially. The first pair had the opposite direction of
tradeoff. Keep both views in subsequent tests; do not claim that selector
improves both metrics reliably.

The [freeze](FRESH-PAIR-FREEZE.json) and [source-only task](source-only-task.json)
bind the unexposed input. The [ARE seal](ARE-PRE-SCORE-SEAL.json),
[selector receipt](selector-receipt.json), [ARE result](RESULTS.json),
[DSH export](dsh-EXPORT.json), [ARE settlement](SETTLEMENT.json), and
[DSH settlement](dsh-SETTLEMENT.json) support the pair decision. The ARE
[receipt archive](are-receipts.tar.gz) SHA-256 is
`052dcab1aaff83b85b14125d19f94d72b43f665d73e9e8c8f701602b0dfad4ec`.
The DSH [receipt archive](dsh-receipts.tar.gz) SHA-256 is
`5d2b5286ded6f3edf3656f6a755f62fe21579a403c0b9195a1232442f658be52`;
it contains transport/tool receipts and run metadata, not source checkouts,
session state, or secret files. An initial broader DSH archive was discarded
and replaced by this scoped one.

## Open Questions

- Will these small comparative gains survive a predeclared multi-repository
  cohort, rather than more single Flipt tasks?
- Can the focused selector avoid trading File-F1 for Span-F1 on new-feature
  tasks while preserving the preceding pair's file-coverage gain?
- Which next benchmark objective offers the largest remaining accuracy gap?
