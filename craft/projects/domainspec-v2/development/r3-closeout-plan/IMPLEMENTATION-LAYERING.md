---
module: r3-closeout-plan
feature_code: R3C
version: current
status: draft
updatedAt: 2026-07-02
docType: implementation-layering
---

# Implementation Layering: R3 Closeout Plan

Decision-first layering for the work that remains after SWU-R3A. R3A itself is complete: root
relationship authority exists, endpoint-aware relationship validation is green, DS-D2/DS-D8 are active,
and the definition drift audit is pass. This package plans the downstream residue without treating future
evidence work as an R3 blocker.

## Source Contract

- Invoke plan contract: [../../../../.agents/skills/invoke/plan.md](../../../../.agents/skills/invoke/plan.md)
- Plan artifact boundary: [../../../../arcanum/spells/invoke/development/PLAN-ARTIFACT-BOUNDARIES.md](../../../../arcanum/spells/invoke/development/PLAN-ARTIFACT-BOUNDARIES.md)
- Current project state: [../../CRAFT.md](../../CRAFT.md)
- R3A receipt: [../reformulate-batch1/task-sessions/2026-07-02-swu-r3a/TASK-SESSION-RESULT.md](../reformulate-batch1/task-sessions/2026-07-02-swu-r3a/TASK-SESSION-RESULT.md)
- APE design package: [../architecture-pattern-enforcement/WORK-PACK.md](../architecture-pattern-enforcement/WORK-PACK.md)
- Root relationship authority: [../../definitions/relationships/relationships.yml](../../definitions/relationships/relationships.yml)

## Target And Scope

- Target: DomainSpec v2 R3 closeout residue.
- Scope: project-local execution planning; no source implementation is performed by this package.
- Current state: brownfield; R3A landed, but APE dynamic DS-D8 enforcement, second-corpus evidence, card
  triage, future relation candidates, category laws, and attestation remain separated.

## Layer Boundary Rule

```text
After this layer, we know whether {decision unlocked}.
```

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (authority adapter) | After this layer, we know whether the legacy code-tag composability checker can consume root DS-D8 instead of hard-coded pre-R3 rules. | Refactor `check-code-tag-composability.ts` to load `definitions/relationships/relationships.yml` through `relationship-signatures.ts`, with tests for active/generated/deprecated/deferred cases. | Dynamic rule loading, rule mapping, fixtures, `tags:test`, `tags:composability` validation. | Second corpus, card triage, promotion, category laws. | Composability tests prove active DS-D8 rules are checked and generated/deferred/deprecated labels are not authored canonical edges. | Continue to L1 if strict mode rejects seeded invalid code tags and existing validation remains green. |
| L1 (evidence breadth) | After this layer, we know whether the R3A edge law holds beyond one financial-settlement pack and has authoring context. | Add/select a second corpus and triage backend pattern cards into v2 evidence. | Second feature/corpus, v1 backend card triage, IMPORT-MANIFEST rows, doc links. | UI-11, cross-project mint, binding promotion. | At least two packs validate; card evidence resolves; seeded edge violation fails. | Continue to L2 when evidence is repeatable, not merely possible. |
| L2 (governance separation) | After this layer, we know whether deferred relation candidates and category-law formalization have evidence routes without being silently promoted. | Create review packets for `depends-on`, Operation-returned Value Object, Event payload/publisher composite, and category-law scope. | Definitions/review candidates, category-law route proposal, owner gate notes. | Actual promotion of candidates; full formal law encoding; L2 attestation seal. | Each candidate has promote/defer/reject criteria and no active authority is mutated without owner route. | Route to definitions-governance / research / decision-gate as needed. |
| L3 (authority closeout) | After this layer, we know whether the project ledger, observer records, and attestation/promotion boundary are ready for a final R3 closeout. | Verify evidence, sync Craft, append observability, and create the L2 attestation handoff if capability exists. | Closeout audit, Craft status, observability signal, attestation handoff. | Actual cryptographic attestation if the capability is still unavailable. | `CRAFT.md` and `.craft/ledger.yml` agree; validation commands pass; attestation route is explicit. | Mark R3 closeout complete or blocked only by the human attestation capability. |

## Non-Regression Guardrails

- R3A root authority stays at `definitions/relationships/`; implementation files are projections or validators.
- Active DS-D8 signatures are authoritative; generated views, deprecated aliases, and deferred candidates are not authored canonical edges.
- APE may enforce and gather evidence, but it does not promote definitions or constitutions.
- Category laws are a later formalization route; do not smuggle them into R3A validator work.
- L2 attestation is an authority boundary, not definition drift.

## Recommended Next Layer

- Next layer: L0.
- Key decision unlocked: can the legacy code-tag composability path consume root DS-D8 and reject seeded invalid edges?
- Major deferred scope: second corpus, card triage, candidate relation evidence, category laws, attestation.
