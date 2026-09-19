# N08 Complexity Example Ladder

All scenarios are hypothetical. The invariant is the exact same canonical `owns`
verb, owner Entity concept ID, target Entity concept ID, admitted D29 dimension ID,
and admitted authority or feature context authored more than once.
`decision_effect: none`.

## Low Complexity — One Exact Duplicate

Scenario: `TeamA --[owns_lifecycle]--> AccountB` is authored twice in the same
feature context.

- **A — Reject:** report the second authorship as an exact duplicate and require the authored source to be repaired.
- **B — Coalesce:** form one candidate fact; retaining both source handles becomes a conditional downstream design obligation.
- **C — Defer:** leave exact duplicate behavior unresolved and keep Design blocked.
- **D — Stop:** terminate without duplicate-authorship authority.

Demonstrates: the minimal exact duplicate. It does not decide topology, storage, or
runtime retry behavior.

## Medium Complexity — Distinct Dimension And Competing Owner Beside A Duplicate

Added complexity: the exact lifecycle fact is duplicated, one custody fact uses the
same endpoints, and `TeamC` also claims lifecycle ownership of `AccountB`.

- **A — Reject:** reject only the repeated `TeamA` lifecycle proposition; keep custody distinct and route the competing owner through D06 uniqueness.
- **B — Coalesce:** coalesce only the repeated `TeamA` lifecycle proposition with conditional provenance retention; do not merge custody or the competing owner.
- **C — Defer:** preserve the exact-duplicate diagnostic without changing either adjacent classification.
- **D — Stop:** end the route while D29 and D06 separations remain intact.

Demonstrates: duplicate identity versus dimension identity and uniqueness conflict.
It does not globalize duplicate policy.

## Complex — Cross-Feature Duplicate With Generated And Runtime Neighbors

Added complexity: two feature fragments author the exact same lifecycle proposition;
a generated `owned-by` projection, runtime writes and retries, an N04 self-edge, an
N06 same-dimension cycle, and an N07 mixed-dimension closed path are also present.

- **A — Reject:** reject the repeated authored proposition, preserve source handles for repair, independently reject N04/N06 violations, and do not reject the N07 path solely for mixed closure.
- **B — Coalesce:** form one candidate proposition with provenance retention as a later obligation while preserving every adjacent policy independently.
- **C — Defer:** keep only exact duplicate authorship unresolved; generated, runtime, and topology classifications do not decide it.
- **D — Stop:** terminate without altering any prior topology selection or adjacent evidence.

Demonstrates: cross-feature provenance and boundary preservation. It does not prove
an inverse authoring model, per-fact serialization, or runtime idempotency.

## Coverage

- Rungs: 3/3.
- A, B, C, and D appear exactly once per rung with equivalent scenario depth.
- Unsupported claims: 0; every scenario detail is hypothetical.
- Recommendation preserved: A, reject exact duplicate authored `owns` facts.
- Decision effect: none.
