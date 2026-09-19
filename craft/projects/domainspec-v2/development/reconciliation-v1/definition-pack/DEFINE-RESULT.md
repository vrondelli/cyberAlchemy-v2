# DomainSpec reconciliation — Define result

Candidate review document; not a released product manual. No canonical promotion or implementation authority.

Pack: definition-pack:1ec5ca924a631c7f38049c2e94ef164f11eed69403cc59cc1aef311e662be018
Session: define-session:70a670c4158756f3ff55e3097db8b98d18709e1452fa09b21de70dd565452e13 (scripted, non-durable runtime; exact result saved in runtime-result.json).

Concept dispositions: 106. Native validation: deterministic-structure-only. Downstream handoff is blocked by explicit open dispositions.

## What this changes in our model

Entity remains identity-bearing; Value Object remains value-equal. A record is only a data shape. Calculations remain pure, mappers receive explicit values, policies select behavior using declared rules in the proposed authoring profile, and state-machine triggers remain separate from effects.

These are candidate clarifications and exact source reuses, not newly implemented Alch syntax. The business ontology maps the meanings without adding canonical graph verbs. Source cards may contain older implementation-era prose; the frozen support matrix owns the current observed state.

## Complete concept dispositions

### BMC-REL-D01 selected meaning

ID: BMC-REL-D01 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D01; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
BMC-REL-D01-B2-ORTHOGONAL-STRICT-PROFILES
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-D02 selected meaning

ID: BMC-REL-D02 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D02; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected option: `BMC-REL-D02-A-EXPLICIT-DIRECTIONAL-CLOSURE`
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-D03 selected meaning

ID: BMC-REL-D03 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D03; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected option: `BMC-REL-D03-B-PER-ENDPOINT-TYPE`
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-D04 selected meaning

ID: BMC-REL-D04 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D04; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected option: `BMC-REL-D04-C-SEPARATE-CONCEPT-DEGREE-AND-STEP-ARITY`
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-D05 selected meaning

ID: BMC-REL-D05 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D05; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected option: `BMC-REL-D05-C-SEPARATE-CONCEPT-DEGREE-AND-ROLE-COUNT`
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-D06 selected meaning

ID: BMC-REL-D06 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D06; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected option: `BMC-REL-D06-C-ONE-OWNER-PER-OWNERSHIP-DIMENSION`
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-D07 selected meaning

ID: BMC-REL-D07 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D07; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected option: `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND`
Selected option: `BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`
Selected option: `BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND`
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-D08 selected meaning

ID: BMC-REL-D08 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-D08; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected option: `BMC-REL-D08-B-RETAIN-CANONICAL-ENDPOINT-PROVENANCE-ONLY`
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### BMC-REL-RQ1 selected meaning

ID: BMC-REL-RQ1 · reuse · owner: DomainSpec relationship owner (recorded source decision)

Consumers: DSR-004, DSR-008, DSR-010

Source: [development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md) — selector ## BMC-REL-RQ1; SHA-256 914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643.

Formal / exact contract:

```text
Selected disposition: keep `Query`; replace the canonical `queries` relationship with `reads`; admit exactly `Query|Operation -> Entity`; exclude `Calculation`; preserve `queries` only as a rejected deprecated migration alias.
```

Plain language: Reuse the selected facet only; other unresolved facets and missing exact receipts are not closed.

Domain example/context: Downstream BMC reconciliation must preserve count bases, closure, ownership and provenance distinctions.

Boundary: A source decision is not packet-wide admission or evidence recovery. Seven missing BMC references remain unresolved.

### domainspec-v2-D18. relationship non-collapse test

ID: domainspec-v2-D18 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D18. relationship non-collapse test; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
relationship non-collapse test =
  DomainSpec v2's DS-D2/DS-D8-local import of the CAV2 non-collapse discipline
  through domainspec-v2-D3 edge-law admissibility.

relationship_non_collapse_properties =
  {
    reject/allow decision,
    derivation consequence,
    projection consequence,
    composition path consequence,
    owner route consequence,
    generated artifact consequence
  }

  a candidate relationship is eligible for authored DS-D2/DS-D8 authority
  only if removing that relationship would change at least one member of
  relationship_non_collapse_properties.

otherwise =
  keep the candidate as prose, display notation, generated view,
  attribute/scope metadata, reading aid, or deferred design pressure.
```
```

Plain language: an edge deserves its own relationship name only if taking the edge away changes one of
the named properties. If nothing changes except wording, it collapses into an existing edge, metadata, a
generated view, or explanation.

Domain example/context: this is the R3/DS-D8 promotion filter and the local use of the CAV2 non-collapse test.
It explains why `owned-by` is generated view only, `enforces-cross` collapsed into `enforces` plus scope
metadata, `depends-on` remains deferred, and `owns` / `belongs-to` stay distinct because they change
validation, projection, and owner-routing behavior.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D19. typed composable graph fragment

ID: domainspec-v2-D19 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D19. typed composable graph fragment; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
typed composable graph fragment =
  a finite directed graph surface where:
    nodes are typed by DS-D1 meta-types,
    edges are typed by active DS-D2 relationship verbs,
    endpoint admissibility is checked by DS-D8 signatures,
    composition is limited to declared finite obligations in root relationship authority.

fragment boundary =
  this does not claim full category law:
    no general identity,
    no general closure under composition,
    no associativity proof,
    no path-equation proof,
    no functorial preservation proof,
  unless a later owner route turns those into finite validator obligations.
```
```

Plain language: DomainSpec has a typed graph that can compose enough to validate and generate useful
structure, but it is not yet claiming the full mathematical package of category laws.

Domain example/context: R3A relationship authority uses this phrase for the current DS-D8 state: 31 active
relationship signatures with typed endpoints, generated/deferred/deprecated edge policies, and validators
that reject noncanonical or unconstructible edges. Category laws remain a separate future formalization route.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D20. reject/allow decision

ID: domainspec-v2-D20 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D20. reject/allow decision; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
reject/allow decision =
  an explicit validator or owner-gate outcome where a candidate relationship changes
  whether a declared edge, endpoint pairing, fixture, or relationship label is accepted
  or rejected.
```
```

Plain language: the edge matters if it changes a red/green decision: this relationship row is allowed,
that one is rejected.

Domain example/context: DS-D8 endpoint validation is the primary current witness. For example,
`Operation --[emits]--> Event` is rejected while `Entity --[emits]--> Event` is allowed. A new edge can claim
this property only when the validator or owner gate would make a different allow/reject decision.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D21. derivation consequence

ID: domainspec-v2-D21 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D21. derivation consequence; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
derivation consequence =
  a change in which build-time obligations, tests, generated checks, or validation duties
  are derived from a spec because the relationship exists.
```
```

Plain language: the edge matters if it causes different checks or obligations to be produced.

Domain example/context: DomainSpec keeps the public derivation contract separate from private engine
delta-rules. A relationship may pass this property when it changes the public obligation set, but it must not
require importing private derivation logic into DS-D8.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D22. projection consequence

ID: domainspec-v2-D22 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D22. projection consequence; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
projection consequence =
  a change in a non-authoritative view, read model, markdown companion,
  implementation-facing projection, or navigation surface that is generated from
  or constrained by canonical relationship authority.
```
```

Plain language: the edge matters if it changes a view people or tools rely on, while the root authority
still remains elsewhere.

Domain example/context: minted-project graph views and display notation are projections. `owned-by` is also a
projection consequence of `owns`, but because it is generated reverse navigation it is not an authored
canonical edge.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D23. composition path consequence

ID: domainspec-v2-D23 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D23. composition path consequence; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
composition path consequence =
  a change in how typed concepts compose across relationship authority:
    allowed source/target path,
    relationship chain,
    feature-boundary crossing,
    ordered operation path,
    or code-pattern connection.
```
```

Plain language: the edge matters if it creates a different path through the typed graph or a different
way code/spec pieces connect.

Domain example/context: this is the closest D18 property to the original CAV2 non-collapse idea in D3:
an edge earns its own type when it composes differently. `enforces-cross` failed because scope metadata kept
the same composition path; `owns` and `belongs-to` survive because they support different Entity-to-Entity
paths.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D24. owner route consequence

ID: domainspec-v2-D24 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D24. owner route consequence; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
owner route consequence =
  a change in which governance owner, approval path, review gate, or remediation
  route is responsible because the relationship exists.
```
```

Plain language: the edge matters if it sends the problem to a different owner.

Domain example/context: DS-D1 formation, DS-D2 labels, DS-D8 signatures, validators, and implementation
projections have different owners. A new relationship can claim this property only when removal changes the
owner route, not merely because someone wants review.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D25. generated artifact consequence

ID: domainspec-v2-D25 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D25. generated artifact consequence; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
generated artifact consequence =
  a change in a generated file, generated view, generated instance, fixture,
  test artifact, or machine-readable output caused by the relationship's presence.
```
```

Plain language: the edge matters if generation produces something different.

Domain example/context: generated reverse navigation such as `owned-by`, generated instances, fixtures, and
test artifacts can all witness this property. The property may justify generation without promoting the
generated thing as an authored canonical relationship.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D26. relationship source-effect binding

