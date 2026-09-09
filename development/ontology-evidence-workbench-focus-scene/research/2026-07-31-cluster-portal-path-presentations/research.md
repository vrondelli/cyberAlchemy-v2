# Research corpus

Mechanically assembled from the four explorer returns. Section separators are parent-owned; return bodies are preserved.


---

<!-- source: returns/explorer-current-source.md -->

# Explorer return — current-source feasibility

## Finding

The smallest coherent extension is to evolve the existing `knowledgeFocusScene.ts` projection, not import the structural graph’s container state machine.

- Render the active bounded context as a stateless React Flow group area around its existing member nodes.
- Group existing crossing portals into collapsed context cards inside `KnowledgeFocusPortals`, retaining every constituent relation.
- Make Path project the shortest-path DAG, grouped by those same context memberships.
- Move projection history out of component-local state into one projection owner before Path is activated; otherwise Path, focus, Back, and tour would become competing state machines.

`UA:` means the member path inside `generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/source.tar.gz`.

## Observed current owners

| Concern | Current owner and behavior |
|---|---|
| Loaded graph | `UA:packages/dashboard/src/App.tsx:118-194` authenticates, validates, and stores `/knowledge-graph.json`. `serve-oew-prototype.mjs:35-58,404-507` serves the immutable graph and sidecar through token-protected loopback routes. |
| Complete scope | Zustand `store.ts#graph` owns the 237-node/231-edge graph. In `KnowledgeGraphView`, full mode is `filteredGraph`. |
| Filtering | Patched `KnowledgeGraphView.tsx` filters only `nodeTypeFilters.knowledge`. The richer `FilterState` changed by `FilterPanel.tsx` is not consumed by the knowledge renderer. Path ignores both and reads the full store graph. |
| Scene projection | `knowledgeFocusScene.ts#deriveKnowledgeFocusScene`: tour IDs win over focus; focus is an undirected one-hop neighborhood; otherwise mode is full. Crossing portals are edges whose endpoints differ on membership XOR. |
| Selection | Zustand `selectedNodeId` plus `selectNode`; clicks select without changing scope. Edge emphasis uses `focusNodeId ?? selectedNodeId`. |
| Focus | Zustand `focusNodeId`; `setFocusNode` also sets `selectedNodeId`. `NodeInfo.tsx:388-400` supplies the only current Unfocus/full-graph escape after portal navigation. |
| Portal navigation | Patched `KnowledgeGraphView.tsx#onPortalPivot` determines the inside endpoint, stops the tour, updates local history, and calls `setFocusNode`. |
| Back | `focusHistory: string[]` is component-local in `KnowledgeGraphView`; `reduceKnowledgeFocusState` stores source node IDs only. It overlaps conceptually with Zustand `nodeHistory`, but the latter owns sidebar selection navigation and is not used by portals. |
| Path | `UA:components/PathFinderModal.tsx:9-310` owns local `fromNodeId`, `toNodeId`, `path`, and `searching`. It performs insertion-order BFS over a deliberately bidirectional adjacency list and returns one node-ID path. Clicking a result calls `selectNode` and closes the modal; it creates no graph projection and retains no edge/predicate/direction data. |
| Layout | Knowledge view runs the projected graph through `prepareLayout` and `startForceLayoutTask`; fallback is a grid. React Flow has initial `fitView`, but no scene-keyed refit helper. |
| Node rendering | `UA:components/CustomNode.tsx:74-202`; one `custom` node type. Inner card has click handling but no deterministic node selector or explicit keyboard activation contract. |
| Edge rendering | Patched `KnowledgeGraphView.tsx#EDGE_STYLES` and React Flow edge mapping. IDs are synthesized as `ke-${source}-${target}-${type}`; internal edges do not bind sidecar edge identity. Scene labels show `type · description`, but there is no marker or edge selector carrying direction. |
| Portal rendering | `KnowledgeFocusPortals.tsx:24-101`; native buttons expose endpoints, presentation/source relations, projection authority, direction text, and evidence. |
| Viewport precedent | Structural `GraphView.tsx:123-204` owns measurement-aware `TourFitView`; `:977-1027` proves React Flow `parentId` plus `extent:"parent"`; `:1364-1409` owns transition fitting and expansion viewport locking. These are patterns, not knowledge-view state owners. |

## Exact observed states

Accepted automated evidence establishes:

- Full graph: 237 nodes, 231 edges, 17 layers, five tour steps.
- First tour: four exact context nodes, zero internal edges, six portals.
- Literal portal: Identity and Consent `—related/owns→` Authentication and Consent, projected direction `forward`, projection authority `none`.
- Portal target scene: 7 nodes, 7 internal edges, 12 portals.
- Back result: 2 nodes, 1 edge, 5 portals.

Back restores the source node’s one-hop focus, not the original 4/0/6 tour scene. The browser test asserts source-node presence and history removal, not exact prior-scene restoration.

The accepted receipt also records that the portal panel obscures part of the lower canvas at 1440×1000.

## Source-backed cluster fixture

The current graph has 12 nodes tagged `business-kind:bounded_context`, 18 direct context `owns` edges, and 18 unique owned capability targets covering all 18 capabilities.

A minimal context area can use `context anchor + direct outgoing owns capability targets`. This should still be labelled a declared projection rule, not inferred ontology containment.

Exact Identity and Consent fixture:

- Members: Identity and Consent; Authentication and Consent.
- Counts: 2 nodes, 1 internal edge, 5 crossing relations.
- Crossings group into three context destinations:
  - Activity Evidence: 2 relations.
  - Suggested Track Route Expansion: 2 relations.
  - Candidate Geometry Evidence: 1 relation.

Across the complete fixture, only Runner → Community lacks an owning destination context. It must remain a node-level fallback portal rather than become a fabricated cluster card.

## Presentation-mechanism comparison

