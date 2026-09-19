# EVF L1 Task Session Closeout Contract

## Owner Contracts

| Contract | Exact source | SHA-256 | Size |
| --- | --- | --- | --- |
| Work Pack execution entry | `.agents/skills/implementation-readiness/schemas/work-pack-execution-entry.schema.json` | `590ae89737be77eafbbe9ae7de4669ca7e36659efdad3bb0e17c675a885788bc` | 5328 |
| Execution-entry validator | `.agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py` | `808d22082ad15efd10721c1eb0da2c5edab85e5f0d4ad2dce76e9a12b26fed9a` | 7924 |
| Task Session owner contract | `.agents/skills/task-session/SKILL.md` | `8e203213e906995c98f3b0e96d216f84248117043e2802b47c0e1b1a6af5595d` | 45566 |
| Precloseout source receipt schema | `.agents/skills/task-session/schemas/precloseout-execution-receipt.schema.json` | `2ea1dba781010059f0819f9aece1886685c230db33dc1d205601ebeafe2cdd02` | 6001 |
| Final terminal receipt schema | `.agents/skills/task-session/schemas/governance-terminal-receipt.schema.json` | `636a917ab05ee4595cb751d61f847c6fc6afc4be1e2e322473648471ddb8e362` | 11630 |
| Invoke Refresh owner receipt schema | `.agents/skills/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json` | `527970e0e98977215edd4729cdcfd638d9d47824c96e6b98bf8130ead2721e41` | 6553 |

Any drift blocks before mutation or closeout and requires a fresh contract
review. Exact source and result target paths are additionally bound by
`target-inventory.l1.json` and `validation-contract.l1.json`.

## Pre-Mutation Preflight

For the selected unit, Task Session must bind:

1. applied Work Pack, execution entry, inventory, validation contract, and
   independent review/owner acceptance receipts;
2. exact selected decisions and semantic ceilings;
3. every present baseline digest or explicit absence proof;
4. dirty-worktree overlaps and surgical adoption/exclusion decisions;
5. source receipt, owner receipt, and terminal receipt paths/schemas;
6. deterministic successor rule and a guarantee that no successor runs in the
   same attempt.

Any stale, missing, expanded, contradictory, public/private-boundary-changing,
or authority-changing input blocks before product/source mutation.

## Receipt Topology

For each SWU:

```text
executor receipt E
  -> Task Session precloseout source receipt P
  -> Invoke Refresh owner receipt O
  -> Task Session terminal receipt T
  -> continuity cursor
```

No receipt may validate its own future bytes or substitute project evidence for
P, O, or T.

### SWU-GCP-002-P4

| Role | Exact path | Owner |
| --- | --- | --- |
| E | `projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-002-P4/attempt-001/executor-receipt.json` | Task Session executor |
| P | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/results/SWU-GCP-002-P4-PRECLOSEOUT-EXECUTION-RECEIPT.json` | Task Session |
| O | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/closeout/SWU-GCP-002-P4-REFRESH-RECEIPT.json` | Invoke Refresh |
| T | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/results/SWU-GCP-002-P4-TASK-SESSION-RESULT.json` | Task Session |

Successor: on terminal PASS and current digests, expose R4 as selection-ready,
emit a cursor, and stop. Otherwise no successor is selected.

### SWU-GCP-003-R4

| Role | Exact path | Owner |
| --- | --- | --- |
| E | `projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-003-R4/attempt-001/executor-receipt.json` | Task Session executor |
| P | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/results/SWU-GCP-003-R4-PRECLOSEOUT-EXECUTION-RECEIPT.json` | Task Session |
| O | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/closeout/SWU-GCP-003-R4-REFRESH-RECEIPT.json` | Invoke Refresh |
| T | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/results/SWU-GCP-003-R4-TASK-SESSION-RESULT.json` | Task Session |

Successor: on terminal PASS and current digests, route to independent composite
verification, emit a cursor, and stop. No C0 or provider route is selected.

## Admitted Closeout Deltas

- `evidence_added`
- `blocker_opened`
- `blocker_resolved`
- `status_changed`
- `route_changed`

Closeout may touch only the exact per-unit closeout targets in the inventory. It
cannot implement or run another SWU, alter semantics/authority, promote,
publish, deploy, perform destructive cleanup, accept policy/cost/risk, or touch
an undeclared target.

## Owner Validation

- Validate P/O/T artifacts against current schemas and exact route bindings.
- Rehash every closeout target before Invoke owner dispatch and before T.
- Require all acceptance-critical commands and first-failure status to be bound.
- Require exact changed-path equality with the unit's inventories.
- Require the P4 closeout to preserve a bounded P4 claim and the R4 closeout to
  preserve a pure-decision claim.
- Require each terminal receipt to state that no successor executed.
