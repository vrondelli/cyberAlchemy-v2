# Unified Ontology View Architecture — Definition

Status: approved definition candidate for Refine design; authority effect: none.

## Product boundary

The Ontology Evidence Workbench (OEW) is a read-only presentation and investigation shell over source-bound ontology records and derived view packs. It lets a person move between a bounded explanatory scene, reversible focused scenes, relation-bearing paths, evidence inspection, and a complete index without changing ontology authority.

The architecture is reusable; Body War is its exact full-scale acceptance fixture. Body War does not own the reusable scene or renderer contracts.

## Actors and jobs

| Actor | Job | Required result |
|---|---|---|
| First-time reader | Understand one bounded area without seeing the whole graph | Home scene with purpose, cluster identity, legible nodes, relations, and exits |
| Investigator | Follow why two things are related | Visible directed edge, exact predicate, evidence, mapping status, and Path result |
| Ontology author/reviewer | Find omissions and semantic loss | Complete index, filters, source identities, mapping diagnostics, and authority ceiling |
| Keyboard/assistive-technology user | Navigate and inspect equivalent meaning | Ordered controls, non-color cues, focus restoration, and non-spatial index fallback |

## Source contract

1. Source records own concept IDs, relation IDs, exact predicates, source direction, definitions, evidence references, mapping loss, and authority effect.
2. A View Pack selects, groups, labels, and orders source identities. It may add presentation metadata but cannot redefine source semantics.
3. The Knowledge Scene is a lossless, deterministic projection of a source graph plus one View Pack and current query/navigation state.
4. All visual, tabular, Path, portal, inspector, and static projections consume the same Knowledge Scene or its exact index; none owns semantic truth.
5. A renderer may choose geometry, routing, label placement, and interaction mechanics only through a versioned adapter contract.

## Required capabilities

- Load and validate a source graph, evidence sidecar, encoding registry, and one or more View Packs.
- Start in a bounded source-backed home scene; never default a large ontology to every node.
- Draw relations as endpoint-attached spatial paths with directional markers.
- Encode the exact predicate with a stable predicate color and redundant label, pattern, and direction cues.
- Encode node kind and role through an icon plus adjacent text; the icon alone is never the identifier.
- Aggregate cut relations into Grouped Portals by destination cluster while preserving every constituent relation and its direction.
- Move through portals and restore the previous Navigation Frame exactly.
- Compute Path results over admitted source relations and show the relation between each node pair.
- Inspect evidence and authority without hiding or replacing the graph.
- Escape to a complete filterable index containing every admitted node and relation.
- Produce a deterministic static/print projection from the same scene model.

## Navigation contract

A Navigation Frame contains the view-pack ID, scene kind, focus identity, selected node/relation, active filters, viewport, open panel, initiating control, and focus target. `Back` restores the entire prior frame. A portal follows the outside endpoint regardless of source-edge direction; traversal direction is recorded separately from source direction.

Scene kinds are `home`, `focus`, `path`, and `full-index`. Focus is not filtering: a focus scene intentionally chooses a bounded neighborhood while filters exclude records from any projection.

## Semantic invariants

- Source Graph != View Pack != Knowledge Scene != renderer state.
- View != cluster; a view may contain several clusters.
- Cut relation != portal; a grouped portal represents one or more cut relations with lossless constituent access.
- Exact predicate != display family; display families may help styling but never replace exact predicate identity.
- Source direction != traversal direction.
- Evidence binding != authority.
- Icon/color/pattern != semantic identity; accessible text is required.
- Inspector selection != navigation focus.

## Acceptance boundary

Structural acceptance uses the exact Body War bundle: 276 nodes, 301 relations, and 39 exact predicates. The first scene must be bounded and source-backed; the complete index must retain the full denominator. Browser acceptance must fail when a relation becomes a card without spatial geometry, an arrow marker is missing, a node-kind icon is absent, a portal loses grouping/constituents, exact predicate cues collapse, focus restoration changes state, or the full index loses source records.

Human comprehension and WCAG conformance require later evidence; deterministic structural and browser checks cannot make those claims.

## Non-goals

- Editing or promoting ontology records.
- Treating a graph visualization layout as an ontology.
- Rendering all 276 Body War nodes in the primary scene.
- Encoding meaning by color or icon alone.
- Maintaining parallel incompatible renderers for Learn and Evidence.
- Patching retained minified bundles as the source-owned build path.
- Selecting a graph library before the adapter and evidence requirements are closed.

## Decisions

| ID | Decision | Rationale |
|---|---|---|
| DEF-01 | One lossless Knowledge Scene feeds every interactive projection. | Prevents the current split where arrows/portals and evidence inspection cannot coexist. |
| DEF-02 | Bounded scenes plus complete index, not a default full-graph canvas. | Protects readability while preserving completeness. |
| DEF-03 | Exact predicate remains the semantic relation identity. | Three generalized edge types and count-only color tokens are insufficient. |
| DEF-04 | Grouped portals are navigation projections with constituent relations. | A flat list of 35 edge buttons is not a comprehensible cluster exit. |
| DEF-05 | Renderer and layout are replaceable adapters. | Tool adoption must not own semantics, evidence, or navigation state. |
| DEF-06 | Generated source modules are the build boundary. | Compiled-bundle string surgery is non-coherent and fragile. |

## Open residue

- The exact Body War home cluster registry must be authored from source-backed business/system views during implementation; the design may specify its schema and fixtures but cannot invent authoritative memberships.
- A later human study must measure novice comprehension.
- An optional high-scale overview renderer may be added only after the bounded default and complete index pass.

