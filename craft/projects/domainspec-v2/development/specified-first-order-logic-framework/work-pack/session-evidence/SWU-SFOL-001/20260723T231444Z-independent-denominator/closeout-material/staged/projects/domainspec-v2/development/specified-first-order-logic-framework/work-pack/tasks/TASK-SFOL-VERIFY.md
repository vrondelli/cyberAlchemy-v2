---
task: TASK-SFOL-VERIFY
layer: L3
slice: S-05
status: dependency-gated
updatedAt: 2026-07-23
swuExemption: closure-only
---

# TASK-SFOL-VERIFY

## Objective

Independently verify work-pack closure, replay the allowlisted evidence, and
state the exact pilot capability ceiling and remaining residue.

## Source Contracts

- [SPEC definition of complete](../../SPEC.md#definition-of-complete)
- [WORK-PACK](../../WORK-PACK.md)
- [traceability](../shared/traceability.md)
- [cross-task gaps](../shared/cross-task-gaps.md)

## Dependencies

All 12 mutation SWUs and closeout receipts must be closed. This task is
closure-only and is exempt from a mutation SWU.

## Verification Contract

- Read the exact source, denominator, typed, bound, generated, observed, and
  evaluated manifests.
- Recompute identity/digest joins without trusting authored pass summaries.
- Replay allowlisted core and adopter evidence.
- Run negative, mutation, stale, duplicate, missing/extra, indeterminate, and
  containment checks.
- Confirm no adopter vocabulary/path and no forbidden dependencies in core.
- Confirm both adopters use the same language/core contract version.
- Re-run structural BTE only as separately labeled regression evidence; do not
  merge its result into semantic completeness.
- Write one final verification report and receipt; do not repair a failure.

## Write Scope

Verification report/receipt roots declared by the implemented test harness and
the Task Session evidence directory. No source, core, adapter, or plan mutation
is permitted except the later Invoke Refresh closeout.

## Completion Evidence

The report must state pass or block for:

1. exact-set closure;
2. evaluator/denominator independence;
3. binding oracle absence;
4. pure/effect observation completeness;
5. deterministic replay;
6. two-adopter compatibility;
7. adopter-neutral core;
8. unresolved residue; and
9. capability ceiling.

A pass means “DS-SFOL pilot complete for its admitted profiles.” It does not
mean full FOL, full feature, release, production, solver, or promotion ready.
