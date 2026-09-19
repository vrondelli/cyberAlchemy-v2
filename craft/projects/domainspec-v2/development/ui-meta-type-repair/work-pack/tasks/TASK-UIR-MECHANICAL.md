# TASK-UIR-MECHANICAL

## SWU-UIR-004 - Mutation Ledger

Inputs: 001, 002, the 52 criteria manifest, and 9 fixed-value criteria.
Outputs: immutable manifest, 165 base cases, result schema, runner, and receipt.

Algorithm: sort stable criterion selectors; emit deletion, empty, and whitespace
cases for all 52; emit wrong-fixed cases for 9; derive case IDs from versioned
semantic inputs; execute both validation paths; append observed outcomes/codes;
reject missing, duplicated, or overwritten case IDs. Duplicate/conflict,
erasure, and neighbor extensions run only when their finite manifests and owner
gates exist.

Edge cases: parser-normalized duplicates, unsupported rules, regenerated fixture
bytes, partial runs, and predecessor mismatch. Write scope: future mutation
manifest/runner/fixtures/results under this package plus explicitly declared
test paths. Done: exactly 165 unique base records, deterministic rerun, and no
history overwrite. Failure: partial ledger is invalid, never “complete”.
