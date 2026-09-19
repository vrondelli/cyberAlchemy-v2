---
task: TASK-BTE-L5-PROOF-UNIT
layer: L5
status: planned-no-swu-instantiated
updatedAt: 2026-07-22
---

# TASK-BTE-L5-PROOF-UNIT — One Complete Graph-To-Replay Chain

## Primary Behavior

Prove one frozen, stage-eligible catalogue member through exact derivation,
pre-run instruction, role binding, raw execution, independent evaluation, fresh
reason-specific mutation, receipt, and independent replay.

## Ordered Algorithm

```text
resolve ProofContext and frozen O_spec member
derive O_gen from graph/manifest only
exact-join coverage key and governing handles
materialize one TestCase bundle
resolve exactly one binding for every required role
run exact compiler/runtime and persist raw observations
evaluate without compiler/kernel/adapter/generator imports
create fresh child-lineage primary mutation
require declared phase/code/delta kill
emit ProofReceipt over allowlisted raw handles
independently replay schemas, bytes, digests, joins, observations, and scopes
emit one ReplayResult
```

## Objects And Cardinality

TestCase is pre-run; ExecutionResult is post-run. Each targets one coverage key.
One required key has exactly one TestCase, ExecutionResult, and primary
MutationResult projection; roles remain internal. ProofReceipt and ReplayResult
are separate producers and cannot admit or aggregate.

## Required Negatives

O_spec/O_gen missing/extra/duplicate/stale/mismatch; TestCase before equality;
zero/two/wildcard/first-match/stale binding; forbidden evaluator import;
unsupported scope; skip/todo/orphan/unrunnable; raw observation replaced by
literal pass; base receipt used for child; wrong-reason mutation death; survivor;
raw tamper; self-authored replay; missing/extra/overlapping replay scope.

## Write And Exit Boundary

Writes stay in new `src/bte/` proof modules, BTE fixtures, and `runs/<run-id>/l5/`.
Frozen catalogues, semantic sources, compiler outputs, admissions, consumers, and
legacy compatibility modules are read-only. Exit is one independently replayed
proof-unit receipt. It proves mechanism only; L6 breadth remains red.
