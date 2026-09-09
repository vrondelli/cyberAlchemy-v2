---
work_pack_id: WP-ARE-001
status: l0-witness-complete-awaiting-explicit-promotion
complexity: high
output_mode: split
selected_swu: none
implementation_authorized: false
last_completed_swu: SWU-ARE-001
---

# Agent reasoning engine work-pack

## Objective

Build evidence for the private candidate architecture in increasing layers,
starting with the smallest repository-owned semantic witness and stopping every
promotion at an explicit evidence/owner gate.

## Approved source design

- [`../spec/SPEC.md`](../spec/SPEC.md)
- [`../spec/INTENT-RECORD.md`](../spec/INTENT-RECORD.md)
- [`../spec/INTENT-SCHEMA-DECISION.md`](../spec/INTENT-SCHEMA-DECISION.md)
- [`../design/ARCHITECTURE.md`](../design/ARCHITECTURE.md)
- [`../design/COMPONENT-CONTRACTS.md`](../design/COMPONENT-CONTRACTS.md)
- [`../design/DECISION-AND-EFFECT-FLOW.md`](../design/DECISION-AND-EFFECT-FLOW.md)
- [`IMPLEMENTATION-LAYERING.md`](IMPLEMENTATION-LAYERING.md)

## Delivery boundary

Future implementation root: `cyberAlchemy-v2/implementation/agent-reasoning-engine/`.
L0 uses Node 22 ESM and standard-library-first deterministic code as a reversible
local planning assumption; changing runtime requires a plan revision, not silent
substitution.

This work-pack excludes further implementation without a newly selected and
authorized SWU, real external effects, generalized `AntiBiasVector`,
canonical/public mutation, and reasoning-engine admission claims.

## Task board

| Task | Layer | Status | Dependency | Contract |
|---|---|---|---|---|
| TASK-ARE-READINESS-001 | pre-L0 | completed | none | [`work-pack/tasks/TASK-ARE-READINESS-001.md`](work-pack/tasks/TASK-ARE-READINESS-001.md) |
| TASK-ARE-EVALUATOR-001 | L0 | completed | TASK-ARE-READINESS-001 | [`work-pack/tasks/TASK-ARE-EVALUATOR-001.md`](work-pack/tasks/TASK-ARE-EVALUATOR-001.md) |
| TASK-ARE-INPUTS-001 | L1 | planned | L0 promotion | [`work-pack/tasks/TASK-ARE-INPUTS-001.md`](work-pack/tasks/TASK-ARE-INPUTS-001.md) |
| TASK-ARE-PROTOCOL-001 | L1 | planned | L0 promotion | [`work-pack/tasks/TASK-ARE-PROTOCOL-001.md`](work-pack/tasks/TASK-ARE-PROTOCOL-001.md) |
| TASK-ARE-REPLAY-001 | L1/L2 | planned | protocol evidence | [`work-pack/tasks/TASK-ARE-REPLAY-001.md`](work-pack/tasks/TASK-ARE-REPLAY-001.md) |
| TASK-ARE-GATES-001 | L1/L2 | planned | L0 promotion and owner routes | [`work-pack/tasks/TASK-ARE-GATES-001.md`](work-pack/tasks/TASK-ARE-GATES-001.md) |
| TASK-ARE-GOVERNANCE-001 | L2 | planned | L1 promotion and owner routes | [`work-pack/tasks/TASK-ARE-GOVERNANCE-001.md`](work-pack/tasks/TASK-ARE-GOVERNANCE-001.md) |
| TASK-ARE-PACKAGING-001 | L3 | deferred | L2 promotion | [`work-pack/tasks/TASK-ARE-PACKAGING-001.md`](work-pack/tasks/TASK-ARE-PACKAGING-001.md) |

## Smallest Working Unit manifest

