---
taskId: TASK-GCP-ENFORCES
layer: L0
slice: S1
status: blocked-on-audit-entry-admission
complexity: medium
parentWorkPack: ../WORK-PACK.md
---

# Task GCP Enforces

## Objective

Execute one causal proof for `Rule --enforces--> Operation`, including a
typed-negative mutation, from source graph to evaluator receipt.

## Source Contracts

- [DEFINE.md](../../DEFINE.md) — object and ownership contract
- [DESIGN.md](../../DESIGN.md) — workflow and interfaces
- [IMPLEMENTATION-LAYERING.md](../../IMPLEMENTATION-LAYERING.md) — L0 boundary
- [CONTEXT.md](../shared/CONTEXT.md) — execution-time reading order
- [GAPS.md](../shared/GAPS.md) — known missing bridge
- [TRACEABILITY.md](../shared/TRACEABILITY.md) — evidence map
- `projects/domainspec-v2/definitions/relationships/relationships.md` — `enforces`
- `projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/rules/index.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/residue/receipt.ts`

## Selected SWU: SWU-GCP-001

**Current state:** `DEC-GCP-001-R1:option-a` is selected and the exact predicate,
expected-free fixture, binding, runtime, O_spec, receipt, and planning contracts
are applied. Independent audit, unchanged-entry Implementation Readiness, and
Task Session live admission remain open fail-closed gates.

**Primary behavior:** traverse one admitted `enforces` edge through every L0
artifact boundary.

**Independent acceptance boundary:** both a positive receipt and a negative
mutation receipt can be replayed from their recorded digests; a failure at any
boundary is typed and visible.

**Split analysis:** graph normalization, derivation, binding, test generation,
execution, evaluator, and receipt were considered as children. They are kept in
one SWU because the claim is specifically the continuity of this causal chain;
split execution would not prove continuity.

**Dependencies:** target-35 independent audit; Implementation Readiness
classification; fresh Task Session Context Pack and
single-use mutation admission; existing relationship and test-engine checks.

**Source anchors:** exact selected predicate/input/binding/runtime/O_spec
contracts; raw key-and-door Rule source, graph, and source manifest; `enforces`
registry entry; `delta(G, Delta)` rule path; strict test emitter; receipt schema.

**Related context:** [DESIGN.md](../../DESIGN.md), [CONTEXT.md](../shared/CONTEXT.md),
[GAPS.md](../shared/GAPS.md).

**Write scope:** exactly the 42 unique route paths in the validated execution
entry: 18 implementation targets, 21 project-evidence outputs, and P/O/T. The
11 owner-material paths are required read-only inputs and forbidden Task Session
writes. Every present/create baseline is rehashed immediately before admission.

## Ordered Execution Sequence

1. `ICR-S1-001`: load and validate exact selected source/input/runtime contracts;
   reject absence, staleness, or unadmitted refs before derivation.
2. `ICR-S1-002`: verify raw-source/manifest/relationship lineage, derive exactly
   one stable obligation, and prove the exact O_gen set equals O_spec.
3. `ICR-S1-003`: validate and independently evaluate only the closed Boolean
   equality AST against fixture variables.
4. `ICR-S1-004`: resolve exactly one fresh binding and reconcile every digest,
   including the admitted runtime-module digest.
5. `ICR-S1-005`: emit exactly one strict Vitest test, invoke `attemptUnlock`
   twice in fixture order, enforce exact output transitions, make one aggregate
   vector assertion, and join exactly one child-result envelope.
6. `ICR-S1-006`: replay raw bytes, execute sixteen isolated mutants, require
   sixteen typed negative receipts, and reject receipt tamper or omission.
7. `ICR-S1-007`: add only `verify:evf-s1` surgically, execute the eleven command
   contracts in order, and close the exact acceptance vector.

## Done Criteria

- Exactly one generated test ID and one joined child-result envelope contain
  two ordered runtime observations and one aggregate equality assertion.
- O_gen equals O_spec with cardinality one; sixteen mutants are killed and all
  sixteen negative receipts are present.
- Negative mutations are rejected at the earliest valid boundary.
- No `it.skip`, `it.todo`, orphan, stale digest, or untyped missing binding is
  counted as success.
- Receipt is independently readable and replay instructions are present.

## Acceptance Evidence

The exact target/result inventory, graph/obligation/binding/test/evaluator
artifacts, sixteen negative receipts, one positive non-admitting receipt,
executor and validation receipts, and exact E/P/O/T closeout chain.

## Validation Surface

`validation-contract.s1.json` is machine authority for eleven literal command
contracts. Run in array order, stop on first nonzero, preserve that status, and
never let cleanup mask a failure. Invoke does not execute them.

## Execution Owner And Handoff

`task-session` owns execution; `local-fallback` is permitted only if the Task
Session route explicitly hands back a bounded local run. No subagent is selected.
