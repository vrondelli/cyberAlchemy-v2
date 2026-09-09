---
module: learner-projection-next-route-guide
version: candidate-v1
status: plan-authored
updatedAt: 2026-08-01
docType: implementation-layering
active_layer: L0
selected_swu: none
authority_effect: none
---

# Implementation Layering: Learner Projection And Next-Route Guide

## Purpose

Sequence the candidate projection so each layer answers one falsifiable
decision before broader UI, human, adapter, or lifecycle claims are admitted.

## Source Contract

- [SPEC.md](SPEC.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [UX-PLAN.md](UX-PLAN.md)
- [WITNESS-CONTRACTS.md](WITNESS-CONTRACTS.md)
- [Design selection](DESIGN-SELECTION-RESULT.json)

## Target And Scope

- Target: learner projection for the implementation-conformance ontology view
- Scope: deterministic generated graph/read model plus mutation-admitted local HTML
  projection and candidate acceptance evidence
- Current state: accepted research and validated Plan; implementation absent

## Layer Boundary Rule

```text
After this layer, we know whether the named decision is supported by the
declared evidence; no later-layer readiness is inferred.
```

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether frozen inputs can produce a schema-valid, byte-replayable learner projection with the correct positive ceiling and separately bounded abstention/question/suggestion response. | SWU-LGP-001 through 004. | Schema/validator, exact bindings, canonical compiler, positive branch, gap-response branch, stale/killed/authority/admission-substitution mutants. | Host UI, keyboard/layout, human evidence, real adapter. | LGP-FIX-001–008 and 014; byte-identical replay; exact receipts. | Continue only if every structural, derivation, and admission-separation negative fails closed. |
| L1 | After this layer, we know whether the mutation-admitted host can load and present the projection without class, proof-tier, state, or interaction collapse. | SWU-LGP-005 through 009. | Current/stale reader, semantic rail, non-color/responsive presentation, focus/view/inspector parity, keyboard path. | Accessibility acceptance, comprehension, route usefulness, real source. | Host unit/DOM checks plus LGP-FIX-009 and 011–013. | Continue only if existing mechanics and exact projection truth remain intact. |
| L2 | After this layer, we know whether candidate browser mechanics and side-effect guardrails hold reproducibly. | SWU-LGP-010 plus closure verification. | Pinned browser harness, zero outbound/workflow events, console/regression checks, exact evidence bundle. | Qualified human protocol and accessibility conformance. | Browser receipt, artifact hashes, teardown, independent closure audit. | Learner-view owner decides revise, hold, or admit human study. |
| L3 | After this layer, we would know whether the candidate improves question quality and warrants a separately governed real-source verification request. | Separate human/accessibility work-pack; optional separate adapter-owner request. | None in this Work Pack. | Real adapter, promotion, publication, release, deployment, production. | Qualified human and accessibility receipts; separately owner-admitted adapter evidence. | New owner decision only; no automatic continuation. |

## Non-Regression Guardrails

- Later layers preserve L0 exact binding, record classes, proof tiers,
  abstention, killed vocabulary, and authority-none invariants.
- L1 cannot rederive meaning from DOM geometry or free text.
- L2 browser success cannot become comprehension or accessibility proof.
- L3 evidence cannot automatically promote ontology, admit workflow, or execute
  a route.
- Personal learner text remains absent until a separate privacy/data-lifecycle
  decision.

## Recommended Next Layer

- Next layer: L0
- First candidate: `SWU-LGP-001`
- Selected SWU: `none`
- Decision unlocked: whether the projection contract fails closed before any
  compiler or host behavior is trusted
- Execution admission: blocked until learner-view mutation admission and explicit
  user selection of exactly one SWU
