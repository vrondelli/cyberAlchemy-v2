# Tokenizer attempt R1 review

Integrity approved; scientific classification is **inconclusive**. The fixed denominator remains 97 pairs, with 12 completed. Their measured inputs reconcile to 23,321 eager and 20,575 demand tokens. This incomplete subset establishes no cohort savings claim.

All 36 unique tokenizer attempts match their final entries in the 108-record lifecycle journal: 35 successful known measurements and one interrupted request with unknown result. Persisted rows agree with the final report. No model generation occurred. Exact sources and receipts are bound in [the review receipt](RECOVERY-TOKENIZER-R1-REVIEW.json).

Replaying only recorded measurements reproduces the first populated catalog failure at the sixth task-1 boundary: eight observations require 306 measured input tokens; the one-entry page with a continuation cursor still requires 295, exceeding the fixed 256-token page limit. Seven candidates were measured; the seven-entry candidate exceeded the byte limit before measurement. Smaller pages are not necessarily cheaper because a continuation cursor adds substantial representation overhead. This diagnoses page admission, not quality or demand effectiveness.

## Open Questions

A separately reviewed representation repair must preserve cursor correctness and original evidence while meeting actual token admission. Keep this failed attempt and unknown interrupted measurement; no automatic retry or threshold change is implied. See [the protocol](RECOVERY-TOKENIZER-PROTOCOL.md).
