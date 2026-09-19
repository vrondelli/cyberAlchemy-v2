---
node_type: context-pack
is_session: false
status: pass
created: 2026-07-10
authored_by: task-session + context-builder (lean)
task_reference: SWU-R1A-002B
work_pack: ./WORK-PACK.md
strict_coverage: pass
handoff_pack: none
---

# Context Pack - SWU-R1A-002B

## Context Pack Summary

- Task: `SWU-R1A-002B`
- Mode: lean
- Files selected: 10
- Snippets selected: 14
- Obligation coverage: 100%
- Noise ratio: low
- Handoff pack: none
- Strict coverage: pass
- Blockers: 0

## Selected Task Contract

`SWU-R1A-002B` synchronizes parent R1 status after `SWU-R1A-002A` proved the
AXIOMS definition-sync repair. It may close R1, but it must not hide R2, R5,
R6a, or R6b residue.

Declared write scope:

- `projects/domainspec-v2/IMPORT-MANIFEST.md`
- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/CRAFT.md`
- local closeout receipts

Related status artifact included to prevent stale contradiction:

- `projects/domainspec-v2/development/reformulate-batch1/WORK-PACK.md`

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Mark R1/AXIOMS as reformulated in the import manifest. | `SWU-R1A-002B` work-pack row; SWU-R1A-001 and 002A receipts. | covered |
| O2 | Update Craft source ledger next moves so R1 is closed. | `.craft/ledger.yml` stale R1 next moves. | covered |
| O3 | Preserve R2, R5, R6a, and R6b as open residue. | parent Batch-1 work-pack; original R1 closeout work-pack. | covered |
| O4 | Keep `GAP-SH-PROSE-HOMES` open for DRIFT/R5 only. | ledger gap row; R1 receipts. | covered |
| O5 | Update human Craft view to match the source ledger. | `CRAFT.md` stale human view. | covered |
| O6 | Update task records so `SWU-R1A-002B` is complete. | definition-sync work-pack; original R1 closeout work-pack. | covered |
| O7 | Validate full implementation gates after sync. | work-pack validation surface. | covered |
| O8 | Emit task-session receipt and observability signal. | task-session observability contract. | covered |

## Included Context

| Source | Selectors | Why Included |
| --- | --- | --- |
| `.agents/skills/task-session/SKILL.md` | process, quality bar, output contract | Governs execution. |
| `.agents/skills/context-builder/SKILL.md` | obligation matrix and strict coverage | Required context-pack sigil. |
| `definition-sync-repair/WORK-PACK.md` | `SWU-R1A-002B` handoff row | Controls selected SWU. |
| `definition-sync-repair/TASK-SESSION-SWU-R1A-002A.md` | completion evidence | Proves prerequisite passed. |
| `IMPORT-MANIFEST.md` | Batch-1 AXIOMS row | Parent migration ledger target. |
| `.craft/ledger.yml` | next moves, descriptions, gap row, artifact notes | Source-of-truth Craft target. |
| `CRAFT.md` | quick links, contexts, pending by node | Human Craft mirror target. |
| `development/reformulate-batch1/WORK-PACK.md` | R1 row and Batch-1 sequencing | Related task record to prevent stale contradiction. |
| `r1-axioms-closeout/WORK-PACK.md` | original SWU-R1A-002 algorithm | Original parent-sync task record. |
| `TASK-SESSION-SWU-R1A-001.md` | R1 authority-home receipt | Proves original R1 closeout step passed. |

## Gate Checks

| Gate | Result | Notes |
| --- | --- | --- |
| exactly_one_task | pass | Selected `SWU-R1A-002B`. |
| dependencies | pass | `SWU-R1A-002A` is complete and routes here. |
| write_scope | pass | Parent sync files plus related task records/receipts. |
| blocker_decisions | pass | No new decision needed; parent sync follows accepted receipts. |
| residue_preservation | pass | R2, R5, R6a, R6b stay open. |
| runtime_handoff | n/a | Local execution only. |
| subagents | n/a | No subagents requested or spawned. |
| validation_surface | pass | Full implementation gates plus YAML/observability/diff checks. |

## Execution Assumptions

- `GAP-SH-PROSE-HOMES` remains active as a DRIFT/R5 gap after the AXIOMS half
  closes.
- R1 closeout can be recorded as reformulated because both the authority-home
  and definition-sync receipts passed validation.
- Parent Batch-1 work-pack may be updated as a related status artifact because
  it otherwise contradicts the manifest/Craft closeout.
