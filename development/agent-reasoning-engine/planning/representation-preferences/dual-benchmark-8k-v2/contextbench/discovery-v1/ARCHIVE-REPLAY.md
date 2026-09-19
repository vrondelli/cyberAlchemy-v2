# Actual prompt shape replay

All **434 receipt-matched prompts accepted** the unchanged `projectHistory` prototype: 233 control and 201 treatment, with zero pairing/parser rejections. The replay verified input immutability, preservation of the exact user/system/developer message sequence, output pairing and exact byte reconciliation. No parser widening was needed.

| Measure | Control | Treatment |
|---|---:|---:|
| Accepted / total requests | 233 / 233 | 201 / 201 |
| Requests with removed history | 53 | 52 |
| Original message-array bytes | 1,502,279 | 1,382,086 |
| Retained message-array bytes | 1,348,989 | 1,180,194 |
| Removed message-array bytes | 153,290 | 201,892 |
| Removed bytes per request, median | 0 | 0 |
| Removed bytes per request, p95 | 4,684 | 6,086 |
| Removed bytes per request, maximum | 7,486 | 9,697 |
| Retained bytes per request, median | 5,384 | 5,698 |
| Retained bytes per request, p95 | 10,919 | 10,673 |

These are **UTF-8 stable JSON bytes, not tokens**. Removed bytes are 10.20%/14.61% of the original message arrays, or 6.87%/10.28% of full captured prompt bytes from the prior input attribution. The schemas remain untouched. Most requests already have at most two exchange groups or other protected material, so their median removal is zero. This static replay does not establish the required 15% cumulative model-token reduction.

## Evidence and scope

[archive-replay.mjs](archive-replay.mjs) uses [INPUT-ATTRIBUTION.json](../INPUT-ATTRIBUTION.json) to select the same 16 sealed arms: eight amended outcomes per arm. Native `bodyForReceipt` reconstructs each model/profile request and matches its exact dispatched receipt hash. Source hashes are checked before and after reading. [ARCHIVE-REPLAY.json](ARCHIVE-REPLAY.json) records every request's hash, source-result location, call index, status and byte diagnostics, plus input/code hashes and distributions. No source contents, path contents from messages or hidden reasoning text are emitted. Frozen archives were not changed; no provider or gold access occurred.

This demonstrates compatibility with the **actually observed** native message shapes, including tool histories that passed the prototype's complete-pair validation. It does not prove compatibility with every possible native execution or malformed transport. Separate synthetic tests cover multi-tool failed results, partial pending restoration, oversize pending content, plain assistant messages and injection text preserved as tool data.

## Protected pending caveat

This replay passes `pending=[]` because these requests were already dispatched. It cannot infer which exchange required protected first delivery at an earlier render boundary. It therefore does **not** establish pending first-delivery safety in a live integration. Likewise it supplies no correction/terminal protected indices or archive recovery references; their runtime bindings remain untested. The actual integrated projection may remove fewer bytes when those protections apply.

No shortened prompt was dispatched. No episode was resumed, no evidence was recovered, and no subsequent call/output cost, completion, native quality or 8K admission was measured. Request evolution can invalidate a static byte counterfactual. The full immutable archive remains the recovery authority, and projection alone does not implement its paging/recovery transport.

## Open Questions

Can integration supply correct pending and correction protections without erasing useful savings? Does a shorter history increase recovery calls or impair source comparisons? Can the unchanged archive be paged safely within 8K? These remain root-reviewed implementation and later evaluation tasks under [PLAN.md](PLAN.md), not conclusions of this replay.
