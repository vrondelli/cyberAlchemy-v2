---
task: TASK-BTE-L6-CORE
layer: L6
status: planned-owner-gated-no-swu-instantiated
updatedAt: 2026-07-22
---

# TASK-BTE-L6-CORE — Six-Catalogue Exact Breadth

## Primary Behavior

Execute and independently replay every required coverage key in all six exact
catalogues, then emit a fail-closed, non-admitting `verify:bte:core`
AggregateResult.

## Consumes

A passing L5 mechanism receipt; exact formation/profile/node-pattern/
relationship admission handles; six validation-owner freeze handles; and the
exact L3 ProofContext. Missing gates block only their affected catalogue/core
eligibility and are recorded as typed residue.

## Ordered Rules

1. For each catalogue, compare exact `O_spec`/`O_gen` coverage-key sets and
   governing handles.
2. Require every key exactly once in TestCase, ExecutionResult, and primary
   MutationResult projections.
3. Resolve explicit ProofReceipt and ReplayResult scopes.
4. Reject overlap and require exact scope union to equal the catalogue set.
5. Run `verify:bte:catalogue <catalogue-id>` as diagnostic/progress evidence.
6. Compose `verify:bte:core` only from successful independent ReplayResults for
   all six exact catalogues and the exact build/context handle.

## Fail-Closed Matrix

Reject missing/empty/extra/duplicate/stale/mismatched catalogue member;
overlapping/missing/extra scope; one L5 unit substituted for breadth;
absent/wrong admission or freeze; skip/todo/orphan/unrunnable; survivor;
producer-authored counts/status; replay from stale raw bytes; or consumer/UI
evidence inside core.

## Exit

Emit run-scoped per-catalogue raw artifacts, ProofReceipts, ReplayResults, core
required-check manifest, and AggregateResult. Core remains non-admitting. Only
its exact green handle may open L7A and L7B.
