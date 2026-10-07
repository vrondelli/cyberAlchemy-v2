# Current Auth technical-evidence successor v3 (candidate)

This candidate separates exact historical bytes from current mutable Auth
construction outputs. `preimages/manifest.json` names nine content-addressed
preimages. Seven are checked against the pinned Git commit and blob; the v1 and
v2 bindings are only locally observed exact bytes, with no earlier chronology
asserted. The v2 binding is independently SHA-256 pinned before its eight
historical pin rows are trusted. Missing, changed, renamed, substituted, or
extra preimage files fail validation.

The verifier derives the selected `authorization-service` Cargo closure from
locked offline metadata, reconciles all direct local dependency edges, and
hashes the full regular-file inventory of its ten local crates outside
`target/`. It also tracks the legacy `trusted-input-provider` facade separately
as current, unselected input. Current source-shape checks bind the public API's
concrete/private production engine, the service's READY continuation, the
`authorization-ready-authority` gate and unique continuation, and the
`authorization-ready-decision` entrypoint into the generated policy kernel.
The direct metadata/state/trusted-input readers are tracked. Inactive optional
local edges outside the inventoried closure fail closed. These selected-item
checks and exact source hashes are **not** Rust semantic or all-native-entrypoint
proofs.

The selected service root now uses `authorization-ready-authority` and
`authorization-ready-decision`, not the retired wrapper/adapter path. The
public API root has an explicit eleven-local-crate closure check, including
absence of the legacy trusted boundary and SQLite decision facade. The old V4b
certificate remains pinned as a stale predecessor but is not executed or
reported as a passing bridge; its prior result does not transfer to this path.
The three selected bridge binaries (`tenant-bridge`,
`authentication-prototype/bridge`, and `authentication-https/bridge`) have their
Cargo manifests, locks, and entry sources pinned, and their separate
dependency-isolation verifier is replayed. That check excludes reachable
legacy decision crates but does not prove every runtime call path.
The historical v1 generated admission kernel remains a separately pinned
test-only dependency of the v2 boundary, not a selected runtime dependency.
The exact owner-selected downstream endpoint scope is pinned as a current input.
Its SHA-256 and path must match both the current service binding and D65 chain
stage; the read-only freshness inspector must report these links and the
overall Auth evidence set current. This is lineage/freshness evidence, not an
endpoint inventory proof. Current D65 service binding, trusted-input evidence,
the trusted-input materializer, and the freshness inspector are pinned separately. The binding
must distinguish legacy predecessor evidence from the selected v2 boundary
and read-only reader edges; a passing hash alone is not semantic composition.

From the repository root:

```sh
python3 -m unittest auth-foundation/implementation/scripts/test-current-evidence-successor-v3.py
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v3.py --print-expected
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v3.py
```

`--print-expected` emits candidate binding JSON to stdout and never writes it.
Only after independent review should an owner materialize and re-verify
`binding.json`. The replay runs the existing current CLI verifier, two clean v2
command-boundary projections, locked offline Cargo check and strict check,
twice tests and exact test-name inventory, formatting except the known
`trusted-input-runtime` generated-byte exception, and strict Clippy for
handwritten crates. The service also runs release-mode check and tests to
exercise configuration-dependent behavior. The generated exception is covered
by exact CLI replay;
its checked-in generated source is not reformatted here.

Mutable D65 outputs are current candidate inputs, never historical preimages.
No FormalClaim semantic admission, all-path no-call proof, TDE/F5/EVF
satisfaction, publication, deployment, production security, or
`runtime_guarantees_observed` follows from a passing local replay.

## Open Questions

- Which independent native-entrypoint inventory and tests will establish the
  owner-accepted no-downstream-call rule beyond the selected service graph?
- Which admitted FormalClaim and TDE-derived cases will bind the accepted
  BusinessMeaning without transferring historical v1/v2 authority?
