---
work_pack_id: WP-ARE-001
status: aci-subordinate-conformance-planned-execution-blocked
complexity: high
output_mode: split
selected_swu: none
implementation_authorized: false
last_completed_swu: SWU-ARE-001
---

# Agent reasoning engine work-pack

## Control fields

| Field | Value | Notes |
|---|---|---|
| `workPackGateStatus` | **block** | Plan authoring passed; mutation-capable execution is closed. |
| `complexity` | high | Private/external authority, durable state, replay, effects, and multiple owner gates. |
| `outputMode` | split | Waves and task-local SWU contracts are required. |
| `executionPackRef` | [`EXECUTION-PACK.md`](EXECUTION-PACK.md) | Cross-task choreography only. |
| `layeringArtifactRef` | [`IMPLEMENTATION-LAYERING.md`](IMPLEMENTATION-LAYERING.md) | L0–L3 governance lens. |
| `dispatchTechniqueTrace` | [`aci-subordinate-conformance/DISPATCH-TECHNIQUE-TRACE.md`](aci-subordinate-conformance/DISPATCH-TECHNIQUE-TRACE.md) | Validated route-shaping evidence. |
| `distillValidationStatus` | **pass for plan structure** | Mutation remains blocked by external and closeout gates. |
| `swuAtomicityStatus` | **pass** | `SWU-ARE-002` is retired; new containment/conformance SWUs are atomic. |
| `firstUnitNarrownessStatus` | **n/a — none selected** | Local candidate `SWU-ARE-019`; integrated candidate `SWU-ARE-016`. |
| `closeoutSyncStatus` | **block** | No future mutation SWU has an exact Task Session closeout target/receipt binding. |
| `activeLayerWindow` | L1 planning only | No layer is open for mutation. |
| `lastUpdatedAt` | `2026-07-23T19:02:19-03:00` | ACI-subordinate conformance revision. |
| `readinessProfile` | private pilot | No public, compatibility, or rollout claim. |

## Objective

Build evidence for the private candidate architecture in increasing layers,
preserving the completed repository-owned semantic witness and placing every
future integrated command, event, acceptance, replay-cursor, and effect-intent
fact behind ACI-owned contracts and gates.

The ACI-subordinate plan has two non-interchangeable lanes:

1. **local-only containment** may produce explicitly non-integrated evidence
   under a namespace/claim guard; and
2. **integrated conformance** begins with current owner-receipted fixtures and
   pure mappings, then may reach an adapter only after ACI acceptance gates.

Evidence from the first lane cannot promote or shortcut the second.

## Approved source design

- [`../spec/SPEC.md`](../spec/SPEC.md)
- [`../spec/INTENT-RECORD.md`](../spec/INTENT-RECORD.md)
- [`../spec/INTENT-SCHEMA-DECISION.md`](../spec/INTENT-SCHEMA-DECISION.md)
- [`../design/ARCHITECTURE.md`](../design/ARCHITECTURE.md)
- [`../design/COMPONENT-CONTRACTS.md`](../design/COMPONENT-CONTRACTS.md)
- [`../design/DECISION-AND-EFFECT-FLOW.md`](../design/DECISION-AND-EFFECT-FLOW.md)
- [`../design/aci-reasoning-binding/ARCHITECTURE.md`](../design/aci-reasoning-binding/ARCHITECTURE.md)
- [`../decisions/aci-reasoning-binding/BINDING-RECEIPT.json`](../decisions/aci-reasoning-binding/BINDING-RECEIPT.json)
- [`IMPLEMENTATION-LAYERING.md`](IMPLEMENTATION-LAYERING.md)
- [`aci-subordinate-conformance/CONTEXT-PACK.md`](aci-subordinate-conformance/CONTEXT-PACK.md)
- [`aci-subordinate-conformance/PLAN-RECEIPT.json`](aci-subordinate-conformance/PLAN-RECEIPT.json)

## Delivery boundary

Private implementation root:
`cyberAlchemy-v2/implementation/agent-reasoning-engine/`. Local-only work must
remain under an explicit non-integrated package/namespace. Integrated adapters
may reference the external ACI contracts but may not open a journal writer,
invent canonical identities, or copy draft schemas into local authority.

