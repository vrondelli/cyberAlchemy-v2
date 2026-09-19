---
work_pack_id: WP-UCFE-001
status: deferred-confidence-lane
next_owner: empirical-review
next_swu: none
mutation_authority: selected SWU only
complexity: high
output_mode: split
active_layer_window: closed
distill_validation: pass
dispatch_validation: pass
---

# UI Candidate Formalization Experiment Work Pack

> Direction refresh (2026-07-17): this Form pilot is now an optional empirical
> confidence lane. Missing corpus B and reviewers remain truthful gaps for a
> `distinct-supported` empirical claim, but they do not block the active
> [Required UI Profile implementation](../ui-profile-implementation/WORK-PACK.md).
> Resume SWU-UCFE-005 only when real evidence is intentionally supplied.

## Objective

Execute one governed Form pilot and prove a reusable candidate formalization
process without mutating candidate or canonical authority.

## Task Board

| Task | Layer | State | SWUs |
| --- | --- | --- | --- |
| [TASK-UCFE-CONTRACT](work-pack/tasks/TASK-UCFE-CONTRACT.md) | L0 | complete | 001-002 |
| [TASK-UCFE-COVERAGE](work-pack/tasks/TASK-UCFE-COVERAGE.md) | L0/L1 | complete | 003 |
| [TASK-UCFE-EVIDENCE](work-pack/tasks/TASK-UCFE-EVIDENCE.md) | L1 | blocked-evidence | 004-006 |
| [TASK-UCFE-REVIEW](work-pack/tasks/TASK-UCFE-REVIEW.md) | L2 | blocked-dependency/evidence | 007-008 |
| [TASK-UCFE-REUSE](work-pack/tasks/TASK-UCFE-REUSE.md) | L3 | blocked-dependency | 009 |
| [TASK-UCFE-VERIFY](work-pack/tasks/TASK-UCFE-VERIFY.md) | L3 | blocked-dependency | 010 |

## SWU Manifest

| SWU | Parent | Layer | Dependencies | State |
| --- | --- | --- | --- | --- |
| SWU-UCFE-001 | [contract](work-pack/tasks/TASK-UCFE-CONTRACT.md) | L0 | none | complete |
| SWU-UCFE-002 | [contract](work-pack/tasks/TASK-UCFE-CONTRACT.md) | L0 | 001 | complete |
| SWU-UCFE-003 | [coverage](work-pack/tasks/TASK-UCFE-COVERAGE.md) | L0/L1 | 002 | complete: distinct-route-open |
| SWU-UCFE-004 | [evidence](work-pack/tasks/TASK-UCFE-EVIDENCE.md) | L1 | 003 distinct-route | complete |
| SWU-UCFE-005 | [evidence](work-pack/tasks/TASK-UCFE-EVIDENCE.md) | L1 | 004, independent corpus B available | blocked-evidence |
| SWU-UCFE-006 | [evidence](work-pack/tasks/TASK-UCFE-EVIDENCE.md) | L1 | 005 | blocked-dependency |
| SWU-UCFE-007 | [review](work-pack/tasks/TASK-UCFE-REVIEW.md) | L2 | 006, two reviewers identified | blocked-evidence |
| SWU-UCFE-008 | [review](work-pack/tasks/TASK-UCFE-REVIEW.md) | L2 | 003 or 004-007 | blocked-dependency |
| SWU-UCFE-009 | [reuse](work-pack/tasks/TASK-UCFE-REUSE.md) | L3 | 008 audited disposition | blocked-dependency |
| SWU-UCFE-010 | [verify](work-pack/tasks/TASK-UCFE-VERIFY.md) | L3 | 001-009 or explicit branch skips | blocked-dependency |

Each SWU has exactly one parent. Task contracts own algorithms, edge cases,
write scopes, done criteria, acceptance evidence, validation, owner, and
execution-time Context Builder anchors.

## Waves

- [W0](work-pack/waves/W0.md): contract and preregistration.
- [W1](work-pack/waves/W1.md): coverage and empirical evidence.
- [W2](work-pack/waves/W2.md): independent review and disposition.
- [W3](work-pack/waves/W3.md): reusable profile and integrated audit.

## Gates

| Gate | Condition | Owner | Current state |
| --- | --- | --- | --- |
| G0 contract | Three dispositions, precedence, identity, and failures are total | evidence-contract owner | pass through SWU-001 |
| G1 preregistration | Form law, nearest alternatives, falsifiers, and policy handles are pinned | empirical owner | pass through SWU-002 |
| G2 coverage | Each alternative has a complete six-dimension matrix | empirical/DS-D1 owners | pass: distinct-route-open, not distinct support |
| G3 corpus | Two real corpora, two styles, independent authorship | empirical owner | corpus A accepted; corpus B missing |
| G4 review | Two independent agreeing reviewers | empirical review owner | reviewer identities missing |
| G5 owner firewall | Disposition is handoff-only | DS-D1 owner | contractually required |
| G6 reuse | Pilot audited before profile extraction | Invoke/experiment-harness owners | blocked on pilot |

## Active Gaps

- GAP-UCFE-001: second Form corpus and independent authorship are not selected.
- GAP-UCFE-002: two independent reviewer identities are not selected.
- GAP-UCFE-003: Form coverage and separation experiments have not run.
- GAP-UCFE-004: reusable profile is candidate-only until the pilot audit passes.

These gaps block later SWUs, not SWU-UCFE-001.

## Validation Strategy

Every SWU has focused validation. W3 additionally runs the package suite,
DomainSpec typecheck/aggregate validation, source-handle drift audit, and
prohibited-authority-inference checks.

## Next Route

Run `invoke` to define, design, and plan the DEC-UCFE-001 bounded discovery-only
pass over the exact 16-project universe recorded in
`runs/SWU-UCFE-005/DECISION-GATE.md`. SWU-UCFE-005 remains blocked until one
nominated source is explicitly accepted with author-independence and
second-style evidence.
