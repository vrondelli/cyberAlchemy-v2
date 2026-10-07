# Authorization admission service (candidate)

This crate owns the selected Auth request's read-only SQLite transaction,
system-clock evaluation time, shared epoch allocation, and command-boundary
admission. Its `with_ready` function-pointer continuation receives a private,
transaction-bound `ReadyAuthorization` by value only after READY and usable
state. The READY decision consumes that non-Clone value, preventing a second
decision with the same token in safe Rust. The
bare pointer cannot carry a captured destructor across a DENY. Its normal-build
dependency closure has no READY decision, generated policy, or legacy decision
adapter. A dev-only READY-decision dependency exercises the migrated regression
suite; it does not enter the selected production closure. An invalid
request returns `AdmissionOutcome::Denied`; preparation, transaction, clock,
or rollback failure returns `PortFailure`. Callers map all non-READY outcomes to
public DENY without relabeling post-READY state failure as gate DENY.

The selected public API and three bridges depend on this crate and invoke the
READY decision in its continuation. The older `authorization-service` crate
remains a separate decision-capable compatibility facade, not a dependency of
those selected roots. It now delegates its schema, clock, epoch, transaction,
gate, and READY work to this crate. Both read the same neutral
`authorization-schema/migrations` SQL files. This is a construction checkpoint,
not a closed dependency/effect or runtime guarantee.

From the repository root:

```sh
tools/toolchain/run cargo test --offline --locked --manifest-path auth-foundation/implementation/authorization-admission-service/Cargo.toml
tools/toolchain/run cargo clippy --offline --locked --all-targets --manifest-path auth-foundation/implementation/authorization-admission-service/Cargo.toml -- -D warnings
```

## Open Questions

- How will the source-bound successor prove the normal-build versus dev-only
  dependency distinction, including the separate legacy facade?
- How will the versioned V4b/D65 successor prove the complete active Cargo
  and call/effect closure after this split?
- How will invocation/request/epoch-correlated traces observe the READY
  decision and generated-policy outer wrapper without modifying the
  instrumentation-free generated core?
