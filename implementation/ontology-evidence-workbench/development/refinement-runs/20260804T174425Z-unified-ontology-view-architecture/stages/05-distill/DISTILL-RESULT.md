# Distill Tournament — Unified Ontology View Architecture

Mode: Tournament  
Risk: high  
Joined evidence gate: pass (`subagents/evidence-lane/orchestration/run-01/reduction/gate-decision.json`)

## Smallest coherent unit

The coherent unit is not a renderer or a Body War page. It is a lossless, renderer-neutral `KnowledgeScene` compilation boundary plus one conformance-tested spatial renderer adapter and complete linear index. Splitting away the scene contract lets the renderer redefine semantics; including all future renderers overbuilds the first delivery.

## Candidate set

| Candidate | Semantic fidelity | Bounded navigation | Accessibility/testability | Scale | Migration/build coherence | Tournament result |
|---|---:|---:|---:|---:|---:|---|
| A. Patch current dual OEW routes | Low | M | Low | M | Low | dominated; rejects one-scene invariant |
| B. Copy Body War Atlas/UOC into one custom SVG app | H | M | M–H | M | Low–M | dominated on reusable state and maintenance |
| C. Shared scene + React Flow/ELK + linear/static adapters | H | H | H | M, unproved | H | selected provisional primary |
| D. Shared scene + Cytoscape/ELK + semantic DOM | H | H | M | H | M–Low | retained non-dominated fallback |
| E. Shared scene + Sigma/Graphology primary | H | M | Low | H | Low | deferred dense-overview adapter |

## Pareto gate

C is non-dominated for the first bounded semantic workbench: it has the best combination of source-fit, semantic DOM, rich cards, SVG geometry evidence, keyboard hooks, current React integration, and incremental migration. D is also non-dominated on compound/multigraph scale but costs a parallel semantic DOM and larger migration. The Plan must therefore treat C as an admission spike, not an irreversible library decision, and activate D only on named failures.

## Selected composition

1. `SourceGraphAdapter`: verifies project source and produces lossless source records.
2. `ViewPackCompiler`: resolves typed view roles, clusters, sequences, and allowed readings without changing source identity.
3. `SceneQuery`: builds bounded home/focus/path scenes and Grouped Portals.
4. `NavigationStore`: commits/restores complete Navigation Frames.
5. `LayoutAdapter`: sends stable dimensions/hierarchy/ports to deterministic ELK and receives geometry only.
6. `RendererAdapter`: first candidate React Flow; consumes scene + geometry and emits intents.
7. `Evidence/Index Projection`: retains current inspector, filters, deep links, receipts, and full denominator outside renderer ownership.
8. `LinearProjection` and `StaticProjection`: share source bindings with the interactive scene.

## Recomposition proof

The unit recomposes into every required user task:

- Home/cluster selection = View Pack + Scene Query.
- Real arrows/colors/icons = Scene Relation/Node + Layout + Renderer.
- Portals and Back = Grouped Portal + Navigation Frame.
- Path = source relation query + scene projection.
- Evidence and authority = Evidence Binding + inspector.
- Complete ontology = Full Index over the same admitted records.
- Print/no-JS = Static Projection.

No capability requires a second semantic graph or a renderer-owned relation.

## Rejected alternatives

- Current dual route: evidence proves it cannot compose arrows/portals with inspector/path/state.
- Atlas-as-product: strongest static fidelity, but project-specific and not interactive scene ownership.
- D3-only: excessive custom ownership for compounds, routing, a11y, culling, and lifecycle.
- Sigma primary: high scale but insufficient first-class semantic DOM/compound/card acceptance.
- One universal renderer: linear/accessibility and static/print tasks do not benefit from the spatial engine.

## Technique trace

| Technique | Result |
|---|---|
| abstraction_level_guard | pass — architecture remains a projection/workbench, not ontology schema |
| set_based_tournament | pass — five alternatives compared and non-dominated fallback retained |
| recomposition_proof | pass — all required tasks derive from the selected unit |
| evolution_profile | pass — fallback is a contract-driven adapter, not premature dual implementation |
| cognitive_load_check | pass with design obligation — bounded home and grouped portals, complete index escape |
| requisite_variety_check | pass — spatial, linear, and static adapters cover materially distinct tasks |
| boundary_object_check | pass — KnowledgeScene is explicit and authority-effect none |
| premortem_pass | flag — full Body War performance and cluster registry remain unexecuted |
| frame_expiry_note | pass — revisit renderer after exact spike or dependency/version drift |
| navigable_result_check | pass — selected unit, fallback, gates, and next artifact are explicit |

## Verdict

PASS TO DESIGN with two non-blocking gates: cluster membership remains source-owner work, and React Flow/ELK remains provisional until the full Body War adapter/browser spike passes. Neither gap prevents a design contract or an implementation plan that starts with pure scene fixtures.

