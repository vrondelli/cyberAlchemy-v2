---
artifact_id: CONTEXT-UIR-008-v1
task: SWU-UIR-008
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-008 Context Pack

## Summary

- Files selected: 12 controlling sources and four immutable producer records.
- Selector groups: 12.
- Obligation coverage: 100 percent.
- Runtime: local; blockers: none.
- Derived current outcome: `DEFER`; no owner decision is needed to preserve the
  existing unresolved states.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume immutable handles from SWU-004 through SWU-007. | task contract; producer generations | covered |
| O2 | Evaluate exactly eight hard conjuncts in declared order. | `EVIDENCE-CONTRACTS.md#S4` | covered |
| O3 | Preserve pass, fail, missing, disputed, and pending-owner states. | task contract | covered |
| O4 | Yield DEFER for any non-pass unless finite all-zero closure is proven. | SPEC invariants; architecture decision flow | covered |
| O5 | Reject weighted scores and partial-credit aggregation. | prohibited inference; architecture risk control | covered |
| O6 | Keep shared mechanical hygiene distinct from an independent positive witness. | accepted research S4; task negative fixture | covered |
| O7 | Require explicit label and criterion erasure evidence for those conjuncts. | task contract | covered |
| O8 | Preserve owner-pending state and make no authority claim. | SWU-007 packet; AC-07 | covered |

## Producer Handles

| Producer | Generation | Current implication |
| --- | --- | --- |
| mutation ledger | `generation:sha256:f25d8b7b9310760f58c04fd29ef3ecc78bec9bc1c62d7c1b631b9aeae24183f6` | shared hygiene and changed validation consequence only |
| reroute receipt set | `generation:sha256:5ba56a2d8559cadae183cbddb0c71d7d19f6f19b3a41eddcee0cd0afd513348b` | typed negatives exist; one destination remains owner-pending |
| corpus receipt set | `generation:sha256:858c0d94070258dc1db5eccf945e1965409ed4b85f5c442600d04f27336aaa85` | bounded facts exist; one selector is not-observed; portability threshold open |
| relationship packet | `generation:sha256:8768ca294f44e65efbe8d9fad512673d02933770406be474d7cf89992278c28b` | owner firewall is pending-owner |

## Current Typed Conjuncts

| Conjunct | State | Reason |
| --- | --- | --- |
| independent-positive | disputed | DEC-UIR-009 and UIF-010 dissent remain open |
| stable-contrast | missing | no independent semantic contrast record exists |
| label-erasure | missing | no erasure experiment exists |
| criterion-erasure | missing | no erasure experiment exists |
| changed-consequence | pass | 165 mutations change validator outcome with stable codes |
| typed-negatives | pass | reroute and mutation records preserve typed negatives |
| corpus-bound-portability | disputed | DEC-UIR-008 has no approved threshold/reviewer policy |
| owner-firewall | pending-owner | DS-D8 packet selects no option |

## Decisions And Assumptions

- No blocker decision is required to emit `DEFER`; unresolved decisions remain
  typed inputs rather than guessed answers.
- A shared-hygiene witness can support changed consequence or typed negatives,
  but it cannot satisfy independent-positive, stable-contrast, or erasure.
- `DOSSIER-ZEROED` requires an explicit finite closure record and an all-zero
  witness set. The current input contains no such record.
- `EVIDENCE-COMPLETE` would open a later route only and would still prove no
  identity, replication, activation, authority, or promotion.

## Write Scope And Validation

- Add dossier schema, evaluator, fixture, immutable result, and focused tests
  under this repair package only.
- Test all eight single-conjunct removals, label/criterion erasure, shared
  hygiene misuse, owner pending, no-score enforcement, deterministic outcome,
  schema validity, and immutable replay.
- Do not mutate producers, candidate status, DS-D1, DS-D8, or UIF history.
