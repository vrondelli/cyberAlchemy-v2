# AlchLang Initial Language

Status: private candidate human view. Authority effect: none.

> Model the world in which an agent may act instead of programming the agent
> directly.

AlchLang is the CyberAlchemy product language through which a responsible
domain owner describes bounded domain meaning before software or agents are
allowed to act in that domain. It keeps concepts, relationships, behavior,
ambiguity, provenance, ownership, and authority limits explicit.

This document is a derived view. The machine-readable sources remain:

- [ALCHLANG-INITIAL-LANGUAGE-DEFINITION-PACK.v1-candidate.json](ALCHLANG-INITIAL-LANGUAGE-DEFINITION-PACK.v1-candidate.json),
  SHA-256 `001454e3cfba9642024fb979900dcd352472eb849f50197c3502948d9eb26e0f`;
- [handled-definitions.json](handled-definitions.json), SHA-256
  `897290a4ff76978d610641d838311d0f3e1411c2b9ca4ce7a6c6e3d629bb2b18`.

If this view disagrees with those exact source bytes, the JSON sources win and
this view is stale.

## The language model

```text
AlchLang
└── defines a Governed Domain Description
    ├── contains Ontology Terms
    ├── contains Ontology Edges
    ├── contains Domain Rules
    ├── contains Domain States
    ├── contains Domain Transitions
    ├── contains Domain Events
    ├── contains Domain Actions
    ├── contains Domain Permissions
    ├── contains Domain Examples
    ├── preserves Open Domain Questions
    └── is bounded by Domain Authority Boundaries

Later implementation-bearing construction
└── must proceed under the reused CAV2-D65 invariant
```

A **Governed Domain Description** is the reviewable container for one bounded
domain. It says what exists, how things relate, what may happen, which rules
constrain behavior, what remains unknown, where the meaning came from, and who
may make each decision count.

## Initial terms

The initial vocabulary contains fourteen terms: ten proposed definitions,
three specializations of existing CyberAlchemy definitions, and one direct
reuse.

| Term | Define disposition | Meaning in AlchLang | Boundary |
| --- | --- | --- | --- |
| **AlchLang** | propose | The CyberAlchemy product language used by a domain owner to describe a world before software or agents act in it. | Not DomainSpec, a parser, prompt, agent, compiler, implementation, permission grant, or acceptance proof. |
| **Governed Domain Description** | propose | An owner-qualified, bounded and reviewable description of domain meaning, behavior, gaps, provenance, and authority. | Not unrestricted prose, an admitted ontology, DomainSpec project, generated system ontology, implementation, or acceptance decision. |
| **Ontology Term** | specialize `CAV2-D19` | One named domain concept with explicit meaning, aliases, context, sources, owner, disposition, and unresolved ambiguity. | Not automatically canonical, universal, a DomainSpec type, implementation class, or truth proof. |
| **Ontology Edge** | specialize `CAV2-D19` | One typed, directional, source-bound and owner-qualified relationship between two terms. | Not an untyped association, shared spelling, implementation dependency, generated edge, or reality proof. |
| **Domain Rule** | propose | A proposition stating what must, may, or must not be true, including scope, required facts, exceptions, and consequence. | Not code, a validator, an authority grant, or evidence of enforcement. |
| **Domain State** | propose | A meaningful condition occupied by a specified domain subject, with entry, persistence, and exit meaning. | Not a database flag, runtime process state, transition, event, or unevidenced claim about current reality. |
| **Domain Transition** | propose | An allowed directed change between states, with trigger, guards, authority boundary, resulting event, and prohibited alternatives explicit. | Not the requesting action, the resulting event, a runtime machine, or execution permission. |
| **Domain Event** | propose | An immutable, domain-significant occurrence stated as something that happened, with subject, facts, context, and provenance expectations. | Not a command, requested action, permission, mutable state, transport message, or emission evidence. |
| **Domain Action** | propose | An intentional operation a participant may try, with actors, subjects, inputs, preconditions, permission conditions, confirmations, outcomes, and authority boundary explicit. | Not an executable tool, command handler, API endpoint, permission grant, execution record, or effect authorization. |
| **Domain Permission** | propose | A descriptive condition under which an actor may attempt an action against a target within a stated scope. | Not `CAV2-D34` Authority, an access grant, authorization decision, credential, runtime enforcement, or execution evidence. |
| **Domain Example** | propose | A concrete positive, negative, boundary, or missing-information situation used to pressure-test shared interpretation. | Not a general rule, exhaustive test suite, fixture, proof, or permission to infer omitted facts. |
| **Open Domain Question** | propose | An unresolved or disputed piece of meaning with affected uses, decision owner, stop condition, and next action. | Not an answer, concealed defect, blocker for unrelated uses, or permission for a tool to choose. |
| **Domain Authority Boundary** | specialize `CAV2-D34` | The scope, owner, authority surface, governed object, operation, basis, effect, and challenge route for one domain matter. | Not truth, confidence, permission by itself, repository access, generated status, runtime enforcement, or implementation success. |
| **DomainSpec-governed construction invariant** | reuse `CAV2-D65` | The canonical construction order governing any later movement from reviewed meaning toward implementation. | Reused by reference; AlchLang does not redefine it or use it to manufacture construction authority. |

