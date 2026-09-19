# Working glossary

These definitions are candidate-local explanatory terms, not canonical Definitions Governance entries.

- **Emits incoming closure evidence envelope** — A relation- and direction-specific digest-bound input record containing the boundary, eligible Entity/Event membership and placement, incoming `emits` fact set, completeness declarations, snapshot references, declarer, and producer needed for one evaluation.
- **Boundary identity** — The stable owner-scoped identity of the evaluated view.
- **Boundary-kind reference** — An owner-defined reference describing what the boundary represents. This Define does not create a closed vocabulary for boundary kinds.
- **Eligible population** — The complete set of source or target concepts that may participate in the evaluated relationship inside the boundary.
- **Placement evidence** — Evidence that each eligible concept is inside the declared boundary.
- **Incoming adjacency completeness** — A claim that every canonical incoming fact for the named relation and every eligible target is present in the bound snapshot.
- **Snapshot binding** — Exact digests that prevent populations, graph edges, registries, profiles, and manifests from different source states being evaluated together.
- **Completeness attestation** — The consumer-owned declaration that a named population or direction is complete for the bound boundary. It is an input claim, not an evaluator verdict.
- **Evaluation receipt** — Immutable evaluator-owned evidence binding the exact inputs, algorithm identity, result, diagnostics, and claim limit.
- **Currentness reference** — A separately owned determination of whether an immutable source or receipt remains current. Timestamps alone are insufficient.
- **Visible violation** — An observed invalid fact pattern that remains invalid without absence reasoning; here, more than one distinct Entity with incoming `emits` facts to the same Event.
- **Incomplete-closure verdict** — `not-evaluated-incomplete-closure`, meaning available evidence cannot justify an absence-based pass or failure.
