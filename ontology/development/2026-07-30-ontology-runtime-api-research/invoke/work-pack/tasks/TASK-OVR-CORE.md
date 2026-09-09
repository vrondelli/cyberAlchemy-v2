# TASK-OVR-CORE

## Objective

Build the smallest fixture-only core from a frozen admission contract through
immutable bounded reads. Candidate paths remain inactive until W0.

## Mapping And Dependencies

L0, S-001/S-002, W1. Depends on all W0 owner decisions. Source contracts:
[SPEC.md](../../SPEC.md), [ARCHITECTURE-BUNDLE.md](../../ARCHITECTURE-BUNDLE.md),
[OPERATIONS.md](../../OPERATIONS.md), and
[`SWU-MANIFEST.json`](../shared/SWU-MANIFEST.json).

## Smallest Working Units

### SWU-OVR-001 — frozen admission contract

Purpose: own the admit/reject decision for one configured registration.

Algorithm:

1. Load frozen schemas with unknown fields denied.
2. Validate versioned registration, envelope, request/response/error, and caps
   shapes.
3. Resolve the configured root once at startup.
4. Prove lexical and canonical containment and declared regular files.
5. Match profile/manifest/adapter/code digests and role-bearing owner refs.
6. Return stable typed diagnostics; do not write source or runtime store.

Edge cases: traversal, encoded traversal, symlink, directory, URL, absent
owner ref, mismatched digest, duplicate ID, scalar confidence, unknown field.

Acceptance: stable positive/negative matrix and zero-write digest proof.
Write scope, split analysis, handoff, and closeout:
`SWU-MANIFEST.json#SWU-OVR-001`.

### SWU-OVR-002 — fixture adapter

Purpose: emit a lossless local projection without snapshot authority.

Algorithm: inspect exact profile; enumerate only manifest files; emit opaque
payload bytes, qualified facets, aliases, both confidence axes, source
bindings, diagnostics and residue; repeat in a clean root; reject forbidden
adapter outputs.

Edge cases: reordering, missing source binding, duplicated local ID, generic
owner route flattening, snapshot/publication output, stale native receipt.

Acceptance: byte-identical passes and adapter-overreach negatives.

### SWU-OVR-003 — snapshot compiler

Purpose: turn one admitted adapter output into one immutable snapshot.

Algorithm: lock; pre-identity; clean extraction A/B; runtime-owned envelopes;
canonical sort/bytes; equality; post-identity; source preservation; cap checks;
create-only publish; receipt last.

Precedence: identity/cap/source failure beats publication. Equal identity and
equal bytes reuse; equal ID/unequal bytes is collision.

Acceptance: replay, drift, nondeterminism, collision, and no-partial-write
receipts.

### SWU-OVR-004 — bounded query plane

Purpose: expose immutable metadata, records, one record, and sources.

Algorithm: authenticate; parse logical IDs/query; load one snapshot; apply
qualified facet filter; bound page; canonicalize response; compute ETag over
normalized query+bytes; return 304 when matched.

Edge cases: arbitrary path, invalid cursor, page 0/101, incomplete facet tuple,
missing snapshot/local record, oversized response.

Acceptance: contract/API/curl receipts. Browser evidence is optional and proves
only observed browser/HTTP behavior.

## Synchronization

Each SWU returns `TaskSessionResultV1`; Invoke Refresh may touch only its exact
closeout row targets. No successor is selected automatically.

