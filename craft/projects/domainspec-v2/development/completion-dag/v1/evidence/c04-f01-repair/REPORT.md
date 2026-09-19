# C04-F01 repair: tested and independently reviewed

The shared release qualification validator rejects the internally inconsistent certificates identified by C04-F01. The builder invokes it before compilation/package construction; the portable verifier uses the same implementation. The four-file patch is in `repair.patch`, with base and postimage hashes in `repair-manifest.json`.

Validation: 30/30 release tests pass, including 28 named internal-record regressions tested through both verifier and builder. Those regressions refresh outer bundle hashes. Additional profile/equivalence/raw-evidence/file-set cases pass. The original C03 bundle passes all 44 checks under the repaired verifier; the exact original C04 reproduction now fails on certificate and observation checks in both runs. The independent reviewer accepted the repair and rejected 2,687 malformed-field mutants without exceptions or unexpected passes. The patch applies to the selected base and produces all four reviewed postimages.

The synthetic fixture is test data, not qualification evidence. Historical C03 and C04 bytes remain unchanged. This report does not turn the original candidate's C04 BLOCK into PASS.

## Remaining product construction

To create the successor release candidate, the existing builder requires a clean selected Git commit. The repair is currently uncommitted. The proposed next operation is one local commit based on `9832ee36c5332be825ff065fb8cff05b23b2fd81`, in an isolated worktree, containing exactly the four files in `repair-manifest.json`. No unrelated working changes or evidence files are included; no push is proposed. Root AGENTS.md requires an exact authorized commit envelope, so this operation awaits user authorization.

After that commit: build two successor bundles, run affected verification and isolated consumer checks, and independently review the exact successor candidate before C05 product approval can be considered. Source changes require new source identity; no old commit may be relabeled as containing this repair. Other dependency-ready product tracks E00/R00/U00/L00 remain independent and are not executed by this bounded repair.

## Operational support

O01 hosted-evidence inspection remains deferred to the Repository/release owner (actor unassigned), affecting compiler-release-preparation. It does not block repair work. The exact local source-commit operation is the current prerequisite for successor candidate construction under the builder contract; it does not authorize publication or deployment.

No ontology records or selectors are required by this repair. D65 construction stages and the finite product contract carry forward from P00/C00; no new definition or approval is manufactured. Product approval and operational effects remain separate.
