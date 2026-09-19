# Meta-type instantiation CLI — implementation plan

## Objective

Build a `domainspec-v2` CLI that consumes a DomainSpec project, selects an exact
meta-type realization from `domainspec-meta-types-current-implemented@2`, writes
an instantiated implementation into another project, and emits evidence that
can later be used to check that target against the same frozen selection.

The accepted baseline is immutable and is identified by digest
`10c29c2a4feb5039b6c90dcd7e2d44024757b4dd2414f9c0383c82387ec6e836`.
No per-type architecture or language-form decision is reopened by this plan.

## Architecture boundary

The existing package ingestion remains the source reader. The frozen baseline
becomes a closed catalog. Generation is split into a pure planner and a guarded
publisher:

```text
project root -> typed node decoder -> frozen catalog selection
             -> pure artifact plan -> guarded atomic publisher
             -> output observer -> instantiation receipt
```

The internal factory proof runner remains a proof/evidence dependency; it is
not treated as a code generator. Its expected-red scaffolder is reusable only
as a pattern for deterministic artifact plans.

## Waves

### W0 — freeze and product-contract boundary

- `SWU-MTCLI-001` — freeze the complete current implemented-evidence baseline.
  Status: complete. Writes are confined to this development package.
- `SWU-MTCLI-002` — create a candidate-2 CLI foundation contract that adds the
  `instantiate` command and bounded writes while preserving candidate-1 as
  historical immutable evidence.
- Gate: the new contract, schema and hostile contract tests pass without
  changing candidate-1.

### W1 — TypeScript Entity end-to-end

- `SWU-MTCLI-003` — implement the immutable catalog loader and exact selection
  of one `meta_type_id/language` row.
- `SWU-MTCLI-004` — add a closed project-node decoder for the Entity generation
  input required by L0.
- `SWU-MTCLI-005` — implement the pure TypeScript Entity artifact planner.
- `SWU-MTCLI-006` — implement a safe publisher with target containment,
  symlink rejection, new-empty-target enforcement, no overwrite and atomic
  rename.
- `SWU-MTCLI-007` — add `src/cli/main.ts`, receipt production and independent
  post-write observation.
- Gate: two isolated Entity runs produce the same relative paths, contents and
  hashes; every hostile path fails closed before an external write.

### W2 — 39-row generalization

- `SWU-MTCLI-008` — define closed body schemas for all 13 backend types.
- `SWU-MTCLI-009` — add the remaining TypeScript generators.
- `SWU-MTCLI-010` — add Python generators.
- `SWU-MTCLI-011` — add Rust generators.
- `SWU-MTCLI-012` — require aggregate 13/39 catalog-to-generator coverage.
- Gate: no frozen row is missing and no unlisted generator is reachable.

### W3 — relationship and semantic enforcement

- `SWU-MTCLI-013` — close relationship decoding against the frozen relationship
  authority.
- `SWU-MTCLI-014` — materialize Operation-to-Rule/Event/Workflow relationships.
- `SWU-MTCLI-015` — observe declared read/write/effect sets, guard-before-write,
  state/outbox atomicity and failure continuations in the generated target.
- `SWU-MTCLI-016` — add hostile causal mutants and target-conformance receipts.
- Gate: positive generated target passes and each semantic mutant fails for its
  declared causal reason.

### W4 — stable CLI integration

- `SWU-MTCLI-017` — make `lint` and `receipt` consume the baseline-bound
  instantiation receipt.
- `SWU-MTCLI-018` — add clean-root package build and isolated target fixtures.
- `SWU-MTCLI-019` — run deterministic replay and package inventory review.
- Gate: private package evidence passes. Publication, release and deployment
  remain separate owner actions.

## Validation strategy

Run from `projects/domainspec-v2/impl` with the repository-pinned runtime:

```text
./node_modules/.bin/tsc --project cli/tsconfig.json --noEmit
node --import tsx --test cli/test/input/project-root.test.ts cli/test/generation/*.test.ts cli/test/cli/*.test.ts
node --test cli/test/contract/*.test.mjs
node cli/tools/validate-foundation-contract.mjs
vitest run architecture-conformance/kernel/scaffolding/scaffolding.test.ts architecture-conformance/factory/tests/execution.test.ts --maxWorkers=1 --minWorkers=1
```

Every mutating test must use a newly created temporary target and verify the
complete resulting inventory. No test may write into a user project fixture.

## Current boundary

This is the product implementation plan anchored to the owner-admitted frozen
baseline. It is not a claim that a current Invoke Plan v2 bundle has been
independently admitted; the older implementation-conformance Design does not
expose the current Design v3 stage/admission pair required by that compiler.
That tooling mismatch does not reopen the product decision or the baseline.
