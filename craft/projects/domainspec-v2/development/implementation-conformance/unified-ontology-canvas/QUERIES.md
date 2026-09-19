# Calculations And Queries

## `BuildUnifiedCanvasProjection`

- Type: Calculation
- Inputs: ontology, meta-type projection, base plus all language profiles,
  supplied facts, and expected evaluation. The selected profile is not an input
  to graph construction.
- Output: immutable nodes, edges, indexes, source references, and graph digest.
- Failure: reject duplicate IDs, missing endpoints, unknown source families, or
  undeclared bridge derivations; never silently omit the bad record.

## `ComputeDeterministicCanvasLayout`

- Type: Calculation
- Inputs: unified graph, band order, deterministic sort keys, node sizes.
- Output: stable coordinates, band bounds, edge ports/corridors, overall bounds.
- Rule: equal inputs yield byte-identical coordinates and ordering.

## `ApplyCanvasFocus`

- Type: Query
- Inputs: graph, visible families, maturity/coverage filters, relation toggle,
  selected-profile emphasis, search text, and focused node set.
- Output: visibility/emphasis state over the same graph ID.

## `FindCanvasTrace`

- Type: Query
- Inputs: graph and one node ID.
- Output: the real connected path set plus named missing-hop explanations.
- Rule: trace stops at a missing explicit bridge; it never guesses.

## `InspectCanvasNode`

- Type: Query
- Inputs: graph and one node ID.
- Output: plain-language summary, source family, exact identity, statuses,
  incident relationships, raw contract, claim ceiling, and owner route.
