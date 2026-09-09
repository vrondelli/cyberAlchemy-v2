# UOVA UI Description Contract

Status: development-only successor description
Authority effect: none
Runtime authority: UOVA relation-reference architecture and admitted SourceGraph
Profile: `ui-development-explicit-v0.1`

## Purpose

Use the DomainSpec v2 UI candidate meta-types to describe the Ontology Evidence
Workbench frontend without making those candidates runtime, ontology, or release
authority. This layer supersedes only the old UI description's relation bindings;
it does not rewrite the completed R06 design or R09 plan.

```text
SourceGraph + ViewPack
        |
        v
KnowledgeScene v1.2 -- resolves --> RelationFacet
        |                              |
        v                              v
View Models ----------------------> Components
        ^                              |
        |                              v
validated Mappings <------------- Actions / Hooks
```

The diagram is descriptive. The arrows do not grant DomainSpec relationships that
are absent from the minted profile.

## Type mapping

| DomainSpec candidate | UOVA description | Boundary |
| --- | --- | --- |
| Page | `OntologyWorkbenchPage` | terminal OEW route and page inventory |
| Layout | `WorkbenchLayout` | navigator, scene, tools, inspector, announcer slots |
| Component | graph, card, Portal, Path, inspector, Full Index, status, static projection | visual input/output only |
| View Model | scene, relation, portal, Path, inspector, index, navigation, geometry display shapes | derived display data, never semantic authority |
| Hook | scene, geometry, navigation, selection, restoration, status lifecycles | reactive behavior only when a full lifecycle contract exists |
| Form | `PathRequestForm` | validation, submission, target, and error mapping as one aggregate |
| Action | the ten admitted semantic UI intents | named intent and effect boundary; source-side relationship remains local |
| Guard | source, ViewPack, capability, and revision presentation gates | mirrors rules; cannot authorize source access or ontology mutation |
| Binding | five durable query/cache records | not a `RelationRef`, resolver, or visual edge |
| Mapping | six deterministic shape transformations | active substitute for the deferred Adapter candidate |

## Relation-reference repair

Every relation-bearing View Model carries:

```ts
type RelationProjectionBinding = {
  ref: RelationRef;
  relation_digest: string;
};
```

Resolved predicate, endpoint labels, source direction, traversal wording, evidence
references, authority effect, mapping loss, and display cues are validated
projections. They are never independently editable UI truths. A mapper rejects a
missing ID, stale scene, or digest mismatch and never falls back to an
endpoint/predicate tuple.

`PortalViewModel`, `PathViewModel`, `RelationViewModel`, `InspectorViewModel`, and
relation-bearing `IndexViewModel` rows all preserve exact relation identity.
`SceneGeometryViewModel` remains semantic-free and joins through relation ID plus
scene digest.

## Special dispositions

- `Adapter` count is zero. Transformation contracts are active `Mapping`
  specializations with `ui-boundary` metadata.
- General `State Indicator` count is zero. Loading/error is a Component role;
  domain-state projection remains unavailable without an admitted State Machine.
- The profile has no approved Action-source relationship. Components use typed
  local action references; this contract does not invent a DS-D8 arrow.
- The Hook-Binding relationship remains unresolved and is not inferred.
- A pure graph connection is a relation, not a Binding.
- A function named `use*` is not a Hook unless it satisfies the neutral lifecycle
  formation contract.

## Runtime boundary

The UOVA implementation must compile or pin an OEW-owned profile snapshot. Runtime
modules may not import `projects/domainspec-v2/`. The source profile and formation
schemas are design/build evidence only.

Outside this UI type system remain SourceGraph meaning, `RelationRef`, scene and
relation digests, resolver failures, relation indexes, geometry laws, encoding
registry semantics, snapshot validation, ontology authority, and Body War
denominator decisions.

## Denominator and claim ceiling

The refreshed denominator is 58 contracts: 52 UI instances and six Mapping
specializations. The prior inventory is a structural seed, not inherited proof.
Every record requires fresh conformance evidence under UOVARR-005, 006, 007, or
009.

Passing this contract proves a mechanically checked development description only.
It does not activate the candidate meta-types, implement the frontend, admit the
work pack, prove browser behavior, or grant release, deployment, promotion, or
production status.
