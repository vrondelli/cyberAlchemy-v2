---
tags:
  - domainspec-v2
  - ds-d1
  - ds-d8
  - meta-type-boundary
  - r3-research
status: candidate
dispatch_id: 2026-07-02-dsv2-metatype-category-boundary
working_folder: projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/
sources:
  - research.md
  - ../../../definitions/DEFINITIONS.md
  - ../../../definitions/meta-types/meta-types.yml
  - ../../../definitions/relationships/relationships.yml
  - ../../../definitions/relationships/relationships.md
  - ../../../impl/spec/TAXONOMY.md
  - ../../../impl/spec/meta-types/LEARNING-ORDER.md
---

# DomainSpec v2 DS-D1 Meta-Type Category Boundary Findings

## Non-Authority Boundary

This findings document is research synthesis only. It does **not** mutate DS-D1, DS-D2, DS-D8, validators, schemas, implementation projections, generated views, `TAXONOMY.md`, or `LEARNING-ORDER.md`.

Any downstream change must route through the owning surface: DS-D1 formation/correction through definitions governance, DS-D2/DS-D8 relationship authority through root relationship authority and validators, and implementation/schema/projection refresh through the implementation owner path.

## Executive Finding

DomainSpec already has an active relationship-signature layer, but its meta-type formation layer is staged. DS-D8 is active relationship authority with finite endpoint signatures; DS-D1 is not uniformly active type authority.

The 14 backend DS-D1 types are schema-backed and fixture-backed **shape candidates**. They can reject obvious misformations such as "Operation with `state_change=no`" or "Event without `temporal=past`", but they are not proven semantic authorities until their deeper obligations become structural and finite.

The 11 UI types are used by active DS-D8 endpoint signatures, but DS-D8 endpoint use does not promote them into DS-D1 formation authority. They are `DS-D8 endpoint-used / DS-D1 formation-deferred`.

The safe plain-language conclusion is:

> A DomainSpec type or relation becomes first-class authority only where it changes what the system can reject, require, compose, preserve, project, generate, fixture, or route to an owner. Otherwise it remains vocabulary, projection, reading aid, or deferred design pressure.

