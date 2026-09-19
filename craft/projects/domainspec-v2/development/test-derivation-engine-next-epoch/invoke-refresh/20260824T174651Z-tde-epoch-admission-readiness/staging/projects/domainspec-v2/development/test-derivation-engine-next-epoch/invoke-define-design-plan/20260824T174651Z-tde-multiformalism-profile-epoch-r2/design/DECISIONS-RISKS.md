# Decisions and Risks

## Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| TDE-D01 | Consume exact FormalClaim plus downstream assessment/projection handles; do not author meaning. | Preserves one source authority. |
| TDE-D02 | Keep capability policy in validation governance and deterministic policy interpretation in TDE. | Avoids blurring ownership with the existing TDE decidability map. |
| TDE-D03 | Require preservation evidence before derivation. | A source-expressive claim is not automatically executable. |
| TDE-D04 | Use one language-neutral obligation/case IR. | Future profiles do not alter classification or derivation logic. |
| TDE-D05 | Use an explicit versioned digest-bound registry. | Ambient discovery, latest, duplicates, and stale profiles fail closed. |
| TDE-D06 | Establish TypeScript first, then Python and Rust independently. | Freezes the shared contract before language expansion without inheriting admission. |
| TDE-D07 | Compare semantic parity, not source-byte identity. | Native languages legitimately differ in syntax and tooling. |
| TDE-D08 | Keep Lean/DTT in an EVF theorem-provider lane. | TDE is not a Lean execution or theorem system. |
| TDE-D09 | Preserve current closed-form/honesty behavior as predecessor capability. | Prevents duplicated work and regression. |
| TDE-D10 | Treat the first Plan as pre-admission and blocked. | @3 has no owner/verifier admission. |

## Risks and controls

| ID | Risk | Control | Planned witness |
| --- | --- | --- | --- |
| TDE-R01 | TDE silently becomes source authority. | source_authority_count=1 and digest joins; no source write API. | PW-001, PW-002 |
| TDE-R02 | Full FOL/Lean/SMT is inferred from source expressiveness. | accept only admitted projection; separate theorem/provider routes. | PW-003, PW-004 |
| TDE-R03 | Bounded projection is reported globally. | purpose, preservation direction, exact bound, certificate, scoped ceiling. | PW-005, PW-006 |
| TDE-R04 | A profile loads from ambient state. | explicit immutable registry; unknown/latest/duplicate/stale block. | PW-007 to PW-011 |
| TDE-R05 | Candidate profile substrate is called complete. | TDE-specific admission/currentness checks and provider-required states. | PW-012 |
| TDE-R06 | Renderer changes obligation meaning. | neutral-IR identity and case-total render receipt. | PW-013 |
| TDE-R07 | Cross-language parity becomes syntax equality or majority vote. | compare obligation/case/outcome/evidence/ceiling; require all lanes. | PW-014, PW-015 |
| TDE-R08 | Provider failure becomes pass. | total result algebra; timeout/malformed/unknown non-pass. | PW-016 to PW-018 |
| TDE-R09 | Lean is treated as a normal code backend. | separate EVF theorem handoff and no Lean renderer registration. | PW-019 |
| TDE-R10 | New epoch duplicates closed-form evaluator/honesty guard. | predecessor regression fixtures, no replacement SWU. | PW-020 |
| TDE-R11 | Legacy debts disappear under new scope. | residue ledger and separate owner routes. | PW-021 |
| TDE-R12 | Planning is mistaken for activation. | blocked execution entry and no readiness-run claim. | PW-022 |

## Current capability statement

Current: bounded deterministic TDE derivation and TypeScript/Vitest-oriented emission exist; exact rational closed-form evaluation and honesty checks are tested.

Designed: neutral IR, explicit TDE profile registry, independent TS/Python/Rust adapters, parity normalization, and FormalClaim/EVF seams.

Planned: schemas, validators, adapters, fixtures, receipts, profile admissions, and provider bindings.

Absent: next-epoch implementation, admitted TDE profiles, Python/Rust TDE renderers, product execution evidence, Lean execution in TDE, readiness, migration, and release.

## Overall gate

Design can pass locally. The domain gate remains blocked-pending-formalclaim-3-owner-and-verifier-admission-and-future-plan-refresh-evidence.