Node 22 ESM remains a reversible assumption for private pure evaluators,
guards, fixtures, and mapping tests. It is not an alternative normative ACI
runtime schema. Changing runtime or crossing into the Python/FastAPI ACI host
requires a later plan revision and owner receipts.

This work-pack excludes all further implementation without a newly selected
and authorized SWU, external-repository mutation, real effects, generalized
`AntiBiasVector`, canonical/public mutation, ACI compatibility, and
reasoning-engine admission claims.

## Task board

| Task | Layer | Status | Dependency | Contract |
|---|---|---|---|---|
| TASK-ARE-READINESS-001 | pre-L0 | completed | none | [`work-pack/tasks/TASK-ARE-READINESS-001.md`](work-pack/tasks/TASK-ARE-READINESS-001.md) |
| TASK-ARE-EVALUATOR-001 | L0 | completed | TASK-ARE-READINESS-001 | [`work-pack/tasks/TASK-ARE-EVALUATOR-001.md`](work-pack/tasks/TASK-ARE-EVALUATOR-001.md) |
| TASK-ARE-ACI-CONFORMANCE-001 | L1 | planned; blocked/unselected | binding pass; external gates vary by SWU | [`work-pack/tasks/TASK-ARE-ACI-CONFORMANCE-001.md`](work-pack/tasks/TASK-ARE-ACI-CONFORMANCE-001.md) |
| TASK-ARE-INPUTS-001 | L1 | planned; local-only until conformance | L0 promotion and containment guard | [`work-pack/tasks/TASK-ARE-INPUTS-001.md`](work-pack/tasks/TASK-ARE-INPUTS-001.md) |
| TASK-ARE-PROTOCOL-001 | L1 | revised; integrated work blocked | ACI conformance and owner receipts | [`work-pack/tasks/TASK-ARE-PROTOCOL-001.md`](work-pack/tasks/TASK-ARE-PROTOCOL-001.md) |
| TASK-ARE-REPLAY-001 | L1/L2 | revised; integrated work blocked | ACI journal/semantic artifact evidence | [`work-pack/tasks/TASK-ARE-REPLAY-001.md`](work-pack/tasks/TASK-ARE-REPLAY-001.md) |
| TASK-ARE-GATES-001 | L1/L2 | revised; all SWUs unselected | L0 promotion, containment, and owner routes | [`work-pack/tasks/TASK-ARE-GATES-001.md`](work-pack/tasks/TASK-ARE-GATES-001.md) |
| TASK-ARE-GOVERNANCE-001 | L2 | revised; integrated work blocked | L1 conformance and owner routes | [`work-pack/tasks/TASK-ARE-GOVERNANCE-001.md`](work-pack/tasks/TASK-ARE-GOVERNANCE-001.md) |
| TASK-ARE-PACKAGING-001 | L3 | deferred | L2 promotion | [`work-pack/tasks/TASK-ARE-PACKAGING-001.md`](work-pack/tasks/TASK-ARE-PACKAGING-001.md) |

## Smallest Working Unit manifest

