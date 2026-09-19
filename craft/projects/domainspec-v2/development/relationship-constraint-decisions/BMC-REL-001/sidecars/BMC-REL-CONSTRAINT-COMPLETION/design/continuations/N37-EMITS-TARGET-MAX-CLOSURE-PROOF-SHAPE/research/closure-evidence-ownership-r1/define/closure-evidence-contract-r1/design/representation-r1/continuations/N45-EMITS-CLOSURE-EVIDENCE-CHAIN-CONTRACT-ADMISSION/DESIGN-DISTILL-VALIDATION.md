# N45 Distill validation

Mode: Standard, two rounds.

## Round 1 — whole chain

Candidate concept: admit the N43 envelope contract and N44 receipt contract together as the candidate Design target.

Required residue: exact schema bytes, cross-schema binding, result precedence, separate owners, immutable snapshot semantics, external currentness, and `authority_effect: none` until the owner selects.

Rejected reductions: envelope-only admission, receipt-only admission, compiler-owned completeness, evaluator-owned semantics, or implementation bundled into Design admission.

## Round 2 — smallest coherent unit

The smallest unit remains the coordinated two-contract chain. Removing either schema makes the promised evaluation evidence incomplete. Adding a producer, evaluator implementation, packet facet, profile, currentness registry, or release path exceeds the decision.

Verdict: one coherent action plus defer and stop. Decision effect: none until an exact owner response selects a presented option.
