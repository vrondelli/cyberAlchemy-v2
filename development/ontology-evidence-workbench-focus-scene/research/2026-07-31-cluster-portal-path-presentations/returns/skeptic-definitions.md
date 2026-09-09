# Final definitional review

BLOCK for planned Work Pack admission.

Remaining defects:

1. Bind canonical ontology records/`owner_route` as meaning owners separately from adapter, derivation, state, and renderer owners.
2. Distinguish `graphSourceNodeId`/`graphTargetNodeId` from `sourceConceptId`/`targetConceptId`, or state a lossless mapping invariant; preserve in selectors.
3. Type and own `projectionAuthorityEffect`; if projection has no authority effect, constrain it to `"none"` and forbid copying/overriding source authority.
4. Bind visible “Connections either way” to `projected-undirected`; define `source-directed` treatment of symmetric and view-only relations.
