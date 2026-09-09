# TASK-IOLM-006 — Evidence and Private Pilot

## Objective and mapping

- Slice/layer/wave: S-006 / L2-L3 / W4.
- Objective: run independent technical/accessibility/performance gates, then a bounded comprehension pilot that supports an integrate/iterate/stop decision.
- Dependencies: TASK-IOLM-005.

## Source contracts

- [Architecture — Validation](../../ARCHITECTURE-BUNDLE.md#validation-architecture)
- [UX acceptance evidence](../../UX-PLAN.md#ux-acceptance-evidence)
- [SPEC independent gates](../../SPEC.md#independent-gates)
- [Implementation layering L3](../../IMPLEMENTATION-LAYERING.md#layer-decisions)

## SWU-IOLM-006-A — Technical and accessibility evidence

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-005-B pass |
| Source anchors | every SPEC gate except publication; UX accessibility evidence |
| Related context | all implementation receipts; exact dependency/browser/AT versions |
| Write scope | `prototype/tests/evidence/` and `prototype/runs/` |
| Done criteria | run schema/source/endpoint/proof/determinism/API/parity/keyboard/touch/reduced-motion/screen-reader/performance checks independently |
| Acceptance evidence | raw command/browser/AT receipts, corpus distributions, timings, per-gate verdicts; failures remain failures |
| Validation surface | one documented full evidence command plus named manual AT procedures |
| Execution owner | Task Session for automation plus named accessibility reviewer |
| Handoff | return gate matrix; do not convert renderer success into comprehension/accessibility claim |

## SWU-IOLM-006-B — Comprehension pilot and disposition

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-006-A with no safety/blocking failure |
| Source anchors | UX audiences and comprehension distinctions; L3 layer decision |
| Related context | technical gate matrix and fixed private witness |
| Write scope | `prototype/pilot/` and `prototype/runs/pilot/` |
| Done criteria | protocol, consent/privacy posture, audience sample, tasks, rubric, raw/de-identified responses, limitations, integrate/iterate/stop recommendation |
| Acceptance evidence | participants' actual distinction scores and qualitative breakdowns; no predetermined pass threshold invented after results |
| Validation surface | human protocol review, data completeness check, bounded decision review |
| Execution owner | named learning/product researcher plus Task Session for evidence packaging |
| Handoff | route private website integration only if evidence and host owner support it; otherwise iterate or stop |

## Completion

This task cannot authorize a public derivative. A private pilot verdict applies only to the exact snapshot, versions, audience, protocol, and evidence package it names.
