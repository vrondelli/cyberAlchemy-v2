---
node_type: context-pack
is_session: true
status: pass
created: 2026-07-10
authored_by: task-session + context-builder
task: CT-1
mode: lean
strict_coverage: pass
---

# Context Pack - CT-1

## Task

Execute `CT-1`: make `validate-code-tags` load the canonical concept type set
from root meta-type schema files under `impl/spec/meta-types/**/*.schema.yml`
instead of parsing the `impl/spec/TAXONOMY.md` projection.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Keep CT-1 scoped to the code-tag taxonomy source only. | `WORK-PACK.md` CT-1 row; `implementation-layering.md` L0 split. | covered |
| O2 | Read `meta_type:` from the meta-type schema files and return the same `Map<normalized, display>` shape as `parseTaxonomyTypes`. | `WORK-PACK.md` CT-1 detail; existing `parseTaxonomyTypes` contract. | covered |
| O3 | Preserve `parseTaxonomyTypes` for tests/back-compat. | `WORK-PACK.md` CT-1 detail. | covered |
| O4 | Make the validator default `--taxonomy` source the schema root, not `spec/TAXONOMY.md`. | `WORK-PACK.md` CT-1 default-path requirement. | covered |
| O5 | Preserve CT-VAL-001 behavior for an empty/missing taxonomy source. | `WORK-PACK.md` CT-1 edge cases. | covered |
| O6 | Add a discriminating fixture showing invalid concept types still fail. | `WORK-PACK.md` CT-1 validation. | covered |
| O7 | Prove validation works with `spec/TAXONOMY.md` absent from the read path. | `WORK-PACK.md` CT-1 verification. | covered |
| O8 | Leave UI-11 migration, waivers, schema contract, and unified gate out of CT-1. | `DESIGN.md` load-bearing interactions; `WORK-PACK.md` CT-2/CT-3/CT-4 rows. | covered |

## Included Context

| Source | Selectors | Obligation refs |
| --- | --- | --- |
| `development/code-tag-conformance/WORK-PACK.md` | CT-1 row, detail, validation, cross-pack ledger. | O1-O8 |
| `development/code-tag-conformance/DESIGN.md` | taxonomy source decision, R2 prerequisite, UI inheritance. | O1, O4, O8 |
| `development/code-tag-conformance/implementation-layering.md` | L0 promotion evidence and dependency order. | O1, O6, O7 |
| `impl/governance/tags/tools/lib/code-tag-rules.ts` | existing taxonomy parser and R0 relationship-authority adapter. | O2, O3 |
| `impl/governance/tags/tools/validate-code-tags.ts` | `--taxonomy` default, CT-VAL-001, taxonomy membership check. | O4, O5 |
| `impl/governance/tags/tools/tests/code-tag-tools.test.ts` | current extraction/validation fixtures and test harness. | O6, O7 |
| `impl/spec/meta-types/**/*.schema.yml` | canonical backend-14 `meta_type` fields. | O2, O4 |
| `.craft/ledger.yml` / `CRAFT.md` | `GAP-SH-UI11-MIGRATE`; CT-1 prerequisite of R2. | O7, O8 |

## Decisions

No blocker-level decision is open for CT-1. The plan already selects schema
files over `meta-types.yml` because the schema files are the validator's
machine source of truth and will recognize UI types when UI schemas exist.

## Constraints

- Do not delete `impl/spec/TAXONOMY.md` in CT-1.
- Do not migrate or define the 11 UI meta-types in CT-1.
- Do not reset waivers or edit `CODE-TAG-SCHEMA.md` in CT-1.
- Do not author `code-tag.schema.yml` or fold code-tags into `npm run validate`.
- Do not touch engine derivation rules.

## Validation Surface

- `npm --prefix projects/domainspec-v2/impl run tags:test`
- `npm --prefix projects/domainspec-v2/impl run validate`
- `npm --prefix projects/domainspec-v2/impl run engine:test`
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- Scratch verification: run `validate-code-tags` with a missing
  `--taxonomy spec/TAXONOMY.missing.md` equivalent and confirm CT-VAL-001;
  run default validation over fixture output and confirm root schema loading.

## Context Pack Summary

- Task: `CT-1`
- Mode: lean
- Files selected: 7 direct files plus schema glob
- Obligation coverage: 100%
- Noise ratio: low
- Output markdown: this file
- Output index: none
- Handoff pack: none
- Session evidence path: `development/code-tag-conformance/`
- Strict coverage: pass
- Blockers: 0
