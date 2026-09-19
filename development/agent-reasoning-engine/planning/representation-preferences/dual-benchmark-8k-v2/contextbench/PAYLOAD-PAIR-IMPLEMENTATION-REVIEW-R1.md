# Public payload pair implementation review R1

Rejected pending one correctness fix; no live admission.

All five existing tests pass. An independent fixture with tokenizer input 5,440 produces exactly 8,000 including margin512 and output2048. The native driver rejects it at its stricter recycle threshold, and the helper incorrectly records `admission-correspondence` failure and skips the second condition. A valid known tokenizer measurement must remain measurable independently of native model admission. Add a boundary regression and preserve the stated diagnostic <=8K criterion.

The receipt-first codec approval remains intact. No providers, evaluator or exclusive generator ran. Exact prospective records, prompts and freeze remain a separate review.

## Open Questions

Owned by [PAYLOAD-PAIR-QUALIFICATION.md](PAYLOAD-PAIR-QUALIFICATION.md).
