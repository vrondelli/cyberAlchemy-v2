# Mappings

## Source Grammar to PrototypePolicy

`EDGES.yaml` supplies verb meaning and inverse semantics.
`ALLOWED-EDGES.yaml` supplies the closed endpoint/cardinality table. The
prototype pins their digests and translates them into an in-memory lookup; it
does not rewrite either file.

## Fixture to Validated Graph

Input order is discarded. Nodes and edges are normalized by stable ID, then
validated. The normalized graph exists only in memory and the run bundle.

## Validated Graph to ResearchLineageProjection

1. select validated `derives-from` edges;
2. start from `F1` and traverse to `R1`, then `D1`;
3. include stable node metadata and input digests;
4. exclude `contradicts` from closure;
5. attach conflicts as non-composing annotations;
6. serialize deterministically.

## Result to Static Report

Canonical run JSON is mapped to:

- disposition summary;
- research-lineage diagram and table;
- policy/digest panel;
- conflict appendix;
- isolation and evidence-ceiling panel.

The HTML report has no independent semantic state.
