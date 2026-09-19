# H-L final donor/campaign review R1

Rejected for native composition. Preserve R1 and repair additively.

All three supplied tests pass, but all four actual historical donors fail native joining with `ranked-evidence.expected-index`. The donor constructs a flat `ranked_context`; the native evidence restorer requires `{expected, sources}`. The donor test checks the incorrect flat shape, and campaign tests mock qualification, hiding this failure.

Fix the context contract and add a real donor-to-native-join or terminal-packet regression for every task. Add fault coverage for cancellation, donor drift and persistence failure. Historical file pins and branch receipt slicing otherwise remain consistent; no scorer/gold or provider was called in this review.

## Open Questions

- Does the additive repair construct complete native terminal evidence for all four pinned donors?
- Do campaign failures preserve all rows/receipts, and does the later process/storage/freeze composition enforce exact admission?
- Fresh controls remain suspended; quality, savings and untouched confirmation remain unresolved.

Exact hashes are in [RECENT-EVIDENCE-FINAL-CAMPAIGN-REVIEW-R1.json](RECENT-EVIDENCE-FINAL-CAMPAIGN-REVIEW-R1.json).
