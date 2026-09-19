---
task_session: SWU-CDSC-002
mode: local
coverage: strict-local
status: ready
source_count: 8
---

# Context Pack: SWU-CDSC-002

## Selected Unit

Implement versioned receipt validation, canonical semantic digests, residue
computation, four fixture outcomes, three suite verdicts, and append-only
generation indexing. Do not author or revise fixture evidence or predicate
values.

## Controlling Sources

1. `../../WORK-PACK.md` - SWU-CDSC-002 ready after accepted dependency 001.
2. `../../work-pack/tasks/TASK-CDSC-CONTRACTS.md` - algorithm, edge cases,
   outputs, write scope, and done criteria.
3. `../../ARCHITECTURE.md` - deterministic decision flow and owner split.
4. `../../SPEC.md` - ordered fixture and suite outcomes.
5. `../../contracts/evidence-receipt.schema.yml` - accepted evaluator input.
6. `../../contracts/evaluation-result.schema.yml` and
   `../../contracts/suite-result.schema.yml` - output contracts.
7. `../../fixtures/contracts/` - accepted golden positive and negative vectors.
8. `../SWU-CDSC-001/receipt.json` - dependency acceptance evidence.

## Hard Constraints

- Write only `evaluation/`, `tests/evaluator.test.mjs`, and this Task Session
  evidence folder, plus evidence-backed status synchronization.
- Never read or mutate fixture source repositories in this SWU.
- Validate but never invent, fill, normalize away, or revise `A`, `Q`,
  `sigma_matrix`, substitutions, `D`, `U`, or reviewer states.
- Treat `indeterminate`, disputed review, and missing/disputed/untested `U`
  entries as incomplete evidence.
- Compute residue only after structural validation and completeness checks.
- Sort computed identifiers and logical projections so result semantics are
  independent of input array order.
- Volatile metadata cannot affect semantic result digests.
- Result envelopes preserve prohibited inferences.
- Generation append rejects duplicate IDs, wrong predecessors, and replacement
  of existing entries.

## Implementation Decisions

1. Implement direct versioned validators instead of adding an external JSON
   Schema runtime dependency. The accepted schemas remain the contract; focused
   tests prove parity for every field used by the evaluator.
2. Use a logical receipt digest that sorts semantically unordered `A`, `Q`,
   predicate, uncertainty, and reviewer arrays. Receipt record identity remains
   untouched, while result semantics become order-independent.
3. Map replay `not-run` to `CALIBRATION-DEFER`, replay `drift` to
   `CALIBRATION-FAIL`, and replay `identical` through the normal control rule.
4. Keep evaluator functions pure. File mutation exists only in the explicit
   atomic generation-index appender.

These are non-blocking implementation choices derived from the accepted
contracts.

## Validation Surface

- Exhaustive fixture and suite decision tables.
- Empty `A`/`Q`, duplicate/conflicting/missing coordinates, unknown states,
  indeterminate evidence, zero/unstable `D`, and substitution failures.
- F2 control enforcement and replay states.
- Input order and volatile metadata invariance.
- Input non-mutation.
- Generation append, duplicate ID, and predecessor conflict checks.
- Existing SWU-CDSC-001 contract suite regression.

## Gate Result

`PASS`: dependency 001 is accepted; contracts, vectors, write scope, and
validation are complete; no blocker-level decision remains.
