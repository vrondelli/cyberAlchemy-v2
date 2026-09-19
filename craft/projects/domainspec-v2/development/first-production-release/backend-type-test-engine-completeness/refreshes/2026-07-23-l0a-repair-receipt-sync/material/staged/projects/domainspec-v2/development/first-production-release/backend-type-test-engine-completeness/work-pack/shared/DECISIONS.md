# Planning Decisions And Boundaries

| ID | State | Decision | Plan consequence |
| --- | --- | --- | --- |
| `P-BTE-001` | accepted | Backend and UI are independent lanes. | No UI source, task, receipt, admission, or schedule dependency appears. |
| `P-BTE-002` | accepted | Successor profile identity remains `feature-with-independent-node-and-edge-files@1`. | Do not invent a third profile or widen current v1. |
| `P-BTE-003` | accepted | YAML-owned formation-v2 replaces current JSON constraints through exact retirement/migration/compatibility proof. | L1 precedes successor activation; current v1 stays byte-frozen. |
| `P-BTE-004` | accepted | Nodes and edges are independent canonical JSON source records with explicit same/cross-feature roots. | L2 owns versioned schemas/resolver; generated graph remains a read model. |
| `P-BTE-005` | accepted FPR-02 Decision 9 | Each of 13 node kinds needs an owner-selected causal pattern/effect/removal proof. | L4 freezes a 13-row selection; L5/L6 prove it. |
| `P-BTE-006` | accepted FPR-02 Decision 8 | Each exact admitted relationship family needs a causal composition/removal effect. | L4 freezes 16 rows; relationship admission gates L6 core. |
| `P-BTE-007` | accepted | Six catalogues remain distinct and compare by coverage key. | No count or one-denominator aggregate can close core. |
| `P-BTE-008` | accepted | TestCase, ExecutionResult, primary MutationResult, ProofReceipt, ReplayResult, and AggregateResult are separate objects. | L5/L6 require exact joins and independent replay. |
| `P-BTE-009` | accepted | IOLM and Body War are parallel downstream consumers. | Core has no consumer dependency; terminal needs both fresh replays. |
| `P-BTE-010` | Plan-owned path choice | Extend the existing engine under `src/bte/`, keep v2 source contracts under `impl/spec/minted-project/v2/`, and keep validation inputs outside engine write authority. | Concrete filenames/write scopes are fixed before Task Session. |
| `P-BTE-011` | superseded | One coherent L0 candidate owns proof primitives and non-admitting validation; red cases remain independently frozen. | Superseded because it required the validation owner to freeze cases against unpublished contracts. |
| `P-BTE-012` | accepted Decision Gate Option 1 | Split L0 contract publication from post-freeze semantic execution. | `SWU-BTE-L0A-001` publishes exact machine contracts and a closed diagnostic registry without a `ValidationReceipt`; the validation owner then freezes red inputs; `SWU-BTE-L0B-001` executes unchanged contracts against that freeze and emits the non-admitting `ValidationReceipt`. Evidence: `work-pack/session-evidence/SWU-BTE-L0-001/20260723T000729Z-context-route-conflict/decision-gate.json`. |
| `P-BTE-013` | completed evidence reconciliation and repair | Preserve the selected historical L0A pass receipt, repair only the exact source-byte drift, and route the independent validation owner after current proof passes. | `SWU-BTE-L0A-REPAIR-001` restored only the nine mismatching byte surfaces; historical evidence stayed unchanged and the current publication verifier passed twice. Evidence: `work-pack/session-evidence/SWU-BTE-L0A-REPAIR-001/20260723T100352Z-exact-byte-repair/execution-receipt.json` and `refreshes/2026-07-23-l0a-repair-receipt-sync/REFRESH-REPORT.md`. |

No row grants admission, implementation, catalogue freeze, release, or
production authority.
