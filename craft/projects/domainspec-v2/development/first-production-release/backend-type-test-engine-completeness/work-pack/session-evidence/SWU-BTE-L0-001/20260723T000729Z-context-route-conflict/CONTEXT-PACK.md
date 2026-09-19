# Context Pack — SWU-BTE-L0-001 Entry Gate

Session evidence only. This document is not semantic authority and does not
select the candidate SWU.

## Summary

- Mode: `standard`, strict.
- Candidate: `SWU-BTE-L0-001`.
- Sources: 7.
- Obligations: 10 total; 6 covered, 4 blocked.
- Strict coverage: `block`.
- Runtime handoff: none.

## Controlling Resolution

`PLAN.md` gives the absolute owner home for validation inputs:

`projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/`

The relative `validation-inputs/l0/` references in `WORK-PACK.md`, the L0 task,
and `contracts/README.md` therefore resolve beneath that BTE package. The prior
Task Session receipt incorrectly expanded the target to
`projects/domainspec-v2/validation-inputs/l0`; that historical receipt is not a
safe continuation input.

The canonical L0 entry files are consequently:

- `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/l0/red-fixture-manifest.v1.json`;
- `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/l0/red-fixture-freeze-receipt.json`.

Both are absent. `selectedSWU` remains `none`. No implementation path is open.

The original gate is circular: L0 is planned to emit the manifest schema and
semantic validator, but the manifest is required to be frozen and validated
before L0 begins. Decision Gate resolved that architecture question by selecting
a split between contract publication and post-freeze execution. The active Work
Pack has not yet been reconciled to that decision, so it remains unsafe to run.

## Obligation Matrix

| ID | Obligation | Status | Evidence |
| --- | --- | --- | --- |
| `L0-RERUN-001` | Resolve exactly one candidate | covered | `WORK-PACK.md` Candidate SWU Manifest |
| `L0-RERUN-002` | Resolve the canonical validation-input home | covered | `PLAN.md` Concrete Project Homes plus package-relative contract references |
| `L0-RERUN-003` | Reject the contradictory prior continuation target | block | Prior receipt and route point outside the package-local owner home |
| `L0-RERUN-004` | Consume independent manifest and freeze receipt | block | Both canonical files are absent |
| `L0-RERUN-005` | Require explicit candidate selection after the freeze | block | `selectedSWU` is `none` and the entry evidence is absent |
| `L0-RERUN-009` | Resolve the pre-L0 manifest validation protocol | covered | Option 1 selected: contract SWU, independent freeze, execution SWU |
| `L0-RERUN-010` | Reconcile the selected protocol into executable contracts | block | Current Work Pack still defines one circular `SWU-BTE-L0-001` |
| `L0-RERUN-006` | Preserve implementation write scope | covered | L0 task Write Scope and Work Pack manifest |
| `L0-RERUN-007` | Preserve validation surface | covered | L0 task Done And Validation |
| `L0-RERUN-008` | Stop without implementation mutation | covered | Gate evaluated before runtime selection |

## Included Context

- `WORK-PACK.md` — control fields, candidate manifest, L0 paths, write scope,
  owner gate, and the statement that no other SWU is active.
- `PLAN.md` — absolute validation-owned input home.
- `work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md` — consumes, ordered rules,
  write scope, done criteria, and stop conditions.
- `contracts/README.md` — package-relative L0 validation-input contract.
- prior `execution-receipt.json` — incorrect repository-root target expansion.
- prior `continuation-route.json` — unsafe continuation target that must not be
  dispatched.
- `decision-gate.json` — user-selected split-L0 dependency and authority model.

## Excluded Candidates

- Later L1-L8 task files: predecessor-blocked and unable to close an L0 entry
  obligation.
- Implementation modules and tests: mutation is forbidden before the gate.
- Consumer packages: irrelevant until exact core evidence exists.

## Next Action

Run `invoke:refresh:proposal-only` for the BTE package, consuming the accepted
decision. Apply only after separate approval. Once the refreshed contract SWU
passes, the validation owner may freeze the canonical package-local inputs and
the post-freeze execution SWU may be selected.
