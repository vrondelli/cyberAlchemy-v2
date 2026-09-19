---
module: saga-removal
feature_code: SGRM
status: completed
updatedAt: 2026-07-11
docType: execution-pack
---

# Execution Pack: Saga Removal

## Execution Rule

Execute one SWU at a time. Parallel execution is disabled because authority,
schema, fixture, validator, and plan references overlap semantically even where
their paths differ.

## Wave Order

| Wave | Layer | SWUs | Promotion gate |
| --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | L0 | SGRM-001 | Migration packet and live manifest approved. |
| [W1](work-pack/waves/W1.md) | L1 | SGRM-002, then SGRM-003 | Canonical authority migrated; scope rule support green. |
| [W2](work-pack/waves/W2.md) | L2 | SGRM-004, then SGRM-005 | No active Saga implementation file; focused/full tests green. |
| [W3](work-pack/waves/W3.md) | L3 | SGRM-006, SGRM-007, SGRM-008 | Current guidance and read models agree; zero-active audit passes. |

Current position: SGRM-001..008 are complete; the execution route is closed.

SGRM-003 may begin after SGRM-001, but the default choreography keeps it after
SGRM-002 to reduce concurrent interpretation drift. The refreshed SGRM-002
boundary includes one validator-consistency bridge: clear only the legacy Saga
schema's `edge_participation.source_of` field while root authority changes.

## Receipt Contract

Each run returns:

    swu_id: SWU-SGRM-NNN
    result: pass | flag | block | interrupted
    capability_ref: task-session | local-fallback | definitions-governance
    receipt_kind: native-stage | subagent | local-fallback | blocked
    receipt_artifact: path or none
    files_touched: []
    validation: []
    blockers: []
    residue: []
    reroute: next owner or none
    handoff_note: coordinator continuation note

## Stop Conditions

- any attempt to delete historical evidence;
- missing SGRM-001 receipt before authority mutation;
- external consumer evidence without a compatibility decision;
- DS-D1 ID renumbering;
- orchestrates removal instead of Workflow migration;
- unsupported criterion rules being skipped rather than rejected/tested;
- full validation failure outside the active SWU write scope.