| SWU | Parent | Primary behavior | Status | Verification |
|---|---|---|---|---|
| `SWU-ARE-001` | TASK-ARE-EVALUATOR-001 | Deterministically reduce one frozen request to one typed outcome and prove the gate/effect boundary with test doubles. | completed; G-ARE-L0 promotion pending | `node --test .../packages/semantic-judgment-evaluator/test/*.test.mjs` |
| `SWU-ARE-002` | TASK-ARE-PROTOCOL-001 | Persist immutable bounded actor command/event transitions. | planned | journal transition tests |
| `SWU-ARE-003` | TASK-ARE-PROTOCOL-001 | Transport proposed observations/challenges into the evaluator boundary without semantic authority. | planned | transport/admission boundary tests |
| `SWU-ARE-004` | TASK-ARE-REPLAY-001 | Replay retained immutable inputs with zero mutable calls. | planned | replay determinism and zero-call tests |
| `SWU-ARE-005` | TASK-ARE-REPLAY-001 | Revalidate current state as a new run and invalidate drifted results. | planned | expiry/revocation/late-defeat tests |
| `SWU-ARE-006` | TASK-ARE-GOVERNANCE-001 | Persist and recover local receipts/journals without widening their admission posture. | planned | crash/recovery/digest tests |
| `SWU-ARE-007` | TASK-ARE-GOVERNANCE-001 | Route degraded, incident, and compensation cases through explicit owners. | planned | failure-injection/owner-route tests |
| `SWU-ARE-008` | TASK-ARE-PACKAGING-001 | Expose a versioned private interface preserving all authority boundaries. | deferred | contract/compatibility suite |
| `SWU-ARE-009` | TASK-ARE-PACKAGING-001 | Prove private operational readiness under bounded load and rollout controls. | deferred | load/security/runbook evidence |
| `SWU-ARE-010` | TASK-ARE-INPUTS-001 | Project selected-local intent into a bounded frame without inventing ownership. | planned | projection/posture tests |
| `SWU-ARE-011` | TASK-ARE-INPUTS-001 | Load and verify authority/catalog snapshots without creating applicability or authority. | planned | version/digest/expiry/revocation/cycle tests |
| `SWU-ARE-012` | TASK-ARE-GATES-001 | Persist an entry gate and enforce zero calls for every non-pass verdict. | planned | persisted-order/call-counter tests |
| `SWU-ARE-013` | TASK-ARE-GATES-001 | Derive the minimum effort tier/budgets/lanes from owned policy without confidence substitution. | planned | monotonicity and policy-table tests |
| `SWU-ARE-014` | TASK-ARE-GATES-001 | Bind a fresh exact-effect gate to one identical envelope and receipt. | planned | mismatch/non-pass/idempotency tests |
| `SWU-ARE-015` | TASK-ARE-GATES-001 | Select operational catalog techniques from candidate obligations and the effort profile without deciding applicability. | planned | catalog/activation/decorative-selection tests |

Each task contract contains split analysis, exact future write scope, algorithm or
transition rules, failure modes, acceptance evidence, and handoff shape.

## Execution waves

| Wave | Layer question | Tasks | Gate |
|---|---|---|---|
| [`W0-L0.md`](work-pack/waves/W0-L0.md) | Is there a non-vacuous repository-owned semantic relation? | READINESS, EVALUATOR | G-ARE-L0 |
| [`W1-L1.md`](work-pack/waves/W1-L1.md) | Can governed inputs, entry/effort/method control, and bounded actors feed the relation repeatably without owning it? | INPUTS, GATES-012/013/015, PROTOCOL, REPLAY-004 | G-ARE-L1 |
| [`W2-L2.md`](work-pack/waves/W2-L2.md) | Do exact-effect control, revalidation, durability, and degraded state fail closed? | GATES-014, REPLAY-005, GOVERNANCE | G-ARE-L2 |
| [`W3-L3.md`](work-pack/waves/W3-L3.md) | Is private integration operationally ready without authority expansion? | PACKAGING | G-ARE-L3 |

## Gates

| Gate | Condition | On fail |
|---|---|---|
| G-ARE-POLICY | Applicability, challenge-closure, and exact-effect test-fixture owner records are finite and fixture-addressable. | block L0 implementation |
| G-ARE-L0 | All counterfactuals, two rule families, replay, ordering, and exact-effect test-double invariants pass. | keep general engine claim KILL; repair evaluator witness |
| G-ARE-L1 | Intent projection, authority/catalog verification, entry zero-call ordering, effort monotonicity, operational technique selection, actor failure/join/observation/challenge paths, and immutable replay preserve the L0 outcome contract; `BLK-ARE-ACI-BINDING-001` has a terminal disposition before actor-protocol mutation. A local-only disposition is explicitly non-integrated and cannot satisfy packaging or ACI-compatibility claims. | block L2 reliability work |
| G-ARE-L2 | Exact-effect mismatch/non-pass/idempotency behavior, current revalidation, recovery, durability, audit, and incident routes fail closed; artifact-byte durability does not claim journal lifecycle ownership, and compatibility is supported by conformance evidence against the accepted binding rather than structural similarity. | block packaging/rollout |
| G-ARE-L3 | Private compatibility, performance, security, and rollout evidence passes explicit owner review. | no rollout |
| G-ARE-PROMOTION | A separate definitions/claim owner admits any broader label. | retain local candidate wording |

