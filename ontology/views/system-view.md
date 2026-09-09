# System View

Status: candidate
Owner: CyberAlchemy v2 ontology route

## View Role

This view represents package/runtime/evidence structure. It describes how
authority model concepts connect to envelopes, ledgers, projections, validation,
and future implementation without giving ontology runtime authority.

## Source Contracts

| Source | Use |
| --- | --- |
| [../../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md](../../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md) | Authority artifact lifecycle envelope. |
| [../../development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md](../../development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md) | Typed-hole contract, ledger-spec axis, and bridge-edge blocker. |
| [../LIFECYCLE-MODEL.md](../LIFECYCLE-MODEL.md) | Candidate lifecycle model. |
| [../projections/README.md](../projections/README.md) | Projection rules. |

## System Boundary

```text
raw/runtime evidence
  -> inventory evidence cards/sets
  -> authority artifact lifecycle envelope
  -> owner route/profile
  -> PromotionRecord-compatible decision
  -> authority artifact
  -> optional ontology projection/read model
```

## System Components

| Component | Role | Boundary |
| --- | --- | --- |
| Authority envelope | Carries status, sources, promotion handle, conflicts, drift owner, ontology refs. | Does not produce verdict. |
| Owner profile | Produces validate/promote judgment. | Per-kind, not shared default. |
| PromotionRecord-compatible record | Records owner decision and projection permission. | Does not replace authority artifact. |
| Ledger evidence | Witnesses movement when validator exists. | Not ontology subgraph today. |
| Ontology projection | Exposes allowed state for search/review. | Cannot change authority. |

## Deferred System Work

| Work | Blocker | Route |
| --- | --- | --- |
| Append-only authority-ledger validator | Missing validating schema. | authority-ledger owner |
| Movement bridge edge | Current edge law does not admit promotion movement. | schema governance |
| Live node/relation/lifecycle schema | Would create enforceable schema. | schema governance / decision-gate |

## Use Guidance

Use this view when checking how candidate meaning can become evidence-backed
workflow state, projection state, or later implementation input.
