# Current Auth technical evidence — v1 candidate

`binding.json` is a versioned local technical observation of four exact Auth
Rust crates and three current DomainSpec CLI runtime targets. Verify it with:

```sh
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor.py
```

The verifier replays the current CLI targets and runs formatting, ordinary and
strict checks, two test runs, test inventory, and Clippy for each crate. It
compares exact source and historical-snapshot hashes with the recorded binding.
It also retains the service ontology, DomainSpec source set, authorization-state
provider, trusted boundary, epoch migration, and transaction entrypoints as
explicit architecture dependencies.

The historical `standard-conformance` records and `d65-chain.json` are archived
predecessors. They may contain internally stale links and are not made current
by this package. This candidate does not claim semantic admission, product
approval, deployment, production security, or `runtime_guarantees_observed`.

## Open Questions

- Which exact successor D65 stage graph can consume this technical observation
  while preserving the complete service transaction and evaluation-epoch
  semantics?
- How should the separately tested Auth W5 product candidate be linked once
  its exact source and evidence digests are checked against this package?
