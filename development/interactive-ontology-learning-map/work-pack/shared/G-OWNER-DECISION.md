---
decisionId: G-OWNER
status: accepted
date: 2026-07-14
targetScope: interactive-ontology-learning-map-projection-contract
ownerRoute: private-learning-map-product-owner
source: human-decision-gate
---

# G-OWNER Decision — Projection Contract Authority

## Decision question

Who owns the private learning-map projection contract, what may that owner approve, which discoveries must return to other authorities, when may the contract leave candidate posture, and who controls its challenge/supersession/retirement lifecycle?

## Consequential work blocked

Without this decision, no projection field or enum could freeze and no prototype contract SWU could begin. This record closes G-OWNER only. G-DSV2-SG remains an independent blocker.

## Resolved decisions

### 1. Owner model

Selected: `private-learning-map-product-owner`, a bounded private-product owner.

Considered:

- CAV2 authority owner: reused an existing route but would expand the authority spine into product-specific projection concerns.
- Bounded private-product owner: gives one accountable owner a narrow projection mandate without source-semantic authority.
- Composed authority route: maximizes joint oversight but creates a multi-owner approval bottleneck.

Rationale: the projection is a private product contract, not a CAV2 canonical kind system or DomainSpec semantic authority surface.

### 2. Approval scope

Selected: the owner may approve projection fields and projection-local enums.

It may govern view types, layout policy, learner/navigation roles, presentation states, schema versioning, and private projection lifecycle. It may not govern DomainSpec relations or profiles, CAV2 canonical kinds, Craft states, source-local statuses, proof posture, or authority meaning.

### 3. Handback to other authorities

Selected: authority-relevant discoveries must be offered back through definitions governance and the relevant source owner.

Handback triggers include reusable meaning, cross-source mapping, implications for canonical kinds/relations/statuses, or evidence of a source-model gap. Pure UI, layout, navigation, and presentation values remain local. A handback is a proposal/evidence packet; the receiving authority accepts, rejects, blocks, or defers it. Projection use never performs automatic promotion.

### 4. Version posture

Selected: conditional promotion after L0 validation.

The governance envelope is approved now. The schema remains `0.1.0-candidate` until both `SWU-IOLM-001-A` and `SWU-IOLM-001-B` pass after G-DSV2-SG. It may then become `0.1.0-private`. Authority-relevant terms remain namespaced projection candidates until accepted upstream, even if the private projection version advances.

### 5. Challenge, supersession, and retirement

Selected: the bounded private-product owner alone controls challenge adjudication, supersession, and retirement of the projection contract.

This lifecycle authority applies only to the private projection. Source authorities retain complete control of their meanings and may reject handed-back candidates or change their own contracts. The product owner must then adapt the projection or retain an explicit contradiction/residue; it cannot overrule, rewrite, or silently normalize the source authority.

## Decision envelope

| Field | Decision |
|---|---|
| Owner route | `private-learning-map-product-owner` |
| Owned scope | private projection fields, projection-local enums, versioning, challenge adjudication, supersession, retirement |
| Forbidden scope | source meaning, DomainSpec graph/FPR state, CAV2 canonical kinds, Craft authority, proof/runtime/publication verdicts |
| Current version posture | `0.1.0-candidate` |
| Promotion condition | `SWU-IOLM-001-A/B` pass after G-DSV2-SG |
| First approved version | `0.1.0-private` |
| Upstream return route | definitions-governance plus affected source owner |
| Challenge/lifecycle owner | `private-learning-map-product-owner` alone, within projection scope |

## Source of decision

The user, acting through the repository's human Decision Gate on 2026-07-14, selected options `1`, `2`, `2`, `2`, and `1` in five one-at-a-time blocker decisions.

## Remaining blockers

- G-DSV2-SG: the live DomainSpec guard plus exact FPR-01/02/03 and bounded FPR-04 graph/quotient/retraction receipts remain required.

## Deferred decisions

- Public derivative publication owner.
- Maintained learner-content owner.
- Production website host/integration owner.

## Assumptions

- The private-product owner may be represented by the stable owner-route ID until a person/team roster is bound separately.
- Advancing a private projection version has no upstream authority or publication effect.

## Validation

- CAV2 package authority law: candidate modeling does not decide source authority; owner routes control promotion.
- DomainSpec ontology promotion path: DomainSpec owner review remains local and no arrow is automatic.
- Learning-map SPEC: G-OWNER and G-DSV2-SG remain non-collapsible independent gates.

## Gate result

`PASS` for G-OWNER. Prototype mutation remains `BLOCKED` on G-DSV2-SG.
