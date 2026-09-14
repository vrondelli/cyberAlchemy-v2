# M4 Context Pack

Status: session evidence  
Task: `M4 Migrate durable runtime and contracts`  
Mode: standard, strict  
Authority effect: none

## Obligations

| Obligation | Evidence | Status |
| --- | --- | --- |
| Depend on the public RWO API with no embedded reducer | runtime Cargo tree and source scan | covered |
| Register and reopen immutable Run Bundles | model/controller code and restart test | covered |
| Atomically store event, cursor, and complete command batch | history port and restart/conflict test | covered |
| Reject duplicate divergence and stale revisions | history implementation and tests | covered |
| Track attempts, leases, fences, begins, and receipts | coordination store and runtime tests | covered |
| Block unknown effects pending owner resolution | recovery projection and unknown-effect test | covered |
| Persist cancellation and deadline transitions | controller and runtime tests | covered |
| Schedule compatible work under global capacity | runtime supervisor and Worker API test | covered |
| Provide closed versioned contracts | five JSON schemas and contract test | covered |
| Record definition pressure without promotion | validation definition feedback | covered |

## Controlling sources

- M2 architecture and single-engine decision.
- M3 `rwo-core` API and validation.
- Standalone predecessor controller, ports, coordination, worker, supervisor, recovery, receipt, lifecycle, and transaction modules as behavior evidence.
- Candidate ORCH-D3, D5-D11, D13, D28-D35, and D41-D50 boundaries.

## Decisions

The migrated runtime is a clean local implementation around the M3 API instead
of a recursive copy of the predecessor crate. This removes its embedded DAG
module and live legacy RWO dependency. File replacement uses write, sync, rename,
and directory sync under the documented single-writer local edition.

## Write scope

`orchestrator/runtime/`, five runtime contracts, M4 evidence, and the package
frontier only.

## Open Questions

Cross-process locking and measured power-loss behavior remain deployment work;
strategy/dispatch and concrete agent adapters remain M5.
