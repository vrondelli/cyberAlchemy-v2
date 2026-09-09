# Revised synthesis — cluster portals, context scenes, and route alternatives

## Stage ceiling and decision

This selects a **planned Work Pack candidate** for Invoke. It does not describe implemented, browser-passing, evidence-admissible, accessible, comprehensible, promoted, released, deployed, or production-ready product behavior.

No new cluster card, context scene, relation-bearing Path, exact Back restoration, legend, forced-colors behavior, narrow layout, or all-loaded escape witness currently passes. Everything below is a future acceptance contract.

Select:

1. labeled cluster portal cards entering a distinct `context` scene;
2. a separate relation-bearing route comparator/selected-route projection;
3. exact navigation frames and Path-local return state in existing `store.ts`;
4. new stateless `KnowledgeSceneLegend`;
5. `Show all loaded graph`, 237 nodes/231 relations for the frozen unfiltered fixture.

Both portal cards and Path are conditional on adapter-first lossless relation preservation. Defer compound regions, semantic zoom, maps, bundling, and small multiples.

## Current versus planned

| Concern | Current | Planned acceptance |
|---|---|---|
| Home | Four tour IDs, 0 edges, 6 node portals | heading/purpose, `4 selected contexts — 4 of 12`, initial focus |
| Context | None | distinct `scopeKind:"context"` |
| Portals | node buttons | grouped cards with Identity 2/2/1 crossings |
| Back | 2/1/5 one-hop, not prior 4/0/6 | byte-equivalent frame and focus restore |
| Path | bidirectional insertion-sensitive node sequence | deterministic relation-bearing alternatives |
| Relations | lossy sidecar | exact identity, direction, evidence, authority |
| Keyboard | legacy programmatic focus only | pointer, Tab→Enter, Tab→Space plus active focus |
| Responsive | desktop portal occlusion | zero desktop occlusion and declared narrow behavior |
| Forced colors/legend/escape | not witnessed | exact planned assertions |

## Scope and completeness

`KnowledgeScopeKind = "all_loaded" | "tour" | "focus" | "context" | "path"`.

- `focus` remains current incident one-hop and is not context ownership.
- `context` is anchor plus direct source `owns` capability proofs.
- `path` is selected route projection bound to Path-local return.
- `all_loaded` means raw loaded `store.ts#graph` without presentation filter, never ontology completeness.

Every projection binds graph snapshot/fingerprint, filter fingerprint, rule ID/version, admitted node/edge digests/counts, and `complete-for-declared-rule|selected-subset`.

## Exact relation contract

Adapter owner: `body-war-adapter-writer.mjs`.

Fields:

- `graphEdgeId`, `sourceRelationId`
- `sourceNodeId`, `targetNodeId`, `sourcePredicate`
- `presentationRelation`
- `projectedDirection: forward|backward|bidirectional`
- `sourceDirection: directed|symmetric|view-only|unavailable`
- `sourceAuthorityEffect: none|staging|projection|owner-decision|blocked|unavailable`
- `projectionAuthorityEffect`
- `mappingLoss: exact|generalized|lossy`
- structured evidence `{path,selector,sha256}`

Path adds traversal endpoints/direction and `directionAgreement: with|against|symmetric|view-only|unavailable`. Projected and source direction never collapse. Duplicated endpoint/predicate tuples remain distinct IDs.

## Context membership

Anchor proof binds context graph/source ID and `businessKind:"bounded_context"`.

Member proof binds exact ownership graph-edge/source-relation ID, source context IDs, predicate `owns`, target capability IDs, capability kind, and directed source direction. Anchor is explicit, never self-owned. Membership is many-to-many.

## Portal cards

Each card owns:

- deterministic `portalCardId`;
- source context scene ID and target context ID;
- `constituentCrossings[]` with complete exact relation binding;
- `targetMembershipProofs[]` with owner context, owned capability, ownership edge/relation IDs, `owns`, directed.

Zero owner proofs → exact node fallback. One → one context card. Many → one card per proven owner, lexicographic stable-owner order, visible multiple-owner message, no silent choice. Panel totals separate unique crossing edges from duplicated presentation occurrences.

