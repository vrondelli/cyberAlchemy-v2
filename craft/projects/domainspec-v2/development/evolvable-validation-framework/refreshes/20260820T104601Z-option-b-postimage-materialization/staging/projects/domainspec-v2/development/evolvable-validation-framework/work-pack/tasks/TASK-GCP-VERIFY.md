---
taskId: TASK-GCP-VERIFY
layer: L0
slice: S1
status: acceptance-facet-blocked-on-execution
complexity: medium
---

# Task GCP Verify

## Objective

Independently replay the selected S1 raw bytes, check denominator, execution,
mutant, receipt, and digest continuity, and close E/P/O/T without changing
source authority. This is an acceptance facet of `SWU-GCP-001`, not a second
selectable task.

## Acceptance Boundary

An independent verifier rehashes every source and result, proves O_gen equals
O_spec, verifies exactly one test/child-result identity with two ordered runtime
observations, kills 16/16 mutants, rejects receipt tamper/omission, and either
agrees with the non-admitting verdict or records a typed discrepancy.

## Dependency

The eligible inputs are the exact executor result and all source/output refs
from the same admitted `SWU-GCP-001` attempt. The verifier writes no positive
receipt until terminal `verify:evf-s1` passes the complete vector.

The verifier closes the EVF core receipt on its own evidence and produces P for
the prescribed Invoke O join and final Task Session T. When a fresh
`SWU-IOLM-DSC-A` receipt exists, verify its exact upstream handle, run identity,
raw hashes, posture, parity/overlay negatives, and non-admission claim as a
separate result. A missing or blocked IOLM receipt prevents only the combined
real-application claim; it cannot downgrade or upgrade the EVF core verdict.

The acceptance is non-admitting: it does not change relationship/profile
authority, promotion, release, publication, deployment, or production state.
