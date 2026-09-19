# Context Pack: ORODI Evidence Eligibility

Run ID: `20260824T231438Z-orodi-evidence-eligibility-v1`

The completed prototype chain is:

1. WP1 generic operational-evidence contracts and validator.
2. WP2 derived foundational-control evaluator for C01, C05, C11, C12, C14, and C15.
3. WP3 exact legacy-v1 source inventory and pure declaration normalizer.

WP3 deliberately emits candidate-local simulation observations. The remaining risk is semantic laundering: the existing derived evaluator treats any safe product observation as evidence for C05 and C15 and any product simulation as evidence for C11. A legacy declaration replay must not cross that boundary.

The authorized WP4 outcome is a repository-local eligibility gate that classifies every legacy-normalized observation as replay-only or rejected, admits none as runtime evidence, constructs a replay fact boundary with an empty runtime-admitted observation set, and invokes the existing derived evaluator over that admitted set. C01 and C14 may still pass from binding facts; C05 and C15 must derive `missing`, while C11 and C12 must derive `not-run`.

Hard boundaries: no live profile admission, no runtime-eligible result in this lane, no source-file mutation, no network, no dependency installation, no infrastructure, load, canary, deployment, rollback, Git, promotion, or lifecycle reconciliation. Baseline product digest is `d2ce194a93164655d1212819f5c4ac6ed06d42ba432786ecd5497cee80446d1d` across 66 files.

Claim ceiling: candidate-local classification, replay containment, derived rejection evidence, and deterministic tests only. `authority_effect` remains `none`.
