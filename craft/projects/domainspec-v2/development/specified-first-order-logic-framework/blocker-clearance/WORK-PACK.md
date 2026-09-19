# DS-SFOL Financial Settlement Blocker-Clearance Work Pack

| Control | Value |
| --- | --- |
| workPackGateStatus | pass |
| complexity | medium |
| outputMode | split |
| distillValidationStatus | pass |
| swuAtomicityStatus | pass |
| firstUnitNarrownessStatus | pass |
| closeoutSyncStatus | pass |
| executionAdmissionStatus | experimental-complete:C3+P4; formal-blocked:G-SFOL-01 |
| initialExecutionAdmissionStatus | selected:SWU-SFOL-BC-001 |
| authorityClass | private |
| publicationClass | internal |
| releaseAdmission | not-granted |

## Objective

Clear the technical blockers, run the experimental Financial Settlement
DS-SFOL lane, and preserve formal G-SFOL-01 as open. Regenerate the feature from
canonical per-node machine sources through a profile-admitted graph, source
manifest, and build receipt, with complete pure and effect proof/replay
evidence for the proposed finite profile.

## Delivery Boundary

The admitted experimental profile contains exactly:

- C3 deal split as a pure function; and
- P4 payout creation/event behavior as an effect relation.

All other Financial Settlement clauses remain explicit residue. This is a
framework and architecture proof, not full business-policy coverage.

## SWU Manifest

