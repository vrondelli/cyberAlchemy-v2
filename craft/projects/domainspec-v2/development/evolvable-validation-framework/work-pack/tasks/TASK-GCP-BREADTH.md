---
taskId: TASK-GCP-BREADTH
layer: L3
slice: S4
status: blocked-on-L2
complexity: high
---

# Task GCP Breadth

## Objective

Connect the proven composability spine to the existing backend-type-test-engine
completeness lane, then add independent IOLM and Body War/Craft consumer proof.

The narrow `SWU-IOLM-DSC-A` receipt belongs to the earlier L0C sibling lane and
proves only consumption of the single EVF core handle. L3 requires a different,
fresh `SWU-IOLM-DSC-B` receipt over the green BTE core handle; the narrow receipt
cannot satisfy the breadth consumer gate.

## Dependency And Boundary

Blocked until L2. The broad package remains the owner of exact 13 backend kinds,
16 backend signatures, mutation evidence, and consumer denominators. This task
must not duplicate or redefine that authority.

BTE closes its core before either external consumer runs. IOLM and Body War own
their runs; BTE validates returned handles and may not author or substitute
consumer evidence.
