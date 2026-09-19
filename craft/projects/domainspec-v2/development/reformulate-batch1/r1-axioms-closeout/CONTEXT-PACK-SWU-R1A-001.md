---
node_type: context-pack
is_session: true
status: pass
created: 2026-07-09
authored_by: task-session + context-builder
task: SWU-R1A-001
mode: lean
strict_coverage: pass
---

# Context Pack - SWU-R1A-001

## Task

Execute `SWU-R1A-001`: create the canonical DomainSpec v2 AXIOMS authority
home pair, bind A2 to C6, preserve Saturn routing pointers, and remove
independent authority from `impl/spec/AXIOMS.md`.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Create `authority/AXIOMS.{md,yml}` as the canonical home pair. | `WORK-PACK.md` SWU row and design views, refreshed by `INVOKE-REFRESH-AXIOMS-YML.md`. | covered |
| O2 | Retain A1, A2, and A3-recast only. | `.craft/ledger.yml` `DEC-B1-SATURN-AXIOM-SCOPE`. | covered |
| O3 | Route A4, A6, and A5-reflection to Saturn as pointers. | `.craft/ledger.yml` `DEC-B1-SATURN-AXIOM-SCOPE`. | covered |
| O4 | Bind A2 to C6/layering adapter-line. | `authority/constitutions/domainspec-v2-CONSTITUTION.md` C6. | covered |
| O5 | Remove or de-authorize `impl/spec/AXIOMS.md`. | `DEC-DSV2-SPEC-HOMING`, `GAP-SH-PROSE-HOMES`, SWU row. | covered |
| O6 | Keep R2, R5, R6a/R6b, manifest, and Craft sync out of SWU-R1A-001. | `WORK-PACK.md` SWU split and gate checks. | covered |
| O7 | Validate with `npm run validate` from `projects/domainspec-v2/impl`. | SWU validation surface. | covered |

## Included Context

| Source | Selectors | Obligation refs |
| --- | --- | --- |
| `WORK-PACK.md` | SWU-R1A-001 row; execution algorithm; gate checks. | O1-O7 |
| `INVOKE-REFRESH-AXIOMS-YML.md` | Machine-readable companion correction. | O1, O7 |
| `DEFINE.md` | Scope and acceptance definition. | O1-O6 |
| `DESIGN.md` | Owner-home, projection cleanup, failure path, decision defaults. | O1-O6 |
| `.craft/ledger.yml` | `DEC-DSV2-SPEC-HOMING`; `DEC-B1-SATURN-AXIOM-SCOPE`; `GAP-SH-PROSE-HOMES`. | O2, O3, O5 |
| `impl/spec/AXIOMS.md` | Current A1-A6 imported text. | O1-O5 |
| `authority/constitutions/domainspec-v2-CONSTITUTION.md` | C5 and C6 selectors, especially adapter-line wording. | O4 |
| `README.md` and `authority/source-spine.md` | Live project/source references to AXIOMS. | O5 |

## Decisions

No blocker-level decision is open. The planned projection branch is executable:
delete `impl/spec/AXIOMS.md` first; if validation requires the path, restore it
as a non-authority redirect stub.

## Constraints

- Do not put axioms under `definitions/`.
- Do not duplicate independent axiom authority in `impl/spec`.
- Do not create a Saturn folder or Saturn authority spine.
- Do not edit engine `src/rules`.
- Do not update `IMPORT-MANIFEST.md`, `.craft/ledger.yml`, or `CRAFT.md` in
  this SWU; those belong to `SWU-R1A-002`.

## Validation Surface

- `npm --prefix projects/domainspec-v2/impl run validate`
- `python3 -c "import yaml; yaml.safe_load(open('projects/domainspec-v2/authority/AXIOMS.yml'))"`
- `git diff --check -- projects/domainspec-v2/authority/AXIOMS.md projects/domainspec-v2/authority/AXIOMS.yml projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md projects/domainspec-v2/authority/source-spine.md projects/domainspec-v2/README.md projects/domainspec-v2/impl/spec/AXIOMS.md projects/domainspec-v2/development/reformulate-batch1/r1-axioms-closeout`

## Context Pack Summary

- Task: `SWU-R1A-001`
- Mode: lean
- Files selected: 8
- Snippets selected: 10
- Obligation coverage: 100%
- Noise ratio: low
- Output markdown: this file
- Output index: none
- Handoff pack: none
- Session evidence path: this work-pack folder
- Strict coverage: pass
- Blockers: 0
