# W2 — Registered Provider

- Layer question: can the provider consume the locked context and emit independently recomputable existing proof evidence without a live TLA runtime?
- Task/SWU: `TASK-FMP2-003` / `SWU-FMP2-003`.
- Inputs: accepted W1 contracts/context and L0 classifier.
- Gate: fake-tool tests, accounting negatives, registry determinism, cleanup, full regression, postimage and receipts pass.
- Promotion evidence: one registered provider integration with no second lifecycle or receipt.
- Parallelization: none; the provider consumes W1 and precedes both corpus fixtures.
