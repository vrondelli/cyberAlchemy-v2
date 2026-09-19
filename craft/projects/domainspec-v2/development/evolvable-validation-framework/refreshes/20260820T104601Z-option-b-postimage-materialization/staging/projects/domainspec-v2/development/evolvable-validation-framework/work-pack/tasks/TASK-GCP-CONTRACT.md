---
taskId: TASK-GCP-CONTRACT
layer: L0
slice: S0
status: planning-facet-complete-blocked-on-audit
complexity: medium
---

# Task GCP Contract

## Objective

Freeze the selected Option A source/runtime/material fields, ID rules, digest
rules, failure precedence, and receipt proof boundary for the first
composability slice without changing canonical authority.

## Source Contracts

- [DEFINE.md](../../DEFINE.md)
- [DESIGN.md](../../DESIGN.md)
- [TRACEABILITY.md](../shared/TRACEABILITY.md)
- [DEC-GCP-001](../../decisions/2026-07-20-key-and-door-formal-source.md)
- [target-inventory.candidate-a.json](../target-inventory.candidate-a.json)
- [validation-contract.s1.json](../validation-contract.s1.json)
- [CLOSEOUT-CONTRACT.md](../CLOSEOUT-CONTRACT.md)

## Smallest Working Unit

This is the ICR-S1-001/002 planning and acceptance facet of
`SWU-GCP-001`; it is not separately selectable or closable.

## Done Criteria

- Every L0 object has an ID, source anchor, and digest rule.
- The exact owner-admitted predicate, expected-free fixture, runtime contract,
  binding, O_spec denominator, and non-admitting receipt schema are bound.
- v1 Markdown remains explanatory evidence and cannot author semantics or
  runtime behavior.
- Receipt separates structural, execution, evaluator, and residue fields.
- All stable failure codes, target baselines, authority splits, and non-goals
  are recorded; schema success never substitutes for owner or runtime admission.

## Validation

Validate the selected machine artifacts against their schemas, compare exact
O_spec/O_gen identities, review the contract table against `types.ts`,
`rules/index.ts`, emitters, and receipt implementation, then run the ordered
commands in `validation-contract.s1.json`. Preserve the first nonzero status.
