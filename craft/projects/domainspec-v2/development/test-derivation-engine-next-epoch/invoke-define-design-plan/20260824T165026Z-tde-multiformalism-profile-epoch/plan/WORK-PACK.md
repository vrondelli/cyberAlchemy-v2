# Work Pack: TDE Multiformalism Profile Epoch

Status: pre-admission execution-candidate; blocked.

Risk/size: medium-high. Shape: split. Canonical task contracts are under work-pack/tasks. Shared validation, traceability, closeout, and wave contracts are under work-pack/shared and work-pack/waves.

## Gate

- workPackGateStatus: block
- execution entry: blocked
- mutation_ready: false
- exactAcceptanceStatus: unapproved
- authority_effect: none
- blocking reason: FormalClaim @3 lacks exact Rondelli owner-role admissions, a Rondelli-assigned verification level, and Victor Boscaro structural verification; no post-admission Plan Refresh/WPRA/readiness evidence exists.

This work pack contains mutation-capable future work. It is not designated non-executing and cannot use an exemption to bypass readiness.

## SWU inventory

| SWU | Outcome | Depends on | Future Task Session |
| --- | --- | --- | --- |
| TDE-EPOCH-001 | fail-closed profile contracts and explicit registry | admission/Refresh gate | TASK-TDE-EPOCH-001.md |
| TDE-EPOCH-002 | exact FormalClaim assessment/projection intake | 001 | TASK-TDE-EPOCH-002.md |
| TDE-EPOCH-003 | neutral obligation/case IR using preserved evaluator | 002 | TASK-TDE-EPOCH-003.md |
| TDE-EPOCH-004 | TypeScript profile trust lane | 003 | TASK-TDE-EPOCH-004.md |
| TDE-EPOCH-005 | independent Python profile lane | 004 | TASK-TDE-EPOCH-005.md |
| TDE-EPOCH-006 | independent Rust profile lane | 004 | TASK-TDE-EPOCH-006.md |
| TDE-EPOCH-007 | extension rejection and explicit registration contract | 001, 004 | TASK-TDE-EPOCH-007.md |
| TDE-EPOCH-008 | Lean/EVF theorem-handoff boundary | 002 | TASK-TDE-EPOCH-008.md |
| TDE-EPOCH-009 | all-required-lane semantic parity | 004, 005, 006 | TASK-TDE-EPOCH-009.md |
| TDE-EPOCH-010 | reproducible closeout and residue preservation | 007, 008, 009 | TASK-TDE-EPOCH-010.md |

## Atomicity and split analysis

Each SWU has one owner-aligned outcome and can fail without partial admission. 001 is the narrowest reversible trust seed. 002 and 003 split external intake from internal derivation. 004 freezes the shared renderer contract before independent 005/006. 007 tests extension without admitting Kotlin. 008 cannot be merged into code rendering because EVF/theorem ownership differs. 009 joins semantics only after native lanes close. 010 is read-mostly closeout.

Any need to modify the frozen neutral contract during 005 or 006 invalidates 004 and returns to a refreshed 003/004 candidate rather than being patched across lanes.

## Selection rule

No SWU is eligible now. After the exact owner/verifier gate and a new Invoke Refresh, Task Session selects only the nearest evidence-backed SWU, starting with TDE-EPOCH-001. One SWU per Task Session.

## Global acceptance

Complete-witnessed is not available from this Plan. Future closeout requires every required SWU receipt, exact current identities, all three language lanes, semantic parity, the separate Lean/EVF handoff contract, preserved legacy residue, and an independently reproduced bounded result.
