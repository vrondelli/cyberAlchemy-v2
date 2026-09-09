# Refine Seed Proposal — UOVA Reference Model and Downstream Contracts

Run ID: `20260805T153357Z-uova-reference-model-and-downstream-refinement`  
Status: strategy proposed; runtime stages and subagents not authorized  
Preset: `full`  
Research: `research-if-gap-appears`, local-first; external research requires a later named-gap confirmation  
Authority effect: none

## Raw operator intent

> Do a refine in this, maybe we are selecting a brittle implementation, then try to refine the other next components.

## Refinement target

Refine the relation identity/reference architecture exposed by `BLK-UOVA-004-PORTAL-CONSTITUENT-SCHEMA`, then propagate the selected model through every downstream UOVA contract that consumes relation, portal, Path, navigation, geometry, renderer, inspector, index, static projection, or Body War adapter state.

This run is not authorized to repair product code or overwrite the completed UOVA design/plan. It produces a non-executed refinement result and a bounded repair plan for a later owner-routed refresh.

## Why the current repair may be brittle

The immediate blocker can be removed by adding `exact_predicate` to every portal constituent, but that may duplicate canonical relation semantics. The broader design already uses exact relation IDs as references in several places:

- a portal constituent carries `source_relation_id` but not `exact_predicate`;
- a Path hop carries `source_relation_id` but task prose also expects predicate-bearing hops;
- Navigation Frame selection carries an identity, not a copied semantic record;
- SceneGeometry relation records carry `source_relation_id` and geometry only;
- the inspector is explicitly expected to resolve source/evidence state from source bindings rather than presentation copies.

This may be deliberate normalization, accidental inconsistency, or an incomplete resolver contract. Fixing only the portal schema risks creating a different rule for each component and later predicate/evidence drift.

## Candidate relation models to compare

1. **Denormalized self-contained records** — copy exact predicate and other display-critical semantics into portals, Path hops, view models, and projections; validate every copy against the source relation.
2. **Normalized reference-first records** — downstream objects carry only exact relation identity plus local state such as traversal or geometry; one revision-bound resolver supplies predicate, direction, evidence, and encoding.
3. **Hybrid immutable relation facet** — derive one digest-bound, immutable relation facet once per `KnowledgeScene`; downstream objects reference that facet while portal/Path/static serialization may include a validated snapshot where self-containment is required.

The run must not preselect one. It must compare semantic fidelity, schema stability, coupling, runtime lookup cost, serialization/export needs, stale-revision behavior, testability, and migration cost.

## Components that must be refined together

- SWU-UOVA-004 Grouped Portals and constituent expansion;
- SWU-UOVA-005 Path service and relation-bearing hops;
- SWU-UOVA-006 Navigation Frame selection/restoration;
- SWU-UOVA-007 UI API profile and action/view-model bindings;
- SWU-UOVA-008 predicate encodings and legend resolution;
- SWU-UOVA-010 SceneGeometry identity boundary;
- SWU-UOVA-011 Full Index and linear projection;
- SWU-UOVA-012 spatial renderer relation paths;
- SWU-UOVA-013 portal cards and constituent activation;
- SWU-UOVA-014 Path/graph/inspector synchronization;
- SWU-UOVA-018–020 Body War View Pack, compilation, and build cutover;
- SWU-UOVA-021–023 acceptance, static output, and second-project reuse.

## Architecture questions

1. What is the single canonical relation record at runtime?
2. Which downstream objects reference it and which, if any, may snapshot selected fields?
3. What invariant proves a snapshot has not drifted from its referenced relation revision?
4. How do exact predicate, source direction, traversal direction, color/pattern tokens, evidence, and mapping loss flow without becoming independent truths?
5. Can portal, Path, geometry, inspector, Full Index, and static projection all select the same relation using one stable key?
6. Which data must survive standalone serialization or print without a live resolver?
7. How should stale graph/View Pack/scene revisions fail?
8. Which completed SWU-UOVA-001–003 contracts remain valid, and what compatibility adapter is needed if a scene contract changes?

## Write scope

This Refine run may write only:

`cyberAlchemy-v2/implementation/ontology-evidence-workbench/development/refinement-runs/20260805T153357Z-uova-reference-model-and-downstream-refinement/**`

It may read the completed UOVA run, current OEW implementation/tests, Body War candidate fixtures, and repository memory as non-authority evidence.

Forbidden during Refine:

- changes to the completed UOVA run or its current Work Pack;
- OEW product code, tests, dependencies, locks, or generated builds;
- Body War ontology, View Packs, frontend, or generated assets;
- public Arcanum sources, authority/promotion state, Git publication, deployment, or credentials.

## Planned configuration

1. Context Builder: strict local evidence pack covering relation-bearing schemas, tasks, implementation, tests, and known failure receipts.
2. Invoke Define: define canonical relation identity, reference, projection, snapshot, resolution, and revision terms.
3. Interrogation `refine-review`: challenge whether the blocker is a schema omission or a missing normalized-resolution law.
4. Research decision: remain local unless critique names an external standards/tool-contract gap; any external pass requires new confirmation.
5. Distill: tournament across the three relation models with a Pareto/recomposition gate.
6. Invoke Design: produce the selected relation-flow architecture and downstream contract matrix.
7. Interrogation `refine-design-review`: attack semantic drift, coupling, serialization, accessibility, stale revisions, and migration.
8. Distill Repair: run controlled portal/Path/geometry/static toy games and repair the design to a fixed point.
9. Invoke Plan: produce a non-executed repair package for the current blocker and all affected later SWUs.
10. Final Interrogation and Refine synthesis: verify coherence, residue, claim ceiling, and next route.

## Done criteria

The run passes only if it produces:

- one explicit canonical relation/reference law;
- a field-ownership matrix for SourceGraph, KnowledgeScene, Portal, Path, NavigationFrame, SceneGeometry, UI View Models, renderer, inspector/index, and static output;
- a decision record comparing all three candidate models and rejected alternatives;
- exact stale-revision and missing-reference behavior;
- a compatibility assessment for completed SWU-UOVA-001–003;
- a downstream impact map covering SWU-UOVA-004–023;
- toy-game evidence for parallel relations, mixed portal traversal, Path selection, geometry lookup, static serialization, and predicate encoding;
- negative controls that detect duplicated semantic drift and unresolved references;
- a non-executed repair plan with coherent SWU boundaries, schema targets, tests, and migration order;
- a final PASS, FLAG, or BLOCK grounded in stage and subagent receipts.

## Claim ceiling

This run may refine design and planning only. It cannot unblock the current Task Session chain, mutate product code, claim a working frontend, prove browser acceptance, promote ontology knowledge, publish, deploy, or release.
