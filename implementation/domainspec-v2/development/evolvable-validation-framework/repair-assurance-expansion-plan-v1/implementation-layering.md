---
module: repair-assurance-expansion
version: v1
status: planning-candidate
updatedAt: 2026-09-12
docType: implementation-layering
authority_effect: none
---

# Implementation Layering: Repair Assurance Expansion

## Target and boundary

Target: a reusable property-to-repair assurance workflow that detects misleading
evidence and transfers from distributed-state consistency to one business-rule
implementation. The completed CRABS replay supplies inherited L0/L1 proof.

Layer value is the decision unlocked, visible outcome and risk reduced. Layer
cost is implementation time, verification time and coordination. Each promotion
requires the prior layer's evidence.

## Layer decision table

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 — qualified example (complete) | After this layer, we know whether the original defect and repair reproduce on exact inputs. | Fixed two-singleton CRABS comparison. | Property, source and patch binding; native and CBMC replay. | Larger state space and transfer. | Author attempt 003 and exact patch correspondence. | Already promoted to L1. |
| L1 — independent replay (complete) | After this layer, we know whether a separate reviewer can reproduce and interpret the result. | Frozen private replay package. | Independent run, raw evidence, correction loop. | Independent host and general behavior. | Reviewer attempt 002 and completion assessment. | Promote to L2 while preserving the freeze. |
| L2 — falsification and repair depth | After this layer, we know whether the workflow detects selected false-success paths and superficial repairs across the declared partial-knowledge experiment. | Repaired evidence mechanism plus one 48-native/48-sanitizer/two-CBMC attempt and mutation campaign. | R00-R09 mechanism repairs, exact assertion/case denominator, failure-path controls, implementation mutants and independent replay. | Arbitrary replicas, operations, IDs, unbounded proof and production migration. | Every declared case has a typed outcome; every selected negative control remains non-pass; reviewer reproduces the result. | Transfer, remediate, narrow or stop. |
| L3 — second implementation | After this layer, we know whether the assessment contract transfers to financial-settlement business rules without rewriting the evidence core. | Owner-confirmed C3 or P4 property bound to implementation, with counterexample search, existing mutation calibration and independent replay. | Exact source/consumer binding, four current cases, eight current mutations, conditional repair and measured effort. | Full settlement coverage, unapproved clauses, release admission and customer systems. | Domain owner accepts property meaning; reviewer reproduces typed result; shared/core versus adapter effort is measured. | Package service, narrow transfer claim or remediate core. |
| L4 — commercial-service candidate | After this layer, we know whether the deliverable and measured delivery cost are credible enough to propose one bounded pilot. | Private service definition and sample report assembled from L2/L3 evidence. | Scope contract, intake, evidence manifest, claim language, data handling questions, effort/compute/retest measurements and pilot acceptance template. | Customer contact, certification, public claims, price commitment, SLA and deployment. | Product owner reviews offer boundary; unit economics use observed work; pilot prerequisites are explicit. | Seek separate pilot decision or defer. |

## Non-regression guardrails

- Preserve the completed CRABS freeze and its explicit claim ceiling.
- A missing, malformed, timed-out, contradictory or incomplete observation never
  becomes a pass.
- Mutation detection calibrates the assessment; it does not prove all natural
  defects will be found.
- L3 retains domain-specific assumptions and labels manual versus TDE-derived
  properties accurately.
- Later layers grant no admission, certification, publication or deployment.

## Recommended next layer

Next layer: L2. First audit the current R00-R09 state and remove the obsolete
Task Session gate under exact owner-directed native execution, then complete
the remaining implementation detail and freeze before any live 48-case or
mutation evidence.

## Open Questions

See [WORK-PACK.md](WORK-PACK.md#blockers-and-open-questions).
