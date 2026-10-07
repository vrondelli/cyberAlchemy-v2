# Longitudinal Continuity and Authorized Automation

Status: candidate program; bounded fixed replay completed; first shadow rejected; not enabled or activated  
Authority effect: none  
Program ref: `program:longitudinal-continuity-authorized-automation-v1`

This package materializes the two linked evolution cycles selected through
DG-PC-01, DG-LPC-01 through DG-LPC-08, and DG-AA-01 through DG-AA-09:

- `cycle:il-lpc-01` studies how preferences and continuity evolve through use
  and time. It binds the existing `interaction-learning/v1` runtime definition.
- `cycle:ei-aa-01` studies authorized automation over DAG and non-DAG
  workflows. It binds the existing `engine-improvement/v1` runtime definition.

The cycles use the existing durable kernel, coordinator, immutable Research
Work Plan shape, validators, typed handoffs, receipts, recovery, and object
store. This package does not introduce another evolution engine.

## Architecture

```text
IL-LPC-01 discovery, corpus, baseline, and continuity hypotheses
                         |
                         | exact typed continuity-contract handoff
                         v
EI-AA-01 baseline ------ join ------ automation candidate evaluation
       |                                  |
       +-- may begin in parallel           +-- recommend-only settlement
```

Cycle 2 may prepare its baseline and safety model in parallel. It cannot
construct or evaluate treatment behavior until it accepts the exact Cycle 1
handoff. Each cycle remains independently measurable and independently
falsifiable.

## Control model

The workflow model is hybrid rather than DAG-only. Objectives, constraints,
budgets, authorization and stop conditions govern an outer control loop. The
runtime materializes only the currently knowable execution frontier. A frontier
may be a DAG slice, one action, a state transition, or an event wait. Iteration
creates a new receipted epoch.

Cycle 2 uses the closed outcome set `execute`, `ask`, `abstain`, and `stop`.
Every newly materialized action is checked against an explicit typed standing
grant. Preferences may select a workflow but never create or widen authority.

## Artifact map

- [DECISIONS.md](DECISIONS.md) — selected decision ledger.
- [program.json](program.json) — cross-cycle identity and dependency binding.
- [schemas/candidate-artifacts-v1.schema.json](schemas/candidate-artifacts-v1.schema.json)
  — closed candidate carrier schemas.
- [shared/handoff-contract.json](shared/handoff-contract.json) — exact Cycle 1
  to Cycle 2 transfer contract.
- [shared/dataset-manifest.json](shared/dataset-manifest.json) — replay and
  prospective cohort specification.
- [shared/receipt-manifest.json](shared/receipt-manifest.json) — required receipt
  classes and storage policy.
- [shared/fixture-specifications.json](shared/fixture-specifications.json) —
  replay, temporal, authority, non-DAG, and recovery fixture families.
- `interaction-learning/` — Cycle 1 definition, policy, hypotheses, metrics,
  and immutable work plan.
- `authorized-automation/` — Cycle 2 definition, policy, hypotheses, metrics,
  and immutable work plan.
- [READINESS.md](READINESS.md) — compatibility findings, blockers, and the
  next implementation boundary.
- [TECHNIQUE-RESEARCH.md](TECHNIQUE-RESEARCH.md) — local predecessor and
  external technique assessment.
- [EXECUTION-PLAN.md](EXECUTION-PLAN.md) — reviewed construction and first-run
  benchmark sequence.
- [PLAN-REVIEW.md](PLAN-REVIEW.md) — corrections and readiness verdict.
- [IMPLEMENTATION-REVIEW.md](IMPLEMENTATION-REVIEW.md) — source, safety,
  privacy, regression, and reproducibility review.
- [FIRST-RESULT.md](FIRST-RESULT.md) — human-readable bounded benchmark result
  and exact claim ceiling.
- [SHADOW-RESULT.md](SHADOW-RESULT.md) — first independent post-predecessor
  shadow result, counterevidence, and revised collection contract.
- [VALIDATION-RESULT.json](VALIDATION-RESULT.json) — bounded schema, binding,
  coordinator-conformance, and regression evidence.

## Claim ceiling

The planning artifacts remain candidate records. The fixed-replay evidence is
a completed construction result, but it does not modify the global
cycle-definition registry, enable either generic definition, dispatch a remote
worker, process historical Codex data, grant standing authority, perform a live
canary, activate a serving variant, or authorize a controlled upgrade.

## Open Questions

Open questions and ownership are centralized in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
