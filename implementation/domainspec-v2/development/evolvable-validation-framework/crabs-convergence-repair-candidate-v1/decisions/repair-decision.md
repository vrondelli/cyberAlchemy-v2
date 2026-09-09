# CRABS ordered-set repair candidate decision

Status: direct reversible prototype route; no product decision or approval

The selected candidate is `anchored-lww-order-prototype`.

The user explicitly requested implementation after receiving the repair plan,
and repeated that request after the implementation route was announced. The
candidate remains isolated from the pinned audit checkout and is reversible.

## Candidate semantics

- Element identity remains `(node_id, sequence_num)`.
- Each element stores a persistent anchor and placement-version operation ID.
- Concurrent siblings use a byte-defined operation-ID total order.
- A move rewrites the complete order known to that replica as one LWW order
  update keyed by the move operation ID.
- Merge chooses the greater placement version for each shared element.
- Deletion remains monotonic.
- Conflicting payload bytes for one identity reject merge before mutation.
- Equal placement-version IDs with different anchors reject before mutation.
- Merge rejects a combined element count that would overflow `uint32_t`.
- State format v8 stores placement metadata; v1-v7 input reconstructs a
  predecessor chain from the serialized list. The candidate makes no downgrade
  or production migration claim.

## Rejected routes

- `global-id-sort`: deterministic but destroys list semantics.
- `production-cutover`: outside implementation authority and lacks product
  approval, migration evidence, and publication authority.

## Remaining blockers beyond the prototype

- broader multi-replica and partial-knowledge move evidence;
- independent compatibility review;
- product approval;
- any commit, push, PR, publication, release, or deployment decision.
