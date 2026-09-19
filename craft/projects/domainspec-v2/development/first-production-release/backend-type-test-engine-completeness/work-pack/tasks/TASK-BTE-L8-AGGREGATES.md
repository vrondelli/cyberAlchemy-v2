---
task: TASK-BTE-L8-AGGREGATES
layer: L8
status: planned-no-swu-instantiated
updatedAt: 2026-07-22
---

# TASK-BTE-L8-AGGREGATES — Consumer And Terminal Verification

## Primary Behavior

Compose exact fresh IOLM and Body War ReplayResults for one unchanged green core
handle into `verify:bte:consumers`, then compose that exact consumer aggregate
with the exact core aggregate into terminal `verify:bte`.

## Ordered Rules

1. Resolve the exact L6 core handle and both fresh L7 replay handles.
2. Require both consumer replays to cite the same core ID/version/digest.
3. Recompute consumer raw handles, required checks, producer separation,
   freshness, and non-admission posture.
4. Emit consumer AggregateResult from exactly two successful replay handles.
5. Emit terminal AggregateResult from exactly one core and one consumer
   AggregateResult; independently replay both joins.

## Negative Matrix

Missing/empty/extra/duplicate/stale consumer; one consumer substituted for two;
wrong/mixed core; fixture/schema-only evidence; self-authored receipt/replay;
literal pass; IOLM parity omission; Body War private leak/mutation; core rerun or
rewrite; UI dependency; skip/todo/survivor; and aggregate-authored evidence all
fail nonzero.

## Exit And Claim Boundary

Emit run-scoped required-check manifests, raw join evidence, consumer and
terminal AggregateResults, and independent replay results. Passing evidence is
non-admitting and routes only to external FPR/release owners.
