# Validation Report

## Outcome

The fresh `dsv2-formalclaim-multiformalism-lean-extension@3` package passes all local Design-evidence checks. Failures from earlier mechanical attempts remain in `COMMAND-EXITS.json`; none was masked by a later success.

## Passing evidence

| Check | Result |
|---|---|
| Dispatch Spec canonical validator | pass; zero blocks and flags |
| Design scope manifest schema and closure | pass |
| Current denominator receipt schema | pass |
| Total Design selection schemas | pass |
| Two-pass Design selection fixed point | pass; byte-identical |
| Context Builder budget | pass; 22 of 24 files, 408 of 520 excerpt lines |
| Context Builder obligation coverage | pass; 14 of 14, none uncovered |
| Inventory readiness | pass with 153 unchanged pre-existing tag warnings |
| Six architecture views | pass |
| Planned witness contract | pass; 22 witnesses, all `unimplemented` and `unexecuted` |
| All JSON parsing | pass |
| Markdown trailing whitespace | pass |
| Symlink and root-resolution boundary | pass; no symlinks or escaped paths |
| Selected source preservation | pass; 22 of 22 raw SHA-256 values reproduce |
| Acceptance-bound target reproduction | pass; 14 of 14 raw SHA-256 and byte sizes reproduce |
| Package digest reproduction | pass; `e7e6e24c088824b158df4b8604ea852dc8df0c02f4f21977b34fc1733d0534d0` |

The `153` Inventory warnings predate this run and remain warnings, not blockers. No Inventory write was authorized or performed.

## Boundary result

All authored mutations are inside the exact fresh run root. Selected @2, EVF, Lean, research, and Inventory source hashes remain byte-identical to their captured inputs. The run did not execute Lean, a provider, runtime logic, migration, Plan, Work Pack, Git, publication, promotion, release, or deployment.

## Evidence ceiling

This report proves local Design artifact validity and exact package reproducibility only. Planned witnesses and validators were not implemented or executed against product behavior. Parent Balancer, separate Rondelli owner-role admissions, owner-assigned verification level, and Victor Boscaro structural verification remain domain gates.
