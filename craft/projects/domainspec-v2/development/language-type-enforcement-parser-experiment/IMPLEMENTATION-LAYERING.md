---
module: language-type-enforcement-parser-experiment
feature_code: LTE
version: current
status: planned
updatedAt: 2026-07-17
docType: implementation-layering
authority: non-authority implementation plan
---

# Implementation Layering: Language Type-Enforcement Parser Experiment

## Purpose

Keep the first experiment at the smallest end-to-end evidence boundary, then
promote only when the prior layer creates evidence that the next decision is
worth taking.

## Target And Scope

- Target: DomainSpec v2 normalized Concept Registry parsing.
- Scope: brownfield parser/validator integration experiment.
- Active layer window: L0 only.
- Approved design: [ARCHITECTURE.md](ARCHITECTURE.md).

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Included scope | Deferred scope | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (POC) | After this layer, we know whether one shared structural discriminator can eliminate silent skips and yield exact-cause parity across both current consumers. | pure kernel + two adapters + eight consumer-surface negatives + three-pack positive regression | frozen registry grammar, typed accounting, stable codes, package subpath, content/engine integration | profile/schema admission, durable manifests, whole-SPEC parser, formal projection | both consumer surfaces return the same expected code for every mutation; positive declaration/count/result equality; focused/full checks green | continue to L1 only if the bridge works without boundary trespass; otherwise pivot or stop |
| L1 | After this layer, we know whether the L0 contract remains repeatable under real syntax evolution or a third consumer. | one evidence-backed extension of the same adapter/result boundary | only hardening demanded by observed drift, third-consumer pressure, or grammar change | profile-aware IR, governance receipts, scale packaging | a new pressure case is handled without changing L0 codes or accounting invariants | harden, narrow, or stop |
| L2 | After this layer, we know whether parsing evidence composes safely with governed schema/profile admission and degraded-mode reporting. | admitted/rejected profile path with explicit owner decision and durable receipt choice | FPR-02-approved admission integration, observability/receipt contract if chosen | cross-runtime packaging and formal projection | FPR-02 gate resolved; policy negatives and degraded mode have named evidence | promote only with owner-approved policy evidence |
| L3 | After this layer, we know whether the contract can be packaged or projected across runtimes without losing judgments. | one second-runtime or formal-projection preservation witness | reusable packaging or TypeScript-to-Lean/other projection selected by authority owner | generalized language platform claims | translation/preservation receipt and consumer compatibility evidence | package, pilot, or defer |

## Promotion And Nesting Rules

- L0 contains two execution waves, both answering the same L0 question; wave
  completion is not layer promotion.
- L1-L3 have no execution tasks in this Work Pack. Their rows are decision
  boundaries, not promised scope.
- A third consumer, registry syntax change, or FPR parser edit expires the L0
  frame and requires design/Distill refresh before promotion.
- L2 cannot begin while FPR-02 profile/admission decisions remain gated.
- Later layers must preserve the L0 stable-code set, accounting invariant, and
  positive declaration equality unless an explicit compatibility revision is
  approved.

## Recommended Next Layer

- Next layer: L0.
- Key decision unlocked: whether the shared discriminator bridge actually closes
  the observed two-consumer structural gap.
- Major deferred scope: profile admission and any claim beyond
  `RegistryParsedCompletely(spec)`.
