# EVF Projected Post-Apply Lifecycle Repair

## Outcome Brief

This proposal repairs the governance-only defect that caused package
`b61f99354ed4d06b2ef9769d6d067edff34f68b83b0bf59d2c3c92e1945283d4`
to be rolled back. Four durable postimages now describe the state that would
exist after their own reviewed and accepted package is applied; the other
sixteen postimages remain byte-identical to the accepted predecessor.

- Objective: remove proposal-time review, acceptance, and apply blockers from
  bytes intended to become canonical only after those gates have completed.
- Result: exact 20-target candidate digest
  `d1fade2a90995805e49a92e6cf9e0957019ce7625c69031df356fc112670c639`.
- Why it matters: the same stale lifecycle state now fails before independent
  review instead of after canonical installation.

## Boundary and Next Decision

- Changed postimages: `PLAN.md`, `WORK-PACK.md`, `work-pack/shared/GAPS.md`,
  and `work-pack/shared/CROSS-TASK-GAPS.md`.
- Reused postimages: sixteen exact predecessor bytes.
- Unchanged behavior: P4 then R4 serialization, semantic ceilings, source/graph
  ownership, target scopes, validation commands, closeout routes, L2/provider
  exclusions, and `updatedAt: 2026-08-20` as the accepted logical tranche date.
- Current candidate state: proposal-only, awaiting a fresh independent review
  after Review 006 correctly blocked an unbound material-package digest.
- Projected durable state: review, exact-byte acceptance, material handoff, and
  apply closed; readiness and activation still pending; execution entry blocked
  with no selected unit; Task Session not started.
- Next decision: independent review of this exact candidate, followed by owner
  acceptance only if the review passes.

## Exact Candidate

- Candidate inventory:
  `CANDIDATE-INVENTORY.json`
- Inventory SHA-256:
  `ac1f5b0c4d1d59285676d897b5470cf66bea6de428cabc48e59c1820b9ca3ab4`
- Projected lifecycle manifest:
  `PROPOSED-POSTAPPLY-LIFECYCLE-STATE.json`
- Projected lifecycle manifest SHA-256:
  `bcc14c77232e854ad48a5102d67e359013b9ac6da950f5b500d2caba79ab4aec`
- Recomputed package digest:
  `d1fade2a90995805e49a92e6cf9e0957019ce7625c69031df356fc112670c639`
- Target partition: 20 total, 4 lifecycle overrides, 16 byte-identical reuse,
  11 expected-present live baselines, and 9 expected-absent live baselines.

## Regression

`PROPOSED_POSTAPPLY_LIFECYCLE_STATE` scans the complete recomposed tree against
an explicit projected-state matrix. Its pre-review validation:

- replayed the candidate inventory byte-identically;
- rehashed all 20 postimages and all live baselines;
- parsed every JSON postimage and checked UTF-8, BOM, trailing whitespace, and
  final newlines across all 20 targets;
- found zero stale lifecycle assertions in the repaired candidate;
- proved the predecessor fails on exactly the four expected paths; and
- killed all 10 proposal-time-state regression fixtures.

The same validator exposes `pre-apply` and `post-apply` phases. Pre-apply binds
fresh review and owner acceptance to the postimage digest, separately binds the
parsed material package, producer receipt, and handoff to the recomputed
canonical material digest, proves the material root contains this exact
inventory and all 20 postimages, binds the ready handoff to the exact material
receipt, and rehashes live baselines. Post-apply binds the apply receipt,
rehashes all live canonical targets, and reruns the projected lifecycle scan
before readiness routing.

Review 006 demonstrated that merely requiring the receipt and handoff to echo
the same 64-character value was insufficient. The repaired validator now
recomputes `sha256(canonical-json(material-package))` and fails with
`PREAPPLY_MATERIAL_PACKAGE_DIGEST_MISMATCH` when that value differs from the
producer receipt. `validation/test_material_digest_bridge.py` is the permanent
adversarial regression: one exact synthetic package passes with its computed
digest, while the same unchanged package fails when only the receipt/handoff
digest chain is replaced by an internally consistent forged value.

## Non-Goals

This proposal does not apply canonical targets, activate Work Pack Readiness or
Implementation Readiness, select or execute an SWU, run P4 or R4, run or install
Datalog, Alloy, TLC, or Cedar, mutate Git, publish, release, deploy, or grant
production authority. Authority effect is `none`; release admission is
`not-granted`.