ID: domainspec-v2-D26 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D26. relationship source-effect binding; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
the former `creates` contract required independently authored
`creation_targets` and `creates` edges to satisfy a biconditional. That contract is no longer active.
```

Plain language: DomainSpec used to require authors to state the same creation fact twice and then check
that the two statements agreed.

Domain example/context: the edge is now the sole authored creation fact. Generated views may still expose
`creation_targets`, but source specifications and minted node sources may not author it.

Supersession reason: equality checking made duplication consistent but did not make the two representations
orthogonal. D27 replaces that dual-authoring contract with canonical responsibility and generated projection.

Boundary: D26 is superseded by D27; its historical dual-authorship rule is not active.

### domainspec-v2-D27. Canonical Single Responsibility Principle

ID: domainspec-v2-D27 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D27. Canonical Single Responsibility Principle; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
Let B be one authority boundary.
Let C_B be its canonical model elements and R_B its admitted semantic responsibilities.
Let owns_B(c, r) mean that element c canonically owns responsibility r.
Let authored_B(p) be the canonical authored representations of proposition p.

Canonical Single Responsibility(B) iff:
  for every c in C_B: c has exactly one primary semantic responsibility;
  for every r in R_B: exactly one c in C_B owns r;
  for every canonical proposition p: |authored_B(p)| = 1;
  every equivalent non-canonical representation of p is a generated projection
  with provenance back to authored_B(p).

creates is a partial injection from Operation concepts to Entity concepts:
  creates subset_of Operation x Entity
  for every Operation O: |{E | creates(O, E)}| <= 1
  for every Entity E:    |{O | creates(O, E)}| <= 1

creation_targets(O) = sorted({E | creates(O, E)})  [generated, never authored]
```

`B` is the authority boundary in which ownership is evaluated. A *primary semantic responsibility* is the
element's governing reason to exist in the model, not every consequence it participates in. A *canonical
proposition* is one semantic fact admitted as authority. The `creates` inequalities define partial
one-to-one participation (`0..1` on both sides), not a total bijection.
```

Plain language: one element owns one primary responsibility; one responsibility has one canonical
owner; one fact is authored once. Other useful representations are generated from that fact.

Domain example/context: an Operation may still emit an Event, be enforced by a Rule, query an Entity, and
participate in a Workflow while owning one cohesive operational responsibility. A Workflow owns coordination,
not the business responsibilities of the Operations it orchestrates. Legitimate independently meaningful
relationships such as `enforces` may remain many-to-many; cardinality is constrained only when responsibility
ownership requires it.

Conformance scope: D27 is active as a model-admission principle. The current machine-executable application is
`creates`; DomainSpec does not yet claim that every existing concept and relationship has a machine-readable
responsibility owner. Each additional application needs its own finite owner, authorship, consequence, and
validation evidence before claiming conformance.

### Application: canonical creation responsibility

Canonical example:

```text
CreatePlayer --[creates]--> Player
```

The edge is the sole authored creation proposition. Generated views may show:

```text
CreatePlayer.creation_targets = [Player]
```

Other concepts may relate to the same Entity without competing for its creation responsibility:

```text
FindPlayer   --[reads]--> Player
UpdatePlayer --[reads]--> Player
Team         --[owns]-----> Player
```

The following graphs are rejected:

```text
CreatePlayer   --[creates]--> Player
RegisterPlayer --[creates]--> Player   # two canonical owners for one creation responsibility
```

```text
CreatePlayer --[creates]--> Player
CreatePlayer --[creates]--> Team       # one Operation mixes two creation responsibilities
```

Runtime multiplicity remains separate:

```text
one CreatePlayer Operation concept
  -> many executions
  -> many distinct Player runtime instances
```

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D28. DomainSpec obligation lifecycle

ID: domainspec-v2-D28 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D28. DomainSpec obligation lifecycle; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
Let o = (owner_namespace, obligation_id, version, digest) identify one exact
DomainSpec obligation version.

LifecycleState = {open, discharged, killed}
LifecycleEvent = {opened, discharged, reopened, killed}

state_o([]) = undefined

fold(undefined, opened)      = open
fold(open, discharged)       = discharged
fold(discharged, reopened)   = open
fold(open, killed)           = killed

Every other event/state pair is invalid.

current_state(o) = fold(events_o ordered by their owner-admitted sequence)

Only the DomainSpec lifecycle owner may admit a LifecycleEvent for o.
Evidence, validation, generation, projection, evaluation, or CAV2 promotion
may inform that owner decision but cannot append the event themselves.
```

The event and state tokens are closed members of this one lifecycle definition; they are not independent
definition cards. `killed` is terminal for the exact obligation version `o`. A materially changed proposition
requires an owner-governed new identity or version and a new `opened` event rather than another transition on
the killed version.
```

Plain language: an obligation begins open. Its owner may accept enough evidence and discharge it, reopen
it when more work is needed, or kill it when that exact obligation no longer applies. Tests and proofs provide
evidence; they never press those lifecycle buttons themselves.

Domain example/context: DomainSpec v2 proof and validation surfaces may record Lean, Cedar, Datalog, evaluator,
mutation, or runtime results against an exact obligation. A generated catalogue or human page derives the
current lifecycle state from the append-only owner events and displays the owning decision. It may not emit a
transition or turn a passing result into a discharge.

Currentness is a separate axis. When a source, predicate, binding, runtime, policy, or other exact input changes,
an earlier discharge remains a valid historical owner event but becomes non-current for the changed binding.
That change does not rewrite the earlier event and does not automatically emit `reopened`.

Decision dispositions are also separate. `refuse` and `defer` record what the owner decided about the current
request; neither changes the prior lifecycle state. `resolved` may appear in ordinary explanation, but it is not
a machine lifecycle state because it would collapse `discharged` and `killed`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D29. Ownership Dimension Registry

ID: domainspec-v2-D29 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D29. Ownership Dimension Registry; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
Let OwnershipDimensionId be the exact finite active_ids set in
definitions/ownership-dimensions/ownership-dimensions.json.

Initially:
  OwnershipDimensionId = {
    lifecycle,
    custody,
    write-responsibility
  }.

An ownership-dimension reference is admitted iff it is one exact active stable
ID in that registry. The active IDs are pairwise non-overlapping semantic axes.
If a proposed classification is unknown, free-text, aliased, or ambiguous across
more than one active axis, validation fails closed rather than inferring an ID.

For every admitted dimension d, target Entity t, and owner Entities o1 and o2:
  owns_d(o1, t) and owns_d(o2, t) implies o1 = o2.

No existence condition follows: an Entity need not have an owner in any
dimension. Adding, revising, deprecating, or removing a registry entry requires
a fresh Definitions Governance owner decision and a new exact registry digest.
```

The registry order is serialization only and carries no precedence. It contains stable IDs only; this
definition card owns their meanings.
```

Plain language: DomainSpec recognizes three current kinds of direct Entity ownership. Lifecycle,
custody, and write responsibility are separate questions, so different Entities may own different kinds for
the same target. Within one kind, two competing direct owners are not admitted. Unknown or ambiguous kinds are
rejected instead of guessed, and the registry cannot grow through ordinary authoring.

Domain example/context: the canonical `owns` relationship remains one `Entity -> Entity` verb and `owned-by`
remains generated reverse navigation. A later typed representation may bind an `owns` fact to one registry ID,
but this card does not choose that representation. The compatibility token `one_to_many`, endpoint types,
feature scope, runtime writers, Operations, permissions, and calls do not supply a dimension.

### Active ownership dimensions

#### `lifecycle`

Formal voice: responsibility for the target Entity's admission as an identity-bearing domain concept,
continuity rules, lifecycle-transition policy, and retirement. It does not by itself grant custody or authority
for every business-state write.

Plain-language voice: the lifecycle owner decides when the Entity exists as a governed identity and how its
lifecycle may begin, continue, and end.

Domain-context voice: on `Entity --[owns]--> Entity`, `lifecycle` classifies responsibility for the target's
identity-bearing lifecycle without changing the canonical verb or generated inverse.

#### `custody`

Formal voice: responsibility for stewardship, possession, placement, or operational keeping of the target
Entity without necessarily controlling its lifecycle or all business-state mutation.

Plain-language voice: the custodian looks after or holds the Entity even when another owner governs its
lifecycle or writes its state.

Domain-context voice: on `Entity --[owns]--> Entity`, `custody` permits a distinct custodian without competing
with an owner on another admitted dimension.

#### `write-responsibility`

Formal voice: responsibility and authority for changing the target Entity's business state under its admitted
invariants. It does not by itself determine lifecycle admission, retirement, or custody.

Plain-language voice: the write-responsibility owner is accountable for authorized changes to the Entity's
business state.

Domain-context voice: on `Entity --[owns]--> Entity`, `write-responsibility` classifies direct semantic
responsibility for Entity-state mutation; runtime writers, Operations, permissions, and calls do not become
canonical `owns` edges merely by performing or permitting a write.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D30. Membership Kind Registry

ID: domainspec-v2-D30 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D30. Membership Kind Registry; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
Let `K_active` be the exact finite set of active IDs in the digest-bound
`definitions/membership-kinds/membership-kinds.json`. Initially:

```text
K_active = { classification, home-assignment }.
```

A future kind-bearing canonical `belongs-to` fact is admitted only when it references one exact active ID. A
fact whose intended meaning fits zero active meanings is unknown; a fact that fits more than one is ambiguous.
Both fail closed. Free text, aliases, implicit synonym mapping, deprecated IDs, duplicate IDs, and multi-kind
classification of one fact are invalid. The active meanings are pairwise non-overlapping:

- `classification` answers “what classifier or category is applied to the source?”
- `home-assignment` answers “what explicit home or placement context is assigned to the source?”

For each Entity `e`, kind `k` in `K_active`, and parent Entities `p1`, `p2`:

```text
belongs_to_k(e, p1) and belongs_to_k(e, p2) implies p1 = p2.
```

There is no existence condition. Different parents under distinct active kinds are permitted but not required.
The generic prose word `membership` and the unselected `collection-membership` design label are not active IDs.
```

