# Lean Context Pack — SWU-MNP-005 Retry 001

Session evidence, not canonical authority.

- Coverage: `9/9`; strict local execution: pass.
- Dependencies: contract R2 and view receipts pass.
- Write scope: minter modules and generic template below
  `impl/tools/minted-project/`, minter tests, this evidence, status synchronization.
- Runtime: local; adapter/subagents: none; Decision Gate: resolved.
- Validation: targeted minter, full tools suite, TypeScript, diff check.

## Obligations

Reject existing/non-empty destinations under a non-destructive policy; stage
beneath the destination parent; emit a generic zero-feature project plus an
example-free feature root and contained `generated_root`; compile and build views
in staging; write generated outputs only below that root; scan all emitted bytes
for fixture semantics, checkout paths, and private authority prose; atomically
promote or completely roll back; prove deterministic identity-bound minting; and
return template/tool/schema digests with created paths and build receipt.
