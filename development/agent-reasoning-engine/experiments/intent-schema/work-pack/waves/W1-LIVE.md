# W1-LIVE — L1 intent-schema evidence run

## Layer question

Does the unchanged L0 evidence mechanism survive one complete, source-locked
12+3 repository-local population run?

## Included work

- Task: [`TASK-INTENT-POPULATION-001`](../tasks/TASK-INTENT-POPULATION-001.md)
- Selected unit: `SWU-INTENT-001`
- Execution: sequential; no parallel workers or subagents.

## Entry gate

`receipts/intent-evidence-mechanics.json` exists with status `pass` and proves one
expected-pass and one expected-fail fixture under the frozen validator.

## Exit evidence

- exact 12+3 source-locked manifest;
- one valid or explicitly failed row per manifest entry;
- descriptive metrics and held-out result;
- claim-bounded `RESULT.md`;
- terminal Task Session receipt with commands, hashes, blockers, and residue.

## Promotion and next route

Wave pass/flag makes the evidence eligible for g6 human review only. It cannot
promote a schema, definition, evaluator, engine, or public artifact. A block
routes to the named mechanics/source/protocol owner.
