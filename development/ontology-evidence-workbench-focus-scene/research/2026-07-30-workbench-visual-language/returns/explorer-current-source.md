# Explorer return — current source and browser runtime

Agent: Hewitt, Carl  
Action: `spawn-0001`  
Status: pass, read-only

## Observed control map

| Visible control | Current state transition and purpose | Exact owner or selector |
|---|---|---|
| Overview | `setPersona("non-technical")`; changes persona, not graph scope | accepted archive `packages/dashboard/src/components/PersonaSelector.tsx:10-39`; `button[title="High-level architecture view"]` |
| Learn | `setPersona("junior")`; exposes LearnPanel and Start Tour but leaves the full graph visible | `PersonaSelector.tsx:10-39`; `App.tsx:444-457`; `button[title="Full dashboard with guided learning"]` |
| Deep Dive | `setPersona("experienced")`; selects the code-focused presentation | `PersonaSelector.tsx:10-39`; `button[title="Code-focused with chat"]` |
| Diff OFF | Would toggle a diff overlay, but is disabled because the gateway serves an empty diff document | `App.tsx:545`; `DiffToggle.tsx`; `button[title="No diff data loaded"]` |
| All | Toggles the whole `knowledge` node-type filter; it is not an Overview action | `App.tsx:592-624`; `store.ts#nodeTypeFilters`; `button[title="Hide All nodes"]` |
| Filter | Opens node/complexity/layer/edge filters and closes Export | `FilterPanel.tsx:6-106`; `store.ts:580-583`; `button[title="Filter graph (F)"]` |
| Export | Opens PNG/SVG/JSON export and closes Filter | `ExportMenu.tsx:218-276`; `store.ts:585-588`; `button[title="Export graph (E)"]` |
| Path | Opens path-finding between graph nodes | `App.tsx:629-652,756-760`; `store.ts:590-593`; `button[title="Find path between nodes (P)"]` |
| Theme | Opens appearance, accent, and heading-font controls | `ThemePicker.tsx:6-179`; `button[title="Change theme"]` |
| Keyboard help | Opens shortcut help | `App.tsx:654-672,746-753`; `button[title="Show keyboard shortcuts"]` |
| Search | Searches name, summary, and tags; selecting a result navigates to the node | `SearchBar.tsx:24-112`; `store.ts:533-545`; `[data-testid="search-input"]` |
| Fuzzy | Selects fuzzy search | `SearchBar.tsx:113-133`; `store.ts:532-545` |
| Semantic | Changes only the mode flag; both modes currently use the same fuzzy engine | `SearchBar.tsx:113-133`; `store.ts:540-543` |
| Freshness warning | Expands graph freshness/provenance details | `App.tsx:196-216,679-680`; `StalenessBanner.tsx:100-178` |
| React Flow controls | Zoom, fit view, and canvas interactivity only | `KnowledgeGraphView.tsx#ReactFlow.Controls` |
| Info / Files | Switches sidebar content | `App.tsx:444-482` |
| Start Tour | Sets tour state and enters the first bounded focus scene | `store.ts:617-630`; `knowledgeFocusScene.ts:103-185`; focus patch |

## Default full-graph path

1. `App.tsx:145-194` loads `/knowledge-graph.json` and calls `setGraph`.
2. `App.tsx:171-174` selects the knowledge graph.
3. `knowledgeFocusScene.ts:127-146` derives a bounded graph only when a tour or focus node is active.
4. `knowledgeFocusScene.ts:147-155` returns `mode=full` with the original graph when neither is active.
5. The focus patch renders `filteredGraph` whenever `scene.active` is false.

Observed baseline: 237 nodes, 231 edges, 0 portals. Clicking Learn alone retains 237/231. There is no explicit full-graph action: Unfocus falls through to full mode, while the Overview persona does not change graph scope.

## Freshness path

`scripts/serve-oew-prototype.mjs` synthesizes `/staleness.json` with status `unknown` and reason `graph-commit-unavailable`. `App.tsx:196-216` loads it and `StalenessBanner.tsx:33-39,100-161` renders checkout-specific prose and the `/understand` recommendation.

That status is mechanically truthful to the synthesized document but contextually misleading: the retained prototype gateway does not inspect a checkout commit.

Viable treatments:

1. Prefer a prototype-provenance banner backed by the pinned upstream commit and adapter/build receipts.
2. Retain the existing freshness UI only if the gateway can serve a genuinely comparable graph commit.
3. Candidate-only suppression is acceptable only when adjacent provenance remains visible: build handle, adapter receipt, and `authority_effect=none`.

Freshness, build provenance, ontology validity, and promotion authority must remain distinct.

## Renderer owners

- Card owner: accepted archive `CustomNode.tsx:96-202`. Cards currently show presentation type, complexity, name, and summary; no ontology-category icon owner exists.
- Edge owner: accepted archive `KnowledgeGraphView.tsx:38-45,306-340`, modified by `0002-knowledge-focus-scene.patch`. `EDGE_STYLES[e.type]` owns coarse styles; active focus labels expand to presentation type plus source description.
- Portal owner: `KnowledgeFocusPortals.tsx:24-101`, which already exposes source, target, presentation relation, original/source relation, direction, authority, and evidence references.

## Browser replay

Retained candidate: `http://127.0.0.1:38307/`

| State | Nodes | Internal edges | Portals |
|---|---:|---:|---:|
| Baseline | 237 | 231 | 0 |
| Start Tour | 4 | 0 | 6 |
| Literal portal pivot | 7 | 7 | 12 |
| Back to source focus | 2 | 1 | 5 |

Literal portal:

`[data-testid="knowledge-focus-portals"] button[data-source="presentation:body-war.business.context.identity-consent"][data-target="presentation:body-war.business.capability.auth-consent"]`

Observed text preserves `related` as presentation relation, `owns` as source relation, forward direction, and authority effect none. Back restores the source focus neighborhood rather than the four-node tour projection or full graph.

## Smallest implementation/test bindings

- Bounded home plus full-graph escape: `knowledgeFocusScene.ts:103-185`, focus patch display selection/history, and a clearly named action in `App.tsx` or `PersonaSelector.tsx`; test with `test/focus-scene.test.mjs` and the Body War A/B browser runner.
- Truthful prototype provenance: `serve-oew-prototype.mjs` plus the accepted freshness/StalenessBanner seam; test gateway bytes and browser copy.
- Ontology card icon: `CustomNode.tsx` plus the `KnowledgeGraphView` node mapping, only after a source-owned semantic field is selected.
- Relation grammar: `KnowledgeGraphView#EDGE_STYLES` and edge construction; preserve identity in labels/selectors and test at least two relation styles with non-color cues.
- Control regrouping: `App.tsx` header/search composition and existing store transitions. Semantic search must not be presented as a distinct capability while it aliases fuzzy search.

Residue: no implementation mutation was authorized; no source-owned icon taxonomy was established by this lane; human comprehension and accessibility conformance remain unmeasured.
