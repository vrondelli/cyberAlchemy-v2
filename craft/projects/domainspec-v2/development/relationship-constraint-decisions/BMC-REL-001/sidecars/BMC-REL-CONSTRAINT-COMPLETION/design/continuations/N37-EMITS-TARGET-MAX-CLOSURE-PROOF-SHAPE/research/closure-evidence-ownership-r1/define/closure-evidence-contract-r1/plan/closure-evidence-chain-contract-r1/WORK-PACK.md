# WORK-PACK: closure-evidence-chain-contract-r1

## Control fields

| Field | Value |
| --- | --- |
| `workPackGateStatus` | `pass` |
| `complexity` | `medium` |
| `outputMode` | `split` |
| `executionPackRef` | `EXECUTION-PACK.md` |
| `layeringArtifactRef` | `IMPLEMENTATION-LAYERING.md` |
| `distillValidationStatus` | `pass` |
| `swuAtomicityStatus` | `pass` |
| `firstUnitNarrownessStatus` | `pass` |
| `closeoutSyncStatus` | `pass` |
| `executionDesignation` | `execution-candidate` |
| `implementationReadinessStatus` | `pass` |
| `implementationReadinessReceiptRef` | `IMPLEMENTATION-READINESS-PREFLIGHT.json` |
| `consumerRehearsalStatus` | `pass` |
| `consumerRehearsalReceiptRef` | `PREACCEPTANCE-REHEARSAL-RECEIPT.json` |
| `preacceptanceClosureStatus` | `block` |
| `preacceptanceBlockReceiptRef` | `PREACCEPTANCE-REHEARSAL-RECEIPT.json` |
| `finiteStreamSupervisorMode` | `selected-unit-at-task-session` |
| `finiteStreamRequestBudget` | `4` |
| `finiteStreamRiskCeiling` | `repository-local-reversible` |
| `exactAcceptanceStatus` | `unapproved` |
| `admissionTiming` | `selected-unit-at-task-session` |
| `executionEntryState` | `selection-ready` |
| `allowedRoutesDigest` | `e15c671ce59e3fd5c4d1e4434e6d967db583c51bedd7667588d49f37739d245c` |
| `activeLayerWindow` | `L1` |
| `readinessProfile` | `pilot` |

## Execution policy

The exact route set is machine-authored in `machine/EXECUTION-ENTRY.json`. It contains one Task Session route and one Invoke closeout route per mutation SWU. No unit is selected. Fresh exact acceptance and per-unit Task Session admission remain mandatory; a readiness PASS does not authorize mutation or successor execution.

## Objective and success condition

Implement and locally validate the owner-selected EVF evidence-contract family for the N43 envelope and N44 evaluator receipt. Success requires all four mutation SWUs complete, coordinated validation passing, canonical relationship/packet preservation, complete closeout receipts, and no authority claim beyond exact bound-snapshot evidence.

## Resolved non-execution prerequisite

`BMC-REL-PLAN-01-A-EVF-EVIDENCE-CONTRACT-FAMILY` is selected in `decisions/BMC-REL-PLAN-01-CLOSURE-EVIDENCE-CONTRACT-PLACEMENT-AND-LIFECYCLE/OWNER-SELECTION-RECEIPT.json`. It fixes EVF placement, immutable v1 identity, the scoped manifest registry, and lifecycle ownership. Historical `SWU-CCE-001` is therefore not an execution unit and is not fabricated as completed Task Session work.

## Task board

| Task | Goal | Layer | Waves | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-CCE-BOUNDARY](work-pack/tasks/TASK-CCE-BOUNDARY.md) | Bind the resolved non-mutating prerequisite | L0 | W0 | pass | resolved-prerequisite |
| [TASK-CCE-SCHEMAS](work-pack/tasks/TASK-CCE-SCHEMAS.md) | Materialize the envelope and receipt schemas with fixtures | L1 | W1 | exact-acceptance | not-started |
| [TASK-CCE-MANIFEST](work-pack/tasks/TASK-CCE-MANIFEST.md) | Materialize the scoped immutable-v1 contract manifest | L2 | W2 | predecessor-closeout | not-started |
| [TASK-CCE-VALIDATION](work-pack/tasks/TASK-CCE-VALIDATION.md) | Validate the complete digest-bound chain and hostile cases | L2 | W2 | predecessor-closeout | not-started |
| [TASK-CCE-READINESS](work-pack/tasks/TASK-CCE-READINESS.md) | Audit the frozen Plan and prepare exact acceptance | L2 | W3 | closure-only | blocked-candidate-postimages |

## Atomicity and order

The execution frontier is `SWU-CCE-002` -> `SWU-CCE-003` -> `SWU-CCE-004` -> `SWU-CCE-005`. Envelope identity precedes receipt identity; both precede the registry manifest; the full-chain validator is last. Each unit owns a disjoint material write scope and one execution receipt. Invoke closeout is separate and never admits its successor automatically.

## Authority ceiling

This Work Pack is a proof-only execution candidate. It does not select a unit, authorize Task Session mutation, change canonical relationships or the BMC packet, admit the schemas to a relationship profile, implement an evaluator, publish, release, deploy, or reopen D06.

## Preacceptance stop

The authorized single-owner governance repair and independent review pass. All four SWUs pass two byte-identical, nine-stage no-effect rehearsals with zero repository writes or external effects. Full preacceptance closure still blocks before an implementation-acceptance request because the exact nine-file EVF candidate postimage package, its complete consumer validation, frozen preacceptance graph, and independent graph review do not yet exist. `PREACCEPTANCE-REHEARSAL-RECEIPT.json` records this boundary; it does not select a Task Session route or authorize implementation.
