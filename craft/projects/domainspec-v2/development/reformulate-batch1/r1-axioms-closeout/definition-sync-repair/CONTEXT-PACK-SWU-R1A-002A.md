---
node_type: context-pack
is_session: false
status: pass
created: 2026-07-10
authored_by: task-session + context-builder (lean)
task_reference: SWU-R1A-002A
work_pack: ./WORK-PACK.md
strict_coverage: pass
handoff_pack: none
---

# Context Pack - SWU-R1A-002A

## Context Pack Summary

- Task: `SWU-R1A-002A`
- Mode: lean
- Files selected: 8
- Snippets selected: 12
- Obligation coverage: 100%
- Noise ratio: low
- Handoff pack: none
- Strict coverage: pass
- Blockers: 0

## Selected Task Contract

`SWU-R1A-002A` applies the CAV2 definition-sync metadata/classification patch
to the R1 AXIOMS authority pair:

- `projects/domainspec-v2/authority/AXIOMS.md`
- `projects/domainspec-v2/authority/AXIOMS.yml`
- local task-session receipt

It must preserve R1 substance, A2/C6 semantics, Saturn routing, and
`impl/spec/AXIOMS.md` non-authority status.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Patch `AXIOMS.md` with CAV2-D49/D53/D54 alignment framing. | `WORK-PACK.md` execution detail; findings recommended patch shape. | covered |
| O2 | Classify A1/A2/A3 as D54-shaped. | findings row-level repair; CAV2-D53/D54 definitions. | covered |
| O3 | Preserve A4/A6 routed and A5 split-routed. | findings row-level repair; current `AXIOMS.md` routed table. | covered |
| O4 | Patch `AXIOMS.yml` with root `cav2_alignment` and row metadata. | findings YAML shape; current `AXIOMS.yml`. | covered |
| O5 | Rename A2 `validates` to non-enforcement metadata. | findings row A2; work-pack execution detail. | covered |
| O6 | Do not add first-class `axiom` or `invariant` authority kinds. | CAV2-D49; findings rejected option. | covered |
| O7 | Do not rename files or split a new invariant surface. | user decision answer; findings rejected option. | covered |
| O8 | Validate YAML, DomainSpec implementation, forbidden-kind scan, and diff. | work-pack validation commands. | covered |
| O9 | Record local task-session receipt and route next to `SWU-R1A-002B`. | work-pack completion criteria. | covered |

## Included Context

| Source | Selectors | Why Included |
| --- | --- | --- |
| `.agents/skills/task-session/SKILL.md` | objective, steps 1-9, output contract | Governs this execution loop. |
| `.agents/skills/context-builder/SKILL.md` | process, handoff contract, quality bar | Required context-pack sigil for task-session. |
| `definition-sync-repair/WORK-PACK.md` | task board, SWU handoff, validation commands, completion criteria | Controls selected SWU. |
| `definition-sync-repair/DEFINE.md` | scope, out-of-scope, acceptance criteria, decision posture | Bounds mutation and decisions. |
| `definition-sync-repair/DESIGN.md` | six views, row classification table, dependency interface | Controls patch design. |
| `definition-sync-repair/implementation-layering.md` | L0-L5 boundaries and risk controls | Prevents parent sync and upstream CAV2 edits. |
| `research/axiom-definition-sync-fix/findings.md` | verdict matrix, row-level repair, exact patch shape | Accepted semantic repair evidence. |
| `authority/AXIOMS.md` and `authority/AXIOMS.yml` | full current files | Patch targets. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | CAV2-D49, CAV2-D53, CAV2-D54 snippets | Canonical semantic source for classification. |

## Gate Checks

| Gate | Result | Notes |
| --- | --- | --- |
| exactly_one_task | pass | Selected `SWU-R1A-002A`. |
| dependencies | pass | SWU-R1A-001 is recorded complete in the work-pack. |
| write_scope | pass | Only `AXIOMS.md`, `AXIOMS.yml`, local receipt, and local task record evidence. |
| blocker_decisions | pass | No new decision needed for minimal repair. |
| runtime_handoff | n/a | Local execution only; no runtime delegation. |
| subagents | n/a | No subagents requested or spawned. |
| validation_surface | pass | YAML parse, implementation validate, forbidden-kind scan, diff check. |

## Execution Assumptions

- The user's file-name question is resolved: keep `AXIOMS.{md,yml}` as the R1
  continuity surface and classify rows as invariant-shaped instead of renaming.
- `authority_kind_rollup: Definition` is cataloging metadata only and does not
  convert rows into glossary definitions.
- Parent sync remains deferred to `SWU-R1A-002B`.