Plain language: a `belongs-to` fact may say either what category the source is classified under or which
explicit home it is assigned to. The author must choose one exact active meaning, and the fact is rejected if
neither or both meanings fit. Nothing is required to belong anywhere, and different meanings may point to
different parents.

Domain example/context: this registry refines the canonical Entity-to-Entity `belongs-to` vocabulary without
changing its endpoints or turning compatibility label `many_to_one` into numeric authority. It remains
independent from canonical `owns` and the D29 ownership-dimension registry. It does not decide packet
representation or executable validation.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D31. Meta-Type Realization

ID: domainspec-v2-D31 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D31. Meta-Type Realization; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
Realization = (
  meta_type_id,
  language,
  source_ref + source_sha256,
  provider_ref + provider_sha256,
  binding_ref + binding_sha256
)

A realization is current iff that exact tuple occurs once in the current
canonical implemented meta-type baseline. Its identity is byte-bound; path or
label equality without digest equality is insufficient.
```
```

Plain language: a realization is the exact selected implementation recipe for one DomainSpec meta-type
in one language. It names the implementation, its provider, and the binding that joins them, including their
digests.

Domain example/context: the current baseline contains one TypeScript, one Python, and one Rust realization for
each of the 13 active backend meta-types. A realization is neither the semantic meta-type itself nor a domain
instance created from it.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D32. Canonical Implemented Meta-Type Baseline

ID: domainspec-v2-D32 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D32. Canonical Implemented Meta-Type Baseline; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
Baseline = (
  baseline_id,
  baseline_digest,
  owner_decision_ref + sha256,
  exact_inventory,
  backend_meta_type_set,
  realization_rows,
  UI_supporting_state,
  relationship_authority_denominator
)

The baseline is immutable. Changing any frozen byte requires a new baseline ID,
inventory, digest, owner binding, and validation result. The current baseline is
resolved through definitions/meta-types/current-implementation.json.
```
```

Plain language: this is the sealed, versioned snapshot of the implementations DomainSpec has selected
as its starting point. It answers “what exactly do we mean by implemented today?” without relying on scattered
historical decisions.

Domain example/context: the current baseline admits 13 backend meta-types and 39 realization rows across
TypeScript, Python, and Rust. It preserves the 11 UI states as supporting context, the 31-row DS-D8
relationship denominator, and the complete D36-D44 compensation definition epoch. Baselines `@1` through
`@5` are historical; the current state points to `@6`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D33. Meta-Type Instantiation

ID: domainspec-v2-D33 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D33. Meta-Type Instantiation; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
instantiate(node, selected_realization, target_root) =
  validate typed input and exact baseline binding
  -> derive a deterministic contained artifact plan
  -> validate collisions, paths, and declared effects
  -> publish the complete plan atomically or publish nothing
  -> emit a baseline-bound receipt
  -> reread and observe the target outputs
```
```

Plain language: instantiation turns a typed DomainSpec concept into the exact selected implementation in
another project, with predictable files and an auditable result.

Domain example/context: the private CLI selects one D31 realization by meta-type and language, generates only
inside the declared target root, and binds its output receipt to the current D32 baseline. Its closed decoder,
planner, guarded atomic writer, receipt, reread observer, and clean-package replay are implemented and admitted
in baseline `domainspec-meta-types-current-implemented@3`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D34. Target Implementation Conformance

ID: domainspec-v2-D34 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D34. Target Implementation Conformance; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
conforms(target, selection, baseline) = PASS iff
  selection occurs exactly once in baseline.realization_rows
  and target inventory equals the declared artifact plan
  and every selected structural, semantic, relationship, effect, continuation,
      and digest obligation is observed and satisfied.

Missing, unknown, unsupported, stale, or undeclared observations cannot become PASS.
```
```

Plain language: conformance proves that the target project implements the exact version and language
form DomainSpec selected, not merely something with a similar name or shape.

Domain example/context: for an Operation, observation includes declared read, write, and effect sets; guard
execution before mutation; atomic state-and-outbox behavior; explicit failure continuation; rejection of
undeclared reads, writes, or effects; and the typed Rule, Event, and Workflow relationships governed by DS-D8.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D35. Baseline-Bound Instantiation Receipt

ID: domainspec-v2-D35 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D35. Baseline-Bound Instantiation Receipt; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
InstantiationReceipt = (
  baseline_id + baseline_digest,
  input_identity + input_digest,
  selected_realization_refs + digests,
  artifact_plan,
  output_paths + output_digests,
  mutation_outcome,
  reread_observations,
  conformance_outcome
)
```
```

Plain language: the receipt is the generated implementation's tamper-evident birth certificate. It says
what was selected, what was written, what was observed afterward, and whether the result matched.

Domain example/context: the current private `instantiate`, `lint`, and `receipt` CLI surfaces agree on this same
binding. The receipt schema and producer are implemented, target bytes are reread, and clean-package replay
checks deterministic package identity.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D36. Workflow Compensation

ID: domainspec-v2-D36 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D36. Workflow Compensation; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
WorkflowCompensation = (
  immutable D37 RecoveryIntent,
  frozen recovery plan,
  exact recovery Operations,
  external execution through D38..D44
)

workflow_evaluation_result in {not-required, recovery-required}

For one failed Workflow execution w:
  not-required => no RecoveryIntent exists
  recovery-required => exactly one RecoveryIntent exists
  targets(w) is a subset of the Operations orchestrated by that Workflow
  plan(w) is a topological ordering of targets(w)

Ordering precedence:
  explicit Operation dependency edges first;
  otherwise reverse completed-step order;
  reverse completed-step order is also the deterministic tie-breaker.

Workflow evaluation may emit intent and plan but never invokes recovery Operations.
Before the first invocation, the external executor resolves every planned Operation
to one exact binding or rejects the complete plan without mutation.
```

Semantic recovery state is owned by D37, durable coordination state by D38, individual execution outcomes by
D39, replay protection by D40, exclusive worker authority by D41 and D42, retry scheduling by D43, and the
whole recovery's final result by D44. Every recovery target remains an ordinary Operation and retains its
declared reads, writes, effects, guard-before-mutation ordering, atomic state-and-outbox boundary, Events, and
explicit failure continuation. Compensation adds no DS-D1 meta-type and no DS-D2/DS-D8 relationship verb.
```

Plain language: Workflow Compensation is forward recovery after part of a Workflow completed. The
Workflow records what happened and requests a frozen recovery plan; durable machinery can safely resume that
same plan after retries, crashes, or worker replacement without silently choosing a different action.

Domain example/context: DomainSpec binds forward and recovery steps through the existing
`Workflow --[orchestrates]--> Operation` relationship. The current three-profile reference implementation
realizes intent planning, exact-binding preflight, external invocation, and deterministic replay keys. Durable
dispatch, claiming, lease renewal, persisted retry scheduling, and restart recovery remain unimplemented and
are recorded separately from the admitted semantics.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D37. Recovery Intent

ID: domainspec-v2-D37 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D37. Recovery Intent; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
RecoveryIntent = (
  intent_id,
  workflow_execution_id,
  failure_occurrence_id,
  failed_step_id,
  completed_step_journal_digest,
  plan_digest
)

semantic_status in {required, satisfied, unresolved}

required   iff execution or an authorized retry remains possible
satisfied  iff D44 disposition = completed
unresolved iff D44 disposition in {exhausted, escalated}
```

There is at most one intent for one immutable Workflow failure occurrence. Its identity and plan digest never
change after creation. `not-required` is a D36 evaluation result and means no intent exists.
```

Plain language: the intent is the stable statement that one particular Workflow failure still needs one
particular recovery plan. It is the recovery's identity, not a queue message or a worker attempt.

Domain example/context: DomainSpec derives the intent from the completed-step journal and the exact
`Workflow --[orchestrates]--> Operation` plan. Retries, claims, leases, workers, and restarts preserve it.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D38. Durable Compensation Dispatch

ID: domainspec-v2-D38 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D38. Durable Compensation Dispatch; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
DurableCompensationDispatch = (
  dispatch_id,
  intent_id,
  frozen_plan_digest,
  durable_progress_journal,
  dispatch_state,
  version
)

dispatch_state in {ready, leased, executing, retry-scheduled, terminal}

ready -> leased -> executing -> terminal
leased -> ready
executing -> ready | retry-scheduled
retry-scheduled -> ready
```

Every transition compares against the current version and is recorded atomically with its dispatch outbox
record. The intent, frozen plan, completed progress, exact Operation binding, and D40 identity survive worker
loss and restart. A terminal dispatch has no implicit successor.
```

