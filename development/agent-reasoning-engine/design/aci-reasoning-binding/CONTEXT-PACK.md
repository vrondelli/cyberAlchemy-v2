# Context pack — ACI reasoning binding

## Selection

- Context Builder mode: `standard`
- Invoke mode: `design`
- Evidence date: `2026-07-23`
- Local target:
  `cyberAlchemy-v2/development/agent-reasoning-engine/design/aci-reasoning-binding/`
- External evidence root:
  `projects/cyberalchemy-orchestrator/`
- External source state:
  - `origin/master@6e5936b6d02f4d10c10d215d51a588b5520aa57f`
  - local checkout `05701291d878cab1824c9e0e4193298964f70e79`
- Scope: design the authority and record seam between the promoted bounded L0
  semantic evaluator and candidate ACI, Work Bus, protocol, and provenance
  surfaces.
- Excluded: adapter/runtime implementation, external-repository mutation, SWU
  selection, ACI compatibility claims, whole-engine promotion, real effects,
  and anti-bias efficacy claims.

## Obligation matrix

| ID | Design obligation | Selected evidence | Coverage |
|---|---|---|---|
| `O-BIND-01` | Preserve the bounded L0 promotion ceiling. | `decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json` | covered |
| `O-BIND-02` | Assign one owner to integrated commands, accepted events, canonical acceptance receipts, replay cursors, and effect intents. | ACI ADR-001 and ACI Work Pack | covered |
| `O-BIND-03` | Keep evaluator semantics distinct from runtime acceptance and publication. | local SPEC, architecture, and component contracts | covered |
| `O-BIND-04` | Map proposed observations/reviews without treating Work Bus acceptance as semantic admission. | Bus Contracts discovery and integration assessment | covered |
| `O-BIND-05` | Preserve confirmed `DispatchSpec` as the future executable topology authority without promoting discovery prose. | ACP discovery | covered |
| `O-BIND-06` | Keep provenance projections observational and rebuildable. | APT Work Pack | covered |
| `O-BIND-07` | Offer explicit ACI-subordinate, local-only, defer, and incompatible dispositions. | Work Pack blocker `BLK-ARE-ACI-BINDING-001` | covered |

Coverage is `7/7` for design authoring. Runtime handoff coverage is deliberately
`0`: no implementation route is requested or authorized.

## Selected evidence

| Source | Digest / posture | Design use |
|---|---|---|
| `../decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json` | SHA-256 `15f2bedfb2d1d0a56108144a39a104cef649af1bd3a3c8cc84bfabbc66075353`; bounded L0 `pass` | Establishes semantic witness only. |
| `../spec/SPEC.md` | SHA-256 `53bf663500da07478ab28bd92ce8126225e333395f7767040f81c1ff03997384`; private candidate | Supplies logical records and fail-closed requirements. |
| `../spec/GLOSSARY.md` | SHA-256 `02f918f4d2e3edcdf67f0243d0d34040e74bb5951b2ee5ec0abcb31a773f7563`; one stale local status found | Supplies local handles; conflict is recorded, not repaired here. |
| `../design/ARCHITECTURE.md` and `COMPONENT-CONTRACTS.md` | candidate design with promoted L0 slice | Supplies evaluator, actor, journal, receipt, replay, and effect boundaries. |
| `projects/cyberalchemy-orchestrator/.../adrs/ADR-001-persistence-replay-and-canonical-contracts.md` | SHA-256 `2add074d6895e571230ba80e530cf37698870bd219f1e0202d417a65c6392fed`; accepted W0 decision, runtime blocked | Owns the target integrated journal and canonical acceptance contract. |
| `projects/cyberalchemy-orchestrator/.../agents-communication-infra/WORK-PACK.md` | SHA-256 `873a601e029676fecde92896f15d4b6e78c4d48162b658448debb29dd24e7631`; `workPackGateStatus=block` | Prevents implementation or runtime claims. |
| `projects/cyberalchemy-orchestrator/.../bus-contracts/README.md` | SHA-256 `70d587a0f5252d44dabe42cfc030e0e41730bf3c9d6e920908be2b2625c517d6`; draft | Supplies candidate publication and release-gate semantics. |
| `projects/cyberalchemy-orchestrator/.../avaliacao-independente-publication-bridge.md` | SHA-256 `a98d51f4b4990cc82a962b836d96dbcabf4183926e889c518d668db99508622f`; latest review remains `FIX` | Prevents binding to the draft Bus contract. |
| `projects/cyberalchemy-orchestrator/.../agents-communication-protocols/README.md` | SHA-256 `e365aa804f82b280c13b12a48e69931c103ab736db632a5c5070f621e6d3f02a`; discovery | Supplies candidate confirmed-DispatchSpec seam only. |
| `projects/cyberalchemy-orchestrator/.../agent-provenance-telemetry/WORK-PACK.md` | SHA-256 `f8808a276ab3413f9b12d4f90f90a101c6826ec4d55852e363498786df56abc4`; `mutationGateStatus=block` | Supplies observational projection constraints. |

## Invariants

1. Evaluator derivation and outcome semantics remain local/private.
2. An integrated runtime has one ACI-owned physical journal writer.
3. `ReasoningReceipt` semantic content is not the ACI command receipt. The
   journal may reference its finalized artifact digest.
4. Work Bus persistence or acceptance never admits an observation into the
   evaluator and never commits a semantic result.
5. A positive semantic outcome never creates an effect intent. A separate
   exact-effect gate and ACI command acceptance are required.
6. Historical replay is pure. Current revalidation is a new run/command.
7. Artifact bytes, journal lifecycle facts, audit facts, and projections keep
   distinct owners.
8. External draft/FIX/blocked artifacts are target constraints, not active
   dependencies.
9. `implementation_authorized=false`; no SWU is selected.

## Excluded candidates

- A second normative Node journal schema for integrated execution.
- Using the L0 file store as an ACI-compatible persistence claim.
- Treating Work Bus `submission.accepted` as observation admission or a
  committed reasoning result.
- Treating `ReasoningReceipt` existence as an ACI command receipt or effect
  permission.
- Writing APT projections as lifecycle authority.

## Context Builder result

- Mode: `standard`
- Selected source artifacts: `10`
- Obligation coverage: `7/7`
- Contradictory scope: none
- Core goal missing: no
- Runtime handoff ready: no, intentionally
- Next consumer: Invoke Design

