# Final persistence result preservation

Status: additive repair candidate; ten integration tests and one storage-failure
regression pass. The full stress campaign still fails for other reasons.

## Change

Each prepared runner constructs a detached JSON result with both receipt
families before saving. After the guarded write returns, it verifies the stored
bytes against that snapshot. If a later completion write fails, the exception
carries this exact canonical result, while failure metadata remains on the
exception. The queue records a failed outcome and stops; it does not reinterpret
the saved selection as a completed run.

If no verified durable snapshot exists, the runner retains its explicit
orchestration-failure outcome. Both receipt families remain available; unknown
usage and missing completion evidence are not converted into zero cost or
successful reconciliation. No frozen experiment sources were edited.

## Verification

The real prepared-runner suite passes ten tests. It includes completion-write
failure in each arm, canonical equality, retained known usage, unreconciled
missing artifacts, provider failures, healthy twelve-assignment completion,
and a pre-dispatch client-creation failure with empty receipt families.
The historical dispatcher defect remains reproduced by a negative regression.

The longer stress regression reproduces actual ordinary-stage storage
exhaustion under the unchanged guard. Saved/returned equality no longer fails;
incomplete outcomes and unresolved cost remain visible. Its test passes because
it verifies failure handling, not because the stress campaign completes.
[Retained stress evidence](FINAL-PERSISTENCE-STRESS-R1.json) records six attempted
and six unstarted assignments, including independent-history overflows and
storage failure. No GLM/provider or native evaluator calls occurred.

## Remaining construction work

Independent investigations still accumulate too much visible history. Current
ARE now recycles and completes a fourteen-call fixture, but its run artifacts
occupy roughly 11.5 MB for that task; the twelve-assignment shared 24 MiB
ordinary-write allowance is insufficient. Next: explicit branch-retention policy
and bounded campaign storage allocation, then full long stress and fitting-budget
assessment. A different storage allowance must be prospectively declared with
D:/WSL headroom checks; no cap was raised here.

These are shared harness repairs under
[the native research follow-up](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
They do not establish either memory hypothesis or benchmark quality. Perfect
native quality, at least 15% total-model-token savings against fresh controls,
complete outcomes and untouched confirmation remain required.

Operational owner: benchmark orchestrator. Exact source freeze, independent
review and prospective experiment registration precede paid runs. Publication
and release remain deferred.

## Open Questions

Independent branch history and budgeted finalization; campaign artifact demand
and storage allocation; tokenizer fitting reserve; independent review and
retrieval-first experiment design. A partial/uncertain result write is not
claimed durable merely because a file exists.
