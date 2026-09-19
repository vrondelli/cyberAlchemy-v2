# EVF L1 Plan Refresh Apply Report

## Outcome Brief

The exact material package for accepted postimage package `b61f9935…` passed its scope, baseline, ownership, publication, producer-receipt, and file-bound handoff gates. The transaction then installed and verified all 20 postimages, but the first post-apply lifecycle check found that four accepted files still described independent review, owner acceptance, and canonical apply as pending. Because the user authorized apply only if every gate passed, the apply edge stopped and the exact pre-apply state was restored.

- Objective: assemble, validate, and conditionally apply the accepted EVF L1 planning package.
- Result: apply attempt blocked after acceptance-critical lifecycle validation; 11 updates were restored, 9 creates were removed, and the original 20-target preflight passes again.
- Why it matters: no misleading lifecycle state remains canonical, and readiness or implementation cannot start from package `b61f9935…`.

## Boundary and Next Decision

- Changed: run-local material, apply, failure, rollback, helper, and Refresh evidence under this planning run.
- Unchanged: the canonical EVF planning tree is back at its exact pre-apply state; Work Pack Readiness, Implementation Readiness, Task Session, P4, R4, L2, providers, Git, publication, release, and deployment were not entered.
- Open questions: none about the defect boundary. The exact affected subset is `PLAN.md`, `WORK-PACK.md`, `work-pack/shared/GAPS.md`, and `work-pack/shared/CROSS-TASK-GAPS.md`.
- User decision: authorize a fresh proposal-only four-postimage lifecycle repair if development should continue. That repair must be recomposed with the other 16 exact postimages into a new 20-target digest.
- Next action: run `invoke refresh:proposal-only` for the four lifecycle-only overrides, add the `PROPOSED_POSTAPPLY_LIFECYCLE_STATE` regression, and stop before apply. Fresh independent review and exact-byte owner acceptance are mandatory afterward.

## Technical Details

### Invoke Validation Fixture Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: EVF L1 planning package, exactly 20 canonical target paths
- Phase status: block
- Phase status basis: the apply-approved artifact is incomplete because post-apply lifecycle validation failed; one Refresh-authoring blocker is open
- Handoff readiness: blocked
- Mode contract: `.agents/skills/invoke/refresh.md`
- Outputs: this report and `refresh-report.json`; no repair proposal was authored
- Mutation mode: apply-approved, explicitly requested by the direct user
- Source signals: five — exact acceptance, material PASS, exact install, projected-lifecycle failure, and exact rollback
- Proposed changes: none
- Applied changes: 20 installed and verified, then completely rolled back
- Skipped changes: readiness, Task Session, implementation, formal providers, Git, and publication
- Mutation ready: false
- Capability ceilings: not evaluated; no durable runtime axis changed
- Decisions: treat the failure as governance-only, preserve failure evidence, restore the safe state, and require a new acceptance-bound candidate
- Blockers by scope: Refresh authoring 1; apply authorization 1 deferred; target lifecycle 1 deferred; audit 1 deferred
- Unresolved gap: four durable postimages encode proposal-time lifecycle state instead of projected post-apply state
- Next route: `invoke refresh:proposal-only`

### Exact Evidence

- Accepted postimage package: `b61f99354ed4d06b2ef9769d6d067edff34f68b83b0bf59d2c3c92e1945283d4`
- Material package canonical digest: `a6abce2bc99341ba8486e2c9de3535a8ed822dff96ebeef8ff41f2aa0f6f7cb5`
- Material producer receipt: `cf33b2d3b418cf2fb6e9ff4b100ea2aad5a75b148ce4bbe755783e6120170621` — PASS/ready, 20 paths, no reasons
- File-bound handoff: `fae8f370b2e41625b6a67e1b486f476c04ff077ac8d0969a5a0bfc24dfc9c3bb` — PASS/ready before apply
- Apply execution receipt: `a7a04fb8da7e78b58a784449ddc55f1cb3377f0ae732907337f3336988757dcf` — 20/20 installed and verified
- Lifecycle failure receipt: `914709fb6c1562badbb9aa291e8d6dd56f19f30a6edfa975555fc5779d79412b`
- Rollback receipt: `ab0acae5904753c27e8dccdc119b7458fdfe0d4abfa3b106720fae98fa4a850f` — exact pre-apply state restored, zero temporary residue
- Post-rollback preflight: `73cf4a5596e4f6023734fa040bcb9f3aca0150417b527465f0d07908575f08e7` — 11 present exact, 9 absent exact
- Governance-defect sidecar: `c0c5881ea91dd88b93bbf56fb87e383b2069be83c56a410aab2d6ae2a6bc972b`

### Defect and Permanent Guard

The byte transaction was correct; the payload's lifecycle assertions were not. Proposal-time state was copied into durable postimages, and the prior checks validated agreement with the proposal-time state instead of the state that would exist after successful apply.

The permanent guard is `PROPOSED_POSTAPPLY_LIFECYCLE_STATE`: validate the fully recomposed proposed canonical tree against an explicit lifecycle matrix before independent review, replay it before apply, and evaluate the same matrix over live canonical bytes after apply. Review, acceptance, and apply must then be closed, while readiness, execution selection, L2, and providers remain pending or excluded.

Authority effect remains `none`; release admission remains `not-granted`.
