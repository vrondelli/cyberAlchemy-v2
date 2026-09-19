# Lean Context Pack — SWU-MNP-005

Session evidence, not canonical authority.

- Coverage: `8/8`; strict local execution: pass.
- Dependencies: contract repair and view receipts pass.
- Write scope: minter modules and generic template below
  `impl/tools/minted-project/`, minter tests, this evidence, status synchronization.
- Runtime: local; adapter/subagents: none; Decision Gate: not required.
- Validation: targeted minter, full tools suite, TypeScript, diff check.

## Obligations

Reject non-empty destinations by default; stage below the destination parent;
emit only generic, replaceable machine-node project structure; contain
`generated_root`; contract-validate and compile/view-smoke the staging project;
scan for fixture semantics, checkout paths, and private prose; atomically promote
or fully roll back; prove deterministic identity-bound minting; return a receipt
with template/tool/schema digests and created paths.
