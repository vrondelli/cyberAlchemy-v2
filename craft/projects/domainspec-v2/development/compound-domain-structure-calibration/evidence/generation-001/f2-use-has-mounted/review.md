---
fixture_id: F2
generation: 001
review_state: approved
evaluation_state: not-run
---

# F2 useHasMounted Evidence Review

## Observed Boundary

The bounded specimen is a no-argument boolean hook. It passes a never-notifying
subscription, a client snapshot returning `true`, and a server snapshot
returning `false` to `useSyncExternalStore`. The local comment describes this
as a hydration-safe replacement for the former state-plus-effect idiom.

## Existing Explanation Set

| ID | Explanation |
| --- | --- |
| A-01 | An ordinary reactive helper explains the no-argument boolean wrapper. |
| A-02 | A contextual hydration-readiness role explains the local use of server/client snapshots. |
| A-03 | The framework `useSyncExternalStore` role and idiom explains subscription and snapshot delegation. |
| A-04 | Named-instance behavior explains the local helper name and exact functions. |

The receipt records the complete 4 x 4 predicate matrix. Every observable is
accounted for by at least one existing explanation; evaluation remains owned by
SWU-CDSC-006.

## Substitutions

- Permitted: inline the helper's exact return expression. The same subscription
  and snapshots are passed to the same framework hook.
- Breaking: swap the fixed client and server snapshot functions. Their literal
  return values show that the observed server/client boolean distinction flips.

## Uncertainty

The selector does not show callers or establish an independent lifecycle,
identity, portability, or compound kind. None is inferred.

## Review Boundary

This review freezes F2 evidence only. It makes no evaluation or promotion claim.