| SWU | Parent | Primary behavior | Status | Verification |
|---|---|---|---|---|
| `SWU-ARE-001` | TASK-ARE-EVALUATOR-001 | Deterministically reduce one frozen request to one typed outcome and prove the gate/effect boundary with test doubles. | completed; G-ARE-L0 promoted | `node --test .../packages/semantic-judgment-evaluator/test/*.test.mjs` |
| `SWU-ARE-002` | TASK-ARE-PROTOCOL-001 | Former local integrated journal transition draft. | **superseded; never selectable** | binding-plan review confirms no second writer |
| `SWU-ARE-003` | TASK-ARE-PROTOCOL-001 | Map accepted Work Bus facts to proposed observation/challenge handles without evaluator admission. | integrated-blocked; unselected | Bus mapping/admission separation tests |
| `SWU-ARE-004` | TASK-ARE-REPLAY-001 | Replay verified ACI journal facts plus immutable semantic artifacts with zero mutable calls. | integrated-blocked; unselected | replay determinism and zero-call tests |
| `SWU-ARE-005` | TASK-ARE-REPLAY-001 | Revalidate current state as a new ACI command/run without overwriting history. | integrated-blocked; unselected | identity/drift/late-defeat tests |
| `SWU-ARE-006` | TASK-ARE-GOVERNANCE-001 | Admit and recover semantic artifact bytes/refs without owning journal lifecycle. | owner-blocked; unselected | artifact crash/recovery/digest tests |
| `SWU-ARE-007` | TASK-ARE-GOVERNANCE-001 | Route degraded, incident, and compensation cases through ACI and explicit owners. | owner-blocked; unselected | failure-injection/owner-route tests |
| `SWU-ARE-008` | TASK-ARE-PACKAGING-001 | Expose a versioned private ACI-subordinate adapter interface. | deferred; unselected | conformance/compatibility suite |
| `SWU-ARE-009` | TASK-ARE-PACKAGING-001 | Prove private operational readiness under bounded load and rollout controls. | deferred | load/security/runbook evidence |
| `SWU-ARE-010` | TASK-ARE-INPUTS-001 | Project selected-local intent into a bounded frame without inventing ownership. | local-only-prep; unselected | projection/posture tests |
| `SWU-ARE-011` | TASK-ARE-INPUTS-001 | Load and verify authority/catalog snapshots without creating applicability or authority. | local-only-prep; unselected | version/digest/expiry/revocation/cycle tests |
| `SWU-ARE-012` | TASK-ARE-GATES-001 | Persist an entry gate and enforce zero calls for every non-pass verdict. | local-only-prep; unselected | persisted-order/call-counter tests |
| `SWU-ARE-013` | TASK-ARE-GATES-001 | Derive the minimum effort tier/budgets/lanes from owned policy without confidence substitution. | local-only-prep; unselected | monotonicity and policy-table tests |
| `SWU-ARE-014` | TASK-ARE-GATES-001 | Bind a fresh exact-effect pass to one identical envelope and emit only a candidate ACI effect command projection. | integrated-blocked; unselected | mismatch/non-pass/idempotency/conformance tests |
| `SWU-ARE-015` | TASK-ARE-GATES-001 | Select operational catalog techniques from candidate obligations and the effort profile without deciding applicability. | local-only-prep; unselected | catalog/activation/decorative-selection tests |
| `SWU-ARE-016` | TASK-ARE-ACI-CONFORMANCE-001 | Admit one complete owner-receipted external conformance fixture set. | external-blocked; unselected | fixture admission/rejection tests |
| `SWU-ARE-017` | TASK-ARE-ACI-CONFORMANCE-001 | Map one finalized semantic artifact ref into a candidate ACI command payload projection. | external-blocked; unselected | exact positive/negative mapping vectors |
| `SWU-ARE-018` | TASK-ARE-ACI-CONFORMANCE-001 | Project one verified ACI journal cut into an immutable evaluator-facing actor cut. | external-blocked; unselected | ordered read/zero-write tests |
| `SWU-ARE-019` | TASK-ARE-ACI-CONFORMANCE-001 | Enforce the local-only namespace and non-integration claim ceiling before any external call. | plan-ready; unselected | posture/identity/zero-call tests |

Each task contract contains split analysis, exact future write scope, algorithm or
transition rules, failure modes, acceptance evidence, and handoff shape. No
future mutation handoff is ready until the work-pack carries an exact Task
Session closeout synchronization contract for the selected SWU.

## Task Session closeout synchronization

`closeoutSyncStatus = block`. This revision intentionally does not guess a
future run identity, baseline digest, or lifecycle-owner target inventory.
Before any SWU becomes mutation-capable, a plan refresh must add one exact row
with:

- terminal source receipt schema and path;
- exact planning, task, wave, evidence, and Craft targets;
- preflight-bound baselines for every target;
- admitted closeout-only delta classes;
- Invoke Refresh and Craft owner validation commands;
- expected owner receipt paths/schemas; and
- one deterministic successor or `none`.

Closeout may synchronize evidence/status only. It cannot admit another SWU,
authority change, promotion, publication, deployment, policy acceptance, or
effect. Missing any field keeps the gate blocked before source mutation.

