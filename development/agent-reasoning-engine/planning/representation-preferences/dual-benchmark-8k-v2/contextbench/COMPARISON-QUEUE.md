# Fixed comparison queue and shared stop

Status: cooperative two-worker queue implemented; nine synthetic executor test groups pass. Independent review pending. No provider/evaluator calls or source clones.

[comparison-queue.mjs](comparison-queue.mjs) reconstructs the fixed schedule before work and before each slot. It assigns exactly twelve ordered slots to at most two active workers. A private shared AbortController propagates parent cancellation and infrastructure/accounting/provider/persistence failures to active executors. New slots do not start after cancellation. The exact shared signal is handed to each executor so it can construct the reviewed production factory and invoke the three-arm dispatcher with the same signal.

Known-cost model task failures remain recorded and do not themselves stop other slots. Provider failures, returned native_export_error/orchestration_error, explicit persistence failures, missing attempt evidence, unknown accounting or unresolved phase reservations stop scheduling. Initial independent review found that the old current-ARE runner can return native_export_error with healthy provider receipts; that concrete path now stops the queue and has a regression. This distinction preserves the comparison's assigned denominator without treating every unsuccessful model answer as infrastructure failure.

Every slot remains visible as returned, failed or not-started, with an explicit attempted flag. Returned raw results and attached exception evidence remain available in memory even when persistence fails. Plain exceptions without attached evidence mark accounting as requiring reconciliation. A persistence error never licenses a retry. Plan/start/outcome/terminal events require synchronous guarded persistence supplied by the caller; this module does not itself provide a durable store or disk quota.

The terminal event includes slot metadata rather than duplicating full raw results; full outcome events must be durably recorded by the eventual campaign adapter. The returned terminal object retains raw outcome evidence. All workers are awaited before terminal return. A terminal status of settled means all executors returned without a shared stop or persistence failure; it does not mean their tasks succeeded or their evidence is valid. Accounting remains pending, generation_sealed is false and benchmark_cleared is false.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-queue.test.mjs
```

Tests cover twelve-slot launch order and maximum concurrency two; failed provider cancellation of a held active peer with all twelve outcomes retained; continued evaluation after known-cost invalid model output; preservation of returned costs after outcome-write failure; pre-abort/initial-write failure with zero dispatch; final-write failure with all returned evidence attached; cancellation at the persisted start boundary before executor entry; and an infrastructure failure in the final slot still marking the queue incomplete even when all executors returned; and native export/orchestration/persistence return shapes stop scheduling despite healthy provider receipts.

## Product frontier and open questions

Coordinator owns the production campaign adapter, bounded persistence, durable all-family receipt reconciliation, immutable output seal and native scoring. Executors must cooperate with cancellation; this queue has no process-kill capability and makes no deadline guarantee for an executor that ignores the signal. Production transport deadlines and the outer process supervisor remain required. Finalization disk failure preserves evidence in the thrown object but cannot guarantee survival of a subsequent process crash; durable transport receipts and prior outcome events must be recovered and reconciled explicitly.

Live launch still requires exact reviewed freeze, real tokenizer qualification, native experiment continuity and D:/WSL admission; C: is excluded. Perfect scores, at least 15% savings against both comparators and untouched confirmation remain unproved. Release/deployment remain deferred residue.
