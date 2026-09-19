---
taskId: TASK-GCP-ENFORCES
layer: L0
slice: S1
status: blocked-on-GCP-B-005
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

**Current blocker:** `GCP-B-005` / `DEC-GCP-001`. The selected Rule source
declares only a boolean return type and does not author the formal predicate or
fixture inputs needed for a real generated assertion.

**Primary behavior:** traverse one admitted `enforces` edge through every L0
artifact boundary.

**Independent acceptance boundary:** both a positive receipt and a negative
mutation receipt can be replayed from their recorded digests; a failure at any
boundary is typed and visible.

**Split analysis:** graph normalization, derivation, binding, test generation,
execution, evaluator, and receipt were considered as children. They are kept in
one SWU because the claim is specifically the continuity of this causal chain;
split execution would not prove continuity.

**Dependencies:** S0 contract review; one key-and-door fixture; existing
relationship and test-engine checks.

**Source anchors:** `enforces` registry entry; key-and-door structural witness;
`delta(G, Delta)` rule path; test emitter; receipt residue path.

**Related context:** [DESIGN.md](../../DESIGN.md), [CONTEXT.md](../shared/CONTEXT.md),
[GAPS.md](../shared/GAPS.md).

**Write scope:**
`projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-001/`.
Existing implementation/test files may be edited only when Task Session confirms
the exact path; no authority or release files may be changed.

## Proposed Execution Sequence

1. Load the authored key-and-door source graph and compute its source digest.
2. Resolve `enforces` through the relationship registry and validate endpoints.
3. Normalize the graph and record the normalized graph digest.
4. Derive one obligation with source edge, rule-set version, and canonical key.
5. Resolve a binding with fixture and graph digests.
6. Emit and run one test case; do not invent an expected predicate.
7. Evaluate the result with a scoped local evaluator.
8. Produce a receipt with structural, execution, evaluator, and residue fields.
9. Mutate the endpoint or signature, rerun, and record a typed rejection receipt.

## Done Criteria

- Positive path contains all eight artifact classes named in DEFINE.
- Negative mutation is rejected at the earliest valid boundary.
- No `it.skip`, `it.todo`, orphan, stale digest, or untyped missing binding is
  counted as success.
- Receipt is independently readable and replay instructions are present.

## Acceptance Evidence

`source-graph.json`, `normalized-graph.json`, `obligation.json`, `test-case.json`,
`binding.json`, `evaluator.json`, `receipt.json`, `negative-mutation.json`, and
`result.md`, all under the SWU evidence directory.

## Validation Surface

Run the existing relationship validator, test-engine tests, composability checker
against the fixture, and `git diff --check`. A Task Session must capture command
outputs in its receipt; Invoke does not run them.

## Execution Owner And Handoff

`task-session` owns execution; `local-fallback` is permitted only if the Task
Session route explicitly hands back a bounded local run. No subagent is selected.