Plain language: the dispatch is the durable recovery record. It remembers what must run, what already
finished, and where execution can safely resume.

Domain example/context: DomainSpec binds one D37 intent to the D36 plan. The dispatcher coordinates existing
Operations but never replans, substitutes an Operation, or absorbs its business effects.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D39. Compensation Execution Attempt

ID: domainspec-v2-D39 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D39. Compensation Execution Attempt; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
CompensationExecutionAttempt = (
  attempt_id,
  dispatch_id,
  plan_occurrence_id,
  attempt_number,
  claim_id,
  lease_id,
  fencing_token,
  started_at,
  finished_at?,
  outcome
)

outcome in {succeeded, failed, unknown}
```

One attempt is one bounded executor episode for one planned Operation occurrence. Starting execution after a
retry or takeover creates a new attempt. Claim acquisition and lease grant or renewal alone do not.
```

Plain language: an attempt is one try. Losing the worker can make the result unknown, which is different
from proving that the Operation failed.

Domain example/context: every DomainSpec attempt retains the exact Operation occurrence and evidence references;
an unknown result can be replayed only with D40's unchanged invocation identity.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D40. Compensation Invocation Identity

ID: domainspec-v2-D40 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D40. Compensation Invocation Identity; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
invocation_identity = H(intent_id, plan_digest, operation_id, plan_occurrence_id)

For attempts a and b over the same plan occurrence:
  invocation_identity(a) = invocation_identity(b)
  attempt_id(a) != attempt_id(b)

semantic_application_count(invocation_identity) <= 1
```

The identity excludes worker, process, attempt, claim, lease, and scheduling values. The exact recovery
Operation or its bound adapter must durably recognize an already-applied identity and return its recorded
result without repeating the business effect.
```

Plain language: every retry is a new try at the same recovery action, so it gets a new attempt identity
but reuses the same business-safe replay key.

Domain example/context: DomainSpec refines D36's deterministic idempotency key into a stable identity for each
planned Operation occurrence. The same Operation appearing twice in one plan receives two occurrence keys.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D41. Compensation Claim

ID: domainspec-v2-D41 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D41. Compensation Claim; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
CompensationClaim = (
  claim_id,
  dispatch_id,
  claimant_id,
  acquired_at,
  acquired_dispatch_version,
  fencing_token,
  claim_state
)

claim_state in {current, released, superseded}

current(claim) iff
  claim.claim_state = current
  and claim.fencing_token = greatest_committed_fencing_token(claim.dispatch_id)

may_advance(claim, now) iff current(claim) and exists active D42 lease at now
```

Acquisition is compare-and-set against `acquired_dispatch_version` and atomically creates a fencing token
greater than every prior committed token for the dispatch. Takeover creates a new Claim and supersedes every
earlier claimant.
```

Plain language: the Claim identifies which worker is currently allowed to move one recovery record
forward. Its fence stops an older worker from committing after takeover.

Domain example/context: DomainSpec uses the Claim to serialize D38 coordination only. D40 protects business
effects, and each Operation retains its own effect authority.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D42. Compensation Claim Lease

ID: domainspec-v2-D42 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D42. Compensation Claim Lease; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
CompensationClaimLease = (
  lease_id,
  claim_id,
  lease_generation,
  valid_from,
  expires_at,
  renewed_from_lease_id?
)

active(lease, now) iff
  valid_from <= now < expires_at
  and lease.lease_generation = greatest_committed_generation(lease.claim_id)
  and current(claim(lease.claim_id))
```

Renewal creates a newer Lease generation for the same Claim and preserves its fencing token. Expiry before
execution creates no attempt. Expiry after execution begins makes that attempt unknown; takeover creates a new
D41 Claim before any successor attempt.
```

Plain language: the Lease is the Claim's deadline. If a worker stops renewing it, another worker can
eventually take over instead of leaving recovery stuck forever.

Domain example/context: DomainSpec uses the Lease for crash-recovery liveness while the Claim and fence preserve
exclusive advancement safety.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D43. Compensation Retry

ID: domainspec-v2-D43 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D43. Compensation Retry; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
CompensationRetry = (
  dispatch_id,
  predecessor_attempt_id,
  successor_attempt_number,
  not_before,
  remaining_budget,
  selected_policy_ref
)

retry preserves:
  intent_id, dispatch_id, plan_digest, durable progress, Operation binding,
  plan occurrence, invocation identity

retry changes:
  attempt_id, scheduling metadata

retry may change after authority loss or takeover:
  claim_id, lease_id, fencing_token
```

Retry exists only when the failed Operation's explicit continuation, or an explicitly selected policy allowed
by that binding, selects retry. Limits and backoff are bounded and persisted before eligibility.
```

Plain language: retry means “try the same declared recovery action again later,” not “choose a new plan.”

Domain example/context: the DomainSpec dispatcher enacts the Operation-owned continuation. It cannot invent retry
policy, reset completed progress, or convert escalation into retry.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D44. Compensation Terminal Disposition

ID: domainspec-v2-D44 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D44. Compensation Terminal Disposition; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
CompensationTerminalDisposition = (
  dispatch_id,
  disposition,
  final_attempt_id?,
  cause,
  evidence_refs,
  recorded_at
)

disposition in {completed, exhausted, escalated}
```

`completed` requires durable success evidence for every plan occurrence. `exhausted` requires an explicit
terminal-failure continuation or consumed retry budget. `escalated` requires the Operation-owned escalation
route. A terminal dispatch has no implicit successor.
```

Plain language: Terminal Disposition is the durable final answer for the whole recovery, not the result
of one attempt.

Domain example/context: DomainSpec records the final attempt and evidence without turning that record into
permission for another Workflow or Operation.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D45. Concern-Specific Dependency Contract

ID: domainspec-v2-D45 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D45. Concern-Specific Dependency Contract; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
ConcernSpecificDependencyContract = (
  contract_id,
  concern,
  consumer_roles,
  operation_signatures,
  failure_surface,
  implementation_profile_ref
)

requires:
  one named concern per contract
  provider mechanics absent from consumer-owned signatures
  concrete realization supplied at a composition boundary
```

A dependency contract is named for the responsibility it exposes, such as a Recovery Repository, Recovery
Unit of Work, Clock, Scheduler, Wakeup capability, or Operation Binding Resolver. DomainSpec does not require
one universal code-level `Port` abstraction, DI container, decorator system, or service locator. A DomainSpec
Interface remains a DS-D1 logical boundary and is not implied merely because code consumes a dependency.
```

Plain language: name the seam after the job it performs. A store contract, clock, and message sender
have different responsibilities and should not be hidden behind one generic dependency shape.

Domain example/context: the durable-recovery runtime consumes a Recovery Coordination Repository, a local
Recovery Unit of Work, a Clock, a Wakeup capability, and exact Operation bindings. A TypeScript profile may
express these as structural types supplied through higher-order-function construction; another profile may
choose another language form without changing the concern.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D46. Persistence Binding

ID: domainspec-v2-D46 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D46. Persistence Binding; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
PersistenceBinding = (
  binding_id,
  logical_subject_refs,
  dependency_contract_ref,
  adapter_ref,
  resource_ref,
  implementation_profile_ref,
  logical_physical_mapping_ref,
  evidence_boundary
)
```

The binding connects exact logical persistence roles and one D45 contract to one selected physical
realization and its evidence boundary. `interface_ref` is optional and is present only when an actual DS-D1
Interface owns the logical boundary; Entity, Operation, Query, Workflow-runtime, or other exact subject refs
may bind persistence without inventing an Interface. Database, ORM, schema, migration, connection, locking,
and provider configuration remain implementation-profile or adapter concerns.
```

Plain language: a Persistence Binding says which repository-shaped contract uses which concrete store
realization, and exactly how far the evidence for that choice reaches.

Domain example/context: DomainSpec durable recovery binds the Recovery Coordination Repository to the selected
coordination-store adapter. The binding may prove exact reads and writes for that adapter, but it does not by
itself prove atomicity, retry safety, delivery, or production durability.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D47. Transaction Guarantee Binding

ID: domainspec-v2-D47 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D47. Transaction Guarantee Binding; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
TransactionGuaranteeBinding = (
  binding_id,
  unit_of_work_contract_ref,
  participant_refs,
  atomicity_scope,
  selected_guarantees,
  implementation_profile_ref,
  failure_outcome_binding_ref,
  evidence_boundary
)
```

The binding declares one exact local commit boundary and its participants. It applies only when atomicity or
another named transaction guarantee is claimed. It requires D48 typed failure outcomes and provider-specific
commit, rollback, conflict, partial-commit, and restoration observations. It never creates one transaction
over a multi-step Workflow or across independent resources.
```

Plain language: a Transaction Guarantee Binding states exactly which writes must succeed or fail
together in one selected local transaction.

Domain example/context: a durable-recovery coordination transition and its dispatch-outbox record share one
Recovery Unit of Work. Each recovery Operation separately owns its business-state-and-outbox transaction;
the coordinator never combines the two boundaries into a distributed transaction.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D48. Failure Outcome Binding

ID: domainspec-v2-D48 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D48. Failure Outcome Binding; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
FailureOutcomeBinding = (
  binding_id,
  concern_ref,
  provider_outcome_ref,
  outcome_class,
  evidence_refs,
  continuation_owner_ref
)