Current `G-ARE-POLICY` evidence: `TASK-ARE-READINESS-001` passed through
[`../decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json`](../decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json); its claim ceiling is policy readiness only.

Current `G-ARE-L0` evidence condition: **pass, promotion pending**. The
[terminal SWU receipt](../../../implementation/agent-reasoning-engine/generated/runs/evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json) records passing counterfactual, two-family, replay,
ordering, and exact-effect-test-double invariants. This evidence does not
promote L0 or authorize a successor.

## Validation strategy

- Every SWU has deterministic tests or a reviewable owner record.
- Fixture mutation varies one condition at a time.
- Stored results bind source/catalog/evaluator digests.
- Negative paths assert zero actor/evaluator/effect calls where required.
- Historical replay asserts zero provider/effect calls.
- Current revalidation receives a new run ID and never overwrites history.
- No test count, schema pass, agent consensus, or receipt existence is reported as
  semantic truth or authority.

## Blockers and gaps

| ID | Type | Owner | Closure |
|---|---|---|---|
| BLK-ARE-APP-001 | resolved implementation blocker | authority-model owner | [`APPLICABILITY-POLICY-v1.md`](../decisions/implementation-readiness/APPLICABILITY-POLICY-v1.md) plus the terminal readiness receipt |
| BLK-ARE-CHAL-001 | resolved implementation blocker | challenge-contract owner | [`CHALLENGE-CLOSURE-POLICY-v1.md`](../decisions/implementation-readiness/CHALLENGE-CLOSURE-POLICY-v1.md) plus the terminal readiness receipt |
| BLK-ARE-EFFECT-001 | resolved implementation blocker | effect-gate owner | [`TEST-EFFECT-POLICY-v1.md`](../decisions/implementation-readiness/TEST-EFFECT-POLICY-v1.md) plus the terminal readiness receipt |
| BLK-ARE-ACI-BINDING-001 | L1/L2 design blocker; does not block G-ARE-L0 | reasoning-engine and ACI architecture owners | Approved `ACI-REASONING-BINDING` mapping journal, artifact, canonical identity, Work Bus, effect-intent and provenance responsibilities, while preserving non-binding status for immature external contracts |
| BLK-ARE-ACI-MATURITY-001 | external target-lifecycle dependency | ACI / Bus / APT lifecycle owners | Required external receipts or an explicit local-witness-only disposition before executable integration |
| GAP-ARE-ART-001 | L2 gap | artifact-admission owner | durability and canonical-kind posture for receipt/journal |
| BLK-ARE-INCIDENT-001 | L2 blocker | incident/compensation owner | failure, late-defeat, ambiguous-delivery, and compensation decision policy |
| BLK-ARE-ROLLOUT-001 | L3 blocker | private rollout owner | bounded private interface, load, security, rollback, and rollout decision |
| GAP-ARE-INT-001 | evidence gap | intent-contract owner | revision-bearing and inter-rater intent evidence |
| GAP-ARE-BIAS-001 | claim blocker | future research/governance | governed anti-bias intervention and efficacy program |

## Current state and next move

Planning and policy readiness remain **pass**. `SWU-ARE-001` is **completed**
with a passing private L0 witness receipt. No further SWU is selected and
`implementation_authorized` remains false for downstream work. The next move is
the explicit `G-ARE-L0` evidence/owner promotion gate. Until that gate returns
a terminal receipt, L1 dependencies remain closed.

If `G-ARE-L0` admits continuation, the first route is
`invoke:design ACI-REASONING-BINDING`. Do not select SWU-ARE-002,
SWU-ARE-003, or SWU-ARE-006 until that design dispositions the ownership seam.
