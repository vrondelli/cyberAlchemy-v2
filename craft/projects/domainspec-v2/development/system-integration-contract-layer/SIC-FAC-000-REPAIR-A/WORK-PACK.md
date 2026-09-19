# SIC-FAC-000 Generic-Factory Repair Work Pack — Option A

## Current state

The immutable predecessor Task Session ended `BLOCK`: the five core/test repairs were staged, but exact equality exposed 31 current provider/lock mismatches across nine active fixtures. The human owner then selected Option A, explicitly approving those exact 31 provider-evidence strings as the new nested fixture locks.

The predecessor receipt, audit, Decision Gate artifacts, and zero-change product inventory remain immutable inputs. This work pack creates a fresh candidate rather than reopening or rewriting that terminal evidence.

## Selected SWU

### SIC-FAC-000-R2-SWU-001 — apply and validate the exact 14-target candidate

- Status before execution: selected, not started
- Dependencies: prior terminal `BLOCK` receipt; exact 31-row audit; Decision Gate resolution; independent live-baseline audit; six staged patches; fixed-timeout guard files; immutable 549-entry product inventory
- Material frontier: exactly the 14 paths in `TASK-CONTRACT.md`
- Evidence frontier: only the declared fresh candidate execution-output roots and terminal receipts
- Lifecycle owner: `generic-factory-owner`

## Ordered execution

1. Validate the dispatch route, explicit Option A resolution, independent audit, current target baselines, and Inventory fallback.
2. Bind strict context, exact dependencies, six staged patches, expected post-apply hashes, and the validation runner.
3. Validate the Invoke material package and Refresh handoff.
4. Run fresh Task Session mutation admission immediately before product writes.
5. Recheck all 14 live baselines, then apply only the six admitted patches.
6. Recheck all 14 exact post-apply hashes.
7. Run the single declared validation command; it preserves the first failure and performs all child checks in the contract.
8. Reconcile generated evidence to declared execution-output roots.
9. Write `RESULT.json`, `OWNER-RECEIPT.json`, the receipt-backed closeout no-op, and the continuity cursor.
10. Write `TASK-SESSION-RECEIPT.json` last.

## Done criteria

- `mutation-admission-receipt.json` says `admit` and `mutationReady=true` for the exact live controls and 14 material targets.
- All six patches apply exactly once, producing the 14 expected target hashes.
- The validation runner reaches terminal `PASS` with no hidden or later-masked failure.
- The delegated read-only helper is joined and closed with zero writes.
- Product delta is exactly 14 paths; validation itself produces zero additional product drift.
- Closeout is recorded as a receipt-backed no-op and returns, but does not execute, the Revision 2 Refresh route.

## Failure policy

Any unmet or unavailable done criterion is acceptance-critical and makes this Task Session `BLOCK`. Do not raise the 70-second child timeout, rewrite provider claims, add a fifteenth target, rerun a failed acceptance attempt in place, or substitute a narrower fixture. Preserve the first failure and route a new candidate if repair is required.

## Ownership and exclusions

- `generic-factory-owner` owns the 14 product changes and candidate verdict.
- Task Session owns execution evidence and terminal receipts under this fresh candidate root.
- The prior `SIC-FAC-000` and `SIC-FAC-000-REPAIR-CANDIDATE` roots remain immutable.
- Inventory is discovery only and is not updated.
- System-integration contracts, SQLite/profile selection, reviewers, Revision 2 acceptance, promotion, publication, release, deployment, and production remain outside this SWU.
