# Review guide: deterministic CRABS ordered-set merge

Commit: [`477799721668652988bf98a4a9067d08f5bdaebf`](https://github.com/vijayee/CRABS/commit/477799721668652988bf98a4a9067d08f5bdaebf)
Branch: [`codex/ordered-set-convergence-repair`](https://github.com/vijayee/CRABS/tree/codex/ordered-set-convergence-repair)
Suggested review title: **Make ordered-set merge deterministic across replicas**

## Summary

This commit repairs a concrete convergence defect in the CRABS ordered set.

Previously, merge kept the destination list in place and appended elements
known only by the source. Two replicas holding the same two elements could
therefore settle on opposite orders:

```text
merge([A], [B]) -> [A, B]
merge([B], [A]) -> [B, A]
```

The repair makes placement part of replicated state. Each element records its
logical anchor and the operation ID of its latest placement. Merge combines
those records, resolves competing placements with the same deterministic rule,
and then rebuilds the linked list. For the original example, both directions
now produce `[B, A]`.

This is a repair candidate, not a claim that every ordered-set history or all
of CRABS has been proved correct.

## Why the old merge diverged

The linked list stored the current order but not the reason for that order.
When merge encountered an element missing from the destination, it appended
that element to the destination tail. The caller's choice of destination
therefore decided observable order.

Membership converged, but sequence order did not. That matters because later
ordered-set operations address visible positions; replicas that disagree about
position can act on different elements.

## Design used by this commit

Every ordered element now carries:

- its existing stable element ID, `(node_id, sequence_num)`;
- an optional anchor identifying the element it follows;
- a placement-version operation ID.

Merge follows this sequence:

1. Build the combined placement state without mutating the destination.
2. Reject conflicting payloads, missing anchors, placement cycles, count
   overflow, or equal placement versions that name different anchors.
3. Add missing elements and preserve deletion if either side deleted an
   element.
4. For a shared element, retain the placement with the greater placement ID.
5. Rebuild `head`, `tail`, `prev`, `next`, `count`, and `visible_count` from the
   merged records.

Concurrent children under one anchor are ordered deterministically. The
comparison uses all fixed-width node-ID bytes, then the sequence number; if
placement versions tie, the element ID breaks the tie. Timestamp and merge
direction are not used.

### Move behavior

A move rewrites the complete order known to that replica as one versioned
placement chain. Every affected element receives the move operation ID as its
placement version. When replicas merge competing orders, the greater placement
version wins for each shared element.

This provides a deterministic prototype rule. Its behavior under partial
knowledge and three or more replicas remains the most important open semantic
question.

### Invalid-state behavior

`crabs_ot_ordered_set_merge` can now return `NULL` when preflight finds an
invalid or ambiguous combined state. Preflight runs before destination
mutation, including before position-map merge. Callers must not assume that
every non-null pair of sets can always be merged successfully.

## Serialization and compaction

The serialized state version changes from 7 to 8.

- Version 8 writes `has_anchor`, the optional anchor ID, and the placement ID.
- The reader continues to accept versions 1 through 7 by reconstructing a
  predecessor chain from the serialized list and using each element ID as its
  initial placement version.
- Compaction rebuilds anchors for the remaining visible sequence and preserves
  placement-version information.

This defines a backward-reading path. It does not yet demonstrate mixed-version
deployment, downgrade writing, corrupted-input recovery, or production data
migration.

## Files changed

- `src/OT/ot_ordered_set.h` — adds persistent placement metadata.
- `src/OT/ot_ordered_set.c` — adds preflight validation, deterministic
  materialization, placement merge, move versioning, and overflow rejection.
- `src/Serialization/serialization.h` — advances the state format to version 8.
- `src/Serialization/serialization.c` — reads and writes placement metadata and
  reconstructs legacy placement state.
- `src/Compaction/compact_op.c` — rebuilds valid placement anchors during
  compaction.
- `test/test_ot_ordered_set.cpp` — adds the original commutativity case and
  atomic payload-conflict rejection.
- `test/test_ot_serialization.cpp` — checks placement metadata after round trip.

## Evidence available for this commit

The evidence is bound to commit
`477799721668652988bf98a4a9067d08f5bdaebf` and repair digest
`23dd76e385a968f1116e2c5975609f9abf1674e6056d2828b0921bd898578a5b`.

### Native checks

GCC 13 compiled the modified ordered-set implementation with
`-std=c11 -Wall -Wextra -Werror`.

A standalone native harness passed five groups:

1. two-singleton merge commutativity;
2. one concrete three-singleton associativity example;
3. idempotence and deletion-wins behavior;
4. rejection of conflicting payloads without destination mutation;
5. one concrete concurrent-move last-writer-wins example.

The ordered-set, serialization, and compaction C translation units also passed
independent warning-clean compilation.

### Bounded model check

CBMC 6.11.0 checked the actual repaired merge function for two replicas with
one distinct live element each, no position maps, and allocation failure
excluded. The named commutativity assertion was `SUCCESS`, and CBMC reported
`VERIFICATION SUCCESSFUL`.

The result means no counterexample was found at that exact bound. It is not an
unbounded algebraic proof, a whole-program memory-safety proof, or evidence for
larger replica states.

### Test-suite limitation

The full CRABS C++/GoogleTest suite was not run in the isolated worktree. Its
pinned `deps/openabe-c` submodule was uninitialized and no configured build
directory was present. The standalone harnesses were used so the exact merge
function could still be compiled and exercised without silently substituting a
different dependency version.

## Important reviewer questions

Please focus review on these decisions:

1. **Move semantics:** Is whole-order last-writer-wins the intended behavior,
   especially when replicas know different subsets of the list?
2. **Tie-break direction:** Is descending placement/element operation-ID order
   acceptable as the canonical sibling order?
3. **Merge failure:** Can existing callers correctly handle the new `NULL`
   result for conflicting or structurally invalid state?
4. **Payload identity:** Merge treats different payload bytes for one element
   ID as a conflict, but the existing `swap` operation exchanges payloads
   between IDs. Should divergent swaps fail closed, or does payload need its own
   versioned conflict rule?
5. **Compatibility:** Is reading v1-v7 while writing only v8 sufficient, or is a
   mixed-version/downgrade contract required?
6. **Compaction:** Is rebuilding a predecessor chain safe under CRABS's actual
   tombstone-retention and replica-acknowledgement rules?
7. **Operation identity:** Are callers guaranteed to supply unique, stable IDs
   for every move that can participate in conflict resolution?

## Known limits and next target

This commit does not yet establish:

- general commutativity, associativity, or idempotence;
- convergence for three replicas or partial-knowledge moves;
- position-map behavior;
- allocation-failure safety;
- end-to-end v7-to-v8 migration;
- whole-state merge preservation;
- sanitizer-clean whole-library execution;
- correspondence between the C code and an abstract Lean or TLA+ model.

The recommended next target is a three-replica, partial-knowledge concurrent-
move test. Generate all merge and delivery permutations for a bounded
three-element state and require either identical final placement/order or the
same atomic fail-closed outcome. That test should decide whether this move rule
is stable enough to keep before compatibility and broader proof work expand.

## Review posture

The narrow original defect is closed at its tested bound. The larger algorithm
should remain a candidate until the reviewer questions above and the next
multi-replica target are resolved. Merging this branch would be a maintainer
decision; the current evidence does not make that decision automatically.
