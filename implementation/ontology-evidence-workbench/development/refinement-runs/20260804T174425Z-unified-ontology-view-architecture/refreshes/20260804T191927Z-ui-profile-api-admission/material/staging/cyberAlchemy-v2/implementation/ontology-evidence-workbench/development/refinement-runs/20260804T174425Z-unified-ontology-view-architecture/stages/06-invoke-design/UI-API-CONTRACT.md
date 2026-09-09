# OEW UI API Contract

Status: design extension; development-only.  
Authority effect: none.  
Profile: `domainspec-ui-profile/v0.1` at digest `105e6bec06eb9ceb5cdf472dffe8743d78accb2f2363e6e81b2ae1b0e34c5eeb`.

## Boundary

The DomainSpec UI profile types the presentation API above `KnowledgeScene`; it does not replace or redefine `SourceGraph`, `ViewPack`, `KnowledgeScene`, `SceneGeometry`, `SemanticIntent`, source evidence, or ontology authority. The OEW build compiles an owned profile snapshot and must not load `projects/domainspec-v2/` at runtime.

```text
SourceGraph + ViewPack -> KnowledgeScene -> View Models -> Components
                                      ^                    |
                                      |                    v
                           Navigation reducer <- SemanticIntent <- Actions
                                      ^
                         Bindings + Hooks + non-authoritative Guards
```

## Candidate-type mapping

| DomainSpec candidate | OEW contract | Formation boundary |
|---|---|---|
| Page | `OntologyWorkbenchPage` | OEW dashboard overlay host owns terminal `/` route, target module, access context, primary content, layout, and unit inventory |
| Layout | `WorkbenchLayout` | owns finite navigator, scene, context-tools, inspector-sheet, and announcer slots; no page-specific content |
| Component | scene, node, relation, portal, legend, Path, filter, inspector, index, linear, navigation, status, and static units | typed visual I/O; no route/domain/validation/access authority |
| View Model | scene, node, relation, portal, legend, Path, inspector, index, navigation, and status display shapes | exact `source_refs`, display context/roles, `domain_authority: false` |
| Hook | scene, geometry, frame, selection, viewport restoration, and status reactive contracts | typed inputs/returns, lifecycle, reactive behavior, and effects |
| Form | `PathRequestForm` | complete field/validation/error/submission/target/error-mapping aggregate only; passive filtering remains `FilterPanel` Component behavior |
| Action | one action for each admitted `SemanticIntent.kind` | named intent, trigger, target, effect boundary, success and error outcomes |
| Guard | source, View Pack, adapter capability, and navigation revision gates | mirrors existing rules; `decision_authority: false` |
| Binding | five durable source/layout endpoint records | exactly one query mode, target, trigger, mappings, cache key, and invalidation |

## Special dispositions

- No `Adapter` UI nodes exist. `ProjectSourceToSourceGraphMapping`, `ViewPackToCompiledViewMapping`, `KnowledgeSceneToViewModelsMapping`, `SceneGeometryToSpatialViewModelMapping`, `SemanticIntentToNavigationEventMapping`, and `SourceBindingToInspectorViewModelMapping` bind the canonical DS-D1.13 Mapping formation path/digest, source and target shape contracts, direction, and deterministic field transforms; `ui-boundary` is specialization metadata only.
- No general `State Indicator` node exists. Async loading/error uses the `async-request-indicator` Component role on `WorkbenchStatus`; empty, no-path, and renderer-fallback are ordinary component/view-model states. The domain-state projection branch is unavailable until a declared State Machine source exists.
- A pure connection is a relationship, not a Binding. A function named `use*` is not a Hook without the full neutral lifecycle contract. A framework component name is not formation evidence.
- Candidate Action-source and Hook-Binding relationship gaps remain explicit; the OEW profile does not invent DS-D8 authority. Local typed references bind Actions to semantic intents and Hooks to their consumers.

## API rules

1. Every candidate instance binds its exact formation schema path/digest and carries all required formation fields, individual source confidence, authority status, owner module, runtime symbol, and realization SWU.
2. Ten Action instances map bijectively to the ten `SemanticIntent.kind` literals.
3. View Models preserve source IDs/refs and cannot acquire domain authority.
4. Components consume View Models and emit typed local action references; they do not infer predicates, cluster membership, Path, authorization, or evidence.
5. Guards can stop presentation activation but cannot authorize source access, ontology mutation, or promotion.
6. Bindings are durable read/query records in this prototype. Any future mutation binding requires a separate design/authority gate.
7. Each consumer SWU registers conformance to exact contract IDs. `SWU-UOVA-021` verifies 57/57 records due through G3; `SWU-UOVA-023` verifies all 58/58 records including `StaticProjection` and all six Mapping specializations.
8. Runtime types may implement these contracts in TypeScript, but their meaning is framework-neutral.
9. The compiler copies the exact profile into the OEW-owned snapshot path recorded by the inventory, records profile/schema/formation-schema digests plus unchanged Scene/Intent digests, and rejects runtime imports from the source project.

## Negative controls

Admission must reject: string-only or formation-incomplete instance; string-encoded boolean; broad umbrella Component; fake name-only Hook; edge-only Binding; authoritative Guard; Adapter node; Mapping without source/target/direction/transforms; malformed or missing field transform; collapsed State Indicator; View Model with domain authority; missing Page/Layout inventory; Form lacking validation/submission/error mapping; Action/intent cardinality or literal drift; missing owner/runtime/realization binding; terminal conformance denominator drift; and runtime dependency on the DomainSpec project checkout.

## Evidence ceiling

Passing this contract proves one mechanically checked OEW use of the development UI profile. It is append-only real-corpus evidence for later DomainSpec owners, not proof that candidate meta-types are canonical, portable, release-admitted, or empirically universal.
