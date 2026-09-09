# Governance Domain Model

Status: perennial candidate. No authority or enforcement effect.
Owner: CyberAlchemy v2 governance-model owner.

In plain terms: this is a maintained explanation of the candidate domain
model. It is not the machine registry and grants no permission to act.

## Purpose

The domain model gives governance a vocabulary precise enough to distinguish
foundations, constraints, rules, policies, Constitutions, disciplines,
evidence, observations, evaluations, decisions, authority, adoption, and
enforcement. Those distinctions prevent a passing check or nearby owner record
from silently becoming permission.

Machine-readable authority-governance state remains in `nodes.json`,
`relations.json`, and `product-bindings.json`. The complementary business view
is in `product/nodes.json` and `product/relations.json`. Neither branch alone is
the whole Governance product. This document is stale if it disagrees with those
registries.

## Bounded Context

The `Governance` prefix names one bounded context inside the private Governance
module. It does not create a new canonical authority kind for every noun.

The authority-governance branch covers:

- why a constraint matters;
- what must remain true;
- how a rule operationalizes that condition;
- what evidence and observations exist;
- how rule fitness is assessed;
- what policy may recommend;
- which owner decision exists;
- what an exact Constitution contains;
- how authority scopes the graph; and
- how friction may be measured without becoming a gate.

The business branch adds the product's actors, problems, seven enduring
capabilities, outputs, outcomes, business rules, and balanced measures. Future
runtime and bridge ontologies will own executable components and enforcement
bindings rather than expanding this domain graph into an implementation model.

## Concepts

The principal concepts are:

| Concept | Meaning | Candidate DomainSpec v2 alignment |
| --- | --- | --- |
| Governance Axiom | Foundational domain truth explaining why constraints exist. | Entity |
| Governance Invariant | Checkable must-hold condition. | Rule |
| Governance Rule | Candidate or adopted statement about a matching subject. | Rule |
| Governance Rule Kind | Purpose classification such as audit, correctness, lifecycle, or authority. | Enum |
| Governance Evidence | Exact evidence record supporting an assessment. | Entity |
| Governance Observation | Past governance-relevant occurrence. | Event |
| Governance Assessment | No-effect evaluation of protection, evidence, burden, and gaps. | Entity |
| Assess Governance | Pure calculation producing an assessment. | Calculation |
| Governance Policy | Strategy for recommending keep, harden, simplify, merge, prune, or defer. | Policy |
| Governance Decision | Separately owned exact choice. | Entity |
| Governance Discipline | Authority artifact describing the recurring practice. | Entity |
| Run Governance Discipline | Workflow that coordinates the recurring practice. | Workflow |
| Governance Constitution | Exact owner-adopted and selector-bound rulebook. | Entity |
| Governance Authority | Holder, action, target, scope, conditions, and effect boundary. | Entity |
| Governance Mode | Repository posture such as `unconfigured` or `observe_only`. | Enum |
| Friction Metric Contract | Identity-bearing contract for a governance burden measure. | Entity |
| Product Binding | Exact value linking governance meaning to one product node. | Value Object |

The alignments are `candidate-semantic-alignment`. They do not prove generated
DomainSpec artifacts or runtime conformance.

## Relations

The model is a typed graph, not one mandatory stage sequence:

```text
Axiom --grounds--> Invariant
Invariant --is operationalized by--> Rule
Rule --is classified as--> Rule Kind
Rule --is observed by--> Observation

Evidence --supports--> Assessment
Assess Governance --produces--> Assessment
Assessment --is evaluated under--> Policy
Policy --may inform--> Decision

Decision --adopts exact--> Constitution
Constitution --contains rule--> Rule
Constitution --contains policy--> Policy

Discipline --is realized by--> Run Discipline
Run Discipline --coordinates--> Assess Governance
Rule --is scoped by--> Authority
Rule --is measured by--> Friction Metric Contract
```

Every relation names an owner route and carries `authority_effect: none` and
`enforcement_effect: none` in this candidate package.