| Mechanism | Assessment |
|---|---|
| React Flow parent/group node | Best thin cluster-area mechanism. Run existing force layout, compute member bounding box, insert group before children, convert child positions to parent-relative coordinates. No new layout algorithm or collapse state. |
| Structural `GraphView` subflow | Reuse only `parentId`/`extent` and measurement-aware fitting patterns. Importing `expandedContainers`, Stage-1/Stage-2 ELK, size caches, edge inflation, zoom expansion, or `ContainerNode` creates an unrelated second state machine. |
| Hidden nodes | Reject. Current focus truthfully removes out-of-scope nodes. Keeping 237 hidden nodes duplicates scope, complicates fit/count semantics, and leaves Path/filter ambiguity. |
| Custom area node | Add one stateless `KnowledgeClusterArea` renderer. It should be noninteractive and nonsemantic; member cards remain `CustomNode`. |
| Existing `PortalNode` | Do not reuse. It navigates layers, exposes only connection count, and is a clickable `div` without the exact relation and keyboard contract already present in `KnowledgeFocusPortals`. |
| Cluster portal card | Evolve existing portal buttons into one native button per target context, with a noninteractive list/count of constituent exact crossings and a node-level fallback. No independent portal state. |
| Viewport fit | Add a small scene-keyed helper inside `ReactFlowProvider`, following `TourFitView`: wait for measured area/member nodes, then fit only active projection. Test against portal-panel occlusion. |
| Existing focus projection | Extend it. Cluster membership, grouped portals, and Path remain pure outputs of the same graph/sidecar input. |

## Proposed source-compatible model

### A. Bounded context area

Extend `knowledgeFocusScene.ts` with a pure cluster derivation:

- Identify anchor by exact `business-kind:bounded_context` tag.
- Admit only direct outgoing edges whose matched sidecar `source_relation` is `owns`.
- Emit one `PresentationCluster` containing anchor, members, internal edges, crossing portals.
- Keep one-hop focus as a separately named presentation neighborhood for non-context nodes.
- Do not derive membership from coordinates, color, `source_ref`, tour co-occurrence, or transitive capability dependencies.

In `KnowledgeGraphView.tsx`, turn post-force positions into a React Flow group without expansion state.

Required hooks:

- `[data-testid="knowledge-cluster-area"][data-cluster-id][data-membership-rule="context-direct-owns"]`
- `[data-testid="knowledge-node"][data-node-id]`
- `[data-testid="graph-counts"][data-node-count][data-edge-count]`

### B. Collapsed cluster card as portal

Group crossing portal records by the outside capability’s owning context.

Each card must expose target context ID/label, constituent relation count, every constituent edge’s endpoints, source predicate, presentation relation, projected direction, evidence, qualified projection authority, and a node-target fallback when no target cluster is derivable.

Required hooks:

- `[data-testid="knowledge-cluster-portal"][data-source-cluster][data-target-cluster][data-relation-count]`
- `[data-testid="cluster-portal-relation"][data-edge-id][data-source][data-target][data-source-relation][data-presentation-relation][data-projected-direction]`
- `[data-testid="knowledge-node-portal"][data-target]`

Card activation should pivot to target context anchor, not silently substitute one constituent outside endpoint.

### C. Path as branch-cluster projection

Move BFS out of `PathFinderModal` into a pure model beside `deriveKnowledgeFocusScene`. Store only committed query; derive result from current admitted graph.

Use a shortest-path DAG:

- compute distance from start and end;
- retain nodes/edges satisfying shortest-distance equation;
- group retained nodes by same context-membership rule;
- retain actual graph source/target and projected direction separately from traversal direction;
- report no path without changing current scene.

Exact fixture:

- From Identity and Consent to Suggested Track Route Expansion.
- Shortest distance: 3 edges.
- DAG union: 5 nodes, 5 edges, 2 context areas.
- Two alternatives:
  - Authentication and Consent → Suggested Track Creation.
  - Authentication and Consent → Suggested Track Discovery.
- Edge field counts: three `related/owns`, two `builds_on/depends_on`.
- Last two steps of each route traverse opposite stored projected direction; UI must say so rather than reverse edge identity.

No-path fixture:

- Identity and Consent → Run Validation and Anti-Cheat.
- Expected result: `not-found`; current scene IDs/counts stay byte-equivalent.

Required hooks:

- `[data-testid="knowledge-path-projection"][data-from][data-to][data-status]`
- `[data-testid="path-cluster"][data-cluster-id][data-visible-member-count][data-total-member-count]`
- `[data-testid="path-branch"][data-branch-id]`
- `[data-testid="path-step"][data-edge-id][data-traversal-direction][data-projected-direction]`

## State duplication to reject

- Separate cluster graph/editorial cluster dataset.
- Structural container caches in knowledge view.
- Hidden full-graph nodes alongside filtered display.
- Same committed Path result in modal state and Zustand.
- Cluster history while retaining `focusHistory`.
- Treating Zustand `nodeHistory` as portal/Path history.
- Synthesized cluster edge with inaccessible constituent crossings.
- Both `focusNodeId` and second active cluster ID for same scope.

Before Path activation, replace component-local `focusHistory` with one projection-history owner capable of recording `{full|tour|context|path}` frames. Otherwise Back cannot restore prior tour or Path scene exactly.

## Exact test seams

1. Extend `test/focus-scene.test.mjs`:
   - 12 contexts/18 direct ownership relations;
   - Identity cluster 2/1/5;
   - three grouped cards with counts 2/2/1;
   - Community’s Runner crossing remains node-level;
   - path DAG 5 nodes/5 edges/two branches;
   - deterministic output under reordered edges;
   - no-path leaves prior state unchanged.
2. Add typed component coverage for `KnowledgeClusterArea`, grouped `KnowledgeFocusPortals`, and `PathFinderModal` commit/no-path.
3. Extend `validate-body-war-focus-ab.mjs`:
   - retain baseline 237/231 and tour 4/0/6;
   - assert Identity area 2/1, one area, three cluster cards;
   - pointer/Enter/Space equivalence and exact Back frame restoration;
   - invoke Path via existing title or stable `open-path` hook;
   - assert 5/5/two branch alternatives;
   - assert predicates and projected-versus-traversal direction;
   - assert no-path and complete-graph escape;
   - assert focus restoration, forced-colors boundaries, reduced motion, and zero portal-panel occlusion.
