# N37 Architecture Bundle

Decision: `BMC-REL-NONNUMERIC-37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE`

Selection: `null`. Recommendation: A. `authority_effect: none`.

## 1. Context View

N36 A withholds whole-boundary conformance until relevant closure exists. N37 names
the evidence coordinates that can end that not-evaluated state for the selected
authored-concept target maximum.

## 2. High-Level Structure View

Both action options bind boundary identity/kind, complete eligible Entity and Event
populations, and complete incoming `emits` adjacency for every eligible Event. A
leaves outgoing adjacency open; B proves outgoing adjacency complete as well.

## 3. Low-Level Components View

The evaluator consumes the selected `target_max = 1`, the N33/N34 authored-fact
counting basis, endpoint populations and placement, and incoming adjacency grouped by
Event ID. Exact duplicates remain rejected. Runtime Event instances are absent.

## 4. Workflow Process View

1. Bind the numeric and N36 owner receipts.
2. Verify boundary identity/kind and complete eligible Entity/Event populations.
3. Verify complete incoming `emits` adjacency for every eligible Event.
4. Under A, evaluate target maximum without outgoing closure; under B, also require
   complete outgoing adjacency.
5. Present A/B/C/D and Explain, then stop at the relationship decision owner.

## 5. Decision Flow View

- Missing either endpoint population or incoming adjacency: neither A nor B proves
  whole-boundary conformance.
- A evidence present: evaluate the selected target maximum.
- B evidence present: evaluate the same target maximum with a stronger symmetric
  envelope.
- C leaves the proof shape unresolved; D terminates the route.

A is recommended because outgoing completeness cannot change the selected target
predicate and should not be a mandatory proof coordinate.

## 6. Dependency Interface View

Inputs are immutable Design decisions and canonical evidence. Outputs are Design-only
gate artifacts. No serializer, packet enum, loader API, runtime event model, canonical
source, implementation, or release surface is selected or mutated.
