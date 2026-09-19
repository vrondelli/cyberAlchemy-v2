# Populated-ledger qualification construction review R2

Approved for bounded construction. No tokenizer execution or model generation is admitted here.

All 22 exact R2 tests passed independently. All 2,928 rejected-R1 bindings are restored and unchanged. The additive R2 chain resolves both reasoning blockers: historical receipts remain separate provenance, and the full envelope includes the bound retained-reasoning reservation. Cache reuse revalidates that reservation and occurrence count. The tokenizer-only client has no model transport API.

The four actual donors were independently exercised offline through R2: 20 / 19 / 25 / 21 discovery requests, including 8 / 5 / 3 / 11 reasoning-bearing requests. All 85 requests preserved tools and non-ledger messages exactly. There were zero new model receipts or provider calls. Injected counts produced 18 / 17 / 23 / 19 visibly populated requests; these are not real-tokenizer fit results.

The review-time visibility gap is fixed: qualification and result binding now count only requests with included entries, requiring at least one per task. Source/receipt pins, fixed cohort, two workers, failure retention, storage checks, V2 routing and clean supervised settlement requirements remain intact.

## Open Questions

- Review an exact freeze and current storage/source admission before real tokenizer execution.
- Will every historical request fit with full reasoning reservations and a populated ledger on each task? Retain any failure honestly.
- A historical prompt qualification does not prove new model behavior, quality, causal benefit, 15% savings or untouched confirmation.

Exact source hashes are in [RECENT-EVIDENCE-POPULATED-QUALIFICATION-REVIEW-R2.json](RECENT-EVIDENCE-POPULATED-QUALIFICATION-REVIEW-R2.json).
