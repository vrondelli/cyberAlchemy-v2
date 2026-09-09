# CRABS convergence repair: findings and evidence

## Executive finding

The repair at commit `477799721668652988bf98a4a9067d08f5bdaebf` removes the exact merge-direction dependency that EVF demonstrated
in the pinned CRABS version. Previously, merging `A` with `B` kept the
destination first, so opposite merge directions produced `[A,B]` and `[B,A]`.
With this candidate, both directions produce `[B,A]` because both replicas use
the same byte-defined placement ordering.

The practical status is:

- the original two-singleton defect is repaired for the checked case;
- a broader native example suite passes;
- CBMC found no counterexample to the named commutativity obligation at its
  declared bound;
- broader convergence, safety, compatibility, and whole-system correctness
  remain unproved.

## Root cause in the old implementation

The old representation remembered only the current linked-list neighbors. It
did not remember why an element occupied a position. Merge began with the
destination list and appended source-only elements to its tail. The destination
therefore received an invisible priority:

```text
destination [A] + source [B] -> [A,B]
destination [B] + source [A] -> [B,A]
```

Both replicas knew the same members, but the observable order differed. The
repair could not safely be “always sort by element ID,” because that would make
normal insert and move intent disappear. The selected design instead makes
placement itself part of replicated state.

## Repair semantics

Each element now has three ordering facts:

1. its stable element ID, `(node_id, sequence_num)`;
2. an optional anchor naming the element it follows, or no anchor for a root;
3. a placement-version operation ID saying which placement update is newer.

Merge first builds the placement state it would obtain without changing the
destination. It rejects the merge if it finds any of these conditions:

- one element ID carries different payload bytes;
- one placement points to a missing anchor;
- placements form a cycle;
- the same placement-version ID describes two different anchors;
- the combined count would overflow `uint32_t`.

Only after that preflight succeeds does merge add missing elements, make
deletion win, and choose the greater placement version for shared elements.
It then rebuilds the linked list as a view of those records. Children of the
same anchor use a fixed comparison of the full node-ID bytes, sequence number,
and element ID. No pointer address, locale, wall clock, merge direction, or
arrival order decides the result.

### Move rule

The candidate treats a move as a versioned update of the entire order currently
known by that replica. Every element in that sequence receives the move
operation ID as its placement version. If two such moves are merged, the
greater operation ID wins per shared element.

This is a deliberately simple prototype rule. It makes the tested concurrent
move example deterministic, but partial-knowledge and multi-replica move cases
need substantially broader modeling before the rule can be approved.

### Serialization rule

Format version 8 writes the anchor and placement version. When reading formats
1 through 7, the candidate reconstructs a predecessor chain from the stored
list and uses each element's own ID as its initial placement version. This is a
defined read path, not proof of production compatibility. No downgrade writer,
mixed-version deployment, corrupt-state corpus, or end-to-end migration run has
been validated.

## Evidence by tool

### GCC 13

GCC compiles the actual modified `ot_ordered_set.c` with warnings treated as
errors. The standalone regression executable checks five groups:

1. two-singleton commutativity;
2. one concrete three-singleton associativity example;
3. idempotence plus deletion-wins behavior;
4. atomic rejection of conflicting payloads;
5. a concrete concurrent-move last-writer-wins example.

Every group also exercises linked-list/count invariants where relevant. These
are concrete examples, not exhaustive proofs of associativity, idempotence, or
move convergence.

The modified ordered-set, serialization, and compaction translation units also
compile independently with `-std=c11 -Wall -Wextra -Werror`.

The repository's full C++/GoogleTest suite is not counted as current evidence:
the isolated repair worktree has no configured build directory and its pinned
`deps/openabe-c` submodule is uninitialized. Downloading/building that broader
dependency surface was not necessary for the standalone checks and was not
silently substituted with a different dependency version.

### CBMC 6.11.0

CBMC consumes the actual repaired merge function and a two-singleton harness.
The dependency model provides fresh allocations, preserves full CRABS
operation-ID equality, omits position maps, and excludes allocation failure as
declared by TDE.

The named subject property is `main.assertion.3`: both merge directions must
have the same ordered element-ID sequence. CBMC reports it as `SUCCESS` and
ends with `VERIFICATION SUCCESSFUL`.

The finite loop bounds are part of the evidence contract. Four unwind steps
cover the two-element merge, placement validation, materialization, and final
comparison. Sixty-five steps cover the fixed 64-byte `memcmp` and `strncmp`
paths. The live receipt checks the named subject property. It does not claim
that every separately instrumented pointer, arithmetic, or unwind property was
proved.

An exploratory all-properties run exceeded 180 seconds. That attempt is
`NOT_EVALUABLE`, not a subject failure, and is not used as the successful
receipt. This distinction prevents tool cost or an auxiliary check from being
misreported as a CRABS counterexample.

### JSON Schema, SHA-256, and Git

JSON Schema checks the shape and authority posture of each live record. SHA-256
binds the repair source, patch, harnesses, compiler, CBMC executable, downloaded
CBMC package, obligation, and manifest. Git verifies the base commit, local
branch, exact diff, and that the durable patch applies cleanly to the pristine
pinned checkout.

These tools prove provenance and evidence integrity. They do not prove the
merge law themselves.

## What the result establishes

For the exact repair digest and two replicas containing one distinct live
element each, with no position maps and allocation failure excluded:

- both concrete native merge directions return successfully;
- both directions materialize the same ordered element-ID sequence;
- CBMC finds no violation of that named assertion within the stated bounds;
- the old concrete `[A,B]` versus `[B,A]` counterexample is no longer present.

## What remains unknown

The current result does not establish:

- commutativity for larger or overlapping states;
- general associativity or idempotence;
- multi-replica delivery-order convergence;
- partial-knowledge concurrent-move correctness;
- position-map correctness;
- allocation-failure safety;
- end-to-end serialization and old-state migration compatibility;
- sanitizer-clean whole-library behavior;
- whole-state merge preservation;
- a theorem for the abstract algorithm;
- correspondence between a future abstract proof and this C implementation;
- security certification or production readiness.

The candidate should therefore be reviewed as a repaired prototype with a
closed original example, not as “CRABS is proved correct.”

## Recommended next evidence

The next product-construction layer should freeze the current patch digest and
build generated bounded states covering two and three replicas, overlapping
identities, tombstones, sibling anchors, missing anchors, and move permutations.
In parallel within that layer, run serialization v7-to-v8 fixtures and
AddressSanitizer/UndefinedBehaviorSanitizer against the independently buildable
surface.

After the concrete algorithm stabilizes, define the placement algebra in Lean
for unbounded abstract merge laws and model delivery schedules in TLA+/TLC.
Neither receipt should be treated as C evidence until a separate correspondence
obligation connects the abstract state and observations to these exact bytes.
