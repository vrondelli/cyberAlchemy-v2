---
artifact: refresh-patch-proposal
run_id: 20260820T013541Z-dec-gcp-001-option-a-selection
decision: DEC-GCP-001 = Option A (EVF-local machine capsule)
mutation_mode: proposal-only
applied: false
---

# Refresh Patch Proposal — DEC-GCP-001 Option A

Nothing in this document has been applied. It enumerates the exact 36-target
apply that the Option A selection unlocks, plus the independent audit target
that follows it.

Two things gate the apply, in order:

1. **25 of these targets have no authored postimage.** The inventory invariant
   `planning_updates_require_exact_postimages_before_apply` makes authoring
   them a precondition, and that authoring is Invoke Refresh's own gate-1 work.
2. **The owner must separately authorize the exact 36-target apply.** Approval
   scope must equal the material-package change targets and the target
   inventory exactly — a missing or extra path blocks the handoff.

Legend for postimage state: **READY** = exact bytes exist and were rehashed
today; **UNAUTHORED** = no postimage exists yet.

## Group 1 — Planning documents to update (19)
Owner `invoke-refresh`. All present, all preimages verified byte-exact today.
Postimage state: **UNAUTHORED** for every row.

| # | Target | Required delta |
| ---: | --- | --- |
| 1 | `decisions/2026-07-20-key-and-door-formal-source.md` | owner-selected-r1-decision-and-exact-material-digests |
| 2 | `DEFINE.md` | source-evidence-runtime-authority-separation-only |
| 3 | `GLOSSARY.md` | bounded-s1-terms-only |
| 4 | `V1-ASPECT-ADOPTION.md` | downgrade-markdown-to-explanatory-only |
| 5 | `DESIGN.md` | selected-capsule-seven-seam-failure-and-closeout-design |
| 6 | `IMPLEMENTATION-LAYERING.md` | bind-selected-l0-capsule-preserve-later-layers-deferred |
| 7 | `PLAN.md` | one-atomic-swu-seven-ordered-seams-and-gates |
| 8 | `WORK-PACK.md` | single-frontier-swu-entry-closeout-and-no-successor |
| 9 | `EXECUTION-PACK.md` | gate-zero-through-one-task-session-and-closeout |
| 10 | `DISPATCH-SPEC.json` | validator-clean-selected-one-shot-route-no-execution |
| 11 | `work-pack/tasks/TASK-GCP-CONTRACT.md` | planning-facet-of-SWU-GCP-001-not-separately-closable |
| 12 | `work-pack/tasks/TASK-GCP-ENFORCES.md` | ordered-ICR-S1-001-through-007-implementation-contract |
| 13 | `work-pack/tasks/TASK-GCP-VERIFY.md` | acceptance-facet-of-SWU-GCP-001-not-separately-closable |
| 14 | `work-pack/shared/CONTEXT.md` | exact-task-session-reading-order |
| 15 | `work-pack/shared/DECISIONS.md` | selected-r1-source-runtime-and-authority-split |
| 16 | `work-pack/shared/GAPS.md` | resolve-only-selected-semantic-gap-and-name-live-gates |
| 17 | `work-pack/shared/TRACEABILITY.md` | seven-seam-and-E-P-O-T-traceability |
| 18 | `work-pack/waves/W0-CONTRACTS.md` | gate-zero-selection-apply-review-entry |
| 19 | `work-pack/waves/W1-ENFORCES.md` | one-atomic-swu-only |

## Group 2 — Work-pack files to create (6)
Owner `invoke-refresh`. All absent, confirmed absent today.
Postimage state: **UNAUTHORED** for every row.

| # | Target | Required delta |
| ---: | --- | --- |
| 1 | `work-pack/EXECUTION-ENTRY.json` | G1-create-byte-exact-from-conditional-selection-ready-postimage-after-A-selection-and-apply-authorization; block-Implementation-Readiness-until-independent-audit-input-exists |
| 2 | `work-pack/CLOSEOUT-CONTRACT.md` | create-canonical-E-P-O-T-contract |
| 3 | `work-pack/target-inventory.candidate-a.json` | create-from-revalidated-machine-inventory |
| 4 | `work-pack/validation-contract.s1.json` | create-byte-exact-from-reviewed-proposal |
| 5 | `work-pack/MATERIAL-PACKAGE.candidate-a.json` | create-materialized-package-bound-to-selected-plan-and-live-baselines |
| 6 | `work-pack/MATERIAL-PACKAGE.candidate-a.producer-receipt.json` | create-validator-produced-material-package-receipt |

