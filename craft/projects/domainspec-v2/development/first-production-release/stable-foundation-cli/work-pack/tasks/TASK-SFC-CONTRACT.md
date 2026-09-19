# TASK-SFC-CONTRACT — Foundation and package boundary

Layer/slice/wave: L0 / SFC-S1 / W0.

## Objective

Make the accepted candidate and package boundary machine-checkable before
reusing implementation code or changing dependency authority.

## Source contracts

- `SPEC.md#product-boundary`, `#command-contract`, `#non-goals-and-claim-ceiling`.
- `REQUIREMENTS.md#functional-requirements`, `#build-and-runtime-requirements`.
- owner decision SF-01 through SF-21 at the hash in `shared/SOURCE-BINDINGS.json`.

## Implementation detail

The validator canonicalizes the foundation contract, validates a closed schema,
recomputes its decision/product/profile input digest, and rejects unknown fields,
changed selected options, broadened claims, or a non-none authority effect. The
package boundary exposes only one `domainspec-v2` bin and curated library-internal
entry; current development commands are neither re-exported nor renamed.

## SWU-SFC-001 — closed foundation-contract validator

- Primary behavior: accept exactly the SF-01..SF-21 candidate contract and reject
  a one-branch mutation.
- Independent acceptance: dependency-free Node test passes for accepted bytes and
  fails for missing/extra/changed branch, stale digest, and authority mutant.
- Split analysis: schema, accepted instance, validator, and test were considered;
  without all four there is no executable closed-contract proof. Package creation
  can pass independently and remains SWU-002.
- Dependencies: none.
- Write scope:
  - `projects/domainspec-v2/impl/cli/contracts/foundation-contract.schema.json`
  - `projects/domainspec-v2/impl/cli/contracts/foundation-contract.json`
  - `projects/domainspec-v2/impl/cli/tools/validate-foundation-contract.mjs`
  - `projects/domainspec-v2/impl/cli/test/contract/foundation-contract.test.mjs`
- Done: stable canonical digest, closed decode, all 21 branches, claim ceiling,
  negative mutant, and no writes outside scope.
- Validation: `VC-SFC-001`.
- Execution owner: local-fallback or one bounded Task Session worker.
- Expected receipt: `runs/SWU-SFC-001/TASK-SESSION-RESULT.json`.
- Handoff: return exact hashes, test output, mutant result, and any option mismatch;
  do not create package/build files.

## SWU-SFC-002 — product package namespace boundary

- Primary behavior: create the isolated `@domainspec-v2/cli` package/bin/type
  boundary without changing root dependency authority.
- Independent acceptance: package/name/bin/export/tsconfig tests prove only the
  supported entry is exposed and current development CLI/factory commands remain internal.
- Split analysis: package metadata, minimal entry/version module, README, and
  boundary test form one import/identity contract; npm lock migration is independently
  verifiable and remains SWU-009.
- Dependencies: SWU-SFC-001.
- Write scope:
  - `projects/domainspec-v2/impl/cli/package.json`
  - `projects/domainspec-v2/impl/cli/tsconfig.json`
  - `projects/domainspec-v2/impl/cli/README.md`
  - `projects/domainspec-v2/impl/cli/src/index.ts`
  - `projects/domainspec-v2/impl/cli/src/version.ts`
  - `projects/domainspec-v2/impl/cli/test/contract/package-boundary.test.mjs`
- Done: package identity, private candidate version, bin, exact exports, Node/platform
  guard declarations, and no dependency/lock/source-workspace mutation.
- Validation: `VC-SFC-002`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-002/TASK-SESSION-RESULT.json`.
- Handoff: return package manifest digest and exported-symbol census; do not edit
  `impl/package.json` or a lock.

## Synchronization

Use the exact closeout targets in `shared/SWU-MANIFEST.json`. Successor is 002
after 001, then 003 after 002; closeout never starts the successor.

