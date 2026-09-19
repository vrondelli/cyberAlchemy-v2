# Context Pack — DomainSpec v2 stable-foundation two-lane refresh

Status: complete proposal context; not a runtime handoff<br>
Mode: standard, strict obligation mapping<br>
Evidence date: 2026-08-16 (Europe/London)<br>
Target: N1 decision freeze and proposal-only Invoke Refresh<br>

## Context Pack Summary

- Task: prepare the accepted decision record and exact proposal-only route for
  the remaining-meta-type and stable-CLI planning lanes.
- Files selected: 14.
- Selector groups selected: 18.
- Obligation coverage: 100% for proposal authoring.
- Noise ratio: 0 selected files without an obligation.
- Output markdown: this file.
- Output index: none; this is not a runtime handoff pack.
- Handoff pack: none.
- Session evidence path: this refresh package.
- Strict coverage: pass for proposal authoring; mutation and execution remain
  outside this pack.
- Blockers: 0 refresh-authoring blockers; downstream gates are recorded below.

## Obligations

| ID | Obligation | Required evidence | Status |
| --- | --- | --- | --- |
| CTX-01 | Preserve the accepted `0.1.0` product and release authority boundary. | July product contract, new decision, Craft FPR gate. | covered |
| CTX-02 | Bind all 21 stable-foundation choices without inflating them into implementation evidence. | New decision record and stable-review evidence ceiling. | covered |
| CTX-03 | Preserve P2's 13-type/16-signature, independent-node/edge, project-root, causal-proof decisions. | July FPR-02B decision and new decision. | covered |
| CTX-04 | Determine whether `RMT-OP-001` can still be selected after S1. | RMT Work Pack, four affected task contracts, execution entry and validator, review CR-05/CR-06. | covered: it cannot be selected until refresh |
| CTX-05 | Define the stable-CLI planning prerequisites and current build drift. | Stable review, new decision, root package and lock. | covered |
| CTX-06 | Keep N1 proposal-only, private, unregistered, unspawned, and non-executable. | New decision boundary and Craft gate. | covered |
| CTX-07 | Record Inventory lookup readiness and gaps without treating Inventory as authority. | Validated root machine index and selected entry metadata. | covered |

## Selected evidence

| Path | SHA-256 | Selectors | Obligations |
| --- | --- | --- | --- |
| `projects/domainspec-v2/development/first-production-release/decisions/2026-08-16-first-stable-foundation-candidate.md` | `2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9` | `#resolved-selections`, `#cross-selection-invariants`, `#n1-authorization-boundary` | CTX-01..06 |
| `projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md` | `a5852275365563fc2378e3b6a86d9f4da03cc9efbaef249ffa41f329c3bf5b43` | `#product-and-operating-boundary`, `#evidence-and-release-rule`, `#reopen-conditions` | CTX-01, CTX-02, CTX-06 |
| `projects/domainspec-v2/development/first-production-release/decisions/2026-07-17-fpr02-supported-profile-decision.md` | `36641f3b488b4b617eb5742082c2b16049a8a7003ce26f206c27f014f2e9a491` | Decisions 2, 3, 5, 6, 7, 8, 9, 10 and 16 | CTX-03, CTX-05 |
| `projects/domainspec-v2/development/reviews/2026-08-14-first-production-stable-implementation/findings.md` | `89832dd505b57da898e14d8976ab700e20643d87fbfacb299f28cdda9d2da547` | `#direct-current-state-answer`, `#w3-versus-w4-adjudication`, CR-01..CR-17, `#candidate-shortlist-for-a-possible-first-stable-slice`, `#overall-verdict` | CTX-02, CTX-04, CTX-05 |
| `projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/WORK-PACK.md` | `e96b5d414279fdd7ad1689bcac70e9292adbbae588a8705e1bb73b2174f7ef37` | `#current-gate`, `#work-graph`, `#ten-unit-cycle-per-type`, `#claim-ceiling` | CTX-04, CTX-06 |
| `projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/tasks/TASK-RMT-OP.md` | `5297b49cbf8344d66699e02a3fe3b47eb074648a4a63146042ca74853f0365d1` | `#contract`, `#minimum-acceptance` | CTX-04 |
| `projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/tasks/TASK-RMT-EVENT.md` | `cf1a8ae16189dddf98c8279f60d12083921639e84bf5c7d554a563671ecc0306` | `#contract`, `#hostile-floor`, `#minimum-acceptance` | CTX-04 |
| `projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/tasks/TASK-RMT-SM.md` | `c9291b37efa5e481b154f0e24dcc2b1d08bb245b71da194f39da042f04e4c2ab` | `#contract`, `#hostile-floor`, `#minimum-acceptance` | CTX-04 |
| `projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/tasks/TASK-RMT-WF.md` | `dea507fa339811e50abfc5c6ca443ffcd915861d2d24d157556f08b0242fca6f` | `#contract`, `#hostile-floor`, `#minimum-acceptance` | CTX-04 |
| `projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/EXECUTION-ENTRY.json` | `6de95b4cae05865bc1f65c8d0660bac2611c143b0f0405834ca8bb7d012e65e7` | `/frontier`, `/execution_policy`, `/execution_entry`, `/continuation_rule` | CTX-04, CTX-06 |
| `projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/EXECUTION-ENTRY-VALIDATION.json` | `385567a7a2ea83dfd5e832ac4c9c88640574078b21fed0b3b024a28080e0b747` | `/status`, `/allowed_routes_digest`, `/frontier` | CTX-04 |
| `projects/domainspec-v2/.craft/ledger.yml` | `dfcd6cbac88be2019808de820ef59206caefd2d7b5417c890db4f4c5adf6fc81` | `CTX-DSV2-FIRST-PRODUCTION-RELEASE`, `CTX-DSV2-FPR02-BACKEND`, `BLK-DSV2-DRIFT-ENGINE`, `BLK-DSV2-L2-ATTESTATION` | CTX-01, CTX-05, CTX-06 |
| `projects/domainspec-v2/impl/package.json` | `c36f88e36c34520f87877ff0c9a35f174a77a41348e61ad6f774fbbee23f5a5a` | `/name`, `/packageManager`, `/scripts`, `/devDependencies` | CTX-05 |
| `projects/domainspec-v2/impl/package-lock.json` | `12d5dc3b41e490983bd413f91184de88bf0aabd2a7a0de704ff93538889be298` | `/lockfileVersion`, install-script package rows for `esbuild@0.28.1`, `esbuild@0.21.5`, and optional `fsevents@2.3.3` | CTX-05 |