ID derives from source scene, target context, sorted crossing edge IDs, sorted ownership relation IDs.

Identity fixture: context scene 2 nodes/1 internal/5 crossings; target cards 2/2/1; Runner→Community fallback.

## Route alternatives

Visible term is `route alternative`; `presentation_path_branch` is internal only and not a cluster kind.

Path query binds from/to graph IDs, scope fingerprint, `source-directed|projected-undirected`, algorithm `all-shortest-paths` plus version, and total order `graph-edge-id-lex-v1`.

Result status: `invalid-query|not-found|found|stale`. Route alternative binds ordered exact steps/nodes. IDs are SHA-256 of canonical query, scope, algorithm/version/order, and ordered graph-edge IDs. Equal-length alternatives sort lexicographically by edge-ID tuple. Reordered input must produce identical IDs.

`source-directed` is enabled only after source-direction preservation. `not-found` produces zero alternatives and leaves canvas frame unchanged.

Fixtures:

- Activity Evidence → Authentication and Consent: two directed two-step alternatives via Activity Import/Evidence Submission.
- Identity → Suggested Track Route Expansion: 5 nodes/5 relations, two alternatives, exact `against` fields for reverse traversal under explicitly selected either-way policy.
- Identity → Run Validation and Anti-Cheat: `not-found`, unchanged frame.

## Exact owners

| Concern | Owner |
|---|---|
| Loaded graph, selection, filters, active frame, history, committed Path session | existing `store.ts` |
| Tour/focus/context derivation and crossings | existing `knowledgeFocusScene.ts` |
| Route derivation | new adjacent pure `knowledgePathProjection.ts` |
| Portal UI | existing `KnowledgeFocusPortals.tsx` |
| Path UI | existing `PathFinderModal.tsx`, no local BFS owner |
| Layout, viewport, edges, transitions, legend placement | existing `KnowledgeGraphView.tsx` |
| Concepts | existing `CustomNode.tsx` |
| Relation preservation | existing `body-war-adapter-writer.mjs` |
| Legend | new stateless `KnowledgeSceneLegend` |
| Witnesses | extend `focus-scene.test.mjs` and `validate-body-war-focus-ab.mjs` |
| Gateway | existing authenticated immutable routes; no new route |

`store.ts` extends one `KnowledgeProjectionState` with active `NavigationFrame`, history entries containing frame+initiating control, and a `PathSession` containing return frame, invoker, query/result, selected route ID.

## Transition contract

| Action | History | Path | Result/focus |
|---|---|---|---|
| Portal | push exact frame/control | unchanged | new context; focus target heading |
| Context Back | pop | unchanged | byte-equivalent frame; initiating portal focus |
| Open Path | no push | capture return frame/invoker | focus dialog heading/first field |
| Found | unchanged | store result | canvas unchanged until selection |
| Select route | unchanged | change selected ID | path projection; selected button focus |
| Not found | unchanged | zero alternatives | frame unchanged; focus status |
| Close/Back Path | unchanged | restore return, clear | invoker focus |
| Show all loaded non-Path | push frame/control | null | all_loaded heading |
| Show all loaded from Path | push return frame, not route | clear | all_loaded heading |
| Back from all loaded | pop and restore filter | null | initiating escape focus |
| Snapshot/filter changes during Path | no stale restore | mark stale/remove projection | announce stale, focus invoker |

Path never enters navigation history.

## Deterministic selectors

- scope/home/heading:
  - `[data-testid="knowledge-scope"][data-scope-kind][data-scope-id][data-graph-snapshot-id][data-filter-fingerprint][data-rule-version]`
  - `[data-testid="knowledge-context-home"][data-selected-context-count="4"][data-loaded-context-count="12"]`
  - `[data-testid="area-heading"][data-scope-kind="context"][data-context-id][tabindex="-1"]`
- node/count:
  - `[data-testid="knowledge-node"][data-graph-node-id][data-source-concept-id]`
  - `[data-testid="graph-counts"][data-node-count][data-relation-count]`
