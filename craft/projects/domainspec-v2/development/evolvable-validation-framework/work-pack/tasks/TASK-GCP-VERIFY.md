---
taskId: TASK-GCP-VERIFY
layer: L1-L3
slice: S1-S4
status: ready-after-proof
complexity: medium
---

# Task GCP Verify

## Objective

Independently replay each completed slice, check residue and digest continuity,
and close the evidence handoff without changing source authority.

## Acceptance Boundary

An independent verifier can locate the source anchors, rerun the declared checks,
and agree with the receipt verdict or record a discrepancy.

## Dependency

The first eligible input is the receipt from `SWU-GCP-001`; later slices remain
blocked until their own receipts exist.

The verifier closes the EVF core receipt on its own evidence. When a fresh
`SWU-IOLM-DSC-A` receipt exists, verify its exact upstream handle, run identity,
raw hashes, posture, parity/overlay negatives, and non-admission claim as a
separate result. A missing or blocked IOLM receipt prevents only the combined
real-application claim; it cannot downgrade or upgrade the EVF core verdict.
