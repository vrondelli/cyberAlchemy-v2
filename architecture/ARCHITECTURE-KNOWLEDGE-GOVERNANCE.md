# Architecture Knowledge Governance

Status: candidate architecture interface
Owner: CyberAlchemy v2 architecture route
Authority model: [../authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md)
Definitions:
[CAV2-D42 governed artifact tree](../authority/definitions/DEFINITIONS.md#cav2-d42-governed-artifact-tree),
[CAV2-D43 pattern promotion lifecycle](../authority/definitions/DEFINITIONS.md#cav2-d43-pattern-promotion-lifecycle),
[CAV2-D44 view-bearing concept](../authority/definitions/DEFINITIONS.md#cav2-d44-view-bearing-concept)
Constitution:
[CAV2-C14 governed artifact tree interface](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c14-governed-artifact-tree-interface)

## Purpose

This document defines how architecture knowledge moves from operational
evidence into reusable architecture pattern candidates without letting the
pattern inventory become authority by itself.

`architecture-pattern-inventory` is the architecture-view governance interface.
It produces inspectable architecture knowledge: concept cards, relationship
cards, dependency rules, testing alignment, observability alignment, and pattern
candidates. CyberAlchemy authority owners decide whether any candidate becomes
an authority-bearing architecture pattern, invariant, constitution pressure, or
implementation constraint.

## Core Guardrail

```text
has a tree != has authority
```

The tree makes the concept inspectable. Evidence and owner promotion make it
authoritative.

## Architecture-View Role

Architecture knowledge is one governed view over the wider ontology of project
knowledge. It asks:

- what works structurally;
- which concepts recur;
- which dependencies are allowed or forbidden;
- how a concept is tested;
- which signals observe it;
- where reuse is safe;
- where a candidate is still local, disputed, or under-evidenced.

Architecture view does not answer:

- whether a term is a canonical definition;
- whether a rule is a constitution;
- whether a candidate is public-safe;
- whether an implementation must change;
- whether an ontology node or pattern card is authority.

Those decisions route to the relevant owner.

## Pattern Promotion Lifecycle

Architecture-pattern-inventory should record this lifecycle explicitly:

```text
operational/code/spec hypothesis
  -> exercised in domain
  -> evidence set
  -> localized concept
  -> generalized abstraction
  -> pattern candidate
  -> exercised in another context
  -> challenge review
  -> owner promotion
  -> CAV2 architecture pattern authority
     -> invariant or constitution pressure when justified
     -> separate version-exact adoption by each consuming domain
```

Operations are therefore not "just execution." They are an evidence engine for
knowledge promotion. A production result, test run, UX lesson, spec exercise, or
observability signal can raise the evidence confidence of a concept, but it
does not promote the concept by itself.

Successful exercise in another context is still evidence, not promotion. CAV2
promotion creates one named CAV2 version; it does not alter the source domain or
adopt that version for another domain.

## Governance Interface Fields

Every load-bearing architecture tree, package, or view-bearing concept must
declare:

| Field | Purpose |
| --- | --- |
| `origin_owner` | The domain owner whose local object or hypothesis supplied the candidate. |
| `origin_version` | The exact source version; CAV2 review must not silently rewrite it. |
| `owner_route` | Who can decide mutation, promotion, challenge resolution, or drift. |
| `canonical_source` | The source of record, or the boundary saying no source is canonical yet. |
| `view_roles` | Meaning, system, run, residue/challenge, promotion, or architecture. |
| `evidence_inputs` | Source refs, tests, operations, observability, UX lessons, specs, or prior patterns. |
| `promotion_path` | How candidates move to definitions, constitutions, patterns, specs, or implementation. |
| `validation_surface` | Tests, lint, schema, review gate, observation, or proof handle. |
| `challenge_contract` | How to contest the card, relation, dependency rule, or pattern candidate. |
| `drift_route` | Who handles stale evidence, broken dependencies, or obsolete patterns. |
| `allowed_use` | What downstream work may rely on before promotion. |
| `blocked_use` | What the tree, card, or view must not decide. |
| `generalization_delta` | What the CAV2 abstraction changes, omits, or leaves as residue relative to the source. |
| `cross_context_exercise` | The independently owned or materially distinct context, evidence, counterevidence, and result. |
| `promoted_version` | The promoted CAV2 version, or `none` while the object remains a candidate. |

## Architecture Pattern Candidate Shape

```yaml
pattern_candidate_id:
label:
origin_owner:
origin_version:
source_hypothesis:
domain_exercise:
evidence_set:
localized_concept:
generalized_abstraction:
generalization_delta:
concept_cards:
relationship_cards:
dependency_rules:
testing_alignment:
observability_alignment:
cross_context_exercise:
known_counterexamples:
challenge_contract:
owner_route:
promotion_request:
promoted_version:
current_authority_posture:
allowed_use:
blocked_use:
residue:
```

This is an interface shape, not a live schema. A future schema amendment witness
is required before this becomes machine-enforced.

## Relationship To Ontology Views

Ontology is a set of governed views over knowledge. Architecture contributes
one of those views.

| View | Question | Architecture relationship |
| --- | --- | --- |
| Meaning view | What does this mean? | Pattern terms must cite definitions or carry definition residue. |
| System/architecture view | How does it work structurally? | Architecture-pattern-inventory owns this interface. |
| Run view | What happened in operation? | Tests, production traces, UX sessions, and task receipts feed evidence. |
| Residue/challenge view | What failed, contradicted, or remains open? | Pattern candidates must carry counterexamples and challenge contracts. |
| Promotion view | What can become authority? | Owner routes decide promotions, not the view. |

## Owner Routing

| Candidate movement | Owner route |
| --- | --- |
| Architecture evidence -> pattern candidate | architecture-pattern-inventory |
| Pattern candidate -> architecture authority | CyberAlchemy authority model plus architecture owner |
| Pattern candidate -> definition | definitions-governance |
| Pattern candidate -> constitution or invariant pressure | constitution-governance |
| Pattern candidate -> discipline | discipline-governance |
| Pattern candidate -> implementation work | invoke/task-session after owner gates |
| Schema or machine-view change | schema governance plus schema amendment witness |
| Challenge or contradiction | owner route named by the challenge contract |

## Non-Authority Rules

The following do not promote architecture knowledge:

- storing a card in architecture-pattern-inventory;
- naming a pattern candidate;
- adding a dependency rule as observation;
- reusing code successfully in one place;
- showing a concept in an ontology view;
- adding a concept to an architecture tree;
- passing tests that do not name the pattern claim they support.

## Execution Guidance

When working architecture knowledge, use this sequence:

1. Capture the operational/code/spec hypothesis.
2. Record source refs and domain exercise.
3. Build or update concept and relationship cards.
4. Attach dependency, testing, and observability alignment.
5. Label the candidate's lifecycle posture with
   [CAV2-D23](../authority/definitions/DEFINITIONS.md#cav2-d23-authority-lifecycle-axis).
6. Apply
   [CAV2-D38](../authority/definitions/DEFINITIONS.md#cav2-d38-claim-proof-bound):
   do not claim more than the evidence supports.
7. Add the
   [CAV2-D40](../authority/definitions/DEFINITIONS.md#cav2-d40-challenge-contract).
8. Route promotion through the relevant owner.

## Open Work

- Build the first CAV2 architecture-pattern-inventory package under this
  architecture route.
- Decide whether the architecture pattern candidate shape should become a
  machine-checkable schema.
- Run at least one cross-context pattern promotion example before treating any
  architecture pattern as authority.
- Add inventory evidence cards for the first real architecture-view run.
