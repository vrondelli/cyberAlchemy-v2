---
node_type: research-findings
is_session: false
status: candidate
created: 2026-07-02
dispatch_id: 2026-07-02-r3-l2-first-class-precedent
---

# L2 First-Class Categories Cross-Domain Findings

## Answer

Other domains have absolutely thought about the boundary, but not under the
exact local phrase "first-class authority." The useful synthesis is:

> Recurrence is evidence. First-class authority begins when the candidate
> changes what a system can reject, require, compose, preserve, project, or
> route to an owner.

Category theory, applied categorical data modeling, formal methods, and
philosophy of language all supply tests; DomainSpec owns the authority move.
The prior dispatch already settled the broad rubric: DomainSpec relation
authority belongs in root definitions, and implementation files are projections.
This run adds the philosophy/linguistic and formal-methods reinforcement, then
checks the current post-R3 root relationship surface.

## What Was Already Settled

The earlier dispatch
`projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/`
already concluded that a DomainSpec relation becomes first-class only when it
names a stable distinction that changes root-owned validation, composition,
derivation, projection, or owner decisions. It also settled placement:
relationship authority belongs in root `definitions/relationships/`, while
implementation relationship docs are projections.

Current root authority confirms that the broad R3 implementation step has
advanced: `relationships.yml` is active, defines 31 signatures, and the root
human companion explicitly uses the wording "typed composable graph fragment"
rather than full category law. Root `relationships.md` says validators read
root `relationships.yml` directly.

## What This Run Adds

Category theory says a category is not just repeated arrows. It requires
objects, typed morphisms, identities, composition, closure, associativity, and
laws. The category-theory explorer's direct warning was that repetition is a
candidate signal, not a definition; broad repeated morphisms justify research,
but laws and preservation justify authority.

Applied categorical modeling says schema authority is what every valid model,
instance, migration, validator, or reasoner must preserve. Ologs, categorical
databases, CQL/FQL, RDF/OWL properties, path equations, and wiring diagrams all
distinguish schema law from derived query/view/documentation.

Formal methods add the primitive-vs-derived test: a primitive has formation,
use/elimination, equality/computation, satisfaction, transition, conformance, or
observable-behavior consequences. If it desugars to existing signatures without
changing admissibility, it is derived.

Philosophy and linguistics add the meaning-authority test: a term becomes
governing only when it has a stable concept, a place in a system of contrasts, a
bounded context, eligible speakers/owners, correction norms, operational
consequences, and a maintenance/promotion route.

## Promotion Rubric

A candidate can enter **evidence** when it recurs, appears in research, causes a
novice/use failure, creates implementation contradiction, or appears in another
tradition.

A candidate can enter **candidate status** when it has stable contrast,
examples/non-examples, typed endpoints, inverse/dual policy, downstream
obligation, and witnessed decision pressure.

A candidate becomes **root authority** only when the finite machine surface owns
its law: id, endpoint types, direction, multiplicity/order, feature scope,
inverse/generated-view policy, status, semantics, examples, non-examples,
validation obligations, composition behavior, and projection rule.

An **implementation projection** may render or consume the root relation, for
example `Source --[verb]--> Target`, but the notation is not authority.

A candidate remains **deferred residue** when it lacks a distinct witness,
validation consequence, law, or non-redundant contrast.

Tight form:

> A relationship is first-class only if removing it would change at least one
> reject/allow decision, derivation, projection, composition path, owner route,
> or generated artifact.

## Verdict Matrix

| candidate | owner / precedent | witnessed? | sound? | verdict |
| --- | --- | --- | --- | --- |
| First-class promotion rubric | DomainSpec-owned synthesis; external traditions supply tests, not the authority concept. | Yes: prior findings and this synthesis converge. | Yes if phrased as DomainSpec governance, not "category theory proves it." | **ACCEPT** |
| Root relationship authority | Already deployed in `definitions/relationships/`; supported by specification/institution-style separation of signature and projection. | Yes: root files are active and implementation is projection. | Yes. | **ALREADY DEPLOYED** |
| Typed composable graph fragment | Category theory and ACT support typed arrows/composition; root wording avoids category overclaim. | Yes: root uses this wording. | Yes. | **ALREADY DEPLOYED** |
| Full category language | Category theory owns this only with identities, composition, closure, associativity, path laws, and preservation. | No current validator consumes full category law. | Unsound as current L2 authority. | **REJECT FOR CURRENT R3/L2** |
| `owns` | DomainSpec root owns it; DDD/lifecycle/custody language supports it. | Narrow yes: root defines endpoints, generated inverse, examples, non-examples, validation obligations. | Conditional: needs observable ownership consequences beyond prose. | **ACTIVE, HARDEN** |
| `owned-by` | Root generated view; OWL inverse-property precedent supports explicit inverse policy. | Yes. | Sound as generated reverse navigation only. | **ACTIVE GENERATED VIEW** |
| `belongs-to` | DomainSpec root owns it; language/ontology precedent says inverse and property meanings must stay explicit. | Minimal yes: root blocks collapse into `owns^-1`. | Definitional risk: current meaning bundles membership, classification, and home assignment. | **ACTIVE, FLAGGED** |
| Workflow `orchestrates` | DomainSpec root. | Yes. | Sound for same-feature workflow. | **ALREADY DEPLOYED** |
| Saga `orchestrates` | DomainSpec root; saga literature supports compensation after partial execution. | Yes: root gives cross-feature scope and novice witness had Saga orphaning. | Conditional: duplicate `orchestrates` id and thin compensation law need hardening. | **ACTIVE, HARDEN** |
| `produces` / `emits` endpoint split | Formal signature/admissibility precedent; root endpoint policy owns it. | Yes: root rejects `Operation --[emits]--> Event` and novice handoff found the Operation card contradiction. | Sound. | **ALREADY DEPLOYED** |
| `depends-on` | Many possible owners: build graphs, package deps, proof deps, relation algebra; no single meaning without kind. | No R3 witness yet. | Underdefined. | **DEFER / KILL CURRENT PROMOTION** |
| Operation returns Value Object | Type/signature traditions own return type; edge behavior not proven. | No distinct edge witness. | Sound as operation signature property, not edge. | **DEFER** |
| Event payload/publisher composite | Event-modeling traditions exist; root already enforces endpoint split. | No distinct composite witness. | Residue until it changes validation beyond `produces`/`emits`. | **DEFER** |
| Category laws as future L2 | Category theory owns the law vocabulary. | Not yet in root validators. | Sound only when finite checks exist. | **RATIONALE / FUTURE CANDIDATE** |

