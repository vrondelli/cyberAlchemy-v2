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