outcome_class in {retryable, non-retryable, unknown}
```

The binding classifies one provider or integration failure without selecting the continuation that consumes
it. `unknown` is required when evidence cannot distinguish application, rollback, commit, delivery, or other
relevant outcomes. Retry is permitted only through a separately declared continuation and stable semantic
identity; the binding cannot make an unsafe operation retryable.
```

Plain language: a Failure Outcome Binding translates a concrete failure into a typed result while
preserving uncertainty instead of guessing what happened.

Domain example/context: durable recovery maps store conflicts, rollback failures, authority loss, and unknown
Operation outcomes into explicit continuations. A D39 failed or unknown attempt remains distinct from the D44
terminal result of the whole recovery.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### domainspec-v2-D49. Durable Workflow Runtime Binding

ID: domainspec-v2-D49 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## domainspec-v2-D49. Durable Workflow Runtime Binding; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
DurableWorkflowRuntimeBinding = (
  binding_id,
  workflow_profile_ref,
  persistence_binding_refs,
  transaction_guarantee_binding_refs,
  failure_outcome_binding_refs,
  scheduler_contract_ref,
  clock_contract_ref,
  wakeup_contract_ref?,
  replay_contract_ref,
  version_compatibility_ref,
  evidence_boundary
)
```

The binding is required only when a selected Workflow profile claims durable progress across process loss or
restart. It composes concern-specific contracts and bindings; it does not replace D46 persistence records or
turn runtime-provider behavior into portable Workflow meaning. A synchronous in-process Workflow profile does
not inherit checkpoint, lease, timer, replay, or version-compatibility obligations merely because the durable
profile has them.
```

Plain language: a Durable Workflow Runtime Binding is the manifest that names everything a restart-safe
Workflow runtime depends on and the evidence required for that exact combination.

Domain example/context: DomainSpec durable recovery uses this binding to connect Recovery Intent coordination,
the Recovery Repository and Unit of Work, Claim and Lease timing, retry scheduling, wakeups, restart
reconciliation, and Operation-owned replay safety without selecting a database or queue in the ontology.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1 — Meta-Type System

ID: DS-D1 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## DS-D1 — Meta-Type System; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
Exact source section governs this registry reference.
```

Plain language: Reuse the exact source registry; this pack does not re-admit its members.

Domain example/context: See exact source section and current support matrix for independent implementation state.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.1 · Entity (Structural)

ID: DS-D1.1 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.1 · Entity (Structural); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Entity =
  a persisted, lifecycle-tracked domain object with a stable identity.
  well-formedness criterion (entity.schema.yml):
    identity   : >=1 field flagged identity  (bounded exists over the fields table)
    typedness  : every field declares a non-empty type
  two Entities with equal field values but different identity are DIFFERENT.
```
```

Plain language: a thing you'd give an ID in a database and track over time — User, Order,
PaymentTransaction. Its sameness is its identity, not its field values.

Domain example/context: the primary "actor" node in a DomainSpec aspect file; SOURCE of `belongs-to` /
`contains` / `emits` / `owns` / `performs`, TARGET of `belongs-to` / `derives` / `maps` / `owns` /
`creates` / `produces-for` / `reads` (the DS-D8 edge slice). Checked by the content validator against
`entity.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.11 · Interface (Connective)

ID: DS-D1.11 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.11 · Interface (Connective); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Interface =
  an API boundary exposing operations/queries to consumers.
  well-formedness criterion (interface.schema.yml):
    declares_boundary : declares interface_kind (external | internal)  (in the Attribute | Value table)
  documents request/response shapes + how they map to domain concepts.
```
```

Plain language: a typed contract at a system edge — what a consumer may call, with what payload, and
what comes back. External (METHOD + path) or internal (a method signature).

Domain example/context: the boundary node exposing the domain to consumers; SOURCE of `exposes`, TARGET of
`contracts` / `maps` under DS-D8. Checked by the content validator against `interface.schema.yml`.

Infrastructure boundary: DS-D1.11 is used only when the dependency is an actual logical Interface in the
domain graph. A Repository, Unit of Work, Clock, Wakeup, telemetry seam, or binding resolver remains a
concern-specific code contract under `domainspec-v2-D45`; it is not forced to masquerade as an Interface and
does not imply a universal `Port`. D46-D49 describe provider bindings around those contracts without creating
new DS-D1 meta-types or DS-D8 relationship verbs.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.12 · Event (Connective)

ID: DS-D1.12 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.12 · Event (Connective); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Event =
  a past-tense notification of a domain state change.
  well-formedness criterion (event.schema.yml):
    past_tense : declares temporal = past  (in the Attribute | Value table)
  a typed payload + consumers; decouples what happened from who reacts.
```
```

Plain language: a past fact about the system's state — something that already happened
(PaymentCompleted, OrderShipped), broadcast so other parts can react without the emitter knowing them.

Domain example/context: SOURCE of `transitions` / `triggers-cross`, TARGET of `emits` / `produces` under DS-D8.
Checked by the content validator against `event.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.13 · Mapping (Connective)

ID: DS-D1.13 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.13 · Mapping (Connective); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Mapping =
  a field-by-field data transformation between two shapes.
  well-formedness criterion (mapping.schema.yml):
    has_direction : declares direction (inbound | outbound | bidirectional)  (in the Attribute | Value table)
  source field -> target field, with defaults, computed fields, boundary validation.
```
```

Plain language: a translator between two shapes: source field → target field, plus defaults, computed
fields, and validation at the boundary.

Domain example/context: the shape-conversion node; SOURCE of `maps` under DS-D8. Checked by the content
validator against `mapping.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.14 · State Machine (Lifecycle)

ID: DS-D1.14 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.14 · State Machine (Lifecycle); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
State Machine =
  the states an entity moves through + the valid transitions between them.
  well-formedness criterion (state-machine.schema.yml):
    has_transitions : declares has_transitions = yes  (in the Attribute | Value table)
  states + transitions (guards, effects) + invariants; the most testable meta-type.
```
```

Plain language: an entity's lifecycle made explicit — all states, which transitions are legal, and
what each transition requires and does.

Domain example/context: the lifecycle node; TARGET of `reflects` / `transitions` under DS-D8. Checked by the
content validator against `state-machine.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.2 · Value Object (Structural)

ID: DS-D1.2 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.2 · Value Object (Structural); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Value Object =
  identity = the value itself (the full field tuple); NO designated identity field.
  well-formedness criterion (value-object.schema.yml):
    no_identity : no field is flagged identity  (identity is by value, not by a field)
    typedness   : every field declares a non-empty type
    equality    : the concept declares an Equality clause
  equal fields => equal value (there is no id to distinguish two equal instances).
```
```

Plain language: Money is the clearest case — any $5 equals any other $5. Two Money are the same when
their amount + currency match; there's no serial number to chase. Sameness is by *content*, not a tracked id —
that's what makes it a Value Object.

Domain example/context: the reusable value pieces embedded inside Entities and shared across features — `Money`
on a Payment, `Address` on a User. It has fields but no lifecycle and no state machine; TARGET of `contains`
under DS-D8. Checked by the content validator against `value-object.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.3 · Enum (Structural)

ID: DS-D1.3 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.3 · Enum (Structural); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Enum =
  a fixed, finite set of named values.
  well-formedness criterion (enum.schema.yml):
    value_table : provides a table with a `Value` column and >=1 row
  no typed field table, no identity — a closed value list, not an object.
```
```

Plain language: the allowed-values guardrail on a field — a fixed, closed set with nothing in between.
`PaymentMethod` is exactly {CREDIT_CARD, BANK_TRANSFER, WALLET}, so a field typed by it can't hold a typo or a
fourth option nobody defined. If you can write out every value and it almost never grows, it's an enum.

Domain example/context: constrains what a field may hold and drives per-value branching; no active DS-D8
relationship signatures currently target or source Enum. Checked by the content validator against
`enum.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.4 · Operation (Behavioral)

ID: DS-D1.4 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.4 · Operation (Behavioral); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Operation =
  a state-changing business action (the write side).
  well-formedness criterion (operation.schema.yml):
    writes_state : declares state_change = yes  (in the Attribute | Value table)
  validates input, checks rules, transitions entities, emits events.
```
```

Plain language: a verb that leaves a mark — after it runs, the world is different: a payment charged, an
order cancelled. Not a plain CRUD "update"; a named action with business meaning and postconditions.

Domain example/context: the write-side node; SOURCE of `creates` / `produces` / `produces-for` / `reads`, TARGET of
`applies` / `calculates` / `enforces` / `exposes` / `mutates` / `orchestrates` / `performs` /
`triggers-cross`. When it authors `creates`, that edge is the canonical creation fact and has at most one
same-feature Entity target. Generated views derive `creation_targets`; source authors do not declare it.
Checked by the content and relationship validators against `operation.schema.yml` and DS-D8.

The canonical implementation contract also requires declared read, write, and effect sets; guard execution
before state mutation; atomic state-and-outbox behavior; explicit failure continuation; rejection of undeclared
reads, writes, or effects; and typed relationships to Rule, Event, and Workflow. These are baseline realization
obligations, not additional DS-D1 maturity criteria. The private CLI now generates and checks the admitted
static target contract; runtime behavior outside an admitted provider remains unsupported.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.5 · Query (Behavioral)

ID: DS-D1.5 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.5 · Query (Behavioral); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Query =
  a read-only retrieval (the read side).
  well-formedness criterion (query.schema.yml):
    read_only : declares state_change = no  (in the Attribute | Value table)
  returns a view; same inputs => same result; no mutation.
```
```

Plain language: a question, not an action — ask it twice and get the same answer, with no side effects.
It defines what consumers may ask for, with which filters, in what shape.

Domain example/context: the read-side node; SOURCE of `reads`, TARGET of `exposes` / `fetches` under DS-D8.
Checked by the content validator against `query.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.6 · Calculation (Behavioral)

