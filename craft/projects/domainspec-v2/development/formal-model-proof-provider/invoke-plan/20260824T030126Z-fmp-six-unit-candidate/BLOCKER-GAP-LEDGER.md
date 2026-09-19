# Blocker and Gap Ledger

## Blocking owner prerequisites

### `BLK-FMP2-FACTORY-MATERIAL-LOCK`

- Affects: exact-byte candidate acceptance and `SWU-FMP2-002`.
- Owner: architecture-conformance factory contract owner.
- Required decision: accept, reject, or revise the exact generic non-executable material and per-node execution-policy representation described in `OWNER-PREREQUISITE-REQUEST.md`.
- Why Plan cannot decide: the change is a shared factory contract and compatibility surface, not provider-local implementation latitude.
- Repair path: owner returns a digest-bound decision; any changed accepted contract regenerates the affected Plan bytes and validation; then an Invoke Refresh may project `selection-ready`.

### `BLK-FMP2-EXACT-PLAN-SUPERSESSION`

- Affects: canonical status of `WP-FMP-002` and retirement of `WP-FMP-001`.
- Owner: FMP Work Pack owner.
- Required decision: accept the exact candidate bytes and explicitly supersede the earlier eight-unit Plan.
- Current truth: `WP-FMP-001` remains operative, selection-ready, unselected, and unexecuted.

## Nonblocking residue

### `GAP-FMP2-EVF-ADAPTER`

The EVF-to-factory adapter is absent and belongs to the concurrent separate Invoke Design route. It does not block authoring this provider Plan, but it blocks any claim that EVF invokes FMP.

### `GAP-FMP2-TRACE-CONFORMANCE`

`WP-FMP-TRACE-001` remains a separate future Work Pack. No bounded model result establishes implementation trace conformance.

### `GAP-FMP2-CROSS-HOST`

The candidate is same-host only. Cross-host tool provisioning/equivalence is deferred because no current acceptance target requires it.

## Closed tensions

- Capability retained, lifecycle duplication removed.
- Bolina and Order Saga remain separate.
- `FreshnessSafety` remains expected-red.
- Closure is merged into terminal integration because it adds no product behavior.
