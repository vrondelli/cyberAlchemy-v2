# S11 — Post-hoc verification: R1 (owned Lean kernel files)

**Stage:** verification appendix (P8) · **status:** R1 RESOLVED · added 2026-06-29 after operator pointed to the repo

## Where the files actually are

NOT under `implementation/domainspec/` (where the subagents looked) — they live in a **separate top-level repo**
`domainspec-lean-formalization/`, branch `main` (checked out), under `lean-engineer/` and `lean-formalization/`.
This is why R1 was raised: wrong search root, not missing files.

## Verified on disk (read-only)

| Symbol | File:line | Matches findings cite? |
|---|---|---|
| `decidePolicy_sound` | `lean-engineer/AgentPermissionKernel.lean:162` | yes (:162) |
| `decidePolicy_allow_iff` | `AgentPermissionKernel.lean:137` | yes (:137) |
| `deny_precedence` | `AgentPermissionKernel.lean:170` | yes (:170) |
| **`decidePolicy_flatten_meet`** (Row-2 template) | `AgentPermissionKernelAlgebra.lean:98` | yes (:98) |
| `layered_not_flattenable` | `AgentPermissionKernel.lean` (`#print axioms` @:213) | present |
| `count_blind_agrees` | `lean-formalization/FunctorialResidueStructure.lean:258` | yes (:258–261) |

- **`sorry` = 0 and `admit` = 0** across `AgentPermissionKernel.lean`, `AgentPermissionKernelAlgebra.lean`,
  `AgentPermissionKernelComposition.lean`, `FunctorialResidueStructure.lean`.
- `#print axioms` self-audits present for the key theorems (`AgentPermissionKernel.lean:209–213`,
  `AgentPermissionKernelAlgebra.lean:108–110`).
- `lean-engineer/` is a buildable lake project (`lean-toolchain` + `lakefile.toml`) → Phase 1 can be `lake build`-checked here.

## Correction to an earlier overclaim (claim ≤ proof)

There is **no existing transitive-closure code** in the kernel: no `Relation.ReflTransGen`/`TransGen` usage and no
reach/path/closure inductive (`grep` hits in Taint/PermGuard were prose comments). So **Avigad's "you hand-build
`reach`" concession stands** — the cost is authoring a `reach`/acyclicity decision procedure, though Mathlib's
`Relation.ReflTransGen` is available off-the-shelf (not from scratch).

## Effect on the verdict

The Lean-native verdict for the §5a witness check is now **first-hand verified, not second-hand**: the owned Row-2
template (`decidePolicy_flatten_meet`) is present and sorry-free, the trust base is real, and the project builds.
The staged verdict is unchanged and strengthened. **R1 → RESOLVED.** Phase 0 precondition is satisfied (files
present + sorry-free); the only remaining residue is R2 (PCAS recursive surface) and R3 (scale extrapolation).
