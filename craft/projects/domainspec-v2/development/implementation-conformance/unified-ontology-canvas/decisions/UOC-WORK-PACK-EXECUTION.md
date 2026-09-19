# Decision Gate: Unified Canvas Work Pack Execution Scope

- Decision ID: `UOC-WORK-PACK-EXECUTION-SCOPE`
- Timestamp: `2026-08-01T20:57:40-03:00`
- Status: `PASS`
- Decision question: Which single admissible Task Session route should replace
  the inadmissible request to execute the whole serial Work Pack at once?
- Selected option: `UOC-001-NEXT`
- Source of decision: direct user instruction, "go do next route, we can start everything and go until real blockers"
- Remaining blocker count: 0
- Admissibility request:
  `UOC-WORK-PACK-EXECUTION-OPTION-REQUEST.json`
- Admissibility receipt:
  `UOC-WORK-PACK-EXECUTION-ADMISSIBILITY-RECEIPT.json`

## Rejected Candidate

### `UOC-ALL-SERIAL` — Entire Work Pack in one Task Session

- Structural status: inadmissible.
- Reason: Task Session must resolve exactly one task/SWU. The Work Pack requires
  serial predecessor closeout and Invoke Refresh before a successor becomes
  eligible, and explicitly says a generic request to implement the plan must
  fail closed.
- Downstream impact: no product or Work Pack status mutation may begin from this
  request.

## Admissible Options

### `UOC-001-NEXT` — Select and execute SWU-UOC-001

- Kind: action.
- Benefit: starts with the dependency-free, reversible projection model and
  validator the Work Pack already recommends.
- Cost/risk: implements only the graph contract; it deliberately does not render
  the canvas yet.
- Speed: fastest valid route to executable evidence.
- Complexity: bounded to two planned `.mjs` files and exact source contracts.
- Maintenance: produces the predecessor receipt required before SWU-UOC-002 can
  become eligible.
- When to choose: when implementation should begin now.
- Downstream impact: triggers Context Builder and live Task Session preflight for
  exactly `SWU-UOC-001`; no successor is auto-selected.

### `UOC-DEFER` — Keep the Work Pack unchanged

- Kind: defer.
- Benefit: preserves planning evidence without product risk.
- Cost/risk: the unified canvas remains unimplemented.
- Speed: no implementation progress.
- Complexity and maintenance: none now.
- When to choose: when implementation timing or ownership is not settled.
- Downstream impact: `selected_swu=none` remains active.

### `UOC-STOP` — Stop this execution route

- Kind: stop.
- Benefit: closes the request without implying deferred execution is expected.
- Cost/risk: no implementation progress.
- Speed, complexity, and maintenance: none.
- When to choose: when the Work Pack should not be executed.
- Downstream impact: no Task Session continuation.

## Recommendation

The user selected `UOC-001-NEXT` and authorized the serial
`first-blocker-or-frontier-complete` route. `SWU-UOC-001` is the admitted first
selector. Every later successor still requires a fresh Task Session, joined
closeout receipt, and a fresh continuity cursor before the chain advances.

## Standing Context Choice

`Explain / more context` is available and does not resolve the decision.

## Mutation Boundary

This decision admits Context Builder compilation and live Task Session preflight
for `SWU-UOC-001`. It does not itself authorize product writes, Work Pack status
changes, Refresh mutation, Git actions, publication, or external effects; those
remain gated by their named owners and receipts.
