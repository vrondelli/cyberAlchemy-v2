# RWO Core

Status: implementation candidate
Authority effect: none

`rwo-core` is the independently tested structural kernel for CyberAlchemy
Orchestrator. It contains the evolved `DagEngine`, uniform leaf/composite Work
compilation, graph validation, all/any/quorum release rules, deterministic
command batches, retry bounds, cancellation, cursor restoration, and replay.

The crate has no storage, scheduler, frontend, ARE, provider, deployment, or
domain dependency. Its only runtime dependencies are serialization and hashing.
`legacy-fixtures/` contains immutable inputs and expected commands; the
historical reducer is migration provenance and is not a build dependency.

See `API.md` for the public boundary.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
