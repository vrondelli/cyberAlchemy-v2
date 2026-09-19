---
module: language-type-enforcement-parser-experiment
task: TASK-LTE-VERIFY
layer: L0
status: blocked-by-swu-lte-003
updatedAt: 2026-07-17
docType: work-pack-task
---

# TASK-LTE-VERIFY: L0 Closure Verification

## Objective

Independently rerun the full declared L0 evidence matrix and record the Task
Session receipt. This task performs no source repair and owns no domain logic.

## Dependencies

- SWU-LTE-001, SWU-LTE-002, and SWU-LTE-003 receipts pass.
- All planned source mutation is complete and stable.

## SWU Exemption

Closure-only exemption: the task has no source write scope, algorithm, or
implementation output. It only executes existing commands, compares recorded
evidence to the architecture, and writes the owning Task Session result.

## Verification Checklist

1. Rerun focused kernel, content, normalized parser, and parity tests.
2. Rerun root/engine typechecks and engine build.
3. Rerun `validate:content`, `tools:test`, and `engine:test`.
4. Record the eight expected code/subject/detail triples from both consumer
   surfaces.
5. Record exact zero deltas for the three positive packs.
6. Review imports for the banned dependency set and FPR-02 isolation.
7. Run docs validation and scoped `git diff --check`.
8. Record residue, including pre-existing unrelated failures separately from
   experiment regressions; do not silently waive either.

## Completion Evidence

The Task Session receipt must name inputs, commit/worktree state, files touched,
all commands and statuses, parity rows, positive snapshots, unresolved residue,
and the L0 continue/pivot/stop recommendation. A failed check cannot be repaired
inside this closure task; route back to the owning SWU.