ID: DS-D1.6 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.6 · Calculation (Behavioral); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Calculation =
  a pure function that derives a value from inputs.
  well-formedness criterion (calculation.schema.yml):
    returns_value : declares formal_return_type = value  (in the Attribute | Value table)
  deterministic; same inputs => same value; no state change.
```
```

Plain language: a formula with a name — same inputs, same output, every time. FeeCalculation =
amount × rate. No state, no side effects; just a value out.

Domain example/context: SOURCE of `calculates`, TARGET of `applies`. A Calculation consumes explicit values;
Entity input provenance is not inferred as a `reads` edge. Checked by the content
validator against `calculation.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.7 · Rule (Behavioral)

ID: DS-D1.7 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.7 · Rule (Behavioral); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Rule =
  a boolean guard on an operation (blocks / allows).
  well-formedness criterion (rule.schema.yml):
    boolean_predicate : declares formal_return_type = boolean  (in the Attribute | Value table)
  the boolean-ness is DECLARED, never parsed from the Formal cell (that is the engine moat).
```
```

Plain language: a business constraint with a formal boolean expression — unambiguous and directly
testable. It guards state transitions: the condition under which an operation may execute.

Domain example/context: SOURCE of `enforces`, TARGET of `mirrors`; **never** a TARGET of `applies` (that is a
Policy inbound; per `domainspec-v2-D3`). Checked by the content validator against `rule.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.8 · Policy (Behavioral)

ID: DS-D1.8 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.8 · Policy (Behavioral); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Policy =
  decision logic that selects a strategy/branch (chooses how, not whether).
  well-formedness criterion (policy.schema.yml):
    selects_strategy : declares formal_return_type = strategy  (in the Attribute | Value table)
  conditions => a selected behavior (not a boolean block/allow).
```
```

Plain language: encodes business strategy, often configurable — conditions → a selected behavior.
Change the policy, change the choice, without touching the operation.

Domain example/context: SOURCE of `applies` (a Policy applies to Operations/Calculations; the widened
`applies : Policy → {Operation, Calculation}` per `domainspec-v2-D3`). Checked by the content validator
against `policy.schema.yml`.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D1.9 · Workflow (Behavioral)

ID: DS-D1.9 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/meta-types/meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md) — selector ## DS-D1.9 · Workflow (Behavioral); SHA-256 c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51.

Formal / exact contract:

```text
```text
Workflow =
  multi-step orchestration of operations within or across feature boundaries.
  authority criterion (workflow.schema.yml implementation follows in SGRM-003/004):
    admitted_scope : declares scope in {intra-feature, cross-feature}
                     (in the Attribute | Value table)
  ordered steps with one declared ownership-boundary scope.
```
```

Plain language: coordinates several ordered operations across time. The declared scope says whether the
coordination stays inside one feature or crosses feature boundaries.

Domain example/context: SOURCE of `orchestrates` for same-feature or cross-feature Operation coordination; no
active DS-D8 target signatures. Workflow evaluation may emit a `domainspec-v2-D36` recovery intent and
plan but never invokes recovery Operations directly; a separate executor invokes only exact orchestrated
Operation bindings. The content-validator implementation is migrated in SGRM-003/004.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D2 — Relationship Verb Set

ID: DS-D2 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## DS-D2 — Relationship Verb Set; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
DS-D2 relationship verb =
  a canonical authored relationship label admitted by the active
  signatures in definitions/relationships/relationships.yml.

canonical authored verb =
  present in at least one active relationship signature
  AND not listed only as generated_view, deprecated, or deferred.
```
```

Plain language: DS-D2 is the approved vocabulary for arrows in a DomainSpec graph: names like
`enforces`, `reads`, `owns`, and `orchestrates`. If a label is only generated (`owned-by`), deprecated
(`enforces-cross`, `queries`), or deferred (`depends-on`), authors do not use it as a canonical edge.

Domain example/context: feature specs use DS-D2 labels in Concept Graph tables. The validator reads the root
relationship authority, not the implementation projection, and rejects noncanonical labels before any endpoint
meaning is considered.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### DS-D8 — Relationship Signature Authority

ID: DS-D8 · reuse · owner: DomainSpec definitions-governance (source owner)

Consumers: DSR-007, DSR-018, DSR-030

Source: [definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md) — selector ## DS-D8 — Relationship Signature Authority; SHA-256 f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6.

Formal / exact contract:

```text
```text
DS-D8 relationship signature =
  an active tuple in definitions/relationships/relationships.yml:
    (verb, source_type(s), target_type(s), scope, multiplicity, lifecycle status,
     optional generated relationship projection).

edge admissibility check =
  a declared edge a --[verb]--> b is constructible iff:
    verb resolves to an active DS-D2 label
    AND type(a) is in the signature source set
    AND type(b) is in the signature target set.
    AND the edge's same-feature or cross-feature location is admitted by scope
    AND the declared multiplicity bounds hold.
```
```

Plain language: DS-D8 is the typed contract behind every allowed relationship. It says not only that
`enforces` is a valid word, but that only a Rule may enforce an Operation.

Domain example/context: R3A currently defines 31 active signatures. `creates` is the same-feature,
partial-one-to-one `Operation -> Entity` signature. The edge is canonical; `creation_targets` is generated
from its outgoing target rather than authored independently.
The legacy `ui` and `ui-backend` scope tokens are same-feature graph lanes; only
an explicit `cross-feature` token admits a Cross-Feature Dependency.
`enforces` admits both same-feature and cross-feature placement while retaining one
Rule-to-Operation semantic verb; `enforces-cross` remains a rejected deprecated alias.
`orchestrates` has one Workflow signature
covering same-feature and cross-feature scope; `owned-by` is generated navigation; `depends-on`, Operation-returned Value Object, and the
Event payload/publisher split stay deferred until new evidence proves distinct behavior.

Boundary: Exact source meaning reused unchanged. Embedded implementation-era narrative is not a fresh current-state claim; use the support matrix.

### applies

ID: DS-D8:applies · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/10; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Policy","target":["Operation","Calculation"],"scope":["same-feature"],"multiplicity":"many_to_many"}
```

Plain language: A policy selects behavior for an operation or calculation.

Domain example/context: RetryPolicy --[applies]--> RetryPayment

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### belongs-to

ID: DS-D8:belongs-to · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/16; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Entity","target":"Entity","scope":["same-feature","cross-feature"],"multiplicity":"many_to_one"}
```

Plain language: An entity is a member of, classified by, or assigned to another entity. This is distinct from owns^-1.

Domain example/context: Copy --[belongs-to]--> Title; Copy --[belongs-to]--> Branch

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### calculates

ID: DS-D8:calculates · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/6; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Calculation","target":"Operation","scope":["same-feature"],"multiplicity":"many_to_many"}
```

Plain language: A calculation derives values used by an operation.

Domain example/context: FeeCalculation --[calculates]--> ProcessPayment

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### composes

ID: DS-D8:composes · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/19; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Component","target":"Component","scope":["ui"],"multiplicity":"one_to_many"}
```

Plain language: A component includes child components.

Domain example/context: SettlementPage --[composes]--> SettlementPreviewCard

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### consumes

ID: DS-D8:consumes · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/20; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Component","target":"Hook","scope":["ui"],"multiplicity":"many_to_many"}
```

Plain language: A component consumes a hook for state or data.

Domain example/context: PlayersTable --[consumes]--> usePlayers

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### contains

ID: DS-D8:contains · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/12; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Entity","target":"Value Object","scope":["same-feature"],"multiplicity":"one_to_many"}
```

Plain language: An entity embeds a value object as part of its field structure.

Domain example/context: Order --[contains]--> Money

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### contracts

ID: DS-D8:contracts · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/29; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Form","target":"Interface","scope":["ui-backend"],"multiplicity":"many_to_one"}
```

Plain language: A form schema aligns with an interface contract.

Domain example/context: CreatePlayerForm --[contracts]--> PlayerAPI

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### creates

ID: DS-D8:creates · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/3; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Operation","target":"Entity","scope":["same-feature"],"multiplicity":"one_to_one"}
```

Plain language: An operation canonically owns bringing new identity-bearing instances of one same-feature entity type into existence on successful execution.

Domain example/context: CreatePlayer --[creates]--> Player; GenerateSettlement --[creates]--> SettlementTransaction

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### derives

ID: DS-D8:derives · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/28; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"View Model","target":"Entity","scope":["ui-backend"],"multiplicity":"many_to_many"}
```

Plain language: A view model is derived from entity fields.

Domain example/context: PaymentView --[derives]--> PaymentTransaction

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### displays

ID: DS-D8:displays · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/24; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Component","target":"View Model","scope":["ui"],"multiplicity":"many_to_many"}
```

