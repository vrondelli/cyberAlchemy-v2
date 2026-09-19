---
feature_code: DSD1
docType: cross-task-gaps
status: draft
updatedAt: 2026-07-11
---

# Cross-Task Gaps: DS-D1 Improvement Plan

## Decisions

| ID | Blocks | Question | Allowed Outcomes | Next SWU |
| --- | --- | --- | --- | --- |
| DEC-DSD1-UI11-PATH | UI implementation | Should UI 11 become DS-D1 categories now? | add-ui, narrow-claim, explicit-defer | SWU-DSD1-003 |
| DEC-DSD1-SAGA-FORK | resolved | Collapse selected; hardening branch cancelled. | collapse | SWU-DSD1-007/009; SGRM-001..008 |

## Evidence Gaps

| ID | Scope | Meaning | Repair |
| --- | --- | --- | --- |
| GAP-DSD1-SEMANTIC-DEPTH | backend 13 | Some types need finite laws beyond schema shape. | SWU-DSD1-010..012 |
| GAP-DSD1-CRITERION-RULES | validators | Some hardening may require new validator rule kinds. | SWU-DSD1-013 |
| GAP-DSD1-CATEGORY-LAWS | future research | Full category identity/composition laws are not yet formalized. | Separate research/design route |

## Residue Policy

Residue is acceptable only when it is named, owner-routed, and excluded from
completion claims. Hidden residue blocks closeout.

## Escalation Rule

Escalate back to definitions-governance if a task needs to change canonical
category status. Escalate to relationship authority if a task needs to change
DS-D8 signatures, generated/deferred/deprecated relationship states, or
`orchestrates` behavior.
