# Graph Renderer and Layout Tool Comparison

Status: primary-documentation comparison; no runtime benchmark, dependency admission, or installation.

## Requirements derived from local evidence

- Stable relation ID is primary; parallel relations must never be tuple-deduplicated.
- Real endpoint-attached geometry, arrow markers, exact predicate color, redundant pattern/text/direction, and visible labels.
- Rich node cards with node-kind icons plus adjacent text.
- Compound clusters and grouped portals, with portal semantics owned by OEW.
- Keyboard and assistive-operation hooks, test-addressable geometry, forced-colors behavior, and focus restoration.
- Shared scene/query state for focus, Path, evidence, portals, and full-index escape.
- Exact full Body War gate: 276 nodes, 301 relations, 39 predicates.

## Decision matrix

`H` = strong documented fit; `M` = feasible with material application work; `L` = weak or undocumented. This is not performance proof.

| Candidate | Compound / portals | Multiedges and cues | Cards / keyboard / a11y | Layout / scale | Testing / path / export | Cost |
|---|---:|---:|---:|---:|---:|---:|
| React Flow + ELK | H / portals app-owned | H with ingestion trap | H | M | H | Low–M |
| Cytoscape.js + ELK | H | H | L–M | H | H | M–H |
| Sigma + Graphology | L | M–H | L | H | H analysis, M UI | H |
| ELK alone | H layout | H routing | N/A | H | N/A | Adapter only |
| D3 | M, custom | H, custom | M, custom | M | M | Highest |

## Candidate evidence

### React Flow + ELK — provisional primary

React Flow documents custom HTML/React nodes, SVG custom edges and labels, markers, handles, keyboard focusability, ARIA hooks, and DOM/SVG browser testing. Its subflows model parent/child groups, while the application must own grouped-portal semantics. ELK adds hierarchical layout, ports, labels, and routed sections.

Critical trap: React Flow `addEdge()` rejects a second edge with matching source, target, and handles even when IDs differ. Ontology ingestion must therefore pass controlled edge arrays keyed by exact source relation ID and must not use `addEdge()` for source loading.

Primary sources: [custom edges](https://reactflow.dev/learn/customization/custom-edges), [markers](https://reactflow.dev/examples/edges/markers), [accessibility](https://reactflow.dev/learn/advanced-use/accessibility), [testing](https://reactflow.dev/learn/advanced-use/testing), [subflows](https://reactflow.dev/learn/layouting/sub-flows), [layout overview](https://reactflow.dev/learn/layouting/layouting), [`addEdge`](https://reactflow.dev/api-reference/utils/add-edge).

### Cytoscape.js + ELK — non-dominated fallback

Cytoscape natively models directed multigraphs and compound graphs and supports edge labels, dash patterns, arrow shapes, traversal/path algorithms, headless state, and image export. Its canvas renderer is a better graph-model/scale fallback, but rich semantic cards, keyboard traversal, graph ARIA, and forced-color behavior require a separately owned semantic DOM and controller.

Primary source: [Cytoscape.js documentation](https://js.cytoscape.org/).

### Sigma + Graphology — optional dense overview

Sigma targets large graphs in WebGL; Graphology supplies directed multigraph identity and path algorithms. They are credible for a later high-density overview. Neither provides the required compound semantic-card, keyboard/ARIA, line-pattern, and test-addressable primary workbench contract without substantial overlays.

Primary sources: [Sigma documentation](https://www.sigmajs.org/docs/), [Graphology graph types](https://graphology.github.io/instantiation.html), [Graphology shortest paths](https://graphology.github.io/standard-library/shortest-path.html).

### ELK — layout only

ELK Layered supports compounds, cross-hierarchy edges, multiedges, ports, edge labels, and routed sections. `elkjs` is explicitly layout-only. A nonzero seed, stable ordering, options, package version, and worker mode must be pinned for replay evidence.

Primary sources: [ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html), [elkjs](https://github.com/kieler/elkjs), [random seed](https://eclipse.dev/elk/reference/options/org-eclipse-elk-randomSeed.html).

### D3 — bounded utility, not workbench owner

D3 supplies flexible SVG/Canvas/HTML primitives, paths, zoom, and simulation. The OEW would own compounds, routing, culling, focus, accessibility, export, and lifecycle itself. It is dominated as the full workbench, while remaining usable for a narrow custom static projection.

Primary sources: [D3 selections](https://d3js.org/d3-selection), [D3 path](https://d3js.org/d3-path), [D3 force simulation](https://d3js.org/d3-force/simulation).

## Provisional decision

Use a renderer-neutral `KnowledgeScene` and `SceneGeometry` boundary. Admit React Flow + ELK as the first implementation spike because it has the best local migration, semantic-DOM, custom-card, SVG-cue, and Playwright-inspection fit. Keep Cytoscape + ELK non-dominated and predefine the same adapter conformance suite. Fail the React Flow admission if exact Body War evidence shows lost parallel relations, unacceptable rich-card/layout performance, missing edge cues, or accessibility-state divergence.

Sigma/Graphology is not part of the first Work Pack. It may later implement a dense overview adapter without replacing the accessible bounded scene and complete index.

## Runtime residue

- Full 276/301 rich-card performance and interaction benchmark.
- Controlled React Flow arrays prove every parallel relation survives without `addEdge()`.
- Byte-equivalent ELK geometry with pinned nonzero seed and worker mode.
- Human discrimination of 39 predicate encodings.
- Canvas/WebGL semantic-DOM and forced-colors prototype only if fallback is activated.

