---
task_reference: SWU-DSD1-001
mode: standard
status: complete
created: 2026-07-11
handoff_kind: local-task-context
authority: session evidence only
---

# Context Pack: SWU-DSD1-001

## Objective

Align DS-D1 status/read-model surfaces so backend `DS-D1.1..14` are described
as shape/fixture-backed candidates, UI `DS-D1.15..25` as formation-deferred,
and DS-D8 endpoint use as evidence pressure rather than DS-D1 authority.

## Obligation Matrix

| ID | Obligation | Evidence | Coverage |
| --- | --- | --- | --- |
| O1 | Root machine view distinguishes the 14 registered backend members from the 25-name candidate catalog. | `definitions/meta-types/meta-types.yml` top-level registry fields | covered |
| O2 | Root human view states the same maturity boundary. | `definitions/meta-types/meta-types.md` status block | covered |
| O3 | Candidate and definitions planning trails use the same staged language. | `development/meta-type-definitions/{CANDIDATES,WORK-PACK}.md` | covered |
| O4 | Formalization work-pack does not imply all 25 are formalized. | `development/meta-type-formalization/WORK-PACK.md` objective and MT5 row | covered |
| O5 | Craft source and human view agree. | `.craft/ledger.yml` context row; `CRAFT.md` child row | covered |
| O6 | No schema, fixture, validator, or DS-D8 authority mutation occurs. | SWU write scope and scoped diff review | covered |

## Selected Sources

| Source | Selector | Obligation |
| --- | --- | --- |
| DS-D1 boundary findings | Executive Finding, Core Conclusion, Authority Ownership | O1-O5 |
| TASK-DSD1-LEDGER | Objective, Implementation Notes, Acceptance Evidence | O1-O6 |
| DS-D1 improvement WORK-PACK | SWU-DSD1-001 row and gate checks | O1-O6 |
| `meta-types.yml` | top-level registry plus member count | O1 |
| `meta-types.md` | status and definition preamble | O2 |
| `CANDIDATES.md` | Tier 1 backend/UI split | O3 |
| meta-type definitions WORK-PACK | DD2/DD4 status | O3 |
| meta-type formalization WORK-PACK | objective, MT0-MT5 status | O4 |
| `.craft/ledger.yml` | CTX-DSV2-META-TYPE-FORMALIZATION | O5 |
| `CRAFT.md` | child context and pending-by-node rows | O5 |

## Constraints

- Preserve all per-type schemas, fixtures, challenge contracts, and confirm
  contracts.
- Do not create UI members or claim UI promotion.
- Keep root definitions as the authority read model.
- Keep `TAXONOMY.md` and `LEARNING-ORDER.md` projection drift for conditional
  SWU-DSD1-002.

## Decisions And Assumptions

- Non-blocking representation decision: preserve the 25-name candidate catalog
  while recording 14 registered backend members and 11 deferred UI candidates
  separately.
- No owner or policy decision is consumed by this SWU.

## Write Scope

DS-D1 maturity/read-model prose and metadata, Craft source/human views, Task
Session evidence, and work-pack status synchronization after validation.

## Validation Surface

- YAML parse for machine/Craft ledgers.
- `npm --prefix projects/domainspec-v2/impl run validate:docs`.
- staged-language and member-count checks.
- scoped no-schema/no-validator diff guard.
- `git diff --check`.

## Context Builder Result

- Files selected: 10.
- Strict obligation coverage: pass.
- Runtime handoff: none; local execution.
- Fallback search: none beyond the Craft source-of-truth link.
- Blockers: none.
