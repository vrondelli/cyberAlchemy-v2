> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for the L6 replacement route.

# TASK-BTE-INTEGRATION — Fail-closed backend core check and receipt

## Objective

Expose backend core formation and execution completeness through one deterministic, fail-closed validation command and a machine-verifiable required-check manifest.

## Dependencies and blockers

- SWU-BTE-008 depends directly on SWU-BTE-004 through SWU-BTE-007 and SWU-BTE-009; SWU-BTE-001 through SWU-BTE-003 remain transitive prerequisites.
- This task cannot admit the profile or change release state; it produces evidence for the owning release gate.

## SWU-BTE-008 — Integrate the backend completeness check

### Goal

Add the canonical `verify:bte:core` command that runs every proof surface needed for the bounded backend core claim and emits one replayable non-admitting receipt.

### Algorithm

1. Define a machine-readable required-check manifest containing the criterion-kernel tests, content validation, instance validation, node/edge compiler tests, exact-set comparison, generated-suite execution, causal mutation proof, receipt replay, and typecheck.
2. Run each check with explicit command, working directory, expected artifact, and non-zero failure propagation.
3. Fail before success when the selected profile, witness, independent catalogue, generated manifest, or required receipt is missing or empty.
4. Reconcile exact kind, signature, criterion, obligation, test, execution-result, and mutation ID sets; do not use aggregate counts as the sole proof.
5. Emit a receipt with input digests, commands, tool versions, exit statuses, output artifact digests, and the bounded claim.
6. Add negative integration tests for missing feature, empty witness, catalogue drift, undiscovered test, skipped test, surviving mutant, absent core receipt, and raw-digest drift.
7. Route any release-state or supported-profile admission change to its owning decision gate.

### Write scope

- `impl/package.json` scripts
- A required-check manifest and runner under `impl/tools/`
- Direct integration tests and negative fixtures
- Run-scoped backend completeness receipt
- Minimal documentation pointers to the canonical command and bounded claim

### Done criteria

- One documented command runs the complete bounded proof and exits non-zero on every listed negative case.
- The successful receipt proves:
  - `Kinds_profile = Kinds_exercised = 13`
  - `Backend_signatures_admitted = Backend_signatures_exercised = 16`
  - `Criteria_profile = O_spec = O_gen = T_gen = E_run = 16`
  - zero skips, todos, orphans, unrunnable obligations, and surviving targeted mutants.
- The core receipt includes exact kinds, signatures, criteria, obligations, tests, execution results, mutants, zero-residue fields, and independently replayed raw input/output digests.
- Receipt verification detects any input or output digest change.
- The command does not claim relationship, semantic, cross-feature, UI, code-conformance, or universal completeness.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run verify:bte:core
npm --prefix projects/domainspec-v2/impl run validate
```

The second command is required only after the repository aggregate explicitly includes the new required check.

### Owner and handoff

- Implementation owner: DomainSpec v2 validation owner.
- Release decision owner: first-production-release owner.
- Handoff: give the green `verify:bte:core` receipt handle to the independently governed IOLM and Body War owners; after both return fresh receipts, route all three handles to TASK-BTE-INTEGRATED-CONSUMER-MANIFEST and then TASK-BTE-VERIFY.
