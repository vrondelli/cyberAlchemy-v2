# IL-H04 Headless-Activation Cycle

Status: admitted cycle instance completed  
Cycle kind: `controlled-upgrade`  
Phase: `controlled-local-headless-activation`  
Activation: controlled local

## Objective

Admit one controlled-upgrade instance, prove failed-canary rollback, and retain
the validated IL-H04 provider behind a local evidence-owned serving pointer for
the confirmed shared-RPC/headless scope.

## Admission boundary

The user's `next admitted` decision is retained as DG-CU-01. It admits this one
cycle instance through the coordinator's construction boundary. It does not
globally admit or enable the candidate `controlled-upgrade/v1` definition.

The authorized activation is local and reversible. It excludes the repository
default profile, Codex Desktop/Windows UI, deployment, publication, credentials,
external serving, and real-user effectiveness claims.

## Result

The controller first activated the candidate against an intentionally failing
canary and atomically restored the disabled predecessor. It then repeated the
transition with the real Unix-socket gateway canary; that passed and the local
pointer retained the exact provider package. The repository profile remains
disabled.

The upgrade-controller suite passed 7/7, the complete evolution-runtime suite
128/128, and the complete wrapper suite 219/219. Seven coordinator tasks
settled, with restart and SQLite-loss reconstruction verified.

Exact evidence and digests are in [RESULTS.md](RESULTS.md).

## Operational use

The subsequent
[`ilh04-headless-operational-v1`](../ilh04-headless-operational-v1/RESULTS.md)
cycle completed this boundary. Both real entrypoints now consume the retained
pointer through one exact activation manifest while the repository default
remains disabled.

## Open Questions

- Operator consumption of the local pointer is resolved by the operational
  successor cycle.
- How should live cycle-state revisions reach a long-running gateway without a
  restart while preserving exact receipts?
- What real-user cohort and rollback threshold should govern broader adoption?
