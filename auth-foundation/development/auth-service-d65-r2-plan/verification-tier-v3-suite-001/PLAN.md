# Auth Foundation V3 trait-complete verification plan

## Objective

Verify a five-obligation Auth property family with methods matched to each
property's semantics, direct evidence bindings, declared shared infrastructure,
route-specific mutation controls, and independent replay.

## Layers

1. **L0 - contract:** V3 kernel rejects stale, incomplete, conflicting, or
   indirectly bound provider evidence.
2. **L1 - formal routes:** Rust, Lean, TLC, Alloy, and Soufflé execute within
   explicit finite bounds.
3. **L2 - mutation assurance:** each route has a control that must fail or find
   a counterexample when its defining guard is removed.
4. **L3 - audit package:** sealed evidence and an independent replay support a
   repeatable software-correctness audit deliverable.

After L3, we know whether this exact Auth candidate suite can support a bounded
audit claim. Continuous execution, governance admission, external
accreditation, publication, and customer delivery remain deferred.

## Open Questions

- Which admitted runtime should schedule recurring verification?
- Which external assurance scheme should receive the evidence crosswalk?
- Should shared Java infrastructure require a second JVM implementation?
