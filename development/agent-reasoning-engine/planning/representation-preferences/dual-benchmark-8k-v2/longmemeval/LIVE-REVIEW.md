# Independent live diagnostic review

Approved for the exact freeze `702ff4cdb3686ca1896f78811468941eb9e2beb37834a71025ab2f6619c052e5`. This approves four development pairs, up to eight answers and eight native judgments, with two workers. It does not mark the campaign goal achieved.

All 770 source bindings and native continuity validation pass. The 35-file static import closure and continuity policy are included. Five focused offline tests pass; the reviewer made no provider calls. All eight recorded real tokenizer preflights pass, with maximum input plus output reserve 3,748 tokens.

Three pre-dispatch findings are resolved: capacity codes 1302/1305 now stop pair and judge work regardless of HTTP status; malformed truthy judge usage now triggers a health stop; missing continuity/import bindings are frozen. Already admitted bounded work may settle. Unknown spend retains reservations and prevents new judging or a success claim.

The fixed eight-answer denominator retains failures. Generation reserves at most 64,000 tokens and judging 58,880, for 122,880 total input plus output tokens, including known failed calls. Actual answer admission is at most 6,976 input plus 1,024 output; native judging uses at most 6,976 plus 384. The report includes each arm's generation and judge costs.

The intervention adds generic scope guidance to identical projected evidence. Gold and native rubric prompts are constructed only by the separate scorer after generation terminates. Judge prompts omit arm labels; exact yes/no parsing rejects ambiguous output.

## Open questions

This is one repetition on four exposed development tasks with a same-model judge. It cannot establish full-benchmark perfection, untouched-task generalization, or 15% cumulative savings against full-history ingestion. Those gates remain open under [LIVE-PROTOCOL.md](LIVE-PROTOCOL.md). Actual results and receipts require post-run review; no favorable outcome is assumed here.
