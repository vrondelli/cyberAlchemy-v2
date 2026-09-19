# N04 Complexity Example Ladder

All scenarios are hypothetical. The invariant is one canonical `owns` fact classified
under one admitted D29 dimension whose source and target are the same Entity concept.
The examples compare options without selecting one. `decision_effect: none`.

## Low Complexity — One Reflexive Lifecycle Fact

Hypothetical `Account` authors
`Account --[owns:lifecycle]--> Account`.

- **A — reject:** classify the fact as a self-edge and require a distinct owner or no
  ownership fact; ownership remains optional.
- **B — allow:** admit this one reflexive fact under `lifecycle`; it remains optional
  and D06 uniqueness still permits at most one owner for that target and dimension.
- **C — defer:** leave the self-edge unresolved and Design blocked.
- **D — stop:** end this route without a self-edge policy.

Demonstrates: equality of source and target within one dimension. Limits: does not
prove representation, mandatory ownership, cycle policy, or implementation.

## Medium Complexity — Separate Dimensions And Owners

Hypothetical `Workspace` authors a reflexive `lifecycle` owns fact, while a distinct
`OperationsTeam` Entity owns the same Workspace under `custody`.

- **A — reject:** reject only the reflexive lifecycle fact; preserve the distinct
  custody owner because dimensions remain independent.
- **B — allow:** admit the reflexive lifecycle fact and the distinct custody fact;
  neither creates competing owners within one dimension.
- **C — defer:** preserve both authored facts as evidence but block self-edge-sensitive
  continuation.
- **D — stop:** terminate the continuation without interpreting the reflexive fact.

Added complexity: two admitted dimensions and a distinct owner dependency. Limits:
does not choose per-fact storage, dimension vocabulary, or numeric bounds.

## Complex — Cross-Feature Graph With A Separate Longer Cycle

Hypothetical cross-feature evidence contains one reflexive `write-responsibility`
fact for `Ledger`, several valid non-reflexive owns facts, and a separate two-Entity
ownership cycle containing no self-edge. One source fragment is temporarily missing.

- **A — reject:** reject only the Ledger self-edge, preserve non-reflexive facts, and
  leave the separate cycle and missing evidence for their own later gates.
- **B — allow:** admit only the Ledger reflexive fact under this policy, preserve the
  other facts, and still leave the separate cycle and missing evidence unresolved.
- **C — defer:** make no reflexivity decision and keep the self-edge continuation
  blocked without interpreting the longer cycle.
- **D — stop:** close this route without deciding the self-edge or any other topology.

Added complexity: feature boundary, mixed topology, missing evidence, and an
independent later decision. Limits: does not prove distributed merge behavior,
transitivity, cycle acceptance, runtime behavior, or product correctness.

## Coverage

- Rungs: `3/3`
- Options: A, B, C, and D exactly once per rung
- Shared invariant preserved: yes
- Unsupported claims: `0`; all scenario details are labelled hypothetical
- Decision effect: `none`
