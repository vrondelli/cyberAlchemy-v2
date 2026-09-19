# Design Distill Validation

## Run Frame

- Mode: Standard (assumed because no explicit budget was supplied).
- Roles: Invoke parent as Proposer; bounded read-only native helper as Balancer.
- Rounds: two.
- Target: smallest coherent Design unit for one unified ontology canvas.

## Round 1 — Boundary

**Proposer:** one presentation graph should normalize meta-types, architecture
types, profiles/constraints/properties, supplied facts, and findings before a
renderer sees them.

**Balancer objections:** concatenating the five existing builders would produce
an unreadable sixth renderer; 60+ nodes, profile provenance, candidate
alignments, Adapter non-mapping, fixed TypeScript findings, and accessibility are
easy to collapse.

**Reconciliation:** select an immutable `UnifiedCanvasGraph` as the boundary.
Make constraints first-class nodes, include all profiles, pin facts/findings to
TypeScript, preserve unsupported/unmapped gaps, and make the structured navigator
an equal consumer of the graph.

## Round 2 — Recomposition

**Proposer:** deterministic band layout, routed edges, SVG rendering, interaction
state, navigator, and inspector can consume the one graph through named pure or
effect boundaries.

**Balancer objections:** fit-all can become illegible; SVG node-per-tab and
partial `role="application"` semantics can be worse than no custom keyboard
model; edge proximity can overstate authority.

**Reconciliation:** all identities stay present, default Rule trace is emphasized
while unrelated nodes dim, semantic zoom reduces label density, explicit ports
and relation text prevent visual collapse, and application semantics are withheld
until navigator/keyboard acceptance passes.

## Selected Smallest Coherent Unit

`UnifiedCanvasGraph` projection contract:

- exact inputs: current complete static data bundle;
- responsibility: stable normalized identities, source-native and explicit
  presentation bridge edges, indexes, gaps, source digests, graph digest;
- output: renderer-independent immutable graph;
- exclusions: coordinates, SVG, DOM, focus state, browser behavior, authority.

This unit closes independently and recomposes through
`Graph -> Layout -> Renderer/Interaction -> Canvas/Navigator`.

## Technique Trace

| Technique | Result |
| --- | --- |
| abstraction-level guard | graph projection is a pure contract/capability, not a new ontology |
| recomposition proof | every downstream part consumes a named graph/layout/state contract |
| cognitive-load check | five bands, default trace, semantic zoom, navigator; no undifferentiated hairball |
| requisite-variety check | separate status axes, profiles, facts, findings, and relation kinds retained |
| boundary-object check | graph IDs/derivations shared by renderer and navigator without moving source authority |
| concept-vs-knowledge-status | planned graph contract is Design-backed; runtime/usability claims remain open |
| premortem | likely failure and guardrails below |
| navigable-result check | SPEC -> ARCHITECTURE -> UX -> WORK-PACK -> SWU-UOC-001 |

## Premortem

Most likely failure: “one canvas” becomes a visually impressive but unreadable
hairball whose connecting lines imply mappings and evidence that the source never
asserted. Guardrails: exact bridge derivations, deterministic bands/ports,
constraint nodes, TypeScript provenance, gap rendering, default trace emphasis,
and equivalent structured navigation.

## Frame Expiry

Rerun Design Distill if source data becomes remote/dynamic, a real language
adapter supplies observations, graph size exceeds the deterministic layout, the
view becomes an editor, or any authority/admission action enters scope.

## Verdict

Pass for Design coherence and recomposition. No implementation or mutation
authority is granted.
