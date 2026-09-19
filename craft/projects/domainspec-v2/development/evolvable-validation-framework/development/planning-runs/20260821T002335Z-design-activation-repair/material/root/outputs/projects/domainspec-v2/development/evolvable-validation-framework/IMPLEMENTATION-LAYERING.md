---
module: graph-composability-evidence-spine
version: post-l0-l1-proposal
status: proposal-awaiting-independent-review
updatedAt: 2026-08-20
docType: implementation-layering
authorityEffect: none
---

# Implementation Layering: EVF Evidence Spine

## Purpose

Preserve the candidate-local L0 proof while deciding whether its causal path is
repeatable across two distinct, owner-selected Financial Settlement Rule slices.
Only after composite L1 closure may the separately accepted graph-law provider
direction seek admission.

## Source Contract

- [DEFINE.md](DEFINE.md)
- [DESIGN.md](DESIGN.md)
- [PLAN.md](PLAN.md)
- L0 receipt:
  `evidence/SWU-GCP-001/attempt-001/validation-receipt.json`
- L1 scope decision:
  `development/planning-runs/20260820T173249Z-post-l0-l1-plan/decision/DEC-GCP-004-l1-repeatability-slice.md`
- R4 semantic decision:
  `development/planning-runs/20260820T173249Z-post-l0-l1-plan/decision/DEC-GCP-005-r4-proof-contract.md`
- Future L2 provider decision:
  `decisions/2026-08-20-l2-first-evaluator.md`

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Included scope | Deferred scope | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, do we know whether one `enforces` edge can traverse graph, obligation, binding, execution, mutation, and receipt boundaries? | `SWU-GCP-001` key-door proof | one candidate-local vertical slice | lifecycle/release admission; other slices | immutable PASS receipt, 16/16 mutants, explicit claim ceiling | evidence retained; lifecycle remains unreconciled |
| L0C | Can a private application consume the exact L0 handle without semantic drift? | external IOLM slice | consumer identity and parity | breadth/release | independent consumer receipt | sibling lane; not an L1 gate |
| L1 | After this layer, do we know whether the path repeats over two distinct real Rule slices without identity or claim collapse? | serialized `SWU-GCP-002-P4` then `SWU-GCP-003-R4` | additive source/graph reconciliation, strict P4 effect, isolated R4 decision, composite digest join | P4 converses, R5, P3, full Financial Settlement, general graph laws | two independent receipts and one non-inflating composite receipt over one frozen graph/source digest | open L2 only if both pass and a separate gate admits it |
| L2 | Can graph-level laws be evaluated through provider-neutral contracts without collapsing exact-corpus and bounded-model claims? | C0 contract/extractor, C1 Datalog, C2 Alloy, C3 join | property-specific shared facts and bounded receipts | TLC, Cedar, unbounded solving, policy evaluation | provider receipts plus non-inflating join | blocked until L1 and provider/tool admission |
| L3 | Is breadth and consumer packaging credible? | BTE/consumer handoff | declared kinds/signatures and fresh consumer evidence | release promotion | denominator, mutation, and consumer receipts | package, narrow, or stop |

## L1 Boundary Rules

- Graph reconciliation is inside P4 and cannot close independently.
- Reconciliation must retain distinct `PayoutEligibilityRule` and
  `NoDuplicateMakeupRule` nodes, distinct unique `enforces` edges, and one shared
  `GenerateSettlement` target.
- P4 freezes the resulting graph/source handle. R4 may read but not mutate it.
- P4 failure blocks R4. R4 failure does not invalidate a valid P4 receipt, but
  composite L1 remains open.
- A later layer may consume earlier receipts but may not rewrite their claim
  ceilings.

## Recommended Next Layer

- Next layer: L1, proposal only.
- First unit after all planning gates pass: `SWU-GCP-002-P4`.
- Major deferred scope: L2 C0/Datalog/Alloy implementation and every release or
  production claim.