Primary evidence: [Synthesizer Pass](research.md#synthesizer-pass---noether-emmy), [Reviewer Attack Pass](research.md#reviewer-attack-pass), and [Reviewer Robot-Talks Final Positions](research.md#reviewer-robot-talks-final-positions).

## Core Conclusion

| Surface | Current finding |
| --- | --- |
| DS-D8 | Active relationship-signature authority. Root `relationships.yml` defines 31 active signatures and the inherited wording "typed composable graph fragment." |
| DS-D1 backend 14 | Staged candidate formation authority. The backend types have cards, schemas, challenge/confirm contracts, and positive/negative fixture references, but the schemas are mostly shape-only. |
| DS-D1 UI 11 | Endpoint-used but formation-deferred. UI labels appear in active DS-D8 signatures, but DS-D1 has not supplied cards/schemas/fixtures for formation and correction. |
| `active-harden` | A work posture, not proof. It means "already load-bearing enough to harden" rather than "semantically proven." |
| Category-theory language | Use "typed composable graph fragment." Full category law is deferred until identity, composition, closure, associativity, and path laws are finite validator obligations. |

## Authority Ownership

| Surface | Owns | Current Status | Does Not Own | Witness |
| --- | --- | --- | --- | --- |
| DS-D1 meta-type system | Meta-type formation and correction criteria: what counts as Entity, Operation, Event, Saga, etc. | Backend `DS-D1.1..14` are candidate; UI `DS-D1.15..25` are deferred. | Relationship labels, endpoint signatures, generated inverse views, full category law. | [DEFINITIONS.md](../../../definitions/DEFINITIONS.md#ds-d1--meta-type-system), [meta-types.yml](../../../definitions/meta-types/meta-types.yml) |
| DS-D2 relationship verb set | Canonical authored relationship labels admitted by active signatures. | Active for labels backed by active root signatures. | Endpoint typing and DS-D1 formation criteria. | [DEFINITIONS.md](../../../definitions/DEFINITIONS.md#ds-d2--relationship-verb-set) |
| DS-D8 relationship signature authority | Active endpoint signatures: verb + source/target type set + scope + multiplicity + status. | Active with 31 signatures. | UI type formation, semantic proof of backend types, full category laws. | [DEFINITIONS.md](../../../definitions/DEFINITIONS.md#ds-d8--relationship-signature-authority), [relationships.yml](../../../definitions/relationships/relationships.yml) |
| Implementation schemas and projections | Shape-check witnesses, fixture references, validator-loaded projections, and generated views. | Backend schemas support candidate DS-D1 formation; relationship projections must follow root DS-D8. | Independent relationship authority; semantic proof beyond checked shape. | [impl/spec/meta-types/](../../../impl/spec/meta-types/), [relationships.md](../../../definitions/relationships/relationships.md) |
| `TAXONOMY.md` and `LEARNING-ORDER.md` | Descriptive taxonomy, learning order, and author-facing reading aid. | Helpful but non-root for authority. `TAXONOMY.md` states 25 types; `LEARNING-ORDER.md` explains UI shadows and learning tiers. | DS-D1 promotion, DS-D8 endpoint law, validator truth. | [TAXONOMY.md](../../../impl/spec/TAXONOMY.md), [LEARNING-ORDER.md](../../../impl/spec/meta-types/LEARNING-ORDER.md) |

## First-Class Authority Rubric

| Gate | Question | Concrete Witness | Current Boundary |
| --- | --- | --- | --- |
| Admissibility consequence | Does the type/relation change what DomainSpec can reject or require? | Validator rejection, schema criterion, root relationship violation, or owner-routed contradiction. | Required for authority. Mere recurrence or naming is insufficient. |
| Formation criterion | Is there a finite, machine-visible way to form/check the type? | DS-D1 schema criterion plus positive/negative fixtures. | Backend 14 pass as shape candidates; UI 11 do not yet pass as DS-D1 formation authority. |
| Correction norm | Can an owner or validator say "not X, Y" with consequence? | Challenge contract, blocking question, fixture rerun, definition review route. | Required for type authority. |
| Relation consequence | Does an active relationship signature depend on this type? | DS-D8 active signature with source/target obligations. | Endpoint use proves graph pressure, not DS-D1 formation authority. |
| Projection/generation behavior | Does the surface change generated navigation or projections? | Generated view or projection rule, such as `owned-by` from `owns`. | Generated views are not authored canonical edges. |
| Semantic obligation depth | Is the claim more than declared shape? | Structural participant sets, compensation maps, transition tables, payload/source laws, conflict laws, path checks. | Missing deeper laws mean active-harden or defer, not proof. |
| Collapse/defer condition | Is the candidate merely another type plus metadata? | No distinct validation consequence, no distinct owner route, or only display/prose distinction. | Collapse or defer unless finite distinct behavior is witnessed. |

## Type/Relation Coherence Rule

A declared relationship edge is constructible only when:

1. Its verb resolves to an active DS-D2 canonical label.
2. Its source concept's declared meta-type matches the source side of an active DS-D8 signature.
3. Its target concept's declared meta-type matches the target side of that same active DS-D8 signature.
4. The signature is normalized by the full tuple, not by verb alone.

Normalized signature identity is:

```text
(
  verb,
  source_type or source_types[],
  target_type or target_types[],
  direction,
  multiplicity,
  feature_scope[],
  lifecycle status,
  generated/deferred/deprecated policy
)
```

Consequences:

- Duplicate verbs must be keyed by full signature. `Workflow --[orchestrates]--> Operation[]` and `Saga --[orchestrates]--> Operation[]` are separate active DS-D8 signatures.
- `owned-by` is a generated view from `owns`; it is not an authored canonical edge.
- `depends-on` is deferred; it is not constructible until a distinct validation witness exists.
- `enforces-cross` is deprecated; use `enforces` with cross-feature scope metadata.
- `Operation --[emits]--> Event` is invalid; the active split is `Operation --[produces]--> Event` and `Entity --[emits]--> Event`.
- DS-D8 can reference UI endpoint labels, but it does not confer DS-D1 formation authority on UI types.
- DS-D8 `composition` fields are obligation labels/rationales, not checked categorical composition or path law.

## Per-Type Verdict Matrix

| Type | Witness | Gap | Verdict | Next Action |
| --- | --- | --- | --- | --- |
| Entity | DS-D1.1 schema requires identity-bearing shape; fixtures referenced; active DS-D8 participation in `performs`, `produces-for`, `maps`, `contains`, `queries`, `emits`, `owns`, `belongs-to`. | Entity-to-Entity relation semantics need finite ownership/membership distinction beyond "has identity." | Shape/fixture-backed candidate; active-harden. | Harden `owns` vs `belongs-to` examples, rejection fixtures, and owner-route consequences. |
| Value Object | DS-D1.2 schema requires no identity and Equality clause; target of `contains`. | Equality and immutability are declared shape, not semantic proof. | Shape/fixture-backed candidate; active-harden. | Add stronger equality/correction witnesses where validators can check them finitely. |
| Enum | DS-D1.3 schema requires finite value table; distinguished from State Machine by no transitions. | No active DS-D8 endpoint role; can blur with State Machine if transitions are absent. | Shape/fixture-backed candidate; relation authority deferred. | Keep Enum as value-domain authority and add State Machine non-example/collapse checks. |
| Operation | DS-D1.4 schema requires `state_change=yes`; active in `performs`, `produces`, `produces-for`, `triggers-cross`, `enforces`, `calculates`, `exposes`, `orchestrates`, `applies`, `queries`, `mutates`. | State change is declared shape; mutation semantics/postconditions are not proved. | Endpoint-deployed shape candidate; active-harden. | Preserve `produces`/`emits` split and add finite mutation/postcondition witnesses where possible. |
| Query | DS-D1.5 schema requires `state_change=no`; active in `exposes`, `queries`, `fetches`. | Read-only/purity remains declared shape. | Shape/fixture-backed candidate; active-harden. | Add side-effect rejection/correction fixtures if validator-visible. |
| Calculation | DS-D1.6 schema requires `formal_return_type=value`; active in `calculates`, `queries`, `applies`. | Determinism/purity and return-shape obligations are thin; Operation-returned Value Object edge is deferred. | Shape/fixture-backed candidate; active-harden; defer extra return edge. | Define finite return/purity witnesses or keep them outside DS-D1 semantic authority. |
| Rule | DS-D1.7 schema requires `formal_return_type=boolean`; source of `enforces`; target of UI `mirrors`. | Must not collapse into Policy or become source of `applies`. Boolean guard semantics are still shape-level. | Shape/fixture-backed candidate; active-harden. | Keep `Rule --[applies]--> Operation` invalid; add correction examples for Rule vs Policy. |
| Policy | DS-D1.8 schema requires strategy selection; source of `applies`. | Strategy codomain, conflict resolution, and selection semantics are not structural. | Shape/fixture-backed candidate; active-harden. | Add finite strategy/codomain obligations before stronger semantic claims. |
| Workflow | DS-D1.9 schema requires `scope=intra-feature`; active same-feature `orchestrates`. | Ordered-step law and feature-boundary evidence are not fully structural. | Active DS-D8 signature plus shape candidate; active-harden. | Add ordered operation list and intra-feature boundary witnesses. |
| Saga | DS-D1.10 schema requires `scope=cross-feature`; active cross-feature `orchestrates`. | Participant set, compensation map, failure/residue behavior, temporal safety, and cross-owner law are not structurally checked. | Active DS-D8 signature plus under-hardened DS-D1 type law; not proven distinct from Workflow + scope. | Take the explicit Saga fork below. |
| Interface | DS-D1.11 schema requires `interface_kind`; active in `exposes`, `maps`, `contracts`. | Boundary contract/refinement obligations are thin. | Shape/fixture-backed candidate; active-harden. | Add finite exposure contract witnesses for Operation/Query endpoints. |
| Event | DS-D1.12 schema requires `temporal=past`; active in `produces`, `triggers-cross`, `transitions`, `emits`. | Payload/source/causality obligations are outside current criterion; payload/publisher composite remains deferred. | Endpoint-deployed shape candidate; active-harden. | Preserve `produces`/`emits` split and defer payload/publisher split until distinct behavior is witnessed. |
| Mapping | DS-D1.13 schema requires direction; active in `maps`. | Field-level totality, lossiness, and error semantics are not structural. | Shape/fixture-backed candidate; active-harden. | Add direction and field-mapping fixtures if validator-visible. |
| State Machine | DS-D1.14 schema requires `has_transitions=yes`; active target of `transitions` and `reflects`. | Needs finite state set, transition relation, invalid-transition rejection, guards/effects/invariants to be more than Enum + flag. | Shape/fixture-backed candidate; active-harden; collapse pressure if transitions are absent. | Harden transition-table obligations or explicitly collapse weak cases to Enum. |
| UI 11: Page, Layout, Component, View Model, Hook, Form, Action, Guard, Binding, Adapter, State Indicator | Listed in `TAXONOMY.md`; used by active DS-D8 UI and cross-layer signatures such as `renders`, `wraps`, `composes`, `consumes`, `submits`, `shapes`, `protects`, `displays`, `fetches`, `mutates`, `reflects`, `derives`, `contracts`, `mirrors`. | Missing DS-D1 cards/schemas/fixtures and correction contracts. UI shadows must not silently collapse into backend counterparts because they carry distinct edges. | `DS-D8 endpoint-used / DS-D1 formation-deferred`. | Add DS-D1.15..25 cards/schemas/fixtures or narrow the 25-type claim. Do not claim DS-D1 authority from DS-D8 usage alone. |

## Saga Fork

Saga must be treated as an explicit fork, not a casual collapse condition.

### Fork A: Preserve Active DS-D8 And Harden DS-D1

Keep the active DS-D8 signature:

```text
Saga --[orchestrates]--> Operation[]
```

Then harden DS-D1 Saga formation beyond `scope=cross-feature` by adding finite structural obligations:

- participant set
- compensation map
- failure/residue behavior
- temporal safety
- cross-owner or cross-feature boundary witness
- ordered operation semantics
- positive/negative fixtures that distinguish Saga from Workflow + scope metadata

Under this fork, Saga remains active relationship authority and becomes a stronger DS-D1 candidate only after those obligations are structural and validator-visible.

### Fork B: Owner-Route Collapse/Deprecation

If DS-D1 will not add distinct Saga laws, route an explicit owner decision to collapse/deprecate Saga into Workflow + scope metadata.

This is a change against active DS-D8 authority, because both Workflow and Saga currently have active `orchestrates` signatures. Collapse therefore requires owner-routed deprecation/migration, relationship-authority updates, projection cleanup, validator updates, and compatibility handling. It must not happen as an informal interpretation in findings or implementation code.

## Category Theory Stance

Use the inherited phrase **typed composable graph fragment**.

That means DomainSpec currently has finite typed nodes and finite relationship signatures that can reject unconstructible edges. It does not yet have full category law.

Full category authority is deferred until the following become finite validator obligations:

- identity laws
- composition construction
- closure under composition
- associativity
- path equations
- preservation across projections/generation
- explicit treatment of generated, deferred, and deprecated edges in path reasoning

Until then, category theory is useful as a test generator and design discipline, not deployed authority. DS-D8 `composition` strings are obligation labels, not checked categorical composition.

## Status Separation

| Status | Current Treatment |
| --- | --- |
| Active | DS-D8 root relationship signatures; DS-D2 canonical labels backed by active signatures; `owns`, `belongs-to`, `produces`, `emits`, both `orchestrates` signatures. |
| Generated | `owned-by` is generated reverse navigation for `owns`; do not author it as a canonical edge. |
| Deferred | `depends-on`, Operation-returned Value Object, Event payload/publisher composite, UI DS-D1.15..25 formation authority, and full category laws. |
| Deprecated | `enforces-cross`; use `enforces` with cross-feature scope metadata. |
| Rejected | Silent DS-D8 promotion of UI type formation; `active-harden` as proof; full category-law claims; authored `owned-by`; `Operation --[emits]--> Event`; `Rule --[applies]--> Operation`; Saga distinctness from `scope=cross-feature` alone. |

## R3 Next Actions Before Implementation Refresh

1. Add an explicit DS-D1 maturity ledger: backend `DS-D1.1..14` as shape/fixture-backed candidates; UI `DS-D1.15..25` as formation-deferred unless carded.
2. Decide the UI 11 path: add DS-D1 cards/schemas/fixtures for Page, Layout, Component, View Model, Hook, Form, Action, Guard, Binding, Adapter, and State Indicator, or narrow the 25-type authority claim.
3. Normalize relationship-signature identity in validators and documentation by full tuple: verb, source/target type arrays, direction, multiplicity, feature scope, lifecycle status, and generated/deferred/deprecated policy.
4. Add or verify tests rejecting authored `owned-by`, `depends-on`, `enforces-cross`, `Operation --[emits]--> Event`, and `Rule --[applies]--> Operation`.
5. Harden Saga through Fork A or route Fork B through owner-governed collapse/deprecation.
6. Harden high-risk backend obligations: Workflow ordered steps, State Machine transition relation, Operation/Event split, Rule/Policy correction, Entity `owns` vs `belongs-to`.
7. Clean projection drift in `TAXONOMY.md`, `LEARNING-ORDER.md`, and implementation relationship projections without treating those projections as root authority.
8. Keep schema `edge_participation` slices as evidence checked against DS-D8, not independent relationship authority.
9. Delay broad implementation refresh until the staged authority decisions above are recorded, because refreshing code against blurred authority will bake in the wrong boundary.

## Residue And Open Questions

- Is the "25 DomainSpec concept types" claim canonical authority or descriptive taxonomy until UI cards/schemas exist?
- What minimum finite DS-D1 law makes Saga distinct from Workflow + cross-feature scope?
- Should State Machine require an explicit state set and transition table before promotion beyond shape candidate?
- Which UI shadows need their own formation criteria because their DS-D8 edges differ from backend counterparts?
- Should `feature_scope` become a stronger validator concept before Workflow/Saga and `enforces` cross-feature behavior are promoted?
- What concrete witness would make `depends-on` distinct from field reference, relationship endpoint use, or implementation dependency?
- Which generated/projection surfaces need drift checks after root DS-D8 changes?
- What future category-law subset is actually worth validator cost: path equations, projection preservation, generated-view laws, or none yet?
