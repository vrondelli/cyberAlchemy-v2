# Definitional-soundness review — round 1

Verdict: fail; bounded revision required. Hybrid remains viable but is not exact-binding closure.

Required repairs:

1. Add distinct `context` scope kind; current one-hop `focus` is not context ownership.
2. Aggregate portal needs `constituentCrossings[]` and `targetMembershipProofs[]`.
3. Define outside capability owner cardinality: zero → node fallback; one → one card; many → justified duplicate cards or explicit ambiguity, never silent choice.
4. Add explicit anchor membership basis; direct ownership proof binds anchor/source/member/target/direction and capability kind where claimed.
5. Bind completeness to graph snapshot, filter, rule version, admitted universe. Home says “4 selected contexts” or “4 of 12.”
6. Cluster cards, like Path, are conditional on lossless relation preservation.
7. Split exact selectors/fields into graph edge ID, source relation ID, source predicate, presentation relation, projected/source direction, source/projection authority.
8. Direction agreement is enum `with|against|symmetric|view-only|unavailable`, not boolean. Branch ID derives from ordered graph-edge IDs; result ID derives from canonical query, scope fingerprint, algorithm/version, total ordering.
9. Define Path projection recovery transition table with Path-local `returnFrame` or explicit navigation frame.
10. Bind IDs, labels, purpose, state, scope, algorithms, fallback to exact modules/fields.

Kill terminology/structures:

- UI term “complete graph”; use “all loaded graph.”
- current one-hop focus equated to context scene.
- `ClusterKind:"path-branch"` and path membership in cluster schema.
- singular crossing aggregate portal.
- unscoped completeness.
- ambiguous `authority` or `data-source-relation`.
- target context without exact ownership-binding proof.

Required legend copy:

> Presentation view only. Scenes, portal cards, and route alternatives organize the currently loaded graph. They do not add ontology membership, prove validity or completeness, change source authority, or promote any concept or relation.

> Projected direction is the rendered edge orientation. Traversal direction is the order followed by this route. Source direction comes only from the source relation and is shown as unavailable when it was not preserved.

> This portal card summarizes named crossing graph edges and target-membership relations. It is not a source relation between contexts.

Escape copy:

> Show all loaded graph — 237 nodes, 231 relations. “All loaded” does not mean ontology completeness.
