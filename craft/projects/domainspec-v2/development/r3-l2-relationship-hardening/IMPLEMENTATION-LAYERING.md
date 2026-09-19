---
module: r3-l2-relationship-hardening
feature_code: R3H
version: current
status: draft
updatedAt: 2026-07-02
docType: implementation-layering
---

# Implementation Layering: R3/L2 Relationship Hardening

> **2026-07-11 supersession:** The accepted Saga collapse cancels every Saga-law
> hardening route in this document. Saga-specific design text below is retained
> as historical planning evidence only; `WORK-PACK.md` owns the active route.


## Purpose

Define a decision-first implementation path for hardening active R3 relationship authority after the
first-class category research findings.

## Target And Scope

- Target: R3/L2 relationship hardening.
- Scope: root relationship authority, implementation projection, relationship validator, fixtures, and closeout evidence.
- Current state: brownfield; root authority and validator already exist.

## Layer Boundary Rule

Every layer answers:

```text
After this layer, we know whether {decision unlocked}.
```

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (identity proof) | After this layer, we know whether active signatures have non-collapsing machine identity while preserving author-facing verbs. | Add and validate `signature_key` for active signatures, especially Workflow/Saga `orchestrates`. | Root key field, loader uniqueness check, focused tests. | Entity semantic hardening and Saga law detail. | Loader/test failure on duplicate/missing key; existing valid fixtures still pass. | Continue only if identity key does not break authored graph rows. |
| L1 (semantic hardening) | After this layer, we know whether `owns` and `belongs-to` can remain intuitive first-class verbs with finite machine obligations. | Add `authority_effects` and `semantic_kinds` with examples/non-examples. | Root semantics, human companion, projection notes, metadata validation. | Per-instance `belonging_kind` and verb split. | Tests or review checks prove fields are present and documented. | Keep verbs if semantic fields are enough; split later only with evidence. |
| L2 (Saga law hardening) | After this layer, we know whether Saga orchestration stays distinct from Workflow metadata through structural obligations. | Add `saga_obligations` and validation coverage. | Participant, compensation, failure residue, temporal safety, owner boundary fields. | Full formal temporal model or category laws. | Saga fixture remains valid; missing obligation fixture fails or review check blocks. | Keep Saga first-class if obligations are enforceable enough. |
| L3 (projection and closeout) | After this layer, we know whether all author views, validators, deferred residue, and research closeout agree. | Synchronize docs/projection, run validation, produce closeout receipt. | Root/human/projection sync, deferred residue notes, command receipts. | Broader R3C APE/corpus/attestation work. | `validate:rels`, `tools:test`, `validate:docs`, `validate`, and `git diff --check` pass or record blockers. | Route to broader R3 closeout only after R3H evidence is complete. |

## Non Regression Guardrails

- Existing graph rows keep using author-facing `id`, not `signature_key`.
- Generated `owned-by` remains a generated view and cannot become a canonical authored edge.
- `belongs-to` cannot be treated as `owns^-1`.
- `depends-on` remains deferred.
- Full category law remains outside R3H unless a finite validator obligation is introduced by a later owner decision.

## Recommended Next Layer

- Next layer: L0.
- Key decision unlocked: active signatures can be uniquely identified by machine tools without changing human notation.
- Major deferred scope: per-instance belonging kinds, full category laws, and future relation candidates.
