# CRABS ordered-set convergence finding

Status: evidence-backed finding for one bounded case
Subject: CRABS commit `9e3a0a6fbaa3f163d0afc5afa94a65fbc5be1937`
Finding: ordered-set merge is not commutative for the tested two-singleton case
Authority effect: none

## Plain-language result

Two CRABS replicas can contain the same two elements but disagree about their
order after they merge.

Imagine one replica contains only `A`, while another contains only `B`. When
the first replica receives the second, CRABS keeps `A` and appends `B`, giving
`[A, B]`. When the second replica receives the first, it keeps `B` and appends
`A`, giving `[B, A]`.

Both replicas now know about the same elements, but they do not have the same
ordered state. For an ordered replicated data type, membership agreement is
not enough: the order is part of the observable value.

## What causes it

`crabs_ot_ordered_set_merge` starts with the destination list. For every source
element that is missing from the destination, it creates a copy and inserts it
after the destination tail.

The destination therefore wins the first positions, while source-only
elements arrive afterward. Reversing the direction of the merge reverses that
privilege. The resulting order depends on message arrival and call direction,
not solely on the combined replicated state.

In compact form:

```text
destination A + source B -> keep A, append B -> [A, B]
destination B + source A -> keep B, append A -> [B, A]
```

This is why the defect is structural rather than a random test failure. The
implementation contains no deterministic rule that both replicas can use to
place source-only elements in the same order.

## Why commutativity matters

A merge operation is commutative when changing the direction of the merge does
not change its normalized result:

```text
merge(A, B) = merge(B, A)
```

Distributed replicas commonly receive equivalent information in different
orders. If merge direction affects the ordered value, replicas can remain
divergent even after both have received the same elements.

There is also a plausible downstream consequence: CRABS operations such as
delete, update, move, and swap address visible positions. If replicas disagree
about which element occupies a position, a later position-based operation may
act on different elements. That consequence is an inference from the API and
has not yet been established by the current bounded harness.

## How EVF established the finding

The evidence flow separates the claim from the tool:

```text
TDE obligation
  "the two merge directions must have equal element-ID sequences"
        |
        v
EVF provider binding
  actual CRABS merge function + bounded C harness + modeled dependencies
        |
        +--> native GCC execution: [A,B] differs from [B,A]
        |
        +--> CBMC 6.11.0: main.assertion.1 is FAILURE
        |
        v
append-only run receipt + bounded result summary
```

TDE states what must be true without naming a solver. EVF selects CBMC because
the obligation concerns executable C at a finite bound. The harness compiles
the actual `ot_ordered_set.c` merge implementation rather than a rewritten
copy. Its small dependency model preserves operation-ID equality and allocation
semantics while excluding position maps, as declared by the obligation.

The effective live receipt is `crabs-cbmc-2b11794bc7f1c2bc`. Native execution
exits on the commutativity assertion after printing the two different orders.
CBMC exits with code 10 and marks the named property
`main.assertion.1` as `FAILURE`.

## Evidence-history correction

The first live attempt was not evaluable because CBMC could not find its C
preprocessor. The runner was changed to expose only the exact manifest-bound
GCC executable through a private temporary path.

A later attempt produced `VERIFICATION FAILED`, but the failing property was a
`strncpy` unwind assertion while the commutativity property was reported as
`SUCCESS`. The original normalizer was too broad and incorrectly stored that
run as a counterexample. Its bytes were not rewritten. A separate correction
record marks it `not-evaluable` and points to the valid replacement run. The
normalizer now accepts a counterexample only when the named commutativity
property itself ends in `FAILURE`.

This history matters because a tool failure and a subject failure are not the
same kind of evidence.

## What is established

At the pinned commit, with two replicas, one distinct live element per replica,
no position maps, and allocation failure excluded:

- native execution produces different ordered element-ID sequences;
- CBMC finds a counterexample to the same named assertion;
- merge is not commutative for this exact case;
- the earlier Round 8 audit statement `R8-O-1` now has independent executable
  support for this bounded case.

The Round 8 audit was used as source context and target-selection evidence. It
is not counted as the independent validation of its own claim.

## What is not established

This result does not establish that:

- every ordered-set state diverges;
- associativity or idempotence fails;
- position-map merging is correct or incorrect;
- moves, swaps, deletions, or updates converge;
- allocation and memory-failure behavior is safe;
- whole-state CRABS merging preserves OT values;
- the authorization, cryptographic, or serialization layers fail;
- any proposed repair is correct;
- CRABS as a whole is insecure;
- a product, release, or publication decision has been approved.

CBMC is a bounded implementation checker here, not an unbounded mathematical
proof. A future Lean theorem could prove laws for an abstract merge model, but
would not by itself show that the C code implements that model. A future TLA+
model could check multi-replica event sequences, but would likewise require an
explicit correspondence argument back to the executable implementation.

## Severity interpretation

The finding is correctness-significant because convergence is a defining
property of replicated state. The repository's Round 8 audit calls the path
latent because it reports no current callers. That reduces demonstrated current
reachability; it does not repair the merge or make the behavior safe if the API
is used as the state-sync path.

The appropriate current statement is therefore:

> A concrete and CBMC-bounded counterexample shows that the pinned CRABS
> ordered-set merge is non-commutative for two distinct singleton replicas.
> Runtime reachability and broader protocol impact remain separate questions.

## Repair direction

The repair must make order a deterministic function of merged replicated
information. Merely changing where source elements are appended is not enough.
The recommended design direction is an anchored sequence model in which each
element retains persistent placement information, concurrent siblings use a
stable operation-ID tie-break, deletion remains monotonic, and moves have an
explicit deterministic conflict rule.

The full staged proposal and its validation obligations are in
[`repair-plan.md`](repair-plan.md).
