# W3 — Exact Corpora

- Layer question: do both materially different corpora preserve their own complete meaning before live execution?
- Ordered tasks/SWUs: `TASK-FMP2-004` / `SWU-FMP2-004`, then `TASK-FMP2-005` / `SWU-FMP2-005`.
- Inputs: accepted provider decoder contract plus exact source locks.
- Gate after 004: Bolina attribution, 17-case denominator, M10 isolation, no source mutation.
- Gate after 005: Order Saga five-case denominator, exact mutants, `FreshnessSafety` still expected-red, no source mutation.
- Promotion evidence: two separate exact corpus receipts and postimages.
- Parallelization: intentionally serialized by the frozen frontier even though paths are disjoint; this preserves one-SWU admission/closeout and deterministic stop-on-blocker behavior.
