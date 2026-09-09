# Planned Validation Contracts

All witnesses are planned and unexecuted in Design.

| ID | Claim | Positive witness | Negative witness | Owner |
| --- | --- | --- | --- | --- |
| OEW-V-01 | only verified source enters adapter | SWU-OCGP-008 receipt passes | tampered result digest blocks | source-admission owner |
| OEW-V-02 | mapping is total and loss-aware | every node/edge has sidecar row | unknown relation or missing row blocks | adapter owner |
| OEW-V-03 | adapter is deterministic | two projections byte-identical | unstable order fixture fails | adapter owner |
| OEW-V-04 | authority ceiling persists | every admitted artifact has `authority_effect:none` | authority-effecting fixture blocks | authority-boundary validator |
| OEW-V-05 | Poker lineage is exact | F1/R1/D1 selected | D2 cannot enter grounding closure | domain parity validator |
| OEW-V-06 | views are semantically equivalent | graph/outline/table parity oracle | mismatched status fixture blocks | UI owner |
| OEW-V-07 | serving is local/read-only | loopback token GET/HEAD pass | POST, traversal, missing token, non-loopback fail | gateway owner |
| OEW-V-08 | upstream is pinned | commit/license/file hashes match | floating/wrong pin blocks | upstream integration owner |
| OEW-V-09 | accessibility baseline holds | automated + keyboard checks pass | hidden/graph-only fact fails | UX validator |
| OEW-V-10 | protected scopes remain unchanged | before/after digest manifest equal | any Poker/IOLM/authority/Craft delta blocks | isolation verifier |
| OEW-V-11 | code context is non-interfering | attach explicit mappings with unchanged evidence digest | implicit/cross-namespace edge fails | code-context owner |
| OEW-V-12 | L1 toolchain/materializer is isolated and reproducible | fresh digest-named workroot, exact tool/lock bytes, self-owned fixture patch-once, cleanup | ambient workspace fallback, tool drift, patch drift/reapply, or residue blocks | L1 provisioner + distinct verifier |
| OEW-V-13 | final L1 feature build is independently accepted | after completed 007 plus 008F, complete overlay passes patch-once, Vitest, typed build, cleanup, and separate-verifier recomputation | pre-feature handle, producer-only assertion, digest mismatch, or residue blocks | L1 final-build producer + verifier |
| OEW-V-15 | selected L1 commands have owned executable entrypoints | preselection frontier receipt resolves every package command to an existing file or a target owned by that same candidate | missing runner, cross-SWU runner ownership, second package root, or unsupported direct TSX execution blocks selection | Invoke frontier validator |
| OEW-V-14 | browser lifecycle is bounded and independently accepted | pinned browsers, minimal environment, owned PID/port ledger, outbound observation, `finally` teardown, verifier pass | reused server, inherited broad environment, orphan process, occupied port, or producer self-acceptance blocks | browser producer + distinct verifier |

## Required Schemas

- `oew.evidence-sidecar.v1`
- `oew.adapter-receipt.v1`
- `oew.upstream-lock.v1`
- `oew.evidence-code-map.v1` (L2)
- `oew.browser-acceptance.v1` (L1)
- `oew.l1-toolchain-handle.v1` (L1)
- `oew.l1-toolchain-verification.v1` (L1)
- `oew.l1-build-handle.v1` (L1)
- `oew.l1-build-verification.v1` (L1)
- `oew.browser-acceptance-verification.v1` (L1)

## Receipt Ceiling

- adapter receipt: proves only deterministic projection from a verified bundle;
- browser receipt: proves only declared automated journeys;
- L1 toolchain receipt: proves only isolated materialization and fixture patch
  mechanics for one exact tool/network-cache configuration;
- final L1 build receipt: proves only the complete declared post-feature
  overlay, typed tests/build, output digest, and cleanup;
- independent verifier receipts: prove recomputation of their declared inputs
  and checks, not product or ontology acceptance;
- manual result: proves only named human/device/assistive-tech observations;
- none of these receipts grants ontology admission, product acceptance,
  publication, IOLM gate closure, or production readiness.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
