# Populated-ledger qualification review R1

Rejected for actual tokenizer qualification. Preserve R1 and repair additively.

All 15 offline tests pass and all four pinned donors load. However, those qualification tests mock `measureEnvelope` and miss two linked blockers:

1. The fresh client lacks the historical receipt provenance required for assistant reasoning retained in the replayed prompts. Actual transport rejects `unbound-retained-reasoning` before dispatch. This was independently reproduced on all four donors, with zero calls or receipts.
2. The qualifier's envelope equation omits retained reasoning reservation. Actual transport includes that reservation, so provenance must be repaired together with full envelope accounting.

The donors contain 20 / 19 / 25 / 21 discovery requests, of which 8 / 5 / 3 / 11 retain reasoning. The first such requests require reservations of 44 / 106 / 8 / 84 tokens. No reasoning text was exposed.

Use source-bound historical reasoning provenance separate from new-call receipt arrays, preserve the exact assistant messages, and include the reservation in the full envelope. Do not remove reasoning or count old model receipts as new qualification calls. Add actual transport tests with nonzero reservations and both window boundaries.

The source-pinned donor, ledger-only substitution, fixed cohort, guarded storage and process settlement controls are otherwise consistent with the bounded design. No live stage was prepared and no provider, model or evaluator was called during review.

## Open Questions

- Does an additive repair preserve historical reasoning authority and distinguish it from new transport accounting?
- Will all discovery requests fit with full reservations and at least one populated ledger per task?
- Exact live freeze/admission, model efficacy, perfect quality, savings and untouched confirmation remain unresolved.

Exact bindings are in [RECENT-EVIDENCE-POPULATED-QUALIFICATION-REVIEW-R1.json](RECENT-EVIDENCE-POPULATED-QUALIFICATION-REVIEW-R1.json).
