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
| OEW-V-12 | L1 build is clean and reproducible | fresh digest-named workroot, exact tool/lock bytes, patch-once, Vitest and typed build pass | ambient workspace fallback, tool drift, patch drift/reapply, or residue blocks | L1 bootstrap producer |
| OEW-V-13 | L1 build receipt is independently accepted | separate verifier recomputes inputs, tools, output, protected set, cleanup, and residue | producer-only assertion or digest mismatch blocks | L1 build verifier |
| OEW-V-14 | browser lifecycle is bounded and independently accepted | pinned browsers, minimal environment, owned PID/port ledger, outbound observation, `finally` teardown, verifier pass | reused server, inherited broad environment, orphan process, occupied port, or producer self-acceptance blocks | browser producer + distinct verifier |

## Required Schemas

- `oew.evidence-sidecar.v1`
- `oew.adapter-receipt.v1`
- `oew.upstream-lock.v1`
- `oew.evidence-code-map.v1` (L2)
- `oew.browser-acceptance.v1` (L1)
- `oew.l1-build-handle.v1` (L1)
- `oew.l1-build-verification.v1` (L1)
- `oew.browser-acceptance-verification.v1` (L1)

## Receipt Ceiling

- adapter receipt: proves only deterministic projection from a verified bundle;
- browser receipt: proves only declared automated journeys;
- L1 build receipt: proves only the declared materialization, typed tests/build,
  output digest, and cleanup for one exact tool/network-cache configuration;
- independent verifier receipts: prove recomputation of their declared inputs
  and checks, not product or ontology acceptance;
- manual result: proves only named human/device/assistive-tech observations;
- none of these receipts grants ontology admission, product acceptance,
  publication, IOLM gate closure, or production readiness.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
