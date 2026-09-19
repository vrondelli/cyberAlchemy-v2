---
artifact: invoke-refresh-context
status: complete
updatedAt: 2026-07-18
mode: standard-strict
---

# Refresh Context: Evolvable Validation Framework Relocation

## Task

Refresh the current Invoke-authored graph composability package and relocate it
from the research evidence tree to the DomainSpec v2 development tree without
changing its implementation or release status.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| R1 | resolve exactly one source package | pre-move manifest of `research/evolvable-validation-framework/invoke/` | covered |
| R2 | resolve an empty, appropriate destination | `projects/domainspec-v2/development/` inventory and collision check | covered |
| R3 | preserve research as evidence authority | `research/evolvable-validation-framework/findings.md` | covered |
| R4 | preserve the v1 aspect decision | `V1-ASPECT-ADOPTION.md` | covered |
| R5 | repair paths and write scope after relocation | `DEFINE.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `DISPATCH-SPEC.json` | covered |
| R6 | preserve lifecycle state | `PLAN.md`, `WORK-PACK.md`, `DISTILL-VALIDATION.md` | covered |
| R7 | emit governed refresh evidence | `REFRESH-REPORT.md`, `refresh-report.json`, `REFRESH-DISPATCH.json` | covered |
| R8 | validate the relocated package | Dispatch validator, JSON parse, link check, `git diff --check` | covered |

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `.arcanum/inventory/index.json` | entries matching evolvable/composability/test derivation | R1-R3; confirms existing research entries and no competing development package |
| `research/evolvable-validation-framework/findings.md` | structural substrate, witnesses, gaps | R3 |
| `development/evolvable-validation-framework/DEFINE.md` | source evidence, candidate contracts, v1 decision | R4-R5 |
| `development/evolvable-validation-framework/V1-ASPECT-ADOPTION.md` | aspect matrix and gate | R4 |
| `development/evolvable-validation-framework/PLAN.md` | status, objective, next route | R6 |
| `development/evolvable-validation-framework/WORK-PACK.md` | control fields, first SWU, write scope | R5-R6 |
| `development/evolvable-validation-framework/DISPATCH-SPEC.json` | target path and authority boundaries | R5-R8 |
| `.agents/skills/invoke/refresh.md` | apply-approved refresh gates and outputs | R7-R8 |

## Excluded Candidates

- `development/first-production-release/**`: related downstream work, but not
  part of this relocation and already contains unrelated user changes.
- v1 application feature folders: useful later as fixtures, but not needed to
  prove the package move.
- runtime source and test-engine code: no implementation task is authorized by
  this refresh.

## Context Builder Result

- Mode: standard, strict
- Files selected: 8
- Obligation coverage: 8/8
- Runtime handoff: none
- Strict coverage: pass
- Blockers: 0
