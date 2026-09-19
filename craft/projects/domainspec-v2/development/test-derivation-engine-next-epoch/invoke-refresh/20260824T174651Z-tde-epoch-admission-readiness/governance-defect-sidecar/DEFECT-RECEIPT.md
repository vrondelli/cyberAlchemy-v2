# TDE Refresh Material-Inventory Governance Defect Receipt

## Classification

- Status: resolved in staged material; apply remained stopped until this receipt.
- Defect class: governance-only material-inventory and validation-coverage defect.
- Authority effect: none.
- Product semantics disputed: no.
- Product or Task Session execution performed: no.

## Root cause

The initial staged successor was inventoried as every file under its candidate root. That root still contained two run-local receipts copied from the predecessor lifecycle:

- `HELPER-RECEIPT.json`
- `PARENT-SWU-AUDIT-GOVERNANCE-DEFECT-RECEIPT.json`

The initial material package, target inventory, and approval scope all listed the same 83 paths, so `material_package_validator.py` correctly proved internal set equality, exact bytes, ownership, and publication boundaries. It had no target-role rule that could distinguish successor artifacts from copied run-local receipts. The resulting 83-file receipt and Refresh handoff therefore passed syntactically while admitting two semantically ineligible target files.

## Affected invariant

The exact target inventory for a create-only successor must contain only intended successor artifacts. Run-local helper and governance-defect receipts belong to their originating run's evidence surface and must not be promoted as successor-plan content. Equality among approval scope, changes, and target inventory is necessary but not sufficient when all three are constructed from the same over-broad filesystem enumeration.

## Evidence

- The initial package was observed with 83 changes and included the two exact receipt paths above. Its canonical package digest was `43602448225df6d39db1cece36813186aba77d61c7f02c5de1e91140ca21753c`; its material-receipt file SHA-256 was `492d0c811c4479ffcd8961e89ae91fb4fc6b796aae05f38747a4e3b10b0a36a4`.
- Apply had not occurred when the defect was found.
- The current staged tree contains 81 files and neither receipt path.
- The regenerated current material receipt has canonical package digest `b1e5819b5b22ff7917114e1d9dd7a72b92b4c16ee2575f76a641af0442f58a30`, validates 81 paths, reports `patchVerdict: pass`, and reports `mutationHandoff: ready`.
- The current Refresh handoff reports `handoffStatus: ready` and `mutationReady: true` for the corrected package.

## Minimal repair

1. Keep the apply edge stopped while the initial 83-file evidence is superseded.
2. Exclude the two exact run-local receipt paths from staged successor material.
3. Regenerate the target inventory, approval scope, material package digest, material receipt, and Refresh handoff from the resulting 81 exact targets.
4. Preserve the 83-file package and receipt as failed/superseded evidence; do not overwrite their historical meaning or reuse their digests.
5. Resume apply only after the corrected staged bytes and regenerated bindings pass the required revalidation below.

## Required revalidation

- Prove the staged file set has exactly 81 paths and that both stale root receipt paths are absent.
- Re-run the material-package validator against the corrected package and receipt schema.
- Re-run the Refresh material-handoff resolver with the corrected package digest and exact receipt SHA-256 binding.
- Re-run all acceptance-critical checks against the actual staged create targets, including JSON parsing, Markdown trailing-whitespace and EOF checks, normalized-path and symlink checks, and the declared plan validations.
- Preserve every command exit independently; a later passing command must not mask any earlier failure.
- Immediately after apply, compare every created target hash against the corrected 81-file target inventory and reject missing or extra target files.

## Owner acceptance

Removing the two stale receipts does **not** require a second owner approval merely to complete this already-authorized bounded Refresh repair: apply never occurred, no exact @2 plan acceptance existed, and no semantic or authority decision changed. The initial 83-file material receipt is nevertheless unusable after the repair.

Fresh exact Rondelli acceptance **is still required** before Task Session admission or product implementation. That request must bind the corrected 81-file successor inventory and its final candidate digest. If any acceptance had bound the 83-file candidate, it would be invalid for the 81-file candidate and would have to be renewed; an older acceptance must never be stretched across the changed inventory.

## Permanent regression check

Add a fail-closed target-admissibility check before material-package success:

1. Candidate construction must use an explicit intended-artifact allowlist, not an unqualified recursive enumeration of the staged root.
2. The material validation workflow must reject the exact root-level legacy receipt names `HELPER-RECEIPT.json` and `PARENT-SWU-AUDIT-GOVERNANCE-DEFECT-RECEIPT.json` when they appear as successor targets.
3. Add an adversarial fixture containing either receipt and assert a non-zero/reject result before owner acceptance is requested.
4. Retain the existing exact equality check among approval scope, changes, and target inventory; the new admissibility check supplements rather than replaces it.

## Changed-byte inventory

This sidecar created only this Markdown receipt and `DEFECT-RECEIPT.json` in the bounded `governance-defect-sidecar/` directory. It did not mutate staging, material evidence, successor targets, accepted bytes, authority, implementation, or Git state.
