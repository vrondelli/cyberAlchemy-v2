# Independent post-run review

Result integrity approved; the campaign target remains unachieved. The unchanged freeze `702ff4cdb3686ca1896f78811468941eb9e2beb37834a71025ab2f6619c052e5` and all 770 bindings verify.

All 16 model requests and receipts reconcile: eight answers plus eight native judgments, all HTTP 200 with complete output. Request hashes match persisted payloads and the fixed generation or sealed judge manifest. Every answer hash and opaque judge mapping matches one of eight assigned outcomes. No started model call lacks a receipt.

Total model input plus output is **24,451 tokens**: 21,943 generation and 2,508 judging, with no unknown reservations. This includes 439 reasoning tokens inside completion counts; cached input counters are zero. The largest measured input plus reserved output is 3,748; largest actual input plus output is 2,983. Every call meets the 8,000-token limit. Receipt intervals show exactly two concurrent requests in generation and judging; judging begins after all generation ends. These are local request intervals, not provider internal execution measurements.

| Arm | Correct / assigned | Generation | Judge | Total |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 3/4 | 10,898 | 1,366 | 12,264 |
| Scope | 4/4 | 11,045 | 1,142 | 12,187 |

Scope uses 147 more generation tokens. Including judges, it saves 77 tokens (0.63%), below the 15% target. The diagnostic criterion passes, but this same-evidence comparison does not measure cumulative savings against full-history ingestion.

The only correctness difference is abstention task `eeda8a6d_abs`. Previously failing preference task `32260d93` passes both arms, so this run cannot attribute its repair to the new policy. The corrected native observation is appropriately inconclusive with zero supporting count; the initial automatic classification is retained separately. No outcome-based policy changes were made by this reviewer.

## Open questions

One repetition on four exposed tasks and same-model judging cannot establish full-benchmark perfection, mechanism confirmation or untouched-task performance. Replication and full-task efficiency remain open under [LIVE-PROTOCOL.md](LIVE-PROTOCOL.md). Detailed evidence hashes and concurrency witnesses are in [LIVE-POSTRUN-REVIEW.json](LIVE-POSTRUN-REVIEW.json). No provider calls were made during review.
