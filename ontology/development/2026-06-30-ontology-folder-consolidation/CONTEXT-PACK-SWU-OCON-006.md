---
node_type: task-session-context-pack
is_session: true
status: complete
boundary: INTERNAL - session evidence only
created: 2026-06-30
task: TASK-OCON-VERIFY
swu: SWU-OCON-006
mode: lean
---

# Context Pack: SWU-OCON-006

## Task

Verify the selected ontology-folder consolidation execution scope, synchronize
the remaining receipts, and avoid claiming promotion readiness for candidate
or local evidence.

## Obligation Matrix

| Obligation | Required Evidence | Coverage |
| --- | --- | --- |
| O1: Implementation receipts exist. | SWU-OCON-001 through SWU-OCON-005 task-session receipts and the challenge-contract review receipt. | covered |
| O2: Dispatch route validates. | `PLAN-DISPATCH.json` plus dispatch-spec validator. | covered |
| O3: Changed Markdown is clean. | Work-pack and selected touched source paths have diff/whitespace validation. | covered |
| O4: Authority boundaries hold. | CAV2 ontology remains a modeling/support surface; definitions own meaning; specs remain gated targets. | covered |
| O5: `projects/ontology` is preserved. | SWU-OCON-001 and SWU-OCON-002 receipts plus the witness README/crosswalk. | covered |
| O6: Challenge-contract mutation has owner receipt. | SWU-OCON-003 review receipt controls SWU-OCON-004 source sync. | covered |
| O7: Inventory refresh is gated. | SWU-OCON-005 kept DomainSpec v2 guidance candidate/local; inventory refresh should be deferred unless intentionally promoted or requested. | covered |
| O8: Closeout records are synchronized. | `WORK-PACK.md`, `EXECUTION-PACK.md`, TASK-OCON-VERIFY, W4, gaps, and traceability. | covered |

## Selected Sources

| Source | Selectors | Why Included |
| --- | --- | --- |
| `WORK-PACK.md` | Task board, SWU manifest, blockers, gate checks. | Controls SWU-OCON-006 scope and final synchronization. |
| `EXECUTION-PACK.md` | W4 schedule, expected receipts, validation commands. | Defines closeout receipt expectations. |
| `work-pack/tasks/TASK-OCON-VERIFY.md` | Verification checklist and validation surface. | Defines closure task done criteria. |
| `work-pack/waves/W4.md` | Promotion evidence and gate. | Confirms W4 is verification-only after implementation. |
| `TASK-SESSION-SWU-OCON-001.md` | Folder-role bridge receipt. | Confirms `projects/ontology` was preserved as witness material. |
| `TASK-SESSION-SWU-OCON-002.md` | Crosswalk receipt. | Confirms harvest material was mapped into CAV2 context without collapse. |
| `TASK-SESSION-SWU-OCON-003.md` and the definitions review receipt. | Owner decision and receipt. | Confirms challenge-contract wording was owner-gated. |
| `TASK-SESSION-SWU-OCON-004.md` | Source-sync receipt. | Confirms active docs use canonical confidence fields and no third confidence axis. |
| `TASK-SESSION-SWU-OCON-005.md` | DomainSpec v2 guidance receipt. | Confirms local/candidate status and specs boundary. |
| `work-pack/shared/cross-task-gaps.md` | GAP-OCON-003. | Controls the inventory refresh decision. |
| prior memory boundary notes | Ontology-owner split and project-local promotion boundary. | Keeps the closeout from promoting candidate/local guidance through inventory by accident. |

## Controlling Constraints

- Do not write public `arcanum/` or collapse private evidence into public
  source.
- Do not change `cyberAlchemy-v2/specs/` during verification.
- Do not treat DomainSpec v2 ontology guidance as promoted authority.
- Do not refresh inventory unless new durable entries are intentionally added.
- Synchronize status only after validation evidence exists.

## Decisions

| Decision | Type | Selected Option | Rationale |
| --- | --- | --- | --- |
| Verification target. | required | Close selected SWU-OCON-001 through SWU-OCON-005 scope. | All selected implementation slices have receipts and W4 depends on them. |
| Inventory refresh. | deferrable | Defer refresh. | The new DomainSpec v2 guidance is candidate/local and session evidence remains planning evidence; refresh after stabilization, promotion, or explicit request. |
| Completion status. | required | Mark W4, TASK-OCON-VERIFY, SWU-OCON-006, execution pack, and work-pack complete after validation. | Verification is the final selected slice and no blocker remains for this work-pack. |

## Strict Coverage

Strict coverage: pass. Every verification obligation has bounded source
evidence, a declared validation surface, and a synchronization target. Runtime
handoff is not used.
