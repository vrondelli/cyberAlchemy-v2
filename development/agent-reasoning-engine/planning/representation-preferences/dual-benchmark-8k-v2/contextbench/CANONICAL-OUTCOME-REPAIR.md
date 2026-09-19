# Canonical comparison outcome repair

Status: additive candidate; 14 offline tests pass. Independent review and
successor production composition remain pending.

The old dispatcher added provider-health fields after the runner saved its
result. This made sealed outcomes differ from durable results on failure.
The new dispatcher preserves complete executor results as detached snapshots.
The queue and accounting code already derive provider health from raw receipts.

Incomplete summaries remain explicitly synthetic and require reconciliation.
Available client receipts and unknown-cost reservations survive. No actual
source, receipt, result, or persistence mismatch is excused by the repair.

## Evidence

[The test receipt](CANONICAL-OUTCOME-TEST-R1.json) binds five candidate/test files
and the retained test output. It is not a complete dependency freeze.

Nine unit tests cover preservation, routing, missing summaries, cancellation and
exception costs. Five integration tests use the real runner, loopback transport,
temporary Git repository, persistence, outcome seals and reconciliation:

- Unknown model usage stops the queue, retains unstarted assignments and reserves
  unknown cost without changing the saved result.
- Index-tokenizer failure retains preceding known model spend.
- All twelve healthy fixture assignments persist and reconcile.
- Failed result persistence remains incomplete with retained attempt evidence.
- The original dispatcher reproduces the saved-result mismatch on the same path.

The fixture sends local HTTP requests; it uses no external model or native
benchmark evaluator. These results do not measure GLM quality or token savings.
Temporary fixture repositories are removed by test cleanup.

## Research and construction boundary

This addresses the structural-and-outcome-contracts task in
[the native research follow-up](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
Frozen experiments and original dispatch remain unchanged. The new dispatcher
still selects the old compact episode; structural planner composition is pending.

Runnable product work: aggregate source-output admission, then composition with
the structural planner and exact retrieval-first experiment definition.
Operational owner: benchmark orchestrator. Before live dispatch, freeze the full
dependency closure, review exact launch evidence, and enforce the existing
D:/WSL storage guard. Publication and release remain deferred and unauthorized.

## Open Questions

Independent candidate review; aggregate delivery limits and pagination;
composition with planner-v2; exact archive/retrieval ablation; prospective
experiment registration and launch review. The full perfect-quality, 15% total
token savings, and untouched-confirmation requirements remain unchanged.
