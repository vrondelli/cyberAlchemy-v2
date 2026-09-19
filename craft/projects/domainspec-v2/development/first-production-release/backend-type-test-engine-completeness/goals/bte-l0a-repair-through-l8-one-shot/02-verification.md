# Verification

## Layer Matrix

| Layer | Minimum verification |
| --- | --- |
| L0A repair | exact nine target digests; immutable receipt/manifest preservation; `verify:bte:contract-publication`; focused test; engine tests; typecheck; docs; scoped diff |
| L0B | `verify:bte:contracts`; exact frozen red case/result set; engine tests; typecheck; write manifest |
| L1 | `verify:bte:formation-v2`; exact retirement/migration/compatibility receipt; current-v1 preservation |
| L2 | `verify:bte:build --stage resolve`; deterministic source-set comparison; path/root negatives |
| L3 | `verify:bte:build`; two-run graph/manifest/build byte comparison and independent replay |
| L4 | six nonempty validation-owner catalogue freezes and red matrices; exact admissions/residue |
| L5 | one complete TestCase→ExecutionResult→MutationResult→ProofReceipt→ReplayResult chain |
| L6 | six exact catalogue verifiers plus `verify:bte:core`; exact scope union and independent replays |
| L7A | consumer-owned IOLM run and BTE replay, including graph/hierarchy/table GET parity |
| L7B | consumer-owned Body War run and BTE replay, including declared-write and redaction proof |
| L8 | `verify:bte:consumers`; `verify:bte`; independent aggregate joins and negative matrix |

## Receipt Rule

Every Task Session receipt must name the SWU, consumed and emitted handles,
files touched, write manifest, validation results, blockers, residue, admission
state, production state, and next owner. Invoke Refresh must accept the receipt
before the campaign advances.

## Profile Validation

The profile itself must pass:

- native Goal text at or below 4,000 characters;
- JSON parsing for index, approval, and validation receipt;
- all indexed paths exist;
- strict campaign/current-SWU coverage;
- approval does not grant independent owner or production authority;
- Markdown relative links resolve;
- trailing whitespace and `git diff --check`.
