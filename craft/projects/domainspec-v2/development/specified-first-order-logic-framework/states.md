---
module: specified-first-order-logic-framework
version: 0.2.0
status: approved-for-design
updatedAt: 2026-07-23
docType: states
---

# States

## Clause Lifecycle

| State | Entry Evidence | Allowed Next | Failure Result |
| --- | --- | --- | --- |
| AUTHORED | canonical node logic payload, ID, version, digest | PROJECTED | `SFOL_SOURCE_*` |
| PROJECTED | compatible graph, manifest, build, profile, node, and source-set handles | VALIDATED | `SFOL_PROJECTION_*` |
| VALIDATED | normalized structured AST and diagnostics | TYPED | `SFOL_VALIDATION_*` |
| TYPED | type judgment and profile eligibility | COUNTED, RESIDUE | `SFOL_TYPE_*` |
| COUNTED | independent denominator membership | CASED | `SFOL_DENOMINATOR_*` |
| CASED | exact pre-run TestCase membership | BOUND | `SFOL_CASE_*` |
| BOUND | exactly one role binding | OBSERVED | `SFOL_BINDING_*` |
| OBSERVED | immutable pure result or effect trace | EVALUATED | `SFOL_RUN_*` |
| EVALUATED | pass/fail/indeterminate evaluation | REPLAYED | `SFOL_EVAL_*` |
| REPLAYED | independent replay result | AGGREGATED | `SFOL_REPLAY_*` |
| RESIDUE | typed unsupported/deferred reason | AUTHORED after node/profile change | never counted as admitted completion |
| AGGREGATED | exact-set passing aggregate | terminal | `SFOL_AGGREGATE_*` |

### Invariants

| ID | Invariant |
| --- | --- |
| I1 | No state transition skips denominator comparison. |
| I2 | Observation happens only after exact binding. |
| I3 | Evaluation consumes raw observation and source logic, never target implementation helpers. |
| I4 | An admitted profile cannot aggregate RESIDUE or indeterminate members. |
| I5 | Repeated execution over identical handles is byte-stable. |
| I6 | Markdown, direct node-file traversal, and second-graph reconstruction cannot enter PROJECTED. |
