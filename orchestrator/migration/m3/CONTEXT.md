# M3 Context Pack

Status: session evidence  
Task: `M3 Internalize rwo-core`  
Mode: standard, strict  
Authority effect: none

## Obligations

| Obligation | Evidence | Status |
| --- | --- | --- |
| Create an independent `rwo-core` Rust crate | `../../rwo/Cargo.toml` and normal dependency tree | covered |
| Make evolved DagEngine the production transition engine | `../../rwo/src/dag.rs` and `src/lib.rs` | covered |
| Support uniform leaf and composite Work compilation | `../../rwo/src/work.rs` and Work tests | covered |
| Preserve all/any/quorum, retry, cancellation, duplicate, and impossible-join semantics | DAG tests | covered |
| Expose stateless start/apply/replay API | `../../rwo/API.md` and replay tests | covered |
| Keep runtime/storage/scheduler/ARE/provider/domain dependencies out | normal dependency scan | covered |
| Preserve historical RWO only as a test fixture | `../../rwo/legacy-fixtures/` and Cargo dev-dependency | covered |
| Provide differential replay evidence | `legacy_differential.rs` and `TEST-RESULTS.log` | covered |
| Record candidate-definition pressure | `VALIDATION.json` definition feedback | covered |

## Controlling sources

- M2 architecture and the selected single-engine boundary.
- Canonical legacy `runtime/src/dag.rs`, used as the dependency-free DagEngine base.
- Standalone evolved DagEngine tests, used for atomicity and retry behavior.
- Complete standalone vendored `rwo-rust`, used only as a differential fixture.
- Historical RWO design and canonical ETL composition, retained with source digests.

## Decisions

The production crate uses `DagEngine` and does not import the historical reducer.
The incomplete three-file historical crate was replaced in the test fixture by
the complete vendored copy after its missing `admission.rs` caused the first
linkable build attempt to fail. ICU-backed fixture tests use the repository's
locked `run-rwo` toolchain wrapper.

## Write scope

`orchestrator/rwo/`, its M3 evidence, and the package frontier only.

## Open Questions

Generic conditional and bounded-control constructs remain M5 work. They must not
reintroduce research-specific dependencies into RWO Core.
