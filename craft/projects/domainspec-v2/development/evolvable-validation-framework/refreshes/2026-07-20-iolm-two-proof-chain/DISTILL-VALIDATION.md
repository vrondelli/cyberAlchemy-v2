---
artifact: distill-validation
mode: standard
status: pass
target: iolm-two-proof-chain-refresh
created: 2026-07-20
---

# Distill Validation: IOLM Two-Proof Chain

## Objective And Budget

- Design intent: use the private IOLM as a real DomainSpec proof consumer while
  preserving an independently closable executable-core proof.
- Target context: apply-approved refresh of EVF, IOLM, BTE consumer,
  integration contract, and derived x-ray artifacts.
- Expected output: the smallest coherent IOLM task/SWU split and its recomposition
  into the accepted two-proof chain.
- Optimization goal: prevent IOLM from either becoming a decorative fixture or
  becoming a hidden dependency of the engine's own verdict.
- Mode: Standard, assumed because the user did not select a Distill budget.
- Role path: labeled local Proposer/Balancer passes. Subagent execution was not
  authorized through the repository's confirmation gate.
- Recursive rounds: 2 of 2.

## Discovery Baseline

- `SWU-GCP-001` is already the smallest meaningful executable causal proof.
- IOLM already declares itself a read-only BTE consumer, but no IOLM SWU owns
  the required fresh consumer receipt.
- IOLM 00C-B is independently blocked on cross-feature compilation.
- BTE already separates green core proof from later independent consumer proof,
  avoiding a direct execution cycle.
- YAML/JSON source and machine contracts retain authority; Markdown and receipts
  remain explanation/evidence unless explicitly typed otherwise.

## Role Conversation Trace

### Round 1

- Proposer claim: add one IOLM consumer SWU that accepts both narrow EVF and
  broad BTE handles.
- Evidence: both inputs share the same identity, provenance, projection,
  determinism, parity, and negative-check contract.
- Balancer objection — responsibility breadth: one SWU would have two upstream
  gates, two denominators, two freshness identities, and two downstream claims.
- Reconciliation: revise into two SWUs under one task and one machine consumer
  contract.

### Round 2

- Proposer claim: `SWU-IOLM-DSC-A` consumes the narrow EVF handle;
  `SWU-IOLM-DSC-B` reruns the same contract over the later BTE breadth handle.
- Balancer objection — dependency/circularity: BTE terminal verification needs
  IOLM, while IOLM breadth needs BTE.
- Reconciliation: BTE core closes before consumers. Only terminal
  `verify:bte:consumers` depends on the fresh IOLM breadth receipt; no cycle
  remains.
- Balancer objection — lane coupling: IOLM's cross-feature blocker might
  falsely block EVF L0.
- Reconciliation: IOLM SWUs depend on its substrate, but EVF L0 never depends on
  IOLM. Only the combined real-application claim requires both receipts.
- Balancer objection — authority collapse: a consumer contract could become a
  second source of graph or obligation truth.
- Reconciliation: the machine contract validates exact upstream handles and
  emits consumer evidence only. It cannot define nodes, edges, predicates,
  `O_spec`, verdicts, admission, or release.

## Smallest Coherent Unit

`SWU-IOLM-DSC-A` is the optimization point.

- Responsibility: prove that the private IOLM consumes one exact executable EVF
  proof without changing semantic identity or authority posture.
- Inputs: versioned consumer contract; exact successful EVF graph, obligation,
  TestCase, binding, evaluator, execution, mutation, and receipt handles; ready
  IOLM candidate substrate.
- Outputs: deterministic IOLM snapshot/projection hashes, parity and negative
  results, typed residue, and one independently owned consumer receipt.
- Abstraction level: product-consumer integration proof, not engine semantics or
  UI implementation.
- Closure: input validation, projection, non-collapse checks, and receipt belong
  together because splitting them would hide whether the exact upstream handle
  caused the observed consumer evidence.

## Recomposition Proof

```text
SWU-GCP-001 receipt
  + IOLM consumer contract
  + IOLM candidate substrate
  -> SWU-IOLM-DSC-A receipt
  -> combined narrow two-proof claim

SWU-BTE-008 core receipt
  + same consumer contract
  + DSC-A adapter precedent
  -> SWU-IOLM-DSC-B receipt
  + fresh Body War receipt
  -> SWU-BTE-010
  -> terminal verify:bte
```

No hidden glue is required: every boundary has an owner, exact handle, receipt,
and typed blocker.

## Technique Trace

| Technique | Trigger | Outcome |
|---|---|---|
| abstraction-level guard | engine and application evidence risked collapsing | retained product-consumer scope |
| recomposition proof | two new SWUs must serve the accepted decision | pass; both recompose through one contract |
| evolution profile | narrow proof later grows to 13/16 breadth | one versioned contract, separate fresh rerun |
| boundary-object check | contract crosses EVF/IOLM/BTE owners | YAML contract + JSON receipt schema |
| requisite-variety check | narrow and breadth denominators differ | two SWUs, not a flag inside one SWU |
| premortem | cross-project proof is high-risk | guard against lane coupling and self-authored receipts |
| frame-expiry note | topology depends on current BTE/IOLM gates | invalidate if core/consumer ownership changes |
| navigable-result check | proposal must lead to a safe next route | apply-approved refresh, then independent decisions/tasks |

Tournament was skipped because the user already selected the two-proof topology;
the remaining problem is safe decomposition, not competing architectures.

## Verdict And Tension Ledger

- Verdict: `pass` for the applied SWU split.
- Resolved: narrow versus breadth consumer runs; core/consumer circularity;
  machine contract ownership; IOLM/core blocker isolation.
- Still open: `DEC-GCP-001`; the selected cross-feature route's upstream support
  receipt; both implementations; independent receipt verification.
- Premortem: the likely false-green is accepting a schema or fixture as a fresh
  IOLM run. Guardrail: receipt owner/freshness/raw-hash checks and explicit
  fixture-only rejection.
- Frame expiry: rerun Distill if IOLM no longer uses one shared read-model
  pipeline, if BTE core/terminal ownership changes, or if the consumer begins
  authoring graph or obligation semantics.

## Apply Reconciliation

The proposal was rebased onto the newer IOLM state. Option 1 is already selected
for 00C-B and the separate BTE readiness contradiction is already repaired; the
support receipt itself remains missing. This does not change the L0D split or
recomposition. The YAML contract, JSON receipt schema, IOLM task/two SWUs, BTE
breadth pointer, and derived x-ray are applied and validate. Both consumer SWUs
remain unselected and implementation remains owned by later Task Sessions.

## Navigation

Proceed independently: resolve `DEC-GCP-001` and resume `SWU-GCP-001` for the
core; execute the accepted BTE predecessor chain for cross-feature support and
resume 00C-B/C for the IOLM substrate. Select DSC-A only when both exact handles
exist; DSC-B remains a later fresh breadth rerun.
