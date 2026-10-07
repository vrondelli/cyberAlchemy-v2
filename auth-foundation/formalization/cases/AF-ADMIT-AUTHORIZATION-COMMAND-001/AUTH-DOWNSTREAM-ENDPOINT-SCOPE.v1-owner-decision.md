# Auth downstream authorization endpoint scope — owner decision

Status: owner-selected meaning for the accepted command-boundary rule; not an
implementation proof, FormalClaim admission, or runtime guarantee.

## Decision

For the accepted `BusinessMeaning:auth-foundation.admit-authorization-command-boundary`
no-call rule, “downstream authorization call” covers **every native
decision-producing Auth entrypoint**, not only the selected
`ResolvedDecisionService` adapter. This includes SQLite service, transaction,
and resolved-snapshot authorization; the runtime adapter and resolved engine;
and any generated authorization-policy kernel or equivalent native decision entrypoint
reachable from the selected public Auth request. The inventory is deliberately
open until source and dependency closure establishes its exact members.
The command-boundary admission evaluator is not downstream authorization: it
must execute to return READY or DENY. Read-only state resolution is likewise
not a decision entrypoint unless it enters authorization-policy logic.

Source of decision: product-owner reply in the active task on 2026-10-04,
“Every native decision entrypoint (recommended).” The previously accepted
[clarified BusinessMeaning](BUSINESS-MEANING.v1-clarified-accepted.json) supplies
the READY/DENY conditions and requires no downstream call on every other
normally evaluated in-scope context. This record specifies the quantified
endpoint family; it does not alter the READY predicate or assert that current
Rust code satisfies the rule.

## Options considered

| Option | Benefit | Cost and consequence |
| --- | --- | --- |
| Every native decision-producing entrypoint (selected) | Prevents a pre-READY SQLite or engine call from being hidden by a zero selected-adapter count. | Requires a full endpoint inventory and multi-crate API migration. |
| Selected service adapter only | Smaller local certificate. | Leaves the demonstrated pre-gate native bypass outside the no-call meaning. |

## Verification boundary

An endpoint call counts when its decision-producing function or trait method is
entered, even if it later returns DENY because of missing state or policy.
READY followed by downstream policy DENY is therefore still a permitted
post-READY call. A finite trace or one opaque token is not by itself evidence
that every reachable endpoint and normal path is covered. The candidate V4b
certificate remains `indeterminate` and `runtime_guarantees_observed: false`.

## Open Questions

- What exact source-derived endpoint and dynamic-dispatch inventory closes the
  broad family for the selected public Auth composition?
- How will legacy direct provider and adapter callers migrate without keeping
  an ungated native entrypoint reachable from the selected composition?