Plain language: A component displays a view model.

Domain example/context: SettlementPreviewCard --[displays]--> SettlementPreview

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### emits

ID: DS-D8:emits · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/14; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Entity","target":"Event","scope":["same-feature"],"multiplicity":"one_to_many"}
```

Plain language: An entity is the subject/source of a domain event.

Domain example/context: PaymentTransaction --[emits]--> PaymentCompleted

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### enforces

ID: DS-D8:enforces · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/5; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Rule","target":"Operation","scope":["same-feature","cross-feature"],"multiplicity":"many_to_many"}
```

Plain language: A rule gates whether an operation may execute. The same canonical verb applies within one feature or across feature boundaries; placement carries the scope, not a second verb.

Domain example/context: MaxAmountRule --[enforces]--> ProcessPayment; compliance.AccessRule --[enforces]--> payments.ProcessRefund

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### exposes

ID: DS-D8:exposes · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/8; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Interface","target":["Operation","Query"],"scope":["same-feature","cross-feature"],"multiplicity":"one_to_many"}
```

Plain language: An interface makes an operation or query callable.

Domain example/context: PaymentAPI --[exposes]--> ProcessPayment

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### fetches

ID: DS-D8:fetches · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/25; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Binding","target":"Query","scope":["ui-backend"],"multiplicity":"many_to_one"}
```

Plain language: A UI binding fetches from a backend query.

Domain example/context: usePlayers --[fetches]--> GetAllPlayers

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### maps

ID: DS-D8:maps · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/11; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Mapping","target":["Entity","Interface"],"scope":["same-feature","cross-feature"],"multiplicity":"many_to_many"}
```

Plain language: A mapping transforms data between an entity and an interface or between boundary shapes.

Domain example/context: RequestToTransaction --[maps]--> PaymentTransaction

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### mirrors

ID: DS-D8:mirrors · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/30; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Guard","target":"Rule","scope":["ui-backend"],"multiplicity":"many_to_one"}
```

Plain language: A client-side guard mirrors a backend access rule.

Domain example/context: ClientPermissionGuard --[mirrors]--> PermissionRule

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### mutates

ID: DS-D8:mutates · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/26; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Binding","target":"Operation","scope":["ui-backend"],"multiplicity":"many_to_one"}
```

Plain language: A UI binding invokes a backend operation.

Domain example/context: useCreatePlayer --[mutates]--> CreatePlayer

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### orchestrates

ID: DS-D8:orchestrates · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/9; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Workflow","target":"Operation","scope":["same-feature","cross-feature"],"multiplicity":"one_to_many_ordered"}
```

Plain language: A workflow coordinates ordered operations within one feature or across declared feature boundaries.

Domain example/context: OrderFulfillment --[orchestrates]--> ChargePayment; ReservationFulfillment --[orchestrates]--> ReserveCopy

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### owns

ID: DS-D8:owns · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/15; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Entity","target":"Entity","scope":["same-feature","cross-feature"],"multiplicity":"one_to_many"}
```

Plain language: An entity has lifecycle, custody, or write-responsibility ownership over another entity.

Domain example/context: Library --[owns]--> Copy

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### performs

ID: DS-D8:performs · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/0; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Entity","target":"Operation","scope":["same-feature"],"multiplicity":"many_to_many"}
```

Plain language: An entity or actor initiates an operation.

Domain example/context: User --[performs]--> CreateOrder

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### produces

ID: DS-D8:produces · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/1; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Operation","target":"Event","scope":["same-feature"],"multiplicity":"one_to_many"}
```

Plain language: An operation causes an event on successful completion.

Domain example/context: ProcessPayment --[produces]--> PaymentCompleted

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### produces-for

ID: DS-D8:produces-for · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/2; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Operation","target":"Entity","scope":["cross-feature"],"multiplicity":"many_to_many"}
```

Plain language: An operation writes or projects data into an entity owned by another feature.

Domain example/context: GenerateSettlement --[produces-for]--> Player

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### protects

ID: DS-D8:protects · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/23; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Guard","target":"Page","scope":["ui"],"multiplicity":"many_to_many"}
```

Plain language: A guard controls access to a page.

Domain example/context: AdminGuard --[protects]--> /admin

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### reads

ID: DS-D8:reads · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/13; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":["Query","Operation"],"target":"Entity","scope":["same-feature"],"multiplicity":"many_to_many"}
```

Plain language: An operation or query depends on entity data by reading it, without making the target an owner or implying that the whole source behavior is read-only.

Domain example/context: GetPaymentHistory --[reads]--> PaymentTransaction; GenerateSettlement --[reads]--> SettlementTransaction

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### reflects

ID: DS-D8:reflects · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/27; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"State Indicator","target":"State Machine","scope":["ui-backend"],"multiplicity":"many_to_one"}
```

Plain language: A UI state indicator mirrors a backend state machine.

Domain example/context: PaymentStatusBadge --[reflects]--> PaymentStatus

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### renders

ID: DS-D8:renders · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/17; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Page","target":"Component","scope":["ui"],"multiplicity":"one_to_many"}
```

Plain language: A page renders components.

Domain example/context: /players --[renders]--> PlayersTable

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### shapes

ID: DS-D8:shapes · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/22; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Adapter","target":"View Model","scope":["ui"],"multiplicity":"many_to_many"}
```

Plain language: An adapter shapes data into a view model.

Domain example/context: PaymentAdapter --[shapes]--> PaymentViewModel

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### submits

ID: DS-D8:submits · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/21; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Form","target":"Action","scope":["ui"],"multiplicity":"many_to_one"}
```

Plain language: A form validates input and delegates to an action.

Domain example/context: CreatePlayerForm --[submits]--> useCreatePlayer

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### transitions

ID: DS-D8:transitions · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/7; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Event","target":"State Machine","scope":["same-feature","cross-feature"],"multiplicity":"many_to_many"}
```

Plain language: An event advances a state machine.

Domain example/context: PaymentCompleted --[transitions]--> PaymentStatus

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### triggers-cross

ID: DS-D8:triggers-cross · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/4; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Event","target":"Operation","scope":["cross-feature"],"multiplicity":"many_to_many"}
```

Plain language: An event in one feature activates an operation in another feature.

Domain example/context: PaymentCompleted --[triggers-cross]--> ScheduleShipment

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### wraps

ID: DS-D8:wraps · reuse · owner: DomainSpec definitions-governance (DS-D8 source owner)

Consumers: DSR-008, DSR-010, DSR-031

Source: [definitions/relationships/relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml) — selector /signatures/18; SHA-256 82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1.

Formal / exact contract:

```text
{"source":"Layout","target":"Page","scope":["ui"],"multiplicity":"one_to_many"}
```

Plain language: A layout wraps pages.

Domain example/context: DashboardLayout --[wraps]--> /players

Boundary: Exact root signature reused, not a new verb or numeric profile. UI and mixed signatures are context, not v1 backend release admission.

### Business responsibility

ID: DSR-C-BUSINESS-RESPONSIBILITY · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-008, DSR-026, DSR-028

Formal / exact contract:

```text
responsibilityOwner, custodyOwner, lifecycleOwner, writer and executor are distinct coordinates
```

Normative: Business responsibility identifies the accountable meaning of a modeled role or action. It is not a database location, runtime worker, access permission or ownership dimension unless the relevant separately owned contract says so.

Plain language: The party accountable for an Order is not automatically its database, worker or authorized caller.

Domain example/context: A warehouse may have custody while a commerce service owns authorized state changes; a retry worker gains neither simply by running.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Independent cardinality axes

ID: DSR-C-CARDINALITY-AXES · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-008, DSR-009, DSR-010, DSR-017

Formal / exact contract:

```text
field_count != concept_degree != declared_occurrence_count != runtime_execution_count; no equality is inferred
```

Normative: Field collection size, distinct graph endpoint degree, declared step count, Mapping role count and runtime execution count are separate quantities. Closure, feature placement, representation and numeric bounds also remain separate. Compatibility labels alone do not supply bounds.

Plain language: A list field, two workflow steps and two operation executions count different things.

Domain example/context: A Workflow can bind the same Operation in two named steps: one distinct target concept, two declared steps and any evidenced runtime count.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Data shape

ID: DSR-C-DATA-SHAPE · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-009, DSR-028

Formal / exact contract:

```text
shape: fields(name,type) | alternatives(tag,payload); domain criterion is independently required
```

Normative: A data shape declares a finite typed field product or typed alternative structure used to carry values. It does not establish domain identity, value equality, lifecycle, table membership or effect authority.

Plain language: A record describes what data looks like, not what business concept it is.

Domain example/context: Order and OrderSummary may both serialize as records; only the declared Order identity determines Entity sameness.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Declarative behavior composition

ID: DSR-C-DECLARATIVE-COMPOSITION · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-007, DSR-011, DSR-021

Formal / exact contract:

```text
composition = participants + valueBindings + guardRefs + lifecycleBindings + effectBindings + dependencyConstraints
```

Normative: Behavior composition declares participating capabilities, explicit values, guards, transitions, effects and dependencies. It preserves each capability's responsibility rather than making users author a procedural query/set/save script. Lowering requires a separately selected executable contract.

