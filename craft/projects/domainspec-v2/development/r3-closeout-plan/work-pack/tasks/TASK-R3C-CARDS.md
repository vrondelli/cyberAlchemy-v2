# TASK-R3C-CARDS: Pattern-Library Card Triage

Layer: L1.
Slice: S-R3C-003.
Wave: [W1](../waves/W1.md).

## Objective

Move owned v1 pattern-library knowledge into v2 evidence/staging without treating copied cards as authority.

## Source Contracts

- `implementation/domainspec/architecture/pattern-library/concepts/backend/`
- `implementation/domainspec/architecture/pattern-library/concepts/ui/`
- `implementation/domainspec/architecture/pattern-library/README.md`
- `projects/domainspec-v2/IMPORT-MANIFEST.md`
- `projects/domainspec-v2/definitions/meta-types/meta-types.md`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`

## Dependencies

Concept-card triage can start immediately. Relationship-card triage should reference DS-D8 active/generated/deprecated/deferred status.

## Implementation Detail

Triage states:

- `evidence-ready`: aligns with existing DS-D1/DS-D8 and can be linked as evidence.
- `staged-review`: useful but needs owner review before definition evidence.
- `deferred`: tied to UI-11, future relation candidates, or category laws.
- `reject-or-superseded`: contradicted by R3A authority.

## Smallest Working Units

### SWU-R3C-005

- Goal: triage backend concept cards.
- Dependencies: none.
- Write scope: chosen v2 card/evidence staging path plus `IMPORT-MANIFEST.md` rows if needed.
- Done criteria: 14 backend concept cards have triage state and provenance.
- Acceptance evidence: links resolve and no copied file claims authority by copy alone.
- Validation: `npm --prefix projects/domainspec-v2/impl run validate:docs`.
- Execution owner: subagent.
- Handoff note: preserve v1 as read-only evidence source.

### SWU-R3C-006

- Goal: triage relationship cards against DS-D8.
- Dependencies: SWU-R3C-005.
- Write scope: v2 relationship card staging path.
- Done criteria: relationship cards are mapped to active/generated/deprecated/deferred DS-D8 states.
- Acceptance evidence: no deferred card is marked active.
- Validation: review check plus `validate:docs`.
- Execution owner: subagent.
- Handoff note: generated `owned-by` and deprecated `enforces-cross` must not become authored canonical edges.

## Synchronization

Update `GAP-DSV2-APE-CARD-TRIAGE` only after both SWUs return receipts.