| Candidate | Required owner route | Status | Reason |
|---|---|---|---|
| `SWU-ARE-019` local-only containment | `invoke:refresh:apply-approved` then Craft owner refresh | blocked | exact target inventory and baselines are not bound |
| `SWU-ARE-016` integrated fixture admission | same, after external conformance gate | blocked | external owner receipts and exact target inventory are absent |
| all other future SWUs | one-SWU plan refresh after dependencies pass | blocked | not eligible for selection |

## Execution waves

| Wave | Layer question | Tasks | Gate |
|---|---|---|---|
| [`W0-L0.md`](work-pack/waves/W0-L0.md) | Is there a non-vacuous repository-owned semantic relation? | READINESS, EVALUATOR | G-ARE-L0 |
| [`W1-L1.md`](work-pack/waves/W1-L1.md) | Can local evidence stay contained, and can admitted ACI facts feed the evaluator without a second writer? | ACI-CONFORMANCE-019/016/017/018, INPUTS, GATES-012/013/015, PROTOCOL-003, REPLAY-004 | G-ARE-LOCAL-CONTAINMENT then G-ARE-ACI-CONFORMANCE/G-ARE-L1 |
| [`W2-L2.md`](work-pack/waves/W2-L2.md) | Do ACI-subordinate exact-effect, revalidation, artifact durability, and degraded state fail closed? | GATES-014, REPLAY-005, GOVERNANCE | G-ARE-L2 |
| [`W3-L3.md`](work-pack/waves/W3-L3.md) | Is private integration operationally ready without authority expansion? | PACKAGING | G-ARE-L3 |

## Gates

| Gate | Condition | On fail |
|---|---|---|
| G-ARE-POLICY | Applicability, challenge-closure, and exact-effect test-fixture owner records are finite and fixture-addressable. | block L0 implementation |
| G-ARE-L0 | All counterfactuals, two rule families, replay, ordering, and exact-effect test-double invariants pass. | keep general engine claim KILL; repair evaluator witness |
| G-ARE-LOCAL-CONTAINMENT | The local-only namespace/posture guard rejects every ACI/Bus/APT identity or compatibility claim and proves zero external calls. | no local-only implementation |
| G-ARE-ACI-CONFORMANCE | Current ACI owner receipts admit a complete canonical/idempotency/CAS/crash/replay vector set; Bus, ACP, and APT seams remain excluded until their own receipts pass; semantic artifact and actor-cut mappings pass without a second writer. | no integrated implementation or compatibility claim |
| G-ARE-L1 | Intent projection, authority/catalog verification, entry zero-call ordering, effort monotonicity, technique selection, admitted ACI actor facts, optional Bus-to-proposed-observation mapping, and historical replay preserve the L0 evaluator contract. | block L2 reliability work |
| G-ARE-L2 | Exact-effect mapping emits only candidate ACI command input; current revalidation is a new ACI command/run; semantic artifact durability, incident routes, and ACI acceptance/recovery evidence fail closed. | block packaging/rollout |
| G-ARE-L3 | Private compatibility, performance, security, and rollout evidence passes explicit owner review. | no rollout |
| G-ARE-PROMOTION | A separate definitions/claim owner admits any broader label. | retain local candidate wording |

Current `G-ARE-POLICY` evidence: `TASK-ARE-READINESS-001` passed through
[`../decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json`](../decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json); its claim ceiling is policy readiness only.

Current `G-ARE-L0` evidence condition: **pass, promoted for bounded L0**. The
[terminal SWU receipt](../../../implementation/agent-reasoning-engine/generated/runs/evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json) records passing counterfactual, two-family, replay,
ordering, and exact-effect-test-double invariants. This evidence does not
authorize a successor. The explicit
[`G-ARE-L0` owner receipt](../decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json)
promotes the bounded L0 layer only; it selects no SWU and authorizes no
implementation.

Current `G-ARE-ACI-CONFORMANCE` condition: **block**. ACI runtime remains
blocked, Bus has no later `PASS`, ACP remains discovery, APT mutation remains
blocked, and the cross-repository fixture/receipt set does not exist.

## Validation strategy

- Every SWU has deterministic tests or a reviewable owner record.
- Local-only fixtures assert the exact non-integration posture and zero external
  calls.
