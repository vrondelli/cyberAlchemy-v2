# TASK-MTC-002 — Stage the Two Operation Dependency Rebinds

## SWU-MTC-002 — Semantic/admission rebind

- Primary behavior: create staged postimages that project BMC RQ1 and the current `reads` schema into stale RMT admission/relation evidence.
- Dependency: SWU-MTC-001.
- Live targets are read-only; exact baselines are in `WRITE-SCOPE-BASELINE.json`.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/1/write_scope`, including the three unit closeout receipts.
- Done: current schema digest/size bound, `reads` replaces stale `queries` only where RQ1 requires, focused positive/negative witnesses pass, unrelated delta zero.
- Split analysis: admission/inventory/validator and relation proof/test implement one semantic binding and share one acceptance boundary.

## SWU-MTC-003 — Provider request/replay rebind

- Primary behavior: create the exact three staged postimages isolated by the FMP defect receipt.
- Dependency: SWU-MTC-002.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/2/write_scope`, including the three unit closeout receipts.
- Done: exactly three provider roles bind the current provider contract; request and lock identities are regenerated; 109 refs close; focused replay/FMP tests pass; unrelated delta zero.
- Split analysis: request, replay constants, and test expectations form one derived identity; changing any subset cannot independently pass.

Both units stop before live apply and require renewed exact owner acceptance in the final candidate.