- portal:
  - `button[data-testid="knowledge-cluster-portal"][data-portal-card-id][data-source-context-id][data-target-context-id][data-unique-crossing-count][data-target-owner-count]`
  - `[data-testid="cluster-portal-relation"][data-graph-edge-id][data-source-relation-id][data-source-predicate][data-presentation-relation][data-projected-direction][data-source-direction][data-source-authority-effect][data-projection-authority-effect]`
  - `[data-testid="portal-target-membership-proof"][data-ownership-graph-edge-id][data-ownership-source-relation-id][data-owner-context-id][data-owned-capability-id]`
  - `button[data-testid="knowledge-node-portal"][data-target-graph-node-id][data-graph-edge-id][data-source-relation-id]`
  - `button[data-testid="focus-back"]`
  - `button[data-testid="show-all-loaded-graph"]`
- Path:
  - `button[data-testid="open-path"]`
  - `[data-testid="path-result"][data-path-result-id][data-status][data-route-alternative-count][data-scope-fingerprint]`
  - `[data-testid="knowledge-path-projection"][data-path-result-id][data-selected-path-branch-id][data-node-count][data-relation-count]`
  - `button[data-testid="path-route-alternative"][data-path-branch-id][aria-pressed]`
  - `[data-testid="path-step"][data-graph-edge-id][data-source-relation-id][data-source-predicate][data-presentation-relation][data-projected-direction][data-source-direction][data-traversal-direction][data-direction-agreement][data-source-authority-effect][data-projection-authority-effect]`

Ambiguous `data-edge-id`, `data-source-relation`, and `data-authority` are forbidden.

## Stateless legend

Selectors bind active scope and rows for presentation relation, source predicate, projected/traversal/source direction, and authority effects.

Required copy:

> Presentation view only. Scenes, portal cards, and route alternatives organize the currently loaded graph. They do not add ontology membership, prove validity or completeness, change source authority, or promote any concept or relation.

> Projected direction is the rendered edge orientation. Traversal direction is the order followed by this route. Source direction comes only from the source relation and is shown as unavailable when it was not preserved.

> This portal card summarizes named crossing graph edges and target-membership relations. It is not a source relation between contexts.

Escape:

> Show all loaded graph — 237 nodes, 231 relations. “All loaded” does not mean ontology completeness.

## Future Work Pack witness matrix

Planned only:

- adapter determinism and lossless duplicate preservation;
- scope separation;
- exact four home IDs/labels/0 relations/copy/focus;
- Identity 2/1/5;
- 2/2/1 cards with target purpose/member count/proofs;
- zero/one/synthetic-many owner cases;
- pointer, Tab→Enter, Tab→Space parity;
- target heading focus and exact Back frame/filter/selection/focus;
- the two directed alternatives, 5/5 direction stressor, and no-path unchanged frame;
- Path isolation and focus return;
- all-loaded 237/231, no-authority copy, Back restoration;
- deterministic legend;
- forced-colors non-color parity;
- 1440×1000 zero overlap/occlusion;
- 390×844 no horizontal overflow and focus-managed sheet/list with all controls reachable;
- human task metrics only, no comprehension/conformance claim.

## Kill/defer and Invoke boundary

Kill icon-only portals; one-hop focus as context; Path cluster kinds/user-facing branch-cluster language; “complete graph”; opaque aggregate crossings; silent owner selection; unscoped completeness; ambiguous relation/direction/authority; source_ref/endpoints as identity; geometry/color semantics; hidden full copies; imported ELK/container state; new store/gateway/accessibility manager.

Defer compound regions/zoom, graph maps, bundling, small-multiple hub, general multi-membership layout, and UX/accessibility claims.

Invoke may Define the types/rules, Design exact owners/schemas/transitions/selectors/legend/viewport, and Plan adapter preservation first; pure derivations second; store transitions third; portal/Path/legend rendering fourth; deterministic witnesses fifth; human protocol last.

`revision_verdict: READY_FOR_SKEPTIC_RE_REVIEW_AS_A_PLANNED_WORK_PACK_CANDIDATE; NOT_IMPLEMENTED, NOT_BROWSER_PASSING, AND NOT_PRODUCT_EVIDENCE_ADMISSIBLE.`
