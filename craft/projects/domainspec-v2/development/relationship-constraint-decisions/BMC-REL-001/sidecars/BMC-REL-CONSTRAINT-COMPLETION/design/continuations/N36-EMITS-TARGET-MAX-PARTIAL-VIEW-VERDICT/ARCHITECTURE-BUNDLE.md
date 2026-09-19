# N36 Architecture Bundle

Decision: `BMC-REL-NONNUMERIC-36-EMITS-TARGET-MAX-PARTIAL-VIEW-VERDICT`

Selection: `null`. Recommendation: A. `authority_effect: none`.

## 1. Context View

Canonical emits counts distinct authored Entity-to-Event concept facts. The selected
target maximum is one. A visible second Entity subject is invalid immediately, but
an open view with zero or one visible subject may be missing another fact.

## 2. High-Level Structure View

Observed facts first pass through maximum-violation detection. A visible violation
fails under every action. If none is visible and closure is missing, A returns
not-evaluated; B returns an explicitly local observed-subgraph pass.

## 3. Low-Level Components View

The predicate is the count of distinct source Entity concept IDs incident through
canonical emits facts on one Event concept ID. Exact duplicates are already rejected.
Closure proof coordinates and runtime Event instances are not inputs to N36 beyond
the boolean condition that relevant closure is absent.

## 4. Workflow Process View

1. Bind N33, N34, numeric A, D02, canonical emits, and packet evidence.
2. Reject any visible target count above one.
3. If no violation is visible but relevant closure is absent, apply the selected N36
   verdict.
4. Present A/B/C/D and Explain.
5. Stop at the relationship decision owner.

## 5. Decision Flow View

- A: no whole-boundary verdict without relevant closure.
- B: pass only the observed subgraph, never the whole boundary.
- C: leave the verdict unresolved.
- D: terminate the route.

A is recommended because it makes the responsibility proof fail closed. B remains
admissible because its result is explicitly local and does not suppress observed
violations.

## 6. Dependency Interface View

Inputs are immutable decisions and canonical evidence. Outputs are Design-only gate
artifacts. The current packet enum is not used as semantic authority. N36 does not
define the closure manifest, update the packet/schema/validator, or affect runtime,
implementation, promotion, publication, or deployment.