Plain language: Say what behavior consists of and how its parts relate; the selected compiler owns the execution form.

Domain example/context: SubmitOrder reads Order, is enforced by OrderCanBeSubmitted, uses OrderTotal and produces OrderSubmitted; these declarations do not claim current executable support.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Domain model

ID: DSR-C-DOMAIN-MODEL · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-009, DSR-018, DSR-028

Formal / exact contract:

```text
classification(concept) is justified by semantic criterion, not emitted shape
```

Normative: A domain model distinguishes identity-bearing objects, value equality, closed choices, behaviors, lifecycle and public boundaries before choosing their code or storage representation.

Plain language: Having fields does not make every concept a record.

Domain example/context: Order is an Entity; Money is a Value Object; OrderStatus is an Enum; OrderTotal is a Calculation.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Domain-to-storage realization boundary

ID: DSR-C-DOMAIN-STORAGE-BOUNDARY · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-028

Formal / exact contract:

```text
domainMeaning -> logicalPhysicalMapping -> selectedAdapter; persistenceEvidence != transactionEvidence
```

Normative: Domain identity, equality, field composition and behavior are declared independently of physical schemas. Persistence and transaction guarantees require their own exact bindings; Entity does not entail one table and a reference does not entail an enforced foreign key.

Plain language: Choose what Order means first, then how a particular database stores it.

Domain example/context: An Order with Money and line references may span tables or documents; no choice follows from its Entity label.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Evidence-bound product promise

ID: DSR-C-EVIDENCE-BOUND-PROMISE · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-003, DSR-030, DSR-038

Formal / exact contract:

```text
promise = (consumer,outcome,scope,evidenceRequirements); seven state axes are not implications
```

Normative: A product promise names its consumer, requested outcome, selected scope and exact evidence needed for acceptance. Authored, canonical, implemented, tested, accepted, packaged and published remain independent states.

Plain language: Generated files, passing checks and product approval answer different questions.

Domain example/context: A packaged untyped Query can exist while its promised filtering behavior remains unsupported or untested.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Entity identity field reference

ID: DSR-C-FIELD-REFERENCE · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-009, DSR-028

Formal / exact contract:

```text
reference(E.f) requires Entity(E) and declaredIdentityField(E,f); composite identity needs a separately specified complete binding
```

Normative: An identity field reference names an Entity and an identity field declared on it, preserving target identity rather than embedding that Entity's complete value. Neither storage foreign keys nor owns, belongs-to or contains edges follow automatically.

Plain language: Pointing to Order.id means referring to an Order, not storing a nested Order or claiming ownership.

Domain example/context: Shipment.order refers to Order.id; a storage profile may realize it as a foreign key, but the arrow alone does not create one.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Versioned formalization binding

ID: DSR-C-FORMALIZATION-BINDING · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-005, DSR-022, DSR-023

Formal / exact contract:

```text
binding = (carrierVersion,logicFragment,vocabularyDigest,apiVersion,providerVersion,conversionEvidence)
```

Normative: A formalization binding identifies carrier version, logic fragment, API/provider version, vocabulary and semantics-preserving conversion evidence separately. No newer label silently upgrades old SFOL bytes and no old example replaces unadopted recovered work.

Plain language: Say exactly which formal language and conversion were tested.

Domain example/context: Current TDE SFOL/v2 evidence, historical v3 recovery and unadopted FormalClaim v4 design remain three different states.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Candidate ontology projection

ID: DSR-C-ONTOLOGY-PROJECTION · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-006, DSR-007

Formal / exact contract:

```text
meaning(node) resolves to exact definition; reviewLink != DS-D8 edge; authorityEffect = none
```

Normative: The reconciliation ontology classifies and links definition-backed concepts for review. Its labels and review links cannot redefine canonical meanings, add DomainSpec types or relationships, certify proof truth, select providers or authorize effects.

Plain language: The ontology is a map of the definitions, not another authority that changes them.

Domain example/context: A data-shape node helps explain Order representation without turning Entity into a record metatype.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Reconciled DomainSpec product

ID: DSR-C-PRODUCT · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-007, DSR-035, DSR-042

Formal / exact contract:

```text
promise -> meaning -> graph -> code -> observed behavior -> exact package; every arrow requires an evidence binding
```

Normative: A supported product promise must retain its meaning through authored concepts, checked graph, selected compiler profile, generated code, observed behavior and exact package. A gap remains work until proved or explicitly removed from scope by its owner.

Plain language: Users describe business intent once and can trace what the delivered code does.

Domain example/context: An Order rule keeps its identity through Alch authoring, DomainSpec validation and generated target tests.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Rule-referencing policy authoring profile

ID: DSR-C-RULE-BASED-POLICY · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-015

Formal / exact contract:

```text
branch = (ruleRef,factBindings,targetRef); select(branches,facts) returns target identity, not an execution receipt
```

Normative: In the proposed Alch authoring profile, a Policy's branch conditions refer to declared Rules with explicit facts and select declared Operation or Calculation targets. Selection is distinct from execution; this does not change DS-D1.8 or admit Policy-to-Rule as a DS-D8 edge.

Plain language: Reuse business rules when choosing a strategy; do not hide a second rule language inside Policy.

Domain example/context: PreferredCustomer selects DiscountCalculation. Existing typed inline BackendPredicate policies require an explicit compatibility disposition before migration.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Transition trigger and emitted effect

ID: DSR-C-TRANSITION-ROLES · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-016

Formal / exact contract:

```text
transition = (sourceState, triggerRef, guardRefs, targetState, effectRefs); triggerRef and effectRefs are independent roles
```

Normative: A transition's triggering Event is the incoming fact that makes a lifecycle step eligible; an emitted Event is an outgoing consequence. Binding one does not bind the other, even when a particular model chooses the same Event identity.

Plain language: What starts a state change is different from what it announces.

Domain example/context: PaymentReceived may trigger Order's paid transition, which may announce OrderPaid; one is not substituted for the other.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Field type expression

ID: DSR-C-TYPE-EXPRESSION · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-009

Formal / exact contract:

```text
T := scalar(S) | reference(TypeId) | optional(T) | list(T) | set(T) | sum(tag:T,...); descriptive notation, not admitted grammar
```

Normative: A field type expression combines scalar domains, references to declared types, optionality, ordered lists, uniqueness-constrained sets and tagged alternatives. Each constructor retains its own meaning; this candidate does not choose Alch keywords or extend Enum to payload variants.

Plain language: A field can hold a value, a collection, an optional value, or one of several explicitly tagged alternatives.

Domain example/context: PaymentAuthorization can be a value-equal sum of approved(code) and declined(reason); its name alone cannot classify it.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Explicit value flow

ID: DSR-C-VALUE-FLOW · propose · owner: DomainSpec meaning owner (role; person not assigned)

Consumers: DSR-011, DSR-014

Formal / exact contract:

```text
bind(producer.output, consumer.input) requires type compatibility and explicit provenance; edge admission is a separate predicate
```

Normative: A value-flow binding connects a declared output value to a compatible declared input at a composition boundary. It is neither a new canonical DS-D8 relationship nor an implicit execution order or permission to read state.

Plain language: Pass the calculated total into the mapper visibly.

Domain example/context: OrderTotal supplies total to OrderToSummary(order,total); the Mapping does not secretly query or calculate it.

Boundary: Candidate reconciliation meaning only; no canonical replacement, syntax admission, product implementation or effect authority.

### Exact candidate admission

ID: DSR-OPEN-ADMISSION-OWNER · open · owner: DomainSpec product and meaning owners (roles; people not assigned)

Consumers: DSR-038, DSR-039

Who will admit which exact tested candidate and its selected compatibility and scope?

Role ownership is known; no person or digest-bound admission is assigned by this candidate-authoring request.

Stop condition: No dependent admission or implementation selection until this question is explicitly resolved.
Next action: Resolve through the named downstream work items with exact evidence and owner selection.

### Authoring and compatibility selection

ID: DSR-OPEN-AUTHORING-CONTRACT · open · owner: DomainSpec product and meaning owners (roles; people not assigned)

Consumers: DSR-009, DSR-011, DSR-015, DSR-016

Which exact field/reference, value-flow, Policy-rule and transition representation should become the supported authoring contract?

User direction is explicit; exact grammar and existing inline Policy compatibility have not been selected here.

Stop condition: No dependent admission or implementation selection until this question is explicitly resolved.
Next action: Resolve through the named downstream work items with exact evidence and owner selection.

### Recovered formalization epoch

ID: DSR-OPEN-FORMALIZATION-EPOCH · open · owner: DomainSpec product and meaning owners (roles; people not assigned)

Consumers: DSR-005, DSR-022, DSR-023

Which exact recovered or newly reconstructed SFOL/ FormalClaim bytes and conversion obligations should be selected?

DSR-005 recovery and DSR-022 reconciliation have not run. Do not invent a v3 receipt or substitute old SFOL.

Stop condition: No dependent admission or implementation selection until this question is explicitly resolved.
Next action: Resolve through the named downstream work items with exact evidence and owner selection.

## Open Questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) for exact owners, consequences and stop conditions. Existing reconciliation questions remain in ../DECISIONS.md.

