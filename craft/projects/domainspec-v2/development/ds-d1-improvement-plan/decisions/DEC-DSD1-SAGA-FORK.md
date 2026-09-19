---
decision_id: DEC-DSD1-SAGA-FORK
feature_code: DSD1
status: accepted
selected_option: collapse
created: 2026-07-11
decided_at: 2026-07-11T16:27:13Z
source: explicit-owner-choice
scope: SWU-DSD1-007
---

# DEC-DSD1-SAGA-FORK: Ratify Saga Collapse Default

## Decision Question

Should DomainSpec v2 retain Saga as a distinct DS-D1 type by sponsoring a new
finite hardening witness package, or ratify the evidence-backed default that
Saga collapses into Workflow plus scope metadata?

This decision blocks Saga/Workflow and DS-D8 mutation under
[SWU-DSD1-007](../WORK-PACK.md#swu-manifest).

## Options Considered

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| Ratify collapse | Follows the accepted build-from-owned evidence and removes an unsupported first-class distinction. | Requires an owner-reviewed compatibility and migration packet across active DS-D8 signatures, validators, fixtures, and projections. | Route to SWU-DSD1-009. |
| Sponsor new hardening evidence | Preserves a route for Saga to earn distinct DS-D1 typehood. | Requires genuinely new, finite, non-circular participant, ownership, compensation, failure/residue, temporal, and negative-fixture witnesses; the current dossier cannot be approved into sufficiency. | Route conditionally to SWU-DSD1-008 for evidence production and adjudication. |

The standing explain/more-context route was offered and not selected.

## Selected Option

**Ratify collapse.**

The owner accepts the build-from-owned collapse default:

```text
Saga -> Workflow + scope metadata
```

This selects the collapse/deprecation branch. It does not itself remove Saga,
rewrite Workflow, change DS-D8 signatures, or authorize implementation
mutation.

## Rationale

The accepted evidence adjudication found no finite, non-circular DS-D1 witness
that separates Saga from Workflow under the current registry and admitted
non-collapse rules. Scope is an attestation, both types project to the same
verb-ID edge participation, compensation is not Saga-exclusive, and the richer
DS-D8 signatures are migration inputs rather than independent proof of DS-D1
typehood.

The result is deliberately bounded: it is registry-relative and does not claim
that no future Saga model could ever become distinct. The current hardening
dossier is insufficient, while a future hardening route could reopen only
through a new owner decision backed by the required witness package.

Evidence:

- [Accepted Saga evidence adjudication](../research/2026-07-11-saga-existing-evidence-adjudication/findings.md)
- [D6 node non-collapse open decision](../../../definitions/reviews/2026-07-08-d6-node-noncollapse.md)
- [Saga task contract](../work-pack/tasks/TASK-DSD1-SAGA.md)
- [Prior Saga connectability decision](../../reformulate-batch1/governance/edge-signature-authority-decisions.md#dec-r3-edge-2---saga-connectability)

## Prior Decision Reconciliation

`DEC-R3-EDGE-2` selected first-class Saga relationship signatures on
2026-07-02 because Saga was expected to carry distinct cross-feature,
participant, compensation, and transaction-safety obligations.

The later accepted evidence found that those obligations are not currently
finite, Saga-exclusive DS-D1 formation witnesses. This decision therefore
**supersedes the selected direction of `DEC-R3-EDGE-2` for future work** while
preserving that record as historical provenance.

The supersession is a decision-level routing change, not an immediate authority
mutation. The existing Saga DS-D8 signature stays active until
`SWU-DSD1-009` defines and receives approval for its deprecation,
compatibility, and migration treatment.

## Consequences

1. `SWU-DSD1-007` has an explicit owner choice: collapse.
2. `SWU-DSD1-009` is the selected next route.
3. `SWU-DSD1-008` is not selected and must not run under this decision.
4. Saga and Workflow remain separately modeled until the owner-reviewed
   collapse/deprecation and compatibility route is approved and executed.
5. Both active DS-D8 `orchestrates` signatures remain unchanged during this
   decision step.
6. The migration packet must name affected signatures, validators, fixtures,
   projections, read models, compatibility behavior, sequencing, and rollback
   considerations.
7. `SWU-DSD1-009` must explicitly reconcile and retire the future-direction
   consequence of `DEC-R3-EDGE-2`; the historical decision record is not
   rewritten.

## Decision Source

The owner selected option `1`, **Ratify collapse**, in the
`DEC-DSD1-SAGA-FORK` decision gate on 2026-07-11.

## Remaining Blockers

None for selecting the Saga branch.

Consequential mutation remains blocked until `SWU-DSD1-009` produces the
owner-reviewed migration packet and the relevant DS-D1 and DS-D8 owners approve
the mutations it proposes.

## Deferred Decisions

- Exact deprecation and compatibility mechanics.
- Migration sequencing and rollback policy.
- Whether a future evidence package is strong enough to reopen Saga typehood.

These are routed to `SWU-DSD1-009` or a later explicit owner gate; they are not
silently assumed here.

## Assumptions

None. This record captures an explicit owner choice and preserves the current
authority state until the selected follow-up route completes.
