---
title: CyberAlchemy v2 Governance Model
status: candidate-design
visibility: private
authority_effect: none
enforcement_effect: none
---

# Governance Model

## Purpose

This model describes governance without applying it. It keeps three questions
separate:

1. **Why and what must hold?** — Axiom and Invariant.
2. **Is a proposed rule still justified and proportionate?** — Evidence,
   Assessment, Governance Policy, and Owner Decision.
3. **What is actually authoritative and enforced?** — an exact owner-adopted
   Constitution and, only when separately selected, a Validator or Gate.

Authority scopes every object and relation. Governance Discipline stewards the
recurring assessment practice; it is not a step that can decide or enforce.

## Typed governance graph

```text
Axiom ──grounds──> Invariant
Invariant ──is operationalized by──> Governance Rule

Evidence ──supports──> Governance Assessment
Governance Assessment ──is evaluated under──> Governance Policy
Governance Policy ──recommends──> Owner Decision

Owner Decision ──may adopt an exact Rule or Policy into──> Constitution
Constitution ──authorizes and scopes──> Validator or Gate
Validator or Gate ──checks or acts on──> Governed Subject

Governance Discipline ──stewards──> evidence, assessment, and routing practice
Authority ──scopes──> every node and edge
```

This is a typed graph, not one mandatory linear workflow. A rule may remain a
candidate. An assessment may be `not_evaluable`. A policy may recommend no
change. An owner may decline adoption. A constitution may use validation mode
`none-yet`. Those are valid states, not missing permission to infer the next one.

## Vocabulary

| Term | Meaning here | DomainSpec v2 meta-type | Authority source |
| --- | --- | --- | --- |
| Governance Axiom | Foundational world or domain truth that explains why a family of constraints exists. | `DS-D1.1 Entity` | CAV2-D53 Definition |
| Governance Invariant | Condition the governed system must keep true. | `DS-D1.7 Rule` when expressed as a checkable predicate | CAV2-D54 Definition |
| Governance Rule | Candidate or adopted statement of what a matching subject must or must not do. | `DS-D1.7 Rule` | Source owner; not a new CAV2 authority kind |
| Governance Policy | Decision strategy for evaluating evidence and recommending keep, harden, simplify, merge, prune, or defer. | `DS-D1.8 Policy` | Source owner; recommendation is not a decision |
| Governance Evidence | Exact receipt or harm/risk reference used in an assessment; an occurrence is modeled separately as Governance Observation. | `DS-D1.1 Entity` | Evidence posture only |
| Governance Observation | Something governance-relevant that happened at a known time and subject. | `DS-D1.12 Event` | An event is not automatically harm or semantic change |
| Governance Assessment | No-effect evaluation of a rule's protection, harm basis, burden, and evidence gaps. | `DS-D1.1 Entity`; produced by `DS-D1.6 Calculation` | No decision or enforcement authority |
| Governance Decision | Exact owner choice about a proposed rule, policy, or adoption. | `DS-D1.1 Entity` referencing the owner decision | Decision authority remains external to the model |
| Governance Discipline | Recurring practice that gathers evidence, assesses fitness, and routes recommendations. | `DS-D1.9 Workflow`; its discipline card may be an `Entity` | CAV2-D50 Definition; candidate until separately promoted |
| Governance Constitution | Owner-adopted, selector-bound rulebook carrying exact rules and policies. | `DS-D1.1 Entity` containing `Rule` and `Policy` members | CAV2-D58 Definition; each artifact needs separate adoption |
| Governance Authority | Who or what may make each object or movement count, for which scope. | Separate authority axis or `DS-D1.1 Entity` reference | CAV2-D34 Definition |
| Governance Mode | Repository-owned effect mapping such as `unconfigured` or `observe_only`. | `DS-D1.3 Enum` | Local design only |
| Product Binding | Exact typed reference from governance meaning to a product-ontology node. | `DS-D1.2 Value Object` | Does not mutate product ontology or prove product effect |

The `Governance` prefix expresses the bounded context. It does not create a new
closed authority kind for each noun.

## Governance Rule kinds

`Governance Rule` is the common domain object. `rule_kind` explains what a rule
protects; it does not say whether the rule is active or enforced.

| Rule kind | Purpose | Required boundary |
| --- | --- | --- |
| `audit` | Require or inspect evidence, traceability, or accountability. | An audit finding is evidence, not a correctness verdict or owner decision. |
| `correctness` | Preserve a named semantic or behavioral Invariant. | Must name the subject, invariant, check, and claim ceiling. |
| `pattern_enforcement` | Require or reject a recurring structural/form pattern. | Must name selectors and examples/non-examples; preference alone is insufficient. |
| `integrity` | Bind exact bytes, identities, references, or provenance against unintended substitution. | A digest proves equality to selected bytes only; it is not semantic freshness or a lifecycle clock. |
| `lifecycle` | Constrain a named state transition such as candidate, adopted, active, or retired. | Currentness changes alone must not masquerade as semantic change. |
| `authority` | Restrict who may decide, adopt, promote, publish, or execute within a scope. | Evidence, validation, and context selection cannot supply missing authority. |
| `effect_boundary` | Guard destructive, external, publication, deployment, privacy, or irreversible effects. | Must name the effect and responsible owner; no broad implied permission. |

A rule may have one primary kind and secondary tags, but it must not acquire an
`enforces` effect from classification alone. Enforcement still requires an exact
owner adoption into a Constitution plus a selected Validator or Gate.

## Constitution scope

A CyberAlchemy v2 Constitution may govern only subjects named by its exact scope
and selectors, such as:

- artifacts;
- tasks and workflows;
- repository-owned agent actions;
- system operations and state transitions;
- validation surfaces; and
- authority movements.

It does not automatically govern external people, agents, repositories, hosts,
services, or systems. A candidate or context-loaded constitution is not active.
The candidate Stable Repository Constitution remains a candidate.

## Observe-only posture

This bundle contains no edge of the form:

```text
Governance Rule ──enforces──> Work Operation
```

No Governance Constitution is selected or adopted by this bundle. No Validator
or Gate is attached to ordinary work. An observer may later record a bounded
event without changing the command result, lifecycle, authority, files, owner
requests, or external state. Whole-repository observe-only coverage is not yet
proved because independent Git roots and external platform controls remain out
of scope.

## First model instance

The first vertical studies DomainSpec v1 Axiom A6 and Constitution rule C10 as
historical source evidence. It asks whether evidence still justifies the rule's
protection and burden. The reported seven refreshes are a motivating observation,
not yet a typed event corpus; therefore the current Governance Assessment is
`not_evaluable`.

The candidate refresh-churn measure must distinguish lifecycle or currentness
refreshes from semantic changes, owner decisions, and product redesign. Hashes
may bind exact evidence bytes or references, but must not act as a whole-repository
lifecycle clock or force unrelated refreshes.

## Authority and effect statement

The companion canonical repair promotes only the meaning of Constitution as
CAV2-D58 Definition authority. This governance model remains a private candidate
with `authority_effect: none` and `enforcement_effect: none`. It applies zero
governance rules, changes zero product-ontology records, and authorizes no
implementation, lifecycle transition, publication, deployment, or external
effect.
