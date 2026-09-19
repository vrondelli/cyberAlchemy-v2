# TASK-MTC-002 — Stage the Two Operation Dependency Rebinds

## SWU-MTC-002 — Semantic/admission rebind

- Primary behavior: create staged postimages that project BMC RQ1 and the current `reads` schema into stale RMT admission/relation evidence.
- Dependency: SWU-MTC-001.
- Live targets are read-only; exact baselines are in `WRITE-SCOPE-BASELINE.json`.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/2/write_scope`, including the three unit closeout receipts.
- Done: current schema digest/size bound, `reads` replaces stale `queries` only where RQ1 requires, focused positive/negative witnesses pass, unrelated delta zero.
- Split analysis: admission/inventory/validator and relation proof/test implement one semantic binding and share one acceptance boundary.

## SWU-MTC-003 — Provider request/replay rebind

- Primary behavior: create six staged postimages that close the FMP provider-contract identity transitively through the TypeScript, Python, and Rust binding JSONs, request, replay constants, and test identity.
- Dependency: SWU-MTC-002.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/3/write_scope`, including the three unit closeout receipts.
- Done: three binding JSON `provider_contract` refs bind `2ccde356a061d00bb25342009e164642c180e2baf816cfdf69db30cc007fdfae`; each binding self-hash and raw-file hash is regenerated; the request binds the three provider hashes and the three new binding-file hashes; request semantic digest, replay constants, lock and test identities are regenerated; all 109 refs close; focused replay/FMP tests pass; semantic parity/provider behavior delta remains zero.
- Split analysis: the three binding JSONs and the request/replay/test derived identities form one transitive hash closure; changing any subset cannot independently pass.

Both units stop before live apply and require renewed exact owner acceptance in the final candidate.