- Integrated fixtures are admitted only from current, digest-bound external
  owner receipts; missing optional seams remain exclusions, not passes.
- ACI canonical bytes are compared against owner vectors and never redefined by
  local serialization.
- Every integrated mapping has a positive vector, a missing/stale/mismatched
  receipt vector, an unknown-version vector, and an owner-collision vector.
- Fixture mutation varies one condition at a time.
- Stored results bind source/catalog/evaluator digests.
- Negative paths assert zero actor/evaluator/effect calls where required.
- Historical replay asserts zero provider/effect calls and consumes verified
  ACI facts plus immutable semantic artifacts.
- Current revalidation receives a new ACI command/run identity and never
  overwrites history.
- Exact-effect pass can emit only candidate ACI command input; ACI acceptance
  evidence is independently required.
- No test count, schema pass, agent consensus, or receipt existence is reported as
  semantic truth or authority.

## Blockers and gaps

| ID | Type | Owner | Closure |
|---|---|---|---|
| BLK-ARE-APP-001 | resolved implementation blocker | authority-model owner | [`APPLICABILITY-POLICY-v1.md`](../decisions/implementation-readiness/APPLICABILITY-POLICY-v1.md) plus the terminal readiness receipt |
| BLK-ARE-CHAL-001 | resolved implementation blocker | challenge-contract owner | [`CHALLENGE-CLOSURE-POLICY-v1.md`](../decisions/implementation-readiness/CHALLENGE-CLOSURE-POLICY-v1.md) plus the terminal readiness receipt |
| BLK-ARE-EFFECT-001 | resolved implementation blocker | effect-gate owner | [`TEST-EFFECT-POLICY-v1.md`](../decisions/implementation-readiness/TEST-EFFECT-POLICY-v1.md) plus the terminal readiness receipt |
| BLK-ARE-ACI-BINDING-001 | resolved L1/L2 design blocker | reasoning-engine and ACI architecture owners | Option A selects the ACI-subordinate target through [`BINDING-RECEIPT.json`](../decisions/aci-reasoning-binding/BINDING-RECEIPT.json); it grants no runtime compatibility or implementation authority |
| BLK-ARE-ACI-MATURITY-001 | external target-lifecycle dependency | ACI / Bus / APT lifecycle owners | Required external receipts or an explicit local-witness-only disposition before executable integration |
| BLK-ARE-CLOSEOUT-SYNC-001 | execution-handoff blocker | Invoke Refresh, Craft, and Task Session owners | Bind the selected SWU's exact closeout target inventory, baselines, allowed deltas, validation, owner receipts, and successor before source mutation |
| GAP-ARE-ART-001 | L2 gap | artifact-admission owner | durability and canonical-kind posture for receipt/journal |
| BLK-ARE-INCIDENT-001 | L2 blocker | incident/compensation owner | failure, late-defeat, ambiguous-delivery, and compensation decision policy |
| BLK-ARE-ROLLOUT-001 | L3 blocker | private rollout owner | bounded private interface, load, security, rollback, and rollout decision |
| GAP-ARE-INT-001 | evidence gap | intent-contract owner | revision-bearing and inter-rater intent evidence |
| GAP-ARE-BIAS-001 | claim blocker | future research/governance | governed anti-bias intervention and efficacy program |

## Current state and next move

The ACI-subordinate conformance revision is **authored and Distill-valid as a
plan**. It retires `SWU-ARE-002` rather than preserving a second integrated
journal writer, and it adds explicit local-containment and fixture-first
conformance units. `SWU-ARE-001` remains the only completed unit.

No further SWU is selected; `implementation_authorized=false`;
`workPackGateStatus=block`. Two future routes are visible but closed:

1. a separate owner gate may later bind closeout and select `SWU-ARE-019` for
   explicitly local-only containment; or
2. after external receipts and fixtures pass, a separate gate may bind closeout
   and select `SWU-ARE-016` as the first integrated conformance unit.

Neither candidate is an automatic successor. Integrated actor facts,
publication, provenance, replay, durability, revalidation, and effect-intent
work remains blocked by `BLK-ARE-ACI-MATURITY-001`,
`BLK-ARE-CLOSEOUT-SYNC-001`, and task-specific owner gates.
