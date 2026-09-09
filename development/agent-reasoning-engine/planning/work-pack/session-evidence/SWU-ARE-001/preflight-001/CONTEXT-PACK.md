# Context pack — SWU-ARE-001 preflight 001

## Task

- Task: `TASK-ARE-EVALUATOR-001 / SWU-ARE-001`
- Mode: `standard`, strict obligation mapping
- Runtime: local
- Intended behavior: one deterministic frozen-request reduction to one typed
  outcome, with replay/order/exact-effect test-double evidence.
- Intended write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/**`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/fixtures/evaluator-v1/**`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/evaluator-v1-*/**`

## Obligation matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| `OB-SWU1-01` | Candidate is selected, incomplete, and dependency-ready. | `planning/WORK-PACK.md` task/SWU rows; readiness receipt. | covered |
| `OB-SWU1-02` | Task contract agrees with the live readiness frontier. | Task header says `selected, blocked by TASK-ARE-READINESS-001`; Work Pack and readiness receipt say dependency complete. | **block — contradictory** |
| `OB-SWU1-03` | Write scope and forbidden surfaces are explicit. | Evaluator task `Future write scope` and `Forbidden`. | covered |
| `OB-SWU1-04` | Reducer algorithm and outcome algebra are finite. | `design/COMPONENT-CONTRACTS.md#semantic-evaluator1`; `spec/SPEC.md#evaluator-outcome-algebra`. | covered |
| `OB-SWU1-05` | Applicability, challenge, and exact-effect edge states are owner-pinned. | Three effective implementation-readiness policy records and passing boundary review. | covered |
| `OB-SWU1-06` | Done criteria and acceptance-critical validation are available. | Evaluator task `Done when` and Node test command; W0 evidence/gate. | covered |
| `OB-SWU1-07` | Entry/evaluator/effect ordering remains separated. | `design/DECISION-AND-EFFECT-FLOW.md`. | covered |
| `OB-SWU1-08` | No real effect, AntiBiasVector, actor runtime, public/canonical mutation, or broader claim. | Task forbidden list and first-witness stop boundary. | covered |

Strict coverage: **block** because `OB-SWU1-02` contradicts the selected live
frontier.

## Selected sources

| Source | Selector | Obligations |
|---|---|---|
| `planning/WORK-PACK.md` | frontmatter; task board; SWU manifest; W0 gate; current state | 01, 02, 06 |
| `planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md` | header; SWU-ARE-001 contract; done/verification/scope | 02, 03, 04, 06, 08 |
| `planning/work-pack/waves/W0-L0.md` | blockers, evidence, promotion/stop | 01, 06 |
| `planning/IMPLEMENTATION-LAYERING.md` | L0 row; selected unit; cross-layer invariants | 03, 06, 08 |
| `design/COMPONENT-CONTRACTS.md` | shared records; semantic evaluator; receipt; effect double; replay | 04, 07 |
| `design/DECISION-AND-EFFECT-FLOW.md` | ordering; outcome routing; counterfactuals; stop boundary | 04, 06, 07, 08 |
| `spec/SPEC.md` | witness invariant; outcome algebra; first-witness acceptance family | 04, 06, 08 |
| `decisions/implementation-readiness/APPLICABILITY-POLICY-v1.md` | rules | 05 |
| `decisions/implementation-readiness/CHALLENGE-CLOSURE-POLICY-v1.md` | rules | 05 |
| `decisions/implementation-readiness/TEST-EFFECT-POLICY-v1.md` | fixed envelope and rules | 05, 07 |
| `decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json` | gate/result/digests | 01, 02, 05 |
| `refresh/2026-07-23-readiness-sync/apply-approved/OWNER-RECEIPT.json` | applied synchronization and next route | 01, 02 |

Files selected: 12. Noise ratio: low; every selector closes a named
obligation.

## Gate result

The contradiction is a stale Invoke-owned planning status, not a semantic or
implementation decision. There is no meaningful multi-option choice, so
Decision Gate is not invoked. Task mutation must stop before implementation.

Unblock route: one receipt-bound
`invoke:refresh:apply-approved` closeout that changes only the evaluator task
header from `selected, blocked by TASK-ARE-READINESS-001` to
`selected, ready; execution authorized by the current Task Session`.

## Open Questions

No preflight-specific question is open. Engine-level unresolved questions remain
owned by [`../../../../../spec/SPEC.md#open-blockers-and-residue`](../../../../../spec/SPEC.md#open-blockers-and-residue).
