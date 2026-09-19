# TASK-R3C-FUTURE: Deferred Relations And Category Laws

Layer: L2.
Slices: S-R3C-004.
Wave: [W2](../waves/W2.md).

## Objective

Give future candidates a governed route without making them part of R3A completion.

## Source Contracts

- `projects/domainspec-v2/development/reformulate-batch1/task-sessions/2026-07-02-swu-r3a/TASK-SESSION-RESULT.md`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/`
- `projects/domainspec-v2/definitions/DEFINITIONS.md`

## Dependencies

SWU-R3C-001 should pass so future routes can refer to actual dynamic enforcement behavior.

## Implementation Detail

Future relation candidate review must answer:

- What distinct implementation behavior would this relation compose into?
- What active DS-D8 signature does it overlap with?
- What positive and negative examples prove the difference?
- What validator or authoring obligation would change if promoted?
- Which owner route can promote, defer, or reject it?

Category-law review must answer:

- Which laws are descriptive constraints over the DS-D8 category?
- Which are validator-enforceable now?
- Which are proof/formalism work outside R3?
- What examples/non-examples avoid abstract law theater?

## Smallest Working Units

### SWU-R3C-007

- Goal: create deferred relation candidate review packet.
- Dependencies: SWU-R3C-001.
- Write scope: `definitions/reviews/` or `development/reformulate-batch1/governance/`.
- Done criteria: `depends-on`, Operation-returned Value Object, and Event payload/publisher composite each have promote/defer/reject criteria.
- Acceptance evidence: packet names witness needed and owner route.
- Validation: review check plus `validate:docs`.
- Execution owner: manual.
- Handoff note: no root authority mutation in this SWU.

### SWU-R3C-008

- Goal: create category-law formalization route.
- Dependencies: SWU-R3C-001.
- Write scope: category-law research/plan packet.
- Done criteria: candidate laws, examples, non-examples, owner route, and validation surface are named.
- Acceptance evidence: next route is explicit: research-tower, definitions-governance, or decision-gate.
- Validation: review check plus `validate:docs`.
- Execution owner: manual.
- Handoff note: keep category laws outside R3A completion unless owner explicitly changes scope.

## Synchronization

This task usually returns `flag`, not `pass`, because it routes future work rather than completing it.
