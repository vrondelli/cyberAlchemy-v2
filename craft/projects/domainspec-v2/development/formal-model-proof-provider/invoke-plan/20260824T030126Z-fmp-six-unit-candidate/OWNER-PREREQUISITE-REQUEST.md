# Owner Prerequisite — Generic Factory Material Lock

Status: pending exact owner decision. This request does not change the factory or supersede either Work Pack.

Candidate binding: `CANDIDATE-MANIFEST.json` SHA-256 `e6e65126f8705b5f524fabfdadf0f3fea6a4011821e8faf3b60d94f7a4ea772a`; acceptance content digest `3251dd0aa823d74af0ec27b72a708d0682d868b8e898c3d77772c113dd473cf9`.

## Requested decision

Accept, reject, or revise this exact candidate contract for `SWU-FMP2-002`:

1. Keep executable identity and non-executable artifact identity distinct.
2. Add a closed generic `LockedFactoryArtifact/v1` record with `artifact_id`, `version`, and `sha256`.
3. Let a provider declare sorted `artifact_ids` and one bounded `execution_timeout_ms`.
4. Let a newly planned locked node bind a sorted artifact array, including `[]`, plus the effective timeout.
5. Provide a process-only execution context carrying verified executable/artifact handles and the locked bounds; runtime paths never enter the lock or semantic receipt.
6. Make direct execution and replay resolve and verify the same provider, component, executable, artifact and timeout identities before execution, and recheck material identity after provider return.
7. Preserve existing provider behavior at 70,000 ms and no required artifact. Historical lock decoding must remain compatible without rewriting historical lock bytes.

The TLA provider would declare Java as its executable, `tla2tools` as its artifact, and 300,000 ms as its node budget. The provider-specific details remain outside the generic contract.

## What acceptance would authorize

It would admit these exact semantics into the candidate Plan. It would not select or execute an SWU, mutate the factory, accept the whole Work Pack, invoke TLC, publish evidence, or change authority.

## Response binding

The owner response must bind the final candidate Plan inventory and this request digest. If any accepted contract byte changes, regenerate the candidate inventory, validation, and exact Plan acceptance request. After both this prerequisite and exact Work Pack supersession are accepted, Invoke Refresh may change the execution entry from `owner-prerequisite` to `selection-ready`; Implementation Readiness still owns selection.
