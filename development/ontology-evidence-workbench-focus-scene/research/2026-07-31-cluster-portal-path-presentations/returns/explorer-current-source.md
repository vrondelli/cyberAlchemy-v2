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
