# WORK-PACK: WP-MTC-001 — Meta-Type Closure Epoch E1

## Control Fields

| Field | Value |
| --- | --- |
| workPackGateStatus | block-pending-exact-plan-acceptance-and-readiness-preflight |
| complexity | high |
| outputMode | split |
| executionPackRef | `EXECUTION-PACK.md` |
| layeringArtifactRef | `IMPLEMENTATION-LAYERING.md` |
| dispatchTechniqueTrace | `DISPATCH-TECHNIQUE-TRACE.json` |
| distillValidationStatus | pass-independent-proposer-r3-and-parent-balancer |
| swuAtomicityStatus | pass |
| firstUnitNarrownessStatus | pass |
| closeoutSyncStatus | pass-contracts-authored |
| executionDesignation | execution-candidate |
| implementationReadinessStatus | block-not-yet-run-on-final-accepted-bytes |
| implementationReadinessReceiptRef | n/a |
| finiteStreamSupervisorMode | accepted-finite-stream-after-exact-plan-acceptance |
| finiteStreamRequestBudget | 6 |
| finiteStreamRiskCeiling | bounded-write |
| exactAcceptanceStatus | unapproved |
| admissionTiming | selected-unit-at-task-session |
| executionEntryState | owner-prerequisite |
| activeLayerWindow | L0-L3 |
| readinessProfile | pilot |

## Objective Summary

Preserve the existing 13 meta-type implementation, repair two logical Operation dependency bindings in a staged candidate, prove Workflow D04 against current bytes, revalidate the complete staged denominator, and freeze one exact integration/admission candidate for separate Rondelli and Victor approval. No unit applies live canonical targets or grants admission.

## Supersession and Reuse

- WP-RMT-001 remains the six-type historical implementation source, including Enum.
- WP-RMT-002 prototype evidence remains the seven-type implementation source.
- WP-RMT-002R remains the closed reconciliation source.
- This Work Pack supersedes only the original WP-RMT-002 70-unit execution route as a current route.
- WP-APE-OP-PROFILE-001 and WP-APE-WF-PROFILE-001 remain separate profile evidence and are not superseded.

## Work-Pack Execution Policy

The machine-readable policy is `EXECUTION-ENTRY.json`. All six Task Sessions write only to the declared run-local execution root and staged postimage tree. Live product/admission targets are read-only inputs until a later exact owner-approved `invoke:refresh:apply-approved` route.

Automatic decisions: internal tool selection, capability owner routing, reversible local defaults, and fresh Task Session resumption. Stop on semantic choice, scope expansion, destructive/external/credential effects, authority/promotion/publication/deployment, or the first acceptance-critical validation failure.

## Delivery Slices

| Slice | Outcome | Layer | Wave | Dependencies |
| --- | --- | --- | --- | --- |
| S-MTC-01 | exact all-13 preservation baseline | L0 | W0 | none |
| S-MTC-02 | Operation `reads` evidence rebound in staged postimages | L1 | W1 | S-MTC-01 |
| S-MTC-03 | Operation FMP provider lock rebound in staged postimages | L1 | W1 | S-MTC-02 |
| S-MTC-04 | Workflow D04 closure proof | L1 | W2 | S-MTC-03 |
| S-MTC-05 | complete staged all-13 validation | L2 | W3 | S-MTC-04 |
| S-MTC-06 | exact integration/admission candidate and owner requests | L3 | W4 | S-MTC-05 |

## Task Status Board

| Task | Goal | Layer | Waves | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-MTC-001](tasks/TASK-MTC-001-BASELINE.md) | freeze all-13 baseline | L0 | W0 | ready-after-plan-acceptance | not-started |
| [TASK-MTC-002](tasks/TASK-MTC-002-OPERATION-REBIND.md) | stage both Operation rebinds | L1 | W1 | dependency-bound | not-started |
| [TASK-MTC-003](tasks/TASK-MTC-003-WORKFLOW-D04.md) | prove Workflow D04 | L1 | W2 | dependency-bound | not-started |
| [TASK-MTC-004](tasks/TASK-MTC-004-VALIDATE-AND-FREEZE.md) | full matrix and candidate freeze | L2-L3 | W3-W4 | dependency-bound | not-started |

## SWU Atomicity Review

| SWU | Primary behavior | Independent boundary | Split result | Verdict |
| --- | --- | --- | --- | --- |
| SWU-MTC-001 | freeze exact preservation baseline | baseline report passes without any repair | no useful smaller denominator than all 13 | pass |
| SWU-MTC-002 | stage semantic/admission rebind | current RQ1/schema bindings pass focused witnesses | provider seam excluded | pass |
| SWU-MTC-003 | stage provider request/replay rebind | 109 refs and derived identities close | semantic seam excluded | pass |
| SWU-MTC-004 | prove Workflow D04 | proof can pass/fail without candidate assembly | mutation explicitly excluded | pass |
| SWU-MTC-005 | run one complete staged matrix | matrix result is independently reviewable | per-command results remain separate inside one promotion gate | pass |
| SWU-MTC-006 | freeze one exact candidate package | manifest/request digest closure is one atomic identity | admission apply excluded | pass |

## First Unit Narrowness

SWU-MTC-001 is create-only run evidence. It changes no implementation or canonical lifecycle byte and is the narrowest step capable of disproving the central preservation assumption before repair work begins.

## Blockers

| ID | Description | Owner | Resolution |
| --- | --- | --- | --- |
| MTC-B01 | final Plan bytes lack exact digest-bound acceptance | Rondelli, then Victor | Decision Gate over final candidate manifest |
| MTC-B02 | Implementation Readiness proof-only preflight has not run on final accepted Plan bytes | implementation-readiness | run only after MTC-B01 without changing Plan semantics |
| MTC-B03 | current full factory regression is red | validation owner | SWU-MTC-005 must pass or candidate remains blocked; no waiver |

## Task Session Closeout Sync Contract

`CLOSEOUT-CONTRACTS.json` defines one precloseout receipt, Task Session receipt, Invoke Refresh closeout receipt, exact successor, and failure rule for every unit. Closeout may synchronize run-local execution evidence only; it cannot apply live staged postimages or admit the candidate.

## Distill Validation

The default Standard budget is used. `PLAN-DISTILL-VALIDATION.md` records the initial and R2 blocks, the independent R3 pass, parent Balancer dispositions, per-SWU split tests, recomposition to the five specification capabilities, and downstream residue. Distill passes; the Work Pack remains blocked only on exact Plan acceptance and the required post-acceptance readiness preflight.

## Handoff

Current next owner: Decision Gate for exact final Plan acceptance. If both distinct owner responses pass and no byte changes, Invoke Refresh may generate a fresh selection-ready execution entry and run the required Work Pack Readiness/Implementation Readiness proof. Task Session is not currently authorized.
