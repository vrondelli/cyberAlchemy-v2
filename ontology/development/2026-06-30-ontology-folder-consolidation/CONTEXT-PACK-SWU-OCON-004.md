---
node_type: task-session-context-pack
is_session: true
status: complete
boundary: INTERNAL - session evidence only
created: 2026-06-30
task: TASK-OCON-003
swu: SWU-OCON-004
mode: lean
---

# Context Pack: SWU-OCON-004

## Task

Sync active CAV2 ontology and definition docs to the SWU-OCON-003 owner
receipt. The forward model uses only `evidence_confidence` and
`commitment_confidence`; legacy confidence keys are not carried forward as
active schema fields or aliases.

## Obligation Matrix

| Obligation | Required Evidence | Coverage |
| --- | --- | --- |
| O1: Dependency satisfied. | SWU-OCON-003 receipt exists and passes owner gate. | covered |
| O2: Stay inside source sync scope. | Touch `NODE-MODEL.md`, `PACKAGE-MODEL.md`, `DEFINITIONS.md`, and definitions lookup sync only. | covered |
| O3: Remove nested confidence from challenge contract. | `NODE-MODEL.md` and `PACKAGE-MODEL.md` must make node confidence top-level. | covered |
| O4: Use only canonical forward confidence fields. | Active docs must use `evidence_confidence` and `commitment_confidence`, not legacy keys. | covered |
| O5: Preserve no-third-axis rule. | Challenge contract remains protocol-only, not confidence, residue, verdict, or promotion. | covered |
| O6: Keep definitions authoritative. | D40/D23 wording changes happen in `DEFINITIONS.md`; ontology docs reference rather than redefine. | covered |
| O7: Sync definitions lookup. | Remove the stale D23 legacy alias from `DEFINITIONS-INDEX.md`. | covered |
| O8: Validate. | Run path-scoped diff check, ASCII/whitespace scan, dispatch validation, and active-doc legacy scan. | covered |

## Selected Sources

| Source | Selectors | Why Included |
| --- | --- | --- |
| `WORK-PACK.md` | SWU-OCON-004 row and BLK-OCON-001. | Controls task selection, write scope, done criteria, and validation. |
| `work-pack/tasks/TASK-OCON-003.md` | SWU-OCON-004 contract. | Defines downstream sync after the owner receipt. |
| `TASK-SESSION-SWU-OCON-003.md` | Owner update and gate verdict. | Confirms legacy active-schema support was removed from the receipt. |
| `authority/definitions/reviews/2026-06-30-challenge-contract-confidence-axis-review.md` | Decision gate receipt and allowed mutation scope. | Controls canonical field names and protocol-only challenge contract wording. |
| `cyberAlchemy-v2/ontology/NODE-MODEL.md` | Node concept contract and minimum shape. | Target file with nested legacy `confidence_reference`. |
| `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Candidate record shape. | Target file with package-level nested `confidence_reference`. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D23` | Authority lifecycle axis. | Canonical source for evidence/commitment split and aliases. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D40` | Challenge contract. | Canonical source for challenge contract semantics. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS-INDEX.md` | D23/D40 terms and alias lookup. | Lookup sync for the D23 alias change. |
| `ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md` | G7/G8 placement rule. | Confirms top-level node confidence and protocol-only challenge contract. |
| prior memory boundary notes | ontology supporting role and distinct control surfaces. | Reinforces that ontology docs instantiate authority decisions rather than owning them. |

## Controlling Constraints

- Do not write specs or DomainSpec v2 project guidance in this SWU.
- Do not mutate historical import evidence; old source vocabulary may remain
  there as evidence.
- Do not add a third confidence axis.
- Do not make `challenge_contract` contain node confidence, node residue,
  verdict, promotion state, or owner decision.
- Keep definitions changes narrow to D23/D40 wording plus lookup sync.

## Decisions

| Decision | Type | Selected Option | Rationale |
| --- | --- | --- | --- |
| Challenge contract placement. | receipt-bound | Make confidence top-level and keep challenge contract protocol-only. | This follows the receipt and the G8 placement rule. |
| Legacy key handling. | receipt-bound | Remove active-schema alias support. | Owner clarified no active consumer needs the old keys. |
| Definitions index sync. | required by definitions-governance | Update the lookup alias table. | D23 alias changes must remain discoverable and non-stale. |

## Strict Coverage

Strict coverage: pass. Every SWU obligation has source evidence, a bounded
write scope, and validation surface. Runtime handoff is not used.