## Attention Points

### 1. `belongs-to` Is The Riskiest Active Signature

`belongs-to` currently means membership, classification, or home assignment. The
non-vacuity gate accepts only the narrow fact that it is not the inverse of
`owns`; the definitional gate flags the broader definition as a basket.

Hardening options:

- split into `member-of`, `classified-as`, and `assigned-to`;
- or keep `belongs-to` as an umbrella but require `belonging_kind` with separate
  examples, non-examples, and validation consequences;
- or mark `belongs-to` provisional until fixtures prove the three senses share
  one law.

### 2. `owns` Needs Observable Consequences

`owns` survives, but "lifecycle, custody, or write responsibility" is still
prose-heavy. It should declare at least one observable consequence: lifecycle
authority, custody transfer, write authorization, deletion/retirement authority,
owner-routed promotion, transfer/delegation, or uniqueness of active owner.

### 3. Saga Needs Machine Identity And Laws

Root currently has two signatures with `id: orchestrates`, one for Workflow and
one for Saga. This is sound only if tooling keys signatures by full typed
signature, not by `id` alone.

Hardening options:

- declare identity key as `(id, source_type, target_type, feature_scope)`;
- or introduce unique ids such as `workflow-orchestrates` and
  `saga-orchestrates` with shared `verb: orchestrates`.

Saga also needs participant and compensation laws to stay first-class rather
than Workflow metadata. Minimum laws: participant set, ordered operations,
compensation mapping per operation, failure/residue behavior, temporal safety,
and cross-feature owner boundary.

### 4. Category Theory Should Stay A Generator Of Tests

Current R3 wording is correct: "typed composable graph fragment." Do not promote
"category" as authority language until identity arrows, legal composition,
closure, associativity, path equations, and preservation become finite root
validator obligations.

## Human And Machine View

Human notation remains good:

```text
Signature: Rule --[enforces]--> Operation
Instance:  MaxAmountRule --[enforces]--> ProcessPayment
```

But machine authority must stay structured:

```yaml
id: enforces
source_type: Rule
target_type: Operation
direction: canonical
multiplicity: many_to_many
feature_scope:
  - same-feature
  - cross-feature
inverse:
  kind: none
validation:
  violation_class: unconstructible-edge
  obligations:
    - reject_non_rule_source
    - reject_non_operation_target
composition:
  - operation_checks_rule_before_mutation
projection:
  markdown: "Rule --[enforces]--> Operation"
```

For inverse/navigation:

```text
Canonical: Entity --[owns]--> Entity
Generated:  Entity --[owned-by]--> Entity
Distinct:   Entity --[belongs-to]--> Entity
```

Do not let generated `owned-by` justify `belongs-to`, and do not let
`belongs-to` silently mean every Entity-to-Entity association.

## Final Result

R3 has enough for the core relation authority surface, but not for full category
laws. The current missing work is not more broad research; it is hardening the
active root surface:

1. decide whether `belongs-to` splits or gains a required `belonging_kind`;
2. make `owns` obligations observable;
3. fix/declare Saga signature identity so duplicate `orchestrates` rows cannot
   collapse;
4. make Saga participant/compensation obligations structural;
5. keep `depends-on`, Operation-returned Value Object, and Event payload/publisher
   composite as deferred residue until each gets a distinct reject/allow witness.

Close answer: yes, people have thought about this. The closest owners are not
one field but a stack: category theory for laws/preservation, applied categorical
modeling for schema-vs-derived status, formal methods for primitive-vs-derived
obligations, and philosophy/linguistics for meaning/use authority. DomainSpec's
own contribution is the governance boundary that turns those tests into root
authority, projections, and residue.
