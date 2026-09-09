---
task_id: TASK-OCON-003
status: completed
layer: L2
wave: W2
owner: decision-gate plus definitions-governance
---

# TASK-OCON-003: Challenge-Contract Reconciliation

## Objective

Resolve the challenge-contract semantic/schema tension before mutating
`NODE-MODEL.md` or `DEFINITIONS.md`.

## Source Contracts

- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D40`
- `cyberAlchemy-v2/ontology/NODE-MODEL.md`
- `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`
- `cyberAlchemy-v2/ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md`

## Dependencies

- SWU-OCON-002.

## Blocker State

BLK-OCON-001 blocked mutation. The active definition references legacy
House-vault-derived confidence wording, while the later schema proposal wants
canonical `evidence_confidence` and `commitment_confidence` fields.
SWU-OCON-003 recorded the owner receipt at
`cyberAlchemy-v2/authority/definitions/reviews/2026-06-30-challenge-contract-confidence-axis-review.md`.

## Smallest Working Units

### SWU-OCON-003

- Goal: obtain or author the owner decision/review record for challenge-contract
  confidence wording.
- Dependencies: SWU-OCON-002.
- Source anchors: `DEFINITIONS.md#CAV2-D40`, schema proposal section 4, schema
  proposal section 6.
- Related context: definitions-governance and decision-gate.
- Write scope:
  - decision or definitions review artifact only.
- Done criteria:
  - Owner route selects canonical confidence wording and legacy-key posture.
  - Receipt names the files allowed to change.
  - Receipt explicitly preserves the rule that challenge contract is not a
    third confidence axis.
- Acceptance evidence:
  - `cyberAlchemy-v2/authority/definitions/reviews/2026-06-30-challenge-contract-confidence-axis-review.md`
  - `TASK-SESSION-SWU-OCON-003.md`
- Validation:
  - Human/owner review.
- Execution owner: manual.
- Status: completed.
- Handoff note: `NODE-MODEL.md` was not patched in this SWU.

### SWU-OCON-004

- Goal: sync `NODE-MODEL.md` and, if approved, `DEFINITIONS.md` to the owner
  receipt.
- Dependencies: SWU-OCON-003.
- Source anchors: SWU-OCON-003 receipt, `NODE-MODEL.md`, `DEFINITIONS.md`.
- Related context: CAV2 ontology route.
- Write scope:
  - `cyberAlchemy-v2/ontology/NODE-MODEL.md`
  - `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`
  - `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` only if the owner
    receipt allows it.
  - `cyberAlchemy-v2/authority/definitions/DEFINITIONS-INDEX.md` for lookup
    sync only.
- Done criteria:
  - Docs align with owner-approved confidence wording.
  - `challenge_contract` remains a challenge protocol, not confidence,
    residue, verdict, or promotion.
- Acceptance evidence:
  - Diff cites or references the owner receipt.
- Validation:
  - `git diff --check -- cyberAlchemy-v2/ontology/NODE-MODEL.md cyberAlchemy-v2/ontology/PACKAGE-MODEL.md cyberAlchemy-v2/authority/definitions/DEFINITIONS.md cyberAlchemy-v2/authority/definitions/DEFINITIONS-INDEX.md`
- Execution owner: local-fallback after manual gate.
- Handoff note: consume the SWU-OCON-003 receipt before patching source files.
- Status: completed.
- Acceptance evidence:
  - `TASK-SESSION-SWU-OCON-004.md`

## Synchronization Rules

Task completed after SWU-OCON-004 synced source files against the SWU-OCON-003
receipt.
