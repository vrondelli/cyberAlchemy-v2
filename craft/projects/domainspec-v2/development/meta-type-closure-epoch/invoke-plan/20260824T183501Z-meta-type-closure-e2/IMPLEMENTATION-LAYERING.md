# Implementation Layering — WP-MTC-001

## Target and Scope

- Target: all-13 DomainSpec v2 meta-type closure
- State: brownfield, substantially implemented, partially stale integration evidence
- Rule: preserve before repair; stage before apply; prove before claim

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether all 13 implementations can be preserved. | SWU-MTC-000, SWU-MTC-001 | exact path/hash/Git/predecessor freeze | all repairs | 13/13 baseline receipt, 372-byte cross-check |
| L1 | After this layer, we know whether the known Operation and Workflow drifts close without reimplementation. | SWU-MTC-002..004 | two staged Operation rebinds; D04 proof | full regression; admission | focused positive/negative results |
| L2 | After this layer, we know whether the integrated staged candidate is reliable. | SWU-MTC-005 | all-language, admission, parity, relation, registry, factory matrix | owner acceptance and apply | fail-fast command ledger with zero required failures |
| L3 | After this layer, we know whether the exact candidate is ready for protected review. | SWU-MTC-006 | manifest, inventory, ceiling, two requests | live apply, registration, promotion | candidate digest closure |

## Non-Regression Guardrails

- Existing implementation bytes stay unchanged unless an exact staged target is declared.
- Enum remains WP-RMT-001 evidence.
- APE profile findings remain outside core closure.
- Any candidate-byte change restarts freeze and validation.
- L3 is candidate readiness, not admission.

## Recommended Next Layer

L0 after exact Plan acceptance and proof-only readiness. Promotion beyond L3 requires a separate protected owner/apply route.

## @3 Layer Clarification

L0 includes the exact Rule newline-only predecessor overlay because the all-13 baseline cannot close against the current live formatting without it. L2 replaces only the stale Operation legacy-candidate check with a closure-specific composite; no historical receipt is rewritten and no semantic layer is added.
