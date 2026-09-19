# Complexity example ladder

Status: pass. Mode: explanatory. Decision effect: none.

Invariant across all rungs: a visible two-Entity-to-one-Event violation is invalid immediately, while absence of such a violation becomes `pass` only when the N37 boundary, populations, placement, and incoming adjacency are complete for one exact snapshot.

All scenario names and facts below are hypothetical.

## Low — one feature, one fact

A `ShoppingCart` Entity emits one `CartCheckedOut` Event. The consumer envelope names the feature boundary, lists the one eligible Entity and Event with placement, binds the graph/source manifest, and declares incoming `emits` adjacency complete. The evaluator finds one incoming Entity for the Event and returns `pass` for that snapshot.

Demonstrates: the smallest complete proof. Does not prove that the proposed record representation is canonical or implemented.

## Medium — visible conflict

The same feature snapshot contains `ShoppingCart --[emits]--> CartCheckedOut` and `CheckoutSession --[emits]--> CartCheckedOut` for the same Event concept ID. Even if the consumer forgot the completeness attestation, the evaluator can see more than one distinct incoming Entity and returns `invalid`.

Added complexity: a second source and a failure path. Demonstrates that observed maxima do not need absence reasoning. Does not prove runtime Event instance cardinality or Event-Sourcing behavior.

## Complex — incomplete loader and later reevaluation

A project has two same-feature source partitions. The first evaluation binds only one partition; no visible conflict exists, but the Event population and incoming adjacency are not complete, so the result is `not-evaluated-incomplete-closure`. A later evaluation binds a new source-set digest and a complete consumer attestation. It may then return `pass` or expose a second incoming Entity and return `invalid`; the first receipt remains immutable historical evidence.

Added complexity: multiple source partitions, snapshot evolution, staleness, and two possible later outcomes. Demonstrates why source manifests and completeness attestations are distinct. Does not select storage placement, admission, or evaluator implementation.

Coverage: 3/3 rungs; unsupported claims: 0; decision effect: none.
