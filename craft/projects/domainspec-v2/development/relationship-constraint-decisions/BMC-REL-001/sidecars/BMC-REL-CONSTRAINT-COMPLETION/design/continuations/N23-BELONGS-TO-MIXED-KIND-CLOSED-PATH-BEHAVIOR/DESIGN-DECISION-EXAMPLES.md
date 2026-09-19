# N23 Complexity-Aligned Decision Examples

All facts are hypothetical. The invariant is whether combined closure alone
invalidates a direct `belongs-to` path using at least two exact D30 kinds; every
edge retains its kind and contains no N20 or N22 violation. Decision effect: `none`.

## Low — Two Entities, Two Kinds

Scenario: `Reply-A belongs-to_classification Topic-B` and
`Topic-B belongs-to_home-assignment Reply-A`.

- A: allow both independently kind-bearing facts; derive no global membership or
  endpoint reachability.
- B: reject the two-edge combined closure and require enough source repair to break it.
- C: leave only mixed-kind closure unresolved and block downstream evaluation.
- D: end the continuation without changing either fact.

Demonstrates: the smallest mixed-kind closure. Does not prove either behavior.

## Medium — Three Entities, Acyclic Per-Kind Projections

Added complexity: `A --classification--> B --home-assignment--> C
--classification--> A`; each individual kind projection remains acyclic.

- A: preserve all three direct facts because closure exists only after kinds are
  combined.
- B: reject the combined three-edge path despite acyclic per-kind projections.
- C: preserve the diagnostic without selecting behavior.
- D: stop without changing the topology.

Demonstrates: kind projection versus combined graph behavior. Does not decide
reachability, closure completeness, or duplicates.

## Complex — Cross-Feature Path, Prior Violations, And Future Kind

Added complexity: a cross-feature mixed-kind closed path includes hypothetical later
kind `affiliation`; separate proposals also contain a direct self-edge and a
same-classification cycle.

- A: do not reject the mixed path solely for closure, including the future kind if
  separately admitted; independently reject the self-edge under N20 and same-kind
  cycle under N22.
- B: reject the mixed closure while independently preserving N20/N22 rejections.
- C: keep only mixed-kind behavior unresolved; prior rejections remain active.
- D: terminate without N23 authority; N20 and N22 remain fixed.

Demonstrates: adjacent-policy separation, registry evolution, and cross-boundary
facts. Does not admit `affiliation`, choose cross-feature policy, prove completeness,
or authorize representation/runtime behavior.

## Coverage

- Rungs: `3/3`
- Options per rung: A, B, C, D with equivalent depth
- Unsupported claims: `0`
- Unequal option coverage: `false`
- Decision effect: `none`