## Governed Invariant Instances

`nodes.json` and `relations.json` define the reusable concept and relation
types. Concrete registrations remain in separate closed registries so a
canonical invariant is not mistaken for a new ontology type.

The first registration is `GOV-INV-CAV2-D64`, an ontology reference to the
active canonical `CAV2-D64` Recursive Instance Ownership Invariant.
`GOV-RULE-D64-BINDING-COMPLETE` is its candidate `authority`-kind review rule,
joined by the existing `is_operationalized_by` relation contract. The rule may
return only `satisfied`, `violated`, or `indeterminate` during review.

Canonical active status does not make the registration adopted. The invariant
has no source-owned semantic version ref, resolved Governance Axiom, adopted
Constitution member, enforcement binding, concrete Project binding evaluation,
kernel program, or runtime effect in this epoch. The Project package now owns a
closed binding registry and reference shape, but it contains zero bindings.
The remaining absences are preserved by `GOV-RES-008`.

## DomainSpec v2 Mappings

DomainSpec v2 meta-types are reused as a semantic vocabulary:

- Entity for identity-bearing governance objects;
- Value Object for equality-by-value product bindings;
- Enum for closed classifications or postures;
- Calculation for the no-effect assessment function;
- Rule for boolean must-hold conditions;
- Policy for recommendation strategy;
- Workflow for the multi-step discipline run; and
- Event for past observations.

These mappings do not move DomainSpec ownership into this module and do not
authorize code generation.

## Non-Collapse Rules

The model requires these separations:

- Axiom is not Invariant.
- Invariant is not Governance Rule.
- Evidence is not truth or authority.
- Observation is not automatically harm or semantic change.
- Assessment is not owner decision.
- Policy recommendation is not execution of its verb.
- Decision is not Constitution unless it binds one exact adopted artifact.
- Constitution membership is not activation.
- Authority is not inferred from ownership, participation, context, evidence,
  validation, or proximity.
- Discipline artifact is not the workflow that runs it.
- Product intent is not runtime realization.
- Package digest is not semantic identity or lifecycle state.

The forbidden edge remains:

```text
Governance Rule --enforces--> Work Operation
```

Enforcement belongs to a future runtime bridge with exact adoption,
applicability, authority, and binding evidence.

## Product Bindings

`product-bindings.json` connects selected domain meanings to the module-owned
business product ontology without importing its whole graph. Important
bindings include:

- the domain ontology to the Governance Product;
- the ontology to the validation-and-enforcement capability;
- Governance Rule to the product rules governing basis and enforcement
  eligibility;
- Governance Assessment to the Governance Evaluation output;
- Friction Metric Contract to Governance Refresh Churn; and
- the ontology to the intended Controlled Consequences outcome.

Bindings are candidate traceability. They do not add relations inside the
product ontology or prove a product capability.

## Open Residue

The current authority-branch residue includes:

- incomplete composition and executable-binding concepts needed to cover all
  seven business capabilities in the authority ontology;
- conflicting historical metric IDs and mappings;
- no durable typed corpus for the seven-refresh friction observation;
- incomplete proof of repository-wide observe-only posture;
- no system-runtime ontology or Rust realization; and
- no canonical activation state shared by all rule classes.

Residue is part of the model boundary. Missing work must not appear complete.

## Example

Example only: no rule is adopted and no publication action is affected.

A publication invariant grounds a Governance Rule. A Constitution may compose
that rule with a publication Policy for an exact scope. Evidence and
observations support a Governance Assessment; the Policy may inform a real
owner Decision. Only that separate Decision could adopt an exact Constitution.
Even then, enforcement still requires applicability, authority, an explicit
binding, and an accepted runtime integration.

## Claim Ceiling

This human view explains the candidate domain model. It does not redefine CAV2
or DomainSpec terms, prove semantic correctness, establish runtime conformance,
adopt a rule or Constitution, grant authority, activate enforcement, or prove a
product outcome.