4. Keep gateway tests on immutable authenticated bytes. Cluster and Path state stays client-side; no new gateway route.

Fresh read-only validation:

- `node --experimental-strip-types --test test/focus-scene.test.mjs`: 4/4 pass.
- Fixture assertions: 12 contexts, 18 owned capabilities, Identity 2/1/5 → three cluster cards, Path DAG 5/5/two branches: pass.

## Risks and ceilings

- Current graph edges lack stable graph-edge IDs; internal edge IDs can collide.
- Sidecar matching uses endpoints, presentation relation, description rather than lossless edge identity.
- Sidecar omits source direction; only projected direction is available.
- Current Path is undirected, insertion-order-sensitive, node-only.
- Current Back does not restore prior tour scene.
- Knowledge Filter UI and renderer do not share one filtering owner.
- `CustomNode` and structural `PortalNode` lack sufficient explicit keyboard contracts.
- Any source change requires a new exact-once patch/postimage and lock rebinding; archived upstream bytes are not editable authority.
- Prior visual-language findings remain auditor-blocked on missing deterministic legend witness and contradictory residue.
- No source evidence proves improved comprehension, accessibility conformance, ontology correctness, promotion, release, deployment, or production readiness.


---

<!-- source: returns/explorer-graph-presentations.md -->

# Graph-presentation research return

## Result

Primary evidence supports a bounded hybrid, not one all-purpose clustered graph:

1. A labeled cluster card can act as a portal into the accepted bounded focus scene.
2. Expanded compound regions may organize a small current scene, but should not define ontology membership.
3. Path should use an explicit path-results/corridor view—ranked path rows plus bounded node-link context—rather than calling branches “clusters.”
4. Complete-graph access remains an intentional escape.

This is a design inference from the sources, not an implementation selection. No cited study evaluates Body War, the 237-node/231-edge fixture, or a cluster-card portal, so no novice-comprehension claim is warranted.

## Cross-presentation evidence contract

