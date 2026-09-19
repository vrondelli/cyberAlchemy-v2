# Bourbaki implementation-completion audit

- Dispatch: `2026-07-20-evf-implementation-completion-review`
- Scope: implementation completion only; governance completion is excluded
- Posture: read-only audit of the frozen package and live pinned-source state

## Verdict

REJECT

The corrected findings are conservative and incorporate most verifier revisions, but the package is not promotable while the backend sequence reassigns an existing SWU to the wrong work.

## Checklist

- **PASS — frozen corpus integrity:** `corpus-manifest.json` has 61 entries; all 61 paths exist and all current SHA-256 values match. The findings contain exactly 61 numbered KEEP/FIX decisions in manifest order (52 KEEP, 9 FIX).
- **PASS — report integrity:** all three attacker returns and both verifier reports are embedded byte-identically in `attacks.md`.
- **PASS — Lean window identity:** `lean-111-commit-window.tsv` is byte-identical to `git log --name-status` for the latest 111 commits at pinned head `c2ed8782706083d77323c57ffe722b918deeab67`; its oldest commit is `6319cb5d96b77186fdb09015350a3b128b1e116d` and that commit's parent is the recorded lower bound `57e4d66f9e5ab037c4987ffc53a849b84bc71de3`.
- **PASS — Lean source cleanliness:** the unsafe Lake side effect from the interrupted audit was restored byte-for-byte to tracked `leanprover/lean4:v4.30.0-rc2` with its trailing newline. `git -C domainspec-lean-formalization status --porcelain=v1` is empty at pinned head `c2ed8782706083d77323c57ffe722b918deeab67`. No Lake command or update hook was rerun.
- **PASS — verifier accounting:** the appendix has exactly 15 original IDs with both Rittel and Capucci dispositions plus a concrete resolution. Original `ICR-BTE-002` appears only in that appendix and records Capucci's `REFUTE`; the survivor table contains the distinct replacement `ICR-BTE-002R`.
- **PASS — authority separation:** the final candidate keeps the accepted successor profile as the 16-signature authority, forbids a second selected-16 manifest, and leaves code-tag composability as optional consumer evidence. It keeps `DEC-GCP-001` pending, requires `FORMAL_PREDICATE_MISSING` until an owner-admitted machine predicate exists, prevents Markdown, fixtures, generated artifacts, `O_spec`, runtime output, and receipts from authoring semantics, uses a direct typed-object evaluator without extending Markdown `parseFormal`, and specifies a bounded minted adapter plus extension of existing `Binding`/`BindingSet` rather than a parallel binding authority.
- **PASS — executable command corrections:** every focused Vitest command in the final candidate uses the `@domainspec/test-derivation-engine` workspace. The final acceptance surface excludes the unsafe Lake commands retained only as verbatim historical attack/inventory evidence.
- **PASS — S1 atomicity:** `ICR-S1-001..007` remain dependency-ordered subtasks inside one atomic `SWU-GCP-001`, under one resumed Task Session and one canonical terminal command, `verify:evf-s1`.
- **FAIL — backend SWU identity and order:** frozen `backend-type-test-engine-completeness/WORK-PACK.md:67` defines `SWU-BTE-009` as edge coverage: independent edge roots plus causal 16-signature witnesses. `findings.md:166,174` instead says `SWU-BTE-009` runs the IOLM and Body War consumer gates. The candidate's `ICR-BTE-002R` describes the missing edge resolver but never preserves its existing `SWU-BTE-009` identity. This contradicts `findings.md:213`'s claim that the package follows the existing successor-profile SWUs. Preserve `SWU-BTE-009` for edge coverage, include it in core prerequisites, then run independently governed IOLM and Body War consumers after `verify:bte:core` and before `SWU-BTE-010`/terminal `verify:bte`.
- **PASS — consumer evidence boundary:** subject to that sequencing repair, terminal exit requires fresh, independently produced IOLM and Body War receipts, exact identity/digest comparison, explicit non-admission, and rejects schema/fixture-only substitution.
- **PASS — scope and claim discipline:** the candidate adds no Markdown machine authority or governance implementation. It retains `BLOCK` for current S1 and backend completion, so its claims do not exceed the frozen proof.

## Residual risks

1. Do not use the unsafe Lake commands retained in historical reports as acceptance checks; the pinned source is clean only after restoration of that audit-side effect.
2. `DEC-GCP-001` still recommends an evidence-local Markdown source, while the corrected findings prohibit Markdown semantic authority. The block is honest, but the eventual decision must admit a machine contract and must not revive that recommendation silently.
3. The frozen build baseline is valid only at its stated component scope; it is not S1 or backend completion evidence.

## Dispatch closure

Dispatch may close resolved: **NO**. Repair the `SWU-BTE-009` mapping/order, then rerun the final audit against the unchanged or deliberately refreshed evidence boundary.
