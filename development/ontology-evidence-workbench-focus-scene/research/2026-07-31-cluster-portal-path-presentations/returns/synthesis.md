# Synthesis — cluster portals, bounded contexts, and Path presentations

## Decision

Select a minimal hybrid for Invoke:

1. **Labeled cluster portal cards** enter bounded context scenes through the existing focus projection.
2. **A separate relation-bearing Path corridor/comparator** presents alternate routes; it does not call them clusters.
3. **One navigation-frame history owner** restores exact prior scenes.
4. **An explicit complete-graph escape and scene-local legend** remain visible in context and Path modes.

Do not include compound regions, semantic zoom, a map view, or a generalized cluster engine in the first prototype.

Current-source feasibility supports a shortest-path DAG and stateless context area; graph and interaction evidence support labeled cards and a separate Path corridor/list; ontology semantics rejects treating Path alternatives as clusters or geometric containment as ontology meaning. Therefore the path model may derive a shortest-path DAG internally, but the first UI renders relation-bearing route rows plus one selected bounded node-link projection. Context labels annotate nodes; they do not turn a route into a “branch cluster.”

The selection is design inference and a planned witness contract, not executed product evidence.

## Exact-binding contract

Every proposal binds:

1. meaning owner;
2. stable source concept, graph-edge, and source-relation identities;
3. declared membership/traversal/scope/completeness rule;
4. deterministic selector, visible label, exact state/count, and focus result;
5. named Body War fixture;
6. observed/planned/human-pending witness status;
7. claim ceiling.

Aggregation never creates a cluster-to-cluster ontology edge. A crossing summary retains each constituent relation.

## Semantic boundaries

- Ontology context: source concept with `business_kind=bounded_context`.
- Presentation cluster: deterministic rendered set with visible membership rule and no projection authority.
- Current source-backed context rule: `context anchor + direct outgoing owns capability targets`.
- Membership remains many-to-many.
- Portal: reversible affordance justified by exact crossings.
- Path branch: presentation-only algorithmic alternate route, never ontology branch, cluster, or history.
- Complete graph: current complete projection—237/231 in frozen fixture—not ontology completeness.

## Selected concept A — cluster portal cards

- **Task:** predict neighboring context, inspect why reachable, enter, return exactly.
- **Membership:** target context anchor plus direct outgoing source `owns` capability targets. Four-context home remains `authored-set`.
- **Portal:** one native button per target context, grouped by outside capability’s owning context. Activation targets context anchor; constituent crossings remain inspectable; ungroupable crossing stays node-level.
- **Node card:** existing `CustomNode` plus stable identity/keyboard behavior.
- **Relations:** exact endpoints, source predicate, presentation relation, projected/source direction, evidence, mapping loss, separate authority fields. Visual cues redundant.
- **Responsive:** collapsible non-occluding rail; focus-managed narrow list/sheet; pointer/Enter/Space parity; Back restores initiating focus; forced-colors text/borders.
- **Owners:** pure projection in/adjacent to `knowledgeFocusScene.ts`; `KnowledgeFocusPortals.tsx`; transition/state in one projection owner.
- **Fields:** `PresentationCluster`, membership basis/completeness, cluster target, constituent crossings, stable edge/relation identity, evidence, direction, authority, mapping loss.
- **Selectors:**
  - `[data-testid="area-heading"][tabindex="-1"]`
  - `[data-testid="knowledge-cluster-portal"][data-source-cluster][data-target-cluster][data-relation-count]`
  - `[data-testid="cluster-portal-relation"][data-edge-id][data-source][data-target][data-source-relation][data-presentation-relation][data-projected-direction]`
  - `[data-testid="knowledge-node-portal"][data-target]`
  - `[data-testid="knowledge-node"][data-node-id]`
  - `[data-testid="graph-counts"][data-node-count][data-edge-count]`
  - `button[data-testid="focus-back"]`
- **Fixture:** Identity and Consent 2 nodes/1 internal/5 crossings; cards to Activity Evidence, Suggested Track Route Expansion, Candidate Geometry Evidence with counts 2/2/1; Runner→Community stays node-level.
- **Witness:** counts, IDs, grouped relations/fallback, interaction parity, byte-equivalent Back, focus restoration, forced colors, narrow viewport, zero occlusion; human target prediction/recovery errors and time.

Disposition: **select**.

## Deferred concept — compound regions/semantic zoom

Uses same membership rule and may render noninteractive group areas, but it adds layout, focus, visual-containment ambiguity, multi-membership rendering, and zoom state without a unique first-prototype purpose. Region geometry never carries membership or relation semantics.

Disposition: **defer**.

## Selected concept B — relation-bearing Path comparator

