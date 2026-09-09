# TASK-OVR-OPERATIONS

## Objective

Add the three exact v0 operation behaviors to a proven immutable fixture
snapshot. No generic operation registry is allowed.

## Mapping

L0, S-003, W2. Depends on SWU-OVR-004.

## Smallest Working Units

### SWU-OVR-005 — native validation wrapper

Inputs: one snapshot and exact validator descriptor. Outputs: one
`RuntimeRunV0` plus receipt.

Algorithm: validate operation/snapshot; spawn exact command without shell,
minimal environment and fixed cwd; capture bounded stdout/stderr/exit; preserve
native result/diagnostics/receipt; map completed child to runtime succeeded;
map spawn/timeout/process failure to runtime failed.

Acceptance matrix: native accept, native reject, process fail, timeout, zero
exit without claim ceiling. Never emit “conformant/approved/ready.”

### SWU-OVR-006 — same-adapter byte/local-ID diff

Inputs: exactly two immutable snapshots. Check equal adapter ID/version/code
digest and compatible canonicalizer. Compare ordered local-ID sets, payload
hashes, and logical source-binding bytes. Emit added/removed/unchanged/changed
only. Return unsupported for cross-adapter, semantic, lifecycle, or arbitrary
profile comparison.

Acceptance: deterministic swapped-order and unsupported capability matrix.

### SWU-OVR-007 — draft proposal artifact

Inputs: one completed run plus exact source handles and approved fixture draft
shape. Canonicalize the required fields, bind all IDs/digests, set
`draft-request` and authority none, create-only write, retrieve by content ID.

Reject lifecycle/delivery/review/decision fields and any unapproved suggested
owner route. Acceptance includes forbidden owner-state and mutation negatives.

## Detailed Contracts

All data models, write scopes, split rationales, evidence, validation surfaces,
handoffs, blockers, and closeout refs are in
[`SWU-MANIFEST.json`](../shared/SWU-MANIFEST.json).

