---
artifact_role: task-session-context-pack
task: SWU-R3C-006
mode: standard
strict_coverage: pass
created: 2026-07-12
---

# Context Pack — SWU-R3C-006

## Scope

Execute only the relationship-card triage unit of `TASK-R3C-CARDS`. Accepted
governed findings supply the 35 keyed decisions. This parent session creates a
non-authoritative relationship staging matrix, validates it, records a receipt,
synchronizes R3 and APE, and closes the scoped Craft gap because SWU-R3C-005
already has its own receipt.

## Obligation matrix

| ID | Obligation | Controlling evidence | Coverage |
|---|---|---|---|
| O1 | Preserve exactly 35 keyed rows: 29 v1-card-present plus 6 no-v1-card. | accepted relationship-card findings and auditor ACCEPT | covered |
| O2 | Preserve final outcomes: 24 evidence-ready, 6 staged-review, 3 deferred, 2 reject-or-superseded. | accepted findings | covered |
| O3 | Generated, deprecated, and deferred DS-D8 states cannot become active authored cards. | task contract; live `relationships.yml`; findings | covered |
| O4 | Preserve provenance: v1 pin plus live modified-working-authority SHA-256; do not claim the 30-signature file is committed HEAD. | findings provenance boundary | covered |
| O5 | Preserve scoped example utility, subset qualifiers, and unresolved authority residue without editing DS-D8. | findings reviewer adjudication and row actions | covered |
| O6 | Review structure and run `validate:docs`; all staging links must resolve. | SWU validation and acceptance contract | covered |
| O7 | Synchronize R3/APE and close `GAP-DSV2-APE-CARD-TRIAGE` only after both SWU receipts exist. | task Synchronization section; Craft ledger; SWU-R3C-005 receipt | covered |
| O8 | Verify the governed dispatch has seven joined/closed agents and exactly one dispatch plus one close row. | dispatch ledger and accepted findings | covered |

## Included context

| Source | Selectors | Obligation refs |
|---|---|---|
| `work-pack/tasks/TASK-R3C-CARDS.md` | SWU-R3C-006 and Synchronization | O1, O3, O6, O7 |
| `research/2026-07-12-relationship-card-triage/findings.md` | authority boundary, reviewer adjudication, 35-row matrix, parent handoff | O1-O7 |
| `definitions/relationships/relationships.yml` | 30 active, generated, deferred, deprecated sections | O3-O5 |
| `task-sessions/2026-07-12-swu-r3c-005/TASK-SESSION-RESULT.md` | first card-triage receipt | O7 |
| `development/r3-closeout-plan/WORK-PACK.md` | SWU, blocker, gap, gate, and change-log rows | O6-O8 |
| `development/architecture-pattern-enforcement/WORK-PACK.md` | TASK-CARDS / SWU-APE-007 route | O7 |
| `.craft/ledger.yml` and `CRAFT.md` | scoped gap authority and human projection | O7 |
| `telemetry/agents/subagents-dispatch.yaml` | dispatch and close rows | O8 |

## Decision and trade-off

Selected: create one matrix at
`development/architecture-pattern-enforcement/cards/relationships/README.md`.

- Copying the 29 legacy rows would reproduce incomplete or deprecated semantics.
- Creating six files for authority-only entries would falsely imply that v1
  supplied cards or that this task owns new canonical authoring.
- A keyed matrix can preserve source presence, current DS-D8 state, provenance,
  scoped utility, outcome, residue, and next owner action without authority
  transfer.

This is a non-blocking representation choice inside the declared staging scope.

## Gate verdict

PASS. SWU-R3C-005 is complete, the separately confirmed research dispatch is
closed `resolved`, the final auditor accepted the 35-row result, the write scope
and validation surface are explicit, and no owner decision is needed to stage
the accepted classification.

## Excluded context

- DS-D8 mutation and definition promotion: outside this task and explicitly
  prohibited by accepted findings.
- Individual UI/backend concept cards: already handled or owned by other units.
- Future-candidate promotion criteria: owned by SWU-R3C-007, not this triage.

## Planned validation

1. Check 35 unique rows, 29/6 presence, and exact 24/6/3/2 outcomes.
2. Check all local links resolve and forbidden state inflation is absent.
3. Run `npm --prefix projects/domainspec-v2/impl run validate:docs`.
4. Parse Craft YAML, verify the gap leaves `indexes.active_gaps`, and confirm
   both receipts exist.
5. Verify dispatch lifecycle and run scoped `git diff --check`.
