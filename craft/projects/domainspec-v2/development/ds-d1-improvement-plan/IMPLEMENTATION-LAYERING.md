---
module: ds-d1-improvement-plan
feature_code: DSD1
version: current
status: draft
updatedAt: 2026-07-03
docType: implementation-layering
---

# Implementation Layering: DS-D1 Improvement Plan

Decision-first layering for improving DS-D1 after the meta-type category-boundary
research. This package plans execution only. It does not mutate DS-D1,
validators, schemas, projections, or definition cards.

## Source Contract

- Invoke plan contract: [../../../../.agents/skills/invoke/plan.md](../../../../.agents/skills/invoke/plan.md)
- Plan artifact boundary: [../../../../arcanum/spells/invoke/development/PLAN-ARTIFACT-BOUNDARIES.md](../../../../arcanum/spells/invoke/development/PLAN-ARTIFACT-BOUNDARIES.md)
- DS-D1 category-boundary findings: [../r3-research/ds-d1-metatype-category-boundary/findings.md](../r3-research/ds-d1-metatype-category-boundary/findings.md)
- Current DS-D1 registry: [../../definitions/meta-types/meta-types.yml](../../definitions/meta-types/meta-types.yml)
- Human DS-D1 cards: [../../definitions/meta-types/meta-types.md](../../definitions/meta-types/meta-types.md)
- Formalization work-pack: [../meta-type-formalization/WORK-PACK.md](../meta-type-formalization/WORK-PACK.md)
- Definitions work-pack: [../meta-type-definitions/WORK-PACK.md](../meta-type-definitions/WORK-PACK.md)
- Current project state: [../../CRAFT.md](../../CRAFT.md)

## Target And Scope

- Target: DS-D1 meta-type authority maturity.
- Scope: project-local planning for definitions, schemas, fixtures, validator
  hardening, projection cleanup, and ledger/read-model sync.
- Current state: backend `DS-D1.1..14` are schema/fixture-backed shape
  candidates; UI `DS-D1.15..25` are endpoint-used by DS-D8 but
  formation-deferred in DS-D1.

## Layer Boundary Rule

```text
After this layer, we know whether {decision unlocked}.
```

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (maturity alignment) | After this layer, we know whether every DS-D1 surface says the same truth about staged authority. | Add a DS-D1 maturity ledger/read-model and reconcile status language across root definitions, candidate plans, and Craft. | At execution time, 14 backend shape candidates and 11 formation-deferred UI labels; SGRM now supersedes the backend count to 13. | New UI schemas and semantic validator rules. | Docs validate; ledger/read-model links resolve; no authority mutation beyond status/projection wording selected by task-session. | Continue to L1 only after staged authority is explicit. |
| L1 (formation expansion) | After this layer, we know whether the 11 UI labels remain staged or gain formation authority. | Owner decision for UI 11 path, then either add UI cards/schemas/fixtures in slices or retain explicit formation deferral. | UI path decision; first UI schema slice; remaining UI schema slice; generated instance coverage if schemas are added. | Category laws; broad UI runtime semantics. | UI cards/schemas/fixtures validate, or root wording explicitly keeps labels deferred. | Promote only what has cards, schemas, fixtures, and correction contracts. |
| L2 (semantic hardening) | After this layer, we know whether high-risk backend types have finite law beyond one-attribute shape checks. | Continue State Machine, Operation/Event, Rule/Policy, and Entity/Value Object pressure points; Saga collapse is already routed to SGRM. | Schema criteria, fixtures, validator support, relationship coherence notes. | Full category law; runtime derivation semantics; private delta rules. | Positive/negative fixtures discriminate; validators reject mislabels; relationship signatures still pass. | Keep type authority limited to what validators/fixtures actually witness. |
| L3 (closeout and recomposition) | After this layer, we know whether DS-D1, DS-D8, validators, projections, Craft, and Inventory agree after improvement. | Validation suite, projection cleanup, definitions indexes, Craft sync, observability/inventory closeout. | Aggregate validation, docs validation, generated instances, drift audit, work-pack sync. | Any deferred UI or category-law scope not selected earlier. | `validate`, JSON/YAML checks, docs links, task-session receipt, and read-model updates. | Mark DS-D1 improvement slice complete or leave explicit owner-gated residue. |

## Non-Regression Guardrails

- DS-D1 owns type formation/correction. DS-D8 owns endpoint signatures.
- DS-D8 may reference UI endpoint labels, but it does not confer DS-D1 formation
  authority on UI types.
- Backend schemas are public structural contracts; they must not import private
  derivation delta-rules.
- `active-harden` is a work posture, not proof.
- `owned-by` remains generated, `depends-on` remains deferred, and
  `enforces-cross` remains deprecated unless a separate owner route changes
  DS-D8.
- Full category law remains deferred until identity, composition, closure,
  associativity, and path laws are finite validator obligations.

## Recommended Next Layer

- Next layer: L0.
- Selected first unit: `SWU-DSD1-001`, DS-D1 maturity ledger/read-model sync.
- Why first: it makes all later work honest by separating shape-candidate,
  semantic-hardening, endpoint-used, and formation-deferred states before any
  implementation refresh.
