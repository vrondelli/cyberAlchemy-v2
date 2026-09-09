# TASK-IOLM-00C — Candidate Graph Substrate

## Objective and mapping

- Slice/layer/wave: S-00C / L0C / W0C.
- Objective: prove that one explicitly candidate minted-project graph can compile into the shared graph/hierarchy/table boundary with stable identity and complete provenance, without satisfying any FPR authority gate.
- Dependencies: G-OWNER and `DEC-CAV2-IOLM-POSTURE-001` pass.
- Status: SWU-IOLM-00C-A complete; 00C-B selected by continuation and blocked before prototype mutation. The BTE plan was refreshed and independently accepted, but the selected upstream route has not yet returned its passing cross-feature-support receipt.

## Source contracts

- [SPEC — DomainSpec graph consumer boundary](../../SPEC.md#domainspec-graph-consumer-boundary)
- [Architecture — component contracts](../../ARCHITECTURE-BUNDLE.md#component-contracts)
- [Implementation layering — L0C](../../IMPLEMENTATION-LAYERING.md#layer-decisions)
- [Accepted refresh proposal](../../refreshes/2026-07-15-minted-runtime-route/REFRESH-PATCH-PROPOSAL.md)
- DomainSpec minted-project contract under `projects/domainspec-v2/impl/spec/minted-project/`

## SWU-IOLM-00C-A — Candidate contract and authority guard

| Field | Contract |
|---|---|
| Dependencies | G-OWNER and G-POSTURE receipts |
| Primary behavior | validate candidate posture, provenance, identity, and authority non-collapse before any candidate compilation |
| Inputs | accepted refresh proposal; minted-project schemas; IOLM non-collapse laws |
| Outputs | candidate input/build/view schemas plus positive and discriminating negative fixtures |
| Write scope | `prototype/contracts/candidate/`, `prototype/fixtures/candidate-contract/` |
| Done criteria | require `posture=candidate`, source digest, compiler version, stable IDs, and provenance; reject missing posture/provenance, `authoritative` self-labeling, and any candidate receipt presented as `G-DSV2-SG` evidence |
| Acceptance evidence | validator accepts one minimal candidate envelope and rejects every named authority-collapse fixture |
| Validation surface | host-native schema/fixture command recorded in RESULT; `git diff --check` |
| Execution owner | Task Session; candidate-contract implementer |
| Handoff | return exact schemas, fixtures, command, verdict, residue, and candidate-contract handle; stop before 00C-B selection |
| Result | `PASS` — [RESULT](../session-evidence/SWU-IOLM-00C-A/RESULT.md); handle `iolm-candidate-contract/v1` |

### Split analysis

This unit stops at the source boundary. Project data, compilation, and UI/read-model files are independently verifiable behaviors and therefore remain outside 00C-A. Splitting posture from provenance would hide their joint authority effect, so they stay in one contract unit.

## SWU-IOLM-00C-B — Minimal minted graph and deterministic receipt

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-00C-A pass and explicit next-unit selection |
| Primary behavior | compile a minimal private Craft/CyberAlchemy seed graph deterministically |
| Inputs | candidate-contract handle; minted-project compiler contract |
| Outputs | project/feature metadata, one file per node/connection, compiled graph, source/build receipts |
| Write scope | `prototype/project.json`, `prototype/features/cyberalchemy-method/`, `prototype/features/craft/`, `prototype/generated/receipts/`, exact compiler output declared by the session |
| Done criteria | at least one typed connection crosses the two seed features; two clean builds agree; every record carries candidate provenance |
| Acceptance evidence | minted-project conformance receipt plus byte/hash equality report |
| Validation surface | pinned compiler/conformance command and double-build diff recorded in RESULT |
| Execution owner | Task Session; candidate compiler implementer |
| Handoff | return candidate-graph handle and stop before 00C-C selection |
| Gate result | `BLOCK` — option 1 is recorded and the BTE planning contradiction was refreshed, but the live compiler still rejects every cross-feature edge and no passing upstream support receipt exists; [decision](../session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md) |

### Split analysis

Compilation is separate from projection parity because a deterministic source graph can be reviewed without introducing UI/read-model semantics.

## SWU-IOLM-00C-C — Shared read model and parity proof

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-00C-B pass and explicit next-unit selection |
| Primary behavior | project the candidate graph into one shared read model with equivalent graph, hierarchy, and table records |
| Inputs | candidate-graph handle; IOLM parity and posture contracts |
| Outputs | normalized read model, three view fixtures, parity oracle, visible and machine-readable candidate posture |
| Write scope | `prototype/generated/views/`, `prototype/tests/parity/`, `prototype/src/ui/read-model/` |
| Done criteria | all views expose the same stable records/relations; candidate posture is visible and machine-readable; removing or forging posture fails |
| Acceptance evidence | parity receipt plus authority-guard negative receipt |
| Validation surface | host-native parity command and candidate-authority negative recorded in RESULT |
| Execution owner | Task Session; read-model implementer |
| Handoff | return candidate-substrate handle for plan review; do not begin full UI or authority rebind automatically |

### Split analysis

This is the minimum proof that the candidate graph serves the future UI without creating separate graph technologies. Actual renderer interactions, API routes, and learner journeys remain later units.

## Synchronization and completion

Execute A, then stop. B and C are ordered but unselected until each preceding receipt is reviewed. TASK-IOLM-00C completes only when all three receipts pass. Completion proves a private candidate substrate, not FPR authority, release admission, ontology promotion, production integration, or comprehension.
