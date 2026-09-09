# CRABS ordered-set repair plan

Status: planning candidate; implementation not authorized
Finding addressed: `R8-O-1`, bounded by the EVF obligation in this package
Product-construction frontier: select the intended convergent ordering semantics
Authority effect: none

## Repair objective

Produce one exact CRABS product candidate whose ordered-set state converges
without erasing the intended meaning of insert and move operations.

For the selected state model, replicas that have received the same operations
must materialize the same ordered element-ID sequence, regardless of merge
direction or delivery order. The repaired merge must also preserve earlier
guarantees for element identity, deletion state, counts, ownership, and memory
lifecycle.

## Decision required before coding

The existing representation stores an element ID and linked-list neighbors,
but it does not store the durable reason an element occupies a position. A
repair therefore needs a product decision about placement semantics.

Two candidate approaches exist:

| Candidate | Description | Advantage | Cost or danger | Recommendation |
| --- | --- | --- | --- | --- |
| Global ID order | Materialize every element by a total ordering of its operation ID. | Small and easy to check; makes the tested merge deterministic. | Can destroy user-selected insert and move order. It changes the ordered list into an ID-sorted set. | Use only as a diagnostic prototype, not as the default product repair. |
| Anchored convergent order | Store the logical predecessor or head anchor for each placement. Concurrent children of the same anchor use a deterministic ID tie-break. Moves update placement through a defined version rule. | Preserves intentional relative placement while giving replicas the same conflict resolution. | Requires representation, merge, serialization, and compatibility work. | Recommended product candidate. |

The CRABS owner must choose the intended compatibility contract before an
implementation candidate is frozen. The rest of this plan assumes the anchored
model.

## Proposed invariant

The candidate design should make these rules explicit:

1. An element is identified by the existing stable pair of `node_id` and
   `sequence_num`.
2. Membership merge is set union by element identity.
3. Deletion is monotonic: if either replica has a tombstone, the merged element
   remains deleted.
4. Each live or deleted element retains a placement record rather than relying
   only on its current linked-list neighbors.
5. A placement names either the head sentinel or a predecessor element ID.
6. Concurrent placements under the same anchor are ordered using one total,
   byte-defined operation-ID comparator shared by every implementation.
7. A move creates a new placement version; concurrent moves are resolved by an
   explicitly selected deterministic rule rather than arrival order.
8. The visible linked list is a materialized view of the merged element and
   placement records.
9. Missing anchors, cycles, duplicate identities with conflicting immutable
   payloads, and allocation failures have defined fail-closed behavior.

The exact comparator must be specified byte-for-byte. It should align with the
identity definition and must not depend on locale, pointer values, host
endianness, wall-clock arrival, or merge direction. Timestamp must not silently
become identity because current equality ignores it.

## Construction layers

| Layer | After this layer, we know whether... | Minimum working unit | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- |
| R0 — meaning | ...the owner accepts one exact ordering, move-conflict, payload-conflict, and compatibility rule. | Plain-language examples plus normative state and merge rules. | Owner-reviewed immutable design candidate and test vectors. | Approve model prototyping, revise, or stop. |
| R1 — reference model | ...the proposed state algebra can satisfy the intended laws before C mutation. | Small provider-neutral reference model for insert, delete, move, merge, and materialization. | Property runs for commutativity, associativity, idempotence, tombstones, and concurrent placements. | Select one product model candidate. |
| R2 — C product candidate | ...CRABS can represent and execute that model with explicit migration behavior. | Exact changes to ordered-element metadata, merge/materialization, operation application, cleanup, and serialization. | Unit tests, old-format/new-format fixtures, compiler checks, and exact candidate digest. | Freeze a testable product candidate. |
| R3 — implementation evidence | ...the frozen C candidate satisfies the declared executable bounds and memory checks. | Native regression tests, property generation, CBMC harnesses, sanitizers, and failure-path tests. | Current receipts tied to exact source, harness, compiler, and runtime hashes. | Product review, repair, or reject. |
| R4 — abstract and temporal assurance | ...the approved algorithm satisfies broader algebraic and multi-replica behavior and the C candidate corresponds to it. | Lean merge algebra, TLA+/TLC delivery model, and explicit refinement/correspondence checks. | Separate theorem, temporal-model, and C-correspondence receipts. | Independent audit candidate; no automatic release authority. |

## R0: definition work

Before code changes, write examples for:

- two concurrent inserts at the head;
- two concurrent inserts after the same element;
- inserts under different anchors;
- delete concurrent with move;
- two concurrent moves of the same element;
- move concurrent with insertion beside the moved element;
- an anchor that arrives after its child;
- an anchor that is permanently absent or deleted;
- duplicate identity carrying different payload bytes;
- serialization and upgrade from the current representation.

Each example must state the expected final element-ID sequence and why every
replica obtains it.

The owner must also decide whether compatibility requires reading old states,
writing old states, both, or neither. A layout change without this decision can
turn a convergence repair into data loss or wire incompatibility.