## Typed semantic edges

The candidate graph contains nineteen typed relationships:

| Source | Edge | Target |
| --- | --- | --- |
| AlchLang | `defines` | Governed Domain Description |
| Governed Domain Description | `contains` | Ontology Term |
| Governed Domain Description | `contains` | Ontology Edge |
| Governed Domain Description | `contains` | Domain Rule |
| Governed Domain Description | `contains` | Domain State |
| Governed Domain Description | `contains` | Domain Transition |
| Governed Domain Description | `contains` | Domain Event |
| Governed Domain Description | `contains` | Domain Action |
| Governed Domain Description | `contains` | Domain Permission |
| Governed Domain Description | `contains` | Domain Example |
| Governed Domain Description | `preserves` | Open Domain Question |
| Governed Domain Description | `bounded_by` | Domain Authority Boundary |
| Ontology Edge | `connects` | Ontology Term |
| Domain Transition | `changes` | Domain State |
| Domain Transition | `results_in` | Domain Event |
| Domain Rule | `constrains` | Domain Action |
| Domain Permission | `conditions` | Domain Action |
| Domain Action | `bounded_by` | Domain Authority Boundary |
| Governed Domain Description | `prepares_later_use_under` | DomainSpec-governed construction invariant |

These are business-semantic edges. Matching names do not imply DomainSpec
relationships, implementation dependencies, generated graph edges, or observed
facts.

## How a domain description may read

The following notation is illustrative only. It demonstrates the semantic
categories; it is not an AlchLang grammar, parser contract, or accepted source
format.

```text
domain CustomerApproval

term Customer
term RiskAssessment

edge Customer --has_current--> RiskAssessment

state Customer.pending
state Customer.approved
state Customer.rejected

transition Customer.pending -> Customer.approved
  when approval rule is satisfied
  results_in CustomerApproved

rule HighRiskCustomer
  a customer with riskScore <= 472 is considered high-risk

action ReleaseCredit
  allowed only when Customer is approved

permission CreditOperatorMayRelease
  requires human confirmation when Customer is high-risk

example BoundaryRiskScore
  riskScore = 472 is expected to be interpreted as high-risk

open_question RiskScoreProvenance
  which source is authoritative for the current riskScore?

authority_boundary CreditRelease
  names who may make the release decision count and within which scope
```

The example keeps several separations visible:

- a term is not a system type;
- an edge is not an implementation dependency;
- a rule is not its validator;
- a transition is not the action that requests it;
- an action is not an executable agent tool;
- a permission condition is not authority or authorization;
- an example may inform later tests but is not proof;
- an open question remains unresolved instead of being guessed away.

## Relationship to DomainSpec and D65

AlchLang owns product-facing domain expression. DomainSpec v2 remains a later
formal construction substrate. If adopted AlchLang meaning later moves toward
an implementation-bearing system, it must cross the `CAV2-D65` sequence:

```text
canonical definitions
  -> Product Capability
  -> capability-local business ontology
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and system ontology
  -> exact implementation binding
  -> conformance evidence
```

This view does not cross any of those gates. Similar labels do not select a
DomainSpec profile, compiler, CLI, agent tool, runtime, or implementation.

## Current open questions

1. **Digest-bound adoption:** will the Product and Language Project owners adopt
   the exact Definition Pack digest shown above?
2. **Central Define integration:** when will the central Define registry and
   validator support more than the Auth Foundation Pack without changing
   Invoke?
3. **DomainSpec handoff:** which exact DomainSpec project, profile, language
   epoch, and source set would consume adopted AlchLang meaning?

The first and third questions block promotion or construction. They do not
prevent review of this isolated candidate.

## Allowed use and claim ceiling

This view may be used to review and challenge the fourteen candidate meanings
and nineteen relationships. It may support owner review of the AlchLang
capability and Language Project.

It may not be treated as canonical or adopted meaning, used to infer a
realization, or used to authorize a construction handoff, system ontology,
implementation binding, publication, release, deployment, or external effect.
It does not alter Invoke or the central Auth registry.