## Group 3 — Owner-material files to create (11)
Owner `invoke-refresh` **after explicit owner selection** — which has now
occurred. All absent, confirmed absent today.
Postimage state: **READY** for every row; each hash re-derived 2026-08-20.

| # | Target | Postimage digest | Bytes | Output class |
| ---: | --- | --- | ---: | --- |
| 1 | `semantic-source/key-door-predicate.v1.schema.json` | `b3705e42c3570f4a…` | 2790 | validating-schema-not-authority |
| 2 | `semantic-source/key-door-predicate.v1.json` | `1e8d49d55c463e98…` | 729 | owner-selected-evf-local-semantic-source |
| 3 | `fixtures/SWU-GCP-001/key-door-input.v1.schema.json` | `87be8ea1d87ac801…` | 2798 | validating-schema-not-authority |
| 4 | `fixtures/SWU-GCP-001/key-door-input.v1.json` | `6e6e32637c9492b0…` | 526 | expected-free-fixture-input |
| 5 | `fixtures/SWU-GCP-001/key-door-binding.v1.schema.json` | `d636dd8d540dcd8e…` | 2817 | validating-schema-not-authority |
| 6 | `fixtures/SWU-GCP-001/key-door-binding.v1.json` | `ae49a8b33aa3b1c7…` | 2949 | exact-binding-contract |
| 7 | `contracts/key-door-runtime.v1.schema.json` | `9e387376506669d5…` | 3462 | validating-schema-not-authority |
| 8 | `contracts/key-door-runtime.v1.json` | `40c9f27244dc7bfe…` | 1787 | harness-runtime-contract-not-application-runtime |
| 9 | `contracts/key-door-obligations.v1.schema.json` | `2ef832ab1c8446a2…` | 1225 | validating-schema-not-authority |
| 10 | `contracts/key-door-obligations.v1.json` | `0abb0901bb8ac659…` | 575 | validation-owned-ospec-not-semantic-source |
| 11 | `contracts/evolvable-validation-receipt.v1.schema.json` | `d52e86e7604bf8f0…` | 8395 | non-admitting-receipt-schema |

## Group 4 — Independent audit receipt (1, post-apply)

| Target | Owner | Delta |
| --- | --- | --- |
| `reviews/one-shot-readiness/CURRENT-PLAN-AUDIT.json` | independent-reviewer | create-after-exact-applied-byte-review-only |

## Deliberately excluded

| Path | Why |
| --- | --- |
| `decisions/2026-07-20-key-and-door-formal-source.md` | In Group 1. The selection is recorded as signal `RS-001` only — editing it directly would bypass the authority split. |
| `REFRESH-REPORT.md` (EVF root) | Not among the 26 planning targets; earlier-run artifact, outside declared surface. |
| `refresh-report.json` (EVF root) | Same. |
| `projects/domainspec-v2/impl/package.json` | Implementation target, not a planning target. Its stale preimage is a Task Session rehash obligation. |

## Forbidden throughout

- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/impl/test-derivation-engine/src/bte/`
- `projects/domainspec-v2/development/implementation-observation-led-maintenance/`
- `arcanum/arcana/ outside the three exact P/O/T receipt paths`
- `Git index, commits, remotes, publication, deployment, release, and production state`

## Invariants this proposal must satisfy at apply time

- `paths_are_exact`: true
- `directory_write_scopes_forbidden`: true
- `abort_on_any_preimage_or_absence_drift`: true
- `rehash_immediately_before_invoke_apply`: true
- `rehash_immediately_before_task_session_mutation`: true
- `existing_owner_bytes_require_surgical_three_way_adoption`: true
- `planned_create_collision_is_target_baseline_drift`: true
- `task_session_may_implement_exact_contract_but_may_not_vary_semantics`: true
- `planning_updates_require_exact_postimages_before_apply`: true

## Sequence after authorization

1. Author the 25 missing planning postimages and bind their digests.
2. Owner authorizes the exact 36-target apply (scope must match exactly).
3. Apply — with the Arcanum invoke apply path reviewed and committed first.
4. Independent reviewer audits the applied 36-target corpus, creates target 37.
5. Implementation Readiness rehashes and classifies without mutation.
6. Fresh Task Session rechecks live baselines and admits one attempt.

No step is pre-satisfied. Any changed acceptance-bound byte regenerates the
inventory and requires fresh independent review.
