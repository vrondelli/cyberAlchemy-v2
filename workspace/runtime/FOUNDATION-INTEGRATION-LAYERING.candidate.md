---
title: CyberAlchemy Foundation Workspace Integration Layering
status: candidate
updatedAt: 2026-09-03
owner: CyberAlchemy-v2 product owner
scope: product capability
authorityEffect: none
---

# CyberAlchemy Foundation Workspace Integration Layering

This plan integrates the separately owned CyberAlchemy Foundation into the
canonical CyberAlchemy Workspace without replacing the Workspace Agent Control
Plane or treating projection evidence as product approval.

## Context

- Target: CyberAlchemy Foundation in `cyberAlchemy-v2/workspace/runtime`
- Current state: partially implemented; Foundation has a tested candidate bound
  to the legacy `projects/ide-extension` host, while the canonical Workspace has
  a distinct Tauri agent bridge and proposal ledger.
- Primary user: a person inspecting and operating CyberAlchemy through Workspace.
- Primary constraint: preserve source identity and Host custody across the edge.
- Selected dependencies: `definitions/DEFINITIONS.md`, the Foundation Product
  Capability candidate, and the immutable legacy product-candidate record.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Visible outcome | Promotion evidence |
| --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether the canonical Workspace can discover and explain the Foundation from exact source bytes without authority inflation. | Deterministic snapshot, typed read-only adapter, Foundation surface. | Foundation architecture, definitions, source epoch, and the legacy-host mismatch are visible. | Generator check, domain tests, typecheck, build, browser inspection. |
| L1 | After this layer, we know whether one already-authorized Workspace claim can invoke one effect-free Foundation guest while Workspace retains Host custody. | A new Workspace-specific adapter contract over the existing Tauri agent bridge. | One bounded definition projection can be requested and returned through the existing control plane. | Identity, stale-claim, duplicate-result, effect-inflation, and interruption tests. |
| L2 | After this layer, we know whether lifecycle and degradation behavior remain reliable. | Registered/admitted/enabled states, typed unavailable results, evidence replay. | Operators can distinguish projected, unavailable, denied, and stale guests. | Recovery, replay, disablement, currentness, and policy evidence. |
| L3 | After this layer, we know whether another host can implement the same bounded contract without false equivalence. | Identity-bound differential evidence bundle. | Tested capability intersection and differences are visible. | Exact second-host bundle and owner review. |

## D65 Two-Lane Frontier

### Product construction

- Current frontier: L0 source-bound Workspace projection.
- Runnable now: generate, validate, render, and browser-test the projection.
- Candidate benchmark surface: fixed local-build and browser-runtime budgets for
  projection checking, lazy bundle weight, navigation, search, and selection.
- Causal blocker for L1: no reviewed Workspace-specific Host Contract binds the
  Tauri bridge identities to Foundation distribution and Installed Guest
  identities.
- Product approval: absent.

### Operational support

| Task | Owner | Exact affected stage | Blocks L0? | State |
| --- | --- | --- | --- | --- |
| Commit or publish either repository | repository/publication owner | publication | no | unauthorized |
| Select production storage, sandbox, signer, or deployment | respective owners | post-approval realization | no | deferred |
| Admit or activate a Foundation guest | Host lifecycle and authority owners | admission/activation | no | ineligible |

## Non-Regression Guardrails

- The Workspace projection never becomes Foundation source truth.
- The Foundation never approves, claims, commits, interrupts, or mints a
  Workspace execution receipt.
- The existing Workspace Agent Control Plane remains the only Host-side state
  and effect owner.
- A changed selected source byte produces a new source epoch; missing or invalid
  selected dependencies fail generation.
- The legacy IDE-extension candidate remains immutable historical evidence and
  never proves the canonical Workspace integration.
- Benchmark thresholds are fixed before campaign execution; missing browser
  evidence is `NOT_EVALUABLE`, never omitted or treated as passing.

## Recommended Next Layer

Implement and test L0. Defer live guest invocation until L1 has a separately
reviewed Workspace-specific binding rather than adapting the legacy host name by
string substitution.
