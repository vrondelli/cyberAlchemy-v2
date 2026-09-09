# Invoke refresh report — readiness synchronization

## Result

- Spell / mode: `invoke` / `refresh`
- Mutation mode: `proposal-only`
- Phase status: `pass`
- Phase-status basis: the exact proposal is complete and has zero
  refresh-authoring blockers.
- Handoff status: `gated`
- Source signals: 7
- Target artifacts: 5
- Applied changes: none
- Claim ceiling: policy readiness only; no evaluator witness, implementation
  evidence, or reasoning-engine admission claim.

`TASK-ARE-READINESS-001` passed `G-ARE-POLICY`, and its four controlling
evidence digests match the terminal receipt. The current planning and Craft
surfaces still encode the earlier blocked state. The safe correction is exact:
complete the readiness task, resolve only the three policy blockers, and mark
`SWU-ARE-001` ready but still unauthorized.

## Refresh signals

| ID | Type | Claim | Safety | Targets |
|---|---|---|---|---|
| `RS-ARE-001` | `evidence_added` | The terminal readiness receipt and boundary review now evidence `G-ARE-POLICY`. | safe | Work Pack, readiness task, Craft ledger/view |
| `RS-ARE-002` | `blocker_resolved` | `BLK-ARE-APP-001` is closed by the versioned applicability policy. | safe | Work Pack, Craft ledger/view |
| `RS-ARE-003` | `blocker_resolved` | `BLK-ARE-CHAL-001` is closed by the versioned challenge-closure policy. | safe | Work Pack, Craft ledger/view |
| `RS-ARE-004` | `blocker_resolved` | `BLK-ARE-EFFECT-001` is closed by the test-only exact-effect policy. | safe | Work Pack, Craft ledger/view |
| `RS-ARE-005` | `status_changed` | The readiness task is complete and the selected evaluator/SWU frontier is ready-awaiting-explicit-authorization. | safe | Work Pack, readiness task |
| `RS-ARE-006` | `route_changed` | The next route changes from obtaining owner decisions to applying this refresh, then separately authorizing SWU execution. | needs_review | Work Pack, Craft ledger/view, continuation receipt |
| `RS-ARE-007` | `artifact_drift` | Planning and Craft surfaces contradict the terminal readiness receipt. | safe | all five target artifacts |

## Proposed delta summary

| Owner | Proposed change | Signals |
|---|---|---|
| Invoke refresh | Update `planning/WORK-PACK.md`: policy gate evidence, readiness row, selected evaluator/SWU state, three resolved policy blocker rows, and next move. Preserve `implementation_authorized: false`. | RS-001–RS-007 |
| Invoke refresh | Update `planning/work-pack/tasks/TASK-ARE-READINESS-001.md` from `blocking` to `completed`, linking the terminal receipt and boundary review. | RS-001, RS-005, RS-007 |
| Craft lifecycle owner | Update `.craft/ledger.yml`: add the terminal readiness receipt artifact, resolve only the three typed policy blockers, empty `active_blockers`, move the context gate from `block` to `pass`, and replace the stale next move. | RS-001–RS-004, RS-006, RS-007 |
| Craft lifecycle owner | Regenerate `.craft/index.json` from the updated ledger and refresh `CRAFT.md`; do not hand-edit the generated index. | RS-001–RS-007 |
| Continuation owner | Join the selected proposal route to this owner receipt, leaving apply and SWU execution as later routes. | RS-006 |

The exact field-level proposal is in
[`REFRESH-PATCH-PROPOSAL.md`](REFRESH-PATCH-PROPOSAL.md).

## Blockers by lifecycle scope

| ID | Scope | Owner | Status | Claim |
|---|---|---|---|---|
| `BLK-REFRESH-APPLY-001` | `apply-authorization` | human authorization | open | Proposal completion does not authorize target mutation. |
| `BLK-REFRESH-SWU-001` | `target-lifecycle` | Goal or Task Session owner | deferred | `SWU-ARE-001` execution requires a separately authorized route and fresh strict context. |
| `BLK-REFRESH-AUDIT-001` | `audit` | Invoke/Craft validators | deferred | After apply, validate planning links/statuses and the rebuilt Craft ledger/index/view. |

Refresh-authoring blocker count: **0**. The open apply and target-lifecycle
conditions gate the handoff but do not lower this complete proposal-only phase
from `pass`.

## Preserved residue

- `GAP-ARE-SEMANTIC-WITNESS` remains active: there is still no executable
  evaluator behavior.
- Artifact durability, incident readiness, rollout readiness, intent
  revision/inter-rater evidence, and anti-bias efficacy remain active gaps.
- L1–L3 tasks and promotion gates remain unchanged.
- No implementation, real effect, public mutation, canonical definition, or
  general engine claim is proposed.

## Validation

- Source receipt result and gate verdict reviewed: pass.
- Four controlling evidence digests recomputed and matched: pass.
- Explicit target inventory and pre-refresh digests captured: pass.
- Dispatch JSON schema/semantic validation: recorded in the terminal owner
  receipt.
- JSON parse and artifact-presence checks: recorded in the terminal owner
  receipt.
- Target pre-refresh digest invariance: recorded in the terminal owner receipt.

## Next route

Exact next route: `invoke:refresh:apply-approved`, with explicit authorization,
for the Invoke-owned planning delta plus a Craft lifecycle refresh for
`.craft/ledger.yml`, `.craft/index.json`, and `CRAFT.md`.

That apply route still does **not** authorize `SWU-ARE-001`. After successful
apply and validation, the continuation owner may offer either a bounded
`task-session:execute` for `SWU-ARE-001` or a separately approved
`goal:execute` for the dependency graph.
