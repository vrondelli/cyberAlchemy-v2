# N41 — emits closure sidecar identity lifecycle

Status: selected. Selection: `BMC-REL-NONNUMERIC-41-A-DIGEST-ADDRESSED-COEXISTENCE-NO-SUPERSESSION`.

Question: when the same consumer owner authors multiple immutable closure sidecars for the same boundary, predicate, and exact snapshot, should they coexist as independently digest-addressed attestations, or may the owner explicitly link a later sidecar as superseding an earlier one?

- A — digest-addressed coexistence with no supersession semantics. Recommended.
- B — explicit consumer-owner-authored, digest-bound supersession link; prior bytes remain immutable and no currentness follows.
- C — defer.
- D — stop.
- Explain — show more context; decision effect none.

Rejected: newest-file-wins, rewriting history, evaluator-owned supersession, and supersession-implies-currentness.

N40-A did not select N41. The user's later exact `A` response selected N41-A; see `OWNER-SELECTION-RECEIPT.json`.
