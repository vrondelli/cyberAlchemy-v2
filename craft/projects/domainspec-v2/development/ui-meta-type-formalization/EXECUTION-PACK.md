---
module: ui-meta-type-formalization
feature_code: UIF
status: completed-historical-superseded
updatedAt: 2026-07-17
docType: execution-pack
---

# Execution Pack: UI Meta-Type Formalization

> Historical execution choreography. New implementation work starts at
> [SWU-UIP-001](../ui-profile-implementation/work-pack/tasks/TASK-UIP-CONTRACT.md)
> and follows the sequential
> [Required UI Profile Execution Pack](../ui-profile-implementation/EXECUTION-PACK.md).

## Purpose

Schedule the layer-mapped waves. `WORK-PACK.md` and task files remain the source
of truth for SWU contracts.

## Control Fields

| Field | Value |
| --- | --- |
| planningGateStatus | complete-superseded - no further UIF execution selected |
| complexity | medium |
| baselineWave | W0 |
| activePlanRef | `../ui-profile-implementation/WORK-PACK.md` |
| workPackManifest | `WORK-PACK.md` |
| layeringArtifact | `IMPLEMENTATION-LAYERING.md` |
| specRef | `SPEC.md` |
| activeLayerWindow | L2 repair |
| readinessProfile | pilot |

## Wave Map

| Wave | Layer | Tasks / SWUs | Parallelization | Promotion evidence |
| --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | L0 | BASELINE / UIF-001..003 | sequential | Counterbalanced E0 produces reproducible result records. |
| [W1](work-pack/waves/W1.md) | L1 | LANES / UIF-004..006 | three disjoint lanes | All 11 labels receive provisional evidence. |
| [W2](work-pack/waves/W2.md) | L2 | ADJUDICATE, CANDIDATES, REPLICATE / UIF-007..010 | survivor authoring may fan out after adjudication | Candidate twins, round trip, portability, and adversarial review. |
| [W3](work-pack/waves/W3.md) | L3 | PACKET, VERIFY / UIF-011 + closure exemption | sequential | Authority-safe owner packet and recomposition audit. |

## Merge Rules

- W1 workers write only their assigned type fixture/result paths.
- Result records use one protocol version and join only through UIF-007.
- Validator helper changes are centralized in UIF-009 after candidate schema
  authoring; parallel type workers do not edit shared validator code.
- W2 disagreements remain evidence; the parent does not force convergence by
  deleting a minority result.

## Runtime Handoff

Use `task-session` with one SWU ID. Context Builder should select the parent task,
`SPEC.md`, `ARCHITECTURE.md`, `EXPERIMENTS.md`, relevant source contracts, and
only the assigned type lane. Subagent execution requires separate user approval
under the dispatch strategy.

## Current Frontier

W2 is complete with repair required. UIF-010's final auditor accepted the review
packet, but all nine candidates remain deferred. W3 is blocked until versioned
candidate repairs and a replication rerun produce an eligible survivor.