## Evidence versus inference

- Evidence: the current execution entry is structurally valid and
  `selection-ready` for `RMT-OP-001` under its existing plan digest.
- Evidence: the plan names generic exactly-once and compensation hostiles but
  does not bind S1's atomic state-plus-outbox and later idempotent publication
  rule.
- Inference: today's accepted S1 decision makes the older admission denominator
  semantically stale even though its machine projection still validates.
- Consequence: no actor should invoke Implementation Readiness for
  `RMT-OP-001` until a new exact plan package is applied and revalidated.
- Evidence: the current source workspace names `@domainspec-v2/impl`, pins
  pnpm, and contains an npm lock with lifecycle-script packages.
- Consequence: SF-07, SF-14, and SF-18 require a planned migration and clean
  build proof; they do not describe current build readiness.

## Inventory lookup

- Inventory root: `.arcanum/inventory`.
- Machine index: `index.json`.
- Lookup readiness: `ready`; validator result `pass`, with 153 uncontrolled-tag
  warnings and zero lookup failures.
- Selected discovery entries:
  - `domainspec-v2-expanded-production-frontiers-strategy-result-synthesis` —
    confirms the accepted broad FPR route and production-unauthorized ceiling.
  - `domainspec-v2-fpr02-integrated-consumer-proof-refresh` — confirms the
    historical 13/16 node/edge consumer-proof route and its unexecuted residue.
- Design consequence: the planning route preserves the established broad
  profile and product authority boundaries rather than adopting the review's
  narrower feature-directory placeholder.
- Gap: no Inventory entry directly indexes the August stable review,
  `WP-RMT-002`, durable outbox, or compiled-JavaScript choice. Direct current
  sources therefore remain primary.
- Authority notice: Inventory is a non-authority discovery read model. Its
  matches do not admit a profile, validate a plan, authorize a dispatch, or
  prove implementation.

## Excluded candidates

- The full frozen review corpus and raw subagent returns: excluded because the
  accepted `findings.md` already supplies the bounded review synthesis for this
  proposal.
- Historical BTE Work Packs and execution runs: excluded because N1 targets
  the current RMT plan plus a new CLI planning lifecycle, not BTE execution.
- UI profile and visibility packages: excluded because P2 is the backend lane
  and no rendered user interface is in the stable-foundation target.
- Python/Rust implementation fixtures: excluded because they are execution
  evidence for later RMT work, not inputs needed to author this route.
- Existing generated `dist`, Cargo targets, and review snapshots: excluded as
  generated/historical evidence, not planning authority.

## Authority precedence

1. Existing accepted product and FPR-02B decisions.
2. The 2026-08-16 owner-selected planning decision.
3. Current canonical Work Pack and project ledger state.
4. Frozen review findings within their review-evidence ceiling.
5. Inventory discovery projections.

Where these differ, the stricter claim and authority boundary controls. A
machine-valid stale plan projection cannot override a newer owner semantic
decision; a review or Inventory row cannot override canonical authority.

## Gaps and next route

No gap blocks this proposal package. The following block later lifecycle
edges:

- Lane A requires an exact proposal/apply cycle over the named plan targets,
  full validator reruns, a new execution-entry digest, and owner acceptance.
- Lane B requires Define, Design selection, Plan, Distill, and Implementation
  Readiness artifacts before any SWU can be selected.
- The current FPR Craft gate and its live engine/attestation blockers remain.
- No DomainSpec strategy `plan` dispatch type is live, so this route cannot be
  registered or spawned as a governed plan dispatch.

Next route: owner review of the proposal, then separately authorized inline
planning authoring. Product execution remains deferred.
