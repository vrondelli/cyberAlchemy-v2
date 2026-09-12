# CRABS partial-knowledge move evidence candidate

Status: version 2 mechanism construction active under owner-directed native
execution. Authority effect: none.

This package implements the bounded EVF run described by
`../crabs-convergence-repair-candidate-v1/partial-knowledge-move-run-plan.md`.
It tests a three-replica ordered-set scenario in which two replicas move
different elements using incomplete knowledge.

The matrix contains 48 cases: two full-replica delivery histories, two move
version orders, six permutations of the fixed roles, and two merge
parenthesizations. The generator is the sole owner of this enumeration. The C
harness rebuilds every state from insert/move operations and never uses merge
as a clone operation.

## Version 2 execution

The reviewed version 1 inputs and legacy readiness outputs are preserved under
`construction/baseline-v1-reviewed/`. They remain historical evidence. Version
2 derives readiness only from current technical checks and has no Task Session
dependency.

Version 2 binds the repository GCC 15 toolchain epoch, current source and CBMC
bytes, supervises process lifetime and stream limits while children run,
retains per-merge before/after events, finalizes attempts durably, and
independently re-derives results from raw bytes.

```bash
tools/toolchain/run python3 run.py v2-freeze
tools/toolchain/run python3 run.py v2-execute --candidate-digest <digest>
tools/toolchain/run python3 run.py v2-recover
```

`v2-freeze` is single-use for the current immutable construction epoch. A
failed or drifted freeze is preserved and repaired through a numbered successor,
never overwritten. Each execution creates a fresh `evidence/attempts-v2/<run-id>` and
appends one terminal row to `evidence/runs-v2.jsonl`. The old
`validate-construction` and `execute` commands remain available only as v1
diagnostics against the preserved contract.

A PASS means only that no counterexample was found in the frozen 48 native
cases, matching sanitizer executions, and two actual-C CBMC representatives at
their declared bounds. It is not a general proof, product approval,
implementation acceptance, certification, publication, release, or deployment
authority.

## Open Questions

- The current CBMC 6.11.0 byte is bound from a temporary local installation;
  independent-host portability remains unresolved.
- General CRDT convergence, arbitrary identifiers and replica counts,
  allocation failure, serialization migration, and whole-library safety remain
  outside this candidate.
