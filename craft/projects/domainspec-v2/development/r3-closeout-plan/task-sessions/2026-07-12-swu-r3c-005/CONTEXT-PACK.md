---
artifact_role: task-session-context-pack
task: SWU-R3C-005
mode: lean
strict_coverage: pass
created: 2026-07-12
---

# Context Pack — SWU-R3C-005

## Scope

Execute only the backend concept-card triage unit of `TASK-R3C-CARDS`. The
accepted governed research result supplies the classification; this parent
session materializes a non-authoritative staging matrix, records per-card
provenance in the import manifest, validates documentation, and synchronizes
the two work packs. Relationship-card triage remains `SWU-R3C-006`.

## Obligation matrix

| ID | Obligation | Controlling evidence | Coverage |
|---|---|---|---|
| O1 | Exactly 14 backend source cards have one triage state and provenance. | `work-pack/tasks/TASK-R3C-CARDS.md` SWU-R3C-005; accepted `research/2026-07-12-backend-card-triage/findings.md` matrix | covered |
| O2 | Copied or linked material cannot become authority by copy. | task objective and done criteria; findings authority boundary; `definitions/meta-types/meta-types.md` maturity ledger | covered |
| O3 | v1 remains read-only and pinned to commit `33859b561dc34e3d0b9cb3da76b6cb3d196daa65`. | `IMPORT-MANIFEST.md` frontmatter/freeze gate; findings provenance | covered |
| O4 | The staging surface preserves scoped useful evidence and unsafe residue. | findings reviewer-adjudicated 14-row matrix | covered |
| O5 | Import accounting records source, destination, verdict, status, and batch. | `IMPORT-MANIFEST.md` contract and legend | covered |
| O6 | Documentation validation passes and links resolve. | task validation/acceptance criteria | covered |
| O7 | Work-pack status reflects SWU-R3C-005 only; the Craft card-triage gap stays open until SWU-R3C-006. | task Synchronization section; R3 and APE work packs | covered |
| O8 | Governed dispatch lifecycle is closed before task completion. | `telemetry/agents/subagents-dispatch.yaml` open/close rows for `2026-07-12-r3c-backend-card-triage` | covered |

## Included context

| Source | Selectors | Obligation refs |
|---|---|---|
| `work-pack/tasks/TASK-R3C-CARDS.md` | objective, triage states, SWU-R3C-005, synchronization | O1, O2, O6, O7 |
| `research/2026-07-12-backend-card-triage/findings.md` | accepted matrix, disagreement, parent handoff | O1, O2, O3, O4, O5 |
| `IMPORT-MANIFEST.md` | manifest contract, legend, freeze gate | O3, O5 |
| `definitions/meta-types/meta-types.md` | status and authority boundary | O2 |
| `development/r3-closeout-plan/WORK-PACK.md` | SWU manifest, blockers, gate checks | O6, O7, O8 |
| `development/architecture-pattern-enforcement/WORK-PACK.md` | TASK-CARDS and SWU-APE-006 routing | O7 |
| `telemetry/agents/subagents-dispatch.yaml` | exact dispatch and close rows | O8 |

## Decision and trade-off

Selected: create one linked, non-authoritative matrix at
`development/architecture-pattern-enforcement/cards/backend/README.md`.

- Copying 14 files would preserve more raw prose, but it would duplicate stale
  relationship claims and make scoped reviewer exclusions difficult to see.
- A linked matrix preserves exact source provenance, useful evidence scope,
  unsafe residue, owner route, and current counterpart without presenting a
  legacy card body as current authority.
- This is a non-blocking representation decision inside the declared write
  scope. No definition, schema, relationship registry, or v1 source is changed.

## Gate verdict

PASS. The user-confirmed dispatch is registered and closed, the final auditor
accepted its findings, all obligations have controlling evidence, the write
scope is explicit, and the validation command is available. No blocker-level
choice remains for SWU-R3C-005.

## Excluded context

- UI cards and relationship cards: owned by later units, not needed for this
  backend-only matrix.
- Full architecture and three-pillar prose: no obligation in this bounded SWU
  depends on it.
- Definition promotion reviews: this unit stages evidence and cannot promote.

## Planned validation

1. Check the matrix has 14 unique source rows and expected state totals.
2. Check every Markdown link in the new staging matrix resolves.
3. Run `npm --prefix projects/domainspec-v2/impl run validate:docs`.
4. Run scoped `git diff --check` and verify the dispatch has one open and one
   close row.
