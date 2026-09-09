---
node_type: contract
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template; intended-not-shipped, non-executed
created: 2026-06-29
authored_by: task-session (SWU-1)
swu: SWU-1 (L0 compose contract)
note: Paths are repo-root-relative from domainspec-core/. Mint COMPOSES domainspec-new-repo; it does NOT edit it.
---

# Mint — L0 Compose Contract (SWU-1)

> **Stage 1 of the 5-stage mint flow** (ARCHITECTURE-BUNDLE §The 5-stage mint flow,
> row 1 `scaffold`). Mint *calls* `domainspec-new-repo` to produce the doc-tree +
> clone-safe attach (the smaller half). **Mint owns no scaffolding logic** — it owns
> the authority-spine casting that runs *after* this stage (SWU-2/SWU-3, L1).

## The hard boundary (WORK-PACK task-local note 1; review C6)
**Mint does NOT edit `domainspec-new-repo`.** The scaffolder is owned by cav2/DomainSpec
and is, by its own charter, *"coins no edges, enforces nothing"*
(`implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md:21`). Mint
composes it as a black box: it supplies inputs and consumes the produced tree. Any change
the mint needs to the scaffolder is a separate route to the scaffolder's owner — never a
mint-side patch.

## The exact call (two-phase: plan → apply)

The scaffolder is **gate-first**: `--mode plan` is the default and writes nothing;
`--mode apply` mutates only after the scaffolder's own single master gate (Step 5).
Mint drives both phases.

### Phase A — plan (dry, default; surface and confirm)
```bash
domainspec-new-repo <TARGET_REPO_PATH> \
  --source <FRAMEWORK_REPO_PATH> \
  --attach submodule \
  --mode plan
```
- `<TARGET_REPO_PATH>` — where the minted repo is created (a **sibling** of
  domainspec-core, never inside it).
- `--source <FRAMEWORK_REPO_PATH>` — the framework half to attach (cav2 + DomainSpec +
  Arcanum). Resolves the canon (`vault/**`), dev constitutions, the `.claude/` carve-out,
  and the code-ontology + experiments machinery **from the source at run time** (not a
  hardcoded file list).
- `--attach submodule` — the **default, clone-safe** attach (review C3/C8: use `--mode`,
  not `--dry-run`). `copy` and `symlink` are opt-ins; `symlink` is warned ("breaks on
  clone/move" — goldenquill's exact defect) and Mint does not select it.
- `--mode plan` — emits the target-tree diff + ordered action list, writes nothing.
  Mint surfaces this plan to the operator.

### Phase B — apply (after the operator confirms the plan)
```bash
domainspec-new-repo <TARGET_REPO_PATH> \
  --source <FRAMEWORK_REPO_PATH> \
  --attach submodule \
  --mode apply
```
- `--mode apply` crosses the scaffolder's **own master gate (Step 5)** — Mint inherits
  that gate; it does not add a second one at L0. (review C3: `apply` surfaces exactly one
  human gate, owned by the scaffolder.)

## What L0 produces (consumed by L1)
The scaffolder's subject-primary partition tree (goldenquill R-1 shape):
- `knowledge/{domain_knowledge, system_design_knowledge, vault}/` — vault is the
  **attached** read-only-by-intent canon; system_design_knowledge holds copied process
  constitutions + architecture stubs;
- `implementation/`, `research/`, `sessions/` (one canonical), `schema/code-ontology/`,
  optional `experiments/` and `internal_tools/` mirror;
- a clone-safe framework attach at `domainspec/` (submodule mount);
- a provenance session node (`is_session: true`, `node_type: discovery`, forward-only).

**L0 does NOT produce the authority spine.** The minted tree has `knowledge/` and
`implementation/` slots but **no** `authority/`, `definitions/`, `constitutions/`, or
`RELATED-FRAMEWORK-CROSSWALK.md` — those are cast by L1 (SWU-2 templates → SWU-3 emit).

## Clone-safe inheritance (the Step-7 verify is the L0 acceptance gate)
The scaffolder's **Step 7** verifies (non-negotiable Bash check) that
`knowledge/vault/ontology-conventions.md` resolves to a **real, non-empty doc** — NOT a
one-line path string (the broken-symlink signature goldenquill shipped). **L0's acceptance
evidence = this Step-7 verify PASSES** (WORK-PACK SWU-1 acceptance: "a minted tree is
produced + Step-7 clone-safe verify passes"). If it fails, the attach failed: stop, do not
hand a broken tree to L1.

## Compose-seam invariants
1. **No mint-side scaffolder edits** — composition only (boundary above).
2. **Gate inheritance** — `apply` crosses the scaffolder's master gate; Mint adds no
   second L0 gate.
3. **Clone-safe by default** — `--attach submodule`; Mint never selects `symlink`.
4. **Sibling, not nested** — `<TARGET_REPO_PATH>` is outside domainspec-core.
5. **Tree-only output** — L0 hands L1 a tree with empty authority slots; the casting is L1's.

## Validation (SWU-1)
- Run on a **throwaway target path**; inspect the produced tree (WORK-PACK SWU-1 verify).
- Assert: partition tree present; `--attach submodule` mount resolves; Step-7 canon-verify
  PASS; **no** `authority/` spine emitted at L0 (that is L1's, by design).