## R1: reference model and TDE obligations

TDE should create provider-neutral obligations first. EVF then binds each
obligation to the appropriate tool.

| Obligation | Tool consumption | What the receipt may claim |
| --- | --- | --- |
| Merge commutativity | Generated state pairs plus CBMC over bounded C | No counterexample at the exact bound, or a concrete counterexample. |
| Merge associativity | Generated state triples plus CBMC at a smaller explicit bound | Same normalized result for the explored triples only. |
| Merge idempotence | Property tests and CBMC | Merging a bounded state with itself leaves its normalized state unchanged. |
| Tombstone monotonicity | Property tests and CBMC | A deletion cannot be resurrected in explored merges. |
| Deterministic sibling order | Reference-model exhaustive enumeration, then CBMC | Concurrent siblings materialize identically for enumerated/bounded IDs. |
| Move conflict convergence | Reference-model event permutations and TLA+/TLC | Selected delivery schedules converge in the abstract model. |
| Algebraic merge laws | Lean | The laws hold for the stated abstract definitions and assumptions. |
| C-to-model correspondence | Translation/refinement tests plus targeted review | The tested C observations match the reference model for the selected corpus; not a general theorem unless separately proved. |

The first R1 test denominator should include empty states, one to three elements,
two and three replicas, disjoint and overlapping identities, tombstones, and
concurrent sibling placements. Larger bounds are later cost decisions, not
implicit claims.

## R2: anticipated C change surface

No file is authorized for mutation yet. The likely candidate surface is:

- `src/OT/ot_ordered_set.h`: persistent placement metadata and public contract;
- `src/OT/ot_ordered_set.c`: comparator, merge, materialization, insert, delete,
  move, swap, counts, and cleanup;
- OT serialization/deserialization carriers identified during exact scoping;
- tests and bounded harnesses owned by the candidate;
- protocol documentation and version/migration notes.

The implementation should not sort the current linked list in place and call
that convergence. It should merge durable records and then derive the list.
Otherwise a later operation can reintroduce arrival-order dependence.

## R3: executable validation matrix

The frozen candidate should not advance on the original two-element check
alone. Required checks include:

- rerun the exact failing two-singleton obligation unchanged;
- commutativity across generated bounded state pairs;
- associativity across bounded state triples;
- idempotence for each bounded state;
- duplicate delivery and repeated merge;
- deletion-wins behavior without resurrection;
- concurrent insertions at the same and different anchors;
- concurrent and causally ordered moves;
- position-map present and absent paths;
- internal `prev`/`next`, `head`/`tail`, `count`, and `visible_count` invariants;
- allocation-failure behavior;
- AddressSanitizer and UndefinedBehaviorSanitizer runs;
- serialization round trips and version migration;
- whole-state merge preservation of ordered-set/OT data.

A property result is accepted only when the named subject property fails or
passes as declared. Parser errors, unwinding limits, timeouts, output-limit
violations, compiler failures, sanitizer crashes, and harness failures remain
`not_evaluable` for the subject claim.

## Product construction and operational support

### Product construction

- Current frontier: R0 ordering and compatibility decision.
- Runnable after that decision: R1 reference-model prototypes and provider-
  neutral TDE obligations.
- C mutation begins only at R2 under a separate exact implementation route.
- Product approval is possible only after one frozen R2 candidate has current
  R3 evidence and owner review.

### Operational support

- CBMC 6.11.0 and its exact package are already available locally under the
  ignored `.formal-tools/` path.
- The existing EVF schema, fixtures, validator, runner, and correction ledger
  can be reused as mechanics, but their old evidence cannot be relabeled as
  evidence for changed CRABS bytes.
- Branch creation, dependency setup, CI wiring, disclosure preparation, and PR
  administration are operational tasks. None currently blocks R0 planning.

### Causal blockers

- The ordering/move semantics and compatibility posture have no recorded owner
  decision.
- The exact serialization and whole-state carriers affected by new placement
  metadata have not yet been scoped.
- No CRABS repair implementation has been authorized.

### Deferred operational residue

- upstream issue or disclosure;
- commit, push, pull request, release, or deployment;
- compatibility rollout and data migration;
- independent security-audit publication.

## Non-regression rules

- Keep the original failing run and correction history immutable.
- Bind every repair run to a new source digest and candidate identity.
- Preserve tombstones until the separately defined compaction safety rule allows
  removal.
- Do not treat a reference-model or Lean success as C conformance.
- Do not treat bounded CBMC success as an unbounded proof.
- Do not treat product approval as publication, release, deployment, or
  upstream-change authority.

## Recommended immediate next action

Run R0 as a focused owner design review. Present the global-ID-order diagnostic
and anchored-order product candidate using the concrete examples above. Record
one exact selection for ordering, concurrent moves, payload conflicts, and
compatibility. Only then create the reference model and expanded TDE obligation
set.