| SWU | Parent task | Dependency | Primary behavior | Acceptance boundary | State |
| --- | --- | --- | --- | --- | --- |
| [SWU-SFOL-BC-001](tasks/TASK-SFOL-LOGIC-PROFILE.md#swu-sfol-bc-001) | TASK-SFOL-LOGIC-PROFILE | SWU-SFOL-010 | profile-level logic admission and compiler rejection | compiler contract suite plus canonical projection | completed-pass |
| [SWU-SFOL-BC-002](tasks/TASK-SFOL-SOURCE-ADMISSION.md#swu-sfol-bc-002) | TASK-SFOL-SOURCE-ADMISSION | none | exact experimental C3/P4 proposal | semantic-digest proposal plus backend trace audit | completed-pass |
| [SWU-SFOL-BC-003](tasks/TASK-SFOL-EFFECT-PROOF.md#swu-sfol-bc-003) | TASK-SFOL-EFFECT-PROOF | SWU-SFOL-008,009,010 | generic effect case/proof/replay vertical | exact-set and mutation suite | completed-pass |
| [SWU-SFOL-BC-004](tasks/TASK-SFOL-FS-BUILD.md#swu-sfol-bc-004) | TASK-SFOL-FS-BUILD | BC-001,BC-002 | canonical Financial Settlement regeneration | identical double build and projected modules | completed-pass |
| [SWU-SFOL-BC-005](tasks/TASK-SFOL-FS-ADOPTION.md#swu-sfol-bc-005) | TASK-SFOL-FS-ADOPTION | BC-003,BC-004 | unchanged-core experimental consumer adoption | joined exact set, mutation, replay, core-digest audit | completed-pass |

## Gate Ledger

| Gate | Current state | Closure evidence |
| --- | --- | --- |
| G-SFOL-01 | open, formal | dated finance-core/backend-core source-owner receipt over exact semantic digests |
| G-SFOL-01-EXP | resolved, experimental test lane | passing BC-002 proposal plus direct-user test-lane authorization; no formal promotion effect |
| G-SFOL-06 | resolved, technical | passing SWU-SFOL-BC-001 compiler/projection receipt |
| G-SFOL-BC-EFFECT | resolved, technical | passing SWU-SFOL-BC-003 generic effect proof/replay receipt |
| SWU-SFOL-011 formal entry | blocked | only formal G-SFOL-01 remains open; technical gates are resolved |
| Experimental adoption entry | resolved | BC-004 canonical build and BC-005 real-backend adoption pass for the bounded C3/P4 profile |

## Validation Strategy

| Slice | Acceptance-critical validation |
| --- | --- |
| Profile/compiler | targeted minted-project compiler tests, tool typecheck, existing tools suite |
| Source proposal | proposal schema/audit, exact normalized clause/AST digests, direct anchors to C3/P4 backend behavior |
| Effect proof | targeted effect proof suite, engine typecheck, full SFOL suite |
| Canonical build | build twice byte-identically, verify views, project node logic |
| Adoption | feature suite, mutation negatives, replay, machine adoption-report validation, exact-set audit, pre/post core digest manifest |
| Regression | full engine tests, existing BTE verifier, plan-package validator |

## Task Session Closeout Synchronization Contract

Every mutation SWU uses:

- terminal source receipt:
  `work-pack/session-evidence/<SWU>/<run>/execution-receipt.json`;
- synchronization targets:
  this `WORK-PACK.md`, the parent `../WORK-PACK.md`, and one matching
  `closeouts/<SWU>/INVOKE-REFRESH-RECEIPT.json`;
- baseline binding: exact SHA-256 and byte size captured in
  `closeout-preflight.json` before the first implementation write;
- admitted delta classes: `evidence_added`, `blocker_resolved`,
  `status_changed`, `route_changed`;
- owner route: exactly `invoke:refresh:apply-approved`;
- owner validation: this package validator, parent plan validator, receipt
  schema check, and changed-path audit;
- expected owner receipt: `invoke-refresh-closeout-receipt/v1` with exact
  source receipt, targets, deltas, validation, and returned successor;
- successor policy: the next row in the ordered manifest only when every
  dependency is pass; after BC-005 return the formal G-SFOL-01 owner route.
  Only a later owner approval plus refresh may formally close SWU-SFOL-011 and
  consider SWU-SFOL-012, which remains independently gated by G-SFOL-02.

Closeout cannot promote, publish, deploy, alter authority, or execute the next
SWU.

## Recomposition

BC-001 supplies the canonical logic boundary; BC-002 supplies a bounded
experimental semantic proposal; BC-003 supplies the missing generic effect proof; BC-004 joins them
into canonical source/build evidence; BC-005 proves the target behavior. Removing
any unit leaves one experimental target criterion unprovable. Formal parent
adoption still requires G-SFOL-01.

## Research Decision

No external research is required. The local specification, backend authority,
compiler, and framework contracts are sufficient. Research becomes a new route
only for external solver selection, production accounting policy, or language
expressiveness beyond the admitted C3/P4 profile.

## Execution Ledger

| SWU | Execution receipt | Owner receipt | Result | Successor |
| --- | --- | --- | --- | --- |
| SWU-SFOL-BC-001 | `work-pack/session-evidence/SWU-SFOL-BC-001/20260727T042227Z-logic-profile/execution-receipt.json` | `closeouts/SWU-SFOL-BC-001/INVOKE-REFRESH-RECEIPT.json` | pass | SWU-SFOL-BC-002 selected, not executed |
| SWU-SFOL-BC-002 | `work-pack/session-evidence/SWU-SFOL-BC-002/20260727T044647Z-source-proposal/execution-receipt.json` | `closeouts/SWU-SFOL-BC-002/INVOKE-REFRESH-RECEIPT.json` | pass | SWU-SFOL-BC-003 selected, not executed |
| SWU-SFOL-BC-003 | `work-pack/session-evidence/SWU-SFOL-BC-003/20260727T045511Z-effect-proof/execution-receipt.json` | `closeouts/SWU-SFOL-BC-003/INVOKE-REFRESH-RECEIPT.json` | pass | SWU-SFOL-BC-004 selected, not executed |
| SWU-SFOL-BC-004 | `work-pack/session-evidence/SWU-SFOL-BC-004/20260727T054500Z-canonical-build/execution-receipt.json` | `closeouts/SWU-SFOL-BC-004/INVOKE-REFRESH-RECEIPT.json` | pass | SWU-SFOL-BC-005 selected, then executed by the next Task Session |
| SWU-SFOL-BC-005 | `work-pack/session-evidence/SWU-SFOL-BC-005/20260727T055000Z-financial-settlement-adoption/execution-receipt.json` | `closeouts/SWU-SFOL-BC-005/INVOKE-REFRESH-RECEIPT.json` | pass | no implementation successor; formal G-SFOL-01 owner route |
