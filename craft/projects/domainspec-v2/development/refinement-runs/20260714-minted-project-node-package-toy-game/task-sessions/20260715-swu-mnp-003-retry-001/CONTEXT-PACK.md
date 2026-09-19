# Lean Context Pack — SWU-MNP-003 Retry 001

Session evidence, not canonical authority.

- Coverage: `9/9`; strict local execution: pass.
- Dependencies: SWU-MNP-001, 002, and 001-R1 receipts pass.
- Formation mapping: four profile-bound per-kind body schemas.
- Write scope: compiler/validator/normalization modules under
  `impl/tools/minted-project/`, compiler test, this evidence, status records.
- Validation: targeted compiler test, full tools suite, TypeScript, deterministic
  two-run byte comparison, diff check.
- Blockers: none.

## Obligations

Validate project/feature/node source contracts; bind profile and registry
digests; enforce per-kind formation; index unique nodes/edges; lift source-owned
connections; distinguish unknown/generated/deprecated/deferred/out-of-profile
relationships; enforce endpoints and current no-cross-feature claim; emit sorted
graph and total source manifest; prove deterministic equality.
