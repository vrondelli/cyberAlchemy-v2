---
title: Knowledge Expansion Protocol Completion Implementation Layering
status: implementation-candidate
updatedAt: 2026-09-04
owner: Knowledge Expansion Protocol product owner
scope: protocol evidence, hosted readiness, Devnet trial, and publication preparation
authority_effect: none
---

# Knowledge Expansion Protocol Completion Implementation Layering

This artifact separates the current product-construction frontier from later
operational effects. It does not accept a binding, admit an ontology, authorize
credentials or RPC, deploy anything, publish anything, or prove KEP complete.

## Context

- Target: the no-price encrypted co-ownership KEP vertical.
- Current state: the candidate-013 formal model has bounded proof evidence and
  residual-path specification closure, but exact Rust preservation and a fresh
  finalized hosted Devnet observation were not previously joined.
- Primary constraint: historical, main-checkout, hosted, and residue-closure
  bytes must not be silently combined into one candidate.
- Current local candidate: `deployment-continuation/013` in the
  `codex/kep-residue-closure` worktree.

## Layering Method

```text
Layer value = decision unlocked + visible outcome + risk reduced
Layer cost  = implementation time + verification time + coordination burden
```

Every later layer preserves the earlier no-price, no-plaintext-custody,
originator-preservation, fail-closed ambiguity, and no-authority-by-validation
guarantees.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- |
| L0 — Exact local refinement | After this layer, do the exact candidate-013 Rust symbols and focused tests preserve all ten bounded formal obligations? | Digest-bound obligation-to-theorem-to-symbol-to-test mapping, two local test runs, and a deterministic refinement receipt | `PASS_BOUNDED` refinement receipt while finalized Devnet remains `not_evaluable` | Continue, repair drift, or stop |
| L1 — Residual path execution | After this layer, have all reachable safety paths received the evidence kinds they actually require? | Implementation tests, bounded exploration, operational controls, and separately authorized runtime observations | EVF path receipt with no hidden missing evidence kind | Prepare hosted readiness or remediate |
| L2 — Hosted readiness | After this layer, can one disposable hosted trial be proposed without undeclared durability, browser, security, or operational assumptions? | Off-host restore, browser/wallet matrix, VPS/TLS/monitoring envelope, incident rehearsal, independent review | One immutable trial envelope ready for an owner decision | Authorize one trial, remediate, or stop |
| L3 — Devnet vertical and interpretation | After this layer, has one exact A-to-B flow worked and can its bounded claims be independently reviewed? | Separately authorized deployment continuation and fifteen-case hosted trial, joined evidence, paper reconciliation | Typed trial adjudication and public-safe paper candidate | Accept bounded evidence, revise, defer, or stop |

## Current Product Frontier

L0 is runnable locally. Its selected dependencies are the unchanged candidate-013
formal claims and receipts, the exact candidate-013 implementation binding, and
the exact Rust trial-cli sources named by the refinement model.

The broader repository baseline is not yet frozen. The main checkout contains
newer hosted and white-paper bytes while this worktree contains unintegrated
candidate-013 evidence. That integration remains a separate exact-byte task and
must exclude `runtime/target/**` and other generated build products.

## Operational Work And Owners

| Task | Affected layer | State | Owner | Blocking basis |
| --- | --- | --- | --- | --- |
| Finalized public-Devnet deployment observation | L1/L3 | deferred | external-effect owner plus KEP product owner | Requires a fresh immutable authorization envelope |
| Hosted off-VPS restore and failure-domain proof | L2 | open | Durable Storage implementation owner | Exact infrastructure and backup identities are not selected here |
| Wallet/browser compatibility and custody review | L2 | open | Hosted KEP and security owners | Supported versions and independent review remain unbound |
| VPS, TLS, monitoring, and incident rehearsal | L2 | open | operations owner | Remote mutations and credentials are outside this local wave |
| Publication and successor selection | L3 | deferred | product, evidence, legal, and publication owners | Requires joined trial and interpretation evidence |

## Non-Regression Guardrails

- A remains an owner when B is added.
- Knowledge consideration remains zero; infrastructure cost is separate.
- Plaintext, content keys, private keys, credentials, and customer material do
  not enter Git, evidence, logs, SQL, or public chain state.
- Ambiguous effects reconcile before any retry.
- Provider choice follows proof need; TLC or Alloy is not required by brand.
- Validation and generated receipts never grant acceptance, admission,
  deployment, publication, or external-effect authority.

## Recommended Next Layer

Complete L0, then use the residual path model to select only the missing
evidence kinds for L1. Do not perform another Devnet submission until one exact
current implementation candidate and one exact effect envelope are separately
reviewed.
