# Bounded helper receipt — CLI surface audit

- Route: Arcanum/Craft continuation, read-only helper.
- Scope: existing `impl/cli`, internal factory CLI and kernel scaffolding.
- Result: complete.
- Writes: none.

## Findings

- `@domainspec-v2/cli` declares `domainspec-v2 -> dist/cli/main.js`, but no
  source main or built distribution exists; the source exports identity
  constants only.
- Project ingestion validates and fingerprints project, feature, node and edge
  files, but node `kind` and `body` are not closed to the meta-type contracts.
- The internal factory provides `inspect`, `init`, `plan`, `run`, `replay`,
  `verify` and `reproduce`; its providers emit semantic proof results, not
  generated project artifacts.
- Factory `init` creates an empty expected-red kit, and factory planning locks
  repository-contained references.
- The missing bridge is a portable frozen catalog, typed project-node decoder,
  generator contract, guarded external writer, result receipt and public CLI
  command.
- The existing foundation contract permits only `lint` and `receipt` with
  `writes: none`; instantiation requires an intentional versioned replacement.

## Recommended L0

Instantiate one TypeScript Entity into a new empty explicit target, emit a
baseline-bound receipt and re-read the result. Required hostile coverage:
traversal, symlink, overwrite, unknown type/language, baseline drift and output
drift.

Claim ceiling: this helper found the integration seam and recommended an L0. It
did not admit or freeze bytes, mutate product code, or prove a generated target.
