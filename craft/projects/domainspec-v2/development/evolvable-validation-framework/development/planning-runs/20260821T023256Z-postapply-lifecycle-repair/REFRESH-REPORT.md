# EVF Projected Post-Apply Lifecycle Repair Report

## Outcome Brief

The four-file EVF governance defect is repaired in a proposal-only candidate.
The complete package still contains exactly 20 targets: four lifecycle-only
overrides and sixteen byte-identical postimages from the accepted predecessor.
Its exact postimage package digest is
`d1fade2a90995805e49a92e6cf9e0957019ce7625c69031df356fc112670c639`.

The candidate passes full-tree recomposition, the 11-present/9-absent live
baseline denominator, content and JSON hygiene, projected post-apply lifecycle
checks, 10 of 10 stale-state fixtures, and semantic/topology preservation.
Independent Review 007 passes 16 of 16 checks with no blockers or flags.

The run is now stopped at exact-byte owner acceptance. No owner acceptance was
inferred, no material package was assembled, and no canonical target changed.

## Boundary and Next Decision

- Changed only in this run: four staged lifecycle postimages, candidate and
  validation evidence, permanent regression coverage, independent-review
  receipts, and the owner-acceptance request.
- Unchanged: all canonical EVF planning bytes, the P4 then R4 execution order,
  Rule semantics, graph/source ownership, target scopes, commands, closeout,
  claim ceilings, and `updatedAt: 2026-08-20` as the logical tranche date.
- Excluded: material assembly, apply authorization, canonical apply, Work Pack
  or Implementation Readiness, Task Session, P4, R4, L2, Datalog, Alloy, TLC,
  Cedar, Git mutation, publication, release, deployment, and production.
- Current gate: the human owner must accept or reject this exact digest against
  `PLAN-INDEPENDENT-REVIEW-007.json`.

Exact acceptance wording is recorded in `OWNER-ACCEPTANCE-REQUEST.json`:

> I accept EVF package
> d1fade2a90995805e49a92e6cf9e0957019ce7625c69031df356fc112670c639
> exactly as independently reviewed in PLAN-INDEPENDENT-REVIEW-007, and retain
> updatedAt: 2026-08-20 as its logical tranche date. This acceptance does not
> authorize material assembly or canonical apply.

Acceptance alone does not authorize the next mutation edge. A later, separate
`$invoke refresh:apply-approved` request would be required to assemble material,
revalidate live baselines, obtain a file-bound ready handoff, and conditionally
apply the exact package.

## Technical Details

### Invoke Validation Fixture Result

- Mode: `refresh`
- Mutation mode: `proposal-only`, explicitly bounded to stop at owner acceptance
- Activation source: direct user
- Phase status: `pass`
- Artifact completeness: true for the proposal/review phase
- Handoff status: `gated`
- Mutation ready: false
- Candidate inventory SHA-256:
  `ac1f5b0c4d1d59285676d897b5470cf66bea6de428cabc48e59c1820b9ca3ab4`
- Candidate package digest:
  `d1fade2a90995805e49a92e6cf9e0957019ce7625c69031df356fc112670c639`
- Target partition: 20 total; 4 lifecycle overrides; 16 exact reuse; 11
  expected-present baselines; 9 expected-absent baselines
- Next route: exact-byte owner acceptance
- Authority effect: `none`
- Release admission: `not-granted`

### Defect Repair

The original package copied proposal-time review, acceptance, and apply blockers
into bytes intended to become durable only after those gates had closed. The
repair changes only these four projected-state surfaces:

- `PLAN.md`
- `WORK-PACK.md`
- `work-pack/shared/GAPS.md`
- `work-pack/shared/CROSS-TASK-GAPS.md`

The permanent `PROPOSED_POSTAPPLY_LIFECYCLE_STATE` check evaluates the entire
recomposed proposed tree before review, before apply, and after apply. The old
package fails on exactly those four paths; the repaired package has zero stale
hits and kills all ten proposal-time-state fixtures.

### Review 006 Repair Lineage

Review 006 correctly blocked because the pre-apply validator trusted a material
digest repeated by a producer receipt and handoff without recomputing it from
the parsed material package. That was a governance validation gap, not a
postimage or product-semantics change.

The repaired validator now computes
`sha256(canonical-json(parsed-material-package))` and requires exact equality
with the producer receipt's `packageDigest`. The deterministic adversarial test
proves both sides:

- unchanged valid package + computed material digest: exit 0, PASS;
- same unchanged package + internally consistent forged receipt/handoff digest:
  exit 1 with `PREAPPLY_MATERIAL_PACKAGE_DIGEST_MISMATCH`.

Review 007 independently replayed that attack, the inventory, the pre-review
validation, all 20 postimages, live baselines, post-apply binding, and the
four-file semantic-only diff. Its result is PASS, 16 of 16 checks, zero blockers,
and zero flags.

### Exact Evidence

- Candidate inventory: `CANDIDATE-INVENTORY.json`, SHA-256
  `ac1f5b0c4d1d59285676d897b5470cf66bea6de428cabc48e59c1820b9ca3ab4`
- Projected lifecycle manifest: `PROPOSED-POSTAPPLY-LIFECYCLE-STATE.json`,
  SHA-256 `bcc14c77232e854ad48a5102d67e359013b9ac6da950f5b500d2caba79ab4aec`
- Validation result: `validation/VALIDATION-RESULT.json`, SHA-256
  `76281aa7d580df35ff7ca76aae5a92d4b98e88d8ea35024c4ce8c73c8f3d5173`
- Material-digest regression: `validation/MATERIAL-DIGEST-REGRESSION-RESULT.json`,
  SHA-256 `3bf3d06ff8b26500d0ef2debb27f23d19dd1b8841615afbb87d0c61edf133298`
- Review 007 request: `reviews/PLAN-INDEPENDENT-REVIEW-007-REQUEST.json`,
  SHA-256 `f2e132e93e342ecbd68167e77513b39b608f305bb0954a3e21241ea4f0c26429`
- Review 007 receipt: `reviews/PLAN-INDEPENDENT-REVIEW-007.json`, SHA-256
  `2e6f7292b4c5ae7eb7de92dbcd750bc23777807561c3fa999950000b3f2f0f4b`
- Owner-acceptance request: `OWNER-ACCEPTANCE-REQUEST.json`, SHA-256
  `9ad8fb93210cce3380ff00bfe9d3fca550aa12f431904c8769452d26ebf87d73`

The maximum honest claim is limited to one reviewed proposal-only EVF planning
package ready to be presented for exact-byte owner acceptance. It does not prove
acceptance, material readiness, canonical installation, implementation
readiness, feature proof, provider readiness, release, or production status.
