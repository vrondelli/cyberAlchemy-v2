# Validation Strategy

## Per-unit gates

Every mutation-capable unit must record each command status independently:

1. focused tests for its primary behavior and assigned hostile cases;
2. `npm --prefix projects/domainspec-v2/impl run factory:typecheck`;
3. the scoped or complete factory regression named in `SWU-CONTRACTS.json`;
4. JSON parse checks for all new JSON fixtures/evidence;
5. scoped whitespace over modified and untracked/create targets;
6. exact preimage/postimage inventory and no foreign path;
7. task-session receipt, owner closeout receipt, and exact successor.

No cleanup or later successful command may mask an earlier failure.

## Terminal receipt contract

For each SWU, Task Session emits the exact precloseout receipt named in `CLOSEOUT-CONTRACTS.json`, Invoke Refresh emits the exact owner receipt, and Task Session then emits the generic governance terminal receipt. Validate the generic terminal schema and all traversed exact references with `validators/validate-wp-fmp-002-terminal-receipt.py`. The exact Task Session schemas, candidate-local owner schema, validator bytes, CLI, and v2 readiness projection are frozen in `RECEIPT-BINDINGS.json`.

Before owner acceptance, run `validators/test-wp-fmp-002-terminal-receipt-validator.py` against the staged candidate. One valid chain must pass and every declared adversarial class in `fixtures/terminal-receipt-fixtures.json` must return non-zero with its expected diagnostic. Record every command status independently; a later successful command cannot erase a prior failure.

## Live terminal gate

`SWU-FMP2-006` must additionally revalidate all 24 source-file locks, Bolina HEAD/worktree, Java and JAR identities; prove the targeted live test did not skip; run both exact corpora; exercise existing repeat/replay/verify/reproduce/tamper/collision/accounting/publication paths; prove semantic equality with process isolation; prove no scratch/process/product residue; and close the six-unit receipt chain once.

## Planning validation

This candidate must pass JSON parsing, context hashes, baseline/source-lock live rechecks, manifest/task/SWU/receipt bijection, path/symlink/whitespace/EOF checks, hostile allocation 35/35, execution-entry validator, and plan-level Distill reconciliation. Because protected owner prerequisites are pending, the correct Plan verdict is `flag` and the correct execution entry is `owner-prerequisite`, not mutation-ready.
