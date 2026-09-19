# Owner Prerequisite — Generic Factory Material Lock

Status: pending exact owner decision. This request does not change the factory or supersede either Work Pack.

Candidate binding: `WP-FMP-002-candidate@2`; `CANDIDATE-MANIFEST.json` SHA-256 `18d7a6a2739ddfbb7102d4bce90966160d271b574587ff2cb570e80b9d94463d`; 31-artifact acceptance content digest `dfaf820a6771f93c0d7416087b346c6b17b975f090cdd5e01374057f1270e77a`.

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

Rondelli is the primary owner and Victor Boscaro is the distinct second approver. Both responses must bind the final candidate Plan inventory and this request digest; neither response may be inferred from authorship or the other person's response. If any accepted contract byte changes, regenerate the candidate inventory, validation, and exact Plan acceptance request. After both this prerequisite and exact Work Pack supersession are accepted, Invoke Refresh may change the execution entry from `owner-prerequisite` to `selection-ready`; Implementation Readiness still owns selection.
