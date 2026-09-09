---
title: Governance Model glossary consistency
status: candidate-review
authority_effect: none
---

# Glossary Consistency

## Reused canonical terms

| Term | Owner | Use here |
| --- | --- | --- |
| Authority | CAV2-D34 | Scopes who or what may make each node or movement count. |
| Discipline | CAV2-D50 | Recurring practice that stewards evidence, assessment, and routing; cannot author a Constitution. |
| Axiom | CAV2-D53 | Foundational why; the system is built around it. |
| Invariant | CAV2-D54 | Must-hold condition on system behavior. |
| Constitution | CAV2-D58 | Owner-adopted, selector-bound rulebook for named governed subjects. |
| Gate | CAV2-D37 | Transition or enforcement check selected outside an Assessment. |
| Authority Model | CAV2-D41 | Owner and movement map. |
| Authority Promotion Lifecycle | CAV2-D48 | Separate path for earning authority. |
| Closed Authority-Kind Enumeration | CAV2-D49 | Prevents local model records from becoming authority kinds by naming alone. |
| Evidence | CAV2 Authority Model | Supports a decision but is not the decision. |
| Residue | CAV2 Authority Model | Preserves unresolved issues without making them defects or authority. |

## Model vocabulary

These deliberately simple names belong to this candidate model. They do not add
new rows to the closed CAV2 authority-kind enumeration.

| Term | Working meaning | DomainSpec v2 mapping | Collision guard |
| --- | --- | --- | --- |
| Governance Rule | Candidate or adopted statement of what a matching subject must or must not do. | `DS-D1.7 Rule` | A candidate/reference is not active authority. |
| Governance Rule Kind | `audit`, `correctness`, `pattern_enforcement`, `integrity`, `lifecycle`, `authority`, or `effect_boundary`. | `DS-D1.3 Enum` | Classification does not imply adoption or enforcement. |
| Governance Policy | Strategy for evaluating evidence and recommending keep, harden, simplify, merge, prune, or defer. | `DS-D1.8 Policy` | Recommendation is not an Owner Decision. |
| Governance Evidence / Observation | Exact receipt or harm/risk reference / something that occurred. | `DS-D1.1 Entity` / `DS-D1.12 Event` | Evidence is not truth or authority; an event is not automatically harm. |
| Governance Assessment | No-effect evaluation of protection, harm basis, burden, and gaps. | `DS-D1.1 Entity`, produced by `DS-D1.6 Calculation` | Not a gate verdict, correctness proof, or lifecycle transition. |
| Governance Decision | Exact separately owned decision about a rule, policy, or adoption. | `DS-D1.1 Entity` | Remains absent until the owner decides. |
| Governance Discipline | Recurring assessment and routing practice. | `DS-D1.9 Workflow` | Cannot define, adopt, or enforce. |
| Governance Constitution | Exact rulebook instance carrying owner-adopted rules and policies. | `DS-D1.1 Entity` containing `Rule` and `Policy` | Candidate, selected, or context-loaded is not active. |
| Governance Authority | Authority envelope for each object and edge. | Separate axis / `Entity` | Not the final step in a lifecycle. |
| Governance Mode | Effect mapping for repository-owned governance adapters. | `DS-D1.3 Enum` | This design permits only `unconfigured` and `observe_only`. |
| Product Binding | Exact typed reference to a product-ontology node. | `DS-D1.2 Value Object` | Does not mutate product ontology or prove product effect. |
| Friction Metric Contract | Full semantic boundary for one governance-burden measure. | `DS-D1.2 Value Object` | Not a KPI, threshold, trigger, or raw count. |

## Drift guards

- `Correctness` is never an unbounded result. Any assurance claim must name its
  subject, invariant, evidence class, and claim ceiling.
- DomainSpec v1 metric IDs are not reused because their meanings conflict across
  sources.
- `CAV2-D34` remains Authority. `CAV2-D58` now owns Constitution.
- The governance model has no `Governance Rule -> enforces -> Work Operation`
  relation and no adopted Constitution or selected Validator/Gate.
- Hashes bind exact evidence bytes or selected references only. They are not a
  whole-repository lifecycle clock.

## Definitions Governance summary

- Definitions updated: `CAV2-D58` Constitution promoted; D53/D54 references repaired
- Index synced: yes
- Documentary schema synced: `CAV2-D58-SCHEMA`
- Drift resolved: D34 Constitution identity collision
- Canonical source: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
- Authority ceiling: Definition authority changed; no Constitution artifact or governance rule activated

## Open questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
