# Intent-schema live population work-pack

Work-pack ID: `WP-INTENT-SCHEMA-001`

Status: planned; blocked until `g4-evidence-mechanics` passes.

Complexity: medium because the selected run owns multiple evidence artifacts and
a held-out boundary. Output mode: split work-pack with one task-local SWU and one
layer-mapped execution wave.

## Objective

Execute one source-locked 12+3 population run against the unchanged candidate
intent schema, return descriptive field evidence and residue, and stop before
the operator/intent-contract owner selects any field.

## Approved source design

- [`SPEC.md`](SPEC.md)
- [`CLAIM-BOUNDARY.md`](CLAIM-BOUNDARY.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`PROTOCOL.md`](PROTOCOL.md)
- [`METRICS.md`](METRICS.md)
- [`../../spec/INTENT-RECORD.md`](../../spec/INTENT-RECORD.md)
- [`IMPLEMENTATION-LAYERING.md`](IMPLEMENTATION-LAYERING.md)

## Delivery slice

One slice only: `SLICE-INTENT-LIVE-001`. It begins after the mechanics receipt
passes and ends with a terminal Task Session receipt plus a result eligible for
g6 review. It performs no schema repair, owner selection, promotion, or source
mutation.

## Task board

| Task | Layer | Status | Dependency | Contract |
|---|---|---|---|---|
| TASK-INTENT-POPULATION-001 | L1 | planned | passing `s5-evidence-mechanics` receipt | [`work-pack/tasks/TASK-INTENT-POPULATION-001.md`](work-pack/tasks/TASK-INTENT-POPULATION-001.md) |

## Smallest Working Unit manifest

| SWU | Parent task | Primary behavior | Status | Owner | Verification |
|---|---|---|---|---|---|
| [`SWU-INTENT-001`](work-pack/tasks/TASK-INTENT-POPULATION-001.md#swu-intent-001--execute-one-frozen-123-population-run) | TASK-INTENT-POPULATION-001 | Produce one complete source-locked population/holdout evidence run under unchanged rules. | selected, planned | Task Session local fallback | validator command plus manifest/metric checks |

Only `SWU-INTENT-001` is selected. No worker may widen execution to schema
selection or engine implementation.

## Wave map

| Wave | Layer question | Task/SWU | Gate | Contract |
|---|---|---|---|---|
| W1-LIVE | Does the unchanged L0 mechanism survive one bounded live local corpus? | TASK-INTENT-POPULATION-001 / SWU-INTENT-001 | g5-live-population | [`work-pack/waves/W1-LIVE.md`](work-pack/waves/W1-LIVE.md) |

## Validation strategy

1. Verify the mechanics receipt and pass/fail fixtures.
2. Freeze exactly 12 population and 3 holdout entries with file/excerpt hashes.
3. Run the unchanged validator over all live JSONL rows.
4. Check evidence/inference/unresolved invariants and unique manifest cardinality.
5. Compute the metric contract directly from valid rows.
6. Review the result against `CLAIM-BOUNDARY.md`.
7. Return a terminal receipt with hashes, commands, blockers, residue, and g6 as
   the next owner.

## Blockers and gaps

| ID | Type | Owner | Closure |
|---|---|---|---|
| BLK-INTENT-MECHANICS-001 | sequence blocker | research-evidence-harness | `s5` receipt proves passing/failing fixture behavior before the live run. |
| GAP-INTENT-ANNOTATION-001 | non-blocking evidence gap | future experiment owner | A one-author run does not measure inter-rater consistency. |
| GAP-INTENT-SAMPLE-001 | non-blocking scope gap | owner selection gate | Fifteen local records do not establish universal schema fitness. |

## Current state and next move

- Active layer: waiting for L0 mechanics.
- Selected unit: `SWU-INTENT-001`.
- Next move: research-evidence-harness creates and validates mechanics; Task
  Session then executes only the selected SWU.
- Stop: g6 requires a fresh operator plus intent-contract-owner selection based on
  the result. Prior execution authorization is not a data-dependent field choice.

## Expected Task Session result

```yaml
swu_id: SWU-INTENT-001
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: local-fallback
receipt_artifact: receipts/intent-schema-live-run.json
files_touched:
  - experiments/intent-schema/runs/2026-07-22-intent-schema-01/
validation:
  - command and result records
blockers:
  - blocker or none
residue:
  - unresolved evidence
reroute: g6-schema-selection | repair-owner | none
handoff_note: bounded result for the parent coordinator
```
