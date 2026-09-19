# Traceability — Requirements To Layers And Tasks

| Requirement family | Layer/task | Planned evidence |
| --- | --- | --- |
| `AUTH-001..006` | L0–L8, especially L0/L3/L5/L8 | authority-class and handle validators; immutable ProofContext; stale-digest controls; non-admitting receipts |
| `AUTH-007` | L0A → completed current-byte repair → validation-owner freeze → L0B | exact contract-publication and repair receipts; passing current verifier over immutable published digests; package-local freeze receipt still required; no L0A `ValidationReceipt` |
| `FORM-001..008` | L1 formation-v2 | 13 structures, 16 criteria, exact retirement/migration/compatibility, reason-specific negatives, preserved 001/003 |
| `GRAPH-001..007` | L2/L3/L4/L6 | successor source schemas/resolver, graph/manifest/build replay, relationship selections/catalogues |
| `GRAPH-008` / FPR-02 Decision 9 | L4/L5/L6 | exact 13-row node-pattern selection, canonical effect/removal delta, TestCase/mutation/receipt/replay evidence |
| `DERIVE-001..006` | L4/L5/L6 | independent freezes, deterministic O_gen, exact join, one TestCase per key, typed residue |
| `RUN-001..006` | L5/L6 | exact role bindings, independent evaluator, raw ExecutionResult, fresh reason-specific primary MutationResult |
| `EVID-001..006` | L3/L5/L6/L8 | separate BuildReceipt/ProofReceipt/ReplayResult/AggregateResult, exact replay-scope recomposition, planned aggregate commands |
| `CONS-001..005` | L7A/L7B/L8 | repaired IOLM parity contract/run/replay; Body War machine package/run/replay; exact same-core aggregate |
| `COMPAT-001..004` | all layers | frozen current v1, immutable 001/003, regression baselines, backend/UI independence |

## Decision 9 Exact Trace

```text
FPR-02 Resolved Decision 9
  -> DSV2-BTE-R-GRAPH-008
  -> DESIGN.md node-kind-causality@1 and causal proof selection
  -> L4 TASK-BTE-L4-CATALOGUES (13-row owner selection/freeze)
  -> L5 TASK-BTE-L5-PROOF-UNIT (one complete causal member)
  -> L6 TASK-BTE-L6-CORE (exact 13-row breadth)
  -> node-kind-causality ReplayResult scopes
  -> verify:bte:core AggregateResult
```

## Recomposition

```text
L0A contract publication
  -> completed exact-byte repair and passing current publication verification
  -> validation-owner red-manifest freeze
  -> L0B proof-primitive validation
  -> L1 formation-v2
  -> L2 successor sources
  -> L3 graph/build replay
  -> L4 independent exact catalogues/selections
  -> L5 one full proof unit
  -> L6 six-catalogue core
  -> [L7A IOLM || L7B Body War]
  -> L8 consumer + terminal aggregates
```

Every arrow consumes an exact validated receipt handle. A task/SWU status,
Markdown claim, Inventory row, or count cannot open the next layer.
