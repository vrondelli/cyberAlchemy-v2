# Longer trajectory findings and recycler repair candidate

Status: stress campaign failed; no live admission or quality claim.

## New evidence

The repeated-read fixture charges each local model response the same simulated
input count used for tokenizer measurement. It requests twelve successive source
read rounds, while preserving original phase/call/model-token caps, all twelve
assignments, storage guards and reconciliation. These are controlled local HTTP
responses, not GLM behavior or provider tokenizer accuracy.

[Before repair](LONG-STRESS-OBSERVATION-R1.json), minimal-history completed all
four tasks at 14 calls and 64,400 simulated model tokens each. Current ARE stopped
after two calls; independent investigations stopped after four. Their error was
mandatory retained context exceeding the request envelope, not tokenizer or disk
exhaustion. All twelve results reconciled; none is a native benchmark score.

## Candidate repair and remaining failures

The additive current-ARE renderer now returns an unfit candidate to its existing
recycler instead of throwing before recycling. The recycler still measures and
enforces its strict 7000 threshold; the candidate grants no dispatch bypass.
Unfit projected bytes are not cached as accepted delivery.

Recycling may synthesize a read-only deferral notice. The archive writer now
checks the notice against the original durable result using the existing
deferral function. It stores the small notice plus a reference to the original
bytes. Five archive integrity tests pass, including exact derivation and
rejection of modified guidance.

[After this repair](RECYCLING-STRESS-OBSERVATION-R1.json), the first current-ARE
assignment reaches final selection. The full stress test still FAILS:
independent investigations retain too much earlier context, and the shared run
guard reaches its 24 MiB ordinary-write allowance during later assignments.
Writes stop safely; unstarted outcomes remain explicit.

A concurrent completion-write failure also produces different saved and returned
result representations. This is a separate exception-path limitation from the
previously repaired dispatcher decoration. Do not treat its raw result as a
reconciled complete run or erase unknown costs. The fixture now preserves the
original exception when result.json was never written; equality checking still
detects a differing result when the file exists.

## Revised task order

1. Preserve saved canonical results and separate failure metadata when completion
   or other final persistence fails; retain raw receipts and unresolved evidence.
2. Bound independent investigation history while retaining receipt-bound source
   archives and original phase budgets. Evaluate the quality effect rather than
   assuming reduced visible history helps.
3. Define an explicit bounded campaign storage allocation from measured artifact
   demand and available D:/WSL space. Consider the scope of each guard and further
   deduplication; no cap has been raised in this experiment.
4. Repeat the long stress test, then settle the fitting-budget policy against
   actual trajectories. Short-test tokenizer ratios alone did not identify the
   first limiting condition.
5. Review and freeze the composed candidate, register the prospective experiment,
   and compare the repaired and radical approaches under original criteria.

These findings refine structural/outcome contracts and budget-aware delivery in
[the native research DAG](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
Perfect native quality, at least 15% total-model-token savings, complete outcomes,
long trajectories and untouched confirmation remain required. No criterion was
weakened by the stress-test assertions.

Operational owner: benchmark orchestrator. Source fixtures are cleaned up.
D:/WSL admission and exact prospective review precede paid calls; publication and
release remain deferred.

## Open Questions

Persistence-failure result identity; independent branch retention; capacity
allocation and evidence duplication; tokenizer fitting reserve; independent
review; exact retrieval-first treatment and experiment registration.
