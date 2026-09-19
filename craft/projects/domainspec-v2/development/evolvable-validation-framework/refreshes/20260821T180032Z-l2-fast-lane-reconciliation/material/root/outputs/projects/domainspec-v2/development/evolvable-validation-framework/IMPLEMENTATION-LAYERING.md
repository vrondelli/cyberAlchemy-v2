---
module: graph-composability-evidence-spine
version: current
status: candidate-local-l2-reachability-validated-with-flags
updatedAt: 2026-08-21
docType: implementation-layering
---

# Implementation Layering: Graph Composability Evidence Spine

## Purpose

Use evidence to decide when a narrow graph proof may expand into a reusable
engine and then into the broad backend completeness lane.

## Source Contract

- Define: [DEFINE.md](DEFINE.md)
- Design: [DESIGN.md](DESIGN.md)
- Research findings: [findings.md](../../research/evolvable-validation-framework/findings.md)
- Related broad plan: [backend-type-test-engine-completeness/PLAN.md](../first-production-release/backend-type-test-engine-completeness/PLAN.md)

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Included scope | Deferred scope | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, do we know whether one composed edge can yield a trustworthy executable receipt? | `SWU-GCP-001`, one `enforces` edge | key-and-door source, normalized graph, structural check, obligation, binding, test, evaluator, receipt, negative mutation | all other signatures and graph laws | positive/negative receipts with stable digests | continue only if both verdicts are honest and replayable |
| L0C | After L0, can a real private application consume the exact proof without semantic drift or authority collapse? | external `SWU-IOLM-DSC-A` | exact L0 handles, IOLM identity/provenance checks, semantic/view invariance, parity, consumer receipt | BTE breadth rerun, full UI/pilot, authority rebind | fresh independent IOLM narrow-consumer receipt | record the combined claim, repair the consumer, or keep only the valid L0 result |
| L1 | After this layer, do we know whether the path is repeatable across another admitted slice? | second fixture or profile adapter | same contracts and independent denominator check | full 13-kind breadth | replay comparison and no hidden skips | harden or narrow |
| L2 | After this layer, do we know whether one graph-level law can be evaluated without collapsing into a local check? | exact-instance reachability evaluator | provider-neutral facts, Souffle query, Alloy model, typed receipts, non-inflating join | cycle, closure, additional properties, unbounded solving | C0-C3 PASS plus independent closure FLAG with zero blockers | preserve the bounded result; expand only through a new property contract |
| L3 | After this layer, do we know whether broad backend completeness and consumer integration are credible? | handoff to the current BTE lane | owner-ratified kinds/signatures, mutation and IOLM/Body War/Craft evidence | release promotion | exact denominator and consumer receipts | package or defer |

## Boundary Rule

After each layer, record the decision unlocked and retain every earlier receipt.
Later scope must not silently alter the proof boundary of L0.

L0C is a sibling consumer lane, not an L1 entry gate. IOLM substrate or
cross-feature-support blockers may delay the combined application claim, but
they do not change the L0 verdict or prevent independent L1 core work. The later
IOLM breadth rerun belongs to L3 and requires a fresh BTE core handle.

## Recommended Next Layer

- Current evidence: **L0 and L1 PASS candidate-locally; L2 selected
  reachability PASS with closure FLAG and zero blockers**.
- Next layer: **L3 planning, design-gated**.
- Required decision: ratify the live 17-signature denominator and the corpus
  coverage boundary, including `creates`; the previous 16-signature wording is
  stale and is not silently promoted.
- Major deferred scope: L2 cycle/closure properties, broad consumer evidence,
  authority, release, deployment, and production.