- **Task:** compare exact routes, inspect ordered predicates/direction, project one, recover prior scene.
- **Rule:** query scope, traversal policy, algorithm, deterministic edge-ID tie-break, ordered steps. Context annotations do not make routes clusters.
- **Behavior:** derive all shortest alternatives as shortest-path DAG, render bounded rows, retain exact edge choices, optionally project selected route. `not-found` leaves scene byte-equivalent. Branch choice changes Path only.
- **Relations:** preserve stored endpoints, source predicate, presentation relation, projected/traversal/source direction and agreement. Never reverse edge identity.
- **Responsive:** keyboard result list, `aria-pressed` selected route, dialog focus/return, stacked narrow rows, forced-colors text/order.
- **Owners:** pure Path derivation beside focus model; one committed query/result owner; `PathFinderModal` renders/commits. Kill component-local node-only BFS as second owner.
- **Fields:** `PathQuery`, `PathResult`, `PresentationPathBranch`, relation-bearing `PathStep`, `selectedBranchId`, traversal policy, algorithm/tie-break, scope, explicit status.
- **Selectors:**
  - `button[data-testid="open-path"]`
  - `[data-testid="path-result"][data-status][data-branch-count]`
  - `[data-testid="knowledge-path-projection"][data-from][data-to][data-status]`
  - `button[data-testid="path-branch"][data-branch-id][aria-pressed]`
  - `[data-testid="path-step"][data-edge-id][data-traversal-direction][data-projected-direction]`
- **Fixtures:**
  - Activity Evidence → Authentication and Consent: two shortest directed two-relation alternatives via Activity Import/Evidence Submission.
  - Identity and Consent → Suggested Track Route Expansion: distance 3, DAG 5 nodes/5 edges, two alternatives, final steps opposite stored projected direction.
  - Identity and Consent → Run Validation and Anti-Cheat: `not-found`, scene unchanged.
- **Witness:** reordered-input determinism, exact edge IDs/counts/predicates/directions, branch selection, exact Back, focus return, validation/no-path/filter invalidation; human branch tracing and direction/no-path interpretation.

Disposition: **select only after lossless relation fields exist**.

## Deferred small multiples

DOM-first context/route cards have strong list/grid accessibility and direct route comparison, but create another major presentation form and risk duplicate selection/scope/navigation state. Keep as fallback if novice evidence shows the selected canvas-plus-corridor hybrid fails.

Disposition: **defer**.

## Selected ownership

| Part | Owner | Purpose |
|---|---|---|
| Context membership/crossings | Pure focus projection model | Exact bounded scene and portal records |
| Portal card | `KnowledgeFocusPortals.tsx` | Predict/enter one context |
| Navigation frames/history | One projection-state owner | Exact restore and focus |
| Path query/result | One pure Path model and committed state | Deterministic relation-bearing alternatives |
| Path comparator | `PathFinderModal` | Compare/select/report |
| Concept card | Existing `CustomNode` | Inspect source concept |
| Scene legend | Knowledge-view legend renderer | Explain active relation/authority grammar |
| Complete escape | Named focus reset | Return intentionally |

## Relation-preservation prerequisite

Before truthful portal/Path implementation, preserve:

- `graph_edge_id`
- `source_relation_id`
- source endpoints/predicate/direction
- structured evidence `{path, selector, sha256}`
- `source_authority_effect`
- qualified `projection_authority_effect`
- `presentation_relation`
- `projected_direction`
- `mapping_loss`

Current sidecar omits source direction/authority, flattens evidence, and cannot distinguish all parallel relations. A duplicated source/predicate/target tuple proves endpoint/predicate matching is insufficient.

## Legend and stale-residue repair

Required legend selectors:

- `[data-testid="knowledge-scene-legend"][data-scope-kind="context"][data-cluster-id]`
- `[data-testid="knowledge-scene-legend"][data-scope-kind="path"][data-path-result-id]`
- `[data-testid="knowledge-legend-row"][data-cue="presentation-relation"]`
- `[data-testid="knowledge-legend-row"][data-cue="source-predicate"]`
- `[data-testid="knowledge-legend-row"][data-cue="projected-direction"]`
- `[data-testid="knowledge-legend-row"][data-cue="source-direction"]`
- `[data-testid="knowledge-legend-row"][data-cue="authority-effects"]`

Witness must assert legend visibility and that presentation/source relation, projected/source direction, and projection/source authority remain distinct and color is redundant.

Supersede these stale claims:

- current Back does not restore the previous 4/0/6 scene; observed is 2/1/5;
- legend remains planned, not witnessed;
- current sidecar `authority_effect:none` is not source authority;
- current Path is bidirectional, insertion-sensitive, node-only, one-sequence, not directed edge-bearing projection;
- use `presentation_path_branch` or alternate route, never “branch cluster.”

## Kill and defer

Kill icon-only portals; geometry/color/coordinates/source_ref/map adjacency as membership; invented cluster superedges; ontology branch/cluster language for Path; edge bundling as evidence surface; hidden 237-node copies; structural ELK/container state; multiple histories; node-only routes; unsupported direction/authority.

Defer compound regions/zoom, graph maps, small-multiple hub, non-primary bundling, generalized multi-membership layout, and comprehension/accessibility claims.

## Invoke boundary

- Define cluster, direct ownership, portal, crossing, navigation frame, Path result, `presentation_path_branch`.
- Design the single-owner model, lossless fields, selectors, responsive/focus behavior, legend, restoration.
- Plan adapter preservation first; pure derivations second; UI third; deterministic witnesses fourth; human A/B last.

No implementation, ontology mutation, promotion, publication, release, deployment, or production claim is authorized.
