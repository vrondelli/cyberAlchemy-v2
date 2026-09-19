# SWU-GCP-001 Task Session Closeout Contract Proposal

## Owner Contracts

| Contract | Exact source | SHA-256 |
| --- | --- | --- |
| Work-Pack execution entry | `.agents/skills/implementation-readiness/schemas/work-pack-execution-entry.schema.json` | `590ae89737be77eafbbe9ae7de4669ca7e36659efdad3bb0e17c675a885788bc` |
| Execution-entry validator | `.agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py` | `808d22082ad15efd10721c1eb0da2c5edab85e5f0d4ad2dce76e9a12b26fed9a` |
| Task Session owner contract | `.agents/skills/task-session/SKILL.md` | `558c40e0f6e7cce5ae02cd32307c35d8a6bf89d592008474827d2d7ac1d1ff05` |
| Precloseout source receipt | `.agents/skills/task-session/schemas/precloseout-execution-receipt.schema.json` | `2ea1dba781010059f0819f9aece1886685c230db33dc1d205601ebeafe2cdd02` |
| Governance run request | `.agents/skills/task-session/schemas/governance-run-request.schema.json` | `865e58ec48a4e2ebf009282fa7411220c265949ae7c52a9e9c638e96a103ed07` |
| Final terminal receipt | `.agents/skills/task-session/schemas/governance-terminal-receipt.schema.json` | `636a917ab05ee4595cb751d61f847c6fc6afc4be1e2e322473648471ddb8e362` |
| Invoke Refresh owner receipt | `.agents/skills/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json` | `527970e0e98977215edd4729cdcfd638d9d47824c96e6b98bf8130ead2721e41` |

Any digest drift invalidates this proposal and requires revalidation before Task Session admission.

## Pre-Mutation Preflight

Before the first product/source write, Task Session must bind:

1. exact selected decision option and claim ceiling;
2. exact existing/create material inventory, each current present digest or absence proof, owner, allowed delta, and output class;
3. structured validation contract and digest, including the failure matrix and exact commands;
4. source receipt schema and path;
5. closeout target inventory plus baseline digests;
6. allowed closeout delta classes;
7. expected Invoke owner receipt path/schema and owner validation;
8. final Task Session terminal receipt path/schema;
9. continuation policy and unique-successor result;
10. current strict Context Builder pack/index and mutation-admission receipt.

An absent, stale, expanded, contradictory, or authority-changing input blocks before mutation.

## Receipt Topology

`Executor receipt (E) -> Task Session precloseout source receipt (P) -> joined Invoke Refresh owner receipt (O) -> final Task Session terminal receipt (T) -> continuity cursor`.

| Role | Exact path | Owner | Schema |
| --- | --- | --- | --- |
| E | `projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-001/attempt-001/executor-receipt.json` | Task Session executor | Task Session executor receipt selected at admission |
| P | `arcanum/arcana/task-session/development/work-packs/evf-s1-one-shot/results/SWU-GCP-001-PRECLOSEOUT-EXECUTION-RECEIPT.json` | Task Session | `arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json` |
| O | `arcanum/arcana/task-session/development/work-packs/evf-s1-one-shot/closeout/SWU-GCP-001-REFRESH-RECEIPT.json` | Invoke Refresh | `.agents/skills/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json` |
| T | `arcanum/arcana/task-session/development/work-packs/evf-s1-one-shot/results/SWU-GCP-001-TASK-SESSION-RESULT.json` | Task Session | `arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json` |

The P and O paths satisfy the installed Invoke owner-schema path patterns. The P schema ref uses the canonical repository-local Task Session schema path required by that owner schema. Project evidence and EVF receipts remain E/output refs; none substitutes for P, O, or T.

- `P` binds E, consumed admission, material reconciliation, validation receipt/contract, target/result inventories, output refs, and the exact closeout contract.
- `O` consumes P through `invoke:refresh:apply-approved`; it cannot substitute for E or T.
- `T` binds the exact P and O refs, preserves execution result, and records that no successor executed.
- No receipt points backward in a way that creates an ownership cycle.

## Closeout Target Inventory

The later applied Work Pack must bind exact baselines for these Invoke-owned synchronization targets:

- `WORK-PACK.md`
- `work-pack/EXECUTION-ENTRY.json`
- `work-pack/tasks/TASK-GCP-CONTRACT.md`
- `work-pack/tasks/TASK-GCP-ENFORCES.md`
- `work-pack/tasks/TASK-GCP-VERIFY.md`
- `work-pack/shared/GAPS.md`
- `work-pack/shared/TRACEABILITY.md`

No Define/Design/Plan semantic or authority target is automatically mutable during closeout. Any need to change them is plan drift and blocks the closeout route.

## Admitted Closeout Deltas

- `evidence_added`
- `blocker_opened`
- `blocker_resolved`
- `status_changed`
- `route_changed`

Closeout cannot implement another task, change semantics or authority, promote, publish, deploy, perform destructive cleanup, accept policy/cost/risk, or touch an undeclared target.

## Expected Owner Route And Receipt

- Route: `invoke:refresh:apply-approved`
- Owner: `invoke`
- Source receipt: `arcanum/arcana/task-session/development/work-packs/evf-s1-one-shot/results/SWU-GCP-001-PRECLOSEOUT-EXECUTION-RECEIPT.json`
- Source schema ref: `arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json` (`2ea1dba781010059f0819f9aece1886685c230db33dc1d205601ebeafe2cdd02`, 6001 bytes)
- Expected owner receipt: `arcanum/arcana/task-session/development/work-packs/evf-s1-one-shot/closeout/SWU-GCP-001-REFRESH-RECEIPT.json`
- Owner schema: `.agents/skills/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json` (`527970e0e98977215edd4729cdcfd638d9d47824c96e6b98bf8130ead2721e41`, 6553 bytes)
- Final terminal receipt: `arcanum/arcana/task-session/development/work-packs/evf-s1-one-shot/results/SWU-GCP-001-TASK-SESSION-RESULT.json`
- Final schema: `arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json` (`636a917ab05ee4595cb751d61f847c6fc6afc4be1e2e322473648471ddb8e362`, 11630 bytes)
- Continuation: `emit-cursor-never-execute-successor`

## Successor Policy

There is no automatic successor in this one-shot. The closeout emits a cursor and returns a deferred L1 decision route. It must not run repeatability, graph laws, BTE, IOLM, Body War, release, or publication work.

## Validation

- Validate the exact Work-Pack execution-entry projection with the installed Implementation Readiness validator.
- Validate the exact governance run, ticket, executor, precloseout, Invoke owner, terminal, and continuity artifacts through the Task Session owner runtime and current schemas.
- Require the execution entry, machine target inventory, precloseout contract, Invoke owner declaration, and terminal join to name the identical P/O/T paths and schema refs above.
- Run the contract-family regression validators before accepting the planning package.
- Rehash every closeout target immediately before Invoke owner dispatch and again before final terminal receipt.