- Exact relation recovery should remain textual: `source — predicate → target`, with source direction, edge identity, and provenance available on focus/inspection. A directed-edge study found traditional arrowheads comparatively weak and tapered links strongest among its tested representations, so arrows should be redundant cues rather than the sole direction record. [Holten & van Wijk, CHI 2009](https://doi.org/10.1145/1518701.1519054)
- Every portal, cluster transition, zoom-level change, Path action, Back action, and complete-graph escape must be keyboard-operable. WCAG 2.2 requires keyboard access and avoidance of keyboard traps. [WCAG 2.2, 2.1](https://www.w3.org/TR/WCAG22/#keyboard-accessible)
- React Flow supplies Tab focus for nodes and edges, Enter/Space selection, arrow-key node movement, automatic panning to focused nodes, configurable ARIA labels, and node/edge focusability. Those defaults do not define cluster navigation or focus restoration; those remain application responsibilities. [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility)
- Color cannot be the only carrier of category, direction, membership, or state. [WCAG 2.2, Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- Forced-colors mode may replace author colors—including backgrounds, borders, fills, and strokes when applicable—and removes several decorative effects. SVG also has special adjustment behavior. Therefore region fills, edge hues, shadows, and background images require an emulated forced-colors witness; visible text, boundaries, shape, and line treatment should carry the same distinctions. [CSS Color Adjustment Level 1](https://www.w3.org/TR/css-color-adjust-1/)

At the frozen 237-node/231-edge baseline, leaving every node and edge in one Tab sequence could mean hundreds of focus stops. That is a design inference from React Flow’s defaults, not a measured limit; inactive scenes should be removed from the active sequence, and collapsed cluster cards should expose one named entry control.

## Presentation comparison

| Presentation | Supported tasks and evidence | Scale limits | Direction and label recovery | Keyboard / forced-colors implications | Cluster portal / Path fit |
|---|---|---|---|---|---|
| **Compound or clustered graph** | Sugiyama and Misue distinguish inclusion through geometric containment from adjacency through connecting arrows. [Original compound-digraph paper](https://www.cs.tsukuba.ac.jp/~misue/research/topic001-cdag/misue1991c-ieeesmc-visualization.pdf) React Flow supports grouping with `parentId`; child positions are relative, and the grouping is not DOM containment. [React Flow subflows](https://reactflow.dev/learn/layouting/sub-flows) Cytoscape.js similarly models parent/child nodes but warns that ordinary graph algorithms do not automatically treat descendants as parent adjacency. [Cytoscape.js compound nodes](https://js.cytoscape.org/#notation/compound-nodes) | Useful while members and crossings remain locally legible. Cytoscape.js states compound nodes increase styling/rendering cost; neither library provides a Body War-specific numeric threshold. | Region containment does not recover predicates. Cross-boundary edges still need direct inspection and textual source/predicate/target. Labels can collide with region boundaries. | Region heading and expand/collapse control must precede members in focus order; collapse should restore focus to that control. Region fill needs a labeled boundary and visible heading in forced colors. | **Portal:** conditional—collapse to a card is application state, not inherent compound semantics. **Path:** weak; a path branch is not naturally an inclusion hierarchy. |
| **Semantic zoom** | Pad++ introduced semantic zoom as rendering a different representation according to viewing size rather than merely shrinking the same object. [Bederson & Hollan, UIST 1994](https://www.cs.umd.edu/projects/hcil/pad%2B%2B/papers/uist-94-pad/uist-94-pad.pdf) | Pad++ targeted large graphical spaces, but publishes no transferable Body War threshold. Detail necessarily disappears at lower scales. | Low-scale icons cannot retain every predicate or label. Exact relations need a keyboard-reachable inspector or an explicit expanded state. | Zoom must have named controls and announced level/state; wheel or gesture alone is insufficient. Focus identity must survive representation changes. Color-dependent low-scale glyphs need text/shape equivalents. | **Portal:** strong visual precedent for card/icon → detailed form, but discrete entry semantics are a design inference. **Path:** weak unless Path receives a separate representation. |
| **Overview + detail** | Presents simultaneous, spatially separate context and detail. Evidence is task-dependent: coordinated views can help, while split attention and extra screen space can impose costs; semantic zoom sometimes made an overview redundant. [Cockburn, Karlson & Bederson review](https://faculty.cc.gatech.edu/~stasko/7450/Papers/cockburn-surveys08.pdf) | Overview resolution and available screen area are the limits; a complete 237/231 minimap cannot be assumed to preserve labels. | Overview supplies location, not exact edge semantics. Predicate, direction, and provenance belong in the detail scene/inspector. | Overview items require named controls and a deterministic focus transfer to detail; Back must restore the initiating item. Viewport indication needs outline/text beyond color. | **Portal:** strong—cluster cards can be the overview and the focus scene the detail. **Path:** moderate if Path opens a dedicated detail panel. |
| **Graph maps / regions** | GMap converts supplied clusters into non-overlapping, map-like regions and emphasizes cluster/neighborhood structure. The method assumes non-overlapping regions. [Gansner, Hu & Kobourov, PacificVis 2010](https://yifanhu.net/PUB/pacvis2010.pdf) | Region and label density constrain readability; the paper does not establish an interactive Body War limit. Overlapping membership does not fit its non-overlap assumption without changing the model. | Country/region adjacency is not an exact graph predicate. Cross-region relations need selectable labeled edges or a separate relation list. | Regions need textual names and ordered-list parity. Borders, labels, and patterns must survive when fills are unavailable. | **Portal:** conditional; a named region can be entered, but “map adjacency means ontology relation” would be an invalid design inference. **Path:** weak. |
| **Hierarchical edge bundling** | Bundles adjacency edges along a supplied hierarchy to reduce clutter and show aggregate cross-group traffic. Its evaluation was informal. [Holten, TVCG 2006](https://doi.org/10.1109/TVCG.2006.147) | Helps dense overview patterns, but presupposes a trustworthy hierarchy and trades individual-edge readability for aggregation. It provides no Body War threshold. | Poor for exact recovery in the bundled state: individual route, arrow, label, and provenance may be obscured. Selection must unbundle or expose a textual edge list. | A visual bundle cannot substitute for separately focusable relations. Forced colors require geometry plus textual selection state rather than hue-only bundles. | **Portal:** no. **Path:** useful only as a background aggregate; unsuitable as the primary exact Path witness. |
| **Small multiples** | In a dynamic-graph experiment, small multiples were faster than animation across five tasks, but produced more errors for identifying sets of nodes or edges added in the same timeslice. [Archambault, Purchase & Pinaud, TVCG 2011](https://research.monash.edu/en/publications/animation-small-multiples-and-the-effect-of-mental-map-preservati/) | Limited by card count, card size, and duplicated labels; the reported experiment does not establish a static ontology-graph threshold. | Strong when each card contains a bounded path/context and textual edge sequence; weak for relations spanning many cards. | Cards fit list/grid navigation. One named entry control per card avoids exposing every miniature node. Borders, headings, counts, and selection markers should survive forced colors. | **Portal:** strong design candidate for labeled context cards. **Path:** strong for one path alternative per card/row. |
| **Focus + context / fisheye** | Fisheye views preserve high detail near focus and progressively less detail remotely; graph-specific work applies geometric and structural transformations. [Sarkar & Brown](https://cs.brown.edu/research/pubs/techreports/reports/CS-91-61.html) Comparative evidence is strongly task-dependent and distortion can impose orientation costs. [Cockburn et al.](https://faculty.cc.gatech.edu/~stasko/7450/Papers/cockburn-surveys08.pdf) | Can keep remote landmarks visible, but peripheral labels and crossings diminish. No Body War scale is established. | Strong locally, intentionally weak peripherally. Exact predicates cannot depend on the distorted periphery. | Focus movement needs explicit controls, announced current focus, and deterministic restoration. Dimming/magnification requires structural and textual equivalents. | **Portal:** moderate—neighbor cards can remain peripheral landmarks. **Path:** moderate for highlighting one branch while retaining alternatives, but distortion risks false prominence. |
| **Path / corridor view** | Pathfinder queries path sets, presents them as a ranked list with rich node/edge attributes, and also supplies a node-link diagram for topology. It was designed for graphs with tens of thousands of nodes/edges using incremental query results. [Partl et al., EuroVis 2016](https://vdl.sci.utah.edu/publications/2016_eurovis_pathfinder/) | Its scale claim applies to query-driven path analysis, not rendering the whole graph or proving this runtime. Displayed results still need a bounded result count. | Best evidence fit: each path row can preserve ordered nodes, exact edge labels, and direction; the node-link diagram gives context. | Treat results as an ordinary keyboard-navigable list, with each path having a stable name/score and inspect action. Use textual arrows/predicates plus geometric cues in forced colors. | **Portal:** unrelated. **Path:** strongest fit. A “branch” should mean an alternate path/result, not a presentation or ontology cluster. |

## Bounded design inference

The smallest evidence-aligned prototype is:

- Keep the accepted focus scene as the detail owner.
- Represent each neighboring context as a **labeled cluster portal card**, not an icon alone. The card should expose target name/ID, presentation-only membership rule, member count, crossing source, predicate, target, direction, and an authority/provenance affordance.
- Entering a card changes the existing focus projection and records reversible history; it must not instantiate a second graph-state machine.
- Permit compound-region rendering only inside a small expanded scene and only after a source-backed membership rule exists.
- Open Path as a distinct corridor/result mode:
  - shared source and destination;
  - bounded ranked alternative rows;
  - exact ordered edge sequence per row;
  - optional bounded node-link topology;
  - explicit no-path state;
  - Back returns to the prior scene;
  - complete-graph escape remains visible.
- Do not use edge bundling as the primary evidence view.
- Do not infer ontology membership from region geometry, proximity, map adjacency, color, or a portal icon.
- Do not call Path alternatives “branch clusters” unless a typed presentation-only definition is introduced. “Alternate path” is currently safer.

The unresolved membership owner is a real design blocker for compound regions, but not for testing labeled portal cards as presentation-only navigation.

## Measurable Body War novice tasks

These are planned behavioral witnesses, not comprehension evidence.

1. **Scene orientation:** From the bounded home, state the visible context name, purpose, and member count. Measure exact-field accuracy, time, and help use.
2. **Portal prediction:** Given a named target, choose the corresponding `[data-portal-target]` and predict the crossing predicate/direction before activation. Measure wrong portals and predicate/direction errors.
3. **Keyboard entry and recovery:** Tab to a portal, activate with Enter and Space in separate trials, then use Back. Verify identical target scene, restored initiating focus, and no keyboard trap.
4. **Exact relation recovery:** Focus one crossing relation and report source, predicate, target, projected direction, and source direction. Score fields independently.
5. **Path alternatives:** For a fixture with at least two paths, invoke Path, report the alternative count, choose one `[data-path-id]`, and trace its ordered predicates. Measure time, ordering errors, and branch switches.
6. **No-path:** Run a fixture with no route and identify the explicit no-path state without mistaking it for loading or failure.
7. **Complete-graph escape:** From a nested scene or Path result, return intentionally to the 237-node/231-edge scope; record accidental escapes and recovery time.
8. **Forced-colors parity:** Repeat portal entry, edge inspection, branch choice, Back, and full-graph escape under emulated light and dark forced colors. Assert visible focus and retained target/direction/state cues.
9. **A/B comparison:** Compare the accepted portal scene against the card/corridor hybrid using completion rate, median time, wrong-target count, Back operations, focus-loss incidents, and predicate/direction errors. Report factual task performance only.


---

<!-- source: returns/explorer-ontology-semantics.md -->

# Explorer return — ontology and presentation semantics

## Core finding

A cluster cannot be introduced as a new ontology fact. It must be a typed presentation projection whose membership rule remains visible and auditable.

The only existing rule that supports a business-context cluster semantically is one `bounded_context` concept plus capabilities reached by its direct outgoing `owns` relations.

The frozen fixture contains 12 context concepts and 18 such ownership relations to 18 currently unique capability targets. This does **not** establish exclusive or transitive context membership: the relation schema has no uniqueness constraint, and `owns` explicitly carries no authority-transfer, implementation, or promotion meaning. [Profile](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/profile.json:64), [relation schema](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/schemas/relation.schema.json:25), [example relation](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/relations/relations.json:983).

All broader neighborhood, tour, Path, role, category, status, or manually selected groupings are presentation views. Their labels must name that rule instead of implying context ownership.

## Source-backed distinctions

| Term | Exact meaning | Required non-collapse |
|---|---|---|
| Ontology context | An individual source concept whose `business_kind` is `bounded_context`; it has its own `concept_id`, definition, evidence, status, and role. [Context node](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/nodes/context.identity-consent.json:21) | Not a UI area, layer, cluster, or all nodes nearby in the graph. |
| Business category | The project-local `business_kind` axis, with 17 permitted values including `bounded_context`, `capability`, `entity`, and `workflow`. [Node schema](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/schemas/node.schema.json:48) | Not a CAV2 node type, ontology context, or authority classification. |
| `concept_role` | A separate closed axis: `authority object`, `evidence object`, `workflow object`, `projection object`, or `residue object`. [Node schema](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/schemas/node.schema.json:39) | Not `business_kind`, ownership, validity, promotion, confidence, or the coarse OEW `claim/source` type. |
| Presentation cluster | A presentation-owned set of rendered node instances produced by one declared deterministic membership rule and purpose. No current ontology or OEW schema defines this object. | Never silently becomes an ontology concept, context boundary, ownership fact, or authority container. |
| Cluster membership | A many-to-many join from a presentation cluster to a rendered node instance, carrying its derivation basis. | `source_ref` is provenance, not membership or identity. Membership must not rewrite the source concept ID. |
| Portal | A reversible UI affordance for a specific crossing relation from the active cluster/scene to an explicit outside target. Current portals retain endpoints, relation fields, direction, evidence, and Back history. [Portal type](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts:5), [renderer](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/components/KnowledgeFocusPortals.tsx:71) | Not an ontology node or unexplained icon. It must expose target, exact predicate, presentation relation, direction, and evidence/authority qualification. |
| Crossing relation | An existing graph-edge instance with exactly one endpoint in the current cluster member set. Current focus derivation uses that XOR rule. [Focus derivation](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts:165) | Not an invented cluster-to-cluster superedge. Aggregation must retain every constituent relation. |
| Full-graph scope | The complete graph passed to the current focus projection—operationally the complete current-filter projection. In the frozen unfiltered fixture it is 237 nodes and 231 edges. [Full-mode return](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts:147), [index](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/NODE-INDEX.md:12) | Not ontology completeness, validity, unfiltered scope, promotion, or “everything that exists.” |
| Path result | Current Path performs BFS over the loaded graph, deliberately adding both directions to adjacency, and returns `null`, `[]`, or one ordered `string[]` of node IDs. It does not return edge IDs, predicates, alternatives, or source-direction semantics. [Accepted source archive](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/source.tar.gz), member `packages/dashboard/src/components/PathFinderModal.tsx:51-101` | Not an ontology branch, relation-bearing route, directed proof, or navigation history. |
| Branch | Existing ontology branch `body-war.branch.business` is an interpretive `meaning` view whose membership confers no promotion or execution authority. [Business view](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/views/business.json:2) A Path branch must therefore be separately named `presentation_path_branch`: one algorithm-derived relation-bearing alternative or corridor. | Never reuse ontology `branch_id`, node `branch_roles`, or focus-history entries for a Path branch. |

Focus history is only a stack of prior focus-node IDs used by portal activation and Back. It is neither a Path nor a branch. [State reducer](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts:187).

## Permitted cluster derivations

| Basis | Semantic status | Constraint |
|---|---|---|
| Context anchor plus direct `context --owns→ capability` relations | Source-backed context-ownership projection | Include only the anchor and direct owned capability targets. Further traversal must become a separately labeled presentation rule. |
| `business_kind == value` | Source-backed category grouping | Current adapter `layers` implement this and partition all 237 nodes once. It is a category cluster, not a bounded context. [Adapter](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/body-war-adapter-writer.mjs:442) |
| `concept_role == value` | Source-backed role grouping | May be labeled a role view only. It cannot imply ownership or authority validity. |
| `candidate_status == value` | Source-backed workflow-status grouping | Must not imply lifecycle state, confidence, or authority. |
| Explicit tour `sourceIds` | Authored presentation-only set | The five current four-node tours are adapter-authored scenes, not ontology membership. [Tour definitions](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/body-war-adapter-writer.mjs:36) |
| Focus node plus incident one-hop neighbors | Derived presentation-only neighborhood | Current focus rule admits incoming and outgoing neighbors without treating them as context members. [Focus rule](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts:128) |
| Path result or Path branch | Algorithmic presentation-only grouping | Must bind query scope, traversal policy, algorithm/tie-break rule, ordered edge steps, and no-path state. |
| `source_refs`, color, artwork, coordinates, layout proximity | Forbidden membership bases | These are provenance or presentation tokens, not semantic identity or membership. |

`branch_roles` currently only says `business`; it selects the interpretive business branch and supplies no useful within-branch cluster axis.

## Multiple-cluster membership

Presentation membership must be many-to-many.

- Current `business_kind` layers happen to be a partition: 237 memberships, 237 unique nodes.
- Current 18 context-owned capability targets also happen to be unique.
- Neither fact is a schema invariant. Relation records permit multiple `owns` relations, and no rule makes context ownership exclusive.
- Tour, focus-neighborhood, and Path projections can legitimately overlap.
- If simultaneous compound rendering requires one visual parent, select a primary rendered instance or create distinct `presentation_node_instance_id` values that share one `source_concept_id`. Never clone or rename the ontology concept.

## Typed candidate schema

```ts
type ClusterKind =
  | "context-direct-ownership"
  | "business-kind-axis"
  | "concept-role-axis"
  | "candidate-status-axis"
  | "authored-set"
  | "focus-neighborhood"
  | "path-branch";

type MembershipBasis =
  | { kind: "source-relation"; sourceRelationId: string; predicate: "owns"; anchorSourceConceptId: string }
  | { kind: "source-axis"; axis: "business_kind" | "concept_role" | "candidate_status"; exactValue: string }
  | { kind: "presentation-rule"; rule: "explicit-node-ids" | "incident-one-hop" | "path-result-branch"; ruleOwner: string; inputRef: string };

interface PresentationCluster {
  clusterId: string;
  kind: ClusterKind;
  label: string;
  purpose: string;
  anchorSourceConceptId?: string;
  membershipRule: MembershipBasis;
  members: ClusterMembership[];
  completeness: "complete-for-declared-rule" | "selected-subset";
  projectionAuthorityEffect: "none";
}

interface ClusterMembership {
  clusterId: string;
  presentationNodeInstanceId: string;
  graphNodeId: string;
  sourceConceptId: string;
  basis: MembershipBasis;
}

interface CrossingRelationBinding {
  graphEdgeId: string;
  sourceRelationId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePredicate: string;
  presentationRelation: string;
  projectedDirection: "forward" | "backward" | "bidirectional";
  sourceDirection: "directed" | "symmetric" | "view-only";
  evidenceRefs: Array<{path: string; selector: string; sha256: string}>;
  sourceAuthorityEffect: "none" | "staging" | "projection" | "owner-decision" | "blocked";
  projectionAuthorityEffect: string;
  mappingLoss: "exact" | "generalized" | "lossy";
}

interface ClusterPortal {
  portalId: string;
  fromClusterId: string;
  insideNodeId: string;
  outsideNodeId: string;
  target:
    | {kind: "node"; graphNodeId: string; visibleLabel: string}
    | {kind: "cluster"; clusterId: string; visibleLabel: string};
  crossing: CrossingRelationBinding;
}

interface PathQuery {
  fromNodeId: string;
  toNodeId: string;
  scopeId: string;
  traversalPolicy: "projected-undirected" | "projected-directed";
  algorithm: string;
  tieBreak: "graph-edge-id";
}

interface PathStep extends CrossingRelationBinding {
  traversalFrom: string;
  traversalTo: string;
  traversalMatchesProjectedDirection: boolean;
  traversalMatchesSourceDirection: boolean | "unavailable";
}

interface PathResult {
  pathResultId: string;
  query: PathQuery;
  status: "invalid-query" | "not-found" | "found";
  branches: PresentationPathBranch[];
}

interface PresentationPathBranch {
  pathBranchId: string;
  pathResultId: string;
  orderedSteps: PathStep[];
  memberNodeIds: string[];
  semantics: "presentation-only";
}
```

## Relation-preservation gap

The source relation model separates `relation_id`, predicate, endpoints, direction, structured evidence, and authority effect. [Relation schema](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/schemas/relation.schema.json:7).

The current adapter does not preserve all of that:

- It generates a presentation edge without an explicit graph-edge ID.
- It stores source relation ID under ambiguous `source_ref`.
- It flattens evidence to paths, losing selector and digest.
- It omits `source_direction`.
- It writes sidecar `authority_effect: "none"` for every relation, although the source fixture contains 190 `none`, 34 `blocked`, and 7 `projection` relations. [Adapter mapping](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/src/body-war-adapter-writer.mjs:407).
- The fixture contains two distinct `owns` relation IDs with the same source, predicate, and target, proving endpoint/predicate matching is not identity. [First relation](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/relations/relations.json:3260), [second relation](/home/vrondelli/projects/domainspec-core/projects/body-war/ontology/business/relations/relations.json:3634).

Therefore truthful cross-cluster portals and Path branches require lossless `graph_edge_id`, `source_relation_id`, structured evidence, `source_direction`, `source_authority_effect`, and qualified `projection_authority_effect`. This matches the prior field-model boundary. [Prior field model](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/research/2026-07-30-workbench-visual-language/findings.md:85).

A cluster card may summarize “3 crossings,” but each constituent relation must remain keyboard/pointer recoverable. An icon alone cannot replace exact target label, predicate, direction text, or dual authority fields.

## Collapse tests

| Test | Must fail when… |
|---|---|
| `CT-01 context-vs-cluster` | A cluster labeled “Identity and Consent” contains nodes not admitted by its declared direct-ownership rule. |
| `CT-02 transitive-membership` | A capability dependency is silently promoted into context ownership through transitive traversal. |
| `CT-03 category-vs-context` | A `business_kind` layer is described as a bounded context. |
| `CT-04 role-vs-authority` | `concept_role=authority object` or an icon is presented as proof of ownership, validity, confidence, or promotion. |
| `CT-05 source-ref-identity` | `source_ref`, evidence path, label, endpoints, predicate, or color is used as graph-edge or source-relation identity. |
| `CT-06 parallel-relations` | Two relations with equal endpoints and predicate collapse into one crossing/Path step. |
| `CT-07 direction` | Bidirectional Path traversal or projected arrow order is claimed to reproduce source direction without `source_direction`. |
| `CT-08 authority` | Projection authority `none` overwrites a source relation’s `blocked` or `projection` effect. |
| `CT-09 evidence` | Evidence paths lose selector/digest, or evidence presence is treated as validity or confidence. |
| `CT-10 portal-opacity` | A portal icon hides its exact target, relation ID, predicate, projected direction, or evidence/authority qualification. |
| `CT-11 aggregate-superedge` | Multiple crossings become an invented cluster-to-cluster ontology relation. |
| `CT-12 branch-overload` | A Path alternative reuses `body-war.branch.business`, node `branch_roles`, or focus navigation history. |
| `CT-13 path-node-only` | A node-only BFS result is rendered as a relation-bearing branch without exact chosen edge IDs. |
| `CT-14 membership-cardinality` | A source concept is cloned into new ontology identities merely because it appears in multiple presentation clusters. |
| `CT-15 color-semantics` | Cluster, predicate, direction, membership, authority, or identity is recoverable only from color. |
| `CT-16 full-scope` | “Full graph” is claimed to mean ontology completeness, validity, promotion, or an unfiltered source universe. |

## Validation receipt evidence

Read-only assertions passed:

- graph: 237 nodes, 231 edges;
- direct context ownership: 18 relations, 18 currently unique targets;
- business-kind layers: 237 memberships, 237 unique nodes;
- source directions: 231 directed;
- source authority: 190 none, 34 blocked, 7 projection;
- mapping loss: 72 generalized, 159 lossy;
- one duplicated source/predicate/target relation tuple;
- current sidecar lacks source direction and source authority fields.

This return selects no visual treatment, authorizes no implementation, and claims no ontology correctness, comprehension, accessibility conformance, promotion, release, deployment, or production readiness.


---

<!-- source: returns/explorer-interaction-navigation.md -->

# Explorer return — interaction and navigation

## Bottom line

The strongest interaction narrative is a **labeled cluster-portal drill-down with a separate Path branch comparator and reversible scene history**.

A cluster icon alone should not be selected. It provides too little information scent to reveal destination, membership rule, crossing relation, or scope change. If retained, the icon should be decorative or redundant beside a visible target name, concept count, crossing count, and accessible action label.

This is a design recommendation, not evidence of improved comprehension.

## Current evidence and interaction gaps

Current A/B evidence establishes complete graph 237/231, first tour 4/0/6, literal Identity-and-Consent portal with source predicate `owns`, portal target 7/7/12, and accepted Back state 2/1/5. Current Back therefore restores the source node’s one-hop focus, not the exact preceding 4/0/6 scene.

The captures also show:

- baseline visually dense;
- six-portal panel obscures lower canvas at 1440×1000;
- area title/purpose split between header and tour sidebar;
- portal buttons have semantic scent but appear as a long ledger;
- `UNFOCUS` is the only explicit complete-graph escape.

Current Path:

- reads full stored graph, not active focus projection;
- builds bidirectional adjacency despite directed edges;
- returns one insertion-order BFS node sequence, not alternatives;
- carries no edge IDs, predicates, direction, provenance, or authority;
- counts nodes, not relations;
- selects a node and closes without recoverable branch state;
- lacks executed dialog/focus-restoration evidence.

## Evidence-based interaction principles

Jul and Furnas support local views with labels and landmarks to guide next moves; this favors named portal cards over unexplained icons. [Navigation in Electronic Worlds](https://citeseerx.ist.psu.edu/document?doi=31d98921ea7797ae03f6c7c47a8dd897fbf13ff5&repid=rep1&type=pdf)

Information-foraging theory treats cues as predictors of value beyond a choice. Applying it here is inference: destination, purpose, counts, and crossings are stronger cues than artwork alone. [Pirolli and Card](https://citeseerx.ist.psu.edu/document?doi=59f1e446fab201399d84ae48156ea7bd05c4439b&repid=rep1&type=pdf)

Overview+detail, zooming, and focus+context are distinct mechanisms. [Cockburn, Karlson, and Bederson](https://www.csse.canterbury.ac.nz/andrew.cockburn/papers/fc.pdf) Van Ham and van Wijk provide local-cluster/global-overview precedent, not Body War proof. [Small World Graphs](https://cgl.ethz.ch/teaching/scivis_common/Literature/vanHam-smallworld.pdf)

React Flow supports group nodes and cross-group connections, but D3-force does not own subflow layout. [Sub Flows](https://reactflow.dev/learn/layouting/sub-flows), [layout comparison](https://reactflow.dev/learn/layouting/layouting)

React Flow documents keyboard-focusable nodes/edges and Enter/Space operation, but this is not executed OEW evidence. [Accessibility](https://reactflow.dev/learn/advanced-use/accessibility)

Portal traversal is not proven hierarchical, so the stack should be labeled **Navigation history**, not an ARIA breadcrumb. [W3C Breadcrumb Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) Path dialog focus must enter the dialog and return to the invoking control. [W3C H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102)

## Exact Body War journey

1. **Bounded home**
   - Heading: `Business capability map`
   - Scope: `Bounded home · 4 contexts`
   - Purpose: `Start with the business contexts and capabilities that organize Body War responsibilities.`
   - Escape: `Complete graph — 237 nodes`
   - Initial focus moves to area heading.
2. **Area meaning**
   - Four cards: Candidate Geometry Evidence, Identity and Consent, Suggested Track Route Expansion, Score Preview.
   - State that this is a presentation projection and changes no ontology authority.
3. **Portal recognition**
   - `Identity and Consent — related → Authentication and Consent`
   - Secondary: `source predicate: owns · projected direction: forward · authority effect: none`
4. **Local focus**
   - Target `Authentication and Consent`
   - Announce `Focus scene loaded: 7 concepts, 7 relations, 12 boundary crossings.`
   - Store the preceding exact scene frame.
5. **Neighbor area**
   - `Activity Evidence`
   - `3 concepts · 2 crossings from this scene`
   - Purpose text
   - Button name: `Open Activity Evidence area; 3 concepts; 2 crossing relations`
   - Constituent crossings remain individually recoverable.
6. **Activity Evidence**
   - Nodes: Activity Evidence, Activity Import, Evidence Submission.
   - Three internal relations, six crossings.
7. **Path**
   - Control `Path — compare routes`
   - Dialog `Compare relation paths`
   - Default `Follow stored direction`
   - Optional `Connections either way`
8. **Alternatives**
   - Directed fixture `Activity Evidence → Authentication and Consent`
   - Two shortest alternatives of two relations:
     - via Activity Import
     - via Evidence Submission
   - Result: `2 shortest directed paths · 2 relations each`
9. **Choose and recover**
   - `Show Route 1 on graph`, `aria-pressed="true"`, persistent `selectedBranchId`
   - Branch projection 3 nodes/2 relations
   - Back restores exact 3/3/6 Activity Evidence frame
   - `Navigation history` exposes earlier scene frames
   - `Complete graph — 237 nodes` exits intentionally.

## Narrative comparison

### A. Labeled portal cards + Path branch lanes

Strongest candidate. It preserves accepted portal navigation, adds meaningful area cards with recoverable crossings, compares routes in a focused dialog, projects the selected branch, and uses complete scene-frame history. It avoids new compound layout. Risk: grouped cards need a collapsible desktop rail and focus-managed narrow-screen sheet to avoid occlusion.

### B. Spatial regions + semantic zoom

Strongest global/local visual relationship but highest semantic and implementation risk. Spatial grouping may look like ontology containment; current D3-force does not own subflow layout; compound focus order and crossing validation add work.

### C. Area-card hub + small-multiple routes

Strongest direct comparison and lowest canvas-keyboard dependence. But it hides cross-area topology and risks a second presentation/state form. Select only if novice evidence shows canvas alternatives fail.

### Rejected: icon-only portals

A lone icon cannot communicate target, grouping rule, membership/count, crossing justification, scope change, or authority. An icon may be redundant decoration beside a label; never the sole control or semantic carrier.

## Required state separation

```text
navigationFrame:
  scope + exact visible node/edge IDs + context/focus ID + selected node

navigationHistory:
  ordered navigationFrame snapshots

pathResult:
  from + to + scope + traversal policy + status
  + relation-bearing branches + selectedBranchId
```

- Portal entry pushes a complete frame.
- Back restores byte-equivalently.
- Path does not alter navigation history.
- Branch choice changes only Path projection.
- Closing Path restores focus to `Path — compare routes`.
- Complete graph escape does not claim ontology completeness.
- Filter/scope changes visibly invalidate or recompute Path.

## Empty and error cases

- Same endpoints: `Choose two different concepts`; Find disabled.
- One branch: `1 shortest directed path · no alternatives`.
- Multiple branches: exact count and length.
- Directed no path: `No directed path in the current graph scope.`
- Reverse traversal: `traverses opposite stored direction`.
- Endpoint outside filter: state that explicitly; no silent full-graph fallback.
- Missing graph: `Path unavailable — graph data did not load. Retry.`
- Zero portals: `No relations leave this area.`
- Zero members: `0 concepts match the current filter`.
- Lost relation binding: block branch with `Route details unavailable`; do not synthesize unlabeled edge.

## Observable novice tasks and hooks

Tasks cover area/purpose/count, portal prediction, pointer/keyboard entry, area rationale, exact predicate/direction recovery, two Path alternatives, branch inspection, exact history restoration, complete graph escape, no-path/error distinction, forced colors, and narrow viewport.

Required hooks:

- `[data-testid="area-heading"][tabindex="-1"]`
- `[data-testid="navigation-history"]`
- `button[data-testid="knowledge-cluster-portal"][data-target-cluster]`
- `button[data-testid="open-path"]`
- `[data-testid="path-result"][data-status][data-branch-count]`
- `button[data-testid="path-branch"][aria-pressed]`
- `button[data-testid="focus-back"]`
- `button[data-testid="open-complete-graph"]`

Record success, time, wrong controls, backtracks, direction errors, prompts, focus restoration, and occlusion. Automated witnesses establish mechanics only; comprehension and accessibility conformance remain pending.

## Repository evidence loci

- `planning/WORK-PACK.md:14-24,63-79,114-130,138-211`
- `NOVICE-TEST.md:1-70`
- `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T210652Z/result.json`
- `knowledgeFocusScene.ts:103-205`
- `KnowledgeFocusPortals.tsx:24-101`
- archive `PathFinderModal.tsx:9-310`
- archive `CustomNode.tsx:74-202`
- archive `KnowledgeGraphView.tsx:37-48,306-409`
- prior candidate `findings.md:163-225`
- prior blocked audit `audit.md:8-34`

No evidence establishes superior usability, comprehension, ontology correctness, accessibility conformance, implementation readiness, promotion, release, deployment, or production readiness.

