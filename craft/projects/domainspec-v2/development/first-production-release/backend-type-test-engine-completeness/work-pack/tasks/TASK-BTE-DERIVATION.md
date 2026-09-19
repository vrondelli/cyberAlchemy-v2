> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for the L5/L6 replacement route.

# TASK-BTE-DERIVATION — Exact derivation, execution, and mutation proof

## Objective

Derive backend obligations from compiled minted-project evidence, compare them exactly with the independent catalogue, execute every resulting test, and prove every targeted mutation is detected.

## Dependencies and blockers

- SWU-BTE-006 depends on SWU-BTE-003, SWU-BTE-004, and SWU-BTE-005.
- SWU-BTE-007 depends on SWU-BTE-006.
- A missing feature, empty release witness, catalogue mismatch, skipped test, or surviving mutant is a failure.

## SWU-BTE-006 — Derive `O_gen` from compiled evidence

### Goal

Use the compiled graph and source manifest, not a raw node-directory scan, to derive the exact obligation set exercised by the engine.

### Algorithm

1. Compile the all-kind witness through the canonical minted-project compiler.
2. For each graph node, resolve its source-manifest entry, profile binding, schema digest, and current criterion list.
3. Emit one `O_gen` record per node/criterion pair with a stable key derived from profile identity, node ID, criterion ID, and schema digest.
4. Sort and compare `O_gen` against frozen `O_spec` by exact ID set and contract metadata.
5. Reject missing or extra obligations, duplicate keys, unknown kinds, missing source entries, stale digests, empty evidence, and graph/source disagreement.
6. Persist a deterministic derivation receipt without rewriting `O_spec`.

### Write scope

- Derivation-engine minted-project adapter and tests under `impl/test-derivation-engine/`
- Run-scoped derived-obligation and comparison receipts
- No write to canonical source nodes or independent catalogue

### Done criteria

- `O_gen = O_spec` as an exact 16-ID set.
- All 13 profile kinds occur in both sets.
- Every generated record traces to graph node, source manifest, schema, and criterion.
- Missing-feature and empty-witness fixtures fail non-zero.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run engine:test
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run typecheck
```

### Owner and handoff

- Implementation owner: derivation-engine maintainer.
- Verification owner: independent catalogue owner.
- Handoff: provide the exact-set receipt and derived test manifest to SWU-BTE-007.

## SWU-BTE-007 — Execute every obligation and kill every targeted mutant

### Goal

Turn each derived obligation into an executable structural test and prove its targeted invalid variant is rejected.

### Algorithm

1. Emit one runnable test case per obligation key using the canonical source node and shared criterion kernel.
2. Emit or select the paired mutant and assert that the targeted criterion produces the expected diagnostic code.
3. Reject generated `skip`, `todo`, empty bodies, unresolved imports, and duplicate test names before invoking the test runner.
4. Execute the generated suite and reconcile discovered, scheduled, executed, passed, failed, skipped, and todo counts by exact IDs.
5. Execute every targeted mutant and require all 16 to be killed for their intended criterion.
6. Record commands, tool versions, input digests, result sets, and timestamps in a replayable receipt.

### Edge cases

- A test file exists but is not discovered by the runner.
- A mutant fails because of a different, earlier validation layer.
- A generated assertion is vacuous or catches its own exception.
- A test is renamed or duplicated between derivation and execution.
- The runner exits zero with no matching tests.

### Write scope

- Generated backend formation suite under the derivation-engine evidence convention
- Test-manifest and mutation-runner support under `impl/test-derivation-engine/`
- Run-scoped execution and mutation receipts

### Done criteria

- `T_gen = E_run = 16` by exact obligation IDs.
- Zero skips, todos, undiscovered tests, orphan tests, or duplicate IDs.
- All 16 targeted mutants are killed by their intended criterion.
- The receipt can be independently replayed from recorded inputs and commands.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run engine:test
npm --prefix projects/domainspec-v2/impl run typecheck
```

### Owner and handoff

- Implementation owner: derivation-engine maintainer.
- Verification owner: release evidence owner.
- Handoff: deliver exact-set, execution, and mutation receipts to TASK-BTE-INTEGRATION.
