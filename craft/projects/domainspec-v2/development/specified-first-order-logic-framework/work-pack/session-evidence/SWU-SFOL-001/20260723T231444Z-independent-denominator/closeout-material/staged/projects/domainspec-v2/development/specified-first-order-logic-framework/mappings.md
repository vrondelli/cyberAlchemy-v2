---
module: specified-first-order-logic-framework
version: 0.2.0
status: approved-for-design
updatedAt: 2026-07-23
docType: mappings
---

# Mappings

## Canonical Node To Logic Module

| Source Form | Normalized Target | Constraint |
| --- | --- | --- |
| canonical graph node with admitted `domainspec-node-logic/v1` payload | one `NodeLogicEnvelope` | exact node, graph, manifest, build, profile, and source-set handles required |
| content-addressed node logic reference retained by the graph | one `NodeLogicEnvelope` | referenced artifact digest must match the source manifest and build receipt |
| Markdown, `Formal`/`Formula` cell, or fenced block | `SFOL_SOURCE_NONCANONICAL` | never parsed or promoted heuristically |
| canonical node without an admitted logic payload | typed `needs-formal` residue | never infer logic from `intent` or body prose |

## Binding Map

```text
(module_id, clause_id, case_id, role)
  -> exactly one
(binding_id, adapter_kind, module, symbol, argument_map, observation_map)
```

Bindings select targets. They do not own source meaning, fixture universes,
expected values, expected diagnostics, or acceptance.

## Observation Map

| Clause Kind | Required Observation |
| --- | --- |
| function definition | returned value or selected result field |
| predicate/invariant | value environment and returned/projected state |
| precondition | accepted/rejected invocation plus error observation |
| postcondition | pre-state, post-state, return, effects |
| transition | source state, event, target state, guards, effects |
| effect relation | ordered calls, writes, emissions, errors |

## Proof Join

One proof receipt joins:

```text
node and logic-module digests
  + graph/manifest/build/source-set handles
  + denominator member
  + typed AST digest
  + fixture/universe digest
  + TestCase digest
  + binding/runtime digest
  + raw observation digest
  + evaluation result digest
  + replay result
```

Every join uses stable IDs and compatible digests. Counts are diagnostic only.
