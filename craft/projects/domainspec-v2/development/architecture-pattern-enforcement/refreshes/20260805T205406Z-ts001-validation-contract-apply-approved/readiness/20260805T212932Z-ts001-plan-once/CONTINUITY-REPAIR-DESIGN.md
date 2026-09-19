# Completion-Continuity Repair Design

## Decision

Do not seed `visited_units` with historical work. That array is the active outer loop's own Task Session completion history. Mixing prior receipts into it would advance the cursor but erase why those units are considered complete.

The safe repair is a producer-consumer contract:

1. Work-Pack Readiness validates the historical receipts as one exact leading frontier prefix and emits a digest-bound `completion_continuity` projection.
2. Implementation Readiness keeps that immutable prefix separate from new `visited_units` and computes its cursor from both histories.
3. The APE Work Pack gets a new immutable audit attempt whose corrected continuity bindings are validated by the repaired producer.

## Why an Implementation Readiness-only patch is insufficient

The current audit config freezes six completion receipts, but the audit code never evaluates the `continuity_projection` semantics. It does not prove the refs correspond to frontier units, are ordered, resolve `pass`, have joined closeout, or agree about the next unit.

The current APE `canonical_successor_ref` is also contradictory. It selects `/swus/6/successor`, which is `SWU-APE-ENUM-TS-001A`. The predecessor that proves the current successor is ONT006 at `/swus/5/successor`, whose value is `SWU-APE-ENUM-TS-001`.

Allowing the consumer to trust the present config would move the cursor for the right practical reason but from evidence the producer has not actually validated. That is too weak for automatic selection.

## State model

```text
historical completed prefix: ONT001 ... ONT006
active-loop visited units:   []
cursor:                      6 + 0
next frontier unit:          TS001
```

The completion-continuity digest becomes part of the policy, loop state, loop ID, execution-intent binding, and fresh-resume digest. A changed completion history therefore cannot reuse a selection intent or resume state from another history.

## Migration rule

Absence of continuity evidence must not mean “fresh Work Pack.” A fresh Work Pack must explicitly produce an all-pending continuity projection. Older audit configs lacking the new typed proof remain readable as historical evidence but are not executable through the repaired loop until refreshed.

## Scope and acceptance

The exact proposed files, diagnostic codes, gates, validation commands, and forbidden scope are machine-readable in `CONTINUITY-REPAIR-PACKAGE.json`.

This design is not authorization to edit public Arcanum. It is the exact scope expansion needed to remove the blocker without inventing a TS001 selection.
